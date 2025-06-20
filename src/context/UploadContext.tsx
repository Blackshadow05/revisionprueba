'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { UploadPersistence } from '@/utils/uploadPersistence';

interface UploadItem {
  id: string;
  fileName: string;
  recordId: string;
  fieldName: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
  retryCount?: number;
}

interface QueueStatus {
  pending: number;
  uploading: number;
  completed: number;
  error: number;
  total: number;
}

interface UploadContextType {
  uploads: UploadItem[];
  queueStatus: QueueStatus;
  addToQueue: (file: File, recordId: string, fieldName: string) => Promise<string>;
  retryUpload: (uploadId: string) => void;
  clearCompleted: () => void;
  isServiceWorkerReady: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess, showError, showInfo } = useToast();
  const { isOnline, wasOffline } = useConnectionStatus();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    uploading: 0,
    completed: 0,
    error: 0,
    total: 0
  });
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [serviceWorker, setServiceWorker] = useState<ServiceWorker | null>(null);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
          setServiceWorker(registration.active || registration.waiting || registration.installing);
          setIsServiceWorkerReady(true);
          
          // Escuchar actualizaciones del SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  setServiceWorker(newWorker);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error);
        });

      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Manejar mensajes del Service Worker
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, uploadId, url, recordId, fieldName, error } = event.data;

    switch (type) {
      case 'UPLOAD_COMPLETED':
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'completed', url, completedAt: new Date().toISOString() }
            : upload
        ));
        updateQueueStatus();
        // Actualizar persistencia local
        UploadPersistence.markAsCompleted(uploadId);
        showSuccess(`Imagen "${uploads.find(u => u.id === uploadId)?.fileName}" subida exitosamente`);
        break;

      case 'UPLOAD_ERROR':
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'error', error }
            : upload
        ));
        updateQueueStatus();
        // Actualizar persistencia local
        UploadPersistence.markAsError(uploadId);
        showError(`Error subiendo "${uploads.find(u => u.id === uploadId)?.fileName}": ${error}`);
        break;

      case 'UPDATE_SUPABASE':
        updateSupabaseRecord(recordId, fieldName, url);
        break;
    }
  }, []);

  // Actualizar registro en Supabase
  const updateSupabaseRecord = async (recordId: string, fieldName: string, url: string) => {
    try {
      const { error } = await supabase
        .from('revisiones_casitas')
        .update({ [fieldName]: url })
        .eq('id', recordId);

      if (error) {
        console.error('Error actualizando Supabase:', error);
      } else {
        console.log(`Campo ${fieldName} actualizado en registro ${recordId}`);
      }
    } catch (error) {
      console.error('Error en updateSupabaseRecord:', error);
    }
  };

  // Agregar archivo a la cola
  const addToQueue = useCallback(async (file: File, recordId: string, fieldName: string): Promise<string> => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadItem: UploadItem = {
      id: uploadId,
      fileName: file.name,
      recordId,
      fieldName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    // Agregar a estado local
    setUploads(prev => {
      const newUploads = [...prev, uploadItem];
      // Guardar sesión en localStorage
      UploadPersistence.saveSession(newUploads);
      return newUploads;
    });

    // Enviar al Service Worker
    if (serviceWorker) {
      serviceWorker.postMessage({
        type: 'ADD_TO_QUEUE',
        data: {
          file,
          recordId,
          fieldName,
          fileName: file.name
        }
      });
      showInfo(`Imagen "${file.name}" agregada a la cola de subida`);
    } else {
      showError('Service Worker no disponible. La imagen no se pudo agregar a la cola.');
    }

    updateQueueStatus();
    return uploadId;
  }, [serviceWorker]);

  // Reintentar subida
  const retryUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, status: 'pending', error: undefined }
        : upload
    ));

    if (serviceWorker) {
      serviceWorker.postMessage({
        type: 'RETRY_UPLOAD',
        data: { uploadId }
      });
    }

    updateQueueStatus();
  }, [serviceWorker]);

  // Limpiar subidas completadas
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
    updateQueueStatus();
  }, []);

  // Actualizar estado de la cola
  const updateQueueStatus = useCallback(() => {
    setQueueStatus(prev => {
      const pending = uploads.filter(u => u.status === 'pending').length;
      const uploading = uploads.filter(u => u.status === 'uploading').length;
      const completed = uploads.filter(u => u.status === 'completed').length;
      const error = uploads.filter(u => u.status === 'error').length;
      
      return {
        pending,
        uploading,
        completed,
        error,
        total: uploads.length
      };
    });
  }, [uploads]);

  // Actualizar estado cuando cambien las subidas
  useEffect(() => {
    updateQueueStatus();
  }, [uploads, updateQueueStatus]);

  // Sincronizar con IndexedDB al cargar
  useEffect(() => {
    if (isServiceWorkerReady && serviceWorker) {
      // Obtener estado actual de la cola desde IndexedDB
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        const status = event.data;
        setQueueStatus(status);
      };

      serviceWorker.postMessage({
        type: 'GET_QUEUE_STATUS'
      }, [channel.port2]);
    }
  }, [isServiceWorkerReady, serviceWorker]);

  // Procesar cola cuando se reconecta o la app vuelve a estar activa
  useEffect(() => {
    if (isServiceWorkerReady && serviceWorker && isOnline) {
      // Procesar cola pendiente
      serviceWorker.postMessage({
        type: 'PROCESS_QUEUE'
      });
      
      // Actualizar estado de la cola
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        const status = event.data;
        setQueueStatus(status);
        
        if (status.pending > 0) {
          showInfo(`Procesando ${status.pending} subidas pendientes`);
        }
      };

      serviceWorker.postMessage({
        type: 'GET_QUEUE_STATUS'
      }, [channel.port2]);
    }
  }, [isOnline, isServiceWorkerReady, serviceWorker, showInfo]);

  // Mostrar estado de conexión
  useEffect(() => {
    if (!isOnline) {
      showError('Sin conexión a internet. Las subidas se reanudarán cuando se reconecte.');
    } else if (wasOffline) {
      showSuccess('Conexión restaurada. Reanudando subidas...');
    }
  }, [isOnline, wasOffline, showError, showSuccess]);

  const value: UploadContextType = {
    uploads,
    queueStatus,
    addToQueue,
    retryUpload,
    clearCompleted,
    isServiceWorkerReady
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload debe ser usado dentro de un UploadProvider');
  }
  return context;
} 