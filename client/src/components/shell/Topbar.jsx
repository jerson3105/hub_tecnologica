import { Link, useLocation } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import Campana from './Campana';
import MenuUsuario from './MenuUsuario';
import { useLogo } from '../../utils/logo';
import { useTema, soloClaro } from '../../tema';
import { iconoBotonCls } from '../ui/estilosSemanticos';

const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// Barra superior: logo (móvil), «Buscar o ir a…», tema, avisos y menú de usuario.
// 56 px en móvil, 64 px desde tableta; fija arriba al desplazarse.
const Topbar = ({ nav, avisos, esAdmin, usuario, onBuscar, onSalir }) => {
  const { pathname } = useLocation();
  const { oscuro, cambiarTema } = useTema();
  const oscuroAqui = oscuro && !soloClaro(pathname);
  const logo = useLogo(oscuroAqui ? 'negativo' : 'positivo');

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-card/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4 md:h-16 md:gap-2 lg:px-8">
      <Link to={nav.inicio} className="mr-auto flex h-10 items-center rounded-control md:hidden" aria-label="HUB TecnológICA, ir al inicio">
        {logo
          ? <img src={logo} alt="" className="h-7 w-auto" />
          : <span className="font-display text-base font-semibold">Hub Tecnológ<span className="text-primary">ICA</span></span>}
      </Link>

      <button
        type="button"
        onClick={onBuscar}
        aria-keyshortcuts={esMac ? 'Meta+K' : 'Control+K'}
        className="hidden h-10 min-w-0 flex-[0_1_24rem] items-center gap-2.5 rounded-control border border-border bg-background px-3 text-sm text-subtle-foreground transition-colors hover:border-input hover:text-muted-foreground md:flex"
      >
        <Search size={16} aria-hidden="true" />
        <span className="flex-1 truncate text-left">Buscar o ir a…</span>
        <kbd className="rounded-[6px] border border-border bg-card px-1.5 font-mono text-xs text-muted-foreground">{esMac ? '⌘ K' : 'Ctrl K'}</kbd>
      </button>
      <span className="hidden flex-1 md:block" />

      <button type="button" onClick={onBuscar} className={`${iconoBotonCls()} md:hidden`} title="Buscar">
        <Search size={20} aria-hidden="true" /><span className="sr-only">Buscar o ir a</span>
      </button>
      {/* En móvil el tema está en «Más». Envoltorio porque `hidden` no gana al inline-grid del botón */}
      <span className="hidden md:contents">
        <button
          type="button"
          onClick={() => cambiarTema(oscuro ? 'claro' : 'oscuro')}
          className={iconoBotonCls()}
          title={oscuro ? 'Tema claro' : 'Tema oscuro'}
        >
          {oscuro ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span className="sr-only">{oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}</span>
        </button>
      </span>
      <Campana
        asuntos={avisos.asuntos}
        cargando={avisos.cargando}
        enlaceTodo={esAdmin ? { to: '/dashboard', texto: 'Ir al Inicio' } : null}
      />
      <div className="hidden md:block"><MenuUsuario usuario={usuario} onSalir={onSalir} /></div>
    </header>
  );
};

export default Topbar;
