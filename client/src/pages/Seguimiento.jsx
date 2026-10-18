import { useSearchParams } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import { useEmprendimientosResumen, useProgramas } from '../hooks/useQueryHooks';
import PanelSeguimiento from '../components/seguimiento/PanelSeguimiento';
import Skeleton from '../components/ui/Skeleton';
import ErrorCarga from '../components/ui/ErrorCarga';
import { Input } from '../components/ui/Field';
import { CAMPO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS } from '../components/ui/estilosSemanticos';
import { estadoReunion } from '../utils/inicio';

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Pestañas de la página anterior (?tab=) que siguen llegando por enlaces guardados
const PESTANA_ANTIGUA = { timeline: 'linea', diagnosticos: 'linea', talleres: 'linea', '1a1_programa': 'linea', '1a1_taller': 'linea' };
const COLOR_REUNION = { ok: 'text-muted-foreground', aviso: 'text-warning', mal: 'text-danger', ninguno: 'text-subtle-foreground' };

// Fila de la cartera: nombre y lo que pide atención (vencidos, días sin reunión, avance OKR)
const FilaCartera = ({ fila, activa, onElegir }) => {
  const reunion = estadoReunion(fila.diasSinReunion);
  return (
    <li>
      <button
        type="button"
        onClick={() => onElegir(fila.id)}
        aria-current={activa ? 'true' : undefined}
        className={`grid w-full gap-1 rounded-control px-3 py-2.5 text-left transition-colors ${activa ? 'bg-info-soft' : 'hover:bg-muted'}`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${activa ? 'font-semibold' : 'font-medium'}`}>{fila.nombre}</span>
          {fila.vencidos > 0 && (
            <span className="shrink-0 rounded-full bg-danger-soft px-1.5 text-xs font-semibold tabular-nums text-danger-soft-foreground">
              {fila.vencidos}<span className="sr-only"> {fila.vencidos === 1 ? 'compromiso vencido' : 'compromisos vencidos'}</span>
            </span>
          )}
        </span>
        <span className="flex flex-wrap gap-x-2 text-xs">
          <span className={COLOR_REUNION[reunion.nivel]}>{reunion.texto}</span>
          {fila.okr !== null && <span className="text-muted-foreground">· OKR {fila.okr} %</span>}
        </span>
      </button>
    </li>
  );
};

const Seguimiento = () => {
  const { data, isLoading, isError, refetch } = useEmprendimientosResumen();
  const { data: programas = [] } = useProgramas();
  const [searchParams, setSearchParams] = useSearchParams();
  const actualizar = (cambios) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  const busqueda = searchParams.get('q') || '';
  const programa = searchParams.get('programa') || '';
  const empParam = Number(searchParams.get('emp')) || null;
  const tabParam = PESTANA_ANTIGUA[searchParams.get('tab')] || searchParams.get('tab');
  const tab = ['resumen', 'linea', 'objetivos'].includes(tabParam) ? tabParam : 'resumen';

  const texto = normalizar(busqueda.trim());
  const filas = (data?.emprendimientos || [])
    .filter((e) => e.estado === 'activo')
    .filter((e) => !programa || String(e.programa?.id) === programa)
    .filter((e) => !texto || normalizar([e.nombre, e.sector, e.lider].join(' ')).includes(texto));
  // En escritorio se abre el primero de la cartera (el que más atención pide); en móvil, la lista
  const esEscritorio = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches;
  const seleccionado = empParam || (esEscritorio ? filas[0]?.id : null);
  const conVencidos = filas.filter((f) => f.vencidos > 0).length;

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className={`animate-enter ${seleccionado ? 'hidden lg:block' : ''}`}>
        <p className="eyebrow">Gestión</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Seguimiento</h1>
        <p className="mt-1 text-muted-foreground">Prepara cada reunión: compromisos, línea y objetivos de cada emprendimiento.</p>
      </header>

      {isError && !data && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar la cartera." onReintentar={refetch} /></div>}

      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6">
        <nav aria-label="Cartera de emprendimientos" className={`${TARJETA_CLS} grid gap-3 p-3 lg:sticky lg:top-4 ${seleccionado ? 'hidden lg:grid' : ''}`}>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" value={busqueda} onChange={(e) => actualizar({ q: e.target.value })} placeholder="Nombre, sector o líder" aria-label="Buscar emprendimiento" className="pl-9" />
          </div>
          <select aria-label="Filtrar por programa" value={programa} onChange={(e) => actualizar({ programa: e.target.value })} className={CAMPO_CLS}>
            <option value="">Todos los programas</option>
            {programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
            {filas.length === 1 ? '1 emprendimiento activo' : `${filas.length} emprendimientos activos`}
            {conVencidos > 0 && ` · ${conVencidos} con vencidos`}
          </p>
          {isLoading ? (
            <div className="grid gap-2" role="status" aria-label="Cargando la cartera">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filas.length === 0 ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">{texto || programa ? 'Ningún emprendimiento coincide.' : 'No hay emprendimientos activos.'}</p>
          ) : (
            <ul className="grid max-h-[calc(100dvh-16rem)] gap-0.5 overflow-y-auto overscroll-contain">
              {filas.map((f) => <FilaCartera key={f.id} fila={f} activa={f.id === seleccionado} onElegir={(id) => actualizar({ emp: String(id) })} />)}
            </ul>
          )}
        </nav>

        <div className={`@container min-w-0 ${seleccionado ? '' : 'hidden lg:block'}`}>
          {seleccionado ? (
            <PanelSeguimiento
              key={seleccionado}
              emprendimientoId={seleccionado}
              tab={tab}
              onTab={(nueva) => actualizar({ tab: nueva === 'resumen' ? '' : nueva })}
              onVolver={() => actualizar({ emp: '', tab: '' })}
            />
          ) : (
            <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-16 text-center`}>
              <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><ClipboardList size={24} aria-hidden="true" /></span>
              <p className="font-semibold">Elige un emprendimiento de la cartera</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Seguimiento;
