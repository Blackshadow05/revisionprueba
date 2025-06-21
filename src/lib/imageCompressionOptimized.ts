/**
 * Compresión de imágenes optimizada para dispositivos de gama baja
 * Incluye detección de rendimiento y ajustes automáticos
 */

interface DeviceCapabilities {
  isLowEnd: boolean;
  memoryGB: number;
  cores: number;
  isMobile: boolean;
}

interface OptimizedCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maxSizeKB?: number;
  progressive?: boolean; // Para mostrar progreso
  chunkSize?: number; // Procesar en chunks para evitar bloqueos
}

export class OptimizedImageCompressor {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;
  private static isProcessing = false;

  /**
   * Detecta capacidades del dispositivo
   */
  private static detectDeviceCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    
    // Detectar memoria aproximada
    const memory = (navigator as any).deviceMemory || 4; // GB
    
    // Detectar núcleos de CPU
    const cores = navigator.hardwareConcurrency || 4;
    
    // Heurística para dispositivos de gama baja
    const isLowEnd = memory <= 3 || cores <= 4 || 
                     /Android.*[4-6]\./i.test(userAgent) || // Android viejo
                     /iPhone.*OS [89]_|iPhone.*OS 1[01]_/i.test(userAgent); // iOS viejo

    return {
      isLowEnd,
      memoryGB: memory,
      cores,
      isMobile
    };
  }

  /**
   * Analiza el contenido de la imagen para determinar la calidad óptima
   */
  private static analyzeImageContent(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): {
    brightness: number;
    contrast: number;
    complexity: number;
    recommendedQuality: number;
  } {
    const width = canvas.width;
    const height = canvas.height;
    
    // Muestrear la imagen (cada 10 píxeles para eficiencia)
    const sampleSize = Math.min(width * height / 100, 10000); // Máximo 10k píxeles
    const step = Math.max(1, Math.floor(Math.sqrt((width * height) / sampleSize)));
    
    let totalBrightness = 0;
    let totalVariance = 0;
    let pixelCount = 0;
    const brightnesses: number[] = [];
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const imageData = ctx.getImageData(x, y, 1, 1);
        const r = imageData.data[0];
        const g = imageData.data[1];
        const b = imageData.data[2];
        
        // Calcular brillo (luminancia)
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightnesses.push(brightness);
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Calcular contraste (varianza del brillo)
    for (const brightness of brightnesses) {
      totalVariance += Math.pow(brightness - avgBrightness, 2);
    }
    const contrast = Math.sqrt(totalVariance / pixelCount);
    
    // Calcular complejidad (cambios de brillo entre píxeles adyacentes)
    let edgeCount = 0;
    let edgeTotal = 0;
    
    for (let i = 0; i < brightnesses.length - 1; i++) {
      const diff = Math.abs(brightnesses[i] - brightnesses[i + 1]);
      if (diff > 0.1) { // Umbral de cambio significativo
        edgeCount++;
        edgeTotal += diff;
      }
    }
    
    const complexity = edgeCount / brightnesses.length;
    
    // Usar calidad alta como predeterminada (equivalente a exterior)
    let recommendedQuality = 0.90; // Base alta para todas las imágenes
    
    // Solo reducir calidad si la imagen es muy compleja (muchos detalles finos)
    if (complexity > 0.4) {
      recommendedQuality = 0.85; // Reducir ligeramente para imágenes muy complejas
    }
    
    // Mantener calidad alta para gradientes suaves (cielos, etc.)
    if (contrast < 0.15) {
      recommendedQuality = 0.92; // Calidad extra alta para gradientes
    }
    
    // Limitar entre 0.80 y 0.95 (rango alto)
    recommendedQuality = Math.max(0.80, Math.min(0.95, recommendedQuality));
    
    return {
      brightness: avgBrightness,
      contrast,
      complexity,
      recommendedQuality
    };
  }

  /**
   * Configuración automática según dispositivo y contenido
   */
  private static getOptimalSettings(fileSize: number, imageAnalysis?: any): OptimizedCompressionOptions {
    const device = this.detectDeviceCapabilities();
    
    // Usar configuración estándar como base
    let baseQuality = 0.70; // Configuración estándar: 70%
    if (device.isLowEnd) {
      baseQuality = 0.65; // Reducir ligeramente en gama baja
    } else if (device.memoryGB >= 6) {
      baseQuality = 0.75; // Aumentar ligeramente en gama alta
    }
    
    // Ajustar calidad según análisis de imagen (si está disponible)
    const finalQuality = imageAnalysis ? imageAnalysis.recommendedQuality : baseQuality;
    
    if (device.isLowEnd) {
      return {
        maxWidth: 1920,  // Configuración estándar
        maxHeight: undefined,  // Solo limitamos por ancho
        quality: Math.max(0.60, Math.min(finalQuality, 0.70)), 
        format: 'webp',  // Configuración estándar
        maxSizeKB: device.isMobile ? 400 : 600,
        progressive: true,
        chunkSize: 512 * 1024
      };
    } else if (device.memoryGB >= 6) {
      return {
        maxWidth: 1920,  // Configuración estándar
        maxHeight: undefined,  // Solo limitamos por ancho
        quality: finalQuality,
        format: 'webp',  // Configuración estándar
        maxSizeKB: device.isMobile ? 1000 : 1500,
        progressive: false,
        chunkSize: 2 * 1024 * 1024
      };
    } else {
      return {
        maxWidth: 1920,  // Configuración estándar
        maxHeight: undefined,  // Solo limitamos por ancho
        quality: finalQuality,
        format: 'webp',  // Configuración estándar
        maxSizeKB: device.isMobile ? 700 : 1000,
        progressive: true,
        chunkSize: 1024 * 1024
      };
    }
  }

  /**
   * Compresión con pausas para evitar bloqueo de UI
   */
  static async compressWithBreaks(
    file: File,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ 
    file: File; 
    originalSize: number; 
    compressedSize: number; 
    compressionRatio: number;
    processingTime: number;
    deviceInfo: DeviceCapabilities;
    imageAnalysis?: {
      brightness: number;
      contrast: number;
      complexity: number;
      recommendedQuality: number;
    };
  }> {
    if (this.isProcessing) {
      throw new Error('Ya hay una compresión en proceso. Espera a que termine.');
    }

    this.isProcessing = true;
    const startTime = performance.now();
    const device = this.detectDeviceCapabilities();
    const settings = this.getOptimalSettings(file.size);

    try {
      onProgress?.(5, 'Analizando imagen...');
      
      // Pausa para permitir actualización de UI
      await this.sleep(50);

      // Verificar si el archivo es demasiado grande para el dispositivo
      if (device.isLowEnd && file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Imagen demasiado grande para este dispositivo. Máximo 10MB.');
      }

      onProgress?.(10, 'Cargando imagen...');
      const img = await this.loadImage(file);
      
      onProgress?.(25, 'Calculando dimensiones...');
      await this.sleep(device.isLowEnd ? 100 : 50);

      const { width, height } = this.calculateDimensions(
        img.width, 
        img.height, 
        settings.maxWidth!, 
        settings.maxHeight!
      );

      onProgress?.(40, 'Preparando canvas...');
      const { canvas, ctx } = this.getCanvas();
      
      // Configurar canvas
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      // Configuración optimizada para gama baja
      if (device.isLowEnd) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // En lugar de 'high'
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      onProgress?.(60, 'Redimensionando...');
      await this.sleep(device.isLowEnd ? 200 : 100);

      // Dibujar imagen
      ctx.drawImage(img, 0, 0, width, height);

      onProgress?.(70, 'Analizando contenido...');
      await this.sleep(device.isLowEnd ? 100 : 50);

      // Analizar contenido de la imagen para calidad adaptativa
      const imageAnalysis = this.analyzeImageContent(canvas, ctx);
      
      // Recalcular configuración con análisis de imagen
      const adaptiveSettings = this.getOptimalSettings(file.size, imageAnalysis);

      onProgress?.(80, 'Comprimiendo...');
      await this.sleep(device.isLowEnd ? 150 : 75);

      // Comprimir con calidad adaptativa
      const blob = await this.canvasToBlob(canvas, adaptiveSettings);
      
      onProgress?.(95, 'Finalizando...');
      await this.sleep(50);

      const compressedSize = blob.size;
      const originalSize = file.size;
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      const processingTime = performance.now() - startTime;

      // Crear archivo final
      const compressedFile = new File(
        [blob], 
        file.name.replace(/\.[^/.]+$/, `.${settings.format === 'jpeg' ? 'jpg' : settings.format}`),
        { 
          type: `image/${settings.format}`,
          lastModified: Date.now()
        }
      );

      onProgress?.(100, 'Completado');

      return {
        file: compressedFile,
        originalSize,
        compressedSize,
        compressionRatio,
        processingTime,
        deviceInfo: device,
        imageAnalysis
      };

    } finally {
      this.isProcessing = false;
      // Limpiar memoria en dispositivos de gama baja
      if (device.isLowEnd) {
        await this.sleep(100);
        this.cleanup();
      }
    }
  }

  /**
   * Carga imagen de forma asíncrona
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convierte canvas a blob con reintentos
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement, 
    settings: OptimizedCompressionOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }

          // Si es muy grande, reducir calidad automáticamente
          if (blob.size > settings.maxSizeKB! * 1024 && settings.quality! > 0.3) {
            const newQuality = Math.max(0.3, settings.quality! - 0.15);
            canvas.toBlob(
              (retryBlob) => {
                resolve(retryBlob || blob);
              },
              `image/${settings.format}`,
              newQuality
            );
          } else {
            resolve(blob);
          }
        },
        `image/${settings.format}`,
        settings.quality
      );
    });
  }

  /**
   * Pausa asíncrona para no bloquear UI
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener canvas reutilizable
   */
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
   * Calcular dimensiones óptimas
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  /**
   * Limpiar recursos
   */
  static cleanup() {
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.ctx = null;
    }
  }

  /**
   * Verificar si el dispositivo puede manejar la imagen
   */
  static canHandleFile(file: File): { canHandle: boolean; reason?: string } {
    const device = this.detectDeviceCapabilities();
    
    if (device.isLowEnd) {
      if (file.size > 15 * 1024 * 1024) { // 15MB
        return { 
          canHandle: false, 
          reason: 'Imagen demasiado grande para dispositivo de gama baja (máx 15MB)' 
        };
      }
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      return { 
        canHandle: false, 
        reason: 'Imagen demasiado grande (máx 50MB)' 
      };
    }

    return { canHandle: true };
  }

  /**
   * Obtener información del dispositivo
   */
  static getDeviceInfo(): DeviceCapabilities & { 
    recommendedSettings: OptimizedCompressionOptions;
    performanceLevel: 'low' | 'medium' | 'high';
  } {
    const device = this.detectDeviceCapabilities();
    const settings = this.getOptimalSettings(1024 * 1024); // 1MB de referencia
    
    let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
    if (device.isLowEnd) performanceLevel = 'low';
    else if (device.memoryGB >= 6) performanceLevel = 'high';

    return {
      ...device,
      recommendedSettings: settings,
      performanceLevel
    };
  }
} 