import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Las variables de entorno de Supabase no están configuradas');
}

// Validar la URL de Supabase
const isValidUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Crear el cliente de Supabase
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'revision-casitas'
        }
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
      }
  }
);

// Función de utilidad para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('revisiones_casitas').select('id').limit(1);
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error al verificar la conexión con Supabase:', error);
    return false;
  }
}; 