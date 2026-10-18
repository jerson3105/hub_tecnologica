import {
  LayoutDashboard, CalendarDays, ClipboardList, Rocket, FolderKanban, GraduationCap, BarChart3,
  Users, FolderOpen, Target
} from 'lucide-react';

// Navegación por rol (rediseno/PROPUESTA.md §4). `aviso` enlaza el contador de useAvisos;
// `corto` es la etiqueta de la barra inferior del móvil; `activoEn`, otras rutas en las que el
// enlace se marca como actual (p. ej. los editores del One Pager y el BMC de Mi emprendimiento).
// `inferior` = los 4 destinos de esa barra (el resto va en «Más»). La Agenda y «Mi plan» llegarán
// con sus fases: por ahora Sesiones y Mi seguimiento / Mis objetivos.

const ADMIN = {
  inicio: '/dashboard',
  grupos: [
    {
      enlaces: [
        { to: '/dashboard', label: 'Inicio', icono: LayoutDashboard, aviso: 'atencion' },
        { to: '/sesiones', label: 'Sesiones', icono: CalendarDays },
        { to: '/seguimientos', label: 'Seguimiento', icono: ClipboardList },
        { to: '/emprendimientos', label: 'Emprendimientos', icono: Rocket, corto: 'Emprend.' },
        { to: '/programas', label: 'Programas', icono: FolderKanban },
        { to: '/mentores', label: 'Mentores', icono: GraduationCap },
        { to: '/reportes', label: 'Reportes', icono: BarChart3 }
      ]
    },
    {
      titulo: 'Gestión',
      enlaces: [
        { to: '/usuarios', label: 'Usuarios', icono: Users },
        { to: '/materiales', label: 'Materiales', icono: FolderOpen }
      ]
    }
  ],
  inferior: ['/dashboard', '/sesiones', '/emprendimientos', '/reportes']
};

const EMPRENDEDOR = {
  inicio: '/mi-emprendimiento',
  grupos: [
    {
      enlaces: [
        { to: '/mi-emprendimiento', label: 'Mi emprendimiento', icono: Rocket, corto: 'Inicio', aviso: 'onepager', activoEn: ['/one-pager', '/bmc'] },
        { to: '/sesiones', label: 'Sesiones', icono: CalendarDays, aviso: 'evaluaciones' },
        { to: '/mi-seguimiento', label: 'Mi seguimiento', icono: ClipboardList, corto: 'Seguimiento' },
        { to: '/mis-objetivos', label: 'Mis objetivos', icono: Target },
        { to: '/mentores', label: 'Mentores', icono: GraduationCap }
      ]
    }
    // One Pager, Modelo de negocio y Materiales son pestañas de Mi emprendimiento
  ],
  inferior: ['/mi-emprendimiento', '/sesiones', '/mi-seguimiento', '/mentores']
};

export const navegacionDe = (esAdmin) => (esAdmin ? ADMIN : EMPRENDEDOR);
export const enlacesDe = (nav) => nav.grupos.flatMap((g) => g.enlaces);

// ¿La ruta actual pertenece a este enlace aunque no empiece por su `to`?
export const activoPorRuta = (enlace, ruta) => (enlace.activoEn || []).some((r) => ruta === r || ruta.startsWith(`${r}/`));
