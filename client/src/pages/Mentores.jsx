import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, X, GraduationCap, Sparkles, FileText } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMentores, useInvalidate } from '../hooks/useQueryHooks';
import Modal from '../components/Modal';
import TarjetaMentor from '../components/mentores/TarjetaMentor';
import MentorFichaModal from '../components/mentores/MentorFichaModal';
import MentorFormModal from '../components/mentores/MentorFormModal';
import MentorMatch from '../components/mentores/MentorMatch';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import Segmentado from '../components/ui/Segmentado';
import { Input } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';
import { TEMAS_MENTORIA, SECTORES_MENTORIA, listaDe } from '../constants/mentores';

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const textoBuscable = (m) => normalizar([
  m.nombre, m.apellido, m.biografia, ...listaDe(m.sesiones), ...listaDe(m.startups), ...listaDe(m.ods)
].join(' '));

const Esqueleto = () => (
  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Cargando mentores">
    {[0, 1, 2].map((i) => (
      <li key={i} className={`${TARJETA_CLS} grid gap-3 p-4`}>
        <div className="flex items-center gap-3"><Skeleton className="size-14 shrink-0" /><Skeleton className="h-5 w-1/2" /></div>
        <Skeleton className="h-12" />
      </li>
    ))}
  </ul>
);

// Aviso del match con IA para el emprendedor: necesita el One Pager completo
const AvisoMatch = ({ onAbrir }) => {
  const { data: estados, isError } = useQuery({
    queryKey: ['onePagerEstado'],
    queryFn: () => api.get('/one-pager/estado').then((r) => r.data.estados || [])
  });
  if (!estados && !isError) return null;
  const completo = !isError && estados.length > 0 && estados.every((e) => e.completo);
  return (
    <div className="animate-enter flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-programa-soft px-4 py-3 text-programa-soft-foreground">
      <p className="flex items-start gap-2 text-sm">
        <Sparkles size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">¿No sabes a quién elegir?</span>{' '}
          {completo ? 'Responde 3 preguntas y la IA te sugerirá los mentores que mejor encajan.' : 'Completa tu One Pager y la IA te sugerirá mentores según tu proyecto.'}
        </span>
      </p>
      {completo ? (
        <button type="button" onClick={onAbrir} className={BOTON_PRIMARIO_CLS}><Sparkles size={16} aria-hidden="true" />Encontrar mi mentor</button>
      ) : (
        <Link to="/one-pager" className={BOTON_SECUNDARIO_CLS}><FileText size={16} aria-hidden="true" />Completar One Pager</Link>
      )}
    </div>
  );
};

// Red de mentores (antes Mentores del admin y Mis Mentores del emprendedor): una sola página.
// El emprendedor busca, filtra, agenda y usa el match con IA; el equipo técnico además
// agrega, edita y desactiva. La tarjeta abre la ficha.
const Mentores = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, isError, refetch } = useMentores(esAdmin ? {} : { activo: 'true' });
  const [searchParams, setSearchParams] = useSearchParams();
  const [abierto, setAbierto] = useState(null); // { tipo: 'ficha' | 'editar' | 'nuevo' | 'match', id }
  const actualizar = (cambios) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  const busqueda = searchParams.get('q') || '';
  const tema = searchParams.get('tema') || '';
  const sector = searchParams.get('sector') || '';
  const verInactivos = esAdmin && searchParams.get('estado') === 'inactivos';
  const hayFiltros = !!(busqueda.trim() || tema || sector || verInactivos);

  const todos = data || [];
  const activos = todos.filter((m) => m.activo);
  const inactivos = todos.length - activos.length;
  const texto = normalizar(busqueda.trim());
  const visibles = todos
    .filter((m) => (verInactivos ? !m.activo : m.activo))
    .filter((m) => !tema || listaDe(m.sesiones).includes(tema))
    .filter((m) => !sector || listaDe(m.startups).includes(sector))
    .filter((m) => !texto || textoBuscable(m).includes(texto));
  const conAgenda = activos.filter((m) => /^https?:\/\//i.test(m.calendly || '')).length;

  const refrescar = () => invalidate('mentores');
  const seleccionado = abierto?.id ? todos.find((m) => m.id === abierto.id) : null;

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{esAdmin ? 'Red de apoyo' : 'Mentoría'}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Mentores</h1>
          <p className="mt-1 text-muted-foreground">
            {esAdmin && data
              ? `${plural(activos.length, 'mentor activo', 'mentores activos')} · ${conAgenda} con agenda en línea`
              : 'Conoce a la red y agenda una sesión 1 a 1 con quien encaje con tu reto.'}
          </p>
        </div>
        {esAdmin && (
          <button type="button" onClick={() => setAbierto({ tipo: 'nuevo' })} className={BOTON_PRIMARIO_CLS}>
            <Plus size={16} aria-hidden="true" />Nuevo mentor
          </button>
        )}
      </header>

      {!esAdmin && <AvisoMatch onAbrir={() => setAbierto({ tipo: 'match' })} />}

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" value={busqueda} onChange={(e) => actualizar({ q: e.target.value })}
            placeholder="Nombre, tema, sector u ODS" aria-label="Buscar mentores" className="pl-9" />
        </div>
        <select aria-label="Filtrar por tema" value={tema} onChange={(e) => actualizar({ tema: e.target.value })} className={FILTRO_CLS}>
          <option value="">Todos los temas</option>
          {TEMAS_MENTORIA.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Filtrar por sector" value={sector} onChange={(e) => actualizar({ sector: e.target.value })} className={FILTRO_CLS}>
          <option value="">Todos los sectores</option>
          {SECTORES_MENTORIA.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {esAdmin && (
          <Segmentado
            etiqueta="Estado"
            valor={verInactivos ? 'inactivos' : ''}
            onCambiar={(valor) => actualizar({ estado: valor })}
            className="w-full"
            opciones={[{ valor: '', texto: `Activos (${activos.length})` }, { valor: 'inactivos', texto: `Inactivos (${inactivos})` }]}
          />
        )}
      </div>

      {data && (
        <p className="-mt-1 text-[13px] text-muted-foreground" aria-live="polite">
          {hayFiltros ? `${plural(visibles.length, 'mentor', 'mentores')} de ${verInactivos ? inactivos : activos.length}` : plural(visibles.length, 'mentor', 'mentores')}
        </p>
      )}

      {isLoading && <Esqueleto />}
      {isError && !data && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar la red de mentores." onReintentar={refetch} /></div>}

      {data && visibles.length === 0 && (
        <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-12 text-center`}>
          <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><GraduationCap size={24} aria-hidden="true" /></span>
          <p className="font-semibold">
            {texto || tema || sector ? 'Ningún mentor coincide con la búsqueda' : verInactivos ? 'No hay mentores inactivos' : esAdmin ? 'Aún no hay mentores en la red' : 'Pronto habrá mentores en la red'}
          </p>
          {hayFiltros ? (
            <button type="button" onClick={() => setSearchParams({}, { replace: true })} className={BOTON_SECUNDARIO_CLS}>
              <X size={16} aria-hidden="true" />Limpiar filtros
            </button>
          ) : esAdmin && (
            <button type="button" onClick={() => setAbierto({ tipo: 'nuevo' })} className={BOTON_PRIMARIO_CLS}>
              <Plus size={16} aria-hidden="true" />Agregar el primero
            </button>
          )}
        </div>
      )}

      {visibles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((m, i) => <TarjetaMentor key={m.id} mentor={m} indice={i} onAbrir={(id) => setAbierto({ tipo: 'ficha', id })} />)}
        </ul>
      )}

      {abierto?.tipo === 'ficha' && seleccionado && (
        <MentorFichaModal
          mentor={seleccionado}
          esAdmin={esAdmin}
          onClose={() => setAbierto(null)}
          onEditar={() => setAbierto({ tipo: 'editar', id: seleccionado.id })}
          onCambio={refrescar}
        />
      )}
      {abierto?.tipo === 'editar' && seleccionado && (
        <MentorFormModal mentor={seleccionado} onClose={() => setAbierto({ tipo: 'ficha', id: seleccionado.id })} onGuardado={refrescar} />
      )}
      {abierto?.tipo === 'nuevo' && <MentorFormModal onClose={() => setAbierto(null)} onGuardado={refrescar} />}
      {abierto?.tipo === 'match' && (
        <Modal isOpen onClose={() => setAbierto(null)} size="lg" title="Encuentra tu mentor ideal" descripcion="Tres preguntas y la IA te sugiere mentores de la red.">
          <MentorMatch onClose={() => setAbierto(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Mentores;
