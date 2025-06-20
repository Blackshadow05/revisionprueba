'use client';

import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useState } from 'react';

export default function UploadMethodIndicator() {
  const { preferredUploadMethod, isMobile, browserName, connectionType } = useDeviceDetection();
  const [isExpanded, setIsExpanded] = useState(false);

  const getMethodInfo = () => {
    switch (preferredUploadMethod) {
      case 'uppy':
        return {
          name: 'Uppy',
          description: 'Subidas resumibles y robustas',
          icon: '🚀',
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-500/30'
        };
      case 'hybrid':
        return {
          name: 'Híbrido',
          description: 'Combina Service Worker + Uppy',
          icon: '⚡',
          color: 'text-purple-400',
          bgColor: 'bg-purple-900/20',
          borderColor: 'border-purple-500/30'
        };
      case 'serviceWorker':
        return {
          name: 'Service Worker',
          description: 'Subidas en segundo plano',
          icon: '🔧',
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-500/30'
        };
      default:
        return {
          name: 'Detectando...',
          description: 'Analizando capacidades',
          icon: '🔍',
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/20',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const methodInfo = getMethodInfo();
  const deviceType = isMobile ? 'Móvil' : 'Escritorio';

  return (
    <div className="fixed top-4 left-4 z-40">
      <div 
        className={`${methodInfo.bgColor} ${methodInfo.borderColor} border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{methodInfo.icon}</span>
          <div className="flex-1">
            <div className={`text-sm font-medium ${methodInfo.color}`}>
              {methodInfo.name}
            </div>
            {!isExpanded && (
              <div className="text-xs text-gray-400">
                {deviceType} • {browserName}
              </div>
            )}
          </div>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-300">
              <strong>Descripción:</strong> {methodInfo.description}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Dispositivo:</span>
                <div className="text-white">{deviceType}</div>
              </div>
              <div>
                <span className="text-gray-400">Navegador:</span>
                <div className="text-white">{browserName}</div>
              </div>
            </div>

            {connectionType !== 'unknown' && (
              <div className="text-xs">
                <span className="text-gray-400">Conexión:</span>
                <span className="text-white ml-1">{connectionType}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-400">
                <strong>Características:</strong>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {preferredUploadMethod === 'uppy' && (
                  <ul className="space-y-1">
                    <li>✅ Resumible si se interrumpe</li>
                    <li>✅ Compatible con todos los navegadores</li>
                    <li>✅ Optimizado para móviles</li>
                  </ul>
                )}
                {preferredUploadMethod === 'hybrid' && (
                  <ul className="space-y-1">
                    <li>✅ Service Worker cuando es posible</li>
                    <li>✅ Fallback a Uppy si es necesario</li>
                    <li>✅ Mejor de ambos mundos</li>
                  </ul>
                )}
                {preferredUploadMethod === 'serviceWorker' && (
                  <ul className="space-y-1">
                    <li>✅ Subidas en segundo plano</li>
                    <li>✅ Continúa aunque cambies de pestaña</li>
                    <li>✅ Reintentos automáticos</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 