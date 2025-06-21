'use client';

import { useState, useCallback } from 'react';
import { getWeek } from 'date-fns';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function useDirectCloudinaryUpload() {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const uploadId = `${file.name}_${Date.now()}`;
    
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }
    }));

    try {
      // Generar folder con fecha y semana
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const week = `semana_${getWeek(now, { weekStartsOn: 1 })}`;
      const folder = `prueba-imagenes/${month}/${week}`;

      // Preparar FormData - Usar preset básico sin transformaciones
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('cloud_name', 'dhd61lan4');
      formData.append('folder', folder);

      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 50
        }
      }));

      // Subir a Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dhd61lan4/image/upload', {
        method: 'POST',
        body: formData
      });

      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 90
        }
      }));

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Agregar optimizaciones automáticas f_auto,q_auto a la URL
      const originalUrl = data.secure_url;
      const optimizedUrl = originalUrl.replace('/upload/', '/upload/f_auto,q_auto/');

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
      
      // Subir archivos secuencialmente para evitar saturar
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
      uploading: uploadList.filter(u => u.status === 'uploading').length,
      completed: uploadList.filter(u => u.status === 'completed').length,
      error: uploadList.filter(u => u.status === 'error').length
    };
  }, [uploads]);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploads: Object.values(uploads),
    isUploading,
    getUploadStats
  };
} 