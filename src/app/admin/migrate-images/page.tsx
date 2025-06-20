'use client';

import { useState } from 'react';
import { migrateExistingCloudinaryUrls } from '@/lib/cloudinary';

export default function MigrateImages() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const updatedCount = await migrateExistingCloudinaryUrls();
      setResult(updatedCount);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#2a3347] rounded-xl shadow-2xl p-8 border border-[#3d4659]">
          <h1 className="text-3xl font-bold text-[#c9a45c] mb-6">
            Migración de URLs de Cloudinary
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h2 className="text-blue-400 font-semibold mb-2">¿Qué hace esta migración?</h2>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Busca todas las URLs de evidencia en la base de datos</li>
                <li>• Agrega f_auto,q_auto a las URLs de Cloudinary existentes</li>
                <li>• Mejora la carga y optimización automática de imágenes</li>
                <li>• Solo actualiza URLs que aún no tienen estas optimizaciones</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h2 className="text-yellow-400 font-semibold mb-2">Ejemplo de transformación:</h2>
              <div className="text-sm font-mono space-y-2">
                <div>
                  <span className="text-red-400">Antes:</span>
                  <div className="text-gray-300 bg-[#1e2538] p-2 rounded mt-1 break-all">
                    https://res.cloudinary.com/.../upload/v123/folder/image.jpg
                  </div>
                </div>
                <div>
                  <span className="text-green-400">Después:</span>
                  <div className="text-gray-300 bg-[#1e2538] p-2 rounded mt-1 break-all">
                    https://res.cloudinary.com/.../upload/<span className="text-[#c9a45c]">f_auto,q_auto</span>/v123/folder/image.jpg
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleMigration}
              disabled={isRunning}
              className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                isRunning
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-gradient-to-r from-[#c9a45c] to-[#d4b06c] hover:from-[#d4b06c] hover:to-[#e0bc7c] text-[#1a1f35] transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ejecutando migración...
                </div>
              ) : (
                'Ejecutar Migración'
              )}
            </button>

            {result !== null && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Migración completada</h3>
                <p className="text-gray-300">
                  Se actualizaron <span className="font-bold text-green-400">{result}</span> registros con URLs optimizadas.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2">❌ Error en la migración</h3>
                <p className="text-gray-300 font-mono text-sm">{error}</p>
              </div>
            )}

            <div className="text-center">
              <a
                href="/"
                className="px-4 py-2.5 text-[#c9a45c] hover:text-[#d4b06c] underline transition-colors relative overflow-hidden rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
                <div className="relative z-10 flex items-center gap-2">
                  ← Volver al inicio
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 