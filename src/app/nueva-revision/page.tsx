'use client';

import { useState, useEffect, useRef, useCallback, createRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ButtonGroup from '@/components/ButtonGroup';
import { getWeek } from 'date-fns';
import { uploadToImageKitClient } from '@/lib/imagekit-client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDirectImageKitUpload } from '@/hooks/useDirectImageKitUpload';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';

interface RevisionData {
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;
  accesorios_secadora_faltante: string;
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  camas_ordenadas: string;
  cola_caballo: string;
  evidencia_01: File | string;
  evidencia_02: File | string;
  evidencia_03: File | string;
  faltantes: string;
}

interface FileData {
  evidencia_01: File | null;
  evidencia_02: File | null;
  evidencia_03: File | null;
}

const initialFormData: RevisionData = {
  casita: '',
  quien_revisa: '',
  caja_fuerte: '',
  puertas_ventanas: '',
  chromecast: '',
  binoculares: '',
  trapo_binoculares: '',
  speaker: '',
  usb_speaker: '',
  controles_tv: '',
  secadora: '',
  accesorios_secadora: '',
  accesorios_secadora_faltante: '',
  steamer: '',
  bolsa_vapor: '',
  plancha_cabello: '',
  bulto: '',
  sombrero: '',
  bolso_yute: '',
  camas_ordenadas: '',
  cola_caballo: '',
  evidencia_01: '',
  evidencia_02: '',
  evidencia_03: '',
  faltantes: '',
};

const initialFileData: FileData = {
  evidencia_01: null,
  evidencia_02: null,
  evidencia_03: null,
};

const nombresRevisores = [
  'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
  'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
  'Cristopher G', 'Emerson S', 'Joseph R'
];

export default function NuevaRevision() {
  const router = useRouter();
  const { user } = useAuth();
  // Hook de ImageKit.io (no usado actualmente, pero disponible para futuras mejoras)
  // const { uploadMultipleFiles, isUploading: uploadsInProgress, uploads } = useDirectImageKitUpload();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  
  // Estado para el modo especial desde localStorage
  const [isSpecialModeActive, setIsSpecialModeActive] = useState(false);
  
  // Cargar estado del modo especial desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('special-mode-active');
      if (savedState !== null) {
        setIsSpecialModeActive(JSON.parse(savedState));
      }
    }
  }, []);
  
  // Hook de fondo espectacular solo si NO está en modo especial
  const spectacularBg = useSpectacularBackground(!isSpecialModeActive);
  
  // Función para cargar datos desde localStorage
  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('revision-form-data');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          return { ...initialFormData, ...parsedData, quien_revisa: user || parsedData.quien_revisa || '' };
        } catch (error) {
          console.error('Error parsing saved form data:', error);
          return { ...initialFormData, quien_revisa: user || '' };
        }
      }
    }
    return { ...initialFormData, quien_revisa: user || '' };
  };

  // Inicializar con datos por defecto (sin localStorage para evitar hidratación)
  const [formData, setFormData] = useState<RevisionData>({
    ...initialFormData,
    quien_revisa: user || ''
  });

  // Función para guardar en localStorage
  const saveToLocalStorage = (data: RevisionData) => {
    if (typeof window !== 'undefined') {
      // No guardar archivos en localStorage, solo los campos de texto
      const { evidencia_01, evidencia_02, evidencia_03, ...dataToSave } = data;
      localStorage.setItem('revision-form-data', JSON.stringify(dataToSave));
    }
  };

  // Función para guardar el campo resaltado
  const saveHighlightedField = (field: string | null) => {
    if (typeof window !== 'undefined') {
      if (field) {
        localStorage.setItem('revision-highlighted-field', field);
      } else {
        localStorage.removeItem('revision-highlighted-field');
      }
    }
  };

  // Función para cargar el campo resaltado
  const loadHighlightedField = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('revision-highlighted-field');
    }
    return 'casita';
  };

  // Función para limpiar localStorage
  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('revision-form-data');
      localStorage.removeItem('revision-highlighted-field');
    }
  };

  const [highlightedField, setHighlightedField] = useState<string | null>('casita');
  
  // Estados para compresión en segundo plano
  const [compressedFiles, setCompressedFiles] = useState<{
    evidencia_01: File | null;
    evidencia_02: File | null;
    evidencia_03: File | null;
  }>({
    evidencia_01: null,
    evidencia_02: null,
    evidencia_03: null,
  });

  // Estados para tamaños de archivos
  const [fileSizes, setFileSizes] = useState<{
    evidencia_01: { original: number; compressed: number };
    evidencia_02: { original: number; compressed: number };
    evidencia_03: { original: number; compressed: number };
  }>({
    evidencia_01: { original: 0, compressed: 0 },
    evidencia_02: { original: 0, compressed: 0 },
    evidencia_03: { original: 0, compressed: 0 },
  });
  
  const [compressionStatus, setCompressionStatus] = useState<{
    evidencia_01: { status: 'idle' | 'compressing' | 'completed' | 'error'; progress: number; stage: string; error?: string };
    evidencia_02: { status: 'idle' | 'compressing' | 'completed' | 'error'; progress: number; stage: string; error?: string };
    evidencia_03: { status: 'idle' | 'compressing' | 'completed' | 'error'; progress: number; stage: string; error?: string };
  }>({
    evidencia_01: { status: 'idle', progress: 0, stage: '' },
    evidencia_02: { status: 'idle', progress: 0, stage: '' },
    evidencia_03: { status: 'idle', progress: 0, stage: '' },
  });

  // Estados para progreso de subida
  const [uploadProgress, setUploadProgress] = useState<{
    evidencia_01: { status: 'idle' | 'uploading' | 'completed' | 'error'; progress: number; stage: string };
    evidencia_02: { status: 'idle' | 'uploading' | 'completed' | 'error'; progress: number; stage: string };
    evidencia_03: { status: 'idle' | 'uploading' | 'completed' | 'error'; progress: number; stage: string };
  }>({
    evidencia_01: { status: 'idle', progress: 0, stage: '' },
    evidencia_02: { status: 'idle', progress: 0, stage: '' },
    evidencia_03: { status: 'idle', progress: 0, stage: '' },
  });

  const [overallUploadProgress, setOverallUploadProgress] = useState({
    totalFiles: 0,
    completedFiles: 0,
    currentStage: '',
    isUploading: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef2 = useRef<HTMLInputElement>(null);
  const cameraInputRef3 = useRef<HTMLInputElement>(null);

  // Estados para modal de imagen
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Refs para scroll automático
  const fieldRefs = useRef<{ [key: string]: React.RefObject<any> }>({});
  // Inicializar refs para los campos requeridos
  useEffect(() => {
    requiredFields.forEach((field) => {
      if (!fieldRefs.current[field]) {
        fieldRefs.current[field] = createRef();
      }
    });
  }, []);

  // Efecto para inicializar información del dispositivo
  useEffect(() => {
    const initDeviceInfo = async () => {
      const { OptimizedImageCompressor } = await import('@/lib/imageCompressionOptimized');
      const info = OptimizedImageCompressor.getDeviceInfo();
      setDeviceInfo(info);
    };
    initDeviceInfo();
  }, []);

  // Efecto para actualizar quien_revisa cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData(prev => {
        const newData = { ...prev, quien_revisa: user };
        saveToLocalStorage(newData);
        return newData;
      });
    }
  }, [user]);

  // Efecto para cargar datos del localStorage al montar el componente (después de la hidratación)
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    const savedHighlightedField = loadHighlightedField();
    
    if (savedData && Object.keys(savedData).some(key => savedData[key as keyof RevisionData] && key !== 'quien_revisa')) {
      setFormData(savedData);
      
      // Restaurar el campo resaltado o calcular el siguiente campo vacío
      if (savedHighlightedField) {
        setHighlightedField(savedHighlightedField);
      } else {
        const nextEmptyField = requiredFields.find(f => !savedData[f]);
        setHighlightedField(nextEmptyField || null);
        saveHighlightedField(nextEmptyField || null);
      }
    }
  }, []);

  // Efecto para cerrar modal con Escape y limpiar URLs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  const showEvidenceFields = ['Check in', 'Upsell', 'Back to Back'].includes(formData.caja_fuerte);

  const requiredFields: (keyof RevisionData)[] = [
    'casita',
    'quien_revisa',
    'caja_fuerte',
    'puertas_ventanas',
    'chromecast',
    'binoculares',
    'trapo_binoculares',
    'speaker',
    'usb_speaker',
    'controles_tv',
    'secadora',
    'accesorios_secadora',
    'steamer',
    'bolsa_vapor',
    'plancha_cabello',
    'bulto',
    'sombrero',
    'bolso_yute',
    'camas_ordenadas',
    'cola_caballo'
  ];

  // Modificar handleInputChange para guardar automáticamente
  const handleInputChange = (field: keyof RevisionData, value: string) => {
    if (error) setError(null);
    // Crear el nuevo estado con el valor actualizado
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Guardar automáticamente en localStorage
    saveToLocalStorage(newFormData);
    
    // Buscar el primer campo vacío usando el nuevo estado
    const nextEmptyField = requiredFields.find(f => !newFormData[f]);
    setHighlightedField(nextEmptyField || null);
    
    // Guardar el campo resaltado
    saveHighlightedField(nextEmptyField || null);
  };

  // Funciones para modal de imagen
  const openModal = (imageUrl: string) => {
    setModalImg(imageUrl);
    setModalOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImg(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Efecto para manejar tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };

    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = zoom + (e.deltaY > 0 ? -0.1 : 0.1);
    setZoom(Math.max(0.5, Math.min(5, newZoom)));
  };

  const handleMouseDownImage = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMoveImage = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUpImage = () => {
    setIsDragging(false);
  };

  // Función para comprimir imagen usando canvas (misma configuración que "Unir Imágenes")
  const comprimirImagenWebP = useCallback((file: File): Promise<File> => {
    console.log('🚀 INICIANDO COMPRESIÓN:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    
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
              reject(new Error('No se pudo comprimir la imagen'));
              return;
            }
            
            // Crear nombre con extensión .webp
            const originalName = file.name.replace(/\.[^/.]+$/, '');
            const webpName = `${originalName}.webp`;
            
            const compressedFile = new File([blob], webpName, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            
            console.log('✅ COMPRESIÓN COMPLETADA:', {
              original: { name: file.name, type: file.type, size: `${(file.size / 1024).toFixed(1)} KB` },
              compressed: { name: compressedFile.name, type: compressedFile.type, size: `${(compressedFile.size / 1024).toFixed(1)} KB` },
              compression: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`
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
  }, []);

  // Función simplificada para manejar compresión automática (basada en "Unir Imágenes")
  const manejarArchivoSeleccionado = async (field: keyof FileData, file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    console.log('📁 ARCHIVO SELECCIONADO:', field, file.name, file.type);

    // Actualizar estado de carga
    setCompressionStatus(prev => ({
      ...prev,
      [field]: { status: 'compressing', progress: 50, stage: 'Comprimiendo...' }
    }));

    try {
      // Comprimir automáticamente
      const compressedFile = await comprimirImagenWebP(file);
      
      // Calcular tamaños
      const originalSize = file.size;
      const compressedSize = compressedFile.size;
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

      // Actualizar estados
      setFormData(prev => ({ ...prev, [field]: file })); // Archivo original para referencia
      setCompressedFiles(prev => ({ ...prev, [field]: compressedFile })); // Archivo comprimido
      setFileSizes(prev => ({ ...prev, [field]: { original: originalSize, compressed: compressedSize } }));
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { 
          status: 'completed', 
          progress: 100, 
          stage: `✅ Listo - ${compressionRatio}% compresión` 
        }
      }));

      console.log('🎯 COMPRESIÓN EXITOSA:', field, `${compressionRatio}% reducción`);

    } catch (error) {
      console.error('❌ ERROR EN COMPRESIÓN:', error);
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { 
          status: 'error', 
          progress: 0, 
          stage: '❌ Error en compresión', 
          error: (error as Error).message 
        }
      }));
      showError(`Error comprimiendo ${field}: ${(error as Error).message}`);
    }
  };

  const handleFileChange = (field: keyof FileData, file: File | null) => {
    if (error) setError(null);
    
    if (file) {
      // Iniciar compresión automática
      manejarArchivoSeleccionado(field, file);
    } else {
      // Limpiar estados si se remueve el archivo
      setFormData(prev => ({ ...prev, [field]: '' }));
      setCompressedFiles(prev => ({ ...prev, [field]: null }));
      setFileSizes(prev => ({ ...prev, [field]: { original: 0, compressed: 0 } }));
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { status: 'idle', progress: 0, stage: '' }
      }));
    }
  };

  // Función para limpiar archivo seleccionado
  const clearFile = (field: keyof FileData) => {
    handleFileChange(field, null);
    
    // Limpiar también los inputs de archivo
    if (field === 'evidencia_01') {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } else if (field === 'evidencia_02') {
      if (fileInputRef2.current) fileInputRef2.current.value = '';
      if (cameraInputRef2.current) cameraInputRef2.current.value = '';
    } else if (field === 'evidencia_03') {
      if (fileInputRef3.current) fileInputRef3.current.value = '';
      if (cameraInputRef3.current) cameraInputRef3.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const nowISO = fechaLocal.toISOString();

      for (const field of requiredFields) {
        if (!formData[field]) {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setError(`El campo "${fieldName}" es obligatorio.`);
          return;
        }
      }
      
      if (showEvidenceFields && !formData.evidencia_01) {
        setError('El campo "Evidencia 1" es obligatorio cuando se selecciona Check in, Upsell, o Back to Back.');
        return;
      }

      // Primero guardar el registro en Supabase con URLs temporales
      const uploadedUrls = {
        evidencia_01: '',
        evidencia_02: '',
        evidencia_03: '',
      };

      const { faltantes, accesorios_secadora_faltante, ...restOfFormData } = formData;

      const notas_completas = [
        accesorios_secadora_faltante || '',
        faltantes || ''
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase
        .from('revisiones_casitas')
        .insert([
          {
            casita: formData.casita,
            quien_revisa: formData.quien_revisa,
            caja_fuerte: formData.caja_fuerte,
            puertas_ventanas: formData.puertas_ventanas,
            chromecast: formData.chromecast,
            binoculares: formData.binoculares,
            trapo_binoculares: formData.trapo_binoculares,
            speaker: formData.speaker,
            usb_speaker: formData.usb_speaker,
            controles_tv: formData.controles_tv,
            secadora: formData.secadora,
            accesorios_secadora: formData.accesorios_secadora,
            steamer: formData.steamer,
            bolsa_vapor: formData.bolsa_vapor,
            plancha_cabello: formData.plancha_cabello,
            bulto: formData.bulto,
            sombrero: formData.sombrero,
            bolso_yute: formData.bolso_yute,
            camas_ordenadas: formData.camas_ordenadas,
            cola_caballo: formData.cola_caballo,
            notas: notas_completas,
            evidencia_01: uploadedUrls.evidencia_01,
            evidencia_02: uploadedUrls.evidencia_02,
            evidencia_03: uploadedUrls.evidencia_03,
            created_at: nowISO
          }
        ])
        .select();

      if (error) throw error;

      // Obtener el ID del registro creado
      const recordId = data?.[0]?.id;
      
              if (recordId) {
        // Contar archivos a subir
        const filesToUpload = [];
        if (formData.evidencia_01 instanceof File) filesToUpload.push('evidencia_01');
        if (formData.evidencia_02 instanceof File) filesToUpload.push('evidencia_02');
        if (formData.evidencia_03 instanceof File) filesToUpload.push('evidencia_03');

        if (filesToUpload.length > 0) {
          // Inicializar progreso de subida
          setOverallUploadProgress({
            totalFiles: filesToUpload.length,
            completedFiles: 0,
            currentStage: 'Iniciando subida de imágenes...',
            isUploading: true
          });

          const uploadPromises = [];
          
          // Subir evidencia_01
          if (formData.evidencia_01 instanceof File) {
            const fileToUpload = compressedFiles.evidencia_01 || formData.evidencia_01;
            console.log('Preparando evidencia_01:', fileToUpload.name, fileToUpload.size);
            
            setUploadProgress(prev => ({
              ...prev,
              evidencia_01: { status: 'uploading', progress: 0, stage: 'Subiendo evidencia 1...' }
            }));
            
            const uploadPromise = uploadToImageKitClient(fileToUpload, 'evidencias').then(async (url: string) => {
              setUploadProgress(prev => ({
                ...prev,
                evidencia_01: { status: 'uploading', progress: 50, stage: 'Actualizando base de datos...' }
              }));

              // Actualizar el registro en Supabase con la URL
              const { error: updateError } = await supabase
                .from('revisiones_casitas')
                .update({ evidencia_01: url })
                .eq('id', recordId);
              
              if (updateError) {
                console.error('Error actualizando evidencia_01:', updateError);
                throw updateError;
              }
              
              setUploadProgress(prev => ({
                ...prev,
                evidencia_01: { status: 'completed', progress: 100, stage: '✅ Evidencia 1 completada' }
              }));

              setOverallUploadProgress(prev => ({
                ...prev,
                completedFiles: prev.completedFiles + 1,
                currentStage: `Evidencia 1 completada (${prev.completedFiles + 1}/${prev.totalFiles})`
              }));
              
              console.log('✅ Evidencia_01 subida y actualizada:', url);
              return url;
            });
            
            uploadPromises.push(uploadPromise);
          }
          
          // Subir evidencia_02
          if (formData.evidencia_02 instanceof File) {
            const fileToUpload = compressedFiles.evidencia_02 || formData.evidencia_02;
            console.log('Preparando evidencia_02:', fileToUpload.name, fileToUpload.size);
            
            setUploadProgress(prev => ({
              ...prev,
              evidencia_02: { status: 'uploading', progress: 0, stage: 'Subiendo evidencia 2...' }
            }));
            
            const uploadPromise = uploadToImageKitClient(fileToUpload, 'evidencias').then(async (url: string) => {
              setUploadProgress(prev => ({
                ...prev,
                evidencia_02: { status: 'uploading', progress: 50, stage: 'Actualizando base de datos...' }
              }));

              // Actualizar el registro en Supabase con la URL
              const { error: updateError } = await supabase
                .from('revisiones_casitas')
                .update({ evidencia_02: url })
                .eq('id', recordId);
              
              if (updateError) {
                console.error('Error actualizando evidencia_02:', updateError);
                throw updateError;
              }
              
              setUploadProgress(prev => ({
                ...prev,
                evidencia_02: { status: 'completed', progress: 100, stage: '✅ Evidencia 2 completada' }
              }));

              setOverallUploadProgress(prev => ({
                ...prev,
                completedFiles: prev.completedFiles + 1,
                currentStage: `Evidencia 2 completada (${prev.completedFiles + 1}/${prev.totalFiles})`
              }));
              
              console.log('✅ Evidencia_02 subida y actualizada:', url);
              return url;
            });
            
            uploadPromises.push(uploadPromise);
          }
          
          // Subir evidencia_03
          if (formData.evidencia_03 instanceof File) {
            const fileToUpload = compressedFiles.evidencia_03 || formData.evidencia_03;
            console.log('Preparando evidencia_03:', fileToUpload.name, fileToUpload.size);
            
            setUploadProgress(prev => ({
              ...prev,
              evidencia_03: { status: 'uploading', progress: 0, stage: 'Subiendo evidencia 3...' }
            }));
            
            const uploadPromise = uploadToImageKitClient(fileToUpload, 'evidencias').then(async (url: string) => {
              setUploadProgress(prev => ({
                ...prev,
                evidencia_03: { status: 'uploading', progress: 50, stage: 'Actualizando base de datos...' }
              }));

              // Actualizar el registro en Supabase con la URL
              const { error: updateError } = await supabase
                .from('revisiones_casitas')
                .update({ evidencia_03: url })
                .eq('id', recordId);
              
              if (updateError) {
                console.error('Error actualizando evidencia_03:', updateError);
                throw updateError;
              }
              
              setUploadProgress(prev => ({
                ...prev,
                evidencia_03: { status: 'completed', progress: 100, stage: '✅ Evidencia 3 completada' }
              }));

              setOverallUploadProgress(prev => ({
                ...prev,
                completedFiles: prev.completedFiles + 1,
                currentStage: `Evidencia 3 completada (${prev.completedFiles + 1}/${prev.totalFiles})`
              }));
              
              console.log('✅ Evidencia_03 subida y actualizada:', url);
              return url;
            });
            
            uploadPromises.push(uploadPromise);
          }

          console.log('Total archivos a subir:', uploadPromises.length);

          // Subir todas las imágenes en paralelo
          await Promise.all(uploadPromises);

          // Limpiar archivos de RAM después de subir exitosamente
          setCompressedFiles({
            evidencia_01: null,
            evidencia_02: null,
            evidencia_03: null,
          });

          setOverallUploadProgress(prev => ({
            ...prev,
            currentStage: '🎉 ¡Todas las imágenes subidas exitosamente!',
            isUploading: false
          }));
        }
      }

      // Mostrar mensaje de éxito
      const hasImages = formData.evidencia_01 instanceof File || formData.evidencia_02 instanceof File || formData.evidencia_03 instanceof File;
      
      if (hasImages) {
        showSuccess('Formulario guardado exitosamente. Las imágenes se están subiendo...');
      } else {
        showSuccess('Formulario guardado exitosamente.');
      }

      // Limpiar todos los campos y estados para permitir rellenar de nuevo
      clearLocalStorage();
      setFormData({ ...initialFormData, quien_revisa: user || '' });
      setCompressedFiles({ evidencia_01: null, evidencia_02: null, evidencia_03: null });
      setFileSizes({
        evidencia_01: { original: 0, compressed: 0 },
        evidencia_02: { original: 0, compressed: 0 },
        evidencia_03: { original: 0, compressed: 0 },
      });
      setCompressionStatus({
        evidencia_01: { status: 'idle', progress: 0, stage: '' },
        evidencia_02: { status: 'idle', progress: 0, stage: '' },
        evidencia_03: { status: 'idle', progress: 0, stage: '' },
      });
      setUploadProgress({
        evidencia_01: { status: 'idle', progress: 0, stage: '' },
        evidencia_02: { status: 'idle', progress: 0, stage: '' },
        evidencia_03: { status: 'idle', progress: 0, stage: '' },
      });
      setOverallUploadProgress({
        totalFiles: 0,
        completedFiles: 0,
        currentStage: '',
        isUploading: false
      });
      setHighlightedField('casita');
      // Limpiar inputs de archivos
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (fileInputRef2.current) fileInputRef2.current.value = '';
      if (fileInputRef3.current) fileInputRef3.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (cameraInputRef2.current) cameraInputRef2.current.value = '';
      if (cameraInputRef3.current) cameraInputRef3.current.value = '';
      
      // Scroll automático hacia arriba después de limpiar - Solo si NO es modo rendimiento
      if (!isSpecialModeActive) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
      }
      
      // NO redirigir, solo limpiar
      // router.push('/');
    } catch (error: any) {
      console.error('Error al guardar la revisión:', error);
      setError(error.message);
      showError(`Error al guardar la revisión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Modificar los estilos de los campos para incluir el resaltado
  const getHighlightStyle = (fieldName: string) => {
    if (highlightedField === fieldName) {
      return 'animate-pulse border-2 border-[#00ff00] shadow-[0_0_15px_#00ff00]';
    }
    return '';
  };

  // Componente para mostrar el estado de compresión


  return (
    <main style={spectacularBg} className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-[#2a3347] rounded-xl shadow-2xl p-4 md:p-8 border border-[#3d4659]">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="relative">
              {/* Efecto de resplandor sutil - Solo si NO es modo especial */}
              {!isSpecialModeActive && (
                <div className="absolute -inset-1 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 blur-lg rounded-xl"></div>
              )}
              
              <h1 className="relative text-2xl md:text-4xl lg:text-5xl font-black tracking-tight">
                <span className={isSpecialModeActive 
                  ? "block text-[#c9a45c]" 
                  : "block bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-[#ff8c42] bg-clip-text text-transparent drop-shadow-lg"
                }>
                  Nueva
                </span>
                <span className={isSpecialModeActive 
                  ? "block text-[#f0c987] mt-1" 
                  : "block bg-gradient-to-r from-[#f0c987] via-[#c9a45c] to-[#ff8c42] bg-clip-text text-transparent mt-1 transform translate-x-1"
                }>
                  Revisión
                </span>
              </h1>
              
              {/* Línea decorativa animada - Solo si NO es modo especial */}
              {!isSpecialModeActive && (
                <div className="relative mt-2 h-0.5 w-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
                        <button
              type="button"
              onClick={() => router.push('/')}
              className={
                isSpecialModeActive
                  ? "text-sm bg-gray-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 border border-gray-600"
                  : "text-sm text-white bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border border-gray-600/40 hover:border-gray-500/60 font-medium flex items-center justify-center gap-2"
              }
              style={{ padding: '10px 18px' }}
            >
              {/* Efecto de brillo continuo solo si NO es modo especial */}
              {!isSpecialModeActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
              )}
              <div className="relative z-10 flex items-center gap-2">
                Volver
              </div>
            </button>
          </div>



          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Casita <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    ref={fieldRefs.current['casita']}
                    required
                    className={`w-full px-4 py-3 md:py-4 ${isSpecialModeActive 
                      ? 'bg-[#2a3347] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 appearance-none cursor-pointer' 
                      : 'bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm appearance-none cursor-pointer'
                    } ${getHighlightStyle('casita')}`}
                    value={formData.casita}
                    onChange={(e) => handleInputChange('casita', e.target.value)}
                  >
                    <option value="" className="bg-[#1e2538] text-gray-400">Seleccionar casita</option>
                    {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num} className="bg-[#1e2538] text-white">{num}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Quien revisa <span className="text-red-500">*</span>
                </label>
                {user ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={user}
                      readOnly
                      className={`w-full px-4 py-3 md:py-4 bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 backdrop-blur-sm cursor-not-allowed opacity-80 ${getHighlightStyle('quien_revisa')}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      ref={fieldRefs.current['quien_revisa']}
                      required
                      className="w-full px-4 py-3 md:py-4 bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm appearance-none cursor-pointer"
                      value={formData.quien_revisa}
                      onChange={(e) => handleInputChange('quien_revisa', e.target.value)}
                    >
                      <option value="" className="bg-[#1e2538] text-gray-400">Seleccionar persona</option>
                      {nombresRevisores.map(nombre => (
                        <option key={nombre} value={nombre} className="bg-[#1e2538] text-white">{nombre}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div ref={fieldRefs.current['caja_fuerte']}>
              <ButtonGroup
                label="Guardado en la caja fuerte?"
                options={['Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room']}
                selectedValue={formData.caja_fuerte}
                onSelect={(value) => handleInputChange('caja_fuerte', value)}
                required
                highlight={highlightedField === 'caja_fuerte'}
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21m-4.5 0H2.36m11.04 0H21m-1.5 0H9.375a1.125 1.125 0 01-1.125-1.125v-11.25c0-1.125.504-2.25 1.125-2.25H15a2.25 2.25 0 012.25 2.25v11.25c0 .621-.504 1.125-1.125 1.125z" />
                </svg>
                ¿Puertas y ventanas? (revisar casa por fuera) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fieldRefs.current['puertas_ventanas']}
                  type="text"
                  required
                  className={`w-full px-4 py-3 md:py-4 ${isSpecialModeActive 
                    ? 'bg-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50' 
                    : 'bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm'
                  } ${getHighlightStyle('puertas_ventanas')}`}
                  value={formData.puertas_ventanas}
                  onChange={(e) => handleInputChange('puertas_ventanas', e.target.value)}
                  placeholder="Estado de puertas y ventanas"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-[#c9a45c]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div ref={fieldRefs.current['chromecast']}>
                <ButtonGroup 
                  label="Chromecast" 
                  options={['0', '01', '02', '03', '04']} 
                  selectedValue={formData.chromecast} 
                  onSelect={v => handleInputChange('chromecast', v)} 
                  required 
                  highlight={highlightedField === 'chromecast'}
                />
              </div>
              <div ref={fieldRefs.current['binoculares']}>
                <ButtonGroup 
                  label="Binoculares" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.binoculares} 
                  onSelect={v => handleInputChange('binoculares', v)} 
                  required 
                  highlight={highlightedField === 'binoculares'}
                />
              </div>
              <div ref={fieldRefs.current['trapo_binoculares']}>
                <ButtonGroup 
                  label="Trapo para los binoculares" 
                  options={['Si', 'No']} 
                  selectedValue={formData.trapo_binoculares} 
                  onSelect={v => handleInputChange('trapo_binoculares', v)} 
                  required 
                  highlight={highlightedField === 'trapo_binoculares'}
                />
              </div>
              <div ref={fieldRefs.current['speaker']}>
                <ButtonGroup 
                  label="Speaker" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.speaker} 
                  onSelect={v => handleInputChange('speaker', v)} 
                  required 
                  highlight={highlightedField === 'speaker'}
                />
              </div>
              <div ref={fieldRefs.current['usb_speaker']}>
                <ButtonGroup 
                  label="USB Speaker" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.usb_speaker} 
                  onSelect={v => handleInputChange('usb_speaker', v)} 
                  required 
                  highlight={highlightedField === 'usb_speaker'}
                />
              </div>
              <div ref={fieldRefs.current['controles_tv']}>
                <ButtonGroup 
                  label="Controles TV" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.controles_tv} 
                  onSelect={v => handleInputChange('controles_tv', v)} 
                  required 
                  highlight={highlightedField === 'controles_tv'}
                />
              </div>
              <div ref={fieldRefs.current['secadora']}>
                <ButtonGroup 
                  label="Secadora" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.secadora} 
                  onSelect={v => handleInputChange('secadora', v)} 
                  required 
                  highlight={highlightedField === 'secadora'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                  Accesorios secadora <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    ref={fieldRefs.current['accesorios_secadora']}
                    required
                    className={`w-full px-4 py-3 md:py-4 bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm appearance-none cursor-pointer ${getHighlightStyle('accesorios_secadora')}`}
                    value={formData.accesorios_secadora}
                    onChange={(e) => handleInputChange('accesorios_secadora', e.target.value)}
                  >
                    <option value="" className="bg-[#1e2538] text-gray-400">Seleccionar cantidad</option>
                    <option key="0" value="0" className="bg-[#1e2538] text-white">0</option>
                    {Array.from({ length: 8 }, (_, i) => String(i + 1).padStart(2, '0')).map(num => (
                      <option key={num} value={num} className="bg-[#1e2538] text-white">{num}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  En caso de faltar un accesorio. Cual es?
                </label>
                <div className="relative">
                  <input
                    ref={fieldRefs.current['accesorios_secadora_faltante']}
                    type="text"
                    className="w-full px-4 py-3 md:py-4 bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm"
                    value={formData.accesorios_secadora_faltante}
                    onChange={(e) => handleInputChange('accesorios_secadora_faltante', e.target.value)}
                    placeholder="Describe el accesorio faltante"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-[#c9a45c]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div ref={fieldRefs.current['steamer']}>
                <ButtonGroup 
                  label="Steamer (plancha a vapor)" 
                  options={['0', '01', '02']} 
                  selectedValue={formData.steamer} 
                  onSelect={v => handleInputChange('steamer', v)} 
                  required 
                  highlight={highlightedField === 'steamer'}
                />
              </div>
              <div ref={fieldRefs.current['bolsa_vapor']}>
                <ButtonGroup 
                  label="Bolsa de vapor (plancha vapor)" 
                  options={['Si', 'No']} 
                  selectedValue={formData.bolsa_vapor} 
                  onSelect={v => handleInputChange('bolsa_vapor', v)} 
                  required 
                  highlight={highlightedField === 'bolsa_vapor'}
                />
              </div>
              <div ref={fieldRefs.current['plancha_cabello']}>
                <ButtonGroup 
                  label="Plancha cabello" 
                  options={['0', '01', '02']} 
                  selectedValue={formData.plancha_cabello} 
                  onSelect={v => handleInputChange('plancha_cabello', v)} 
                  required 
                  highlight={highlightedField === 'plancha_cabello'}
                />
              </div>
              <div ref={fieldRefs.current['bulto']}>
                <ButtonGroup 
                  label="Bulto" 
                  options={['0', '01', '02']} 
                  selectedValue={formData.bulto} 
                  onSelect={v => handleInputChange('bulto', v)} 
                  required 
                  highlight={highlightedField === 'bulto'}
                />
              </div>
              <div ref={fieldRefs.current['sombrero']}>
                <ButtonGroup 
                  label="Sombrero" 
                  options={['0', '01', '02']} 
                  selectedValue={formData.sombrero} 
                  onSelect={v => handleInputChange('sombrero', v)} 
                  required 
                  highlight={highlightedField === 'sombrero'}
                />
              </div>
              <div ref={fieldRefs.current['bolso_yute']}>
                <ButtonGroup 
                  label="Bolso yute" 
                  options={['0', '01', '02', '03']} 
                  selectedValue={formData.bolso_yute} 
                  onSelect={v => handleInputChange('bolso_yute', v)} 
                  required 
                  highlight={highlightedField === 'bolso_yute'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div ref={fieldRefs.current['camas_ordenadas']}>
                <ButtonGroup 
                  label="Camas ordenadas" 
                  options={['Si', 'No']} 
                  selectedValue={formData.camas_ordenadas} 
                  onSelect={v => handleInputChange('camas_ordenadas', v)} 
                  required 
                  highlight={highlightedField === 'camas_ordenadas'}
                />
              </div>
              <div ref={fieldRefs.current['cola_caballo']}>
                <ButtonGroup 
                  label="Cola de caballo" 
                  options={['Si', 'No']} 
                  selectedValue={formData.cola_caballo} 
                  onSelect={v => handleInputChange('cola_caballo', v)} 
                  required 
                  highlight={highlightedField === 'cola_caballo'}
                />
              </div>
            </div>

            {showEvidenceFields && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-[#ff8c42]">Evidencia 1 (URL) <span className="text-red-500">*</span></label>
                  
                  {!(formData.evidencia_01 instanceof File) ? (
                    // Mostrar botones de selección cuando no hay archivo
                    <div className="flex gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_01', file);
                          }
                        }}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_01', file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="font-medium">Galería</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (cameraInputRef.current) {
                            cameraInputRef.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="font-medium">Cámara</span>
                      </button>
                    </div>
                  ) : (
                    // Mostrar archivo seleccionado con botón de eliminar
                    <div className="group relative overflow-hidden bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl p-4 hover:border-[#c9a45c]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#c9a45c]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#c9a45c] to-[#d4b06c] rounded-xl flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a1f35]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-medium">Evidencia 1</div>
                            {/* Barra de progreso de compresión */}
                            {compressionStatus.evidencia_01.status !== 'idle' && (
                              <div className="mt-2">
                                {compressionStatus.evidencia_01.status === 'compressing' && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 bg-[#c9a45c] rounded-full animate-pulse"></div>
                                      <span className="text-[#c9a45c] text-xs font-medium">{compressionStatus.evidencia_01.stage}</span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                      <div 
                                        className="bg-gradient-to-r from-[#c9a45c] to-[#f0c987] h-1.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${compressionStatus.evidencia_01.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                {compressionStatus.evidencia_01.status === 'completed' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 text-xs font-medium">{compressionStatus.evidencia_01.stage}</span>
                                  </div>
                                )}
                                {compressionStatus.evidencia_01.status === 'error' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-red-400 text-xs font-medium">❌ Error: {compressionStatus.evidencia_01.error}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Información de tamaños */}
                            {fileSizes.evidencia_01.original > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {(fileSizes.evidencia_01.original / 1024).toFixed(1)} KB → {(fileSizes.evidencia_01.compressed / 1024).toFixed(1)} KB
                              </div>
                            )}
                                                        {/* Botones de acción para imagen */}
                            {formData.evidencia_01 instanceof File && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Usar imagen comprimida si está disponible, sino la original
                                    const fileToShow = compressedFiles.evidencia_01 || (formData.evidencia_01 instanceof File ? formData.evidencia_01 : null);
                                    if (!fileToShow) return;
                                    
                                    const url = URL.createObjectURL(fileToShow);
                                    openModal(url);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver pantalla completa
                                </button>
                                
                                {compressedFiles.evidencia_01 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const compressedFile = compressedFiles.evidencia_01;
                                      if (!compressedFile) return;
                                      
                                      const url = URL.createObjectURL(compressedFile);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = compressedFile.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearFile('evidencia_01')}
                          className="w-9 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                          title="Eliminar imagen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-[#ff8c42]">Evidencia 2 (URL)</label>
                  
                  {!(formData.evidencia_02 instanceof File) ? (
                    <div className="flex gap-4">
                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_02', file);
                          }
                        }}
                      />
                      <input
                        ref={cameraInputRef2}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_02', file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef2.current) {
                            fileInputRef2.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="font-medium">Galería</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (cameraInputRef2.current) {
                            cameraInputRef2.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="font-medium">Cámara</span>
                      </button>
                    </div>
                  ) : (
                    <div className="group relative overflow-hidden bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl p-4 hover:border-[#c9a45c]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#c9a45c]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#c9a45c] to-[#d4b06c] rounded-xl flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a1f35]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-medium">Evidencia 2</div>
                            {/* Barra de progreso de compresión */}
                            {compressionStatus.evidencia_02.status !== 'idle' && (
                              <div className="mt-2">
                                {compressionStatus.evidencia_02.status === 'compressing' && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 bg-[#c9a45c] rounded-full animate-pulse"></div>
                                      <span className="text-[#c9a45c] text-xs font-medium">{compressionStatus.evidencia_02.stage}</span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                      <div 
                                        className="bg-gradient-to-r from-[#c9a45c] to-[#f0c987] h-1.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${compressionStatus.evidencia_02.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                {compressionStatus.evidencia_02.status === 'completed' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 text-xs font-medium">{compressionStatus.evidencia_02.stage}</span>
                                  </div>
                                )}
                                {compressionStatus.evidencia_02.status === 'error' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-red-400 text-xs font-medium">❌ Error: {compressionStatus.evidencia_02.error}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Información de tamaños */}
                            {fileSizes.evidencia_02.original > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {(fileSizes.evidencia_02.original / 1024).toFixed(1)} KB → {(fileSizes.evidencia_02.compressed / 1024).toFixed(1)} KB
                              </div>
                            )}
                            {/* Botones de acción para imagen */}
                            {formData.evidencia_02 instanceof File && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Usar imagen comprimida si está disponible, sino la original
                                    const fileToShow = compressedFiles.evidencia_02 || (formData.evidencia_02 instanceof File ? formData.evidencia_02 : null);
                                    if (!fileToShow) return;
                                    
                                    const url = URL.createObjectURL(fileToShow);
                                    openModal(url);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver pantalla completa
                                </button>
                                
                                {compressedFiles.evidencia_02 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const compressedFile = compressedFiles.evidencia_02;
                                      if (!compressedFile) return;
                                      
                                      const url = URL.createObjectURL(compressedFile);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = compressedFile.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearFile('evidencia_02')}
                          className="w-9 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                          title="Eliminar imagen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-[#ff8c42]">Evidencia 3 (URL)</label>
                  
                  {!(formData.evidencia_03 instanceof File) ? (
                    <div className="flex gap-4">
                      <input
                        ref={fileInputRef3}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_03', file);
                          }
                        }}
                      />
                      <input
                        ref={cameraInputRef3}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange('evidencia_03', file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef3.current) {
                            fileInputRef3.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="font-medium">Galería</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (cameraInputRef3.current) {
                            cameraInputRef3.current.click();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:border-[#c9a45c]/50 hover:shadow-lg hover:shadow-[#c9a45c]/10 transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-[#c9a45c] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="font-medium">Cámara</span>
                      </button>
                    </div>
                  ) : (
                    <div className="group relative overflow-hidden bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl p-4 hover:border-[#c9a45c]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#c9a45c]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#c9a45c] to-[#d4b06c] rounded-xl flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a1f35]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-medium">Evidencia 3</div>
                            {/* Barra de progreso de compresión */}
                            {compressionStatus.evidencia_03.status !== 'idle' && (
                              <div className="mt-2">
                                {compressionStatus.evidencia_03.status === 'compressing' && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 bg-[#c9a45c] rounded-full animate-pulse"></div>
                                      <span className="text-[#c9a45c] text-xs font-medium">{compressionStatus.evidencia_03.stage}</span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                      <div 
                                        className="bg-gradient-to-r from-[#c9a45c] to-[#f0c987] h-1.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${compressionStatus.evidencia_03.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                {compressionStatus.evidencia_03.status === 'completed' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 text-xs font-medium">{compressionStatus.evidencia_03.stage}</span>
                                  </div>
                                )}
                                {compressionStatus.evidencia_03.status === 'error' && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-red-400 text-xs font-medium">❌ Error: {compressionStatus.evidencia_03.error}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Información de tamaños */}
                            {fileSizes.evidencia_03.original > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {(fileSizes.evidencia_03.original / 1024).toFixed(1)} KB → {(fileSizes.evidencia_03.compressed / 1024).toFixed(1)} KB
                              </div>
                            )}
                            {/* Botones de acción para imagen */}
                            {formData.evidencia_03 instanceof File && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Usar imagen comprimida si está disponible, sino la original
                                    const fileToShow = compressedFiles.evidencia_03 || (formData.evidencia_03 instanceof File ? formData.evidencia_03 : null);
                                    if (!fileToShow) return;
                                    
                                    const url = URL.createObjectURL(fileToShow);
                                    openModal(url);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver pantalla completa
                                </button>
                                
                                {compressedFiles.evidencia_03 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const compressedFile = compressedFiles.evidencia_03;
                                      if (!compressedFile) return;
                                      
                                      const url = URL.createObjectURL(compressedFile);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = compressedFile.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearFile('evidencia_03')}
                          className="w-9 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                          title="Eliminar imagen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                Notas
              </label>
              <div className="relative">
                <textarea
                  ref={fieldRefs.current['faltantes']}
                  className={`w-full px-4 py-3 md:py-4 ${isSpecialModeActive 
                    ? 'bg-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 resize-none' 
                    : 'bg-gradient-to-br from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 hover:shadow-lg hover:shadow-[#c9a45c]/10 backdrop-blur-sm resize-none'
                  }`}
                  value={formData.faltantes}
                  onChange={(e) => handleInputChange('faltantes', e.target.value)}
                  placeholder="Describe cualquier otro elemento faltante o comentario general..."
                  rows={4}
                />
                <div className="absolute top-4 right-4 pointer-events-none">
                  <svg className="w-5 h-5 text-[#c9a45c]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {error && (
                <div className={`bg-red-500/10 border border-red-500/30 rounded-xl p-4 ${isSpecialModeActive ? '' : 'backdrop-blur-sm'}`}>
                  <p className="text-red-400 text-center font-medium">{error}</p>
                </div>
              )}

              {/* Barra de progreso de subida */}
              {overallUploadProgress.isUploading && (
                <div className={`${isSpecialModeActive ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 backdrop-blur-sm'} rounded-xl p-4`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-400 font-medium">Subiendo imágenes</span>
                    <span className="text-gray-300 text-sm">
                      ({overallUploadProgress.completedFiles}/{overallUploadProgress.totalFiles})
                    </span>
                  </div>
                  
                  {/* Barra de progreso general */}
                  <div className="w-full bg-gray-700/50 rounded-full h-2 mb-3">
                    <div 
                      className={isSpecialModeActive ? "bg-blue-500 h-2 rounded-full" : "bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 ease-out"}
                      style={{ 
                        width: `${(overallUploadProgress.completedFiles / overallUploadProgress.totalFiles) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-300 text-sm">{overallUploadProgress.currentStage}</p>
                  
                  {/* Progreso individual de cada archivo */}
                  <div className="mt-3 space-y-2">
                    {uploadProgress.evidencia_01.status !== 'idle' && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400 min-w-[80px]">Evidencia 1:</span>
                        <div className="flex-1 bg-gray-700/30 rounded-full h-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.evidencia_01.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-xs">{uploadProgress.evidencia_01.stage}</span>
                      </div>
                    )}
                    
                    {uploadProgress.evidencia_02.status !== 'idle' && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400 min-w-[80px]">Evidencia 2:</span>
                        <div className="flex-1 bg-gray-700/30 rounded-full h-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.evidencia_02.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-xs">{uploadProgress.evidencia_02.stage}</span>
                      </div>
                    )}
                    
                    {uploadProgress.evidencia_03.status !== 'idle' && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400 min-w-[80px]">Evidencia 3:</span>
                        <div className="flex-1 bg-gray-700/30 rounded-full h-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.evidencia_03.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-xs">{uploadProgress.evidencia_03.stage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold px-8 py-4 rounded-xl ${isSpecialModeActive 
                  ? 'bg-[#c9a45c] text-[#1a1f35] border-2 border-[#c9a45c]' 
                  : 'transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2'
                } ${
                  loading
                    ? isSpecialModeActive 
                      ? 'bg-green-500 text-white border-green-500 cursor-wait' 
                      : 'bg-gradient-to-r from-green-500 via-green-400 to-green-500 text-white border-green-400 animate-pulse cursor-wait'
                    : isSpecialModeActive 
                      ? 'bg-[#c9a45c] text-[#1a1f35] border-[#c9a45c]' 
                      : 'bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] text-[#1a1f35] border-white/40 hover:border-white/60'
                } ${
                  !isSpecialModeActive && loading
                    ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] before:animate-[shimmer_1s_infinite] after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:animate-pulse'
                    : !isSpecialModeActive && !loading 
                      ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] before:animate-shimmer before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-100 after:transition-opacity after:duration-300'
                      : ''
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando y subiendo imágenes...
                    </>
                  ) : (
                    'Guardar Revisión'
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de imagen mejorado */}
      {modalOpen && modalImg && (
        <div className={`fixed inset-0 bg-black/90 ${isSpecialModeActive ? '' : 'backdrop-blur-sm'} flex items-center justify-center z-50 overflow-hidden`}>
          <div className="relative w-full h-full max-w-7xl max-h-screen overflow-hidden">
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
                src={modalImg}
                alt="Evidencia"
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
        </div>
      )}
    </main>
  );
} 