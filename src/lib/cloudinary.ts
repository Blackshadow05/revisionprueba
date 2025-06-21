import { getWeek } from 'date-fns';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const week = `semana_${getWeek(now, { weekStartsOn: 1 })}`;
  const folder = `prueba-imagenes/${month}/${week}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('cloud_name', 'dhd61lan4');
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dhd61lan4/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    
    // Agregar optimizaciones automáticas f_auto,q_auto a la URL
    const originalUrl = data.secure_url;
    const optimizedUrl = originalUrl.replace('/upload/', '/upload/f_auto,q_auto/');
    
    return optimizedUrl;
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error);
    throw error;
  }
};

/**
 * Optimiza una URL de Cloudinary existente agregando f_auto,q_auto
 * @param url - URL de Cloudinary sin optimizaciones
 * @returns URL optimizada con f_auto,q_auto
 */
export const optimizeCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Si ya tiene optimizaciones, no las duplicamos
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }
  
  // Agregar f_auto,q_auto después de /upload/
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

/**
 * Convierte una URL de Cloudinary optimizada de vuelta a la original
 * @param url - URL de Cloudinary optimizada
 * @returns URL original sin optimizaciones
 */
export const getOriginalCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Remover f_auto,q_auto y otras transformaciones comunes
  return url.replace(/\/upload\/[^/]*\//, '/upload/');
};

/**
 * Migra todas las URLs de Cloudinary existentes en Supabase para agregar f_auto,q_auto
 * @returns Número de URLs actualizadas
 */
export const migrateExistingCloudinaryUrls = async (): Promise<number> => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Obtener todos los registros que tienen URLs de evidencia
    const { data: records, error: fetchError } = await supabase
      .from('revisiones_casitas')
      .select('id, evidencia_01, evidencia_02, evidencia_03')
      .or('evidencia_01.neq.,evidencia_02.neq.,evidencia_03.neq.');

    if (fetchError) {
      console.error('Error fetching records:', fetchError);
      return 0;
    }

    if (!records || records.length === 0) {
      console.log('No records found to migrate');
      return 0;
    }

    let updatedCount = 0;

    // Procesar cada registro
    for (const record of records) {
      const updates: any = {};
      let hasUpdates = false;

      // Verificar y optimizar evidencia_01
      if (record.evidencia_01 && record.evidencia_01.includes('cloudinary.com') && !record.evidencia_01.includes('f_auto')) {
        updates.evidencia_01 = optimizeCloudinaryUrl(record.evidencia_01);
        hasUpdates = true;
      }

      // Verificar y optimizar evidencia_02
      if (record.evidencia_02 && record.evidencia_02.includes('cloudinary.com') && !record.evidencia_02.includes('f_auto')) {
        updates.evidencia_02 = optimizeCloudinaryUrl(record.evidencia_02);
        hasUpdates = true;
      }

      // Verificar y optimizar evidencia_03
      if (record.evidencia_03 && record.evidencia_03.includes('cloudinary.com') && !record.evidencia_03.includes('f_auto')) {
        updates.evidencia_03 = optimizeCloudinaryUrl(record.evidencia_03);
        hasUpdates = true;
      }

      // Actualizar el registro si hay cambios
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('revisiones_casitas')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated record ${record.id}:`, updates);
        }
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} records.`);
    return updatedCount;

  } catch (error) {
    console.error('Error in migration:', error);
    return 0;
  }
}; 