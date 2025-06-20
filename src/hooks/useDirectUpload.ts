'use client';

import { useState, useCallback } from 'react';
import { ImageCompressor } from '@/lib/imageCompression';
import { getWeek } from 'date-fns';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'completed' | 'error';
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
}

export function useDirectUpload() {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const uploadId = `${file.name}_${Date.now()}`;
    
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        fileName: file.name,
        progress: 0,
        status: 'compressing'
      }
    }));

    try {
      // 1. Comprimir imagen
      const { file: compressedFile, stats } = await ImageCompressor.compressAuto(file);
      
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 25,
          status: 'uploading',
          originalSize: stats.originalSize,
          compressedSize: stats.compressedSize,
          compressionRatio: stats.compressionRatio
        }
      }));

      // 2. Subir a ImageKit.io con organización automática
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 50
        }
      }));

      // Importar dinámicamente para evitar problemas de SSR
      const { uploadToImageKitClient } = await import('@/lib/imagekit-client');
      
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 90
        }
      }));

      // Subir a ImageKit.io (se organiza automáticamente por carpetas)
      const optimizedUrl = await uploadToImageKitClient(compressedFile, 'evidencias');

      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 100,
          status: 'completed'
        }
      }));

      // Limpiar después de 3 segundos
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = { ...prev };
          delete newUploads[uploadId];
          return newUploads;
        });
      }, 3000);

      return optimizedUrl;

    } catch (error) {
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'error',
          error: (error as Error).message
        }
      }));

      // Limpiar errores después de 5 segundos
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = { ...prev };
          delete newUploads[uploadId];
          return newUploads;
        });
      }, 5000);

      throw error;
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (
    files: { file: File; recordId: string; fieldName: string }[]
  ): Promise<void> => {
    setIsUploading(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Subir archivos secuencialmente para no saturar
      for (const { file, recordId, fieldName } of files) {
        try {
          const url = await uploadFile(file);
          
          // Actualizar Supabase inmediatamente
          const { error } = await supabase
            .from('revisiones_casitas')
            .update({ [fieldName]: url })
            .eq('id', recordId);

          if (error) {
            console.error(`Error actualizando ${fieldName}:`, error);
          }
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error);
          // Continuar con los siguientes archivos
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const getUploadStats = useCallback(() => {
    const uploadList = Object.values(uploads);
    return {
      total: uploadList.length,
      compressing: uploadList.filter(u => u.status === 'compressing').length,
      uploading: uploadList.filter(u => u.status === 'uploading').length,
      completed: uploadList.filter(u => u.status === 'completed').length,
      error: uploadList.filter(u => u.status === 'error').length
    };
  }, [uploads]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const newUploads: Record<string, UploadProgress> = {};
      Object.entries(prev).forEach(([key, upload]) => {
        if (upload.status !== 'completed') {
          newUploads[key] = upload;
        }
      });
      return newUploads;
    });
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploads: Object.values(uploads),
    isUploading,
    getUploadStats,
    clearCompleted
  };
} 