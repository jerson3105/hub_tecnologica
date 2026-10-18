import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import Modal from '../Modal';
import SelectorTema from './SelectorTema';
import { enlacesDe } from './navegacion';

const textoContador = (valor) => (valor === '!' ? ', pendiente' : valor ? `, ${valor}` : '');

const Marca = ({ valor }) => (valor ? (
  <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-danger-solid px-1 text-[10px] font-semibold leading-4 text-danger-solid-foreground tabular-nums" aria-hidden="true">
    {valor === '!' ? '!' : valor > 9 ? '9+' : valor}
  </span>
) : null);

// Navegación inferior del móvil (< 768 px): cuatro destinos y «Más», que abre una hoja con el resto
// de páginas, el tema, el perfil y cerrar sesión.
const BarraInferior = ({ nav, conteos, usuario, onSalir }) => {
  const [mas, setMas] = useState(false);
  const { pathname } = useLocation();
  const enlaces = enlacesDe(nav);
  const principales = nav.inferior.map((to) => enlaces.find((e) => e.to === to)).filter(Boolean);
  const resto = enlaces.filter((e) => !nav.inferior.includes(e.to));
  const restoActivo = resto.some((e) => pathname === e.to || pathname.startsWith(`${e.to}/`)) || pathname.startsWith('/perfil');
  const avisosResto = resto.some((e) => e.aviso && conteos[e.aviso]);

  const claseItem = (activo) => `relative flex h-full flex-col items-center justify-center gap-1 rounded-control text-[11px] font-medium transition-colors ${
    activo ? 'text-link' : 'text-muted-foreground hover:text-foreground'
  }`;

  return (
    <>
      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur md:hidden">
        <ul className="grid h-16 grid-cols-5 px-1">
          {principales.map((e) => {
            const Icono = e.icono;
            const valor = e.aviso ? conteos[e.aviso] : 0;
            return (
              <li key={e.to}>
                <NavLink to={e.to} className={({ isActive }) => claseItem(isActive)}>
                  {({ isActive }) => (
                    <>
                      <span className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-info-soft' : ''}`}>
                        <Icono size={20} aria-hidden="true" />
                        <Marca valor={valor} />
                      </span>
                      {e.corto || e.label}
                      {valor ? <span className="sr-only">{textoContador(valor)}</span> : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMas(true)} aria-haspopup="dialog" className={`${claseItem(restoActivo)} w-full`}>
              <span className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${restoActivo ? 'bg-info-soft' : ''}`}>
                <Menu size={20} aria-hidden="true" />
                <Marca valor={avisosResto ? '!' : 0} />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Modal isOpen={mas} onClose={() => setMas(false)} title="Más" closeOnBackdrop>
        <div className="grid gap-5">
          <ul className="grid grid-cols-3 gap-2">
            {resto.map((e) => {
              const Icono = e.icono;
              const valor = e.aviso ? conteos[e.aviso] : 0;
              return (
                <li key={e.to}>
                  <NavLink
                    to={e.to}
                    onClick={() => setMas(false)}
                    className={({ isActive }) => `flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border px-2 py-3 text-center text-[13px] font-medium transition-colors ${
                      isActive ? 'border-primary bg-info-soft' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="relative"><Icono size={22} aria-hidden="true" /><Marca valor={valor} /></span>
                    {e.label}
                    {valor ? <span className="sr-only">{textoContador(valor)}</span> : null}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <SelectorTema />
          <div className="grid gap-1 border-t border-border pt-3">
            <p className="px-1 text-sm font-semibold">{usuario?.nombre} {usuario?.apellido}</p>
            <p className="px-1 pb-1 text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{usuario?.email}</p>
            <Link to="/perfil" onClick={() => setMas(false)} className="flex min-h-11 items-center gap-3 rounded-control px-2 text-sm font-medium hover:bg-muted">
              <User size={18} aria-hidden="true" />Mi perfil
            </Link>
            <button type="button" onClick={() => { setMas(false); onSalir(); }} className="flex min-h-11 items-center gap-3 rounded-control px-2 text-left text-sm font-medium text-danger hover:bg-danger-soft">
              <LogOut size={18} aria-hidden="true" />Cerrar sesión
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BarraInferior;
