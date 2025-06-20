const CACHE_NAME = 'revision-casitas-v1';
const DB_NAME = 'RevisionCasitasDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploadQueue';

// Abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Procesar cola de subidas
async function processUploadQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    
    const pendingUploads = await new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Procesar máximo 3 subidas simultáneas
    const activeUploads = pendingUploads.slice(0, 3);
    
    for (const upload of activeUploads) {
      uploadToImageKit(upload);
    }
  } catch (error) {
    console.error('Error procesando cola de subidas:', error);
  }
}

// Subir a ImageKit.io
async function uploadToImageKit(uploadItem) {
  try {
    // Actualizar estado a "uploading"
    await updateUploadStatus(uploadItem.id, 'uploading', { progress: 0 });
    
    // Obtener configuración de ImageKit.io desde el cliente
    const config = await getImageKitConfig();
    
    if (!config) {
      throw new Error('Configuración de ImageKit.io no disponible');
    }

    // Generar carpeta automática basada en fecha
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folderPath = `Evidencias/${year}-${month}`;

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = uploadItem.file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Preparar FormData para ImageKit.io
    const formData = new FormData();
    formData.append('file', uploadItem.file);
    formData.append('fileName', fileName);
    formData.append('folder', folderPath);
    formData.append('publicKey', config.publicKey);
    formData.append('signature', config.signature);
    formData.append('expire', config.expire);
    formData.append('token', config.token);

    const response = await fetch(config.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir imagen a ImageKit.io');
    }

    const data = await response.json();
    const finalUrl = data.url;

    // Actualizar Supabase
    await updateSupabaseRecord(uploadItem.recordId, uploadItem.fieldName, finalUrl);
    
    // Marcar como completado
    await updateUploadStatus(uploadItem.id, 'completed', { 
      url: finalUrl, 
      completedAt: new Date().toISOString() 
    });

    // Notificar a la aplicación
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPLOAD_COMPLETED',
          uploadId: uploadItem.id,
          url: finalUrl,
          recordId: uploadItem.recordId,
          fieldName: uploadItem.fieldName
        });
      });
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    
    // Incrementar intentos
    const retryCount = (uploadItem.retryCount || 0) + 1;
    const maxRetries = 3;
    
    if (retryCount < maxRetries) {
      // Programar reintento con backoff exponencial
      const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
      setTimeout(() => {
        updateUploadStatus(uploadItem.id, 'pending', { retryCount });
      }, delay);
    } else {
      // Marcar como error después de 3 intentos
      await updateUploadStatus(uploadItem.id, 'error', { 
        error: error.message,
        failedAt: new Date().toISOString()
      });
      
      // Notificar error
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPLOAD_ERROR',
            uploadId: uploadItem.id,
            error: error.message
          });
        });
      });
    }
  }
}

// Actualizar estado de subida
async function updateUploadStatus(id, status, additionalData = {}) {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  const request = store.get(id);
  request.onsuccess = () => {
    const upload = request.result;
    if (upload) {
      upload.status = status;
      upload.updatedAt = new Date().toISOString();
      Object.assign(upload, additionalData);
      store.put(upload);
    }
  };
}

// Actualizar registro en Supabase
async function updateSupabaseRecord(recordId, fieldName, url) {
  // Esta función será llamada desde el cliente principal
  // El SW no puede acceder directamente a Supabase por CORS
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_SUPABASE',
        recordId,
        fieldName,
        url
      });
    });
  });
}

// Obtener configuración de ImageKit.io desde el cliente
async function getImageKitConfig() {
  return new Promise((resolve) => {
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'GET_IMAGEKIT_CONFIG'
        });
        
        // Escuchar respuesta
        const messageHandler = (event) => {
          if (event.data.type === 'IMAGEKIT_CONFIG') {
            self.removeEventListener('message', messageHandler);
            resolve(event.data.config);
          }
        };
        
        self.addEventListener('message', messageHandler);
        
        // Timeout después de 5 segundos
        setTimeout(() => {
          self.removeEventListener('message', messageHandler);
          resolve(null);
        }, 5000);
      } else {
        resolve(null);
      }
    });
  });
}

// Event Listeners
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'ADD_TO_QUEUE':
      addToUploadQueue(data);
      break;
    case 'PROCESS_QUEUE':
      processUploadQueue();
      break;
    case 'GET_QUEUE_STATUS':
      getQueueStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Agregar a cola de subidas
async function addToUploadQueue(uploadData) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const uploadItem = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: uploadData.file,
      recordId: uploadData.recordId,
      fieldName: uploadData.fieldName,
      fileName: uploadData.fileName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      priority: uploadData.priority || 1 // Prioridad para ordenar
    };
    
    store.add(uploadItem);
    
    // Iniciar keep-alive si hay subidas pendientes
    startKeepAlive();
    
    // Procesar cola automáticamente
    setTimeout(() => processUploadQueue(), 100);
    
    // Registrar background sync si está disponible
    if ('serviceWorker' in self && 'sync' in self.registration) {
      try {
        await self.registration.sync.register('background-upload');
      } catch (error) {
        console.log('Background sync no disponible:', error);
      }
    }
    
  } catch (error) {
    console.error('Error agregando a cola:', error);
  }
}

// Obtener estado de la cola
async function getQueueStatus() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const all = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return {
      pending: all.filter(item => item.status === 'pending').length,
      uploading: all.filter(item => item.status === 'uploading').length,
      completed: all.filter(item => item.status === 'completed').length,
      error: all.filter(item => item.status === 'error').length,
      total: all.length
    };
  } catch (error) {
    console.error('Error obteniendo estado de cola:', error);
    return { pending: 0, uploading: 0, completed: 0, error: 0, total: 0 };
  }
}

// Procesar cola periódicamente
setInterval(() => {
  processUploadQueue();
}, 30000); // Cada 30 segundos

// Mantener el Service Worker activo
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-upload') {
    event.waitUntil(processUploadQueue());
  }
});

// Procesar cola cuando el SW se activa
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      processUploadQueue() // Procesar cola pendiente al activarse
    ])
  );
});

// Mantener SW vivo con mensajes periódicos
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) return;
  
  keepAliveInterval = setInterval(() => {
    // Enviar mensaje a todos los clientes para mantener conexión
    self.clients.matchAll().then(clients => {
      if (clients.length === 0) {
        // No hay clientes, pero seguir procesando cola
        processUploadQueue();
      }
    });
  }, 25000); // Cada 25 segundos
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Iniciar keep-alive cuando hay subidas pendientes
async function checkAndStartKeepAlive() {
  const status = await getQueueStatus();
  if (status.pending > 0 || status.uploading > 0) {
    startKeepAlive();
  } else {
    stopKeepAlive();
  }
}

// Verificar keep-alive periódicamente
setInterval(checkAndStartKeepAlive, 60000); // Cada minuto 