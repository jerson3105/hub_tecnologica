import { useEffect, useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import Sidebar from './shell/Sidebar';
import Topbar from './shell/Topbar';
import BarraInferior from './shell/BarraInferior';
import PaletaComandos from './shell/PaletaComandos';
import useAvisos from './shell/useAvisos';
import { navegacionDe } from './shell/navegacion';

const CLAVE_PLEGADO = 'menu-plegado';
const leerPlegado = () => {
  try { return localStorage.getItem(CLAVE_PLEGADO) === '1'; } catch { return false; }
};

// Marco de la aplicación: barra lateral (tableta y escritorio), barra superior, navegación
// inferior (móvil) y la paleta «Buscar o ir a…» (Ctrl/Cmd + K)
const Layout = () => {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = navegacionDe(esAdmin);
  const avisos = useAvisos(esAdmin);
  const [plegado, setPlegado] = useState(leerPlegado);
  const [paleta, setPaleta] = useState(false);

  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta((p) => !p);
      }
    };
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, []);

  const plegar = () => {
    const nuevo = !plegado;
    setPlegado(nuevo);
    try { localStorage.setItem(CLAVE_PLEGADO, nuevo ? '1' : '0'); } catch { /* sin almacenamiento */ }
  };
  const salir = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:flex">
      <a
        href="#contenido"
        className="sr-only z-[90] rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <Sidebar nav={nav} plegado={plegado} onPlegar={plegar} conteos={avisos.conteos} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar nav={nav} avisos={avisos} esAdmin={esAdmin} usuario={usuario} onBuscar={() => setPaleta(true)} onSalir={salir} />
        {/* En móvil se reserva el alto de la navegación inferior para que no tape el final */}
        <main id="contenido" tabIndex={-1} className="flex-1 px-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] pt-5 focus:outline-none md:pb-8 lg:px-8 lg:pt-8">
          {/* key: un error en una página no debe quedar visible al navegar a otra */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={
              <div className="flex h-64 items-center justify-center" role="status" aria-label="Cargando">
                <div className="size-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <BarraInferior nav={nav} conteos={avisos.conteos} usuario={usuario} onSalir={salir} />
      <PaletaComandos abierta={paleta} onCerrar={() => setPaleta(false)} nav={nav} esAdmin={esAdmin} />
    </div>
  );
};

export default Layout;
