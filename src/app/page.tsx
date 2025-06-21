'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';
import BarChartComponent from '@/components/BarChartComponent';

// Tipos optimizados
interface RevisionData {
  id: string;
  created_at: string;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  evidencia_01?: string;
  evidencia_02?: string;
  evidencia_03?: string;
  notas?: string;
  notas_count?: number;
  camas_ordenadas: string;
  cola_caballo: string;
}

// Estados consolidados
interface UIState {
  showLoginModal: boolean;
  showMenuDropdown: boolean;
  showReportModal: boolean;
  isSearchFocused: boolean;
}

interface ModalState {
  isOpen: boolean;
  imageUrl: string | null;
  zoom: number;
  position: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

interface LoginState {
  usuario: string;
  password: string;
  error: string | null;
}

interface ReportState {
  dateFrom: string;
  dateTo: string;
}

// Componente memoizado para cada fila de la tabla
const TableRow = memo(({ 
  row, 
  router, 
  openModal 
}: { 
  row: RevisionData; 
  router: any;
  openModal: (url: string) => void;
}) => (
  <tr className="border-t border-[#3d4659]/50 text-gray-300 hover:bg-[#1e2538]/50 transition-colors duration-200">
    <td className="fixed-column-1 w-[320px] md:w-[200px]">
      <div className="flex flex-col whitespace-nowrap">
        <span className="text-[13px] md:text-xs text-[#c9a45c]">
          {row.created_at.split('+')[0].split('T')[0]}
        </span>
        <span className="text-[13px] md:text-xs text-[#c9a45c]">
          {row.created_at.split('+')[0].split('T')[1].split(':').slice(0,2).join(':')}
        </span>
      </div>
    </td>
    <td className="fixed-column-2 bg-gradient-to-r from-[#1a1f35]/90 to-[#1c2138]/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 border-r border-[#3d4659]/50">
      <button
        onClick={() => router.push(`/detalles/${row.id}`)}
        className={
          (row.notas_count && row.notas_count > 0
            ? 'text-orange-400 font-extrabold underline underline-offset-4 decoration-orange-400/60 hover:text-orange-300 hover:decoration-orange-300/80 scale-105'
            : 'text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300/50') +
          ' transition-colors duration-200 hover:scale-105 transform'
        }
      >
        {row.casita}
      </button>
    </td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.quien_revisa}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.caja_fuerte}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.puertas_ventanas}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.chromecast}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.binoculares}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.trapo_binoculares}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.speaker}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.usb_speaker}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.controles_tv}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.secadora}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.accesorios_secadora}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.steamer}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.bolsa_vapor}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.plancha_cabello}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.bulto}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.sombrero}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.bolso_yute}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.camas_ordenadas}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.cola_caballo}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">{row.notas}</td>
    <td className="px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center gap-1 flex-nowrap">
        {row.evidencia_01 && (
          <button
            type="button"
            onClick={() => openModal(row.evidencia_01!)}
            className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
            title="Ver evidencia 1"
          >
            1
          </button>
        )}
        {row.evidencia_02 && (
          <button
            type="button"
            onClick={() => openModal(row.evidencia_02!)}
            className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
            title="Ver evidencia 2"
          >
            2
          </button>
        )}
        {row.evidencia_03 && (
          <button
            type="button"
            onClick={() => openModal(row.evidencia_03!)}
            className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
            title="Ver evidencia 3"
          >
            3
          </button>
        )}
      </div>
    </td>
  </tr>
));

TableRow.displayName = 'TableRow';

// Constantes
const CAJA_FUERTE_OPTIONS = [
  'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room'
] as const;

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, userRole, login, logout, user } = useAuth();
  
  // Estado para el toggle que persiste en localStorage
  const [isSpecialModeActive, setIsSpecialModeActive] = useState(false);
  
  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('special-mode-active');
      if (savedState !== null) {
        setIsSpecialModeActive(JSON.parse(savedState));
      }
    }
  }, []);
  
  // Función para cambiar el estado y guardarlo en localStorage
  const toggleSpecialMode = () => {
    const newState = !isSpecialModeActive;
    setIsSpecialModeActive(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('special-mode-active', JSON.stringify(newState));
    }
  };
  
  // Estados consolidados
  const [data, setData] = useState<RevisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cajaFuerteFilter, setCajaFuerteFilter] = useState('');
  
  const [uiState, setUiState] = useState<UIState>({
    showLoginModal: false,
    showMenuDropdown: false,
    showReportModal: false,
    isSearchFocused: false,
  });
  
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    imageUrl: null,
    zoom: 1,
    position: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });
  
  const [loginState, setLoginState] = useState<LoginState>({
    usuario: '',
    password: '',
    error: null,
  });
  
  const [reportState, setReportState] = useState<ReportState>({
    dateFrom: '',
    dateTo: '',
  });

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tableScroll, setTableScroll] = useState({ startX: 0, scrollLeft: 0 });

  // Hook para el fondo espectacular
  const spectacularBg = useSpectacularBackground();

  // Función optimizada para obtener revisiones
  const fetchRevisiones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar la conexión con Supabase
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('No se pudo conectar con la base de datos. Por favor, verifica tu conexión.');
      }
      
      // Consulta optimizada: solo campos necesarios
      const { data: revisiones, error } = await supabase
        .from('revisiones_casitas')
        .select(`
          id,
          created_at,
          casita,
          quien_revisa,
          caja_fuerte,
          puertas_ventanas,
          chromecast,
          binoculares,
          trapo_binoculares,
          speaker,
          usb_speaker,
          controles_tv,
          secadora,
          accesorios_secadora,
          steamer,
          bolsa_vapor,
          plancha_cabello,
          bulto,
          sombrero,
          bolso_yute,
          camas_ordenadas,
          cola_caballo,
          evidencia_01,
          evidencia_02,
          evidencia_03,
          notas,
          notas_count
        `)
        .order('created_at', { ascending: false })
        .limit(1000); // Limitar a 1000 registros más recientes

      if (error) {
        console.error('Error fetching data:', error);
        throw new Error('Error al cargar los datos: ' + error.message);
      }

      if (!revisiones) {
        throw new Error('No se encontraron datos');
      }

      setData(revisiones as RevisionData[]);
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrado optimizado con useMemo
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    return data.filter(row => {
      // Filtro por caja fuerte
      const cajaFuerteMatch = !cajaFuerteFilter || row.caja_fuerte === cajaFuerteFilter;
      
      // Si no hay término de búsqueda, solo aplicar filtro de caja fuerte
      if (!searchTerm.trim()) {
        return cajaFuerteMatch;
      }
      
      // Filtro por término de búsqueda (optimizado)
      const searchLower = searchTerm.toLowerCase().trim();
      const searchMatch = 
        row.casita.toLowerCase() === searchLower || 
        row.quien_revisa.toLowerCase().includes(searchLower) ||
        row.caja_fuerte.toLowerCase().includes(searchLower);

      return cajaFuerteMatch && searchMatch;
    });
  }, [data, searchTerm, cajaFuerteFilter]);

  // Handlers optimizados con useCallback
  const openModal = useCallback((imgUrl: string) => {
    setModalState({
      isOpen: true,
      imageUrl: imgUrl,
      zoom: 1,
      position: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
      imageUrl: null,
      zoom: 1,
      position: { x: 0, y: 0 },
    }));
  }, []);

  const handleMenuToggle = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      showMenuDropdown: !prev.showMenuDropdown
    }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginState(prev => ({ ...prev, error: null }));

    try {
      await login(loginState.usuario, loginState.password);
      setUiState(prev => ({ ...prev, showLoginModal: false }));
      setLoginState({ usuario: '', password: '', error: null });
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      setLoginState(prev => ({ ...prev, error: 'Error al iniciar sesión' }));
    }
  }, [login, loginState.usuario, loginState.password]);

  // Handlers de tabla optimizados
  const handleTableMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      const startX = e.pageX - tableContainerRef.current.offsetLeft;
      const scrollLeft = tableContainerRef.current.scrollLeft;
      setTableScroll({ startX, scrollLeft });
      tableContainerRef.current.style.cursor = 'grabbing';
      tableContainerRef.current.style.userSelect = 'none';
    }
  }, []);

  const handleTableMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tableScroll.startX && tableContainerRef.current) {
      e.preventDefault();
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - tableScroll.startX) * 2;
      const newScrollLeft = tableScroll.scrollLeft - walk;
      
      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    }
  }, [tableScroll]);

  const handleTableMouseUp = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
      tableContainerRef.current.style.userSelect = 'auto';
    }
    setTableScroll({ startX: 0, scrollLeft: 0 });
  }, []);

  // Efectos optimizados
  useEffect(() => {
    fetchRevisiones();
  }, [fetchRevisiones]);

  // Efecto consolidado para eventos del DOM
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (uiState.showMenuDropdown) {
        const target = event.target as Element;
        if (!target.closest('.menu-dropdown-container')) {
          setUiState(prev => ({ ...prev, showMenuDropdown: false }));
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalState.isOpen) {
        closeModal();
      }
    };

    // Event listeners
    if (uiState.showMenuDropdown) {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
    }
    
    if (modalState.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [uiState.showMenuDropdown, modalState.isOpen, closeModal]);

  // Efecto para mobile focus
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <main style={spectacularBg} className="relative overflow-hidden">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Botón del menú en posición fija */}
        <div className="absolute top-8 right-8 z-50 menu-dropdown-container">
          <button 
            className="w-12 h-12 bg-[#c9a45c] rounded-xl flex items-center justify-center shadow-lg hover:bg-[#f0c987] transition-colors duration-200"
            onClick={handleMenuToggle}
            type="button"
            aria-label="Abrir menú"
          >
            <div className="flex flex-col gap-1">
              <div className="w-5 h-0.5 bg-[#1a1f35] rounded"></div>
              <div className="w-5 h-0.5 bg-[#1a1f35] rounded"></div>
              <div className="w-5 h-0.5 bg-[#1a1f35] rounded"></div>
            </div>
          </button>
          
          {/* Menú Desplegable */}
          {uiState.showMenuDropdown && (
            <div className="absolute top-14 right-0 w-64 bg-gradient-to-br from-[#1e2538]/95 to-[#2a3347]/95 backdrop-blur-md rounded-xl border border-[#3d4659]/50 shadow-2xl z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-[#c9a45c] uppercase tracking-wider border-b border-[#3d4659]/30 mb-2">
                  Herramientas
                </div>
                <Link
                  href="/unir-imagenes"
                  onClick={() => setUiState(prev => ({ ...prev, showMenuDropdown: false }))}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-[#3d4659]/30 rounded-lg transition-all duration-200 text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Unir imágenes
                </Link>
                
                {isLoggedIn && (
                  <Link
                    href="/estadisticas"
                    onClick={() => setUiState(prev => ({ ...prev, showMenuDropdown: false }))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-[#3d4659]/30 rounded-lg transition-all duration-200 text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    Estadísticas
                  </Link>
                )}

                
                <div className="px-3 py-2 text-xs font-medium text-[#c9a45c] uppercase tracking-wider border-b border-[#3d4659]/30 mb-2 mt-4">
                  Reportes
                </div>
                {userRole === 'SuperAdmin' && (
                  <button
                    onClick={() => {
                      setUiState(prev => ({ ...prev, showReportModal: true }));
                      setUiState(prev => ({ ...prev, showMenuDropdown: false }));
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-[#3d4659]/30 rounded-lg transition-all duration-200 text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Exportar Reporte
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

                {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative">
            {/* Efecto de resplandor de fondo - Solo si NO es modo rendimiento */}
            {!isSpecialModeActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 blur-3xl rounded-full transform scale-150"></div>
            )}
            
            {/* Título principal con efectos modernos */}
            <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-black tracking-tight">
              <span className={isSpecialModeActive 
                ? "block text-white" 
                : "block bg-gradient-to-r from-white via-[#f0c987] to-[#c9a45c] bg-clip-text text-transparent drop-shadow-2xl"
              }>
                Revisión
              </span>
              <span className={isSpecialModeActive 
                ? "block text-[#c9a45c] mt-2" 
                : "block bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-white bg-clip-text text-transparent mt-2 transform -translate-x-2"
              }>
                de Casitas
              </span>
            </h1>
            
            {/* Línea decorativa animada - Solo si NO es modo rendimiento */}
            {!isSpecialModeActive && (
              <div className="relative mt-6 h-1 w-32 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Acciones Mejorada */}
        <div className={`${isSpecialModeActive ? 'bg-[#2a3347] border border-[#3d4659]' : 'bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md border border-[#3d4659]/50'} rounded-xl p-6 mb-8`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Info del Usuario */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#1a1f35]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user}</p>
                    <p className="text-[#c9a45c] text-sm">{userRole}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-3">
              {userRole === 'SuperAdmin' && (
                <button
                  onClick={() => router.push('/gestion-usuarios')}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25 flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  Gestión Usuarios
                </button>
              )}

              {isLoggedIn ? (
                <button
                  onClick={logout}
                  className={
                    isSpecialModeActive
                      ? "px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium flex items-center gap-2 border border-red-600"
                      : "metallic-button metallic-button-red px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 font-medium"
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Cerrar Sesión
                </button>
              ) : (
                <button
                  onClick={() => setUiState(prev => ({ ...prev, showLoginModal: true }))}
                  className="metallic-button metallic-button-gold px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:shadow-[#c9a45c]/40 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Iniciar Sesión
                </button>
              )}

              <button
                onClick={() => {
                  // Limpiar localStorage del formulario antes de navegar
                  localStorage.removeItem('revision-form-data');
                  localStorage.removeItem('revision-highlighted-field');
                  router.push('/nueva-revision');
                }}
                className={
                  isSpecialModeActive
                    ? "px-8 py-3 bg-green-600 text-white rounded-xl font-medium text-lg min-w-[200px] flex items-center gap-3 justify-center border border-green-600"
                    : "nueva-revision-button px-8 py-3 text-white rounded-xl hover:shadow-lg hover:shadow-[#098042]/40 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-3 font-medium text-lg min-w-[200px] justify-center"
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva Revisión
              </button>


            </div>
          </div>
        </div>

        {/* Toggle simple sin funcionalidad */}
        <div className={`${isSpecialModeActive ? 'bg-[#2a3347] border border-[#3d4659]' : 'bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md border border-[#3d4659]/50'} rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1a1f35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Modo Rendimiento</h3>
                <p className="text-gray-400 text-sm">Función en desarrollo</p>
              </div>
            </div>

            <button
              className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${isSpecialModeActive ? 'bg-green-500 focus:ring-green-300/50' : 'bg-gray-600 focus:ring-gray-300/50'}`}
              onClick={toggleSpecialMode}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 flex items-center justify-center text-xs ${isSpecialModeActive ? 'translate-x-8 bg-green-400' : 'translate-x-0'}`}>
                {isSpecialModeActive ? '✅' : '⚪'}
              </div>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros Mejorada */}
        <div className={`${isSpecialModeActive ? 'bg-[#2a3347] border border-[#3d4659]' : 'bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md border border-[#3d4659]/50'} rounded-xl p-6 mb-8`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda Principal */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por casita, revisor o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${isSpecialModeActive 
                  ? 'bg-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50' 
                  : 'bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30'
                }`}
                onFocus={() => setUiState(prev => ({ ...prev, isSearchFocused: true }))}
                onBlur={() => setUiState(prev => ({ ...prev, isSearchFocused: false }))}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtro por Caja Fuerte */}
            <div className="relative">
              <select
                value={cajaFuerteFilter}
                onChange={(e) => setCajaFuerteFilter(e.target.value)}
                className={`w-full lg:w-48 px-4 py-3 ${isSpecialModeActive 
                  ? 'bg-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 appearance-none cursor-pointer' 
                  : 'bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 appearance-none cursor-pointer'
                }`}
              >
                <option value="">Todas las cajas</option>
                {CAJA_FUERTE_OPTIONS.map(option => (
                  <option key={option} value={option} className="bg-[#1e2538]">{option}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-4 h-4 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {(searchTerm || cajaFuerteFilter) && (
            <div className="mt-4 pt-4 border-t border-[#3d4659]/50">
              <p className="text-gray-400 text-sm">
                Mostrando {filteredData.length} de {data.length} revisiones
                {searchTerm && <span> para "{searchTerm}"</span>}
                {cajaFuerteFilter && <span> con caja fuerte "{cajaFuerteFilter}"</span>}
              </p>
            </div>
          )}
        </div>

        {/* Tabla con diseño moderno - Solo visible si el usuario está logueado */}
        {isLoggedIn ? (
          <>
            {loading && !error ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">
                <p>Cargando datos...</p>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden rounded-xl shadow-[0_8px_32px_rgb(0_0_0/0.2)] backdrop-blur-md bg-[#1e2538]/80 border border-[#3d4659]/50">
                  <div 
                    ref={tableContainerRef} 
                    className="table-container overflow-x-auto relative cursor-grab"
                    onMouseDown={handleTableMouseDown}
                    onMouseLeave={handleTableMouseUp}
                    onMouseUp={handleTableMouseUp}
                    onMouseMove={handleTableMouseMove}
                  >
                    <table className="min-w-full divide-y divide-[#3d4659]/50">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md text-gray-300 text-left">
                          <th className="fixed-column-1 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 border-r border-[#3d4659]/50">Fecha</th>
                          <th className="fixed-column-2 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 border-r border-[#3d4659]/50">Casita</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Quien revisa</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Caja fuerte</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Puertas/Ventanas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Chromecast</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Binoculares</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Trapo binoculares</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Speaker</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">USB Speaker</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Controles TV</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Secadora</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Accesorios secadora</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Steamer</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bolsa vapor</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Plancha cabello</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bulto</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Sombrero</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bolso yute</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Camas ordenadas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Cola caballo</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Notas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Evidencias</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3d4659]/50">
                        {filteredData.map((row, index) => (
                          <TableRow
                            key={row.id || index}
                            row={row}
                            router={router}
                            openModal={openModal}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-8 border border-[#3d4659]/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h3>
            <p className="text-gray-400">Debes iniciar sesión para ver los datos de las revisiones</p>
          </div>
        )}

        {/* Modal de imagen mejorado */}
        {modalState.isOpen && modalState.imageUrl && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
            <div className="relative w-full h-full max-w-7xl max-h-screen overflow-hidden">
              {/* Barra superior con controles */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Evidencia Fotográfica</h3>
                      <p className="text-gray-300 text-sm">Zoom: {Math.round(modalState.zoom * 100)}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Controles de zoom */}
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg p-1">
                      <button
                        onClick={() => {
                          const newZoom = Math.max(1, Math.min(5, modalState.zoom / 1.2));
                          setModalState(prev => ({ ...prev, zoom: newZoom }));
                        }}
                        className="w-8 h-8 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-all duration-200"
                        title="Alejar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="px-2 py-1 text-white text-xs font-medium min-w-[50px] text-center">
                        {Math.round(modalState.zoom * 100)}%
                      </div>
                      <button
                        onClick={() => {
                          const newZoom = Math.min(5, modalState.zoom * 1.2);
                          setModalState(prev => ({ ...prev, zoom: newZoom }));
                        }}
                        className="w-8 h-8 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-all duration-200"
                        title="Acercar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setModalState(prev => ({ ...prev, zoom: 1, position: { x: 0, y: 0 } }));
                        }}
                        className="ml-1 px-2 py-1 text-white hover:bg-white/20 rounded-md text-xs transition-all duration-200"
                        title="Restablecer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón cerrar - SIEMPRE visible con z-index alto */}
              <button
                onClick={closeModal}
                className="fixed top-4 right-4 z-[60] w-12 h-12 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border-2 border-white/20 shadow-2xl"
                title="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Contenedor de imagen */}
              <div className="w-full h-full flex items-center justify-center p-4 pt-20">
                <img
                  ref={imgRef}
                  src={modalState.imageUrl}
                  alt="Evidencia"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  style={{
                    transform: `scale(${modalState.zoom}) translate(${modalState.position.x}px, ${modalState.position.y}px)`,
                    cursor: modalState.zoom > 1 ? (modalState.isDragging ? 'grabbing' : 'grab') : 'default',
                    transition: modalState.isDragging ? 'none' : 'transform 0.1s ease-out',
                    touchAction: 'none'
                  }}
                  onWheel={(e: React.WheelEvent) => {
                    e.preventDefault();
                    const delta = e.deltaY;
                    const newZoom = delta < 0 ? modalState.zoom * 1.1 : modalState.zoom / 1.1;
                    setModalState(prev => ({ ...prev, zoom: Math.min(Math.max(1, newZoom), 5) }));
                  }}
                  onMouseDown={(e) => {
                    if (modalState.zoom > 1) {
                      e.preventDefault();
                      setModalState(prev => ({ ...prev, isDragging: true, dragStart: { x: e.clientX - modalState.position.x, y: e.clientY - modalState.position.y } }));
                    }
                  }}
                  onMouseMove={(e) => {
                    if (modalState.isDragging && modalState.zoom > 1) {
                      e.preventDefault();
                      const newX = e.clientX - modalState.dragStart.x;
                      const newY = e.clientY - modalState.dragStart.y;
                      
                      const img = imgRef.current;
                      if (img) {
                        const rect = img.getBoundingClientRect();
                        const scaledWidth = rect.width * modalState.zoom;
                        const scaledHeight = rect.height * modalState.zoom;
                        
                        const maxX = (scaledWidth - rect.width) / 2;
                        const maxY = (scaledHeight - rect.height) / 2;
                        
                        setModalState(prev => ({ ...prev, position: { x: Math.min(Math.max(-maxX, newX), maxX), y: Math.min(Math.max(-maxY, newY), maxY) } }));
                      }
                    }
                  }}
                  onMouseUp={() => {
                    setModalState(prev => ({ ...prev, isDragging: false }));
                  }}
                  onMouseLeave={() => {
                    setModalState(prev => ({ ...prev, isDragging: false }));
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      e.preventDefault();
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const initialDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                      );
                      setModalState(prev => ({ ...prev, dragStart: { x: initialDistance, y: 0 } }));
                    } else if (e.touches.length === 1 && modalState.zoom > 1) {
                      e.preventDefault();
                      setModalState(prev => ({ ...prev, isDragging: true, dragStart: { x: e.touches[0].clientX - modalState.position.x, y: e.touches[0].clientY - modalState.position.y } }));
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 2) {
                      e.preventDefault();
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const currentDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                      );
                      const scaleChange = currentDistance / modalState.dragStart.x;
                      const newZoom = Math.max(1, Math.min(5, modalState.zoom * scaleChange));
                      setModalState(prev => ({ ...prev, zoom: newZoom, dragStart: { x: currentDistance, y: 0 } }));
                    } else if (e.touches.length === 1 && modalState.isDragging && modalState.zoom > 1) {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const newX = touch.clientX - modalState.dragStart.x;
                      const newY = touch.clientY - modalState.dragStart.y;
                      
                      const img = imgRef.current;
                      if (img) {
                        const rect = img.getBoundingClientRect();
                        const scaledWidth = rect.width * modalState.zoom;
                        const scaledHeight = rect.height * modalState.zoom;
                        
                        const maxX = (scaledWidth - rect.width) / 2;
                        const maxY = (scaledHeight - rect.height) / 2;
                        
                        setModalState(prev => ({ ...prev, position: { x: Math.min(Math.max(-maxX, newX), maxX), y: Math.min(Math.max(-maxY, newY), maxY) } }));
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    setModalState(prev => ({ ...prev, isDragging: false }));
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                />
              </div>

              {/* Indicador de instrucciones - Solo para móviles */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
                  <div className="flex items-center justify-center text-xs">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                      Pellizcar para hacer zoom • Arrastrar para mover
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Login Modernizado */}
        {uiState.showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e2538] to-[#2a3347] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#3d4659]/50 backdrop-blur-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                  Iniciar Sesión
                </h2>
                <p className="text-gray-400 mt-2">Accede a tu cuenta para continuar</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={loginState.usuario}
                    onChange={(e) => setLoginState({ ...loginState, usuario: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={loginState.password}
                    onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
                
                {loginState.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {loginState.error}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUiState(prev => ({ ...prev, showLoginModal: false }))}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-600/25 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#d4b06c] hover:to-[#f5d49a] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[#c9a45c]/25 font-medium"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Reportes */}
        {uiState.showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e2538] to-[#2a3347] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#3d4659]/50 backdrop-blur-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                  Exportar Reporte
                </h2>
                <p className="text-gray-400 mt-2">Selecciona el rango de fechas para el reporte</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={reportState.dateFrom}
                    onChange={(e) => setReportState({ ...reportState, dateFrom: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:border-green-500/30"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={reportState.dateTo}
                    onChange={(e) => setReportState({ ...reportState, dateTo: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:border-green-500/30"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUiState(prev => ({ ...prev, showReportModal: false }));
                      setReportState({ dateFrom: '', dateTo: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-600/25 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUiState(prev => ({ ...prev, showReportModal: false }));
                      setReportState({ dateFrom: '', dateTo: '' });
                    }}
                    disabled={!reportState.dateFrom || !reportState.dateTo}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </main>
  );
} 