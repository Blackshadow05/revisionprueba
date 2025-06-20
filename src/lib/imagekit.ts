import ImageKit from 'imagekit';

// Configuración de ImageKit solo para servidor (con privateKey)
let imagekit: ImageKit | null = null;

// Inicializar solo en el servidor
if (typeof window === 'undefined') {
  imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''
  });
}

// Configuración solo para cliente (sin privateKey)
const clientConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''
};

// Función para obtener la carpeta según el tipo de imagen
const getFolderPath = (type: 'evidencias' | 'notas'): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  if (type === 'notas') {
    return `Notas/${year}-${month}`;
  } else {
    return `Evidencias/${year}-${month}`;
  }
};

// Función principal para subir imágenes a ImageKit.io
export const uploadToImageKit = async (
  file: File, 
  type: 'evidencias' | 'notas' = 'evidencias',
  customFileName?: string
): Promise<string> => {
  // Verificar si estamos en el servidor
  if (typeof window !== 'undefined') {
    throw new Error('uploadToImageKit solo puede ser llamada desde el servidor');
  }
  
  if (!imagekit) {
    throw new Error('ImageKit no está inicializado correctamente');
  }
  
  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = customFileName || `${timestamp}_${randomString}.${fileExtension}`;
    
    // Obtener la carpeta según el tipo
    const folderPath = getFolderPath(type);
    
    // Convertir File a Buffer para el upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`📁 Subiendo a ImageKit.io: ${folderPath}/${fileName}`);
    
    // Subir archivo a ImageKit.io
    const response = await imagekit.upload({
      file: buffer,
      fileName: fileName,
      folder: folderPath,
      useUniqueFileName: false, // Ya generamos nombre único
      tags: [type, 'revision-casitas'],
      transformation: {
        pre: 'f-auto,q-auto' // Optimización automática sin thumbsmall aquí
      }
    });
    
    // Agregar la transformación thumbsmall con el formato correcto
    const baseUrl = response.url;
    const finalUrl = `${baseUrl}?tr=n-thumbsmall`;
    
    console.log('✅ Imagen subida exitosamente:', finalUrl);
    return finalUrl;
    
  } catch (error: any) {
    console.error('❌ Error al subir imagen a ImageKit.io:', error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

// Función para subir múltiples archivos
export const uploadMultipleToImageKit = async (
  files: File[],
  type: 'evidencias' | 'notas' = 'evidencias',
  onProgress?: (progress: number, fileName: string) => void
): Promise<string[]> => {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(((i) / files.length) * 100, file.name);
      
      const url = await uploadToImageKit(file, type);
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
  const baseUrl = url.replace('/upload/', `/upload/tr:${transformationString}/`);
  
  // Agregar la transformación thumbsmall con el formato correcto
  return `${baseUrl}?tr=n-thumbsmall`;
};

// Función para obtener información de un archivo en ImageKit.io
export const getImageKitFileInfo = async (fileId: string) => {
  if (typeof window !== 'undefined' || !imagekit) {
    throw new Error('getImageKitFileInfo solo puede ser llamada desde el servidor');
  }
  
  try {
    const fileDetails = await imagekit.getFileDetails(fileId);
    return fileDetails;
  } catch (error) {
    console.error('Error obteniendo información del archivo:', error);
    throw error;
  }
};

// Función para eliminar archivo de ImageKit.io (opcional)
export const deleteFromImageKit = async (fileId: string): Promise<boolean> => {
  if (typeof window !== 'undefined' || !imagekit) {
    throw new Error('deleteFromImageKit solo puede ser llamada desde el servidor');
  }
  
  try {
    await imagekit.deleteFile(fileId);
    console.log('✅ Archivo eliminado de ImageKit.io');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando archivo de ImageKit.io:', error);
    return false;
  }
};

// Función para generar URL firmada (para uploads desde el frontend)
export const getImageKitAuthParams = () => {
  if (typeof window !== 'undefined' || !imagekit) {
    throw new Error('getImageKitAuthParams solo puede ser llamada desde el servidor');
  }
  
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return authenticationParameters;
  } catch (error) {
    console.error('Error generando parámetros de autenticación:', error);
    throw error;
  }
};

export default imagekit; 