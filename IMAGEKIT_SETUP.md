# 🚀 Configuración de ImageKit.io

## 📋 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env.local`:

```env
# ImageKit.io Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## 🔧 Pasos para Configurar ImageKit.io

### 1. Crear Cuenta
- Ve a [https://imagekit.io/](https://imagekit.io/)
- Crea una cuenta gratuita
- Verifica tu email

### 2. Obtener Credenciales
1. En el dashboard, ve a **"Developer options"**
2. Copia los siguientes valores:
   - **Public Key**: `public_xxx...`
   - **Private Key**: `private_xxx...`
   - **URL Endpoint**: `https://ik.imagekit.io/your_id`

### 3. Configurar Variables de Entorno
1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las variables mostradas arriba
3. Reemplaza `your_imagekit_xxx` con tus valores reales

### 4. Verificar Configuración
```bash
npm run dev
```

## 📁 Estructura de Carpetas Automática

El sistema creará automáticamente estas carpetas en ImageKit.io:

```
📁 ImageKit.io Root
├── 📁 Evidencias/
│   ├── 📁 2024-01/    # Enero 2024
│   ├── 📁 2024-02/    # Febrero 2024
│   └── 📁 2024-XX/    # Mes actual
└── 📁 Notas/
    ├── 📁 2024-01/    # Enero 2024
    ├── 📁 2024-02/    # Febrero 2024
    └── 📁 2024-XX/    # Mes actual
```

## ✅ Ventajas de ImageKit.io

- 🚀 **Más rápido** que Cloudinary
- 💰 **Más económico** en la mayoría de casos
- 🎯 **Optimización automática** de imágenes
- 🌍 **CDN global** incluido
- 📱 **Mejor compresión** automática
- 🔧 **API más simple** y moderna

## 🔄 Migración

- ✅ **Imágenes existentes** en Cloudinary seguirán funcionando
- ✅ **Nuevas imágenes** se subirán a ImageKit.io
- ✅ **Sin tiempo de inactividad**
- ✅ **Migración gradual** y segura

## 🆘 Solución de Problemas

### Error: "Public key not found"
- Verifica que `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` esté configurado
- Asegúrate de que el valor sea correcto (empieza con `public_`)

### Error: "Private key not found"
- Verifica que `IMAGEKIT_PRIVATE_KEY` esté configurado
- Asegúrate de que el valor sea correcto (empieza con `private_`)

### Error: "URL endpoint not found"
- Verifica que `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` esté configurado
- Debe ser algo como: `https://ik.imagekit.io/tu_id`

### Reiniciar el servidor
```bash
# Después de cambiar variables de entorno
npm run dev
``` 