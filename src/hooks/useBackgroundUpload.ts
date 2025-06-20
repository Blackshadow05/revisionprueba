'use client';

import { useCallback } from 'react';
import { useUpload } from '@/context/UploadContext';
import { useToast } from '@/context/ToastContext';

export function useBackgroundUpload() {
  const { addToQueue, isServiceWorkerReady } = useUpload();
  const { showWarning } = useToast();

  const uploadFile = useCallback(async (
    file: File, 
    recordId: string, 
    fieldName: string
  ): Promise<string | null> => {
    if (!isServiceWorkerReady) {
      showWarning('Sistema de subida en segundo plano no disponible. Intenta recargar la página.');
      return null;
    }

    try {
      const uploadId = await addToQueue(file, recordId, fieldName);
      return uploadId;
    } catch (error) {
      console.error('Error agregando archivo a la cola:', error);
      return null;
    }
  }, [addToQueue, isServiceWorkerReady, showWarning]);

  const uploadMultipleFiles = useCallback(async (
    files: { file: File; recordId: string; fieldName: string }[]
  ): Promise<string[]> => {
    if (!isServiceWorkerReady) {
      showWarning('Sistema de subida en segundo plano no disponible. Intenta recargar la página.');
      return [];
    }

    const uploadIds: string[] = [];
    
    for (const { file, recordId, fieldName } of files) {
      try {
        const uploadId = await addToQueue(file, recordId, fieldName);
        uploadIds.push(uploadId);
      } catch (error) {
        console.error(`Error agregando ${file.name} a la cola:`, error);
      }
    }

    return uploadIds;
  }, [addToQueue, isServiceWorkerReady, showWarning]);

  return {
    uploadFile,
    uploadMultipleFiles,
    isReady: isServiceWorkerReady
  };
} 