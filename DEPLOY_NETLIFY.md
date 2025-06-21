# 🚀 Guía de Despliegue en Netlify con ImageKit.io

## 📋 Checklist Pre-Despliegue

### 1. **Verificar Configuración Local**
```bash
npm run verify-imagekit
```

### 2. **Variables de Entorno Requeridas**

Ve a tu panel de Netlify → **Site settings** → **Environment variables** y agrega:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | Clave pública de ImageKit | `public_abc123...` |
| `IMAGEKIT_PRIVATE_KEY` | Clave privada de ImageKit | `private_xyz789...` |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | URL endpoint de ImageKit | `https://ik.imagekit.io/tu_id` |

> ⚠️ **Importante**: Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el cliente. La `IMAGEKIT_PRIVATE_KEY` solo se usa en el servidor.

### 3. **Configuración de Build**

El archivo `netlify.toml` ya está configurado con:
- ✅ Plugin de Next.js para Netlify
- ✅ Configuración de API routes
- ✅ Headers de optimización
- ✅ Configuración del Service Worker

### 4. **Proceso de Despliegue**

#### Opción A: Despliegue Automático (Recomendado)
1. Conecta tu repositorio de GitHub a Netlify
2. Netlify detectará automáticamente que es un proyecto Next.js
3. Configurará el build command: `npm run build`
4. Publish directory: `.next`

#### Opción B: Despliegue Manual
```bash
# 1. Construir la aplicación
npm run build

# 2. Subir la carpeta .next a Netlify
# (Usar la interfaz web de Netlify para drag & drop)
```

## 🔧 Configuración Específica de Netlify

### Build Settings
```
Build command: npm run build
Publish directory: .next
Node version: 18.x
```

### Environment Variables
```env
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=tu_public_key
IMAGEKIT_PRIVATE_KEY=tu_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/tu_id

# Variables existentes de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key

# Otras variables si las tienes
GOOGLE_SHEETS_CLIENT_EMAIL=tu_email
GOOGLE_SHEETS_PRIVATE_KEY=tu_private_key
```

## 🧪 Testing Post-Despliegue

### 1. **Verificar Funcionalidad Básica**
- [ ] La aplicación carga correctamente
- [ ] Las imágenes existentes de Cloudinary se muestran
- [ ] El formulario de login funciona

### 2. **Verificar Subida de Imágenes**
- [ ] Crear nueva revisión → subir evidencias
- [ ] Agregar nota con imagen desde página de detalles
- [ ] Verificar que las imágenes aparecen en ImageKit.io

### 3. **Verificar Organización de Carpetas**
En tu panel de ImageKit.io deberías ver:
```
Media Library/
├── Evidencias/
│   └── YYYY-MM/
│       └── nuevas_evidencias.webp
└── Notas/
    └── YYYY-MM/
        └── nuevas_notas.webp
```

## 🐛 Troubleshooting

### Error: "Missing privateKey during ImageKit initialization"
- ✅ **Solución**: Verificar que `IMAGEKIT_PRIVATE_KEY` esté configurada en Netlify
- ✅ **Verificar**: La variable no debe tener espacios extra o caracteres especiales

### Error: "Failed to upload to ImageKit"
- ✅ **Verificar**: Todas las variables de entorno están configuradas
- ✅ **Verificar**: Las claves de ImageKit son válidas
- ✅ **Verificar**: El endpoint URL es correcto

### API Routes no funcionan
- ✅ **Verificar**: El archivo `netlify.toml` está en la raíz del proyecto
- ✅ **Verificar**: El plugin `@netlify/plugin-nextjs` está instalado

### Imágenes no se muestran
- ✅ **Verificar**: Los dominios están configurados en `next.config.js`
- ✅ **Verificar**: Las URLs de ImageKit.io son accesibles

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de build en Netlify
2. Verifica las variables de entorno
3. Prueba localmente con `npm run dev`
4. Consulta la documentación de ImageKit.io

## 🔗 Enlaces Útiles

- [Panel de Netlify](https://app.netlify.com/)
- [Panel de ImageKit.io](https://imagekit.io/dashboard)
- [Documentación de Next.js en Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Documentación de ImageKit.io](https://docs.imagekit.io/) 