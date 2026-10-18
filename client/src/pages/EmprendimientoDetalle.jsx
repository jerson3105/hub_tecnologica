import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Pencil, ClipboardList, CalendarClock, Download, FileUp, Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmprendimiento, useEmprendimientoResumen, useInvalidate } from '../hooks/useQueryHooks';
import { descargarArchivo } from '../services/api';
import { formatFecha, esFutura } from '../utils/fechas';
import { haceDias } from '../utils/inicio';
import { cuandoEs } from '../utils/programas';
import { tipoSesion } from '../constants/sesiones';
import { CATEGORIAS_ARCHIVO, estadoDe } from '../constants/estados';
import TarjetaKpi from '../components/inicio/TarjetaKpi';
import LineaSeguimiento from '../components/emprendimientos/LineaSeguimiento';
import EquipoEmprendimiento from '../components/emprendimientos/EquipoEmprendimiento';
import OnePagerVista from '../components/emprendimientos/OnePagerVista';
import BmcVista from '../components/emprendimientos/BmcVista';
import EmprendimientoFormModal from '../components/emprendimientos/EmprendimientoFormModal';
import Pestanas from '../components/ui/Pestanas';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import {
  TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS
} from '../components/ui/estilosSemanticos';

const ESTADOS = {
  activo: { label: 'Activo', tono: 'success' },
  graduado: { label: 'Graduado', tono: 'info' },
  retirado: { label: 'Retirado', tono: 'neutral' }
};

const tieneTexto = (v) => typeof v === 'string' && v.trim().length > 0;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const indicadoresDe = (r) => [
  {
    titulo: 'Avance OKR',
    valor: r.okr,
    sufijo: '%',
    nota: r.okr === null ? 'Sin objetivos activos' : 'Media de sus actividades'
  },
  {
    titulo: 'Asistencia',
    valor: r.asistencia,
    sufijo: '%',
    nota: r.asistencia === null ? 'Aún sin asistencia tomada' : 'Sesiones con algún integrante presente'
  },
  {
    titulo: 'Compromisos cumplidos',
    valor: r.compromisosCumplidos,
    sufijo: '%',
    nota: r.compromisosTotales ? `De ${plural(r.compromisosTotales, 'compromiso', 'compromisos')}` : 'Aún sin compromisos'
  },
  {
    titulo: 'Compromisos abiertos',
    valor: r.abiertos,
    nota: r.vencidos > 0 ? `${plural(r.vencidos, 'vencido', 'vencidos')}` : 'Ninguno vencido',
    tonoNota: r.vencidos > 0 ? 'danger' : 'success'
  }
];

const Esqueleto = () => (
  <div className="grid gap-4 lg:gap-6" role="status" aria-label="Cargando el emprendimiento">
    <Skeleton className="h-4 w-48" />
    <div className="flex items-center gap-4">
      <Skeleton className="size-14 shrink-0 rounded-card" />
      <div className="grid flex-1 gap-2"><Skeleton className="h-8 w-64 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
    </div>
    <Skeleton className="h-11 w-full" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
  </div>
);

const ProximaSesion = ({ sesion, hoy }) => (
  <section aria-labelledby="t-proxima" className={`${TARJETA_CLS} grid gap-2 p-5`}>
    <h2 id="t-proxima" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <CalendarClock size={16} aria-hidden="true" />Próxima sesión
    </h2>
    {sesion ? (
      <>
        <span className={`${CHIP_CLS} w-fit ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo] || 'neutral']}`}>{tipoSesion(sesion.tipo).label}</span>
        <Link to={`/sesiones/${sesion.id}`} className="font-semibold leading-snug hover:text-link hover:underline">{sesion.titulo}</Link>
        <span className="block text-[13px] text-muted-foreground first-letter:uppercase">
          {['Hoy', 'Mañana'].includes(cuandoEs(sesion.fecha, hoy)) && `${cuandoEs(sesion.fecha, hoy)} · `}
          {formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </>
    ) : (
      <p className="text-sm text-muted-foreground">No hay sesiones programadas en su programa.</p>
    )}
  </section>
);

const Materiales = ({ archivos = [] }) => (
  <section aria-labelledby="t-materiales" className={TARJETA_CLS}>
    <div className="px-5 py-4">
      <h2 id="t-materiales" className={TITULO_BLOQUE_CLS}>Materiales</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">Archivos asignados al emprendimiento. Los de cada sesión están en su detalle.</p>
    </div>
    {archivos.length === 0 ? (
      <div className="flex items-center gap-3 border-t border-border px-5 py-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><FileUp size={18} aria-hidden="true" /></span>
        <p className="text-sm text-muted-foreground">No hay archivos asignados a este emprendimiento.</p>
      </div>
    ) : (
      <ul className="border-t border-border">
        {archivos.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{a.nombre_original}</p>
              <p className="text-[13px] text-muted-foreground">{estadoDe(CATEGORIAS_ARCHIVO, a.categoria).label} · {formatFecha(a.created_at)}</p>
            </div>
            <Button variante="texto" icono={Download} onClick={() => descargarArchivo(a.id, a.nombre_original)} aria-label={`Descargar ${a.nombre_original}`} className="shrink-0">
              Descargar
            </Button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const EmprendimientoDetalle = () => {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const { data: emp, isLoading, isError } = useEmprendimiento(id);
  const { data: resumenData } = useEmprendimientoResumen(id);
  const [editando, setEditando] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const pestanasDisponibles = ['resumen', 'seguimiento', 'onepager', ...(esAdmin ? ['bmc'] : []), 'materiales', 'equipo'];
  const tab = pestanasDisponibles.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'resumen';
  const cambiarTab = (nueva) => setSearchParams(nueva === 'resumen' ? {} : { tab: nueva }, { replace: true });
  const refrescar = () => invalidate('emprendimiento', 'emprendimientos', 'programa', 'programas', 'inicio');
  const volver = esAdmin ? { to: '/emprendimientos', texto: 'Emprendimientos' } : { to: '/mi-emprendimiento', texto: 'Mi emprendimiento' };

  if (isLoading) return <div className="mx-auto max-w-page"><Esqueleto /></div>;

  if (isError || !emp) {
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-12 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Rocket size={24} aria-hidden="true" /></span>
        <p className="font-semibold">Emprendimiento no encontrado o sin acceso</p>
        <Link to={volver.to} className={BOTON_SECUNDARIO_CLS}>Volver a {volver.texto}</Link>
      </div>
    );
  }

  const estado = ESTADOS[emp.estado] || ESTADOS.activo;
  const resumen = resumenData?.resumen;
  const hoy = resumenData?.hoy;
  const seguimientos = emp.seguimientos || [];
  const realizadas = seguimientos.filter((s) => !esFutura(s.sesion?.fecha));
  const lider = emp.integrantes?.find((i) => i.es_lider)?.usuario;
  const ultimosRegistros = realizadas.filter((s) => tieneTexto(s.realizado));
  const enlaceRegistro = `/seguimientos?programa=${emp.programa?.id || ''}&emp=${emp.id}`;

  const meta = [
    emp.programa && (esAdmin
      ? <Link key="p" to={`/programas/${emp.programa.id}`} className="font-medium text-link hover:underline">{emp.programa.nombre}</Link>
      : <span key="p">{emp.programa.nombre}</span>),
    emp.sector && <span key="s">{emp.sector}</span>,
    lider && <span key="l">Líder: {lider.nombre} {lider.apellido}</span>,
    resumen && <span key="u">{resumen.ultimaReunion ? `Última reunión ${haceDias(resumen.diasSinReunion)}` : 'Sin reuniones registradas'}</span>
  ].filter(Boolean);

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <nav aria-label="Ruta" className="animate-enter text-sm">
        <ol className="flex items-center gap-1.5 text-muted-foreground">
          <li><Link to={volver.to} className="rounded-chip hover:text-link hover:underline">{volver.texto}</Link></li>
          <li aria-hidden="true"><ChevronRight size={14} /></li>
          <li aria-current="page" className="truncate font-medium text-foreground">{emp.nombre}</li>
        </ol>
      </nav>

      <header className="animate-enter flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-card bg-programa-soft font-display text-2xl font-semibold text-programa-soft-foreground" aria-hidden="true">
            {emp.nombre.charAt(0).toUpperCase()}
          </span>
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{emp.nombre}</h1>
              <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>
            </div>
            {meta.length > 0 && (
              <p className="flex flex-col gap-0.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                {meta.map((m, i) => <span key={i} className="inline-flex items-center gap-2">{i > 0 && <span aria-hidden="true" className="hidden sm:inline">·</span>}{m}</span>)}
              </p>
            )}
          </div>
        </div>
        {esAdmin && (
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <button type="button" onClick={() => setEditando(true)} className={BOTON_SECUNDARIO_CLS}>
              <Pencil size={16} aria-hidden="true" />Editar
            </button>
            <Link to={enlaceRegistro} className={BOTON_PRIMARIO_CLS}>
              <ClipboardList size={16} aria-hidden="true" />Registrar seguimiento
            </Link>
          </div>
        )}
      </header>

      <div className="grid gap-4">
        <Pestanas
          idBase="emp"
          etiqueta="Secciones del emprendimiento"
          activa={tab}
          onCambiar={cambiarTab}
          pestanas={[
            { id: 'resumen', label: 'Resumen' },
            { id: 'seguimiento', label: 'Seguimiento', contador: realizadas.length },
            { id: 'onepager', label: 'One Pager' },
            ...(esAdmin ? [{ id: 'bmc', label: 'BMC' }] : []),
            { id: 'materiales', label: 'Materiales', contador: emp.archivos?.length || 0 },
            { id: 'equipo', label: 'Equipo', contador: emp.integrantes?.length || 0 }
          ]}
        />

        <div role="tabpanel" id={`emp-panel-${tab}`} aria-labelledby={`emp-tab-${tab}`} tabIndex={0} className="rounded-card">
          {tab === 'resumen' && (
            <div className="grid gap-4 lg:gap-6">
              {resumen ? (
                <dl className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-4">
                  {indicadoresDe(resumen).map((k, i) => <TarjetaKpi key={k.titulo} {...k} indice={i} />)}
                </dl>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
              )}
              <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
                <LineaSeguimiento
                  seguimientos={ultimosRegistros}
                  limite={3}
                  titulo="Últimos registros"
                  vacio="Aún no hay sesiones con lo trabajado registrado."
                  accion={realizadas.length > 0 && (
                    <button type="button" onClick={() => cambiarTab('seguimiento')} className="rounded-control text-sm font-semibold text-link hover:underline">
                      Ver todo el seguimiento
                    </button>
                  )}
                />
                <div className="grid gap-4">
                  <ProximaSesion sesion={resumenData?.proximaSesion} hoy={hoy} />
                  {tieneTexto(emp.descripcion) && (
                    <section aria-labelledby="t-sobre" className={`${TARJETA_CLS} grid gap-2 p-5`}>
                      <h2 id="t-sobre" className="text-sm font-semibold text-muted-foreground">Sobre el emprendimiento</h2>
                      <p className="whitespace-pre-line text-sm">{emp.descripcion}</p>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
          {tab === 'seguimiento' && (
            <LineaSeguimiento
              seguimientos={seguimientos}
              accion={esAdmin && (
                <Link to={enlaceRegistro} className={BOTON_SECUNDARIO_CLS}>
                  <ClipboardList size={16} aria-hidden="true" />Registrar
                </Link>
              )}
            />
          )}
          {tab === 'onepager' && <OnePagerVista emprendimiento={emp} />}
          {tab === 'bmc' && esAdmin && <BmcVista emprendimientoId={emp.id} />}
          {tab === 'materiales' && <Materiales archivos={emp.archivos} />}
          {tab === 'equipo' && <EquipoEmprendimiento emprendimiento={emp} esAdmin={esAdmin} onCambio={refrescar} />}
        </div>
      </div>

      {editando && <EmprendimientoFormModal emprendimiento={emp} onClose={() => setEditando(false)} onGuardado={refrescar} />}
    </div>
  );
};

export default EmprendimientoDetalle;
