import { Link } from 'react-router-dom';
import { CalendarClock, Video } from 'lucide-react';
import { tipoSesion } from '../../constants/sesiones';
import { formatFecha } from '../../utils/fechas';
import { cuandoEs } from '../../utils/programas';
import { horario, modalidadTexto } from '../../utils/sesiones';
import { TARJETA_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION, BOTON_PRIMARIO_CLS } from '../ui/estilosSemanticos';

// Próxima sesión del programa de un emprendimiento (detalle, Mi emprendimiento y Seguimiento).
// Con hora y modalidad si las tiene; si es virtual o híbrida y hay enlace, el botón «Unirse».
const ProximaSesion = ({ sesion, hoy }) => {
  const cuando = sesion ? cuandoEs(sesion.fecha, hoy) : null;
  const enLinea = sesion && ['virtual', 'hibrida'].includes(sesion.modalidad) && /^https?:\/\//i.test(sesion.enlace_reunion || '');
  return (
    <section aria-labelledby="t-proxima" className={`${TARJETA_CLS} grid gap-2 p-5`}>
      <h2 id="t-proxima" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <CalendarClock size={16} aria-hidden="true" />Próxima sesión
      </h2>
      {sesion ? (
        <>
          <span className={`${CHIP_CLS} w-fit ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo] || 'neutral']}`}>{tipoSesion(sesion.tipo).label}</span>
          <Link to={`/sesiones/${sesion.id}`} className="font-semibold leading-snug hover:text-link hover:underline">{sesion.titulo}</Link>
          <span className="block text-[13px] text-muted-foreground first-letter:uppercase">
            {['Hoy', 'Mañana'].includes(cuando) && `${cuando} · `}
            {formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
            {horario(sesion) && ` · ${horario(sesion)}`}
          </span>
          {modalidadTexto(sesion) && <span className="text-[13px] text-muted-foreground">{modalidadTexto(sesion)}</span>}
          {enLinea && (
            <a href={sesion.enlace_reunion} target="_blank" rel="noopener noreferrer" className={`${BOTON_PRIMARIO_CLS} mt-1 w-fit`}>
              <Video size={16} aria-hidden="true" />Unirse<span className="sr-only"> a {sesion.titulo} (se abre en otra pestaña)</span>
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No hay sesiones programadas en su programa.</p>
      )}
    </section>
  );
};

export default ProximaSesion;
