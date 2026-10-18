import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, X, Users, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useInvalidate } from '../hooks/useQueryHooks';
import UsuarioFichaModal from '../components/usuarios/UsuarioFichaModal';
import UsuarioFormModal from '../components/usuarios/UsuarioFormModal';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import Segmentado from '../components/ui/Segmentado';
import { Input } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS, CHIP_CLS, FONDO_TONO } from '../components/ui/estilosSemanticos';

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const PASO = 30;
const ROLES = [
  { valor: '', texto: 'Todos' },
  { valor: 'emprendedor', texto: 'Emprendedores' },
  { valor: 'admin', texto: 'Equipo técnico' }
];
const ESTADOS = { activos: 'Activos', inactivos: 'Inactivos', todos: 'Todos los estados' };

const sinEquipo = (u) => u.rol === 'emprendedor' && !(u.integrantes?.length > 0);
const textoBuscable = (u) => normalizar([
  u.nombre, u.apellido, u.email, u.dni, u.telefono, u.cargo,
  ...(u.integrantes || []).map((i) => i.emprendimiento?.nombre)
].join(' '));

const Esqueleto = () => (
  <div className={`${TARJETA_CLS} grid gap-4 p-5`} role="status" aria-label="Cargando usuarios">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
      </div>
    ))}
  </div>
);

// Fila del directorio. Toda la fila abre la ficha (el botón es el nombre; su ::after la cubre).
const FilaUsuario = ({ u, onAbrir }) => {
  const integrante = u.integrantes?.[0];
  const destino = u.rol === 'admin'
    ? <span className={`${CHIP_CLS} ${FONDO_TONO.azul}`}>Equipo técnico</span>
    : integrante
      ? (
        <span className="grid min-w-0">
          <span className="truncate text-sm font-medium">{integrante.emprendimiento?.nombre}{integrante.es_lider && <span className="font-normal text-muted-foreground"> · líder</span>}</span>
          {integrante.emprendimiento?.programa?.nombre && <span className="truncate text-xs text-muted-foreground">{integrante.emprendimiento.programa.nombre}</span>}
        </span>
      )
      : <span className={`${CHIP_CLS} ${FONDO_TONO.warning}`}>Sin emprendimiento</span>;

  return (
    <li className="relative flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60 sm:px-5">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${!u.activo ? 'bg-muted text-muted-foreground' : u.rol === 'admin' ? FONDO_TONO.azul : FONDO_TONO.programa}`}
        aria-hidden="true"
      >
        {`${u.nombre?.[0] || ''}${u.apellido?.[0] || ''}`.toUpperCase()}
      </span>
      <div className="grid min-w-0 flex-1 gap-1 @2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @2xl:items-center @2xl:gap-6">
        <div className="grid min-w-0 gap-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <button
              type="button"
              onClick={() => onAbrir(u.id)}
              aria-haspopup="dialog"
              className={`text-left font-semibold after:absolute after:inset-0 after:content-[''] hover:underline ${u.activo ? '' : 'text-muted-foreground'}`}
            >
              {u.apellido}, {u.nombre}
            </button>
            {!u.activo && <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Inactiva</span>}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{[u.email, u.telefono].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="min-w-0">{destino}</div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </li>
  );
};

// Directorio de usuarios (equipo técnico y emprendedores). La fila abre la ficha, desde donde se
// edita, se restablece la contraseña, se desactiva y se asigna a un emprendimiento.
const Usuarios = () => {
  const { usuario: yo } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', 'todos'],
    queryFn: () => api.get('/auth/usuarios').then((r) => r.data.usuarios)
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [abierto, setAbierto] = useState(null); // { tipo: 'ficha' | 'editar' | 'nuevo', id }
  const [limite, setLimite] = useState(PASO);
  const actualizar = (cambios) => {
    setLimite(PASO);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });
  };

  const busqueda = searchParams.get('q') || '';
  const rol = ['emprendedor', 'admin'].includes(searchParams.get('rol')) ? searchParams.get('rol') : '';
  const estado = ESTADOS[searchParams.get('estado')] ? searchParams.get('estado') : 'activos';
  const soloSinEquipo = searchParams.get('equipo') === 'sin';
  const hayFiltros = !!(busqueda.trim() || rol || estado !== 'activos' || soloSinEquipo);

  const todos = data || [];
  const activos = todos.filter((u) => u.activo);
  const sinEquipoActivos = activos.filter(sinEquipo).length;
  const delEstado = todos.filter((u) => estado === 'todos' || (estado === 'activos' ? u.activo : !u.activo));
  const conteo = { '': delEstado.length, emprendedor: delEstado.filter((u) => u.rol === 'emprendedor').length, admin: delEstado.filter((u) => u.rol === 'admin').length };
  const texto = normalizar(busqueda.trim());
  const visibles = delEstado
    .filter((u) => !rol || u.rol === rol)
    .filter((u) => !soloSinEquipo || sinEquipo(u))
    .filter((u) => !texto || textoBuscable(u).includes(texto));

  const refrescar = () => invalidate('usuarios', 'emprendimientos', 'emprendimiento');
  const seleccionado = abierto?.id ? todos.find((u) => u.id === abierto.id) : null;
  const titulo = soloSinEquipo ? 'Emprendedores sin emprendimiento'
    : estado === 'inactivos' ? 'Cuentas inactivas'
      : ROLES.find((r) => r.valor === rol && r.valor)?.texto || 'Todos los usuarios';

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Gestión</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Usuarios</h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {plural(activos.length, 'cuenta activa', 'cuentas activas')}
              {' · '}{plural(activos.filter((u) => u.rol === 'emprendedor').length, 'emprendedor', 'emprendedores')}
              {' y '}{activos.filter((u) => u.rol === 'admin').length} del equipo técnico
            </p>
          )}
        </div>
        <button type="button" onClick={() => setAbierto({ tipo: 'nuevo' })} className={BOTON_PRIMARIO_CLS}>
          <Plus size={16} aria-hidden="true" />Nuevo usuario
        </button>
      </header>

      {data && sinEquipoActivos > 0 && !soloSinEquipo && (
        <div className="animate-enter flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning-solid/50 bg-warning-soft px-4 py-3 text-warning-soft-foreground">
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            <span><span className="font-semibold">{plural(sinEquipoActivos, 'emprendedor', 'emprendedores')} sin emprendimiento.</span> No ven sesiones ni seguimiento hasta que los asignes.</span>
          </p>
          <button type="button" onClick={() => actualizar({ equipo: 'sin', rol: '', estado: '' })} className="rounded-control px-2 text-sm font-semibold underline-offset-2 hover:underline">
            Ver {sinEquipoActivos === 1 ? 'cuál' : 'cuáles'}
          </button>
        </div>
      )}

      {isLoading && <Esqueleto />}
      {isError && !data && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los usuarios." onReintentar={refetch} /></div>}

      {data && (
        <section aria-labelledby="t-usuarios" className={`${TARJETA_CLS} @container animate-enter`}>
          <div className="grid gap-3 px-4 pb-3 pt-4 sm:px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="t-usuarios" className={TITULO_BLOQUE_CLS}>{titulo}</h2>
              <span className="text-[13px] tabular-nums text-muted-foreground" aria-live="polite">
                {hayFiltros ? `${visibles.length} de ${todos.length}` : visibles.length}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="relative min-w-[14rem] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input type="search" value={busqueda} onChange={(e) => actualizar({ q: e.target.value })}
                  placeholder="Nombre, correo, DNI o emprendimiento" aria-label="Buscar usuarios" className="pl-9" />
              </div>
              <select aria-label="Filtrar por estado de la cuenta" value={estado} onChange={(e) => actualizar({ estado: e.target.value === 'activos' ? '' : e.target.value })} className={FILTRO_CLS}>
                {Object.entries(ESTADOS).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
              </select>
              {soloSinEquipo ? (
                <button type="button" onClick={() => actualizar({ equipo: '' })} className={`${CHIP_CLS} ${FONDO_TONO.warning} min-h-9 px-3`}>
                  Sin emprendimiento<X size={14} aria-hidden="true" /><span className="sr-only">: quitar filtro</span>
                </button>
              ) : (
                <Segmentado
                  etiqueta="Rol"
                  valor={rol}
                  onCambiar={(valor) => actualizar({ rol: valor })}
                  className="w-full overflow-x-auto [scrollbar-width:none]"
                  opciones={ROLES.map((r) => ({ valor: r.valor, texto: `${r.texto} (${conteo[r.valor]})` }))}
                />
              )}
            </div>
          </div>

          {visibles.length === 0 ? (
            <div className="grid justify-items-center gap-3 border-t border-border px-5 py-12 text-center">
              <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Users size={24} aria-hidden="true" /></span>
              <p className="font-semibold">{texto ? `Nadie coincide con «${busqueda.trim()}»` : 'No hay usuarios con estos filtros'}</p>
              {hayFiltros && (
                <button type="button" onClick={() => setSearchParams({}, { replace: true })} className={BOTON_SECUNDARIO_CLS}>
                  <X size={16} aria-hidden="true" />Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="border-t border-border">
                {visibles.slice(0, limite).map((u) => <FilaUsuario key={u.id} u={u} onAbrir={(id) => setAbierto({ tipo: 'ficha', id })} />)}
              </ul>
              {visibles.length > limite && (
                <div className="border-t border-border px-5 py-3">
                  <button type="button" onClick={() => setLimite((l) => l + PASO)} className="rounded-control text-sm font-semibold text-link hover:underline">
                    Mostrar {Math.min(PASO, visibles.length - limite)} más
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {abierto?.tipo === 'ficha' && seleccionado && (
        <UsuarioFichaModal
          usuario={seleccionado}
          esUnoMismo={seleccionado.id === yo?.id}
          onClose={() => setAbierto(null)}
          onEditar={() => setAbierto({ tipo: 'editar', id: seleccionado.id })}
          onCambio={refrescar}
        />
      )}
      {abierto?.tipo === 'editar' && seleccionado && (
        <UsuarioFormModal
          usuario={seleccionado}
          esUnoMismo={seleccionado.id === yo?.id}
          // Al cerrar se vuelve a la ficha desde la que se abrió
          onClose={() => setAbierto({ tipo: 'ficha', id: seleccionado.id })}
          onGuardado={refrescar}
        />
      )}
      {abierto?.tipo === 'nuevo' && <UsuarioFormModal onClose={() => setAbierto(null)} onGuardado={refrescar} />}
    </div>
  );
};

export default Usuarios;
