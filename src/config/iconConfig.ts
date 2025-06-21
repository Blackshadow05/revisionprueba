// Configuración global de iconos
export const ICON_CONFIG = {
  // Cambia este valor para usar diferentes tipos de iconos en toda la app
  // 'emoji' = Emojis coloridos (🔒📺🔭)
  // 'custom' = Iconos SVG personalizados coloridos
  type: 'custom' as 'emoji' | 'custom',
  
  // Configuración específica por campo (opcional)
  // Si quieres usar diferentes tipos para campos específicos
  fieldOverrides: {
    // Ejemplo: 'USB Speaker': 'custom',
    // Ejemplo: 'Caja fuerte': 'emoji',
  } as Record<string, 'emoji' | 'custom'>
};

// Función helper para obtener el tipo de icono para un campo específico
export const getIconTypeForField = (fieldLabel: string): 'emoji' | 'custom' => {
  return ICON_CONFIG.fieldOverrides[fieldLabel] || ICON_CONFIG.type;
}; 