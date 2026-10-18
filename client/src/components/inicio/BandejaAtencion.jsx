import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { asuntoDe } from '../../utils/inicio';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, ACCION_CLS, FONDO_TONO } from './estilosInicio';

// «Requiere tu atención»: cada asunto dice qué pasa, dónde y lleva a donde se resuelve
const BandejaAtencion = ({ atencion = [], indice = 0 }) => {
  const asuntos = atencion.map(asuntoDe).filter(Boolean);

  return (
    <section aria-labelledby="t-atencion" className={`${TARJETA_CLS} animate-enter escalonado`} style={{ '--i': indice }}>
      <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
        <h2 id="t-atencion" className={TITULO_BLOQUE_CLS}>Requiere tu atención</h2>
        {asuntos.length > 0 && (
          <span className="text-[13px] tabular-nums text-muted-foreground">
            {asuntos.length === 1 ? '1 asunto' : `${asuntos.length} asuntos`}
          </span>
        )}
      </div>

      {asuntos.length === 0 ? (
        <div className="flex items-center gap-3 border-t border-border px-5 py-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-success-soft text-success-soft-foreground">
            <CheckCircle2 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Todo al día</p>
            <p className="text-[13px] text-muted-foreground">No hay registros, asistencias, BMC ni compromisos pendientes.</p>
          </div>
        </div>
      ) : (
        <ul className="px-2 pb-2">
          {asuntos.map((a) => {
            const Icono = a.icono;
            const contenidoAccion = <>{a.accion}<ChevronRight size={14} aria-hidden="true" /></>;
            return (
              <li key={a.titulo} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-3 py-2.5">
                <span className={`grid size-9 place-items-center rounded-control ${FONDO_TONO[a.tono]}`}>
                  <Icono size={16} aria-hidden="true" />
                </span>
                <span className="grid min-w-0">
                  <span className="text-sm font-semibold">{a.titulo}</span>
                  {a.detalle && <span className="line-clamp-2 text-[13px] text-muted-foreground">{a.detalle}</span>}
                </span>
                {a.href ? (
                  <a href={a.href} className={ACCION_CLS} aria-label={`${a.accion}: ${a.titulo}`}>{contenidoAccion}</a>
                ) : (
                  <Link to={a.to} className={ACCION_CLS} aria-label={`${a.accion}: ${a.titulo}`}>{contenidoAccion}</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default BandejaAtencion;
