'use client';

import { useState, useEffect } from 'react';

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Se reconectó después de estar offline
        console.log('Reconectado - procesando cola de subidas');
        
        // Notificar al Service Worker para procesar cola
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PROCESS_QUEUE'
          });
        }
        
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Detectar cambios de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar cuando la página vuelve a ser visible (usuario regresa)
    const handleVisibilityChange = () => {
      if (!document.hidden && isOnline) {
        // Página visible y online - procesar cola
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PROCESS_QUEUE'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detectar cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      if (isOnline) {
        // Ventana tiene foco y online - procesar cola
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PROCESS_QUEUE'
          });
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
} 