'use client';

// Forzar nueva ejecución del workflow
// Página de gestión de usuarios - Permite crear, editar y eliminar usuarios del sistema
// Solo accesible para usuarios con rol SuperAdmin

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';

interface Usuario {
  id: string | null;
  Usuario: string;
  password_hash: string;
  Rol: string;
  created_at: string;
}

export default function GestionUsuarios() {
  const router = useRouter();
  const { userRole } = useAuth();
  const spectacularBg = useSpectacularBackground();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<Omit<Usuario, 'id' | 'created_at'>>({
    Usuario: '',
    password_hash: '',
    Rol: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!userRole) {
          console.log('Esperando carga del rol...');
          return;
        }

        console.log('Rol actual:', userRole);
        
        if (userRole !== 'SuperAdmin') {
          console.log('Acceso denegado: Rol no autorizado');
          router.push('/');
          return;
        }

        await fetchUsuarios();
      } catch (error) {
        console.error('Error al verificar acceso:', error);
        setError('Error al verificar permisos de acceso');
      }
    };

    checkAccess();
  }, [userRole, router]);

  const fetchUsuarios = async () => {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      console.log('Iniciando fetch de usuarios...');
      const { data, error } = await supabase
        .from('Usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en la consulta:', error);
        throw error;
      }

      console.log('Usuarios obtenidos:', data?.length);
      setUsuarios(data || []);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing && editingId) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('Usuarios')
          .update({
            Usuario: nuevoUsuario.Usuario,
            password_hash: nuevoUsuario.password_hash,
            Rol: nuevoUsuario.Rol
          })
          .eq('id', editingId);

        if (error) throw error;
        console.log('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        const { error } = await supabase
          .from('Usuarios')
          .insert([{
            Usuario: nuevoUsuario.Usuario,
            password_hash: nuevoUsuario.password_hash,
            Rol: nuevoUsuario.Rol,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        console.log('Usuario creado correctamente');
      }

      setNuevoUsuario({
        Usuario: '',
        password_hash: '',
        Rol: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setError(null);
      await fetchUsuarios();
    } catch (error: any) {
      console.error('Error al procesar usuario:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setNuevoUsuario({
      Usuario: usuario.Usuario,
      password_hash: usuario.password_hash,
      Rol: usuario.Rol
    });
    setIsEditing(true);
    setEditingId(usuario.id);
  };

  const handleDelete = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete?.id) return;

    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      const { error } = await supabase
        .from('Usuarios')
        .delete()
        .eq('id', usuarioToDelete.id);

      if (error) throw error;
      await fetchUsuarios();
      setShowDeleteModal(false);
      setUsuarioToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setNuevoUsuario({
      Usuario: '',
      password_hash: '',
      Rol: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  if (loading) return <div style={spectacularBg} className="flex items-center justify-center text-white min-h-screen">Cargando...</div>;
  if (error) return <div style={spectacularBg} className="flex items-center justify-center text-red-500 min-h-screen">Error: {error}</div>;

  return (
    <main style={spectacularBg} className="py-8">
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && usuarioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e2538] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">¿Eliminar Usuario?</h3>
              <p className="text-gray-300">
                ¿Estás seguro de que deseas eliminar el usuario <span className="font-semibold text-[#c9a45c]">{usuarioToDelete.Usuario}</span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUsuarioToDelete(null);
                }}
                className="px-4 py-2 bg-[#3d4659] text-gray-300 rounded-lg hover:bg-[#4a5568] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#1e2538] rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 text-[#1a1f35] bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] rounded-xl hover:from-[#d4b06c] hover:via-[#e0bc7c] hover:to-[#f7d498] transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2 border-white/40 hover:border-white/60 font-medium flex items-center justify-center gap-2"
            >
              {/* Efecto de brillo continuo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
              <div className="relative z-10 flex items-center gap-2">
                Volver
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  value={nuevoUsuario.Usuario}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, Usuario: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={nuevoUsuario.password_hash}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password_hash: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Rol
                </label>
                <select
                  required
                  value={nuevoUsuario.Rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, Rol: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]"
                >
                  <option value="">Seleccionar rol</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-[#3d4659] text-gray-300 rounded-lg hover:bg-[#4a5568] transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border border-[#4a5568]/20 hover:border-[#4a5568]/40"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#c9a45c] text-white rounded-lg hover:bg-[#d4b06c] transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2 border-white/40 hover:border-white/60"
              >
                {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2a3347]">
                  <th className="px-4 py-2 text-left text-gray-300">Usuario</th>
                  <th className="px-4 py-2 text-left text-gray-300">Rol</th>
                  <th className="px-4 py-2 text-left text-gray-300">Fecha de Creación</th>
                  <th className="px-4 py-2 text-left text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-[#3d4659]">
                    <td className="px-4 py-2 text-gray-300">{usuario.Usuario}</td>
                    <td className="px-4 py-2 text-gray-300">{usuario.Rol}</td>
                    <td className="px-4 py-2 text-gray-300">{usuario.created_at}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="px-3 py-1 bg-[#c9a45c] text-white rounded hover:bg-[#d4b06c] transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(usuario)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 