# 🚀 Guía de Deployment en Netlify

## Configuración Paso a Paso

### 1. Preparación del Repositorio
✅ **Completado**: Tu proyecto ya está configurado y sincronizado con:
- **Repositorio**: https://github.com/Blackshadow05/revisionprueba
- **Configuración**: `netlify.toml` optimizado
- **Build**: Scripts de Next.js configurados

### 2. Crear Nuevo Site en Netlify

#### A) Acceso
1. Ve a [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**

#### B) Conectar GitHub
1. Selecciona **"Deploy with GitHub"**
2. Busca: `Blackshadow05/revisionprueba`
3. Click **"Deploy site"**

#### C) Build Settings (Auto-detectados)
```yaml
Base directory: (vacío)
Build command: npm run build
Publish directory: .next
Node version: 18.19.0
```

### 3. Variables de Entorno Obligatorias

Ve a **Site settings** → **Environment variables** y agrega:

#### Supabase (Obligatorias)
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

#### ImageKit.io (Para imágenes)
```env
IMAGEKIT_PUBLIC_KEY=public_abc123...
IMAGEKIT_PRIVATE_KEY=private_xyz789...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/tu-id/
```

#### Configuración Next.js
```env
NEXT_TELEMETRY_DISABLED=1
NODE_VERSION=18.19.0
```

#### Google Sheets (Opcional)
```env
GOOGLE_SHEETS_CLIENT_EMAIL=servicio@proyecto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMII...
```

### 4. Configuración de Dominio

#### Dominio Automático
- Netlify asigna: `https://proyecto-hash.netlify.app`
- Puedes cambiar el nombre en **Site settings** → **Site details**

#### Dominio Personalizado (Opcional)
1. **Site settings** → **Domain management**
2. **Add custom domain**
3. Configura DNS según las instrucciones

### 5. Optimizaciones Configuradas

#### Headers de Seguridad ✅
- X-Frame-Options: DENY
- X-XSS-Protection activado
- Referrer-Policy configurado

#### Cache Optimizado ✅
- Archivos estáticos: 1 año
- Service Worker: No cache
- Imágenes: Cache largo

#### Funciones Serverless ✅
- API Routes funcionando
- External modules optimizados
- Bundler esbuild activado

### 6. Verificación Post-Deploy

#### Checklist de Verificación
- [ ] **Build exitoso** (verde en dashboard)
- [ ] **Site accesible** via URL de Netlify
- [ ] **API funcionando** (prueba /api/setup)
- [ ] **Imágenes cargando** correctamente
- [ ] **Formularios funcionando**
- [ ] **Base de datos conectada**

#### URLs de Prueba
```
https://tu-site.netlify.app/               # Página principal
https://tu-site.netlify.app/api/setup      # API de configuración
https://tu-site.netlify.app/nueva-revision # Formulario
```

### 7. Comandos de Diagnóstico

Si hay problemas, usa estos comandos locales:

```bash
# Verificar build local
npm run build

# Verificar ImageKit
npm run verify-imagekit

# Verificar variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 8. Troubleshooting Común

#### Error de Build
- Verificar todas las variables de entorno
- Revisar Node.js version (18.19.0)
- Comprobar dependencias en package.json

#### API Routes no funcionan
- Verificar netlify.toml redirects
- Comprobar @netlify/plugin-nextjs
- Revisar logs de funciones

#### Imágenes no cargan
- Verificar configuración ImageKit
- Comprobar dominios en next.config.js
- Revisar URLs en las variables

### 9. Deploy Automático

✅ **Configurado**: Cada push a `main` redeploya automáticamente

Para deployes manuales:
1. **Site overview** → **Trigger deploy**
2. Selecciona **"Deploy site"**

---

## 📞 Soporte

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/
- **Plugin Docs**: https://github.com/netlify/netlify-plugin-nextjs 