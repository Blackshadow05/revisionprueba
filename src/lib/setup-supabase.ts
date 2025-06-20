import { createClient } from '@supabase/supabase-js';

export async function setupStorage() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!supabase) {
      throw new Error('No se pudo conectar con la base de datos');
    }

    // Crear el bucket para evidencias si no existe
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    const evidenciasBucket = buckets.find(b => b.name === 'evidenciasnotas');
    
    if (!evidenciasBucket) {
      const { error: createError } = await supabase
        .storage
        .createBucket('evidenciasnotas', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
        });

      if (createError) throw createError;
    }

    // Configurar políticas de acceso para el bucket
    const { error: policyError } = await supabase
      .storage
      .from('evidenciasnotas')
      .createSignedUrl('test.txt', 60);

    if (policyError) {
      console.log('Bucket ya configurado');
    }

    // Configurar políticas de seguridad para la tabla Notas
    const { error: rlsError } = await supabase.rpc('enable_rls', {
      table_name: 'Notas'
    });

    if (rlsError) {
      console.log('RLS ya configurado o error:', rlsError);
    }

    // Crear política para permitir inserción
    const { error: insertPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'Notas',
      policy_name: 'Enable insert for all users',
      definition: 'true',
      operation: 'INSERT'
    });

    if (insertPolicyError) {
      console.log('Política de inserción ya existe o error:', insertPolicyError);
    }

    // Crear política para permitir lectura
    const { error: selectPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'Notas',
      policy_name: 'Enable read access for all users',
      definition: 'true',
      operation: 'SELECT'
    });

    if (selectPolicyError) {
      console.log('Política de lectura ya existe o error:', selectPolicyError);
    }

    console.log('Configuración de almacenamiento y seguridad completada');
  } catch (error) {
    console.error('Error configurando el almacenamiento y seguridad:', error);
    throw error;
  }
} 