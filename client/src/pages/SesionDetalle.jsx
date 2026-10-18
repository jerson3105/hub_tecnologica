import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Pencil, ClipboardList, ExternalLink, Video, CalendarDays, Star, CalendarClock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRegistroSesion, useInvalidate } from '../hooks/useQueryHooks';
import TarjetaKpi from '../components/inicio/TarjetaKpi';
import SesionFormModal from '../components/sesiones/SesionFormModal';
import RegistroSesion from '../components/sesiones/RegistroSesion';
import AsistenciaSesion from '../components/sesiones/AsistenciaSesion';
import EvaluacionSesion from '../components/sesiones/EvaluacionSesion';
import MaterialesSesion from '../components/sesiones/MaterialesSesion';
import ListaCompromisos from '../components/ListaCompromisos';
import Pestanas from '../components/ui/Pestanas';
import Skeleton from '../components/ui/Skeleton';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';
import { tipoSesion, TIPOS_CON_REGISTRO } from '../constants/sesiones';
import { formatFecha, parseFecha } from '../utils/fechas';
import { horario, modalidadTexto } from '../utils/sesiones';
import { formatoDecimal } from '../utils/inicio';

const momentoDe = (fecha) => {
  const f = parseFecha(fecha);
  if (!f) return 'pasada';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return f > hoy ? 'proxima' : f.getTime() === hoy.getTime() ? 'hoy' : 'pasada';
};
const MOMENTOS = { hoy: { label: 'Hoy', tono: 'info' }, proxima: { label: 'Programada', tono: 'neutral' }, pasada: { label: 'Realizada', tono: 'neutral' } };

const Esqueleto = () => (
  <div className="mx-auto grid max-w-page gap-4" role="status" aria-label="Cargando la sesión">
    <Skeleton className="h-4 w-48" />
    <Skeleton className="h-9 w-80 max-w-full" />
    <Skeleton className="h-4 w-96 max-w-full" />
    <Skeleton className="h-11 w-full" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
  </div>
);

// Resumen del equipo técnico: cómo va la sesión y qué falta
const ResumenAdmin = ({ sesion, registro, npsData, conRegistro, momento, irA }) => {
  const emps = registro?.emprendimientos || [];
  const miembros = emps.flatMap((e) => e.equipo);
  const marcados = miembros.filter((m) => m.presente !== null);
  const presentes = marcados.filter((m) => m.presente).length;
  const listos = emps.filter((e) => e.estado !== 'pendiente').length;
  const ocurrida = momento !== 'proxima';

  const kpis = [
    conRegistro && {
      titulo: 'Registros', valor: listos,
      nota: `de ${emps.length} ${emps.length === 1 ? 'emprendimiento' : 'emprendimientos'}`,
      tonoNota: ocurrida && listos < emps.length ? 'warning' : 'muted'
    },
    {
      titulo: 'Asistencia', valor: marcados.length ? presentes : null,
      nota: marcados.length ? `presentes de ${marcados.length} marcados` : ocurrida ? 'Sin tomar' : `${miembros.length} participantes`,
      tonoNota: ocurrida && !marcados.length ? 'warning' : 'muted'
    },
    {
      titulo: 'Evaluación', cifra: npsData?.total ? formatoDecimal(npsData.promedio) : undefined, valor: npsData?.total ? undefined : null,
      nota: npsData?.total ? `promedio de ${npsData.total} ${npsData.total === 1 ? 'respuesta' : 'respuestas'}` : ocurrida ? 'Aún sin respuestas' : 'Se abre al realizarse'
    }
  ].filter(Boolean);

  return (
    <div className="grid gap-4 lg:gap-6">
      <dl className={`grid grid-cols-2 gap-3 sm:gap-4 ${kpis.length === 3 ? '@3xl:grid-cols-3' : ''}`}>
        {kpis.map((k, i) => <TarjetaKpi key={k.titulo} {...k} indice={i} />)}
      </dl>
      <div className="grid items-start gap-4 @4xl:grid-cols-2 lg:gap-6">
        <section aria-labelledby="t-participan" className={`${TARJETA_CLS} grid gap-3 p-5`}>
          <h2 id="t-participan" className={TITULO_BLOQUE_CLS}>Participan</h2>
          {emps.length === 0
            ? <p className="text-sm text-muted-foreground">Ningún emprendimiento activo en sus programas.</p>
            : (
              <ul className="flex flex-wrap gap-2">
                {emps.map((e) => (
                  <li key={e.id}>
                    <Link to={`/emprendimientos/${e.id}`} className={`${CHIP_CLS} ${FONDO_TONO.neutral} min-h-8 px-2.5 text-[13px] hover:bg-info-soft`}>{e.nombre}</Link>
                  </li>
                ))}
              </ul>
            )}
          {ocurrida && ((conRegistro && listos < emps.length) || (!marcados.length && miembros.length > 0)) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {conRegistro && listos < emps.length && <button type="button" onClick={() => irA('registro')} className="rounded-control text-sm font-semibold text-link hover:underline">Ver registros pendientes</button>}
              {!marcados.length && miembros.length > 0 && <button type="button" onClick={() => irA('asistencia')} className="rounded-control text-sm font-semibold text-link hover:underline">Tomar asistencia</button>}
            </div>
          )}
        </section>
        {sesion.descripcion && (
          <section aria-labelledby="t-descripcion" className={`${TARJETA_CLS} grid gap-2 p-5`}>
            <h2 id="t-descripcion" className={TITULO_BLOQUE_CLS}>Agenda</h2>
            <p className="whitespace-pre-line text-sm">{sesion.descripcion}</p>
          </section>
        )}
      </div>
    </div>
  );
};

// Resumen del emprendedor: lo trabajado con su equipo y qué toca hacer
const ResumenEmprendedor = ({ sesion, momento, pendienteEvaluar, irA }) => {
  const mio = sesion.seguimientos?.[0];
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-2 lg:gap-6">
      {pendienteEvaluar && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning-solid/60 bg-warning-soft px-5 py-4 @4xl:col-span-2">
          <p className="text-sm text-warning-soft-foreground"><span className="font-semibold">¿Qué te pareció?</span> Tu evaluación nos ayuda a mejorar.</p>
          <button type="button" onClick={() => irA('evaluacion')} className={BOTON_PRIMARIO_CLS}><Star size={16} aria-hidden="true" />Evaluar ahora</button>
        </div>
      )}
      <section aria-labelledby="t-mio" className={`${TARJETA_CLS} grid gap-3 p-5`}>
        <h2 id="t-mio" className={TITULO_BLOQUE_CLS}>Mi seguimiento</h2>
        {mio?.realizado ? (
          <>
            <p className="whitespace-pre-line text-sm">{mio.realizado}</p>
            <ListaCompromisos seguimiento={mio} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {momento === 'proxima' ? 'Aquí verás lo trabajado y tus compromisos después de la sesión.' : 'El equipo técnico aún no registra lo trabajado en esta sesión.'}
          </p>
        )}
      </section>
      {sesion.descripcion && (
        <section aria-labelledby="t-descripcion" className={`${TARJETA_CLS} grid gap-2 p-5`}>
          <h2 id="t-descripcion" className={TITULO_BLOQUE_CLS}>Agenda</h2>
          <p className="whitespace-pre-line text-sm">{sesion.descripcion}</p>
        </section>
      )}
    </div>
  );
};

const SesionDetalle = () => {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editando, setEditando] = useState(false);

  const { data: sesion, isLoading, isError } = useQuery({
    queryKey: ['sesion', id],
    queryFn: () => api.get(`/sesiones/${id}`).then((r) => r.data.sesion),
    enabled: !!id,
    retry: (intentos, error) => ![403, 404].includes(error?.response?.status) && intentos < 1
  });
  const { data: registro } = useRegistroSesion(esAdmin ? id : null);
  const { data: npsData } = useQuery({
    queryKey: ['nps-sesion', String(id)],
    queryFn: () => api.get(`/nps/sesion/${id}`).then((r) => r.data),
    enabled: !!id && esAdmin
  });
  const { data: npsPendientes = [] } = useQuery({
    queryKey: ['nps', 'mis-pendientes'],
    queryFn: () => api.get('/nps/mis-pendientes').then((r) => r.data.pendientes || []),
    enabled: !!id && !esAdmin,
    staleTime: 0
  });

  if (isLoading) return <Esqueleto />;
  if (isError || !sesion) {
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-12 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><CalendarDays size={24} aria-hidden="true" /></span>
        <p className="font-semibold">Sesión no encontrada o sin acceso</p>
        <Link to="/sesiones" className={BOTON_SECUNDARIO_CLS}>Volver a Sesiones</Link>
      </div>
    );
  }

  const momento = momentoDe(sesion.fecha);
  const conRegistro = TIPOS_CON_REGISTRO.includes(sesion.tipo);
  const pendienteEvaluar = !esAdmin && momento !== 'proxima' && npsPendientes.includes(Number(id));
  const pestanas = esAdmin
    ? [
      { id: 'resumen', label: 'Resumen' },
      ...(conRegistro ? [{ id: 'registro', label: 'Registro', contador: registro ? registro.emprendimientos.filter((e) => e.estado === 'pendiente').length || undefined : undefined }] : []),
      { id: 'asistencia', label: 'Asistencia' },
      { id: 'evaluacion', label: 'Evaluación', contador: npsData?.total || undefined },
      { id: 'materiales', label: 'Materiales', contador: sesion.archivos?.length || undefined }
    ]
    : [
      { id: 'resumen', label: 'Resumen' },
      { id: 'evaluacion', label: pendienteEvaluar ? 'Evaluar' : 'Evaluación' },
      { id: 'materiales', label: 'Materiales', contador: sesion.archivos?.length || undefined }
    ];
  const tab = pestanas.some((p) => p.id === searchParams.get('tab')) ? searchParams.get('tab') : 'resumen';
  const irA = (nueva) => setSearchParams(nueva === 'resumen' ? {} : { tab: nueva }, { replace: true });
  const programas = sesion.programas?.length ? sesion.programas : (sesion.programa ? [sesion.programa] : []);
  const meta = [horario(sesion), modalidadTexto(sesion)].filter(Boolean).join(' · ');
  const estadoMomento = MOMENTOS[momento];
  const fecha = formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fechaLarga = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <nav aria-label="Ruta" className="animate-enter text-sm">
        <ol className="flex items-center gap-1.5 text-muted-foreground">
          <li><Link to="/sesiones" className="rounded-chip hover:text-link hover:underline">Sesiones</Link></li>
          <li aria-hidden="true"><ChevronRight size={14} /></li>
          <li aria-current="page" className="truncate font-medium text-foreground">{sesion.titulo}</li>
        </ol>
      </nav>

      <header className="animate-enter flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo] || 'neutral']}`}>{tipoSesion(sesion.tipo).label}</span>
            <span className={`${CHIP_CLS} ${FONDO_TONO[estadoMomento.tono]}`}>{estadoMomento.label}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{sesion.titulo}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} aria-hidden="true" />{fechaLarga}{meta && ` · ${meta}`}</span>
            {programas.length > 0 && (
              <span>
                {programas.map((p, i) => (
                  <span key={p.id}>{i > 0 && ', '}{esAdmin ? <Link to={`/programas/${p.id}`} className="text-link hover:underline">{p.nombre}</Link> : p.nombre}</span>
                ))}
              </span>
            )}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          {sesion.enlace_reunion && momento !== 'pasada' && (
            <a href={sesion.enlace_reunion} target="_blank" rel="noopener noreferrer" className={momento === 'hoy' ? BOTON_PRIMARIO_CLS : BOTON_SECUNDARIO_CLS}>
              <ExternalLink size={16} aria-hidden="true" />Unirse<span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          )}
          {sesion.enlace_grabacion && (
            <a href={sesion.enlace_grabacion} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO_CLS}>
              <Video size={16} aria-hidden="true" />Grabación<span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          )}
          {esAdmin && (
            <button type="button" onClick={() => setEditando(true)} className={BOTON_SECUNDARIO_CLS}>
              <Pencil size={16} aria-hidden="true" />Editar
            </button>
          )}
          {esAdmin && conRegistro && momento !== 'proxima' && (
            <Link to={`/sesiones/${sesion.id}/registro`} className={BOTON_PRIMARIO_CLS}>
              <ClipboardList size={16} aria-hidden="true" />Registrar ronda
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-4">
        <Pestanas idBase="sesion" etiqueta="Secciones de la sesión" activa={tab} onCambiar={irA} pestanas={pestanas} />
        <div role="tabpanel" id={`sesion-panel-${tab}`} aria-labelledby={`sesion-tab-${tab}`} tabIndex={0} className="rounded-card">
          {tab === 'resumen' && (esAdmin
            ? <ResumenAdmin sesion={sesion} registro={registro} npsData={npsData} conRegistro={conRegistro} momento={momento} irA={irA} />
            : <ResumenEmprendedor sesion={sesion} momento={momento} pendienteEvaluar={pendienteEvaluar} irA={irA} />)}
          {tab === 'registro' && (registro
            ? <RegistroSesion sesionId={sesion.id} emprendimientos={registro.emprendimientos} />
            : <Skeleton className="h-64 rounded-card" />)}
          {tab === 'asistencia' && (registro
            ? <AsistenciaSesion sesionId={id} emprendimientos={registro.emprendimientos} sesionFutura={momento === 'proxima'} />
            : <Skeleton className="h-64 rounded-card" />)}
          {tab === 'evaluacion' && <EvaluacionSesion sesion={sesion} esAdmin={esAdmin} sesionFutura={momento === 'proxima'} pendiente={pendienteEvaluar} />}
          {tab === 'materiales' && <MaterialesSesion sesion={sesion} esAdmin={esAdmin} />}
        </div>
      </div>

      {editando && (
        <SesionFormModal
          sesion={sesion}
          onClose={() => setEditando(false)}
          onGuardado={() => invalidate('sesion', 'sesiones', 'inicio', 'programa', 'programas')}
        />
      )}
    </div>
  );
};

export default SesionDetalle;
