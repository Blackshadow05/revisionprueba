import { useState, useCallback } from 'react';
import { uploadToImageKit, uploadMultipleToImageKit } from '@/lib/imagekit';

interface UploadState {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export function useDirectImageKitUpload() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Función para subir un solo archivo
  const uploadSingleFile = useCallback(async (
    file: File,
    type: 'evidencias' | 'notas' = 'evidencias'
  ): Promise<string> => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Agregar upload al estado
    const newUpload: UploadState = {
      id: uploadId,
      file,
      status: 'pending',
      progress: 0
    };
    
    setUploads(prev => [...prev, newUpload]);
    setIsUploading(true);

    try {
      // Actualizar estado a uploading
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'uploading', progress: 10 }
          : upload
      ));

      // Subir archivo
      const url = await uploadToImageKit(file, type);

      // Actualizar estado a completed
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'completed', progress: 100, url }
          : upload
      ));

      return url;

    } catch (error: any) {
      // Actualizar estado a error
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'error', error: error.message }
          : upload
      ));
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Función para subir múltiples archivos
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    type: 'evidencias' | 'notas' = 'evidencias'
  ): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    
    // Crear estados iniciales para todos los archivos
    const newUploads: UploadState[] = files.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file,
      status: 'pending',
      progress: 0
    }));

    setUploads(prev => [...prev, ...newUploads]);

    try {
      const urls: string[] = [];

      // Subir archivos uno por uno
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        try {
          // Actualizar estado a uploading
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, status: 'uploading', progress: 25 }
              : upload
          ));

          // Subir archivo
          const url = await uploadToImageKit(file, type);
          urls.push(url);

          // Actualizar estado a completed
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, status: 'completed', progress: 100, url }
              : upload
          ));

        } catch (error: any) {
          // Actualizar estado a error
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, status: 'error', error: error.message }
              : upload
          ));
          
          console.error(`Error subiendo ${file.name}:`, error);
          // Continuar con los demás archivos
        }
      }

      return urls;

    } finally {
      setIsUploading(false);
    }
  }, []);

  // Función para limpiar uploads completados
  const clearCompletedUploads = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed' && upload.status !== 'error'
    ));
  }, []);

  // Función para limpiar todos los uploads
  const clearAllUploads = useCallback(() => {
    setUploads([]);
  }, []);

  // Función para reintentar upload fallido
  const retryUpload = useCallback(async (uploadId: string, type: 'evidencias' | 'notas' = 'evidencias') => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status !== 'error') return;

    try {
      // Resetear estado
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, status: 'uploading', progress: 10, error: undefined }
          : u
      ));

      // Reintentar subida
      const url = await uploadToImageKit(upload.file, type);

      // Actualizar estado a completed
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, status: 'completed', progress: 100, url }
          : u
      ));

      return url;

    } catch (error: any) {
      // Actualizar estado a error
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, status: 'error', error: error.message }
          : u
      ));
      
      throw error;
    }
  }, [uploads]);

  // Estadísticas de uploads
  const uploadStats = {
    total: uploads.length,
    pending: uploads.filter(u => u.status === 'pending').length,
    uploading: uploads.filter(u => u.status === 'uploading').length,
    completed: uploads.filter(u => u.status === 'completed').length,
    failed: uploads.filter(u => u.status === 'error').length,
    progress: uploads.length > 0 
      ? uploads.reduce((acc, upload) => acc + upload.progress, 0) / uploads.length 
      : 0
  };

  return {
    uploads,
    isUploading,
    uploadStats,
    uploadSingleFile,
    uploadMultipleFiles,
    clearCompletedUploads,
    clearAllUploads,
    retryUpload
  };
} 