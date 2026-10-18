import { NavLink, Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLogo } from '../../utils/logo';
import Espiral from './Espiral';

// Contador o marca de un enlace (p. ej. asuntos del Inicio, evaluaciones pendientes)
export const Contador = ({ valor, enRail = false }) => {
  if (!valor) return null;
  const punto = valor === '!';
  return (
    <span
      className={`grid min-w-5 place-items-center rounded-full bg-sidebar-ring px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-sidebar ${
        enRail ? 'absolute right-1.5 top-1 min-w-4 px-1 text-[10px] leading-4' : 'ml-auto'
      }`}
      aria-hidden="true"
    >
      {punto ? '!' : valor > 99 ? '99+' : valor}
    </span>
  );
};

const textoContador = (valor) => (valor === '!' ? ' (pendiente)' : valor ? ` (${valor})` : '');

// Barra lateral (desde 768 px). En tableta va en «rail» (solo iconos con su nombre al pasar o
// enfocar); en escritorio, expandida y plegable a rail por el usuario (se recuerda).
const Sidebar = ({ nav, plegado, onPlegar, conteos }) => {
  const logo = useLogo('negativo');
  // Etiqueta visible solo expandida; en rail queda para el lector y como globo al pasar
  const etiqueta = plegado ? 'sr-only' : 'sr-only lg:not-sr-only';
  const globo = plegado ? '' : 'lg:hidden';

  return (
    <aside
      className={`surface-dark sticky top-0 z-30 hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex ${
        plegado ? 'w-[4.5rem]' : 'w-[4.5rem] lg:w-64'
      }`}
    >
      <Link
        to={nav.inicio}
        className={`flex h-16 shrink-0 items-center px-4 ${plegado ? 'justify-center' : 'justify-center lg:justify-start lg:px-5'}`}
        aria-label="HUB TecnológICA, ir al inicio"
      >
        <span className={plegado ? 'grid' : 'grid lg:hidden'}><Espiral className="size-8 text-sidebar-ring" /></span>
        {!plegado && (
          logo
            ? <img src={logo} alt="" className="hidden h-9 w-auto lg:block" />
            : <span className="hidden font-display text-lg font-semibold text-white lg:block">Hub Tecnológ<span className="text-sidebar-ring">ICA</span></span>
        )}
      </Link>

      {/* En rail sin desplazamiento propio: si no, recortaría los globos con el nombre */}
      <nav aria-label="Navegación principal" className={`flex-1 px-3 pb-4 [scrollbar-width:thin] ${plegado ? 'overflow-visible' : 'overflow-visible lg:overflow-y-auto lg:overscroll-contain'}`}>
        {nav.grupos.map((grupo, i) => (
          <div key={grupo.titulo || i} className={i > 0 ? 'mt-5' : 'mt-2'}>
            {grupo.titulo && (
              <p className={`mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-sidebar-muted ${plegado ? 'sr-only' : 'sr-only lg:not-sr-only'}`}>
                {grupo.titulo}
              </p>
            )}
            {grupo.titulo && <div className={`mx-auto mb-2 h-px w-6 bg-sidebar-border ${plegado ? '' : 'lg:hidden'}`} aria-hidden="true" />}
            <ul className="grid gap-0.5">
              {grupo.enlaces.map((e) => {
                const Icono = e.icono;
                const valor = e.aviso ? conteos[e.aviso] : 0;
                return (
                  <li key={e.to} className="group relative">
                    <NavLink
                      to={e.to}
                      className={({ isActive }) => `relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors ${
                        plegado ? 'justify-center' : 'justify-center lg:justify-start'
                      } ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-white/[0.06] hover:text-white'}`}
                    >
                      <Icono size={20} aria-hidden="true" className="shrink-0" />
                      <span className={etiqueta}>{e.label}{textoContador(valor) && <span className="sr-only">{textoContador(valor)}</span>}</span>
                      {/* Contador: junto al texto expandido; como punto sobre el icono en rail */}
                      <span className={plegado ? 'hidden' : 'hidden lg:contents'}><Contador valor={valor} /></span>
                      <span className={plegado ? 'contents' : 'contents lg:hidden'}><Contador valor={valor} enRail /></span>
                    </NavLink>
                    <span
                      className={`pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-control bg-popover px-2.5 py-1.5 text-[13px] font-medium text-popover-foreground elevation-2 group-hover:block group-focus-within:block ${globo}`}
                      aria-hidden="true"
                    >
                      {e.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Plegar o expandir: solo en escritorio (en tableta siempre va en rail) */}
      <div className="hidden shrink-0 border-t border-sidebar-border p-3 lg:block">
        <button
          type="button"
          onClick={onPlegar}
          aria-pressed={plegado}
          className={`flex h-10 w-full items-center gap-3 rounded-control px-3 text-sm text-sidebar-muted transition-colors hover:bg-white/[0.06] hover:text-white ${plegado ? 'justify-center' : ''}`}
        >
          {plegado ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
          <span className={plegado ? 'sr-only' : ''}>{plegado ? 'Expandir menú' : 'Plegar menú'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
