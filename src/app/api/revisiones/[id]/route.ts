import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Asegurarnos de que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Crear el cliente de Supabase solo si las variables están disponibles
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      console.error('Error: Variables de entorno no configuradas');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }
    
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('revisiones_casitas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Revisión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 