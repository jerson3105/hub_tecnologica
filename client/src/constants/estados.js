import { TONOS_BADGE, PUNTOS_BADGE } from '../components/ui/estilos';

// Etiqueta y tono (ver TONOS_BADGE) de cada estado, para que un mismo dato tenga
// el mismo color en todas las páginas.
export const ESTADOS_EMPRENDIMIENTO = {
  activo: { label: 'Activo', tono: 'green' },
  graduado: { label: 'Graduado', tono: 'cyan' },
  retirado: { label: 'Retirado', tono: 'red' }
};

export const ESTADOS_PROGRAMA = {
  en_curso: { label: 'En curso', tono: 'green' },
  planificado: { label: 'Planificado', tono: 'cyan' },
  finalizado: { label: 'Finalizado', tono: 'neutral' }
};

export const ROLES_USUARIO = {
  admin: { label: 'Equipo técnico', tono: 'purple' },
  emprendedor: { label: 'Emprendedor', tono: 'green' }
};

// Estado de avance de un seguimiento (campo `estado_avance`)
export const ESTADOS_AVANCE = {
  sin_iniciar: { label: 'Sin iniciar', tono: 'neutral' },
  en_progreso: { label: 'En progreso', tono: 'cyan' },
  avanzado: { label: 'Avanzado', tono: 'green' },
  completado: { label: 'Completado', tono: 'green' }
};

// Estado de una actividad OKR o de un compromiso de sesión
export const ESTADOS_ACTIVIDAD = {
  planeado: { label: 'Planeado', tono: 'neutral' },
  en_progreso: { label: 'En progreso', tono: 'amber' },
  completado: { label: 'Completado', tono: 'green' },
  no_logrado: { label: 'No logrado', tono: 'red' }
};

// Estado de actividad con las clases para el select coloreado (`color`) y el punto (`dot`)
export const estadoActividad = (estado) => {
  const est = ESTADOS_ACTIVIDAD[estado] || ESTADOS_ACTIVIDAD.planeado;
  return { ...est, color: TONOS_BADGE[est.tono], dot: PUNTOS_BADGE[est.tono] };
};

// Área de un objetivo OKR (campo `tipo` del objetivo)
export const TIPOS_OBJETIVO = {
  ventas: { label: 'Ventas', tono: 'green' },
  marketing: { label: 'Marketing', tono: 'blue' },
  producto_desarrollo: { label: 'Producto / Desarrollo', tono: 'cyan' },
  financiero: { label: 'Financiero', tono: 'amber' },
  legal: { label: 'Legal', tono: 'purple' },
  talento_rrhh: { label: 'Talento / RR.HH.', tono: 'pink' }
};

export const CATEGORIAS_ARCHIVO = {
  bmc: { label: 'BMC', tono: 'purple' },
  taller: { label: 'Taller', tono: 'purple' },
  entregable: { label: 'Entregable', tono: 'purple' },
  grabacion: { label: 'Grabación', tono: 'purple' },
  otro: { label: 'Otro', tono: 'neutral' }
};

export const estadoDe = (mapa, clave, porDefecto = { label: clave || '-', tono: 'neutral' }) =>
  mapa[clave] || porDefecto;
