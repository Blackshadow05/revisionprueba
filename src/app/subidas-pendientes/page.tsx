'use client';

import { useUpload } from '@/context/UploadContext';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SubidasPendientes() {
  const router = useRouter();
  const { uploads, queueStatus, retryUpload, clearCompleted } = useUpload();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'uploading': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En cola';
      case 'uploading': return 'Subiendo...';
      case 'completed': return 'Completado';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 bg-yellow-500 rounded-full" />
        );
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  // Ordenar por fecha de creación (más recientes primero)
  const sortedUploads = [...uploads].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#2a3347] rounded-xl shadow-2xl p-4 md:p-8 border border-[#3d4659]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#c9a45c]">Monitor de Subidas</h1>
              <p className="text-gray-400 mt-1">Seguimiento de todas las subidas de imágenes</p>
            </div>
            <div className="flex gap-2">
              {queueStatus.completed > 0 && (
                <button
                  onClick={clearCompleted}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar completadas
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2.5 bg-[#c9a45c] hover:bg-[#d4b06c] text-[#1a1f35] rounded-xl text-sm font-medium transition-colors relative overflow-hidden flex items-center justify-center gap-2"
              >
                {/* Efecto de brillo continuo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
                <div className="relative z-10 flex items-center gap-2">
                  Volver
                </div>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1e2538] p-4 rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-yellow-500">{queueStatus.pending}</div>
              <div className="text-sm text-gray-400">En cola</div>
            </div>
            <div className="bg-[#1e2538] p-4 rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-blue-500">{queueStatus.uploading}</div>
              <div className="text-sm text-gray-400">Subiendo</div>
            </div>
            <div className="bg-[#1e2538] p-4 rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-green-500">{queueStatus.completed}</div>
              <div className="text-sm text-gray-400">Completadas</div>
            </div>
            <div className="bg-[#1e2538] p-4 rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-red-500">{queueStatus.error}</div>
              <div className="text-sm text-gray-400">Errores</div>
            </div>
          </div>

          {/* Lista de subidas */}
          {sortedUploads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#1e2538] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No hay subidas</h3>
              <p className="text-gray-400">Las subidas de imágenes aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedUploads.map((upload, index) => (
                <div key={`pending-page-${upload.id}-${index}`} className="bg-[#1e2538] p-4 rounded-lg border border-[#3d4659]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Estado */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(upload.status)}
                      </div>

                      {/* Información del archivo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{upload.fileName}</h3>
                          <span className={`text-sm font-medium ${getStatusColor(upload.status)}`}>
                            {getStatusText(upload.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Campo: {upload.fieldName}</span>
                          <span>
                            Creado {formatDistanceToNow(new Date(upload.createdAt), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                          {upload.completedAt && (
                            <span>
                              Completado {formatDistanceToNow(new Date(upload.completedAt), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {upload.status === 'error' && (
                        <button
                          onClick={() => retryUpload(upload.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Reintentar
                        </button>
                      )}
                      {upload.status === 'completed' && upload.url && (
                        <a
                          href={upload.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Ver imagen
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Error message */}
                  {upload.status === 'error' && upload.error && (
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                      <div className="text-red-400 text-sm">
                        <strong>Error:</strong> {upload.error}
                      </div>
                      {upload.retryCount && upload.retryCount > 0 && (
                        <div className="text-red-300 text-xs mt-1">
                          Intentos fallidos: {upload.retryCount}
                        </div>
                      )}
                    </div>
                  )}

                  {/* URL de la imagen completada */}
                  {upload.status === 'completed' && upload.url && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                      <div className="text-green-400 text-sm">
                        <strong>URL:</strong> 
                        <a 
                          href={upload.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-green-300 hover:text-green-200 underline break-all"
                        >
                          {upload.url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 