import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OpcionesRadio from '../ui/OpcionesRadio';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { useCompromisosPendientes } from '../../hooks/useQueryHooks';
import { formatFecha, esFutura } from '../../utils/fechas';
import { OPCIONES_REVISION } from '../../utils/ronda';
import { vencidoDe } from '../../utils/compromisos';
import { estadoDe, ESTADOS_ACTIVIDAD } from '../../constants/estados';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';

const CERRADOS = ['completado', 'no_logrado'];
const OPCIONES = OPCIONES_REVISION.map((o) => ({ ...o, tono: o.valor === 'completado' ? 'success' : 'info' }));

// Compromisos abiertos del emprendimiento (de todas sus reuniones). El estado se guarda al
// elegirlo; los que se cierran siguen a la vista con «Deshacer» hasta la próxima visita.
// `fechasPasadas` (utils/compromisos fechasPasadasDe) marca los vencidos; `ayuda`, texto bajo el título.
const CompromisosAbiertos = ({ emprendimientoId, editable = false, fechasPasadas = null, ayuda = null }) => {
  const queryClient = useQueryClient();
  const { data: compromisos = [], isLoading, isError, refetch } = useCompromisosPendientes(emprendimientoId);
  const [cambios, setCambios] = useState({}); // id → { estado, previo }
  const [guardando, setGuardando] = useState(null);

  const refrescarResto = () => ['emprendimientos', 'emprendimiento', 'inicio', 'programa', 'programas', 'timeline']
    .forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const cambiar = async (c, estado, previo) => {
    const anterior = cambios[c.id];
    setCambios((prev) => ({ ...prev, [c.id]: { estado, previo } }));
    setGuardando(c.id);
    try {
      await api.put(`/compromisos/${c.id}`, { estado });
      refrescarResto();
    } catch (error) {
      setCambios((prev) => {
        const siguiente = { ...prev };
        if (anterior) siguiente[c.id] = anterior; else delete siguiente[c.id];
        return siguiente;
      });
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar el estado');
    } finally {
      setGuardando(null);
    }
  };

  if (isLoading) return <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando compromisos"><Skeleton className="h-6 w-48" />{[0, 1].map((i) => <Skeleton key={i} className="h-14" />)}</div>;
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los compromisos." onReintentar={refetch} /></div>;

  const abiertos = compromisos.filter((c) => !CERRADOS.includes(cambios[c.id]?.estado));
  const vencido = (c) => !!fechasPasadas && vencidoDe(c, fechasPasadas);
  const vencidos = abiertos.filter(vencido).length;

  return (
    <section aria-labelledby={`t-compromisos-${emprendimientoId}`} className={`${TARJETA_CLS} grid gap-3 p-5`}>
      <div className="grid gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`t-compromisos-${emprendimientoId}`} className={TITULO_BLOQUE_CLS}>Compromisos abiertos</h2>
          <span className="text-[13px] tabular-nums text-muted-foreground" aria-live="polite">
            {abiertos.length === 1 ? '1 abierto' : `${abiertos.length} abiertos`}
            {vencidos > 0 && <span className="font-semibold text-danger"> · {vencidos === 1 ? '1 vencido' : `${vencidos} vencidos`}</span>}
          </span>
        </div>
        {ayuda && <p className="text-[13px] text-muted-foreground">{ayuda}</p>}
      </div>
      {compromisos.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 size={16} className="text-success" aria-hidden="true" />No hay compromisos abiertos.</p>
      ) : (
        <ul className="grid gap-2">
          {compromisos.map((c) => {
            const cambio = cambios[c.id];
            const estado = cambio?.estado ?? c.estado;
            const cerrado = CERRADOS.includes(estado);
            const sesion = c.seguimientoOrigen?.sesion;
            return (
              <li key={c.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-control border border-border p-3 transition-opacity ${cerrado ? 'bg-muted/40' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${cerrado ? 'text-muted-foreground line-through' : ''}`}>
                    {c.descripcion}
                    {!cerrado && vencido(c) && <span className={`${CHIP_CLS} ${FONDO_TONO.danger} ml-2 align-middle`} title="Ya pasó otra sesión desde que se acordó">Vencido</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sesion ? `De ${sesion.titulo}, ${formatFecha(sesion.fecha, { day: 'numeric', month: 'short' })}` : 'Sin sesión'}
                    {sesion && esFutura(sesion.fecha) && ' · sesión aún no realizada'}
                    {cerrado && ` · ${estadoDe(ESTADOS_ACTIVIDAD, estado).label.toLowerCase()}`}
                  </p>
                </div>
                {editable && (cerrado ? (
                  <button
                    type="button"
                    onClick={() => cambiar(c, cambio.previo, null)}
                    disabled={guardando === c.id}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-semibold text-link hover:bg-info-soft disabled:opacity-60"
                  >
                    <Undo2 size={14} aria-hidden="true" />Deshacer
                  </button>
                ) : (
                  <OpcionesRadio
                    etiqueta={`Estado de «${c.descripcion}»`}
                    opciones={OPCIONES}
                    valor={estado === 'planeado' ? null : estado}
                    onCambiar={(nuevo) => nuevo !== estado && cambiar(c, nuevo, estado)}
                    deshabilitado={guardando === c.id}
                  />
                ))}
                {!editable && !cerrado && <span className="text-xs font-semibold text-muted-foreground">{estadoDe(ESTADOS_ACTIVIDAD, estado).label}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CompromisosAbiertos;
