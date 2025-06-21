import { setupStorage } from '@/lib/setup-supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas');
    }

    await setupStorage();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en setup:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la configuración' },
      { status: 500 }
    );
  }
} 