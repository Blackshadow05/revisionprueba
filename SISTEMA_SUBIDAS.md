# Sistema de Subidas en Segundo Plano

## 🚀 Características Implementadas

### ✅ **Subida Asíncrona**
- Las imágenes se suben en segundo plano usando Service Workers
- El usuario puede continuar navegando sin esperar
- Las subidas continúan incluso si se cambia de pestaña o se minimiza el navegador

### ✅ **Persistencia**
- Cola de subidas almacenada en IndexedDB
- Las subidas pendientes sobreviven a recargas del navegador
- Reintentos automáticos con backoff exponencial

### ✅ **Interfaz de Usuario**
- **Indicador flotante**: Muestra el estado de las subidas en tiempo real
- **Página de monitoreo**: `/subidas-pendientes` para ver todas las subidas
- **Notificaciones toast**: Feedback inmediato de éxito/error
- **Estados visuales**: Pendiente, subiendo, completado, error

### ✅ **Gestión de Errores**
- Reintentos automáticos (máximo 3 intentos)
- Manejo de errores de red
- Botón de reintento manual para errores persistentes

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Formulario    │───▶│  Service Worker  │───▶│   Cloudinary    │
│                 │    │                  │    │                 │
│ - Selecciona    │    │ - Cola IndexedDB │    │ - Almacena      │
│   imágenes      │    │ - Subida async   │    │   imágenes      │
│ - Guarda form   │    │ - Reintentos     │    │ - URLs finales  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Supabase     │◀───│   Notificaciones │◀───│  Actualización  │
│                 │    │                  │    │                 │
│ - Registro con  │    │ - Toast success  │    │ - URL en campo  │
│   URLs vacías   │    │ - Toast error    │    │   evidencia_XX  │
│ - Actualización │    │ - Indicadores    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📱 Componentes Principales

### 1. **Service Worker** (`/public/sw.js`)
- Maneja la cola de subidas en IndexedDB
- Procesa máximo 3 subidas simultáneas
- Implementa reintentos con backoff exponencial
- Se ejecuta en segundo plano independiente

### 2. **UploadContext** (`/src/context/UploadContext.tsx`)
- Estado global de las subidas
- Comunicación con Service Worker
- Actualización de registros en Supabase

### 3. **UploadIndicator** (`/src/components/UploadIndicator.tsx`)
- Indicador flotante en esquina inferior derecha
- Expandible para ver detalles
- Link a página completa de monitoreo

### 4. **Página de Monitoreo** (`/src/app/subidas-pendientes/page.tsx`)
- Vista completa de todas las subidas
- Estadísticas en tiempo real
- Botones de reintento y limpieza

### 5. **Sistema de Notificaciones** (`/src/context/ToastContext.tsx`)
- Notificaciones toast no intrusivas
- Diferentes tipos: success, error, info, warning
- Auto-dismiss configurable

## 🔄 Flujo de Trabajo

### 1. **Usuario llena formulario**
```typescript
// El usuario selecciona imágenes
handleFileChange('evidencia_01', file);
```

### 2. **Envío del formulario**
```typescript
// Se guarda el registro en Supabase con URLs vacías
const { data } = await supabase.from('revisiones_casitas').insert([...]).select();

// Se agregan las imágenes a la cola
await uploadMultipleFiles([
  { file: evidencia_01, recordId: data[0].id, fieldName: 'evidencia_01' }
]);
```

### 3. **Service Worker procesa**
```javascript
// Subida a Cloudinary
const response = await fetch('https://api.cloudinary.com/v1_1/dhd61lan4/image/upload', {
  method: 'POST',
  body: formData
});

// Actualización en Supabase
await updateSupabaseRecord(recordId, fieldName, cloudinaryUrl);
```

### 4. **Notificación al usuario**
```typescript
// Toast de éxito
showSuccess(`Imagen "${fileName}" subida exitosamente`);
```

## 🎯 Beneficios

### **Para el Usuario**
- ✅ **Experiencia fluida**: No esperar subidas lentas
- ✅ **Navegación libre**: Usar la app mientras suben imágenes
- ✅ **Feedback visual**: Saber el estado de cada subida
- ✅ **Confiabilidad**: Reintentos automáticos

### **Para el Sistema**
- ✅ **Eficiencia**: Máximo 3 subidas simultáneas
- ✅ **Robustez**: Manejo de errores y reconexión
- ✅ **Escalabilidad**: Cola persistente en IndexedDB
- ✅ **Monitoreo**: Visibilidad completa del proceso

## 🛠️ Configuración

### **Service Worker**
```javascript
// Registrado automáticamente en UploadContext
navigator.serviceWorker.register('/sw.js');
```

### **Next.js Config**
```javascript
// Headers para Service Worker
async headers() {
  return [{
    source: '/sw.js',
    headers: [
      { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      { key: 'Service-Worker-Allowed', value: '/' }
    ]
  }];
}
```

## 📊 Estados de Subida

| Estado | Descripción | Color | Acción |
|--------|-------------|-------|--------|
| `pending` | En cola esperando | 🟡 Amarillo | Automático |
| `uploading` | Subiendo a Cloudinary | 🔵 Azul | En progreso |
| `completed` | Subida exitosa | 🟢 Verde | Ver imagen |
| `error` | Error en subida | 🔴 Rojo | Reintentar |

## 🔧 Uso en Desarrollo

### **Hook personalizado**
```typescript
import { useBackgroundUpload } from '@/hooks/useBackgroundUpload';

const { uploadFile, uploadMultipleFiles, isReady } = useBackgroundUpload();

// Subir un archivo
await uploadFile(file, recordId, 'evidencia_01');

// Subir múltiples archivos
await uploadMultipleFiles([
  { file: file1, recordId, fieldName: 'evidencia_01' },
  { file: file2, recordId, fieldName: 'evidencia_02' }
]);
```

### **Notificaciones**
```typescript
import { useToast } from '@/context/ToastContext';

const { showSuccess, showError, showInfo, showWarning } = useToast();

showSuccess('Operación exitosa');
showError('Error en la operación');
```

## 🔄 **NUEVAS MEJORAS IMPLEMENTADAS**

### ✅ **Persistencia Robusta**
- **localStorage backup**: Estado guardado incluso si se cierra el navegador
- **Recuperación automática**: Modal al volver a abrir la app
- **Sincronización inteligente**: Detecta reconexión y reanuda subidas

### ✅ **Detección de Estado**
- **Conexión offline/online**: Pausa y reanuda automáticamente
- **Visibilidad de página**: Procesa cola cuando vuelve el foco
- **Service Worker keep-alive**: Mantiene activo mientras hay subidas

### ✅ **Experiencia Mejorada**
- **Modal de recuperación**: Muestra subidas pendientes al volver
- **Indicadores visuales**: Diferencia entre subidas actuales y recuperadas
- **Notificaciones contextuales**: Feedback sobre reconexión y estado

## 🚀 Próximas Mejoras

- [ ] **Compresión inteligente**: Solo en dispositivos con buena batería
- [ ] **Priorización**: Subir primero las imágenes más importantes
- [ ] **Progreso granular**: Barra de progreso por archivo
- [ ] **Límites de tamaño**: Validación antes de agregar a cola
- [ ] **Sincronización en background**: Push notifications cuando completen

## 🐛 Solución de Problemas

### **Service Worker no se registra**
1. Verificar que `/public/sw.js` existe
2. Comprobar configuración en `next.config.js`
3. Revisar consola del navegador

### **Subidas no se procesan**
1. Verificar IndexedDB en DevTools
2. Comprobar estado del Service Worker
3. Revisar logs en consola

### **Notificaciones no aparecen**
1. Verificar que `ToastProvider` envuelve la app
2. Comprobar z-index de elementos
3. Revisar errores en contexto

---

**¡El sistema está listo para usar!** 🎉 