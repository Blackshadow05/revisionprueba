'use client';

import { useState, useEffect } from 'react';
import { OptimizedImageCompressor } from '@/lib/imageCompressionOptimized';

export default function TestPerformance() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [performanceWarning, setPerformanceWarning] = useState<string | null>(null);

  useEffect(() => {
    const info = OptimizedImageCompressor.getDeviceInfo();
    setDeviceInfo(info);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setPerformanceWarning(null);
      
      // Verificar si el dispositivo puede manejar el archivo
      const { canHandle, reason } = OptimizedImageCompressor.canHandleFile(file);
      if (!canHandle) {
        setPerformanceWarning(reason || 'Archivo no compatible');
      } else if (deviceInfo?.isLowEnd && file.size > 5 * 1024 * 1024) {
        setPerformanceWarning('⚠️ Archivo grande detectado. Puede causar calentamiento o lentitud en tu dispositivo.');
      }
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setCompressing(true);
    setProgress(0);
    setStage('');

    try {
      const result = await OptimizedImageCompressor.compressWithBreaks(
        selectedFile,
        (progress, stage) => {
          setProgress(progress);
          setStage(stage);
        }
      );
      
      setResult(result);
    } catch (error) {
      console.error('Error comprimiendo:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setCompressing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'low': return '🐌';
      case 'medium': return '⚡';
      case 'high': return '🚀';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#2a3347] rounded-xl shadow-2xl p-8 border border-[#3d4659]">
          <h1 className="text-3xl font-bold text-[#c9a45c] mb-8">
            Análisis de Rendimiento del Dispositivo
          </h1>

          {/* Información del dispositivo */}
          {deviceInfo && (
            <div className="mb-8 bg-[#1e2538] rounded-lg p-6 border border-[#3d4659]">
              <h3 className="text-lg font-semibold text-[#ff8c42] mb-4">Tu Dispositivo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(deviceInfo.performanceLevel)}`}>
                    {getPerformanceIcon(deviceInfo.performanceLevel)} {deviceInfo.performanceLevel.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-400">Nivel de Rendimiento</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{deviceInfo.memoryGB}GB</div>
                  <div className="text-sm text-gray-400">Memoria RAM</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{deviceInfo.cores}</div>
                  <div className="text-sm text-gray-400">Núcleos CPU</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {deviceInfo.isMobile ? '📱' : '🖥️'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {deviceInfo.isMobile ? 'Móvil' : 'Escritorio'}
                  </div>
                </div>
              </div>

              {/* Configuración recomendada */}
              <div className="bg-[#2a3347] rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Configuración Optimizada:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Resolución:</span>
                    <div className="text-white">
                      {deviceInfo.recommendedSettings.maxWidth}x{deviceInfo.recommendedSettings.maxHeight}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Calidad:</span>
                    <div className="text-white">
                      {Math.round(deviceInfo.recommendedSettings.quality * 100)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Tamaño máx:</span>
                    <div className="text-white">
                      {deviceInfo.recommendedSettings.maxSizeKB}KB
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Progresivo:</span>
                    <div className="text-white">
                      {deviceInfo.recommendedSettings.progressive ? 'Sí' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertencias para gama baja */}
              {deviceInfo.isLowEnd && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <span>⚠️</span>
                    <strong>Dispositivo de Gama Baja Detectado</strong>
                  </div>
                  <div className="text-xs text-yellow-300 mt-1">
                    • Procesamiento más lento para evitar calentamiento<br/>
                    • Límite de 15MB por imagen<br/>
                    • Configuración conservadora para preservar batería
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selector de archivo */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-[#ff8c42] mb-4">
              Seleccionar Imagen para Prueba de Rendimiento
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-4 py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c] file:text-[#1a1f35] hover:file:bg-[#d4b06c]"
            />
            
            {performanceWarning && (
              <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="text-red-400 text-sm">{performanceWarning}</div>
              </div>
            )}
          </div>

          {/* Información del archivo */}
          {selectedFile && (
            <div className="mb-8 bg-[#1e2538] rounded-lg p-4 border border-[#3d4659]">
              <h3 className="text-lg font-semibold text-[#ff8c42] mb-2">Archivo Seleccionado</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Nombre:</span>
                  <div className="text-white truncate">{selectedFile.name}</div>
                </div>
                <div>
                  <span className="text-gray-400">Tamaño:</span>
                  <div className="text-white">{formatSize(selectedFile.size)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Tipo:</span>
                  <div className="text-white">{selectedFile.type}</div>
                </div>
                <div>
                  <span className="text-gray-400">Tiempo estimado:</span>
                  <div className="text-white">
                    {deviceInfo?.isLowEnd ? '5-15s' : deviceInfo?.performanceLevel === 'high' ? '1-3s' : '2-8s'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompress}
                disabled={compressing || !selectedFile}
                className={`mt-4 w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                  compressing || !selectedFile
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#c9a45c] to-[#d4b06c] text-[#1a1f35] hover:from-[#d4b06c] hover:to-[#e0bc7c] transform hover:scale-105'
                }`}
              >
                {compressing ? `${stage} (${progress}%)` : 'Iniciar Prueba de Compresión'}
              </button>

              {/* Barra de progreso */}
              {compressing && (
                <div className="mt-4">
                  <div className="w-full bg-[#3d4659] rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#c9a45c] to-[#d4b06c] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-center text-sm text-gray-400 mt-2">
                    {stage} - {progress}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resultados */}
          {result && (
            <div className="space-y-6">
              {/* Métricas de rendimiento */}
              <div className="bg-[#1e2538] rounded-lg p-6 border border-[#3d4659]">
                <h3 className="text-lg font-semibold text-[#ff8c42] mb-4">Resultados de Rendimiento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{formatTime(result.processingTime)}</div>
                    <div className="text-sm text-gray-400">Tiempo de Procesamiento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{result.compressionRatio}%</div>
                    <div className="text-sm text-gray-400">Compresión Lograda</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{formatSize(result.compressedSize)}</div>
                    <div className="text-sm text-gray-400">Tamaño Final</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {formatSize(result.originalSize - result.compressedSize)}
                    </div>
                    <div className="text-sm text-gray-400">Espacio Ahorrado</div>
                  </div>
                </div>

                {/* Análisis de rendimiento */}
                <div className="bg-[#2a3347] rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Análisis de Rendimiento:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Velocidad de procesamiento:</span>
                      <span className={`font-medium ${
                        result.processingTime < 2000 ? 'text-green-400' :
                        result.processingTime < 5000 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {result.processingTime < 2000 ? '🚀 Excelente' :
                         result.processingTime < 5000 ? '⚡ Buena' : '🐌 Lenta'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Eficiencia de compresión:</span>
                      <span className={`font-medium ${
                        result.compressionRatio > 50 ? 'text-green-400' :
                        result.compressionRatio > 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {result.compressionRatio > 50 ? '🎯 Excelente' :
                         result.compressionRatio > 30 ? '✅ Buena' : '⚠️ Moderada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Impacto en batería:</span>
                      <span className={`font-medium ${
                        result.deviceInfo.isLowEnd ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {result.deviceInfo.isLowEnd ? '⚠️ Moderado' : '✅ Bajo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="bg-[#1e2538] rounded-lg p-6 border border-[#3d4659]">
                <h3 className="text-lg font-semibold text-[#ff8c42] mb-4">
                  Recomendaciones para tu Dispositivo
                </h3>
                
                <div className="space-y-3 text-sm">
                  {result.deviceInfo.isLowEnd ? (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <div>
                          <strong className="text-white">Dispositivo de Gama Baja:</strong>
                          <div className="text-gray-300">
                            Evita comprimir múltiples imágenes seguidas para prevenir calentamiento.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">🔋</span>
                        <div>
                          <strong className="text-white">Ahorro de Batería:</strong>
                          <div className="text-gray-300">
                            Comprime imágenes cuando tengas al menos 30% de batería.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">📏</span>
                        <div>
                          <strong className="text-white">Tamaño Recomendado:</strong>
                          <div className="text-gray-300">
                            Mantén las imágenes bajo 10MB para mejor rendimiento.
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">🚀</span>
                        <div>
                          <strong className="text-white">Rendimiento Óptimo:</strong>
                          <div className="text-gray-300">
                            Tu dispositivo puede manejar múltiples compresiones sin problemas.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">⚡</span>
                        <div>
                          <strong className="text-white">Procesamiento Rápido:</strong>
                          <div className="text-gray-300">
                            Puedes usar configuraciones de mayor calidad sin impacto significativo.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 