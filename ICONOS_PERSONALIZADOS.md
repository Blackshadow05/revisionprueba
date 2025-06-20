# 🎨 Guía de Iconos Personalizados

## 📋 Resumen
Tu aplicación ahora soporta dos tipos de iconos:
- **Emojis** (🔒📺🔭) - Coloridos y expresivos
- **Iconos SVG personalizados** - Diseñados específicamente para cada campo

## 🚀 Cómo cambiar entre tipos de iconos

### Opción 1: Cambio global
Edita el archivo `src/config/iconConfig.ts`:

```typescript
export const ICON_CONFIG = {
  type: 'custom', // Cambia a 'custom' para usar iconos SVG personalizados
  // type: 'emoji',  // Cambia a 'emoji' para usar emojis
}
```

### Opción 2: Configuración por campo específico
```typescript
export const ICON_CONFIG = {
  type: 'emoji', // Tipo por defecto
  fieldOverrides: {
    'USB Speaker': 'custom',    // USB Speaker usará icono SVG
    'Caja fuerte': 'emoji',     // Caja fuerte usará emoji
    'Secadora': 'custom',       // Secadora usará icono SVG
  }
}
```

## 🎨 Cómo personalizar los iconos SVG

### 1. Editar iconos existentes
Abre `src/components/CustomIcons.tsx` y modifica cualquier icono:

```typescript
// Ejemplo: Cambiar el color del USB Speaker
USBSpeaker: ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="8" width="16" height="8" rx="2" 
          fill="#FF0000" stroke="#CC0000" strokeWidth="1.5"/> {/* Rojo en lugar de amarillo */}
    <path d="M12 10l-2 3h1.5l-1 3 2-3h-1.5l1-3z" fill="#FFFFFF"/>
  </svg>
),
```

### 2. Agregar nuevos iconos
```typescript
// Agregar un nuevo icono
export const CustomIcons = {
  // ... iconos existentes ...
  
  // Nuevo icono para "Mi Campo"
  MiCampo: ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FF6B6B" stroke="#E55100"/>
      <path d="M8 12l3 3 6-6" stroke="#FFFFFF" strokeWidth="2"/>
    </svg>
  ),
};

// Agregar la lógica para detectar el nuevo campo
export const getCustomIconForLabel = (label: string) => {
  const labelLower = label.toLowerCase();
  
  // ... condiciones existentes ...
  
  if (labelLower.includes('mi campo')) {
    return <CustomIcons.MiCampo />;
  }
  
  return <CustomIcons.Default />;
};
```

## 🎯 Iconos actuales disponibles

### Emojis
- 🔒 Caja fuerte
- 📺 TV/Chromecast  
- 🔭 Binoculares
- 🧽 Trapo
- ⚡ USB Speaker
- 🔊 Speaker
- 🌀 Secadora
- 🔥 Steamer/Plancha
- 💨 Bolsa vapor
- 💇‍♀️ Plancha cabello
- 🛏️ Camas ordenadas
- 👜 Bolso
- 🎒 Bulto
- 👒 Sombrero
- ✨ Cola de caballo
- 🛍️ Bolso yute

### Iconos SVG personalizados
- 🟡 Caja fuerte (dorado)
- 🔵 TV/Chromecast (azul)
- 🟢 Binoculares (verde)
- 🩷 Trapo (rosa)
- 🟡 USB Speaker (amarillo con rayo)
- 🟠 Speaker (naranja)
- 🟣 Secadora (púrpura)
- 🔴 Steamer (rojo)
- 🟤 Cama (marrón)
- 🟣 Bolso (morado)
- 🟤 Sombrero (café)

## 🛠️ Herramientas recomendadas para crear iconos

### Editores SVG online
- [SVG-Edit](https://svg-edit.github.io/svgedit/) - Editor gratuito
- [Boxy SVG](https://boxy-svg.com/) - Editor avanzado
- [Figma](https://figma.com) - Diseño profesional

### Bibliotecas de iconos
- [Heroicons](https://heroicons.com/) - Iconos minimalistas
- [Feather Icons](https://feathericons.com/) - Iconos ligeros
- [Phosphor Icons](https://phosphoricons.com/) - Gran variedad

### Colores recomendados
```css
/* Paleta de colores usada */
Dorado: #FFD700, #B8860B
Azul: #4A90E2, #2E5C8A  
Verde: #32CD32, #228B22
Rosa: #FF69B4, #C71585
Amarillo: #FFD700, #FFA500
Naranja: #FF8C42, #E55100
Púrpura: #9370DB, #663399
Rojo: #FF6B6B, #DC143C
Marrón: #8B4513, #654321
Morado: #8A2BE2, #4B0082
```

## 🔧 Solución de problemas

### Los iconos no aparecen
1. Verifica que el archivo `CustomIcons.tsx` esté guardado
2. Revisa que la importación en `ButtonGroup.tsx` sea correcta
3. Comprueba la configuración en `iconConfig.ts`

### Los iconos se ven mal
1. Asegúrate de usar `viewBox="0 0 24 24"` en todos los SVG
2. Usa colores en formato hexadecimal (#FF0000)
3. Mantén el `className={className}` en el elemento `<svg>`

### Agregar iconos para campos nuevos
1. Agrega el icono en `CustomIcons.tsx`
2. Agrega la condición en `getCustomIconForLabel()`
3. Opcionalmente, agrega el emoji equivalente en `getEmojiForLabel()`

## 📝 Ejemplos de uso

### Usar iconos personalizados solo para USB Speaker
```typescript
// En iconConfig.ts
export const ICON_CONFIG = {
  type: 'emoji',
  fieldOverrides: {
    'USB Speaker': 'custom',
  }
}
```

### Cambiar todos los iconos a personalizados
```typescript
// En iconConfig.ts
export const ICON_CONFIG = {
  type: 'custom',
}
```

### Usar iconos específicos en un componente
```tsx
<ButtonGroup 
  label="USB Speaker"
  iconType="custom"  // Fuerza el uso de icono personalizado
  // ... otras props
/>
``` 