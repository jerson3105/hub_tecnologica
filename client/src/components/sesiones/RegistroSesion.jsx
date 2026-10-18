import { Link } from 'react-router-dom';
import { ClipboardList, Pencil } from 'lucide-react';
import Trazo from '../ui/Trazo';
import { ESTADOS_RONDA } from '../../utils/ronda';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, ACCION_CLS } from '../ui/estilosSemanticos';

// Lo registrado en la ronda, en lectura: estado de cada emprendimiento, lo trabajado y sus
// compromisos. Cada fila lleva a «Registrar ronda» en ese emprendimiento.
const RegistroSesion = ({ sesionId, emprendimientos }) => {
  const listos = emprendimientos.filter((e) => e.estado !== 'pendiente').length;
  const total = emprendimientos.length;

  return (
    <section aria-labelledby="t-registro" className={`${TARJETA_CLS} grid gap-4 p-5`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <h2 id="t-registro" className={TITULO_BLOQUE_CLS}>Registro de la ronda</h2>
          <p className="text-[13px] text-muted-foreground">{listos} de {total} registrados</p>
          <Trazo valor={total ? Math.round((listos / total) * 100) : 0} className="max-w-sm" />
        </div>
        {total > 0 && (
          <Link to={`/sesiones/${sesionId}/registro`} className={BOTON_PRIMARIO_CLS}>
            <ClipboardList size={16} aria-hidden="true" />{listos === total ? 'Revisar registro' : 'Registrar ronda'}
          </Link>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Ningún emprendimiento activo participa en esta sesión.</p>
      ) : (
        <ul className="grid gap-2">
          {emprendimientos.map((e) => {
            const estado = ESTADOS_RONDA[e.estado];
            return (
              <li key={e.id} className="grid gap-2 rounded-control border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/emprendimientos/${e.id}`} className="font-semibold hover:text-link hover:underline">{e.nombre}</Link>
                    <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>
                  </div>
                  <Link to={`/sesiones/${sesionId}/registro?emp=${e.id}`} className={ACCION_CLS} aria-label={`${e.estado === 'pendiente' ? 'Registrar' : 'Editar el registro de'} ${e.nombre}`}>
                    <Pencil size={13} aria-hidden="true" />{e.estado === 'pendiente' ? 'Registrar' : 'Editar'}
                  </Link>
                </div>
                {e.seguimiento.realizado && <p className="line-clamp-3 whitespace-pre-line text-sm">{e.seguimiento.realizado}</p>}
                {e.compromisos.length > 0 && (
                  <p className="text-[13px] text-muted-foreground">
                    Compromisos: {e.compromisos.map((c) => c.descripcion).join(' · ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RegistroSesion;
