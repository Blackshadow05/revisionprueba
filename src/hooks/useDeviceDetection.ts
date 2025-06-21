'use client';

import { useState, useEffect } from 'react';

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasServiceWorkerSupport: boolean;
  hasReliableBackground: boolean;
  preferredUploadMethod: 'uppy' | 'serviceWorker' | 'hybrid';
  browserName: string;
  connectionType: string;
}

export function useDeviceDetection(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasServiceWorkerSupport: false,
    hasReliableBackground: false,
    preferredUploadMethod: 'uppy',
    browserName: 'unknown',
    connectionType: 'unknown'
  });

  useEffect(() => {
    const detectCapabilities = () => {
      // Detección de dispositivo
      const userAgent = navigator.userAgent;
      const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*(?!.*\bMobile\b))/i.test(userAgent);
      const isDesktop = !isMobile && !isTablet;

      // Detección de navegador
      let browserName = 'unknown';
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browserName = 'chrome';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browserName = 'safari';
      } else if (userAgent.includes('Firefox')) {
        browserName = 'firefox';
      } else if (userAgent.includes('Edg')) {
        browserName = 'edge';
      }

      // Capacidades del navegador
      const hasServiceWorkerSupport = 'serviceWorker' in navigator;
      
      // Service Workers son menos confiables en móviles, especialmente iOS Safari
      const hasReliableBackground = hasServiceWorkerSupport && 
        isDesktop && 
        browserName !== 'safari'; // Safari desktop también tiene limitaciones

      // Detección de tipo de conexión
      let connectionType = 'unknown';
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection?.effectiveType || connection?.type || 'unknown';
      }

      // Determinar método preferido
      let preferredUploadMethod: 'uppy' | 'serviceWorker' | 'hybrid' = 'uppy';
      
      if (isMobile || browserName === 'safari') {
        // Móviles y Safari siempre usan Uppy
        preferredUploadMethod = 'uppy';
      } else if (hasReliableBackground && (browserName === 'chrome' || browserName === 'firefox')) {
        // Escritorio con navegadores confiables pueden usar híbrido
        preferredUploadMethod = 'hybrid';
      } else {
        // Fallback a Uppy para casos dudosos
        preferredUploadMethod = 'uppy';
      }

      setCapabilities({
        isMobile,
        isTablet,
        isDesktop,
        hasServiceWorkerSupport,
        hasReliableBackground,
        preferredUploadMethod,
        browserName,
        connectionType
      });
    };

    detectCapabilities();

    // Re-detectar si cambia la conexión
    const handleConnectionChange = () => {
      detectCapabilities();
    };

    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', handleConnectionChange);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return capabilities;
} 