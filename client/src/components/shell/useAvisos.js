import { useQuery } from '@tanstack/react-query';
import { MessageSquareText, FileText } from 'lucide-react';
import api from '../../services/api';
import { asuntoDe } from '../../utils/inicio';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const CINCO_MINUTOS = 5 * 60 * 1000;

// Lo que pide atención, para la campana y los contadores del menú. Sin tabla de notificaciones
// todavía (fase 4 de la propuesta): se deriva de datos que ya existen y se refresca cada 5 min.
// Equipo técnico: la bandeja «Requiere tu atención» del Inicio (misma consulta y caché).
// Emprendedor: evaluaciones pendientes y One Pager incompleto.
const useAvisos = (esAdmin) => {
  const inicio = useQuery({
    queryKey: ['inicio', 'todos'],
    queryFn: () => api.get('/inicio').then((r) => r.data),
    enabled: esAdmin,
    staleTime: 60 * 1000,
    refetchInterval: CINCO_MINUTOS
  });
  const evaluaciones = useQuery({
    queryKey: ['nps', 'mis-pendientes'],
    queryFn: () => api.get('/nps/mis-pendientes').then((r) => r.data.pendientes || []),
    enabled: !esAdmin,
    staleTime: 60 * 1000,
    refetchInterval: CINCO_MINUTOS
  });
  // Misma consulta que el One Pager y Mentores: se invalida al guardar el One Pager
  const onePager = useQuery({
    queryKey: ['onePagerEstado'],
    queryFn: () => api.get('/one-pager/estado').then((r) => r.data.estados || []),
    enabled: !esAdmin
  });

  if (esAdmin) {
    const asuntos = (inicio.data?.atencion || []).map(asuntoDe).filter(Boolean)
      // En la bandeja «vencidos» baja a la cartera del Inicio; desde la campana va a Seguimiento
      .map((a) => (a.href ? { ...a, to: '/seguimientos', href: undefined } : a));
    return { asuntos, cargando: inicio.isLoading, conteos: { atencion: asuntos.length } };
  }

  const pendientes = evaluaciones.data?.length || 0;
  const onePagerIncompleto = (onePager.data || []).some((e) => !e.completo);
  const asuntos = [
    pendientes > 0 && {
      icono: MessageSquareText,
      tono: 'info',
      titulo: plural(pendientes, 'sesión por evaluar', 'sesiones por evaluar'),
      detalle: 'Tu opinión ayuda a mejorar los talleres y el seguimiento.',
      accion: 'Evaluar',
      to: '/sesiones'
    },
    onePagerIncompleto && {
      icono: FileText,
      tono: 'warning',
      titulo: 'Tu One Pager está incompleto',
      detalle: 'Lo necesitas para el match con mentores.',
      accion: 'Completar',
      to: '/one-pager'
    }
  ].filter(Boolean);
  return {
    asuntos,
    cargando: evaluaciones.isLoading,
    conteos: { evaluaciones: pendientes, onepager: onePagerIncompleto ? '!' : 0 }
  };
};

export default useAvisos;
