import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { tipoSesion } from '../../constants/sesiones';
import { parseFecha } from '../../utils/fechas';
import { enlaceSeguimiento, formatoDecimal } from '../../utils/inicio';
import { mesCorto } from '../../utils/programas';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION, ACCION_CLS } from '../ui/estilosSemanticos';

const Fecha = ({ fecha, resaltada }) => (
  <span
    aria-hidden="true"
    className={`grid h-13 content-center justify-items-center rounded-control ${resaltada ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
  >
    <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">{mesCorto(fecha)}</span>
    <span className="text-xl font-semibold leading-tight tabular-nums">{parseFecha(fecha)?.getDate()}</span>
  </span>
);

// Una sesión con lo que falta hacer en ella: registrar lo trabajado o tomar asistencia
const FilaSesion = ({ sesion, programaId }) => {
  const pasada = sesion.momento === 'pasada';
  const pendientes = sesion.registros ? sesion.registros.total - sesion.registros.registrados : 0;
  const meta = [
    sesion.registros && sesion.registros.total > 0 && {
      texto: `registros ${sesion.registros.registrados} de ${sesion.registros.total}`,
      aviso: pasada && pendientes > 0
    },
    sesion.asistencia !== null && { texto: `asistencia ${sesion.asistencia} %` },
    sesion.nps && { texto: `NPS ${formatoDecimal(sesion.nps.promedio)}` }
  ].filter(Boolean);

  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3.5 border-t border-border p-3 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center">
      <Fecha fecha={sesion.fecha} resaltada={sesion.momento === 'hoy'} />
      <span className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo] || 'neutral']}`}>{tipoSesion(sesion.tipo).label}</span>
          {sesion.momento === 'hoy' && <span className={`${CHIP_CLS} ${FONDO_TONO.info}`}>Hoy</span>}
        </span>
        <Link to={`/sesiones/${sesion.id}`} className="truncate text-sm font-semibold hover:text-link hover:underline">{sesion.titulo}</Link>
        {meta.length > 0 && (
          <span className="text-[13px] text-muted-foreground">
            {meta.map((m, i) => (
              <span key={m.texto}>
                {i > 0 && ' · '}
                <span className={m.aviso ? 'font-medium text-warning' : ''}>{m.texto}</span>
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="col-start-2 flex flex-wrap gap-1 sm:col-start-3 sm:justify-end">
        {pasada && pendientes > 0 && (
          <Link to={enlaceSeguimiento({ programaId, tipo: sesion.tipo })} className={ACCION_CLS} aria-label={`Registrar ${sesion.titulo}`}>
            Registrar<ChevronRight size={14} aria-hidden="true" />
          </Link>
        )}
        {pasada && sesion.asistencia === null && (
          <Link to={`/asistencias?sesion=${sesion.id}`} className={ACCION_CLS} aria-label={`Tomar asistencia de ${sesion.titulo}`}>
            Tomar asistencia<ChevronRight size={14} aria-hidden="true" />
          </Link>
        )}
      </span>
    </li>
  );
};

const Grupo = ({ id, titulo, sesiones, programaId, vacio }) => (
  <section aria-labelledby={id} className={TARJETA_CLS}>
    <div className="flex items-baseline justify-between gap-2 px-5 pb-2 pt-4">
      <h2 id={id} className={TITULO_BLOQUE_CLS}>{titulo}</h2>
      <span className="text-[13px] tabular-nums text-muted-foreground">{sesiones.length}</span>
    </div>
    {sesiones.length === 0 ? (
      <p className="border-t border-border px-5 py-5 text-sm text-muted-foreground">{vacio}</p>
    ) : (
      <ul className="px-2 pb-2">
        {sesiones.map((s) => <FilaSesion key={s.id} sesion={s} programaId={programaId} />)}
      </ul>
    )}
  </section>
);

// Sesiones del programa: las próximas en orden y las realizadas de la más reciente a la más antigua
const SesionesPrograma = ({ sesiones, programaId, nuevaSesion }) => {
  if (sesiones.length === 0) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-10 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground">
          <CalendarDays size={24} aria-hidden="true" />
        </span>
        <p className="font-semibold">Este programa aún no tiene sesiones</p>
        {nuevaSesion}
      </div>
    );
  }
  const proximas = sesiones.filter((s) => s.momento !== 'pasada');
  const realizadas = sesiones.filter((s) => s.momento === 'pasada').reverse();
  return (
    <div className="grid gap-4 lg:gap-6">
      <Grupo id="t-proximas" titulo="Próximas" sesiones={proximas} programaId={programaId} vacio="No hay sesiones programadas." />
      <Grupo id="t-realizadas" titulo="Realizadas" sesiones={realizadas} programaId={programaId} vacio="Aún no se ha realizado ninguna sesión." />
    </div>
  );
};

export default SesionesPrograma;
