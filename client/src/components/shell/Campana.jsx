import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, CheckCircle2 } from 'lucide-react';
import usePopover from './usePopover';
import Skeleton from '../ui/Skeleton';
import { FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';

// Campana: cuántos asuntos piden atención y un panel con cada uno y su enlace. El icono se
// balancea una sola vez cuando el número sube (nunca en bucle).
const Campana = ({ asuntos, cargando, enlaceTodo }) => {
  const { abierto, alternar, cerrar, contenedorRef, botonRef } = usePopover();
  const total = asuntos.length;
  // Total del render anterior (patrón de React para reaccionar a un cambio sin efecto)
  const [previo, setPrevio] = useState(total);
  const [balanceo, setBalanceo] = useState(0);
  if (total !== previo) {
    setPrevio(total);
    if (total > previo) setBalanceo((b) => b + 1);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        aria-controls="panel-avisos"
        className={iconoBotonCls()}
        title="Avisos"
      >
        <Bell key={balanceo} size={20} aria-hidden="true" className={balanceo ? 'origin-top animate-balanceo' : ''} />
        <span className="sr-only">{total ? `Avisos: ${total} ${total === 1 ? 'asunto pendiente' : 'asuntos pendientes'}` : 'Avisos: nada pendiente'}</span>
        {total > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-danger-solid px-1 text-[10px] font-semibold leading-[18px] text-danger-solid-foreground tabular-nums" aria-hidden="true">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {abierto && (
        <section
          id="panel-avisos"
          aria-labelledby="t-avisos"
          className="animate-pop fixed inset-x-3 top-[3.75rem] z-50 overflow-hidden rounded-card border border-border bg-popover text-popover-foreground elevation-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[25rem]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 id="t-avisos" className="text-base font-semibold">Requiere tu atención</h2>
            {total > 0 && <span className="text-[13px] tabular-nums text-muted-foreground">{total === 1 ? '1 asunto' : `${total} asuntos`}</span>}
          </div>
          {cargando ? (
            <div className="grid gap-2 p-3" role="status" aria-label="Cargando avisos">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : total === 0 ? (
            <div className="flex items-center gap-3 px-4 py-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-control bg-success-soft text-success-soft-foreground"><CheckCircle2 size={18} aria-hidden="true" /></span>
              <p className="text-sm"><span className="font-semibold">Todo al día.</span> <span className="text-muted-foreground">No hay nada pendiente.</span></p>
            </div>
          ) : (
            <ul className="grid max-h-[min(24rem,calc(100dvh-10rem))] gap-0.5 overflow-y-auto overscroll-contain p-1.5">
              {asuntos.map((a) => {
                const Icono = a.icono;
                return (
                  <li key={a.titulo}>
                    <Link to={a.to} onClick={cerrar} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-control p-2.5 transition-colors hover:bg-muted">
                      <span className={`grid size-9 place-items-center rounded-control ${FONDO_TONO[a.tono] || FONDO_TONO.neutral}`}><Icono size={16} aria-hidden="true" /></span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="text-sm font-semibold">{a.titulo}</span>
                        {a.detalle && <span className="truncate text-xs text-muted-foreground">{a.detalle}</span>}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-link">{a.accion}<ChevronRight size={14} aria-hidden="true" /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {enlaceTodo && (
            <div className="flex justify-center border-t border-border p-2">
              <Link to={enlaceTodo.to} onClick={cerrar} className="rounded-control px-3 py-1.5 text-sm font-semibold text-link hover:bg-info-soft">{enlaceTodo.texto}</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Campana;
