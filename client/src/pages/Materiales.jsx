import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, X, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArchivos, useEmprendimientos } from '../hooks/useQueryHooks';
import FilaMaterial from '../components/materiales/FilaMaterial';
import EnlaceMaterialModal from '../components/materiales/EnlaceMaterialModal';
import useEliminarMaterial from '../components/materiales/useEliminarMaterial';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import { Input } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION } from '../components/ui/estilosSemanticos';
import { CATEGORIAS_ARCHIVO } from '../constants/estados';
import { TIPOS_SESION } from '../constants/sesiones';
import { formatFecha } from '../utils/fechas';
import { agruparPorSesion, coincideMaterial } from '../utils/materiales';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const Esqueleto = () => (
  <div className={`${TARJETA_CLS} grid gap-4 p-5`} role="status" aria-label="Cargando materiales">
    <Skeleton className="h-6 w-48" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0" />
        <div className="grid flex-1 gap-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
      </div>
    ))}
  </div>
);

// Cabecera de un grupo: la sesión (con enlace a su pestaña Materiales) o el material sin sesión
const CabeceraGrupo = ({ grupo, esAdmin }) => {
  const { sesion } = grupo;
  if (!sesion) {
    return (
      <div className="px-5 pb-2 pt-4">
        <h2 id={`grupo-${grupo.id}`} className={TITULO_BLOQUE_CLS}>{esAdmin ? 'Sin sesión' : 'De tu emprendimiento'}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {esAdmin ? 'Material asignado a emprendimientos, fuera de una sesión.' : 'Material que el equipo técnico compartió con tu equipo.'}
          {' · '}{plural(grupo.archivos.length, 'material', 'materiales')}
        </p>
      </div>
    );
  }
  const tipo = TIPOS_SESION[sesion.tipo];
  return (
    <div className="px-5 pb-2 pt-4">
      <h2 id={`grupo-${grupo.id}`} className={TITULO_BLOQUE_CLS}>
        <Link to={`/sesiones/${sesion.id}?tab=materiales`} className="rounded-control hover:text-link hover:underline">{sesion.titulo}</Link>
      </h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
        {tipo && <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo]] || FONDO_TONO.neutral}`}>{tipo.label}</span>}
        <span>{formatFecha(sesion.fecha, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span aria-hidden="true">·</span>
        <span>{plural(grupo.archivos.length, 'material', 'materiales')}</span>
      </p>
    </div>
  );
};

// Materiales (antes Archivos del admin y Mis Archivos del emprendedor): una sola página por rol.
// El equipo técnico busca, comparte enlaces y elimina; el emprendedor ve lo que le compartieron
// (lo de su equipo y lo de toda la sesión), agrupado por sesión.
const Materiales = () => {
  const { esAdmin } = useAuth();
  const { data: archivos, isLoading, isError, refetch } = useArchivos();
  const { data: emprendimientos = [] } = useEmprendimientos({}, { enabled: esAdmin });
  const eliminar = useEliminarMaterial();
  const [agregando, setAgregando] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const actualizar = (cambios) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  const busqueda = searchParams.get('q') || '';
  const categoria = searchParams.get('categoria') || '';
  const emp = esAdmin ? searchParams.get('emp') || '' : '';
  const hayFiltros = !!(busqueda.trim() || categoria || emp);

  const todos = archivos || [];
  const filtrados = todos
    .filter((a) => !categoria || a.categoria === categoria)
    .filter((a) => !emp || a.emprendimientos?.some((e) => String(e.id) === emp))
    .filter((a) => coincideMaterial(a, busqueda.trim()));
  const grupos = agruparPorSesion(filtrados);
  const enlaces = filtrados.filter((a) => a.tipo === 'enlace').length;

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{esAdmin ? 'Gestión' : 'Recursos'}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Materiales</h1>
          <p className="mt-1 text-muted-foreground">
            {esAdmin
              ? 'Presentaciones, grabaciones y plantillas compartidas con los emprendimientos.'
              : 'Presentaciones, grabaciones y plantillas que el equipo técnico compartió contigo.'}
          </p>
        </div>
        {esAdmin && (
          <button type="button" onClick={() => setAgregando(true)} className={BOTON_PRIMARIO_CLS}>
            <Plus size={16} aria-hidden="true" />Agregar enlace
          </button>
        )}
      </header>

      {todos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" value={busqueda} onChange={(e) => actualizar({ q: e.target.value })}
              placeholder={esAdmin ? 'Nombre, sesión o emprendimiento' : 'Nombre o sesión'} aria-label="Buscar materiales" className="pl-9" />
          </div>
          <select aria-label="Filtrar por categoría" value={categoria} onChange={(e) => actualizar({ categoria: e.target.value })} className={FILTRO_CLS}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS_ARCHIVO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
          {esAdmin && (
            <select aria-label="Filtrar por emprendimiento" value={emp} onChange={(e) => actualizar({ emp: e.target.value })} className={FILTRO_CLS}>
              <option value="">Todos los emprendimientos</option>
              {[...emprendimientos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          )}
        </div>
      )}

      {todos.length > 0 && (
        <p className="-mt-1 text-[13px] text-muted-foreground" aria-live="polite">
          {plural(filtrados.length, 'material', 'materiales')}
          {filtrados.length > 0 && ` · ${plural(enlaces, 'enlace', 'enlaces')}${filtrados.length > enlaces ? ` y ${plural(filtrados.length - enlaces, 'archivo', 'archivos')}` : ''}`}
          {hayFiltros && ` de ${todos.length}`}
        </p>
      )}

      {isLoading && <Esqueleto />}
      {isError && !archivos && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los materiales." onReintentar={refetch} /></div>}

      {archivos && grupos.length === 0 && (
        <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-12 text-center`}>
          <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><FolderOpen size={24} aria-hidden="true" /></span>
          <p className="font-semibold">
            {hayFiltros ? 'Ningún material coincide con los filtros' : esAdmin ? 'Aún no hay materiales' : 'Aún no te han compartido materiales'}
          </p>
          {!hayFiltros && !esAdmin && <p className="max-w-sm text-sm text-muted-foreground">Cuando el equipo técnico comparta presentaciones o grabaciones de tus sesiones, aparecerán aquí.</p>}
          {hayFiltros ? (
            <button type="button" onClick={() => setSearchParams({}, { replace: true })} className={BOTON_SECUNDARIO_CLS}>
              <X size={16} aria-hidden="true" />Limpiar filtros
            </button>
          ) : esAdmin && (
            <button type="button" onClick={() => setAgregando(true)} className={BOTON_PRIMARIO_CLS}>
              <Plus size={16} aria-hidden="true" />Compartir el primero
            </button>
          )}
        </div>
      )}

      {grupos.map((g, i) => (
        <section key={g.id} aria-labelledby={`grupo-${g.id}`} className={`${TARJETA_CLS} animate-enter escalonado`} style={{ '--i': Math.min(i, 6) }}>
          <CabeceraGrupo grupo={g} esAdmin={esAdmin} />
          <ul className="border-t border-border">
            {g.archivos.map((a) => (
              <FilaMaterial key={a.id} archivo={a} conDestino={esAdmin} onEliminar={esAdmin ? eliminar : undefined} />
            ))}
          </ul>
        </section>
      ))}

      {agregando && <EnlaceMaterialModal onClose={() => setAgregando(false)} />}
    </div>
  );
};

export default Materiales;
