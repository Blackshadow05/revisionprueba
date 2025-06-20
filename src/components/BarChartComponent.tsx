import React, { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: ChartDataItem[];
  title: string;
  barColor: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataItem;
  }>;
  label?: string;
}

// Hook para detectar capacidades del dispositivo
const useDeviceCapabilities = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return { isHighEnd: false, isMobile: false };
    
    // Detectar dispositivos de gama alta basado en múltiples indicadores
    const hardwareCores = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 2;
    const userAgent = navigator.userAgent;
    
    // Detectar GPUs de gama alta
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const renderer = gl ? (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER) || '' : '';
    
    const hasHighEndGPU = 
      renderer.includes('Adreno 6') || // Snapdragon gama alta
      renderer.includes('Adreno 7') ||
      renderer.includes('Mali-G7') || // MediaTek/Samsung gama alta
      renderer.includes('Mali-G9') ||
      renderer.includes('Apple GPU') || // iPhones/iPads
      renderer.includes('PowerVR'); // Algunos dispositivos premium
    
    // Detectar dispositivos específicos de gama alta
    const isHighEndDevice = 
      userAgent.includes('iPhone1') || // iPhone 12+
      userAgent.includes('iPhone1[3-9]') || // iPhone 13-19
      userAgent.includes('SM-G99') || // Galaxy S22+
      userAgent.includes('SM-G98') || // Galaxy S21+
      userAgent.includes('Pixel 6') ||
      userAgent.includes('Pixel 7') ||
      userAgent.includes('Pixel 8');
    
    const isHighEnd = 
      hardwareCores >= 6 || // 6+ núcleos
      deviceMemory >= 4 || // 4GB+ RAM
      hasHighEndGPU ||
      isHighEndDevice;
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return { isHighEnd, isMobile, hardwareCores, deviceMemory };
  }, []);
};

// Tooltip básico para dispositivos de gama baja
const BasicTooltip = memo<TooltipProps>(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 p-2 border border-gray-600 rounded shadow-md max-w-xs">
        <p className="text-xs font-medium text-gray-200 mb-1">{label}</p>
        <p className="text-xs text-blue-400">Cantidad: {payload[0].value}</p>
      </div>
    );
  }
  return null;
});

BasicTooltip.displayName = 'BasicTooltip';

// Tooltip premium para dispositivos de gama alta
const PremiumTooltip = memo<TooltipProps>(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 bg-opacity-95 p-3 border border-gray-600 rounded-lg shadow-xl max-w-xs backdrop-blur-sm transition-all duration-300 transform hover:scale-105">
        <p className="text-xs sm:text-sm font-semibold text-gray-200 mb-1">{label}</p>
        <p className="text-xs sm:text-sm text-blue-400">
          Cantidad: {payload[0].value.toLocaleString()}
        </p>
        <div className="mt-1 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
      </div>
    );
  }
  return null;
});

PremiumTooltip.displayName = 'PremiumTooltip';

const BarChartComponent = memo<BarChartComponentProps>(({ 
  data, 
  title, 
  barColor, 
  xAxisLabel, 
  yAxisLabel 
}) => {
  const { isHighEnd, isMobile } = useDeviceCapabilities();

  // Configuración adaptativa según capacidades del dispositivo
  const chartConfig = useMemo(() => ({
    margin: { top: 5, right: 10, left: 5, bottom: 40 },
    barSize: isHighEnd ? 30 : 25, // Barras más grandes en gama alta
    showGrid: !isMobile || isHighEnd, // Grid siempre en gama alta
    animationDuration: isHighEnd ? 800 : 300, // Animaciones más largas en gama alta
    useGradients: isHighEnd, // Gradientes solo en gama alta
    strokeOpacity: isHighEnd ? 0.6 : 0.4
  }), [isHighEnd, isMobile]);

  // Memoizar configuración de ejes
  const axisConfig = useMemo(() => ({
    xAxis: {
      tick: { fontSize: isHighEnd ? 9 : 8, fill: '#E2E8F0' },
      label: xAxisLabel ? { 
        value: xAxisLabel, 
        position: 'insideBottom', 
        offset: -60, 
        fill: '#E2E8F0', 
        fontSize: isHighEnd ? 11 : 10 
      } : undefined
    },
    yAxis: {
      tick: { fontSize: isHighEnd ? 11 : 10, fill: '#E2E8F0' },
      label: yAxisLabel ? { 
        value: yAxisLabel, 
        angle: -90, 
        position: 'insideLeft', 
        fill: '#E2E8F0', 
        fontSize: isHighEnd ? 11 : 10, 
        dx: -5 
      } : undefined
    }
  }), [xAxisLabel, yAxisLabel, isHighEnd]);

  // Estilos adaptativos del contenedor
  const containerStyles = useMemo(() => {
    const baseStyles = "p-3 sm:p-4 lg:p-6 rounded-lg h-80 sm:h-96 flex flex-col";
    
    if (isHighEnd) {
      return `bg-gray-800 backdrop-blur-sm bg-opacity-80 shadow-xl ${baseStyles}`; // Efectos premium
    }
    return `bg-gray-800 shadow-md ${baseStyles}`; // Efectos básicos
  }, [isHighEnd]);

  // Seleccionar componente de tooltip según capacidades
  const TooltipComponent = isHighEnd ? PremiumTooltip : BasicTooltip;

  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 p-4 rounded-lg ${isHighEnd ? 'shadow-xl backdrop-blur-sm bg-opacity-80' : 'shadow-md'} h-96 flex flex-col items-center justify-center`}>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
        <p className="text-gray-400">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-200 mb-2 sm:mb-4 text-center">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartConfig.margin}>
          {/* Definir gradientes para dispositivos de gama alta */}
          {chartConfig.useGradients && (
            <defs>
              <linearGradient id={`gradient-${barColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={barColor} stopOpacity={1}/>
                <stop offset="100%" stopColor={barColor} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          )}
          
          {chartConfig.showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#4A5568" 
              strokeOpacity={chartConfig.strokeOpacity}
            />
          )}
          
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={axisConfig.xAxis.tick}
            label={axisConfig.xAxis.label}
          />
          
          <YAxis 
            allowDecimals={false} 
            tick={axisConfig.yAxis.tick}
            label={axisConfig.yAxis.label}
          />
          
          <Tooltip 
            content={<TooltipComponent />} 
            cursor={{ 
              fill: 'rgba(255, 255, 255, 0.1)',
              ...(isHighEnd && { 
                transition: 'all 0.2s ease',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              })
            }}
            animationDuration={chartConfig.animationDuration}
          />
          
          <Legend 
            wrapperStyle={{
              paddingTop: '15px', 
              color: '#E2E8F0', 
              fontSize: isHighEnd ? '14px' : '12px'
            }}
          />
          
          <Bar 
            dataKey="value" 
            name="Cantidad" 
            fill={chartConfig.useGradients 
              ? `url(#gradient-${barColor.replace('#', '')})` 
              : barColor
            }
            radius={[3, 3, 0, 0]} 
            barSize={chartConfig.barSize}
            animationDuration={chartConfig.animationDuration}
            {...(isHighEnd && {
              animationEasing: 'ease-out',
              cursor: 'pointer'
            })}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

BarChartComponent.displayName = 'BarChartComponent';

export default BarChartComponent; 