import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { tipoSesion, TIPOS_CON_REGISTRO } from '../../constants/sesiones';
import { formatFecha, parseFecha } from '../../utils/fechas';
import { horario, modalidadTexto, pendientesDe } from '../../utils/sesiones';
import { mesCorto } from '../../utils/programas';
import { formatoDecimal } from '../../utils/inicio';
import { CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION, ACCION_CLS, iconoBotonCls } from '../ui/estilosSemanticos';

const Estado = ({ aviso, children }) => (
  <span className={aviso ? 'font-medium text-warning' : ''}>{children}</span>
);

// Una sesión del listado: cuándo, qué, dónde, cómo va (equipo técnico) o si falta evaluarla
// (emprendedor), y la acción que toca ahora mismo.
const FilaSesion = ({ sesion: s, esAdmin, onEditar, onEliminar }) => {
  const esHoy = s.momento === 'hoy';
  const ocurrida = s.momento !== 'proxima';
  const conRegistro = TIPOS_CON_REGISTRO.includes(s.tipo);
  const pendientes = pendientesDe(s);
  const lugarYHora = [
    formatFecha(s.fecha, { weekday: 'short', day: 'numeric', month: 'short' }),
    horario(s),
    modalidadTexto(s)
  ].filter(Boolean).join(' · ');

  const estado = esAdmin
    ? (ocurrida
      ? [
        s.registros && <Estado key="r" aviso={pendientes.registros > 0}>Registros {s.registros.registrados} de {s.registros.total}</Estado>,
        s.asistencia
          ? <Estado key="a">Asistencia {s.asistencia.presentes} de {s.asistencia.total}</Estado>
          : s.participantes > 0 && <Estado key="a" aviso>Sin asistencia</Estado>,
        s.nps && <Estado key="n">NPS {formatoDecimal(s.nps.promedio)} ({s.nps.total})</Estado>
      ]
      : [s.participantes > 0 && <span key="p">{s.participantes === 1 ? '1 emprendimiento' : `${s.participantes} emprendimientos`}</span>]
    ).filter(Boolean)
    : [];

  const acciones = [];
  if (esAdmin && ocurrida && conRegistro && pendientes.registros > 0) {
    acciones.push(<Link key="reg" to={`/sesiones/${s.id}/registro`} className={ACCION_CLS}>Registrar<ChevronRight size={14} aria-hidden="true" /></Link>);
  }
  if (esAdmin && ocurrida && !conRegistro && !s.asistencia && s.participantes > 0) {
    acciones.push(<Link key="asi" to={`/sesiones/${s.id}?tab=asistencia`} className={ACCION_CLS}>Tomar asistencia<ChevronRight size={14} aria-hidden="true" /></Link>);
  }
  if (!esAdmin && s.evaluacion === 'pendiente') {
    acciones.push(<Link key="eva" to={`/sesiones/${s.id}?tab=evaluacion`} className={ACCION_CLS}>Evaluar<ChevronRight size={14} aria-hidden="true" /></Link>);
  }
  if (s.enlace_reunion && s.momento !== 'pasada') {
    acciones.push(
      <a key="unirse" href={s.enlace_reunion} target="_blank" rel="noopener noreferrer" className={ACCION_CLS} aria-label={`Unirse a ${s.titulo} (se abre en otra pestaña)`}>
        Unirse<ExternalLink size={13} aria-hidden="true" />
      </a>
    );
  }

  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3.5 gap-y-2 border-t border-border p-3 @3xl:grid-cols-[3.25rem_minmax(0,1fr)_auto] @3xl:items-center">
      <span
        aria-hidden="true"
        className={`row-span-2 grid h-13 content-center justify-items-center self-start rounded-control @3xl:row-span-1 @3xl:self-center ${esHoy ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">{esHoy ? 'Hoy' : mesCorto(s.fecha)}</span>
        <span className="text-xl font-semibold leading-tight tabular-nums">{parseFecha(s.fecha)?.getDate()}</span>
      </span>

      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_TIPO_SESION[s.tipo] || 'neutral']}`}>{tipoSesion(s.tipo).label}</span>
          {!esAdmin && s.evaluacion === 'pendiente' && <span className={`${CHIP_CLS} ${FONDO_TONO.warning}`}>Por evaluar</span>}
          {!esAdmin && s.evaluacion === 'hecha' && <span className={`${CHIP_CLS} ${FONDO_TONO.success}`}>Evaluada</span>}
        </div>
        <Link to={`/sesiones/${s.id}`} className="w-fit max-w-full truncate font-semibold hover:text-link hover:underline">{s.titulo}</Link>
        <p className="text-[13px] text-muted-foreground first-letter:uppercase">
          {lugarYHora}{s.programas?.length > 0 && <> · {s.programas.map((p) => p.nombre).join(', ')}</>}
        </p>
        {estado.length > 0 && (
          <p className="text-[13px] text-muted-foreground">
            {estado.map((e, i) => <span key={i}>{i > 0 && ' · '}{e}</span>)}
          </p>
        )}
      </div>

      {(acciones.length > 0 || esAdmin) && (
        <div className="col-start-2 flex flex-wrap items-center gap-1 @3xl:col-start-3 @3xl:justify-end">
          {acciones}
          {esAdmin && (
            <>
              <button type="button" onClick={() => onEditar(s)} className={iconoBotonCls()} aria-label={`Editar ${s.titulo}`} title="Editar">
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onEliminar(s)} className={iconoBotonCls('danger')} aria-label={`Eliminar ${s.titulo}`} title="Eliminar">
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
};

export default FilaSesion;
