export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Mantener proporción original, limitando el ancho máximo a 1920px (configuración estándar)
      const maxWidth = 1920;
      let { width, height } = img;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Configurar contexto para mejor calidad (configuración estándar)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen manteniendo su proporción original
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob WebP con calidad 70% (configuración estándar)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }
          
          // Crear nombre con extensión .webp
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const webpName = `${originalName}.webp`;
          
          const compressedFile = new File([blob], webpName, {
            type: 'image/webp',
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, 'image/webp', 0.70); // Calidad 70% - configuración estándar
      } else {
        reject(new Error('No se pudo obtener el contexto del canvas'));
      }
    };
    
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
}; 