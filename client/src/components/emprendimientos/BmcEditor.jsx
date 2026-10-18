import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, Save, Copy, MessageSquareText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatFecha } from '../../utils/fechas';
import Button from '../ui/Button';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { FILTRO_CLS } from '../ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';
import { BLOQUES_BMC, CLAVES_BMC } from '../../constants/bmc';

const vacio = () => Object.fromEntries(CLAVES_BMC.map((c) => [c, '']));
const desdeBmc = (bmc) => ({ nombre: bmc?.nombre || '', ...Object.fromEntries(CLAVES_BMC.map((c) => [c, bmc?.[c] || ''])) });
const completados = (valores) => CLAVES_BMC.filter((c) => valores[c]?.trim()).length;

// Editor del Business Model Canvas del emprendedor, por versiones. Una versión que ya tiene
// feedback del equipo técnico queda como entregada (no se edita, para no perder el contexto de lo
// comentado): para cambiarla se crea una versión nueva a partir de ella. Se guarda con la barra
// inferior; avisa si se intenta salir o cambiar de versión con cambios sin guardar.
// `onPendientes(bool)` avisa al espacio si hay cambios sin guardar (para confirmar al cambiar de pestaña).
const BmcEditor = ({ emprendimientoId, onPendientes }) => {
  const queryClient = useQueryClient();
  const [seleccionId, setSeleccionId] = useState(null);
  const [borrador, setBorrador] = useState(null); // valores editados de la versión activa
  const [ocupado, setOcupado] = useState(null);

  const { data: versiones = [], isLoading: cargandoVersiones, isError, refetch } = useQuery({
    queryKey: ['bmcVersiones', String(emprendimientoId)],
    queryFn: () => api.get(`/bmc/emprendimiento/${emprendimientoId}`).then((r) => r.data.versiones || [])
  });
  const idActivo = seleccionId ?? versiones[0]?.id ?? null;
  const { data: bmc = null, isLoading: cargandoBmc } = useQuery({
    queryKey: ['bmc', idActivo],
    queryFn: () => api.get(`/bmc/${idActivo}`).then((r) => r.data.bmc),
    enabled: !!idActivo
  });

  const entregada = !!bmc?.feedback;
  const valores = borrador ?? desdeBmc(bmc);
  const original = desdeBmc(bmc);
  const hayCambios = !!borrador && [...CLAVES_BMC, 'nombre'].some((c) => (borrador[c] || '') !== (original[c] || ''));
  const hechos = completados(valores);

  useEffect(() => { onPendientes?.(hayCambios); }, [hayCambios, onPendientes]);
  useEffect(() => () => onPendientes?.(false), [onPendientes]);
  useEffect(() => {
    if (!hayCambios) return undefined;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayCambios]);

  const descartarSiHace = () => !hayCambios || window.confirm('Tienes cambios sin guardar en este BMC. ¿Descartarlos?');
  const cambiar = (campo, valor) => setBorrador({ ...valores, [campo]: valor });
  const refrescar = async (nuevoId) => {
    await queryClient.invalidateQueries({ queryKey: ['bmcVersiones', String(emprendimientoId)] });
    queryClient.invalidateQueries({ queryKey: ['inicio'] });
    if (nuevoId) setSeleccionId(nuevoId);
  };

  const elegirVersion = (id) => {
    if (!descartarSiHace()) return;
    setBorrador(null);
    setSeleccionId(id);
  };

  const guardar = async () => {
    setOcupado('guardar');
    try {
      await api.put(`/bmc/${bmc.id}`, valores);
      await queryClient.invalidateQueries({ queryKey: ['bmc', bmc.id] });
      await refrescar();
      setBorrador(null);
      toast.success('BMC guardado');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar el BMC');
    } finally {
      setOcupado(null);
    }
  };

  // Versión nueva: copia la activa (con lo que haya en pantalla) o, si no hay ninguna, en blanco
  const nuevaVersion = async () => {
    if (!descartarSiHace()) return;
    setOcupado('nueva');
    try {
      const base = bmc ? Object.fromEntries(CLAVES_BMC.map((c) => [c, valores[c]])) : vacio();
      const { data } = await api.post('/bmc', { emprendimiento_id: emprendimientoId, ...base });
      setBorrador(null);
      await refrescar(data.bmc.id);
      toast.success(bmc ? `Versión ${data.bmc.version} creada a partir de la anterior` : 'Tu BMC está listo para completar');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo crear la versión');
    } finally {
      setOcupado(null);
    }
  };

  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar tu Business Model Canvas." onReintentar={refetch} /></div>;
  if (cargandoVersiones || (idActivo && cargandoBmc)) {
    return (
      <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando el BMC">
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  if (!bmc) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-12 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-warning-soft text-warning-soft-foreground"><LayoutGrid size={24} aria-hidden="true" /></span>
        <h2 className="font-display text-xl font-semibold">Tu modelo de negocio en una página</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          El Business Model Canvas resume en 9 bloques a quién le das valor, cómo y cómo ganas dinero. Empieza por tus clientes: el resto se ordena solo.
        </p>
        <Button icono={Plus} cargando={ocupado === 'nueva'} onClick={nuevaVersion}>Empezar mi BMC</Button>
      </div>
    );
  }

  return (
    <section aria-labelledby="t-bmc" className="grid gap-4">
      <div className={`${TARJETA_CLS} grid gap-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="t-bmc" className={TITULO_BLOQUE_CLS}>Modelo de negocio</h2>
              <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Versión {bmc.version}</span>
              {entregada
                ? <span className={`${CHIP_CLS} ${FONDO_TONO.programa}`}>Con feedback</span>
                : <span className={`${CHIP_CLS} ${FONDO_TONO.info}`}>En curso</span>}
            </div>
            <p className="text-[13px] text-muted-foreground" aria-live="polite">
              {hechos} de 9 bloques completos{bmc.updatedAt || bmc.updated_at ? ` · guardado el ${formatFecha(bmc.updatedAt || bmc.updated_at, { day: 'numeric', month: 'short' })}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {versiones.length > 1 && (
              <select aria-label="Versión del modelo de negocio" value={idActivo || ''} onChange={(e) => elegirVersion(Number(e.target.value))} className={FILTRO_CLS}>
                {versiones.map((v) => <option key={v.id} value={v.id}>v{v.version} · {v.nombre || `Versión ${v.version}`}{v.feedback ? ' · con feedback' : ''}</option>)}
              </select>
            )}
            <Button variante="secondary" tamanio="sm" icono={Copy} cargando={ocupado === 'nueva'} onClick={nuevaVersion}>
              {entregada ? 'Nueva versión a partir de esta' : 'Nueva versión'}
            </Button>
          </div>
        </div>

        {!entregada && (
          <label className="grid max-w-sm gap-1 text-sm font-medium">
            Nombre de esta versión
            <input
              value={valores.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              maxLength={200}
              placeholder={`Versión ${bmc.version}`}
              className="min-h-10 rounded-control border border-input bg-card px-3 text-sm text-foreground placeholder:text-subtle-foreground"
            />
          </label>
        )}

        {entregada && (
          <div className="grid gap-1.5 rounded-control border border-border bg-programa-soft/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText size={16} aria-hidden="true" />Feedback del equipo técnico
              {bmc.feedback_fecha && <span className="font-normal text-muted-foreground">· {formatFecha(bmc.feedback_fecha)}</span>}
            </p>
            <p className="whitespace-pre-wrap text-sm">{bmc.feedback}</p>
            <p className="text-[13px] text-muted-foreground">Esta versión ya fue revisada. Para aplicar los cambios, crea una versión nueva a partir de ella.</p>
          </div>
        )}
      </div>

      <div className="grid auto-rows-[minmax(9rem,auto)] grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-10">
        {BLOQUES_BMC.map((b) => {
          const id = `bmc-${b.clave}`;
          return (
            <div key={b.clave} className={`flex flex-col gap-1.5 rounded-control border border-border bg-card p-3 ${b.orden} lg:order-none ${b.celda}`}>
              <label htmlFor={id} className={`w-fit rounded-chip px-1.5 py-0.5 text-xs font-semibold ${FONDO_TONO[b.tono]}`}>{b.etiqueta}</label>
              <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">{b.pregunta}</p>
              {entregada ? (
                valores[b.clave]
                  ? <p id={id} className="whitespace-pre-wrap text-[13px]">{valores[b.clave]}</p>
                  : <p id={id} className="text-[13px] italic text-subtle-foreground">Sin completar</p>
              ) : (
                <textarea
                  id={id}
                  aria-describedby={`${id}-ayuda`}
                  value={valores[b.clave]}
                  onChange={(e) => cambiar(b.clave, e.target.value)}
                  rows={4}
                  className="min-h-24 w-full flex-1 resize-y rounded-[calc(var(--radius-control)-4px)] border border-transparent bg-muted/50 p-2 text-[13px] text-foreground transition-colors placeholder:text-subtle-foreground hover:border-input focus:border-input focus:bg-card"
                  placeholder="Escribe aquí…"
                />
              )}
            </div>
          );
        })}
      </div>

      {hayCambios && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 lg:mx-0 lg:rounded-card lg:border lg:bg-card lg:px-5">
          <span className="text-sm text-warning" aria-live="polite">Cambios sin guardar</span>
          <div className="flex gap-2">
            <Button variante="ghost" onClick={() => setBorrador(null)} disabled={ocupado === 'guardar'}>Descartar</Button>
            <Button icono={Save} cargando={ocupado === 'guardar'} onClick={guardar}>Guardar</Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BmcEditor;
