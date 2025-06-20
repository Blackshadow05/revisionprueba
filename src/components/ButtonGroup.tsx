'use client';

import React from 'react';
import { getCustomIconForLabel } from './CustomIcons';
import { getIconTypeForField } from '../config/iconConfig';

interface ButtonGroupProps {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  highlight?: boolean;
  iconType?: 'emoji' | 'custom'; // Opcional - si no se especifica, usa la configuración global
}

// Función para obtener el emoji apropiado según el label
const getEmojiForLabel = (label: string) => {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('caja fuerte') || labelLower.includes('guardado')) {
    return <span className="text-lg">🔒</span>; // Candado
  }
  
  if (labelLower.includes('chromecast') || labelLower.includes('controles tv')) {
    return <span className="text-lg">📺</span>; // TV
  }
  
  if (labelLower.includes('binoculares')) {
    return <span className="text-lg">🔭</span>; // Telescopio/Binoculares
  }
  
  if (labelLower.includes('trapo')) {
    return <span className="text-lg">🧽</span>; // Esponja/Trapo
  }
  
  // USB Speaker - Rayo para conexión USB
  if (labelLower.includes('usb speaker')) {
    return <span className="text-lg">⚡</span>; // Rayo/Conexión USB
  }
  
  if (labelLower.includes('speaker') && !labelLower.includes('usb')) {
    return <span className="text-lg">🔊</span>; // Altavoz
  }
  
  // Secadora - icono anterior
  if (labelLower.includes('secadora')) {
    return <span className="text-lg">🌀</span>; // Remolino/Secadora
  }
  
  if (labelLower.includes('steamer') || labelLower.includes('plancha')) {
    return <span className="text-lg">🔥</span>; // Fuego/Vapor
  }
  
  if (labelLower.includes('bolsa vapor')) {
    return <span className="text-lg">💨</span>; // Vapor
  }
  
  if (labelLower.includes('plancha cabello')) {
    return <span className="text-lg">💇‍♀️</span>; // Peluquería
  }
  
  if (labelLower.includes('cama') || labelLower.includes('ordenada')) {
    return <span className="text-lg">🛏️</span>; // Cama
  }
  
  if (labelLower.includes('bolsa') || labelLower.includes('bolso')) {
    return <span className="text-lg">👜</span>; // Bolso
  }
  
  if (labelLower.includes('bulto')) {
    return <span className="text-lg">🎒</span>; // Mochila
  }
  
  if (labelLower.includes('sombrero')) {
    return <span className="text-lg">👒</span>; // Sombrero
  }
  
  if (labelLower.includes('cola') || labelLower.includes('cabello')) {
    return <span className="text-lg">✨</span>; // Brillo/Estrella
  }
  
  if (labelLower.includes('bolso yute')) {
    return <span className="text-lg">🛍️</span>; // Bolsa de compras
  }
  
  // Icono por defecto
  return <span className="text-lg">✅</span>; // Check verde
};

export default function ButtonGroup({ 
  label, 
  options, 
  selectedValue, 
  onSelect, 
  required = false, 
  highlight = false,
  iconType // Ya no tiene valor por defecto
}: ButtonGroupProps) {
  
  // Función para obtener el icono según el tipo seleccionado
  const getIcon = () => {
    // Si no se especifica iconType, usa la configuración global
    const finalIconType = iconType || getIconTypeForField(label);
    
    if (finalIconType === 'custom') {
      return getCustomIconForLabel(label);
    }
    return getEmojiForLabel(label);
  };

  return (
    <div className="space-y-3">
      <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
        {getIcon()}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`flex flex-wrap gap-3 ${highlight ? 'animate-pulse border-2 border-[#00ff00] shadow-[0_0_15px_#00ff00] p-3 rounded-xl backdrop-blur-sm' : ''}`}>
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`
              relative px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 transform hover:scale-[1.02] shadow-[0_4px_8px_rgb(0_0_0/0.2)] hover:shadow-[0_8px_16px_rgb(0_0_0/0.3)] backdrop-blur-sm overflow-hidden group
              ${selectedValue === option
                ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white border-pink-300/40 shadow-[0_8px_16px_rgb(249_115_22/0.25)] hover:shadow-[0_12px_24px_rgb(249_115_22/0.35)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300'
                : 'bg-gradient-to-br from-[#1e2538] to-[#2a3347] text-[#ff8c42] border-[#3d4659] hover:border-[#c9a45c]/50 hover:bg-gradient-to-br hover:from-[#262f47] hover:to-[#303a52] hover:text-white hover:shadow-[0_8px_16px_rgb(201_164_92/0.1)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#c9a45c]/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700'
              }
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {/* Icono de check para opción seleccionada */}
              {selectedValue === option && (
                <svg className="w-3.5 h-3.5 animate-in fade-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {option}
            </span>
            
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 