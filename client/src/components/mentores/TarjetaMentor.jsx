import { Linkedin, CalendarPlus } from 'lucide-react';
import FotoMentor from './FotoMentor';
import { CHIP_CLS, FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';
import { listaDe } from '../../constants/mentores';

const ENLACE_AGENDA_CLS = 'relative z-10 inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-control bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover';

// Tarjeta de la red de mentores. Toda la tarjeta abre la ficha (el botón es el nombre; su
// ::after la cubre); LinkedIn y Agendar quedan por encima y funcionan por separado.
const TarjetaMentor = ({ mentor: m, onAbrir, indice = 0 }) => {
  const nombre = `${m.nombre} ${m.apellido}`;
  const temas = listaDe(m.sesiones);
  const sectores = listaDe(m.startups);

  return (
    <li
      className={`relative flex flex-col gap-3 rounded-card border border-border bg-card p-4 text-card-foreground elevation-1 transition-shadow hover:elevation-2 animate-enter escalonado ${m.activo ? '' : 'opacity-75'}`}
      style={{ '--i': Math.min(indice, 8) }}
    >
      <div className="flex items-start gap-3">
        <FotoMentor mentor={m} />
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-lg font-semibold leading-snug">
            <button type="button" onClick={() => onAbrir(m.id)} aria-haspopup="dialog" className="text-left after:absolute after:inset-0 after:rounded-card after:content-[''] hover:text-link">
              {nombre}
            </button>
            {!m.activo && <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Inactivo</span>}
          </h2>
          {sectores.length > 0 && (
            <p className="truncate text-[13px] text-muted-foreground">
              {sectores.slice(0, 3).join(' · ')}{sectores.length > 3 ? ` · +${sectores.length - 3}` : ''}
            </p>
          )}
        </div>
      </div>

      {m.biografia && <p className="line-clamp-3 text-sm text-muted-foreground">{m.biografia}</p>}

      {temas.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
          {temas.slice(0, 4).map((t) => <li key={t} className={`${CHIP_CLS} ${FONDO_TONO.info}`}>{t}</li>)}
          {temas.length > 4 && <li className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>+{temas.length - 4}</li>}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-end gap-1 pt-1">
        {/^https?:\/\//i.test(m.linkedin || '') && (
          <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className={`${iconoBotonCls()} z-10`} title="LinkedIn">
            <Linkedin size={16} aria-hidden="true" />
            <span className="sr-only">LinkedIn de {nombre} (se abre en otra pestaña)</span>
          </a>
        )}
        {m.activo && /^https?:\/\//i.test(m.calendly || '') && (
          <a href={m.calendly} target="_blank" rel="noopener noreferrer" className={ENLACE_AGENDA_CLS}>
            <CalendarPlus size={15} aria-hidden="true" />Agendar
            <span className="sr-only"> con {nombre} (se abre en otra pestaña)</span>
          </a>
        )}
      </div>
    </li>
  );
};

export default TarjetaMentor;
