import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSesionesResumen, useProgramas, useInvalidate } from '../hooks/useQueryHooks';
import FilaSesion from '../components/sesiones/FilaSesion';
import SesionFormModal from '../components/sesiones/SesionFormModal';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import { Input } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';
import { TIPOS_SESION, TIPOS_CREABLES } from '../constants/sesiones';
import { agruparSesiones } from '../utils/sesiones';
import { cuandoEs } from '../utils/programas';

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PASO_REALIZADAS = 10;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const Esqueleto = () => (
  <div className={`${TARJETA_CLS} grid gap-4 p-5`} role="status" aria-label="Cargando sesiones">
    <Skeleton className="h-6 w-40" />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-13 w-13 shrink-0" />
        <div className="grid flex-1 gap-2"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
      </div>
    ))}
  </div>
);

const Sesiones = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, isError, refetch } = useSesionesResumen();
  const { data: programas = [] } = useProgramas();
  const [searchParams, setSearchParams] = useSearchParams();
  const [verTodas, setVerTodas] = useState(false);

  // ?nueva=1 abre el formulario al llegar (Inicio, Programas); ?programa=ID lo deja con ese programa
  const [formulario, setFormulario] = useState(() => (
    esAdmin && searchParams.get('nueva') === '1' ? { sesion: null, programa: searchParams.get('programa') } : null
  ));
  useEffect(() => {
    if (searchParams.has('nueva')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('nueva');
        next.delete('programa');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Búsqueda y filtros en la URL
  const busqueda = searchParams.get('q') || '';
  const programa = searchParams.get('prog') || '';
  const tipo = searchParams.get('tipo') || '';
  const actualizar = (cambios) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  const refrescar = () => invalidate('sesiones', 'sesion', 'inicio', 'programa', 'programas', 'timeline');

  const eliminar = async (s) => {
    if (!window.confirm(`¿Eliminar «${s.titulo}»? También se borrarán sus registros, asistencia y evaluaciones. No se puede deshacer.`)) return;
    try {
      await api.delete(`/sesiones/${s.id}`);
      toast.success('Sesión eliminada');
      refrescar();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo eliminar la sesión');
    }
  };

  const todas = data?.sesiones || [];
  const texto = normalizar(busqueda.trim());
  const filtradas = todas
    .filter((s) => !programa || s.programas.some((p) => String(p.id) === programa))
    .filter((s) => !tipo || s.tipo === tipo)
    .filter((s) => !texto || normalizar(s.titulo).includes(texto));
  const grupos = data ? agruparSesiones(filtradas, data.hoy, esAdmin) : [];
  const hayFiltros = !!(busqueda || programa || tipo);

  const urgentes = grupos.find((g) => g.id === 'urgente')?.sesiones.length || 0;
  const proxima = todas.filter((s) => s.momento !== 'pasada').sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))[0];
  const resumen = data && [
    urgentes > 0 && (esAdmin ? plural(urgentes, 'sesión por cerrar', 'sesiones por cerrar') : plural(urgentes, 'sesión por evaluar', 'sesiones por evaluar')),
    proxima ? `próxima: ${cuandoEs(proxima.fecha, data.hoy).toLowerCase()}, ${proxima.titulo}` : 'sin sesiones programadas'
  ].filter(Boolean).join(' · ');

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Agenda</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Sesiones</h1>
          {resumen && <p className="mt-1 text-muted-foreground first-letter:uppercase">{resumen}</p>}
        </div>
        {esAdmin && (
          <button type="button" onClick={() => setFormulario({ sesion: null, programa: programa || null })} className={BOTON_PRIMARIO_CLS}>
            <Plus size={16} aria-hidden="true" />Nueva sesión
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" value={busqueda} onChange={(e) => actualizar({ q: e.target.value })} placeholder="Buscar por título" aria-label="Buscar sesiones" className="pl-9" />
        </div>
        {esAdmin && (
          <select aria-label="Filtrar por programa" value={programa} onChange={(e) => actualizar({ prog: e.target.value })} className={FILTRO_CLS}>
            <option value="">Todos los programas</option>
            {programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}
        <select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => actualizar({ tipo: e.target.value })} className={FILTRO_CLS}>
          <option value="">Todos los tipos</option>
          {TIPOS_CREABLES.map((t) => <option key={t} value={t}>{TIPOS_SESION[t].label}</option>)}
        </select>
      </div>

      {isLoading && <Esqueleto />}
      {isError && !data && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar las sesiones." onReintentar={refetch} /></div>}

      {data && grupos.length === 0 && (
        <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-12 text-center`}>
          <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><CalendarDays size={24} aria-hidden="true" /></span>
          <p className="font-semibold">
            {hayFiltros ? 'Ninguna sesión coincide con los filtros' : esAdmin ? 'Aún no hay sesiones' : 'Aún no hay sesiones en tu programa'}
          </p>
          {hayFiltros ? (
            <button type="button" onClick={() => setSearchParams({}, { replace: true })} className={BOTON_SECUNDARIO_CLS}>
              <X size={16} aria-hidden="true" />Limpiar filtros
            </button>
          ) : esAdmin && (
            <button type="button" onClick={() => setFormulario({ sesion: null, programa: null })} className={BOTON_PRIMARIO_CLS}>
              <Plus size={16} aria-hidden="true" />Programar la primera
            </button>
          )}
        </div>
      )}

      {grupos.map((g, i) => {
        const limitado = g.id === 'realizadas' && !verTodas && g.sesiones.length > PASO_REALIZADAS;
        const visibles = limitado ? g.sesiones.slice(0, PASO_REALIZADAS) : g.sesiones;
        return (
          <section
            key={g.id}
            aria-labelledby={`grupo-${g.id}`}
            className={`${TARJETA_CLS} @container animate-enter escalonado ${g.id === 'urgente' ? 'border-warning-solid/60' : ''}`}
            style={{ '--i': i }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 pb-2 pt-4">
              <h2 id={`grupo-${g.id}`} className={TITULO_BLOQUE_CLS}>{g.titulo}</h2>
              <span className="text-[13px] tabular-nums text-muted-foreground">{g.ayuda ? `${g.ayuda} · ` : ''}{g.sesiones.length}</span>
            </div>
            <ul className="px-2 pb-2">
              {visibles.map((s) => (
                <FilaSesion
                  key={s.id}
                  sesion={s}
                  esAdmin={esAdmin}
                  onEditar={(sesion) => setFormulario({ sesion, programa: null })}
                  onEliminar={eliminar}
                />
              ))}
            </ul>
            {limitado && (
              <div className="border-t border-border px-5 py-3">
                <button type="button" onClick={() => setVerTodas(true)} className="rounded-control text-sm font-semibold text-link hover:underline">
                  Ver las {g.sesiones.length - PASO_REALIZADAS} anteriores
                </button>
              </div>
            )}
          </section>
        );
      })}

      {formulario && (
        <SesionFormModal
          sesion={formulario.sesion}
          programaInicial={formulario.programa}
          onClose={() => setFormulario(null)}
          onGuardado={refrescar}
        />
      )}
    </div>
  );
};

export default Sesiones;
