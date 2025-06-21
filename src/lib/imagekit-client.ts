// Funciones del lado del cliente para ImageKit.io

export interface UploadResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
  details?: string;
}

// Función para subir un archivo desde el cliente
export const uploadToImageKitClient = async (
  file: File,
  type: 'evidencias' | 'notas' = 'evidencias',
  customFileName?: string
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (customFileName) {
      formData.append('customFileName', customFileName);
    }

    console.log(`📤 Cliente: Subiendo ${file.name} a ImageKit.io...`);

    const response = await fetch('/api/upload-imagekit', {
      method: 'POST',
      body: formData,
    });

    const result: UploadResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.details || 'Error al subir el archivo');
    }

    if (!result.url) {
      throw new Error('No se recibió URL del archivo subido');
    }

    console.log(`✅ Cliente: Archivo subido exitosamente: ${result.url}`);
    return result.url;

  } catch (error: any) {
    console.error('❌ Cliente: Error al subir archivo:', error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

// Función para subir múltiples archivos
export const uploadMultipleToImageKitClient = async (
  files: File[],
  type: 'evidencias' | 'notas' = 'evidencias',
  onProgress?: (progress: number, fileName: string) => void
): Promise<string[]> => {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(((i) / files.length) * 100, file.name);
      
      const url = await uploadToImageKitClient(file, type);
      urls.push(url);
      
      onProgress?.(((i + 1) / files.length) * 100, file.name);
      
    } catch (error) {
      console.error(`Error subiendo ${file.name}:`, error);
      throw error;
    }
  }
  
  return urls;
};

// Función para optimizar URLs de ImageKit.io (agregar transformaciones)
export const optimizeImageKitUrl = (url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}): string => {
  if (!url || !url.includes('imagekit.io')) {
    return url;
  }
  
  const transformations: string[] = [];
  
  if (options?.width) transformations.push(`w-${options.width}`);
  if (options?.height) transformations.push(`h-${options.height}`);
  if (options?.quality) transformations.push(`q-${options.quality}`);
  if (options?.format) transformations.push(`f-${options.format}`);
  
  // Si no hay transformaciones específicas, usar auto-optimización
  if (transformations.length === 0) {
    transformations.push('f-auto', 'q-auto');
  }
  
  // Insertar transformaciones en la URL
  const transformationString = transformations.join(',');
  return url.replace('/upload/', `/upload/tr:${transformationString}/`);
}; 