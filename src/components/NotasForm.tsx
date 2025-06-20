import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

interface FormData {
  fecha: string;
  casita: string;
  Usuario: string;
  nota: string;
  evidencia: File | null;
}

interface NotasFormProps {
  onClose: () => void;
  revisionId?: string;
  casita?: string;
}

export default function NotasForm({ onClose, revisionId, casita }: NotasFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    casita: casita || '',
    Usuario: '',
    nota: '',
    evidencia: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let evidenciaUrl = null;
      if (formData.evidencia) {
        const fileExt = formData.evidencia.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, formData.evidencia);

        if (uploadError) throw uploadError;
        evidenciaUrl = uploadData?.path;
      }

      const { error: insertError } = await supabase
        .from('Notas')
        .insert([
          {
            fecha: formData.fecha,
            Casita: formData.casita,
            revision_id: revisionId,
            Usuario: formData.Usuario,
            nota: formData.nota,
            Evidencia: evidenciaUrl
          }
        ]);

      if (insertError) throw insertError;

      // Limpiar el formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        casita: '',
        Usuario: '',
        nota: '',
        evidencia: null
      });
      setError(null);
      setSuccess(true);
      
      // Mostrar mensaje de éxito
      alert('Nota guardada exitosamente');
      
      // Redirigir a la página principal
      router.push('/');
    } catch (error: any) {
      console.error('Error al guardar la nota:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Nueva Nota</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Nota guardada exitosamente
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Casita</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.casita}
              onChange={(e) => setFormData({ ...formData, casita: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.Usuario}
              onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Nota</label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              value={formData.nota}
              onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Evidencia</label>
            <input
              type="file"
              className="mt-1 block w-full"
              accept="image/*,.pdf"
              onChange={(e) => setFormData({ ...formData, evidencia: e.target.files?.[0] || null })}
            />
            <p className="mt-1 text-sm text-gray-500">
              Formatos permitidos: JPG, PNG, GIF, PDF. Máximo 5MB
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 