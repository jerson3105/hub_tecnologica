import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Rocket, ChevronDown, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmprendimientos, useEmprendimiento, useEmprendimientoResumen } from '../hooks/useQueryHooks';
import CompromisosAbiertos from '../components/seguimiento/CompromisosAbiertos';
import ObjetivosOkr from '../components/seguimiento/ObjetivosOkr';
import LineaSeguimiento from '../components/emprendimientos/LineaSeguimiento';
import ProximaSesion from '../components/emprendimientos/ProximaSesion';
import Pestanas from '../components/ui/Pestanas';
import Segmentado from '../components/ui/Segmentado';
import Skeleton from '../components/ui/Skeleton';
import ErrorCarga from '../components/ui/ErrorCarga';
import { fechasPasadasDe } from '../utils/compromisos';
import { esFutura, formatFecha } from '../utils/fechas';
import { TARJETA_CLS, CHIP_CLS, FONDO_TONO } from '../components/ui/estilosSemanticos';

const PESTANAS = ['compromisos', 'objetivos', 'historial'];
const CERRADOS = { completado: { label: 'Cumplido', tono: 'success' }, no_logrado: { label: 'No se hizo', tono: 'neutral' } };
const FILTROS = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'diagnosticas', texto: 'Diagnósticas', tipos: ['diagnostica_1', 'diagnostica_2', 'diagnostica_final'] },
  { valor: 'talleres', texto: 'Talleres', tipos: ['taller'] },
  { valor: 'uno_a_uno', texto: '1 a 1', tipos: ['uno_a_uno_programa', 'uno_a_uno_taller', 'seguimiento'] }
];

const Esqueleto = () => (
  <div className="mx-auto grid max-w-page gap-4 lg:gap-6" role="status" aria-label="Cargando tu plan">
    <div className="grid gap-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-72 max-w-full" /></div>
    <Skeleton className="h-11 w-full" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"><Skeleton className="h-64 rounded-card" /><Skeleton className="h-40 rounded-card" /></div>
  </div>
);

// Compromisos ya cerrados (de todas las sesiones), plegados: el registro de lo cumplido
const CompromisosCerrados = ({ seguimientos }) => {
  const cerrados = seguimientos.flatMap((s) => (s.compromisoItems || [])
    .filter((c) => CERRADOS[c.estado])
    .map((c) => ({ ...c, sesion: s.sesion })));
  if (cerrados.length === 0) return null;
  const cumplidos = cerrados.filter((c) => c.estado === 'completado').length;
  return (
    <details className={`${TARJETA_CLS} group`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-3 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">Compromisos cerrados</span>
        <span className="flex items-center gap-2 text-[13px] tabular-nums text-muted-foreground">
          {cumplidos} de {cerrados.length} cumplidos
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <ul className="grid gap-2 px-5 pb-5">
        {cerrados.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 rounded-control border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm">{c.descripcion}</p>
              {c.sesion && <p className="text-xs text-muted-foreground">De {c.sesion.titulo}, {formatFecha(c.sesion.fecha, { day: 'numeric', month: 'short' })}</p>}
            </div>
            <span className={`${CHIP_CLS} ${FONDO_TONO[CERRADOS[c.estado].tono]}`}>{CERRADOS[c.estado].label}</span>
          </li>
        ))}
      </ul>
    </details>
  );
};

const ComoFunciona = () => (
  <section aria-labelledby="t-como" className={`${TARJETA_CLS} grid gap-2 p-5`}>
    <h2 id="t-como" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <Lightbulb size={16} aria-hidden="true" />Cómo funciona
    </h2>
    <ul className="grid list-disc gap-1.5 pl-4 text-[13px] marker:text-subtle-foreground">
      <li>En cada sesión acuerdas compromisos con el equipo técnico.</li>
      <li>Márcalos aquí cuando avances: el equipo lo verá al preparar tu próxima sesión.</li>
      <li>Un compromiso vence si llega otra sesión sin haberlo cerrado.</li>
    </ul>
  </section>
);

// Mi plan del emprendedor (une Mi seguimiento y Mis objetivos): lo que acordó en sus sesiones
// (compromisos que puede marcar), sus objetivos OKR y el historial de sesiones con lo trabajado.
// Pestañas en la URL (?tab=). Cuando exista la Agenda, el historial pasará a ella.
const Plan = ({ empId }) => {
  const { data: emp, isLoading, isError, refetch } = useEmprendimiento(empId);
  const { data: resumenData } = useEmprendimientoResumen(empId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtro, setFiltro] = useState('todas');
  const tab = PESTANAS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'compromisos';
  const cambiarTab = (nueva) => setSearchParams(nueva === 'compromisos' ? {} : { tab: nueva }, { replace: true });

  if (isLoading) return <Esqueleto />;
  if (isError || !emp) return <div className={`${TARJETA_CLS} mx-auto max-w-page`}><ErrorCarga mensaje="No se pudo cargar tu plan." onReintentar={refetch} /></div>;

  const seguimientos = emp.seguimientos || [];
  const resumen = resumenData?.resumen;
  const realizadas = seguimientos.filter((s) => !esFutura(s.sesion?.fecha)).length;
  const tipos = FILTROS.find((f) => f.valor === filtro)?.tipos;
  const historial = tipos ? seguimientos.filter((s) => tipos.includes(s.sesion?.tipo)) : seguimientos;

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter grid gap-1">
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Mi plan</h1>
        <p className="text-sm text-muted-foreground">
          {emp.nombre}{emp.programa ? ` · ${emp.programa.nombre}` : ''}
        </p>
      </header>

      <div className="grid gap-4">
        <Pestanas
          idBase="plan"
          etiqueta="Secciones de mi plan"
          activa={tab}
          onCambiar={cambiarTab}
          pestanas={[
            { id: 'compromisos', label: 'Compromisos', contador: resumen?.abiertos },
            { id: 'objetivos', label: 'Objetivos' },
            { id: 'historial', label: 'Historial', contador: realizadas }
          ]}
        />

        <div role="tabpanel" id={`plan-panel-${tab}`} aria-labelledby={`plan-tab-${tab}`} tabIndex={0} className="rounded-card">
          {tab === 'compromisos' && (
            <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
              <div className="grid gap-4">
                <CompromisosAbiertos
                  key={emp.id}
                  emprendimientoId={emp.id}
                  editable
                  fechasPasadas={fechasPasadasDe(seguimientos, resumenData?.hoy)}
                  ayuda="Marca cómo va cada uno; se guarda al momento."
                />
                <CompromisosCerrados seguimientos={seguimientos} />
              </div>
              <div className="grid gap-4">
                <ProximaSesion sesion={resumenData?.proximaSesion} hoy={resumenData?.hoy} />
                <ComoFunciona />
              </div>
            </div>
          )}
          {tab === 'objetivos' && <ObjetivosOkr key={emp.id} emprendimientoId={emp.id} editable propio />}
          {tab === 'historial' && (
            <LineaSeguimiento
              seguimientos={historial}
              titulo="Historial de sesiones"
              vacio={filtro === 'todas' ? 'Aún no hay sesiones en tu programa.' : 'No hay sesiones de este tipo.'}
              accion={seguimientos.length > 0 && <Segmentado etiqueta="Tipo de sesión" opciones={FILTROS} valor={filtro} onCambiar={setFiltro} />}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const MiPlan = () => {
  const { esAdmin } = useAuth();
  const { data: emprendimientos, isLoading, isError, refetch } = useEmprendimientos({}, { enabled: !esAdmin });

  if (esAdmin) return <Navigate to="/seguimientos" replace />;
  if (isLoading) return <Esqueleto />;
  if (isError && !emprendimientos) {
    return <div className={`${TARJETA_CLS} mx-auto max-w-page`}><ErrorCarga mensaje="No se pudo cargar tu plan." onReintentar={refetch} /></div>;
  }

  const emp = emprendimientos?.[0];
  if (!emp) {
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-14 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-programa-soft text-programa-soft-foreground"><Rocket size={24} aria-hidden="true" /></span>
        <h1 className="font-display text-xl font-semibold">Aún no tienes un emprendimiento asignado</h1>
        <p className="max-w-md text-sm text-muted-foreground">Tu plan aparecerá aquí cuando el equipo técnico te sume al equipo de tu emprendimiento.</p>
      </div>
    );
  }

  return <Plan empId={String(emp.id)} />;
};

export default MiPlan;
