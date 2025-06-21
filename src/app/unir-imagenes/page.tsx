'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';

interface ImageData {
  file: File | null;
  compressed: string | null;
  originalSize: number;
  compressedSize: number;
}

export default function UnirImagenes() {
  const spectacularBg = useSpectacularBackground();
  const [imagen1, setImagen1] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagen2, setImagen2] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagenUnida, setImagenUnida] = useState<string | null>(null);
  const [orientacion, setOrientacion] = useState<'vertical' | 'horizontal'>('vertical');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState<{ img1: boolean; img2: boolean }>({ img1: false, img2: false });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalImg, setModalImg] = useState<string | null>(null);

  // Efecto para manejar tecla ESC en modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalVisible) {
        setModalVisible(false);
      }
    };

    if (modalVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalVisible]);
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Funcion para comprimir imagen optimizada (sin metadatos)
  const comprimirImagen = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Mantener proporcion original, limitando el ancho maximo a 1920px
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
          // Configurar contexto para mejor calidad
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Dibujar imagen manteniendo su proporcion original
          ctx.drawImage(img, 0, 0, width, height);
          
          // Comprimir con calidad 70% (buen balance calidad/tamaño)
          const dataURL = canvas.toDataURL('image/webp', 0.70);
          resolve(dataURL);
        } else {
          reject(new Error('No se pudo obtener el contexto del canvas'));
        }
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Funcion para unir las imagenes manteniendo proporciones
  const unirImagenes = useCallback(async () => {
    if (!imagen1.compressed || !imagen2.compressed) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const img1 = new Image();
    const img2 = new Image();

    await Promise.all([
      new Promise((resolve) => {
        img1.onload = resolve;
        img1.src = imagen1.compressed!;
      }),
      new Promise((resolve) => {
        img2.onload = resolve;
        img2.src = imagen2.compressed!;
      })
    ]);

    // Calcular dimensiones del canvas final segun orientacion
    if (orientacion === 'vertical') {
      // Usar el ancho maximo de ambas imagenes
      const maxWidth = Math.max(img1.width, img2.width);
      canvas.width = maxWidth;
      canvas.height = img1.height + img2.height;
      
      // Centrar las imagenes horizontalmente
      const x1 = (maxWidth - img1.width) / 2;
      const x2 = (maxWidth - img2.width) / 2;
      
      ctx.drawImage(img1, x1, 0, img1.width, img1.height);
      ctx.drawImage(img2, x2, img1.height, img2.width, img2.height);
    } else {
      // Usar la altura maxima de ambas imagenes
      const maxHeight = Math.max(img1.height, img2.height);
      canvas.width = img1.width + img2.width;
      canvas.height = maxHeight;
      
      // Centrar las imagenes verticalmente
      const y1 = (maxHeight - img1.height) / 2;
      const y2 = (maxHeight - img2.height) / 2;
      
      ctx.drawImage(img1, 0, y1, img1.width, img1.height);
      ctx.drawImage(img2, img1.width, y2, img2.width, img2.height);
    }

    // Comprimir resultado final con calidad 70%
    const imagenUnidaData = canvas.toDataURL('image/webp', 0.70);
    setImagenUnida(imagenUnidaData);
  }, [imagen1.compressed, imagen2.compressed, orientacion]);

  // Efecto para unir imagenes automaticamente
  useEffect(() => {
    if (imagen1.compressed && imagen2.compressed) {
      unirImagenes();
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion, unirImagenes]);

  // Manejar seleccion de archivo
  const manejarArchivoSeleccionado = async (file: File, tipo: 'img1' | 'img2') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen valido');
      return;
    }

    setLoading(prev => ({ ...prev, [tipo]: true }));

    try {
      const comprimida = await comprimirImagen(file);
      
      // Calcular tamaños
      const originalSize = file.size;
      const compressedSize = Math.round((comprimida.length * 3) / 4);
      
      if (tipo === 'img1') {
        setImagen1({ file, compressed: comprimida, originalSize, compressedSize });
      } else {
        setImagen2({ file, compressed: comprimida, originalSize, compressedSize });
      }
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      alert('Error al procesar la imagen');
    } finally {
      setLoading(prev => ({ ...prev, [tipo]: false }));
    }
  };

  // Manejar captura de camara - solucion para moviles
  const capturarDesdeCamara = async (tipo: 'img1' | 'img2') => {
    // Detectar si es movil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // En moviles, usar input file con capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Camara trasera
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          manejarArchivoSeleccionado(file, tipo);
        }
      };
      
      input.click();
      return;
    }

    // Para desktop, usar getUserMedia
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      
      // Crear modal para mostrar preview
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="relative">
          <video autoplay playsinline class="max-w-full max-h-[70vh] rounded-lg"></video>
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button id="capture-btn" class="px-6 py-3 bg-green-500 text-white rounded-lg font-medium">Capturar</button>
            <button id="cancel-btn" class="px-6 py-3 bg-red-500 text-white rounded-lg font-medium">Cancelar</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      const modalVideo = modal.querySelector('video') as HTMLVideoElement;
      modalVideo.srcObject = stream;
      
      const captureBtn = modal.querySelector('#capture-btn') as HTMLButtonElement;
      const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
      
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = modalVideo.videoWidth;
        canvas.height = modalVideo.videoHeight;
        
        if (ctx) {
          ctx.drawImage(modalVideo, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' });
              await manejarArchivoSeleccionado(file, tipo);
            }
            cleanup();
          }, 'image/jpeg', 0.8);
        }
      };
      
      cancelBtn.onclick = cleanup;
      
    } catch (error) {
      console.error('Error al acceder a la camara:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Permisos de camara denegados. Usa "Elegir archivo" en su lugar.');
        } else if (error.name === 'NotFoundError') {
          alert('No se encontro camara. Usa "Elegir archivo" en su lugar.');
        } else {
          alert('Error de camara. Usa "Elegir archivo" en su lugar.');
        }
      } else {
        alert('Error de camara. Usa "Elegir archivo" en su lugar.');
      }
    }
  };

  // Guardar imagen
  const guardarImagen = () => {
    if (!imagenUnida) return;

    const link = document.createElement('a');
    link.download = `imagenes-unidas-${Date.now()}.webp`;
    link.href = imagenUnida;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartir imagen
  const compartirImagen = async () => {
    if (!imagenUnida) return;

    try {
      // Convertir data URL a blob
      const response = await fetch(imagenUnida);
      const blob = await response.blob();
      const file = new File([blob], `imagenes-unidas-${Date.now()}.webp`, { type: 'image/webp' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Imagenes Unidas',
          text: 'Imagen creada con el unificador de imagenes',
          files: [file]
        });
      } else {
        // Fallback: copiar al portapapeles si es posible
        if (navigator.clipboard && 'write' in navigator.clipboard) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/webp': blob })
          ]);
          alert('Imagen copiada al portapapeles');
        } else {
          // Ultimo fallback: descargar
          guardarImagen();
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('No se pudo compartir la imagen');
    }
  };

  // Restablecer imagen
  const restablecerImagen = (tipo: 'img1' | 'img2') => {
    if (tipo === 'img1') {
      setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      if (fileInputRef1.current) fileInputRef1.current.value = '';
    } else {
      setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 1.25 : 0.8;
    const newZoom = Math.max(0.5, Math.min(5, zoom * scaleChange));
    setZoom(newZoom);
  };

  const handleMouseDownImage = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMoveImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging) {
      e.preventDefault();
      const img = imgRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const scaledWidth = rect.width * zoom;
        const scaledHeight = rect.height * zoom;
        
        const maxX = (scaledWidth - rect.width) / 2;
        const maxY = (scaledHeight - rect.height) / 2;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        setPosition({
          x: Math.min(Math.max(-maxX, newX), maxX),
          y: Math.min(Math.max(-maxY, newY), maxY)
        });
      }
    }
  };

  const handleMouseUpImage = () => {
    setIsDragging(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <main style={spectacularBg} className="relative overflow-hidden">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-3 text-white hover:text-[#c9a45c] transition-colors duration-300 relative overflow-hidden rounded-xl font-medium"
            style={{ padding: '10px 18px' }}
          >
            {/* Efecto de brillo continuo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
            <div className="relative z-10 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="font-medium">Volver al inicio</span>
            </div>
          </Link>
          
          <div className="relative text-center">
            {/* Efecto de resplandor de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#c9a45c]/15 via-[#f0c987]/15 to-[#c9a45c]/15 blur-2xl rounded-full transform scale-125"></div>
            
            {/* Título principal con efectos modernos */}
            <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-black tracking-tight">
              <span className="block bg-gradient-to-r from-white via-[#f0c987] to-[#c9a45c] bg-clip-text text-transparent drop-shadow-xl">
                Unir
              </span>
              <span className="block bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-white bg-clip-text text-transparent mt-1 transform translate-x-1">
                Imágenes
              </span>
            </h1>
            
            {/* Línea decorativa animada */}
            <div className="relative mt-4 h-0.5 w-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Indicador de orientacion */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl px-6 py-3 border border-[#3d4659]/50">
            <div className="flex items-center gap-2 text-[#c9a45c]">
              {orientacion === 'vertical' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                  <span className="font-medium text-white">Modo Vertical</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25L18.75 12 15 15.75m-6-7.5L5.25 12 9 15.75" />
                  </svg>
                  <span className="font-medium text-white">Modo Horizontal</span>
                </>
              )}
            </div>
            <div className="w-px h-6 bg-[#3d4659]"></div>
            <p className="text-sm text-gray-300">
              {orientacion === 'vertical' 
                ? 'Las imagenes se uniran una debajo de la otra' 
                : 'Las imagenes se uniran una al lado de la otra'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center text-[#1a1f35] text-sm font-bold">1</span>
              Imagen 1
            </h3>
            
            {!imagen1.compressed ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => capturarDesdeCamara('img1')}
                    disabled={loading.img1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.img1 ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    )}
                    Capturar con camara
                  </button>
                  
                  <button
                    onClick={() => fileInputRef1.current?.click()}
                    disabled={loading.img1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Elegir archivo
                  </button>
                </div>
                
                <input
                  ref={fileInputRef1}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) manejarArchivoSeleccionado(file, 'img1');
                  }}
                  className="hidden"
                />
                
                <div className="border-2 border-dashed border-[#3d4659] rounded-xl p-8 text-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p>No hay imagen seleccionada</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Imagen 1 lista</span>
                  </div>
                  <p className="text-sm text-gray-300">Imagen comprimida (proporcion original)</p>
                  <p className="text-xs text-gray-400">
                    {(imagen1.originalSize / 1024).toFixed(1)} KB → {(imagen1.compressedSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                
                <button
                  onClick={() => restablecerImagen('img1')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  Cambiar imagen
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center text-[#1a1f35] text-sm font-bold">2</span>
              Imagen 2
            </h3>
            
            {!imagen2.compressed ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => capturarDesdeCamara('img2')}
                    disabled={loading.img2}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.img2 ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 715.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    )}
                    Capturar con camara
                  </button>
                  
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    disabled={loading.img2}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Elegir archivo
                  </button>
                </div>
                
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) manejarArchivoSeleccionado(file, 'img2');
                  }}
                  className="hidden"
                />
                
                <div className="border-2 border-dashed border-[#3d4659] rounded-xl p-8 text-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p>No hay imagen seleccionada</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Imagen 2 lista</span>
                  </div>
                  <p className="text-sm text-gray-300">Imagen comprimida (proporcion original)</p>
                  <p className="text-xs text-gray-400">
                    {(imagen2.originalSize / 1024).toFixed(1)} KB → {(imagen2.compressedSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                
                <button
                  onClick={() => restablecerImagen('img2')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  Cambiar imagen
                </button>
              </div>
            )}
          </div>
        </div>

        {imagenUnida && (
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#c9a45c]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 713.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 713.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Imagen Unida
              </h3>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setOrientacion(orientacion === 'vertical' ? 'horizontal' : 'vertical')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  {orientacion === 'vertical' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                      </svg>
                      Vertical (una debajo de otra)
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25L18.75 12 15 15.75m-6-7.5L5.25 12 9 15.75" />
                      </svg>
                      Horizontal (una al lado de otra)
                    </>
                  )}
                </button>

                <button
                  onClick={() => setModalVisible(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  Ver completa
                </button>

                <button
                  onClick={compartirImagen}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Compartir
                </button>

                <button
                  onClick={guardarImagen}
                  className="px-4 py-2 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#f0c987] hover:to-[#c9a45c] transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Guardar
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-gray-900/50 p-4">
              <img
                src={imagenUnida}
                alt="Imagenes unidas"
                className="w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '400px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              />
            </div>
          </div>
        )}

        {modalVisible && imagenUnida && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm" style={{ touchAction: 'none' }}>
            {/* Barra superior con controles */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Evidencia Fotográfica</h3>
                    <p className="text-gray-300 text-sm">Zoom: {Math.round(zoom * 100)}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Controles de zoom */}
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg p-1">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      className="w-8 h-8 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-all duration-200"
                      title="Alejar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="px-2 py-1 text-white text-xs font-medium min-w-[50px] text-center">
                      {Math.round(zoom * 100)}%
                    </div>
                    <button
                      onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                      className="w-8 h-8 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-all duration-200"
                      title="Acercar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setZoom(1);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className="ml-1 px-2 py-1 text-white hover:bg-white/20 rounded-md text-xs transition-all duration-200"
                      title="Restablecer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón cerrar - SIEMPRE visible con z-index alto */}
            <button
              onClick={closeModal}
              className="fixed top-4 right-4 z-[60] w-12 h-12 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border-2 border-white/20 shadow-2xl"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenedor de imagen */}
            <div className="w-full h-full flex items-center justify-center p-4 pt-20">
              <img
                ref={imgRef}
                src={imagenUnida}
                alt="Imagen unida - Pantalla completa"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  touchAction: 'none'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDownImage}
                onMouseMove={handleMouseMoveImage}
                onMouseUp={handleMouseUpImage}
                onMouseLeave={handleMouseUpImage}
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const initialDistance = Math.hypot(
                      touch2.clientX - touch1.clientX,
                      touch2.clientY - touch1.clientY
                    );
                    setDragStart({ x: initialDistance, y: 0 });
                  } else if (e.touches.length === 1 && zoom > 1) {
                    e.preventDefault();
                    setIsDragging(true);
                    setDragStart({
                      x: e.touches[0].clientX - position.x,
                      y: e.touches[0].clientY - position.y
                    });
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const currentDistance = Math.hypot(
                      touch2.clientX - touch1.clientX,
                      touch2.clientY - touch1.clientY
                    );
                    const scaleChange = currentDistance / dragStart.x;
                    const newZoom = Math.max(0.5, Math.min(5, zoom * scaleChange));
                    setZoom(newZoom);
                    setDragStart({ x: currentDistance, y: 0 });
                  } else if (e.touches.length === 1 && isDragging && zoom > 1) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const newX = touch.clientX - dragStart.x;
                    const newY = touch.clientY - dragStart.y;
                    
                    const img = imgRef.current;
                    if (img) {
                      const rect = img.getBoundingClientRect();
                      const scaledWidth = rect.width * zoom;
                      const scaledHeight = rect.height * zoom;
                      
                      const maxX = (scaledWidth - rect.width) / 2;
                      const maxY = (scaledHeight - rect.height) / 2;
                      
                      setPosition({
                        x: Math.min(Math.max(-maxX, newX), maxX),
                        y: Math.min(Math.max(-maxY, newY), maxY)
                      });
                    }
                  }
                }}
                onTouchEnd={() => {
                  setIsDragging(false);
                }}
              />
            </div>

            {/* Indicador de instrucciones - Solo para móviles */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
                <div className="flex items-center justify-center text-xs">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    Pellizcar para hacer zoom • Arrastrar para mover
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
