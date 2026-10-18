import {
  LayoutDashboard, CalendarDays, ClipboardList, Rocket, FolderKanban, GraduationCap, BarChart3,
  Users, FolderOpen, Target
} from 'lucide-react';

// Navegación por rol (rediseno/PROPUESTA.md §4). `aviso` enlaza el contador de useAvisos;
// `corto` es la etiqueta de la barra inferior del móvil e `inferior`, sus 4 destinos (el resto va
// en «Más»). La Agenda llegará con su fase: por ahora Sesiones (y el historial, en Mi plan).

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
        { to: '/mi-emprendimiento', label: 'Mi emprendimiento', icono: Rocket, corto: 'Inicio', aviso: 'onepager' },
        { to: '/sesiones', label: 'Sesiones', icono: CalendarDays, aviso: 'evaluaciones' },
        { to: '/mi-plan', label: 'Mi plan', icono: Target },
        { to: '/mentores', label: 'Mentores', icono: GraduationCap }
      ]
    }
    // One Pager, Modelo de negocio y Materiales son pestañas de Mi emprendimiento
  ],
  inferior: ['/mi-emprendimiento', '/sesiones', '/mi-plan', '/mentores']
};

export const navegacionDe = (esAdmin) => (esAdmin ? ADMIN : EMPRENDEDOR);
export const enlacesDe = (nav) => nav.grupos.flatMap((g) => g.enlaces);
