import { Link } from 'react-router-dom';
import { Pencil, Archive, RotateCcw, CalendarClock } from 'lucide-react';
import Trazo from '../ui/Trazo';
import { TARJETA_CLS, CHIP_CLS, FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';
import { formatoDecimal } from '../../utils/inicio';
import { rangoFechas, textoPeriodo, estadoPrograma, estadoSugerido, avisosDe, cuandoEs } from '../../utils/programas';

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const Dato = ({ etiqueta, valor, detalle }) => (
  <div className="grid gap-0.5">
    <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
    <dd className="text-lg font-semibold leading-tight tabular-nums">
      {valor}{detalle && <span className="text-sm font-normal text-muted-foreground"> {detalle}</span>}
    </dd>
  </div>
);

// Tarjeta del listado: dónde está el programa en su calendario, cómo va y qué viene.
// El nombre es un enlace que cubre toda la tarjeta; los botones quedan por encima.
const TarjetaPrograma = ({ programa, hoy, indice = 0, onEditar, onCambiarActivo, onCorregirEstado }) => {
  const estado = estadoPrograma(programa.estado);
  const sugerencia = estadoSugerido(programa);
  const { kpis, periodo, proximaSesion } = programa;
  const avisos = avisosDe(kpis);
  const inactivo = programa.activo === false;

  return (
    <li
      className={`${TARJETA_CLS} animate-enter escalonado relative flex flex-col transition-shadow hover:elevation-2 ${inactivo ? 'opacity-75' : ''}`}
      style={{ '--i': indice }}
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>
            {inactivo && <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Desactivado</span>}
          </div>
          <div className="relative z-10 -mr-2 -mt-2 flex">
            <button type="button" onClick={() => onEditar(programa)} className={iconoBotonCls()} aria-label={`Editar ${programa.nombre}`} title="Editar">
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onCambiarActivo(programa)}
              className={iconoBotonCls(inactivo ? 'success' : 'danger')}
              aria-label={`${inactivo ? 'Reactivar' : 'Desactivar'} ${programa.nombre}`}
              title={inactivo ? 'Reactivar' : 'Desactivar'}
            >
              {inactivo ? <RotateCcw size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="grid gap-1">
          <h2 className="font-display text-xl font-semibold leading-snug">
            <Link to={`/programas/${programa.id}`} className="after:absolute after:inset-0 after:rounded-card hover:text-link">
              {programa.nombre}
            </Link>
          </h2>
          {programa.descripcion && <p className="line-clamp-2 text-sm text-muted-foreground">{programa.descripcion}</p>}
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="font-medium">{textoPeriodo(periodo)}</span>
            {periodo && <span className="tabular-nums text-muted-foreground">{periodo.porcentaje} %</span>}
          </div>
          {periodo && <Trazo valor={periodo.porcentaje} completo={periodo.fase === 'terminado'} retraso={0.4} />}
          <p className="text-[13px] text-muted-foreground">
            {rangoFechas(programa.fecha_inicio, programa.fecha_fin)} · seguimiento {programa.frecuencia_seguimiento}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Dato etiqueta="Emprendimientos" valor={kpis.emprendimientosActivos} detalle={kpis.emprendimientosActivos === 1 ? 'activo' : 'activos'} />
          <Dato etiqueta="Sesiones" valor={kpis.sesionesRealizadas} detalle={`de ${kpis.sesionesTotales}`} />
          <Dato etiqueta="NPS" valor={formatoDecimal(kpis.npsPromedio)} />
        </dl>

        <div className="mt-auto grid gap-2">
          <p className="flex items-center gap-2 text-[13px]">
            <CalendarClock size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            {proximaSesion ? (
              <span className="min-w-0 truncate">
                <span className="font-semibold">{mayuscula(cuandoEs(proximaSesion.fecha, hoy))}</span>
                <span className="text-muted-foreground"> · {proximaSesion.titulo}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sin sesiones programadas</span>
            )}
          </p>
          {avisos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {avisos.map((a) => <span key={a.texto} className={`${CHIP_CLS} ${FONDO_TONO[a.tono]}`}>{a.texto}</span>)}
            </div>
          )}
        </div>
      </div>

      {sugerencia && (
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-b-card border-t border-border bg-info-soft/60 px-5 py-2.5 text-[13px]">
          <span className="text-info-soft-foreground">{sugerencia.texto}</span>
          <button type="button" onClick={() => onCorregirEstado(programa, sugerencia.estado)} className="min-h-9 rounded-control px-2 font-semibold text-link hover:bg-info-soft">
            {sugerencia.accion}
          </button>
        </div>
      )}
    </li>
  );
};

export default TarjetaPrograma;
