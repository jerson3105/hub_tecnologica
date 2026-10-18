import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatFecha } from '../../utils/fechas';
import Button from '../ui/Button';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { Field, Textarea } from '../ui/Field';
import { FILTRO_CLS } from '../ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';

// Disposición clásica del lienzo en escritorio (10 columnas); en móvil, un bloque por fila
const BLOQUES = [
  { clave: 'socios_clave', etiqueta: 'Socios clave', tono: 'programa', celda: 'lg:col-span-2 lg:row-span-2' },
  { clave: 'actividades_clave', etiqueta: 'Actividades clave', tono: 'info', celda: 'lg:col-span-2' },
  { clave: 'propuesta_valor', etiqueta: 'Propuesta de valor', tono: 'warning', celda: 'lg:col-span-2 lg:row-span-2' },
  { clave: 'relacion_clientes', etiqueta: 'Relación con clientes', tono: 'success', celda: 'lg:col-span-2' },
  { clave: 'segmento_clientes', etiqueta: 'Segmento de clientes', tono: 'danger', celda: 'lg:col-span-2 lg:row-span-2' },
  { clave: 'recursos_clave', etiqueta: 'Recursos clave', tono: 'info', celda: 'lg:col-span-2' },
  { clave: 'canales', etiqueta: 'Canales', tono: 'success', celda: 'lg:col-span-2' },
  { clave: 'estructura_costos', etiqueta: 'Estructura de costos', tono: 'azul', celda: 'lg:col-span-5' },
  { clave: 'fuentes_ingresos', etiqueta: 'Fuentes de ingresos', tono: 'success', celda: 'lg:col-span-5' }
];

// Business Model Canvas en lectura, con selector de versión y feedback del equipo técnico
const BmcVista = ({ emprendimientoId }) => {
  const queryClient = useQueryClient();
  const [seleccionId, setSeleccionId] = useState(null);
  const [borradores, setBorradores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Versiones y versión seleccionada como consultas independientes (con caché no se perdía la selección)
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
  const feedback = borradores[idActivo] ?? bmc?.feedback ?? '';

  const enviar = async () => {
    setEnviando(true);
    try {
      await api.put(`/bmc/${bmc.id}/feedback`, { feedback });
      toast.success('Feedback enviado');
      await queryClient.invalidateQueries({ queryKey: ['bmc', bmc.id] });
      queryClient.invalidateQueries({ queryKey: ['inicio'] });
      setBorradores((prev) => {
        const siguiente = { ...prev };
        delete siguiente[bmc.id];
        return siguiente;
      });
    } catch {
      toast.error('Error al enviar feedback');
    } finally {
      setEnviando(false);
    }
  };

  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar el Business Model Canvas." onReintentar={refetch} /></div>;

  return (
    <section aria-labelledby="t-bmc" className={`${TARJETA_CLS} grid gap-5 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="t-bmc" className={TITULO_BLOQUE_CLS}>Business Model Canvas</h2>
          {bmc && !bmc.feedback && <span className={`${CHIP_CLS} ${FONDO_TONO.warning}`}>Sin feedback</span>}
        </div>
        {versiones.length > 1 && (
          <select aria-label="Versión del Business Model Canvas" value={idActivo || ''} onChange={(e) => setSeleccionId(Number(e.target.value))} className={FILTRO_CLS}>
            {versiones.map((v) => <option key={v.id} value={v.id}>v{v.version} — {v.nombre || `Versión ${v.version}`}</option>)}
          </select>
        )}
      </div>

      {(cargandoVersiones || (idActivo && cargandoBmc)) ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="status" aria-label="Cargando BMC">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : !bmc ? (
        <div className="grid justify-items-center gap-3 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><LayoutGrid size={24} aria-hidden="true" /></span>
          <p className="font-semibold">El equipo aún no ha creado su Business Model Canvas</p>
        </div>
      ) : (
        <>
          <div className="grid auto-rows-[minmax(6rem,auto)] grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-10">
            {BLOQUES.map((b) => (
              <div key={b.clave} className={`rounded-control border border-border p-3 ${b.celda}`}>
                <p className={`mb-1.5 inline-block rounded-chip px-1.5 py-0.5 text-xs font-semibold ${FONDO_TONO[b.tono]}`}>{b.etiqueta}</p>
                {bmc[b.clave]
                  ? <p className="whitespace-pre-wrap text-[13px]">{bmc[b.clave]}</p>
                  : <p className="text-[13px] italic text-subtle-foreground">Sin completar</p>}
              </div>
            ))}
          </div>

          {bmc.feedback && bmc.feedback_fecha && (
            <div className="rounded-control border border-border bg-programa-soft/50 p-4">
              <p className="eyebrow">Feedback enviado el {formatFecha(bmc.feedback_fecha)}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{bmc.feedback}</p>
            </div>
          )}

          <div className="grid gap-3 border-t border-border pt-4">
            <Field label="Feedback para el equipo" ayuda="Lo verán al abrir esta versión de su BMC.">
              <Textarea
                value={feedback}
                onChange={(e) => setBorradores((prev) => ({ ...prev, [idActivo]: e.target.value }))}
                rows={3}
                placeholder="Qué está bien planteado y qué conviene revisar en esta versión…"
                className="resize-y"
              />
            </Field>
            <div className="flex justify-end">
              <Button icono={Send} cargando={enviando} disabled={!feedback.trim()} onClick={enviar}>Enviar feedback</Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default BmcVista;
