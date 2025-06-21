'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getWeek } from 'date-fns';
import { uploadToImageKitClient } from '@/lib/imagekit-client';

interface NotaData {
  fecha: string;
  casita: string;
  nota: string;
  evidencia: File | null;
  Usuario: string;
}

const nombresRevisores = [
  'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
  'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
  'Cristopher G', 'Emerson S', 'Joseph R'
];

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular nuevas dimensiones manteniendo la proporción
        const maxSize = 1200;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function NuevaNota() {
  const router = useRouter();
  const [formData, setFormData] = useState<NotaData>({
    fecha: new Date().toISOString().split('T')[0],
    casita: '',
    nota: '',
    evidencia: null,
    Usuario: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar array de números del 1 al 50 para el dropdown
  const casitas = Array.from({ length: 50 }, (_, i) => (i + 1).toString());

  const handleInputChange = (field: keyof NotaData, value: string) => {
    if (error) setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (file: File | null) => {
    if (error) setError(null);
    if (file) {
      try {
        setFormData(prev => ({ ...prev, evidencia: file }));
      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        setError('Error al procesar la imagen');
      }
    } else {
      setFormData(prev => ({ ...prev, evidencia: null }));
    }
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          await handleFileChange(file);
        }
      }, 'image/jpeg');
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
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
      let evidenciaUrl = null;

      if (formData.evidencia) {
        console.log('📸 Subiendo imagen a ImageKit.io...');
        const compressedImage = await compressImage(formData.evidencia);
        
        // Subir directamente a ImageKit.io con organización automática por carpetas
        evidenciaUrl = await uploadToImageKitClient(compressedImage, 'notas');
        console.log('✅ Imagen subida exitosamente:', evidenciaUrl);
      }

      // Obtener fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      
      const { error } = await supabase
        .from('Notas')
        .insert([
          {
            fecha: fechaLocal.toISOString(),
            Casita: formData.casita,
            Usuario: formData.Usuario,
            nota: formData.nota,
            Evidencia: evidenciaUrl
          }
        ]);

      if (error) throw error;

      // Limpiar el formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        casita: '',
        nota: '',
        evidencia: null,
        Usuario: '',
      });
      setError(null);
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      console.error('Error al guardar la nota:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-[#2a3347] rounded-xl shadow-2xl p-4 md:p-8 border border-[#3d4659]">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#c9a45c]">Nueva Nota</h1>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md border border-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900/50 text-green-200 rounded-md border border-green-700">
              Nota guardada exitosamente
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Usuario</label>
              <select
                required
                className="w-full px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent"
                value={formData.Usuario}
                onChange={(e) => handleInputChange('Usuario', e.target.value)}
              >
                <option value="">Seleccione un usuario</option>
                {nombresRevisores.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Casita</label>
              <select
                required
                className="w-full px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent"
                value={formData.casita}
                onChange={(e) => handleInputChange('casita', e.target.value)}
              >
                <option value="">Seleccione una casita</option>
                {casitas.map((numero) => (
                  <option key={numero} value={numero}>
                    Casita {numero}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nota</label>
              <textarea
                required
                className="w-full px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent"
                rows={4}
                value={formData.nota}
                onChange={(e) => handleInputChange('nota', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Evidencia</label>
              <div className="flex gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white hover:bg-[#2a3347] transition-colors"
                >
                  Seleccionar archivo
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  className="px-4 py-2 bg-[#1a1f35] border border-[#3d4659] rounded-md text-white hover:bg-[#2a3347] transition-colors"
                >
                  Tomar foto
                </button>
              </div>
              {formData.evidencia && (
                <p className="mt-2 text-sm text-gray-400">
                  Archivo seleccionado: {formData.evidencia.name}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Formatos permitidos: JPG, PNG, GIF. Máximo 5MB
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#1e2538]/80 backdrop-blur-md rounded-xl hover:bg-[#262f47]/90 transition-all duration-200 shadow-[0_4px_8px_rgb(0_0_0/0.2)] hover:shadow-[0_8px_16px_rgb(0_0_0/0.3)] border border-[#3d4659]/50 hover:border-[#4a5573]/50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[#1a1f35] bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] rounded-xl hover:from-[#d4b06c] hover:via-[#e0bc7c] hover:to-[#f7d498] transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 border border-[#f0c987]/20 hover:border-[#f0c987]/40 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#1a1f35]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
} 