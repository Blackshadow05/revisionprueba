'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';

// Importar BarChartComponent dinámicamente con Suspense optimizado
const BarChartComponent = dynamic(() => import('../../components/BarChartComponent'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-6 rounded-lg shadow-xl h-96 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 bg-gray-600 rounded mb-2"></div>
        <div className="text-gray-400 text-sm">Cargando gráfico...</div>
      </div>
    </div>
  )
});

// Tipos optimizados
interface RevisionCasita {
  quien_revisa: string;
  caja_fuerte: string;
  casita: string;
  created_at: string;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface ProcessedStats {
  totalRevisiones: number;
  revisionesHoy: number;
  casitasCheckIn: ChartDataItem[];
  quienRevisa: ChartDataItem[];
  quienRevisaCheckOut: ChartDataItem[];
}

// Constantes optimizadas
const CHART_COLORS = {
  PRIMARY: "#3B82F6",
  SECONDARY: "#10B981", 
  TERTIARY: "#F59E0B"
} as const;

const CHECK_IN_VALUE = 'Check in';
const CHECK_OUT_VALUE = 'Check out';

export default function EstadisticasPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const appBackgroundStyle = useSpectacularBackground();

  // Función optimizada para procesar todos los datos de una vez
  const processAllStats = useCallback((data: RevisionCasita[]): ProcessedStats => {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filtrar datos del año actual una sola vez
    const currentYearData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate.getFullYear() === currentYear;
    });

    // Contadores para todos los estadísticas
    const casitasCheckInCounts: Record<string, number> = {};
    const quienRevisaCounts: Record<string, number> = {};
    const quienRevisaCheckOutCounts: Record<string, number> = {};
    
    let revisionesHoyCount = 0;

    // Procesar todos los datos en una sola pasada
    currentYearData.forEach(item => {
      const itemDate = new Date(item.created_at);
      
      // Contar revisiones de hoy
      if (itemDate >= today && itemDate < tomorrow) {
        revisionesHoyCount++;
      }

      // Procesar casitas check-in
      if (item.caja_fuerte === CHECK_IN_VALUE && item.casita) {
        casitasCheckInCounts[item.casita] = (casitasCheckInCounts[item.casita] || 0) + 1;
      }

      // Procesar quien revisa (general)
      if (item.quien_revisa) {
        quienRevisaCounts[item.quien_revisa] = (quienRevisaCounts[item.quien_revisa] || 0) + 1;
      }

      // Procesar quien revisa check-out
      if (item.caja_fuerte === CHECK_OUT_VALUE && item.quien_revisa) {
        quienRevisaCheckOutCounts[item.quien_revisa] = (quienRevisaCheckOutCounts[item.quien_revisa] || 0) + 1;
      }
    });

    // Convertir a formato de gráficos y ordenar
    const createSortedChartData = (counts: Record<string, number>, limit: number): ChartDataItem[] => 
      Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    return {
      totalRevisiones: currentYearData.length,
      revisionesHoy: revisionesHoyCount,
      casitasCheckIn: createSortedChartData(casitasCheckInCounts, 10),
      quienRevisa: createSortedChartData(quienRevisaCounts, 12),
      quienRevisaCheckOut: createSortedChartData(quienRevisaCheckOutCounts, 10),
    };
  }, []);

  // Verificar autenticación y cargar datos
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Consulta optimizada: solo los campos necesarios y filtro por año en el servidor
        const currentYear = new Date().getFullYear();
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear + 1}-01-01`;
        
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('quien_revisa, caja_fuerte, casita, created_at')
          .gte('created_at', yearStart)
          .lt('created_at', yearEnd)
          .not('quien_revisa', 'is', null)
          .not('caja_fuerte', 'is', null)
          .not('casita', 'is', null);

        if (error) {
          console.error('Error fetching data from Supabase:', error);
          throw error;
        }

        if (data) {
          const processedStats = processAllStats(data as RevisionCasita[]);
          setStats(processedStats);
        }
      } catch (err) {
        setError('Error al cargar los datos. Por favor, inténtelo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isLoggedIn, router, processAllStats]);

  // Early returns optimizados
  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div style={appBackgroundStyle} className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={appBackgroundStyle} className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-8 rounded-lg shadow-xl text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Oops! Algo salió mal.</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div style={appBackgroundStyle} className="min-h-screen p-3 sm:p-4 md:p-8">
      {/* Botón de volver */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-700 bg-opacity-80 backdrop-blur-sm text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium relative overflow-hidden"
          style={{ padding: '10px 18px' }}
        >
          {/* Efecto de brillo continuo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
          <div className="relative z-10 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </div>
        </button>
      </div>

      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center">Panel de Estadísticas de Revisiones</h1>
      </header>

      {/* Info Cards Section optimizada */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Total Revisiones (Año Actual)</h3>
          <p className="text-3xl sm:text-4xl font-bold text-sky-400">{stats.totalRevisiones.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Revisiones hechas hoy</h3>
          <p className="text-3xl sm:text-4xl font-bold text-emerald-400">{stats.revisionesHoy.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section - Renderizado optimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <BarChartComponent
          data={stats.casitasCheckIn}
          title="Estadística Casitas Check in (Año Actual)"
          barColor={CHART_COLORS.PRIMARY}
          xAxisLabel="Casita"
          yAxisLabel="Número de Revisiones"
        />
        
        <BarChartComponent
          data={stats.quienRevisa}
          title="Estadística Revisiones (Año Actual)"
          barColor={CHART_COLORS.SECONDARY}
          xAxisLabel="Persona que revisa"
          yAxisLabel="Número de Revisiones"
        />

        <BarChartComponent
          data={stats.quienRevisaCheckOut}
          title="Estadísticas Check out (Año Actual)"
          barColor={CHART_COLORS.TERTIARY}
          xAxisLabel="Persona que revisa"
          yAxisLabel="Número de Revisiones"
        />
      </div>
      
      <footer className="mt-12 text-center text-sm text-gray-400">
        <p>Revision Casitas Ag, Todos los derechos reservados.</p>
      </footer>
    </div>
  );
} 