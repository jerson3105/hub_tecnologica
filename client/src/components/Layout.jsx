import { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import api from '../services/api';
import {
  LayoutDashboard, FolderKanban, Rocket, CalendarDays,
  ClipboardList, FolderOpen, Users, BarChart3, LogOut,
  Menu, X, ChevronDown, User, FileText, AlertCircle, LayoutGrid, GraduationCap, Target
} from 'lucide-react';

const Layout = () => {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Estado del One Pager para el aviso del menú; OnePager invalida esta consulta al guardar
  const { data: onePagerEstados = [] } = useQuery({
    queryKey: ['onePagerEstado'],
    queryFn: () => api.get('/one-pager/estado').then(res => res.data.estados || []),
    enabled: !!usuario && !esAdmin
  });
  const onePagerIncompleto = onePagerEstados.some(e => !e.completo);

  // Cerrar el menú de usuario con clic fuera o Escape
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setUserMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { to: '/programas', label: 'Programas', icon: FolderKanban },
    { to: '/emprendimientos', label: 'Emprendimientos', icon: Rocket },
    { to: '/sesiones', label: 'Sesiones', icon: CalendarDays },
    { to: '/seguimientos', label: 'Seguimiento', icon: ClipboardList },
    { to: '/materiales', label: 'Materiales', icon: FolderOpen },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
    { to: '/asistencias', label: 'Asistencias', icon: BarChart3 },
    { to: '/reportes', label: 'Reportes e Indicadores', icon: FileText },
    { to: '/mentores', label: 'Mentores', icon: GraduationCap },
  ];

  const emprendedorLinks = [
    { to: '/mi-emprendimiento', label: 'Mi Emprendimiento', icon: Rocket },
    { to: '/one-pager', label: 'One Pager', icon: FileText, badge: onePagerIncompleto },
    { to: '/bmc', label: 'Business Model Canvas', icon: LayoutGrid },
    { to: '/materiales', label: 'Materiales', icon: FolderOpen },
    { to: '/sesiones', label: 'Sesiones', icon: CalendarDays },
    { to: '/mi-seguimiento', label: 'Mi Seguimiento', icon: ClipboardList },
    { to: '/mis-objetivos', label: 'Mis Objetivos', icon: Target },
    { to: '/mis-mentores', label: 'Mentores', icon: GraduationCap },
  ];

  const links = esAdmin ? adminLinks : emprendedorLinks;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`surface-dark fixed lg:sticky lg:top-0 inset-y-0 left-0 z-30 w-64 lg:h-screen shrink-0 overflow-y-auto bg-brand-dark transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-20 px-5 border-b border-white/10">
          <img src="/logo.png" alt="HUB TecnológICA" className="h-14 w-auto object-contain brightness-0 invert" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden text-white/70 hover:text-white p-1.5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="mt-4 px-3 pb-6 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-cyan/20 text-brand-cyan'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <link.icon size={18} aria-hidden="true" />
              {link.label}
              {link.badge && (
                <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold bg-amber-400/20 text-amber-300 rounded-full">
                  <AlertCircle size={10} aria-hidden="true" /> Pendiente
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="lg:hidden text-brand-dark hover:text-brand-cyan-ink p-1.5 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label={`Menú de ${usuario?.nombre || 'usuario'}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-dark rounded-lg p-1"
            >
              <div className="w-8 h-8 bg-brand-cyan/15 rounded-full flex items-center justify-center">
                <User size={16} className="text-brand-cyan-ink" aria-hidden="true" />
              </div>
              <span className="hidden sm:block font-medium">{usuario?.nombre} {usuario?.apellido}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50" role="menu">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{usuario?.nombre} {usuario?.apellido}</p>
                  <p className="text-xs text-gray-500 break-all">{usuario?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-cyan/15 text-brand-dark">
                    {usuario?.rol === 'admin' ? 'Administrador' : 'Emprendedor'}
                  </span>
                </div>
                <NavLink
                  to="/perfil"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Mi Perfil
                </NavLink>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* key: un error en una página no debe quedar visible al navegar a otra */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
