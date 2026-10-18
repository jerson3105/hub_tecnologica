import { Link } from 'react-router-dom';
import { Video, ClipboardList } from 'lucide-react';
import ListaCompromisos from '../ListaCompromisos';
import BadgeDe from '../ui/BadgeDe';
import { tipoSesion } from '../../constants/sesiones';
import { ESTADOS_AVANCE } from '../../constants/estados';
import { esFutura, formatFecha } from '../../utils/fechas';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION } from '../ui/estilosSemanticos';

const tieneTexto = (v) => typeof v === 'string' && v.trim().length > 0;
const conRegistro = (s) => tieneTexto(s.realizado) || tieneTexto(s.observaciones) || (s.compromisoItems?.length || 0) > 0;

const Chip = ({ tono, children }) => <span className={`${CHIP_CLS} ${FONDO_TONO[tono]}`}>{children}</span>;

// Un tramo de «la línea»: trazo sólido cian en lo realizado y discontinuo en lo programado.
// El nodo es lleno si la sesión tiene registro y hueco si falta.
const Tramo = ({ seg, programada, ultimo }) => {
  const registrado = conRegistro(seg);
  const tipo = seg.sesion?.tipo;
  return (
    <li className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
      {!ultimo && (
        <span
          aria-hidden="true"
          className={`absolute left-[11px] top-5 bottom-0 w-0 border-l-2 ${programada ? 'border-dashed border-border' : 'border-trazo'}`}
        />
      )}
      <span
        aria-hidden="true"
        className={`relative z-[1] mt-1.5 size-3.5 justify-self-center rounded-full border-2 ${
          programada ? 'border-dashed border-input bg-card' : registrado ? 'border-trazo bg-trazo' : 'border-warning-solid bg-card'
        }`}
      />
      <article className={`grid gap-2 rounded-card border border-border p-4 ${programada ? 'bg-transparent' : 'bg-card'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {tipo && <Chip tono={TONO_TIPO_SESION[tipo] || 'neutral'}>{tipoSesion(tipo).label}</Chip>}
          <span className="text-[13px] tabular-nums text-muted-foreground">
            {seg.sesion?.fecha ? formatFecha(seg.sesion.fecha, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : formatFecha(seg.created_at)}
          </span>
          {programada
            ? <Chip tono="neutral">Programada</Chip>
            : registrado
              ? seg.estado_avance && seg.estado_avance !== 'sin_iniciar' && <BadgeDe mapa={ESTADOS_AVANCE} valor={seg.estado_avance} forma="tag" />
              : <Chip tono="warning">Sin registro</Chip>}
        </div>
        {seg.sesion ? (
          <h3 className="font-semibold leading-snug">
            <Link to={`/sesiones/${seg.sesion.id}`} className="hover:text-link hover:underline">{seg.sesion.titulo}</Link>
          </h3>
        ) : null}
        {tieneTexto(seg.realizado) && <p className="whitespace-pre-line text-sm">{seg.realizado}</p>}
        <ListaCompromisos seguimiento={seg} />
        {tieneTexto(seg.observaciones) && (
          <div>
            <p className="eyebrow">Observaciones</p>
            <p className="mt-0.5 whitespace-pre-line text-sm">{seg.observaciones}</p>
          </div>
        )}
        {seg.enlace_grabacion && (
          <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-link hover:underline">
            <Video size={14} aria-hidden="true" />Grabación de la reunión
          </a>
        )}
      </article>
    </li>
  );
};

// Historial de seguimiento: las programadas arriba (en orden) y lo realizado de lo más reciente
// a lo más antiguo. `accion` es el enlace para registrar (solo equipo técnico).
const LineaSeguimiento = ({ seguimientos = [], accion = null, limite = null, titulo = 'Seguimiento', vacio = 'Aún no hay sesiones en su programa.' }) => {
  const programadas = seguimientos.filter((s) => esFutura(s.sesion?.fecha)).reverse();
  const realizadas = seguimientos.filter((s) => !esFutura(s.sesion?.fecha));
  const visibles = limite ? realizadas.slice(0, limite) : realizadas;

  return (
    <section aria-labelledby="t-linea" className={`${TARJETA_CLS} grid gap-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="t-linea" className={TITULO_BLOQUE_CLS}>{titulo}</h2>
        {accion}
      </div>
      {seguimientos.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><ClipboardList size={18} aria-hidden="true" /></span>
          <p className="text-sm text-muted-foreground">{vacio}</p>
        </div>
      ) : (
        <>
          {!limite && programadas.length > 0 && (
            <div className="grid gap-3">
              <h3 className="eyebrow">Programadas</h3>
              <ol>{programadas.map((s, i) => <Tramo key={s.id ?? `p-${s.sesion?.id}`} seg={s} programada ultimo={i === programadas.length - 1} />)}</ol>
            </div>
          )}
          <div className="grid gap-3">
            {!limite && programadas.length > 0 && <h3 className="eyebrow">Realizadas</h3>}
            {visibles.length === 0
              ? <p className="text-sm text-muted-foreground">Aún no se ha realizado ninguna sesión.</p>
              : <ol>{visibles.map((s, i) => <Tramo key={s.id ?? `r-${s.sesion?.id}`} seg={s} ultimo={i === visibles.length - 1} />)}</ol>}
          </div>
        </>
      )}
    </section>
  );
};

export default LineaSeguimiento;
