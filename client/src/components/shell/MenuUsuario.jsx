import { Link } from 'react-router-dom';
import { User, LogOut, ChevronDown, BookOpen } from 'lucide-react';
import usePopover from './usePopover';
import SelectorTema from './SelectorTema';
import { ROLES_USUARIO } from '../../constants/estados';
import { descargarInforme } from '../../reportes/descargarInforme';
import { CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';

const iniciales = (u) => `${u?.nombre?.[0] || ''}${u?.apellido?.[0] || ''}`.toUpperCase() || '?';
const ITEM_CLS = 'flex min-h-10 w-full items-center gap-3 rounded-control px-3 text-left text-sm font-medium transition-colors';

// Menú de usuario: quién eres, Mi perfil, el manual de uso (equipo técnico), el tema y cerrar sesión
const MenuUsuario = ({ usuario, onSalir }) => {
  const { abierto, alternar, cerrar, contenedorRef, botonRef } = usePopover();
  const nombre = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim();
  const rol = ROLES_USUARIO[usuario?.rol];

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        aria-controls="menu-usuario"
        className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 text-sm transition-colors hover:bg-muted"
      >
        <span className="grid size-9 place-items-center rounded-full bg-programa-soft text-[13px] font-semibold text-programa-soft-foreground" aria-hidden="true">
          {iniciales(usuario)}
        </span>
        <span className="hidden max-w-40 truncate font-medium xl:block">{nombre}</span>
        <ChevronDown size={16} aria-hidden="true" className="hidden text-muted-foreground xl:block" />
        <span className="sr-only">Menú de {nombre || 'usuario'}</span>
      </button>

      {abierto && (
        <div
          id="menu-usuario"
          className="animate-pop absolute right-0 top-12 z-50 grid w-72 gap-3 rounded-card border border-border bg-popover p-3 text-popover-foreground elevation-3"
        >
          <div className="flex items-center gap-3 px-1">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-programa-soft text-sm font-semibold text-programa-soft-foreground" aria-hidden="true">{iniciales(usuario)}</span>
            <div className="grid min-w-0 gap-0.5">
              <p className="truncate text-sm font-semibold">{nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{usuario?.email}</p>
              {rol && <span className={`${CHIP_CLS} ${usuario?.rol === 'admin' ? FONDO_TONO.azul : FONDO_TONO.programa} w-fit`}>{rol.label}</span>}
            </div>
          </div>
          <SelectorTema compacto />
          <div className="grid gap-0.5 border-t border-border pt-2">
            <Link to="/perfil" onClick={cerrar} className={`${ITEM_CLS} hover:bg-muted`}>
              <User size={17} aria-hidden="true" />Mi perfil
            </Link>
            {usuario?.rol === 'admin' && (
              <button type="button" onClick={() => { cerrar(); descargarInforme('manual'); }} className={`${ITEM_CLS} hover:bg-muted`}>
                <BookOpen size={17} aria-hidden="true" />Manual de uso (PDF)
              </button>
            )}
            <button type="button" onClick={() => { cerrar(); onSalir(); }} className={`${ITEM_CLS} text-danger hover:bg-danger-soft`}>
              <LogOut size={17} aria-hidden="true" />Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuUsuario;
