import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useEmprendimientosResumen, useProgramas, useInvalidate } from '../hooks/useQueryHooks';
import TablaCartera from '../components/inicio/TablaCartera';
import EmprendimientoFormModal from '../components/emprendimientos/EmprendimientoFormModal';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import Segmentado from '../components/ui/Segmentado';
import { Input } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';

const ESTADOS = ['activo', 'graduado', 'retirado', 'todos'];
const ETIQUETAS = { activo: 'Activos', graduado: 'Graduados', retirado: 'Retirados', todos: 'Todos' };

// Sin mayúsculas ni tildes: «agroica» encuentra «AgroIca» y «quispe» a «Lucía Quispe»
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Requiere atención: compromisos vencidos o más de tres semanas sin reunión
const requiereAtencion = (e) => e.vencidos > 0 || (e.diasSinReunion ?? 0) > 21;

const Esqueleto = () => (
  <div className={`${TARJETA_CLS} grid gap-4 p-5`} role="status" aria-label="Cargando emprendimientos">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-10 w-full" />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-8 shrink-0" />
        <div className="grid flex-1 gap-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
        <Skeleton className="hidden h-1.5 w-40 sm:block" />
      </div>
    ))}
  </div>
);

const Emprendimientos = () => {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data, isLoading, isError, refetch } = useEmprendimientosResumen();
  const { data: programas = [] } = useProgramas();
  const [creando, setCreando] = useState(false);

  // Búsqueda y filtros en la URL: sobreviven a una recarga y se pueden compartir
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get('q') || '';
  const programa = searchParams.get('programa') || '';
  const estado = ESTADOS.includes(searchParams.get('estado')) ? searchParams.get('estado') : 'activo';
  const actualizar = (cambios) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (valor && !(clave === 'estado' && valor === 'activo')) next.set(clave, valor);
      else next.delete(clave);
    });
    return next;
  }, { replace: true });

  const todos = data?.emprendimientos || [];
  const delPrograma = programa ? todos.filter((e) => String(e.programa?.id) === programa) : todos;
  const conteo = Object.fromEntries(ESTADOS.map((id) => [id, id === 'todos' ? delPrograma.length : delPrograma.filter((e) => e.estado === id).length]));
  const texto = normalizar(busqueda.trim());
  const visibles = delPrograma
    .filter((e) => estado === 'todos' || e.estado === estado)
    .filter((e) => !texto || normalizar([e.nombre, e.sector, e.lider, e.programa?.nombre].join(' ')).includes(texto));

  const activos = todos.filter((e) => e.estado === 'activo');
  const enRiesgo = activos.filter(requiereAtencion).length;
  const hayFiltros = !!(busqueda || programa || estado !== 'activo');
  const limpiar = () => setSearchParams({}, { replace: true });

  const herramientas = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[14rem] flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => actualizar({ q: e.target.value })}
          placeholder="Nombre, sector o líder"
          aria-label="Buscar emprendimientos"
          className="pl-9"
        />
      </div>
      <select aria-label="Filtrar por programa" value={programa} onChange={(e) => actualizar({ programa: e.target.value })} className={FILTRO_CLS}>
        <option value="">Todos los programas</option>
        {programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <Segmentado
        etiqueta="Estado"
        valor={estado}
        onCambiar={(valor) => actualizar({ estado: valor })}
        className="w-full overflow-x-auto [scrollbar-width:none]"
        opciones={ESTADOS.map((id) => ({ valor: id, texto: `${ETIQUETAS[id]} (${conteo[id]})` }))}
      />
    </div>
  );

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Gestión</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Emprendimientos</h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {activos.length === 1 ? '1 activo' : `${activos.length} activos`}
              {enRiesgo > 0 && <> · <span className="font-medium text-warning">{enRiesgo === 1 ? '1 requiere atención' : `${enRiesgo} requieren atención`}</span></>}
            </p>
          )}
        </div>
        <button type="button" onClick={() => setCreando(true)} className={BOTON_PRIMARIO_CLS}>
          <Plus size={16} aria-hidden="true" />Nuevo emprendimiento
        </button>
      </header>

      {isLoading && <Esqueleto />}

      {isError && !data && (
        <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los emprendimientos." onReintentar={refetch} /></div>
      )}

      {data && (
        <TablaCartera
          cartera={visibles}
          titulo={estado === 'todos' ? 'Todos los emprendimientos' : ETIQUETAS[estado]}
          mostrarEquipo
          herramientas={herramientas}
          vacio={todos.length === 0
            ? 'Aún no hay emprendimientos. Crea el primero para empezar a darle seguimiento.'
            : texto ? `Ningún emprendimiento coincide con «${busqueda.trim()}».` : 'No hay emprendimientos con estos filtros.'}
          accionVacio={todos.length === 0 ? (
            <button type="button" onClick={() => setCreando(true)} className={BOTON_PRIMARIO_CLS}>
              <Plus size={16} aria-hidden="true" />Crear emprendimiento
            </button>
          ) : hayFiltros ? (
            <button type="button" onClick={limpiar} className={BOTON_SECUNDARIO_CLS}>
              <X size={16} aria-hidden="true" />Limpiar filtros
            </button>
          ) : null}
        />
      )}

      {creando && (
        <EmprendimientoFormModal
          programaInicial={programa}
          onClose={() => setCreando(false)}
          onGuardado={(nuevo) => {
            invalidate('emprendimientos', 'programas', 'programa', 'inicio');
            // Lo siguiente es armar su equipo
            if (nuevo?.id) navigate(`/emprendimientos/${nuevo.id}?tab=equipo`);
          }}
        />
      )}
    </div>
  );
};

export default Emprendimientos;
