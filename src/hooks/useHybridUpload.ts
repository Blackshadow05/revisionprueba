'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDeviceDetection } from './useDeviceDetection';
import { useBackgroundUpload } from './useBackgroundUpload';
import { UppyUploader } from '@/lib/uppyUploader';
import { useToast } from '@/context/ToastContext';

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  method: 'uppy' | 'serviceWorker';
}

interface HybridUploadResult {
  uploadId: string;
  method: 'uppy' | 'serviceWorker';
}

export function useHybridUpload() {
  const { preferredUploadMethod, isMobile, browserName } = useDeviceDetection();
  const { uploadFile: swUploadFile, isReady: swReady } = useBackgroundUpload();
  const { showInfo, showSuccess, showError } = useToast();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  // Mostrar información del método detectado
  useEffect(() => {
    if (preferredUploadMethod) {
      const deviceType = isMobile ? 'móvil' : 'escritorio';
      const methodText = preferredUploadMethod === 'uppy' ? 'Uppy (resumible)' : 
                        preferredUploadMethod === 'hybrid' ? 'Híbrido' : 'Service Worker';
      
      console.log(`🚀 Método de subida: ${methodText} para ${deviceType} (${browserName})`);
    }
  }, [preferredUploadMethod, isMobile, browserName]);

  const uploadFile = useCallback(async (
    file: File,
    recordId: string,
    fieldName: string
  ): Promise<HybridUploadResult> => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determinar método a usar
    let method: 'uppy' | 'serviceWorker' = 'uppy';
    
    if (preferredUploadMethod === 'serviceWorker' && swReady) {
      method = 'serviceWorker';
    } else if (preferredUploadMethod === 'hybrid') {
      // En modo híbrido, usar SW si está disponible, sino Uppy
      method = swReady ? 'serviceWorker' : 'uppy';
    }

    // Agregar a estado local
    const uploadProgress: UploadProgress = {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      method
    };

    setUploads(prev => [...prev, uploadProgress]);

    try {
      if (method === 'serviceWorker') {
        // Usar Service Worker
        showInfo(`📱 Subiendo "${file.name}" en segundo plano`);
        await swUploadFile(file, recordId, fieldName);
        
        // El Service Worker manejará las actualizaciones de estado
        return { uploadId, method: 'serviceWorker' };
        
      } else {
        // Usar Uppy
        showInfo(`🚀 Subiendo "${file.name}" con Uppy (resumible)`);
        
        const url = await UppyUploader.uploadSingle(file, {
          onProgress: (progress) => {
            setUploads(prev => prev.map(upload => 
              upload.id === uploadId 
                ? { ...upload, progress, status: 'uploading' }
                : upload
            ));
          },
          onSuccess: (url) => {
            setUploads(prev => prev.map(upload => 
              upload.id === uploadId 
                ? { ...upload, progress: 100, status: 'completed', url }
                : upload
            ));
            showSuccess(`✅ "${file.name}" subida exitosamente`);
          },
          onError: (error) => {
            setUploads(prev => prev.map(upload => 
              upload.id === uploadId 
                ? { ...upload, status: 'error', error: error.message }
                : upload
            ));
            showError(`❌ Error subiendo "${file.name}": ${error.message}`);
          }
        });

        // Actualizar Supabase con la URL
        await updateSupabaseRecord(recordId, fieldName, url);
        
        return { uploadId, method: 'uppy' };
      }
    } catch (error) {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'error', error: (error as Error).message }
          : upload
      ));
      
      showError(`❌ Error subiendo "${file.name}": ${(error as Error).message}`);
      throw error;
    }
  }, [preferredUploadMethod, swReady, swUploadFile, showInfo, showSuccess, showError]);

  const uploadMultipleFiles = useCallback(async (
    files: { file: File; recordId: string; fieldName: string }[]
  ): Promise<HybridUploadResult[]> => {
    const results: HybridUploadResult[] = [];
    
    // Subir archivos secuencialmente para evitar saturar
    for (const { file, recordId, fieldName } of files) {
      try {
        const result = await uploadFile(file, recordId, fieldName);
        results.push(result);
      } catch (error) {
        console.error(`Error subiendo ${file.name}:`, error);
        // Continuar con los siguientes archivos
      }
    }
    
    return results;
  }, [uploadFile]);

  // Función auxiliar para actualizar Supabase (solo para Uppy)
  const updateSupabaseRecord = async (recordId: string, fieldName: string, url: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('revisiones_casitas')
        .update({ [fieldName]: url })
        .eq('id', recordId);

      if (error) {
        console.error('Error actualizando Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en updateSupabaseRecord:', error);
      throw error;
    }
  };

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  }, []);

  const retryUpload = useCallback(async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;

    setUploads(prev => prev.map(u => 
      u.id === uploadId 
        ? { ...u, status: 'pending', error: undefined, progress: 0 }
        : u
    ));

    // Aquí podrías implementar la lógica de reintento
    showInfo(`🔄 Reintentando subida de "${upload.fileName}"`);
  }, [uploads, showInfo]);

  const getUploadStats = useCallback(() => {
    const pending = uploads.filter(u => u.status === 'pending').length;
    const uploading = uploads.filter(u => u.status === 'uploading').length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const error = uploads.filter(u => u.status === 'error').length;
    
    return { pending, uploading, completed, error, total: uploads.length };
  }, [uploads]);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploads,
    clearCompleted,
    retryUpload,
    getUploadStats,
    preferredMethod: preferredUploadMethod,
    deviceInfo: { isMobile, browserName },
    isReady: preferredUploadMethod === 'uppy' || swReady
  };
} 