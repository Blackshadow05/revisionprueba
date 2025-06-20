import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'evidencias' | 'notas' || 'evidencias';
    const customFileName = formData.get('customFileName') as string || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    console.log(`📤 API: Subiendo archivo ${file.name} (${file.size} bytes) a ImageKit.io`);

    // Subir archivo a ImageKit.io
    const url = await uploadToImageKit(file, type, customFileName);

    console.log(`✅ API: Archivo subido exitosamente: ${url}`);

    return NextResponse.json({
      success: true,
      url,
      message: 'Archivo subido exitosamente'
    });

  } catch (error: any) {
    console.error('❌ API: Error al subir archivo:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al subir el archivo',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 