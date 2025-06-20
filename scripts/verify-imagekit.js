#!/usr/bin/env node

/**
 * Script para verificar la configuración de ImageKit.io
 * Ejecutar con: node scripts/verify-imagekit.js
 */

console.log('🔍 Verificando configuración de ImageKit.io...\n');

// Verificar variables de entorno
const requiredEnvVars = [
  'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT'
];

let allConfigured = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: Configurada`);
  } else {
    console.log(`❌ ${envVar}: NO CONFIGURADA`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('🎉 ¡Todas las variables de entorno están configuradas!');
  console.log('\n📋 Próximos pasos para Netlify:');
  console.log('1. Ve a tu panel de Netlify');
  console.log('2. Site settings → Environment variables');
  console.log('3. Agrega las mismas variables que tienes en .env.local');
  console.log('4. Haz deploy de tu aplicación');
} else {
  console.log('⚠️  Faltan variables de entorno por configurar');
  console.log('\n📝 Agrega estas variables a tu .env.local:');
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.log(`${envVar}=tu_valor_aqui`);
    }
  });
}

console.log('\n🔗 Enlaces útiles:');
console.log('- Panel de ImageKit.io: https://imagekit.io/dashboard');
console.log('- Configuración de Netlify: https://app.netlify.com/');
console.log('- Documentación: https://docs.imagekit.io/'); 