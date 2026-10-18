import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Pencil, ClipboardList, Rocket, Target, ListChecks, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmprendimiento, useEmprendimientoResumen, useArchivos, useInvalidate } from '../../hooks/useQueryHooks';
import { esFutura } from '../../utils/fechas';
import { haceDias } from '../../utils/inicio';
import { fechasPasadasDe } from '../../utils/compromisos';
import useAvisos from '../shell/useAvisos';
import TarjetaKpi from '../inicio/TarjetaKpi';
import LineaSeguimiento from './LineaSeguimiento';
import EquipoEmprendimiento from './EquipoEmprendimiento';
import OnePagerVista from './OnePagerVista';
import OnePagerEditor from './OnePagerEditor';
import BmcVista from './BmcVista';
import BmcEditor from './BmcEditor';
import ProximaSesion from './ProximaSesion';
import CompromisosAbiertos from '../seguimiento/CompromisosAbiertos';
import ObjetivosOkr from '../seguimiento/ObjetivosOkr';
import MaterialesEmprendimiento from '../materiales/MaterialesEmprendimiento';
import EmprendimientoFormModal from './EmprendimientoFormModal';
import Pestanas from '../ui/Pestanas';
import Skeleton from '../ui/Skeleton';
import {
  TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS, ACCION_CLS
} from '../ui/estilosSemanticos';

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

export const EsqueletoEspacio = () => (
  <div className="mx-auto grid max-w-page gap-4 lg:gap-6" role="status" aria-label="Cargando el emprendimiento">
    <Skeleton className="h-4 w-48" />
    <div className="flex items-center gap-4">
      <Skeleton className="size-14 shrink-0 rounded-card" />
      <div className="grid flex-1 gap-2"><Skeleton className="h-8 w-64 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
    </div>
    <Skeleton className="h-11 w-full" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
  </div>
);

// «Por hacer» del emprendedor: lo que le toca ahora, cada cosa con su enlace
const PorHacer = ({ asuntos }) => (
  <section aria-labelledby="t-porhacer" className={`${TARJETA_CLS} animate-enter`}>
    <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
      <h2 id="t-porhacer" className={TITULO_BLOQUE_CLS}>Por hacer</h2>
      {asuntos.length > 0 && <span className="text-[13px] tabular-nums text-muted-foreground">{plural(asuntos.length, 'pendiente', 'pendientes')}</span>}
    </div>
    {asuntos.length === 0 ? (
      <div className="flex items-center gap-3 border-t border-border px-5 py-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-success-soft text-success-soft-foreground"><CheckCircle2 size={18} aria-hidden="true" /></span>
        <p className="text-sm"><span className="font-semibold">Todo al día.</span> <span className="text-muted-foreground">No tienes evaluaciones, compromisos ni pendientes del One Pager.</span></p>
      </div>
    ) : (
      <ul className="px-2 pb-2">
        {asuntos.map((a) => {
          const Icono = a.icono;
          return (
            <li key={a.titulo} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-3 py-2.5">
              <span className={`grid size-9 place-items-center rounded-control ${FONDO_TONO[a.tono] || FONDO_TONO.neutral}`}><Icono size={16} aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.titulo}</p>
                {a.detalle && <p className="text-[13px] text-muted-foreground">{a.detalle}</p>}
              </div>
              <Link to={a.to} className={ACCION_CLS}>{a.accion}<ChevronRight size={14} aria-hidden="true" /></Link>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

// Espacio de un emprendimiento con pestañas en la URL (?tab=). El equipo técnico ve todo y gestiona;
// el emprendedor (su «Mi emprendimiento») ve Resumen con «Por hacer», One Pager, Modelo de negocio,
// Materiales y Equipo, y edita ahí mismo su One Pager (?tab=onepager&editar=1) y su BMC. Sus
// compromisos, objetivos e historial de sesiones están en Mi plan.
const EspacioEmprendimiento = ({ id }) => {
  const { esAdmin, usuario } = useAuth();
  const invalidate = useInvalidate();
  const { data: emp, isLoading, isError } = useEmprendimiento(id);
  const { data: resumenData } = useEmprendimientoResumen(id);
  const { data: materiales } = useArchivos({ emprendimiento_id: id });
  const avisos = useAvisos(esAdmin);
  const [editando, setEditando] = useState(false);
  const [pendientes, setPendientes] = useState(false); // cambios sin guardar en un editor de pestaña
  const [searchParams, setSearchParams] = useSearchParams();

  const pestanasDisponibles = esAdmin
    ? ['resumen', 'seguimiento', 'objetivos', 'onepager', 'bmc', 'materiales', 'equipo']
    : ['resumen', 'onepager', 'bmc', 'materiales', 'equipo'];
  const tab = pestanasDisponibles.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'resumen';
  const editandoOnePager = !esAdmin && tab === 'onepager' && searchParams.get('editar') === '1';
  const irA = (params) => setSearchParams(params, { replace: true });
  const cambiarTab = (nueva) => {
    if (pendientes && !window.confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
    irA(nueva === 'resumen' ? {} : { tab: nueva });
  };
  const refrescar = () => invalidate('emprendimiento', 'emprendimientos', 'programa', 'programas', 'inicio');

  if (isLoading) return <EsqueletoEspacio />;

  if (isError || !emp) {
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-12 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Rocket size={24} aria-hidden="true" /></span>
        <p className="font-semibold">Emprendimiento no encontrado o sin acceso</p>
        {esAdmin && <Link to="/emprendimientos" className={BOTON_SECUNDARIO_CLS}>Volver a Emprendimientos</Link>}
      </div>
    );
  }

  const estado = ESTADOS[emp.estado] || ESTADOS.activo;
  const resumen = resumenData?.resumen;
  const hoy = resumenData?.hoy;
  const seguimientos = emp.seguimientos || [];
  const realizadas = seguimientos.filter((s) => !esFutura(s.sesion?.fecha));
  const lider = emp.integrantes?.find((i) => i.es_lider)?.usuario;
  const soyLider = !esAdmin && emp.integrantes?.some((i) => i.usuario_id === usuario?.id && i.es_lider);
  const ultimosRegistros = realizadas.filter((s) => tieneTexto(s.realizado));
  const enlaceSeguimiento = `/seguimientos?emp=${emp.id}`;
  const enlaceRegistro = (seg) => `/sesiones/${seg.sesion.id}/registro?emp=${emp.id}`;

  // «Por hacer» del emprendedor: evaluaciones y One Pager (como la campana) y sus compromisos
  const porHacer = esAdmin ? [] : [
    ...avisos.asuntos,
    resumen?.abiertos > 0 && {
      icono: ListChecks,
      tono: resumen.vencidos > 0 ? 'danger' : 'info',
      titulo: plural(resumen.abiertos, 'compromiso abierto', 'compromisos abiertos'),
      detalle: resumen.vencidos > 0 ? `${plural(resumen.vencidos, 'ya vencido', 'ya vencidos')}: revísalos antes de la próxima sesión.` : 'Acordados en tus sesiones de seguimiento.',
      accion: 'Ver',
      to: '/mi-plan'
    }
  ].filter(Boolean);

  const meta = [
    emp.programa && (esAdmin
      ? <Link key="p" to={`/programas/${emp.programa.id}`} className="font-medium text-link hover:underline">{emp.programa.nombre}</Link>
      : <span key="p">{emp.programa.nombre}</span>),
    emp.sector && <span key="s">{emp.sector}</span>,
    lider && <span key="l">Líder: {lider.nombre} {lider.apellido}</span>,
    resumen && <span key="u">{resumen.ultimaReunion ? `Última reunión ${haceDias(resumen.diasSinReunion)}` : 'Sin reuniones registradas'}</span>
  ].filter(Boolean);

  const pestanas = esAdmin
    ? [
      { id: 'resumen', label: 'Resumen' },
      { id: 'seguimiento', label: 'Seguimiento', contador: realizadas.length },
      { id: 'objetivos', label: 'Objetivos' },
      { id: 'onepager', label: 'One Pager' },
      { id: 'bmc', label: 'BMC' },
      { id: 'materiales', label: 'Materiales', contador: materiales?.length || 0 },
      { id: 'equipo', label: 'Equipo', contador: emp.integrantes?.length || 0 }
    ]
    : [
      { id: 'resumen', label: 'Resumen' },
      { id: 'onepager', label: 'One Pager' },
      { id: 'bmc', label: 'Modelo de negocio' },
      { id: 'materiales', label: 'Materiales', contador: materiales?.length || 0 },
      { id: 'equipo', label: 'Equipo', contador: emp.integrantes?.length || 0 }
    ];

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      {esAdmin ? (
        <nav aria-label="Ruta" className="animate-enter text-sm">
          <ol className="flex items-center gap-1.5 text-muted-foreground">
            <li><Link to="/emprendimientos" className="rounded-chip hover:text-link hover:underline">Emprendimientos</Link></li>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li aria-current="page" className="truncate font-medium text-foreground">{emp.nombre}</li>
          </ol>
        </nav>
      ) : (
        <p className="eyebrow animate-enter -mb-2 lg:-mb-4">Mi emprendimiento</p>
      )}

      <header className="animate-enter flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-card bg-programa-soft font-display text-2xl font-semibold text-programa-soft-foreground" aria-hidden="true">
            {emp.nombre.charAt(0).toUpperCase()}
          </span>
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{emp.nombre}</h1>
              <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>
              {soyLider && <span className={`${CHIP_CLS} ${FONDO_TONO.programa}`}>Eres líder</span>}
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
            <Link to={enlaceSeguimiento} className={BOTON_PRIMARIO_CLS}>
              <ClipboardList size={16} aria-hidden="true" />Preparar seguimiento
            </Link>
          </div>
        )}
      </header>

      <div className="grid gap-4">
        <Pestanas idBase="emp" etiqueta="Secciones del emprendimiento" activa={tab} onCambiar={cambiarTab} pestanas={pestanas} />

        <div role="tabpanel" id={`emp-panel-${tab}`} aria-labelledby={`emp-tab-${tab}`} tabIndex={0} className="rounded-card">
          {tab === 'resumen' && (
            <div className="grid gap-4 lg:gap-6">
              {!esAdmin && <PorHacer asuntos={porHacer} />}
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
                  accion={realizadas.length > 0 && (esAdmin ? (
                    <button type="button" onClick={() => cambiarTab('seguimiento')} className="rounded-control text-sm font-semibold text-link hover:underline">
                      Ver todo el seguimiento
                    </button>
                  ) : (
                    <Link to="/mi-plan?tab=historial" className="rounded-control text-sm font-semibold text-link hover:underline">Ver el historial</Link>
                  ))}
                />
                <div className="grid gap-4">
                  <ProximaSesion sesion={resumenData?.proximaSesion} hoy={hoy} />
                  {!esAdmin && (
                    <Link to="/mi-plan?tab=objetivos" className={`${TARJETA_CLS} flex items-center gap-3 p-4 transition-colors hover:bg-muted/60`}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-info-soft text-info-soft-foreground"><Target size={18} aria-hidden="true" /></span>
                      <span className="grid min-w-0 flex-1">
                        <span className="text-sm font-semibold">Mis objetivos</span>
                        <span className="text-[13px] text-muted-foreground">{resumen?.okr === null || resumen?.okr === undefined ? 'Define tus OKR del programa' : `Avance medio ${resumen.okr} %`}</span>
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
                    </Link>
                  )}
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
          {tab === 'seguimiento' && esAdmin && (
            <div className="grid gap-4 lg:gap-6">
              <CompromisosAbiertos key={emp.id} emprendimientoId={emp.id} editable fechasPasadas={fechasPasadasDe(seguimientos, hoy)} />
              <LineaSeguimiento seguimientos={seguimientos} enlaceRegistro={enlaceRegistro} />
            </div>
          )}
          {tab === 'objetivos' && esAdmin && <ObjetivosOkr emprendimientoId={emp.id} editable />}
          {tab === 'onepager' && (editandoOnePager ? (
            <OnePagerEditor emprendimiento={emp} onSalir={() => irA({ tab: 'onepager' })} onPendientes={setPendientes} />
          ) : (
            <OnePagerVista
              emprendimiento={emp}
              accion={!esAdmin && (
                <button type="button" onClick={() => irA({ tab: 'onepager', editar: '1' })} className={BOTON_SECUNDARIO_CLS}>
                  <Pencil size={16} aria-hidden="true" />Editar One Pager
                </button>
              )}
            />
          ))}
          {tab === 'bmc' && (esAdmin
            ? <BmcVista emprendimientoId={emp.id} />
            : <BmcEditor emprendimientoId={emp.id} onPendientes={setPendientes} />)}
          {tab === 'materiales' && <MaterialesEmprendimiento emprendimientoId={emp.id} archivos={materiales} esAdmin={esAdmin} />}
          {tab === 'equipo' && <EquipoEmprendimiento emprendimiento={emp} esAdmin={esAdmin} esLider={soyLider} usuarioId={usuario?.id} onCambio={refrescar} />}
        </div>
      </div>

      {editando && <EmprendimientoFormModal emprendimiento={emp} onClose={() => setEditando(false)} onGuardado={refrescar} />}
    </div>
  );
};

export default EspacioEmprendimiento;
