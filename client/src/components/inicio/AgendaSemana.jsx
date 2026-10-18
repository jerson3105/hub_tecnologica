import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { tipoSesion } from '../../constants/sesiones';
import { diaAgenda } from '../../utils/inicio';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, FONDO_TONO, TONO_TIPO_SESION } from '../ui/estilosSemanticos';

// Hoy y los próximos 7 días. Los registros solo se muestran en sesiones que los llevan.
const AgendaSemana = ({ agenda = [], hoy, indice = 0 }) => (
  <section aria-labelledby="t-agenda" className={`${TARJETA_CLS} animate-enter escalonado`} style={{ '--i': indice }}>
    <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
      <h2 id="t-agenda" className={TITULO_BLOQUE_CLS}>Hoy y próximos 7 días</h2>
      <Link to="/sesiones" className="shrink-0 rounded-control text-sm font-semibold text-link hover:underline">Ver sesiones</Link>
    </div>

    {agenda.length === 0 ? (
      <div className="flex items-center gap-3 border-t border-border px-5 py-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground">
          <CalendarDays size={18} aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">No hay sesiones programadas para esta semana.</p>
      </div>
    ) : (
      <ul className="px-2 pb-2">
        {agenda.map((s) => {
          const { dia, numero, esHoy } = diaAgenda(s.fecha, hoy);
          const detalle = [
            s.programas.join(', '),
            s.registros && s.registros.total > 0 ? `registros ${s.registros.registrados} de ${s.registros.total}` : null
          ].filter(Boolean).join(' · ');
          return (
            <li key={s.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3.5 border-t border-border p-3">
              <span
                className={`grid h-13 content-center justify-items-center rounded-control ${esHoy ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                aria-hidden="true"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">{dia}</span>
                <span className="text-xl font-semibold leading-tight tabular-nums">{numero}</span>
              </span>
              <span className="grid min-w-0 gap-1">
                <span>
                  <span className={`rounded-chip px-2 py-px text-xs font-semibold ${FONDO_TONO[TONO_TIPO_SESION[s.tipo] || 'neutral']}`}>
                    {tipoSesion(s.tipo).label}
                  </span>
                </span>
                <Link to={`/sesiones/${s.id}`} className="truncate text-sm font-semibold hover:text-link hover:underline">
                  <span className="sr-only">{esHoy ? 'Hoy' : `${dia} ${numero}`}: </span>{s.titulo}
                </Link>
                {detalle && <span className="truncate text-[13px] text-muted-foreground">{detalle}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default AgendaSemana;
