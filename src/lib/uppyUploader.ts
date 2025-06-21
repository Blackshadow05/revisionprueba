'use client';

import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { getWeek } from 'date-fns';

interface UppyUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class UppyUploader {
  private uppy: any;
  private options: UppyUploadOptions;

  constructor(options: UppyUploadOptions = {}) {
    this.options = options;
    this.uppy = this.createUppyInstance();
  }

  private createUppyInstance() {
    const uppy = new Uppy({
      autoProceed: false,
      allowMultipleUploads: true,
      restrictions: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['image/*'],
        maxNumberOfFiles: 1
      }
    });

    // Configurar XHR Upload para Cloudinary
    uppy.use(XHRUpload, {
      endpoint: 'https://api.cloudinary.com/v1_1/dhd61lan4/image/upload',
      method: 'POST',
      formData: true,
      fieldName: 'file',
      timeout: 60000, // 60 segundos
      limit: 1, // Una subida a la vez
      bundle: false
    });

    // Event listeners
    uppy.on('upload-progress', (file: any, progress: any) => {
      if (progress.bytesTotal) {
        const percentage = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);
        this.options.onProgress?.(percentage);
      }
    });

    uppy.on('upload-success', (file: any, response: any) => {
      try {
        const data = response.body;
        // Aplicar optimización automática a la URL
        const url = new URL(data.secure_url);
        url.pathname = url.pathname.replace('/upload/', '/upload/f_auto,q_auto/');
        this.options.onSuccess?.(url.toString());
      } catch (error) {
        console.error('Error processing Cloudinary response:', error);
        this.options.onError?.(new Error('Error processing upload response'));
      }
    });

    uppy.on('upload-error', (file: any, error: any) => {
      console.error('Uppy upload error:', error);
      this.options.onError?.(error);
    });

    uppy.on('complete', () => {
      this.options.onComplete?.();
    });

    return uppy;
  }

  async uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Generar folder con fecha y semana
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const week = `semana_${getWeek(now, { weekStartsOn: 1 })}`;
      const folder = `prueba-imagenes/${month}/${week}`;

      try {
        // Configurar metadata específica para este archivo
        const fileId = this.uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
          meta: {
            upload_preset: 'PruebaSubir',
            cloud_name: 'dhd61lan4',
            folder: folder
          }
        });

        // Configurar callbacks específicos para esta subida
        const onSuccess = (url: string) => {
          this.uppy.removeFile(fileId);
          resolve(url);
        };

        const onError = (error: Error) => {
          this.uppy.removeFile(fileId);
          reject(error);
        };

        // Sobrescribir callbacks temporalmente
        const originalOnSuccess = this.options.onSuccess;
        const originalOnError = this.options.onError;

        this.options.onSuccess = onSuccess;
        this.options.onError = onError;

        // Iniciar subida
        this.uppy.upload().catch((error: any) => {
          this.uppy.removeFile(fileId);
          reject(error);
        }).finally(() => {
          // Restaurar callbacks originales
          this.options.onSuccess = originalOnSuccess;
          this.options.onError = originalOnError;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  updateCallbacks(options: UppyUploadOptions) {
    this.options = { ...this.options, ...options };
  }

  destroy() {
    if (this.uppy && typeof this.uppy.close === 'function') {
      this.uppy.close();
    }
  }

  getUppy() {
    return this.uppy;
  }

  // Método estático para subida simple
  static async uploadSingle(
    file: File, 
    callbacks: UppyUploadOptions = {}
  ): Promise<string> {
    const uploader = new UppyUploader(callbacks);
    try {
      const url = await uploader.uploadFile(file);
      return url;
    } finally {
      uploader.destroy();
    }
  }
} 