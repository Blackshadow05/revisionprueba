/**
 * Compresión de imágenes eficiente usando Canvas API nativo
 * Optimizado para bajo consumo de CPU y batería
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
}

export class ImageCompressor {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  // Reutilizar canvas para mejor rendimiento
  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    
    if (!this.ctx) {
      throw new Error('No se pudo crear el contexto del canvas');
    }

    return { canvas: this.canvas, ctx: this.ctx };
  }

  /**
   * Comprime una imagen de forma eficiente usando configuración estándar
   */
  static async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<{ file: File; originalSize: number; compressedSize: number; compressionRatio: number }> {
    const {
      maxWidth = 1920,      // Configuración estándar
      maxHeight = undefined,  // Solo limitamos por ancho
      quality = 0.70,       // Configuración estándar: 70%
      format = 'webp',      // Configuración estándar: WebP
      maxSizeKB = 1000      // Tamaño aumentado para mantener calidad
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const { canvas, ctx } = this.getCanvas();
          
          // Calcular nuevas dimensiones manteniendo aspect ratio (configuración estándar)
          let { width, height } = img;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          // Configurar canvas
          canvas.width = width;
          canvas.height = height;

          // Limpiar canvas
          ctx.clearRect(0, 0, width, height);

          // Configurar filtros para mejor calidad (configuración estándar)
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob con compresión (configuración estándar)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }

              const compressedSize = blob.size;
              const originalSize = file.size;
              const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

              // Si aún es muy grande, reducir calidad progresivamente
              if (compressedSize > maxSizeKB * 1024 && quality > 0.3) {
                const newQuality = Math.max(0.3, quality - 0.15);
                this.compressImage(file, { ...options, quality: newQuality })
                  .then(resolve)
                  .catch(reject);
                return;
              }

              // Crear nuevo archivo con extensión correcta
              const originalName = file.name.replace(/\.[^/.]+$/, '');
              const newName = `${originalName}.${format === 'jpeg' ? 'jpg' : format}`;
              
              const compressedFile = new File(
                [blob], 
                newName,
                { 
                  type: `image/${format}`,
                  lastModified: Date.now()
                }
              );

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                compressionRatio
              });
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      // Cargar imagen
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calcula dimensiones óptimas manteniendo aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Si la imagen es más pequeña que los límites, no redimensionar
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calcular ratio de redimensionamiento
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  /**
   * Compresión rápida para móviles (menos recursos)
   */
  static async compressForMobile(file: File): Promise<File> {
    const result = await this.compressImage(file, {
      maxWidth: 1280,
      maxHeight: 720,
      quality: 0.7,
      format: 'jpeg',
      maxSizeKB: 300
    });
    
    return result.file;
  }

  /**
   * Compresión para escritorio (mejor calidad)
   */
  static async compressForDesktop(file: File): Promise<File> {
    const result = await this.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      format: 'jpeg',
      maxSizeKB: 800
    });
    
    return result.file;
  }

  /**
   * Detecta si es móvil y aplica compresión apropiada
   */
  static async compressAuto(file: File): Promise<{ 
    file: File; 
    stats: { originalSize: number; compressedSize: number; compressionRatio: number } 
  }> {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const result = await this.compressImage(file, {
      maxWidth: isMobile ? 1280 : 1920,
      maxHeight: isMobile ? 720 : 1080,
      quality: isMobile ? 0.7 : 0.85,
      format: 'jpeg',
      maxSizeKB: isMobile ? 300 : 800
    });

    return {
      file: result.file,
      stats: {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      }
    };
  }

  /**
   * Limpia recursos
   */
  static cleanup() {
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.ctx = null;
    }
  }
} 