'use client';

import { useState, useCallback } from 'react';
import { OptimizedImageCompressor } from '@/lib/imageCompressionOptimized';
import { getWeek } from 'date-fns';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'checking' | 'compressing' | 'uploading' | 'completed' | 'error';
  stage?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  processingTime?: number;
  deviceInfo?: any;
  error?: string;
  warning?: string;
}

export function useOptimizedUpload() {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // Inicializar información del dispositivo
  const initializeDevice = useCallback(() => {
    if (!deviceInfo) {
      const info = OptimizedImageCompressor.getDeviceInfo();
      setDeviceInfo(info);
      return info;
    }
    return deviceInfo;
  }, [deviceInfo]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const uploadId = `${file.name}_${Date.now()}`;
    const device = initializeDevice();
    
    // Verificar compatibilidad del archivo
    const { canHandle, reason } = OptimizedImageCompressor.canHandleFile(file);
    
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        fileName: file.name,
        progress: 0,
        status: 'checking',
        stage: 'Verificando compatibilidad...',
        warning: !canHandle ? reason : 
                 (device.isLowEnd && file.size > 5 * 1024 * 1024) ? 
                 'Archivo grande - puede tomar más tiempo' : undefined
      }
    }));

    if (!canHandle) {
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'error',
          error: reason || 'Archivo no compatible'
        }
      }));
      throw new Error(reason || 'Archivo no compatible');
    }

    try {
      // 1. Comprimir imagen con optimizaciones para el dispositivo
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'compressing',
          stage: 'Iniciando compresión...'
        }
      }));

      const result = await OptimizedImageCompressor.compressWithBreaks(
        file,
        (progress, stage) => {
          setUploads(prev => ({
            ...prev,
            [uploadId]: {
              ...prev[uploadId],
              progress: Math.round(progress * 0.7), // 70% para compresión
              stage
            }
          }));
        }
      );
      
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 70,
          status: 'uploading',
          stage: 'Preparando subida...',
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
          processingTime: result.processingTime,
          deviceInfo: result.deviceInfo
        }
      }));

      // 2. Subir a ImageKit.io con organización automática
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 75,
          stage: 'Subiendo a ImageKit.io...'
        }
      }));

      // Importar dinámicamente para evitar problemas de SSR
      const { uploadToImageKitClient } = await import('@/lib/imagekit-client');
      
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 90,
          stage: 'Procesando en ImageKit.io...'
        }
      }));

      // Subir a ImageKit.io (se organiza automáticamente por carpetas)
      const optimizedUrl = await uploadToImageKitClient(result.file, 'evidencias');

      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 100,
          status: 'completed',
          stage: 'Completado'
        }
      }));

      // Limpiar después de 3 segundos (más tiempo en gama baja)
      const cleanupDelay = device.isLowEnd ? 5000 : 3000;
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = { ...prev };
          delete newUploads[uploadId];
          return newUploads;
        });
      }, cleanupDelay);

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

      // Limpiar errores después de más tiempo en gama baja
      const errorDelay = device.isLowEnd ? 8000 : 5000;
      setTimeout(() => {
        setUploads(prev => {
          const newUploads = { ...prev };
          delete newUploads[uploadId];
          return newUploads;
        });
      }, errorDelay);

      throw error;
    }
  }, [initializeDevice]);

  const uploadMultipleFiles = useCallback(async (
    files: { file: File; recordId: string; fieldName: string }[]
  ): Promise<void> => {
    setIsUploading(true);
    const device = initializeDevice();
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Para dispositivos de gama baja, procesar de uno en uno
      // Para gama alta, permitir hasta 2 simultáneos
      const maxConcurrent = device.isLowEnd ? 1 : 2;
      
      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);
        
        const promises = batch.map(async ({ file, recordId, fieldName }) => {
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
        });

        await Promise.all(promises);
        
        // Pausa entre lotes para dispositivos de gama baja
        if (device.isLowEnd && i + maxConcurrent < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setIsUploading(false);
      
      // Limpiar memoria en dispositivos de gama baja
      if (device.isLowEnd) {
        OptimizedImageCompressor.cleanup();
      }
    }
  }, [uploadFile, initializeDevice]);

  const getUploadStats = useCallback(() => {
    const uploadList = Object.values(uploads);
    return {
      total: uploadList.length,
      checking: uploadList.filter(u => u.status === 'checking').length,
      compressing: uploadList.filter(u => u.status === 'compressing').length,
      uploading: uploadList.filter(u => u.status === 'uploading').length,
      completed: uploadList.filter(u => u.status === 'completed').length,
      error: uploadList.filter(u => u.status === 'error').length,
      warnings: uploadList.filter(u => u.warning).length
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

  const getDeviceRecommendations = useCallback(() => {
    const device = initializeDevice();
    
    if (device.isLowEnd) {
      return [
        '⚠️ Dispositivo de gama baja detectado',
        '🔋 Evita subir múltiples imágenes seguidas',
        '📏 Mantén las imágenes bajo 10MB',
        '⏱️ El procesamiento será más lento para evitar calentamiento'
      ];
    } else if (device.performanceLevel === 'high') {
      return [
        '🚀 Dispositivo de alto rendimiento',
        '⚡ Puedes subir múltiples imágenes simultáneamente',
        '🎯 Configuración de alta calidad disponible'
      ];
    } else {
      return [
        '⚡ Dispositivo de rendimiento medio',
        '✅ Buen balance entre velocidad y calidad',
        '📊 Configuración optimizada automáticamente'
      ];
    }
  }, [initializeDevice]);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploads: Object.values(uploads),
    isUploading,
    getUploadStats,
    clearCompleted,
    deviceInfo,
    getDeviceRecommendations
  };
} 