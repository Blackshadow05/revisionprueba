'use client';

import { useUpload } from '@/context/UploadContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UploadPersistence } from '@/utils/uploadPersistence';

export default function UploadIndicator() {
  const { queueStatus, uploads } = useUpload();
  const [isExpanded, setIsExpanded] = useState(false);
  const [persistedStats, setPersistedStats] = useState({ pending: 0, total: 0 });

  // Verificar subidas persistidas
  useEffect(() => {
    const stats = UploadPersistence.getSessionStats();
    setPersistedStats(stats);
  }, []);

  // Combinar estadísticas actuales con persistidas
  const totalPending = queueStatus.pending + persistedStats.pending;
  const totalActive = queueStatus.total + persistedStats.total;

  // No mostrar si no hay subidas activas
  if (totalActive === 0) return null;

  const hasActiveUploads = queueStatus.pending > 0 || queueStatus.uploading > 0;
  const hasErrors = queueStatus.error > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Indicador principal */}
      <div 
        className={`bg-[#2a3347] border border-[#3d4659] rounded-xl shadow-2xl p-4 cursor-pointer transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Icono de estado */}
          <div className="relative">
            {hasActiveUploads ? (
              <div className="w-6 h-6 border-2 border-[#c9a45c] border-t-transparent rounded-full animate-spin" />
            ) : hasErrors ? (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Texto de estado */}
          <div className="text-white">
            <div className="text-sm font-medium">
              {hasActiveUploads ? 'Subiendo imágenes...' : hasErrors ? 'Errores en subidas' : 'Subidas completadas'}
            </div>
            <div className="text-xs text-gray-400">
              {totalPending > 0 && `${totalPending} pendientes`}
              {queueStatus.uploading > 0 && ` • ${queueStatus.uploading} subiendo`}
              {queueStatus.error > 0 && ` • ${queueStatus.error} errores`}
              {queueStatus.completed > 0 && ` • ${queueStatus.completed} completadas`}
              {persistedStats.pending > 0 && ` • ${persistedStats.pending} recuperadas`}
            </div>
          </div>

          {/* Flecha para expandir */}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Lista expandida */}
        {isExpanded && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {uploads.slice(-5).map((upload, index) => (
              <div key={`indicator-${upload.id}-${index}`} className="flex items-center gap-2 p-2 bg-[#1e2538] rounded-lg">
                {/* Estado del archivo */}
                <div className="flex-shrink-0">
                  {upload.status === 'pending' && (
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  )}
                  {upload.status === 'uploading' && (
                    <div className="w-3 h-3 border border-[#c9a45c] border-t-transparent rounded-full animate-spin" />
                  )}
                  {upload.status === 'completed' && (
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  )}
                  {upload.status === 'error' && (
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </div>

                {/* Información del archivo */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">
                    {upload.fileName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {upload.status === 'pending' && 'En cola'}
                    {upload.status === 'uploading' && 'Subiendo...'}
                    {upload.status === 'completed' && 'Completado'}
                    {upload.status === 'error' && 'Error'}
                  </div>
                </div>
              </div>
            ))}

            {uploads.length > 5 && (
              <div className="text-center">
                <Link 
                  href="/subidas-pendientes"
                  className="text-xs text-[#c9a45c] hover:text-[#d4b06c] transition-colors"
                >
                  Ver todas las subidas ({uploads.length})
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón para ir a la página completa */}
      {isExpanded && (
        <Link 
          href="/subidas-pendientes"
          className="block mt-2 w-full bg-[#c9a45c] hover:bg-[#d4b06c] text-[#1a1f35] text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          Ver detalles completos
        </Link>
      )}
    </div>
  );
} 