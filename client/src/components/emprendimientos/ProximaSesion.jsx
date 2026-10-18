import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { tipoSesion } from '../../constants/sesiones';
import { formatFecha } from '../../utils/fechas';
import { cuandoEs } from '../../utils/programas';
import { TARJETA_CLS, CHIP_CLS, FONDO_TONO, TONO_TIPO_SESION } from '../ui/estilosSemanticos';

// Próxima sesión del programa de un emprendimiento (detalle y Seguimiento)
const ProximaSesion = ({ sesion, hoy }) => (
  <section aria-labelledby="t-proxima" className={`${TARJETA_CLS} grid gap-2 p-5`}>
    <h2 id="t-proxima" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <CalendarClock size={16} aria-hidden="true" />Próxima sesión
    </h2>
    {sesion ? (
      <>
        <span className={`${CHIP_CLS} w-fit ${FONDO_TONO[TONO_TIPO_SESION[sesion.tipo] || 'neutral']}`}>{tipoSesion(sesion.tipo).label}</span>
        <Link to={`/sesiones/${sesion.id}`} className="font-semibold leading-snug hover:text-link hover:underline">{sesion.titulo}</Link>
        <span className="block text-[13px] text-muted-foreground first-letter:uppercase">
          {['Hoy', 'Mañana'].includes(cuandoEs(sesion.fecha, hoy)) && `${cuandoEs(sesion.fecha, hoy)} · `}
          {formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </>
    ) : (
      <p className="text-sm text-muted-foreground">No hay sesiones programadas en su programa.</p>
    )}
  </section>
);

export default ProximaSesion;
