'use client';

import { useEffect, useState } from 'react';
import { UploadPersistence } from '@/utils/uploadPersistence';
import { useToast } from '@/context/ToastContext';
import { useUpload } from '@/context/UploadContext';

export default function UploadRecovery() {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const { showInfo, showSuccess } = useToast();
  const { isServiceWorkerReady } = useUpload();

  useEffect(() => {
    // Verificar subidas pendientes al cargar la aplicación
    const checkPendingUploads = () => {
      const pending = UploadPersistence.getPendingUploads();
      
      if (pending.length > 0) {
        setPendingUploads(pending);
        setShowRecoveryModal(true);
        showInfo(`Se encontraron ${pending.length} subidas pendientes de sesiones anteriores`);
      }
    };

    // Verificar después de que el Service Worker esté listo
    if (isServiceWorkerReady) {
      setTimeout(checkPendingUploads, 1000);
    }
  }, [isServiceWorkerReady, showInfo]);

  const handleRecoverUploads = async () => {
    if (!isServiceWorkerReady) {
      showInfo('Esperando a que el sistema esté listo...');
      return;
    }

    try {
      // Notificar al Service Worker para procesar cola
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PROCESS_QUEUE'
        });
      }

      showSuccess(`Reanudando ${pendingUploads.length} subidas pendientes`);
      setShowRecoveryModal(false);
    } catch (error) {
      console.error('Error reanudando subidas:', error);
    }
  };

  const handleDismiss = () => {
    setShowRecoveryModal(false);
    // Opcional: marcar como ignoradas en localStorage
  };

  if (!showRecoveryModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a3347] rounded-xl shadow-2xl p-6 max-w-md w-full border border-[#3d4659]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Subidas Pendientes</h3>
        </div>

        <p className="text-gray-300 mb-4">
          Se encontraron <strong>{pendingUploads.length}</strong> subidas que no se completaron en sesiones anteriores.
        </p>

        <div className="bg-[#1e2538] rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
          {pendingUploads.slice(0, 5).map((upload, index) => (
            <div key={`recovery-${upload.id}-${index}`} className="flex items-center gap-2 py-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-300 truncate">{upload.fileName}</span>
            </div>
          ))}
          {pendingUploads.length > 5 && (
            <div className="text-xs text-gray-400 mt-1">
              y {pendingUploads.length - 5} más...
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRecoverUploads}
            className="flex-1 bg-[#c9a45c] hover:bg-[#d4b06c] text-[#1a1f35] py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Reanudar Subidas
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a3347] text-gray-300 rounded-lg transition-colors"
          >
            Ignorar
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-400 text-center">
          Las subidas se reanudarán automáticamente en segundo plano
        </div>
      </div>
    </div>
  );
} 