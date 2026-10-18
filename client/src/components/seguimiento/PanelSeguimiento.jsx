import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ExternalLink } from 'lucide-react';
import { useEmprendimiento, useEmprendimientoResumen } from '../../hooks/useQueryHooks';
import TarjetaKpi from '../inicio/TarjetaKpi';
import LineaSeguimiento from '../emprendimientos/LineaSeguimiento';
import ProximaSesion from '../emprendimientos/ProximaSesion';
import CompromisosAbiertos from './CompromisosAbiertos';
import ObjetivosOkr from './ObjetivosOkr';
import Pestanas from '../ui/Pestanas';
import Skeleton from '../ui/Skeleton';
import ErrorCarga from '../ui/ErrorCarga';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../ui/estilosSemanticos';
import { TIPOS_CON_REGISTRO } from '../../constants/sesiones';
import { esFutura } from '../../utils/fechas';
import { haceDias } from '../../utils/inicio';

const tieneTexto = (v) => typeof v === 'string' && v.trim().length > 0;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Lo que conviene tener a mano antes de una reunión con el emprendimiento
const indicadoresDe = (r) => [
  { titulo: 'Avance OKR', valor: r.okr, sufijo: '%', nota: r.okr === null ? 'Sin objetivos activos' : 'Media de sus actividades' },
  {
    titulo: 'Compromisos', valor: r.abiertos,
    nota: r.vencidos > 0 ? plural(r.vencidos, 'vencido', 'vencidos') : 'Ninguno vencido',
    tonoNota: r.vencidos > 0 ? 'danger' : 'success'
  },
  { titulo: 'Cumplidos', valor: r.compromisosCumplidos, sufijo: '%', nota: r.compromisosTotales ? `De ${plural(r.compromisosTotales, 'compromiso', 'compromisos')}` : 'Aún sin compromisos' },
  { titulo: 'Asistencia', valor: r.asistencia, sufijo: '%', nota: r.asistencia === null ? 'Aún sin asistencia tomada' : 'Sesiones con algún integrante' }
];

// Panel derecho de Seguimiento: el emprendimiento elegido con sus compromisos, su línea y sus OKR
const PanelSeguimiento = ({ emprendimientoId, tab, onTab, onVolver }) => {
  const { data: emp, isLoading, isError, refetch } = useEmprendimiento(emprendimientoId);
  const { data: resumenData } = useEmprendimientoResumen(emprendimientoId);

  if (isLoading) {
    return (
      <div className="grid gap-4" role="status" aria-label="Cargando el emprendimiento">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (isError || !emp) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar el emprendimiento." onReintentar={refetch} /></div>;

  const resumen = resumenData?.resumen;
  const seguimientos = emp.seguimientos || [];
  const enlaceRegistro = (seg) => `/sesiones/${seg.sesion.id}/registro?emp=${emp.id}`;
  // La sesión ya ocurrida más reciente que lleva registro y aún no lo tiene: lo primero por hacer
  const porRegistrar = seguimientos.find((s) => s.sesion && !esFutura(s.sesion.fecha)
    && TIPOS_CON_REGISTRO.includes(s.sesion.tipo) && !tieneTexto(s.realizado));
  const ultimaReunion = seguimientos.filter((s) => !esFutura(s.sesion?.fecha) && tieneTexto(s.realizado));
  const lider = emp.integrantes?.find((i) => i.es_lider)?.usuario;
  const meta = [
    emp.programa?.nombre,
    emp.sector,
    lider && `Líder: ${lider.nombre} ${lider.apellido || ''}`.trim(),
    resumen && (resumen.ultimaReunion ? `Última reunión ${haceDias(resumen.diasSinReunion)}` : 'Sin reuniones registradas')
  ].filter(Boolean);

  return (
    <div className="grid gap-4">
      <button type="button" onClick={onVolver} className="inline-flex w-fit items-center gap-1.5 rounded-control text-sm text-muted-foreground hover:text-link lg:hidden">
        <ArrowLeft size={15} aria-hidden="true" />Cartera
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight">{emp.nombre}</h2>
          <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/emprendimientos/${emp.id}`} className={BOTON_SECUNDARIO_CLS}>
            <ExternalLink size={16} aria-hidden="true" />Ficha
          </Link>
          {porRegistrar && (
            <Link to={enlaceRegistro(porRegistrar)} className={BOTON_PRIMARIO_CLS}>
              <ClipboardList size={16} aria-hidden="true" />Registrar {porRegistrar.sesion.titulo}
            </Link>
          )}
        </div>
      </div>

      {resumen
        ? <dl className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{indicadoresDe(resumen).map((k, i) => <TarjetaKpi key={k.titulo} {...k} indice={i} />)}</dl>
        : <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>}

      <Pestanas
        idBase="seg"
        etiqueta={`Seguimiento de ${emp.nombre}`}
        activa={tab}
        onCambiar={onTab}
        pestanas={[
          { id: 'resumen', label: 'Preparar' },
          { id: 'linea', label: 'Línea', contador: ultimaReunion.length || undefined },
          { id: 'objetivos', label: 'Objetivos' }
        ]}
      />
      <div role="tabpanel" id={`seg-panel-${tab}`} aria-labelledby={`seg-tab-${tab}`} tabIndex={0} className="rounded-card">
        {tab === 'resumen' && (
          <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
            <CompromisosAbiertos key={emp.id} emprendimientoId={emp.id} editable />
            <div className="grid gap-4">
              <ProximaSesion sesion={resumenData?.proximaSesion} hoy={resumenData?.hoy} />
              <LineaSeguimiento
                seguimientos={ultimaReunion}
                limite={1}
                titulo="Última reunión"
                vacio="Aún no hay reuniones registradas."
                enlaceRegistro={enlaceRegistro}
              />
            </div>
          </div>
        )}
        {tab === 'linea' && <LineaSeguimiento seguimientos={seguimientos} enlaceRegistro={enlaceRegistro} />}
        {tab === 'objetivos' && <ObjetivosOkr key={emp.id} emprendimientoId={emp.id} editable />}
      </div>
    </div>
  );
};

export default PanelSeguimiento;
