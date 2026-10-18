import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, Clock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { Field, Textarea } from '../ui/Field';
import { formatFecha } from '../../utils/fechas';
import { formatoDecimal } from '../../utils/inicio';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';

const tonoDe = (p) => (p <= 6 ? 'danger' : p <= 8 ? 'warning' : 'success');
const porcentaje = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// Resultados para el equipo técnico: promedio, distribución y comentarios (los detractores primero)
const Resultados = ({ sesionId }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['nps-sesion', String(sesionId)],
    queryFn: () => api.get(`/nps/sesion/${sesionId}`).then((r) => r.data)
  });
  if (isLoading) return <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando evaluaciones"><Skeleton className="h-6 w-48" /><Skeleton className="h-2.5 w-full" /><Skeleton className="h-16" /></div>;
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar las evaluaciones." onReintentar={refetch} /></div>;

  const respuestas = [...(data?.respuestas || [])].sort((a, b) => a.puntuacion - b.puntuacion);
  const total = respuestas.length;
  const tramos = [
    { nombre: 'Detractores', valor: porcentaje(respuestas.filter((r) => r.puntuacion <= 6).length, total), color: 'bg-danger-solid' },
    { nombre: 'Pasivos', valor: porcentaje(respuestas.filter((r) => r.puntuacion >= 7 && r.puntuacion <= 8).length, total), color: 'bg-input' },
    { nombre: 'Promotores', valor: porcentaje(respuestas.filter((r) => r.puntuacion >= 9).length, total), color: 'bg-success-solid' }
  ];

  return (
    <section aria-labelledby="t-evaluacion" className={`${TARJETA_CLS} grid gap-4 p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="t-evaluacion" className={TITULO_BLOQUE_CLS}>Evaluación</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            Promedio <span className="text-2xl font-semibold tabular-nums text-foreground">{formatoDecimal(data.promedio)}</span> · {total === 1 ? '1 respuesta' : `${total} respuestas`}
          </span>
        )}
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Aún nadie ha evaluado esta sesión.</p>
      ) : (
        <>
          <div className="grid gap-2">
            <div role="img" aria-label={tramos.map((t) => `${t.nombre} ${t.valor} %`).join(', ')} className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted">
              {tramos.filter((t) => t.valor > 0).map((t) => <span key={t.nombre} className={t.color} style={{ width: `${t.valor}%` }} />)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums text-muted-foreground" aria-hidden="true">
              {tramos.map((t) => <span key={t.nombre} className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${t.color}`} />{t.nombre} {t.valor} %</span>)}
            </div>
          </div>
          <ul className="grid gap-2">
            {respuestas.map((r) => (
              <li key={r.id} className="grid gap-1.5 rounded-control border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{r.usuario?.nombre} {r.usuario?.apellido}</span>
                  <span className={`${CHIP_CLS} ${FONDO_TONO[tonoDe(r.puntuacion)]} tabular-nums`}>{r.puntuacion} / 10</span>
                </div>
                {r.comentario && <p className="text-sm"><span className="text-muted-foreground">Lo más útil: </span>{r.comentario}</p>}
                {r.areas_mejora && <p className="text-sm"><span className="text-muted-foreground">A mejorar: </span>{r.areas_mejora}</p>}
                {!r.comentario && !r.areas_mejora && <p className="text-[13px] text-subtle-foreground">Sin comentarios</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

// Formulario del emprendedor: puntuación 1-10 con botones numerados (radio, navegable con flechas)
const Formulario = ({ sesion }) => {
  const queryClient = useQueryClient();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [mejora, setMejora] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const refs = useRef([]);

  const mover = (e, n) => {
    const destino = { ArrowRight: Math.min(n + 1, 10), ArrowUp: Math.min(n + 1, 10), ArrowLeft: Math.max(n - 1, 1), ArrowDown: Math.max(n - 1, 1) }[e.key];
    if (!destino) return;
    e.preventDefault();
    setPuntuacion(destino);
    refs.current[destino]?.focus();
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!puntuacion) {
      toast.error('Elige una puntuación del 1 al 10');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/nps', {
        sesion_id: sesion.id,
        puntuacion,
        comentario,
        areas_mejora: mejora,
        tipo: sesion.tipo === 'taller' ? 'taller' : 'seguimiento'
      });
      setEnviado(true);
      toast.success('¡Gracias! Evaluación enviada');
      ['nps', 'sesiones'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo enviar la evaluación');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-2 px-5 py-10 text-center`}>
        <CheckCircle2 size={36} className="text-success" aria-hidden="true" />
        <p className="font-semibold">Gracias por tu evaluación</p>
        <p className="text-sm text-muted-foreground">Nos ayuda a mejorar las próximas sesiones.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} aria-labelledby="t-evaluar" className={`${TARJETA_CLS} grid gap-5 p-5`}>
      <div>
        <h2 id="t-evaluar" className={TITULO_BLOQUE_CLS}>Evalúa la sesión</h2>
        <p className="text-[13px] text-muted-foreground">Tarda menos de un minuto. Solo lo ve el equipo técnico.</p>
      </div>
      <fieldset className="grid gap-2">
        <legend id="nps-pregunta" className="mb-2 text-sm font-semibold">
          ¿Cómo calificarías esta sesión? <span className="text-danger" aria-hidden="true">*</span>
        </legend>
        <div role="radiogroup" aria-labelledby="nps-pregunta" aria-required="true" className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const activo = puntuacion === n;
            return (
              <button
                key={n}
                ref={(el) => { refs.current[n] = el; }}
                type="button"
                role="radio"
                aria-checked={activo}
                aria-label={`${n} de 10`}
                tabIndex={activo || (!puntuacion && n === 1) ? 0 : -1}
                onClick={() => setPuntuacion(n)}
                onKeyDown={(e) => mover(e, n)}
                className={`grid h-11 place-items-center rounded-control border text-base font-semibold tabular-nums transition-colors ${
                  activo ? `border-transparent ${FONDO_TONO[tonoDe(n)]} ring-2 ring-ring` : 'border-input hover:bg-muted'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true"><span>Muy mala</span><span>Excelente</span></div>
      </fieldset>
      <Field label="¿Qué aprendiste o qué te pareció más útil?">
        <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} className="resize-y" />
      </Field>
      <Field label="¿Qué podemos mejorar?">
        <Textarea value={mejora} onChange={(e) => setMejora(e.target.value)} rows={2} className="resize-y" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" icono={Send} cargando={enviando} disabled={!puntuacion}>Enviar evaluación</Button>
      </div>
    </form>
  );
};

// Pestaña Evaluación: resultados (equipo técnico) o formulario / estado (emprendedor)
const EvaluacionSesion = ({ sesion, esAdmin, sesionFutura, pendiente }) => {
  if (esAdmin) return <Resultados sesionId={sesion.id} />;
  if (sesionFutura) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-2 px-5 py-10 text-center`}>
        <Clock size={32} className="text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold">Podrás evaluarla cuando se haya realizado</p>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
    );
  }
  if (!pendiente) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-2 px-5 py-10 text-center`}>
        <Star size={32} className="text-success" aria-hidden="true" />
        <p className="font-semibold">Ya evaluaste esta sesión</p>
        <p className="text-sm text-muted-foreground">Gracias por tu retroalimentación.</p>
      </div>
    );
  }
  return <Formulario sesion={sesion} />;
};

export default EvaluacionSesion;
