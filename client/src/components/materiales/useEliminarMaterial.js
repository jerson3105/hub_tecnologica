import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Eliminar un material (solo el equipo técnico) desde cualquier lista: Materiales, la sesión o
// el emprendimiento. Refresca las tres.
const useEliminarMaterial = () => {
  const queryClient = useQueryClient();
  return async (archivo) => {
    const que = archivo.tipo === 'enlace' ? 'el enlace' : 'el archivo';
    if (!window.confirm(`¿Eliminar ${que} «${archivo.nombre_original}»? Los emprendedores dejarán de verlo. No se puede deshacer.`)) return;
    try {
      await api.delete(`/archivos/${archivo.id}`);
      toast.success('Material eliminado');
      ['archivos', 'sesion', 'emprendimiento'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo eliminar');
    }
  };
};

export default useEliminarMaterial;
