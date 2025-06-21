'use client';

import { useState } from 'react';
import { useHybridUpload } from '@/hooks/useHybridUpload';
import UploadMethodIndicator from '@/components/UploadMethodIndicator';

export default function TestUpload() {
  const { 
    uploadFile, 
    uploads, 
    clearCompleted, 
    getUploadStats, 
    preferredMethod, 
    deviceInfo,
    isReady 
  } = useHybridUpload();
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Crear un registro temporal para la prueba
      const testRecordId = `test_${Date.now()}`;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fieldName = `evidencia_0${i + 1}`;
        
        await uploadFile(file, testRecordId, fieldName);
      }
    } catch (error) {
      console.error('Error en la subida:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const stats = getUploadStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-8">
      <UploadMethodIndicator />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#2a3347] rounded-xl shadow-2xl p-8 border border-[#3d4659]">
          <h1 className="text-3xl font-bold text-[#c9a45c] mb-8">
            Prueba del Sistema Híbrido de Subidas
          </h1>

          {/* Información del sistema */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1e2538] rounded-lg p-4 border border-[#3d4659]">
              <h3 className="text-lg font-semibold text-[#ff8c42] mb-2">Método Detectado</h3>
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">
                    {preferredMethod === 'uppy' ? '🚀' : 
                     preferredMethod === 'hybrid' ? '⚡' : '🔧'}
                  </span>
                  <span className="font-medium">
                    {preferredMethod === 'uppy' ? 'Uppy' : 
                     preferredMethod === 'hybrid' ? 'Híbrido' : 'Service Worker'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {deviceInfo.isMobile ? 'Móvil' : 'Escritorio'} • {deviceInfo.browserName}
                </div>
              </div>
            </div>

            <div className="bg-[#1e2538] rounded-lg p-4 border border-[#3d4659]">
              <h3 className="text-lg font-semibold text-[#ff8c42] mb-2">Estado</h3>
              <div className="text-white">
                <div className={`flex items-center gap-2 ${isReady ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{isReady ? '✅' : '❌'}</span>
                  <span>{isReady ? 'Listo' : 'No disponible'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2538] rounded-lg p-4 border border-[#3d4659]">
              <h3 className="text-lg font-semibold text-[#ff8c42] mb-2">Estadísticas</h3>
              <div className="text-white text-sm space-y-1">
                <div>Total: {stats.total}</div>
                <div>Subiendo: {stats.uploading}</div>
                <div>Completadas: {stats.completed}</div>
                <div>Errores: {stats.error}</div>
              </div>
            </div>
          </div>

          {/* Selector de archivos */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-[#ff8c42] mb-4">
              Seleccionar Imágenes para Prueba
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="flex-1 px-4 py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c] file:text-[#1a1f35] hover:file:bg-[#d4b06c]"
              />
              <button
                onClick={handleUpload}
                disabled={!selectedFiles || selectedFiles.length === 0 || isUploading || !isReady}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  !selectedFiles || selectedFiles.length === 0 || isUploading || !isReady
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#c9a45c] to-[#d4b06c] text-[#1a1f35] hover:from-[#d4b06c] hover:to-[#e0bc7c] transform hover:scale-105'
                }`}
              >
                {isUploading ? 'Subiendo...' : 'Subir Archivos'}
              </button>
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                {selectedFiles.length} archivo(s) seleccionado(s)
              </div>
            )}
          </div>

          {/* Lista de subidas */}
          {uploads.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#ff8c42]">
                  Subidas ({uploads.length})
                </h3>
                {stats.completed > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="px-4 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white hover:bg-[#2a3347] transition-colors"
                  >
                    Limpiar Completadas
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="bg-[#1e2538] rounded-lg p-4 border border-[#3d4659]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {upload.method === 'uppy' ? '🚀' : '🔧'}
                        </span>
                        <div>
                          <div className="text-white font-medium">{upload.fileName}</div>
                          <div className="text-xs text-gray-400">
                            Método: {upload.method === 'uppy' ? 'Uppy' : 'Service Worker'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          upload.status === 'completed' ? 'text-green-400' :
                          upload.status === 'error' ? 'text-red-400' :
                          upload.status === 'uploading' ? 'text-blue-400' :
                          'text-gray-400'
                        }`}>
                          {upload.status === 'completed' ? '✅ Completado' :
                           upload.status === 'error' ? '❌ Error' :
                           upload.status === 'uploading' ? '⏳ Subiendo' :
                           '⏸️ Pendiente'}
                        </div>
                        {upload.status === 'uploading' && (
                          <div className="text-xs text-gray-400">
                            {upload.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {upload.status === 'uploading' && (
                      <div className="w-full bg-[#3d4659] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#c9a45c] to-[#d4b06c] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {upload.error && (
                      <div className="mt-2 text-sm text-red-400">
                        Error: {upload.error}
                      </div>
                    )}
                    
                    {upload.url && (
                      <div className="mt-2 text-sm text-green-400">
                        ✅ URL: {upload.url.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-[#1e2538] rounded-lg p-6 border border-[#3d4659]">
            <h3 className="text-lg font-semibold text-[#ff8c42] mb-4">
              Características del Sistema Híbrido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">🚀 Uppy (Móviles y Fallback)</h4>
                <ul className="space-y-1">
                  <li>✅ Subidas resumibles</li>
                  <li>✅ Compatible con todos los navegadores</li>
                  <li>✅ Optimizado para móviles</li>
                  <li>✅ Manejo robusto de errores</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">🔧 Service Worker (Escritorio)</h4>
                <ul className="space-y-1">
                  <li>✅ Subidas en segundo plano</li>
                  <li>✅ Continúa al cambiar pestañas</li>
                  <li>✅ Reintentos automáticos</li>
                  <li>✅ Persistencia local</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 