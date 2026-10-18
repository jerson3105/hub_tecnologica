import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';

// ─── Programas ───
export const useProgramas = (params = {}) =>
  useQuery({
    queryKey: ['programas', params],
    queryFn: () => api.get('/programas', { params }).then(r => r.data.programas)
  });

export const usePrograma = (id) =>
  useQuery({
    queryKey: ['programa', id],
    queryFn: () => api.get(`/programas/${id}`).then(r => r.data.programa),
    enabled: !!id
  });

// Resúmenes del equipo técnico. Las claves empiezan por 'programas' / 'programa' para que
// invalidate('programas') o invalidate('programa') también los refresquen.
export const useProgramasResumen = () =>
  useQuery({
    queryKey: ['programas', 'resumen'],
    queryFn: () => api.get('/programas/resumen').then(r => r.data),
    staleTime: 0
  });

export const useProgramaResumen = (id) =>
  useQuery({
    queryKey: ['programa', id, 'resumen'],
    queryFn: () => api.get(`/programas/${id}/resumen`).then(r => r.data),
    enabled: !!id,
    staleTime: 0,
    retry: (intentos, error) => error?.response?.status !== 404 && intentos < 1
  });

// ─── Emprendimientos ───
export const useEmprendimientos = (params = {}) =>
  useQuery({
    queryKey: ['emprendimientos', params],
    queryFn: () => api.get('/emprendimientos', { params }).then(r => r.data.emprendimientos)
  });

export const useEmprendimiento = (id) =>
  useQuery({
    queryKey: ['emprendimiento', id],
    queryFn: () => api.get(`/emprendimientos/${id}`).then(r => r.data.emprendimiento),
    enabled: !!id
  });

// ─── Sesiones ───
export const useSesiones = (params = {}) =>
  useQuery({
    queryKey: ['sesiones', params],
    queryFn: () => api.get('/sesiones', { params }).then(r => r.data.sesiones)
  });

export const useSesion = (id) =>
  useQuery({
    queryKey: ['sesion', id],
    queryFn: () => api.get(`/sesiones/${id}`).then(r => r.data.sesion),
    enabled: !!id
  });

// ─── Usuarios ───
export const useUsuarios = (params = {}) =>
  useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => api.get('/auth/usuarios', { params }).then(r => r.data.usuarios)
  });

// ─── Mentores ───
export const useMentores = (params = {}) =>
  useQuery({
    queryKey: ['mentores', params],
    queryFn: () => api.get('/mentores', { params }).then(r => r.data.mentores)
  });

// ─── Archivos ───
export const useArchivos = (params = {}) =>
  useQuery({
    queryKey: ['archivos', params],
    queryFn: () => api.get('/archivos', { params }).then(r => r.data.archivos)
  });

// ─── NPS ───
export const useNpsResumen = () =>
  useQuery({
    queryKey: ['nps', 'resumen'],
    queryFn: () => api.get('/nps/resumen').then(r => r.data.resumen || []),
    retry: 1
  });

export const useNpsPromedios = () =>
  useQuery({
    queryKey: ['nps', 'promedios'],
    queryFn: () => api.get('/nps/promedios').then(r => r.data.promedios || {}),
    retry: 1
  });

// ─── Seguimientos ───
export const useSeguimientos = (emprendimientoId) =>
  useQuery({
    queryKey: ['seguimientos', emprendimientoId],
    queryFn: () => api.get(`/seguimientos/emprendimiento/${emprendimientoId}`).then(r => r.data.seguimientos),
    enabled: !!emprendimientoId
  });

// ─── Inicio del admin ───
// Al cambiar de programa se conservan los datos anteriores mientras llegan los nuevos:
// la página no vuelve a los skeletons ni repite las animaciones de entrada.
export const useInicio = (programaId) =>
  useQuery({
    queryKey: ['inicio', programaId || 'todos'],
    queryFn: () => api.get('/inicio', { params: programaId ? { programa_id: programaId } : {} }).then(r => r.data),
    placeholderData: keepPreviousData,
    staleTime: 0 // al volver al Inicio se refresca en segundo plano (sin skeletons)
  });

// ─── Invalidation helper ───
export const useInvalidate = () => {
  const qc = useQueryClient();
  return (...keys) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
};
