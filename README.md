# Revisión Casitas

Aplicación web para la gestión de revisiones de casitas con sistema de iconos personalizables.

## Estado del Proyecto

✅ Despliegue exitoso en Netlify
✅ Variables de entorno configuradas correctamente
✅ Funcionalidades principales operativas
✅ Sistema de iconos personalizados implementado
✅ Interfaz modal mejorada con controles de zoom
✅ Compresión automática de imágenes WebP

## Características Principales

- 📋 Gestión completa de revisiones de casitas
- 🔐 Sistema de autenticación robusto
- 👥 Gestión de usuarios y permisos
- 📸 Carga y visualización optimizada de evidencias
- 💬 Sistema de notas y comentarios
- 📚 Historial completo de ediciones
- 🎨 **Sistema de iconos personalizables** (Emojis + SVG)
- 🖼️ **Modales de imagen con zoom integrado**
- ⚡ **Compresión automática WebP** (70% calidad, max 1920x1080)

## 🎨 Sistema de Iconos

### Tipos Disponibles
- **Emojis coloridos**: ⚡🔒📺🔭🧽🔊🌀🔥💨💇‍♀️🛏️👜🎒👒✨🛍️
- **Iconos SVG personalizados**: Diseñados específicamente para cada campo

### Configuración Rápida
Edita `src/config/iconConfig.ts`:

```typescript
export const ICON_CONFIG = {
  type: 'emoji',    // o 'custom' para iconos SVG
  fieldOverrides: {
    'USB Speaker': 'custom',  // Configuración específica
  }
}
```

### Iconos por Campo
| Campo | Emoji | SVG Personalizado |
|-------|-------|-------------------|
| Caja fuerte | 🔒 | 🟡 Dorado con candado |
| USB Speaker | ⚡ | 🟡 Amarillo con rayo |
| TV/Chromecast | 📺 | 🔵 Azul con pantalla |
| Binoculares | 🔭 | 🟢 Verde con lentes |
| Secadora | 🌀 | 🟣 Púrpura con remolino |
| Speaker | 🔊 | 🟠 Naranja con ondas |
| Steamer | 🔥 | 🔴 Rojo con vapor |
| Camas | 🛏️ | 🟤 Marrón con estructura |
| Bolso | 👜 | 🟣 Morado elegante |
| Sombrero | 👒 | 🟤 Café estilo western |

## Tecnologías

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Despliegue**: Netlify
- **Imágenes**: ImageKit (CDN + transformaciones)
- **Iconos**: Sistema dual Emoji/SVG personalizado

## Configuración

### Variables de Entorno Requeridas

#### Cliente (NEXT_PUBLIC_)
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

#### Servidor
```env
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_clave_anonima
```

## Instalación

1. **Clona el repositorio**
```bash
git clone [tu-repositorio]
cd revision-netlify
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

## Uso

### Navegación Principal
1. **Página Principal**: `http://localhost:3000` - Lista todas las revisiones
2. **Nueva Revisión**: `/nueva-revision` - Formulario completo
3. **Detalles**: `/detalles/[id]` - Vista detallada de cada revisión

### Funcionalidades Clave
- **Formulario Inteligente**: Validación en tiempo real con highlighting
- **Carga de Imágenes**: Drag & drop, cámara, galería
- **Compresión Automática**: WebP 70% calidad, redimensionado inteligente
- **Modales Avanzados**: Zoom, pan, controles integrados
- **Iconos Dinámicos**: Cambio entre emojis y SVG personalizados

## Estructura de Datos

### Campos de Revisión
```typescript
interface RevisionData {
  casita: string;                    // 🏠 Número de casita
  quien_revisa: string;              // 👤 Responsable
  caja_fuerte: string;               // 🔒 Estado (0-03)
  puertas_ventanas: string;          // 🚪 Estado (0-03)
  chromecast: string;                // 📺 Cantidad (0-03)
  binoculares: string;               // 🔭 Cantidad (0-03)
  trapo_binoculares: string;         // 🧽 Estado (Si/No)
  speaker: string;                   // 🔊 Cantidad (0-03)
  usb_speaker: string;               // ⚡ Cantidad (0-03)
  controles_tv: string;              // 📺 Cantidad (0-03)
  secadora: string;                  // 🌀 Cantidad (0-03)
  // ... más campos
  evidencia_01: File | string;       // 📸 Imagen 1
  evidencia_02: File | string;       // 📸 Imagen 2
  evidencia_03: File | string;       // 📸 Imagen 3
  faltantes: string;                 // 📝 Observaciones
}
```

## 🎨 Personalización de Iconos

### Crear Nuevos Iconos SVG
1. Edita `src/components/CustomIcons.tsx`
2. Agrega tu icono siguiendo el patrón:

```typescript
MiIcono: ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FF6B6B"/>
    <path d="M8 12l3 3 6-6" stroke="#FFFFFF" strokeWidth="2"/>
  </svg>
),
```

3. Agrega la lógica de detección en `getCustomIconForLabel()`

### Herramientas Recomendadas
- **[SVG-Edit](https://svg-edit.github.io/svgedit/)** - Editor gratuito
- **[Heroicons](https://heroicons.com/)** - Biblioteca de iconos
- **[Figma](https://figma.com)** - Diseño profesional

## 📱 Características Móviles

- ✅ Diseño completamente responsivo
- ✅ Captura de cámara nativa
- ✅ Gestos táctiles en modales
- ✅ Optimización de rendimiento
- ✅ Carga progresiva de imágenes

## 🚀 Optimizaciones Implementadas

### Imágenes
- **Compresión WebP**: 70% calidad automática
- **Redimensionado**: Máximo 1920x1080px
- **CDN**: ImageKit con transformaciones
- **Lazy Loading**: Carga bajo demanda

### Interfaz
- **Modales Mejorados**: Zoom, pan, controles integrados
- **Iconos Dinámicos**: Sistema dual emoji/SVG
- **Animaciones Fluidas**: Transiciones optimizadas
- **Validación Inteligente**: Highlighting en tiempo real

## 📚 Documentación Adicional

- **[ICONOS_PERSONALIZADOS.md](./ICONOS_PERSONALIZADOS.md)** - Guía completa de iconos
- **Estructura de componentes**: `src/components/`
- **Configuración**: `src/config/`
- **Tipos TypeScript**: `src/types/`

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos
```

## 🌐 Despliegue

### Netlify (Configurado)
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Variables de entorno**: Configuradas en dashboard

### Vercel (Alternativo)
```bash
npm install -g vercel
vercel --prod
```

## 📈 Últimas Actualizaciones

### v2.1.0 - Sistema de Iconos Personalizados
- ✅ Implementación de iconos SVG coloridos
- ✅ Sistema de configuración flexible
- ✅ Documentación completa
- ✅ Compatibilidad con emojis existentes

### v2.0.0 - Interfaz Modal Mejorada  
- ✅ Controles de zoom integrados
- ✅ Indicador de porcentaje en tiempo real
- ✅ Instrucciones de uso en footer
- ✅ Diseño profesional con gradientes

### v1.9.0 - Compresión WebP
- ✅ Compresión automática al 70%
- ✅ Redimensionado inteligente
- ✅ Integración con ImageKit
- ✅ Optimización de carga

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

**Desarrollado con ❤️ para la gestión eficiente de revisiones de casitas** 