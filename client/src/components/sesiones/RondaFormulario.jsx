import { useEffect, useRef } from 'react';
import { Plus, X, Check, UserCheck } from 'lucide-react';
import { Field, Input, Textarea } from '../ui/Field';
import { formatFecha } from '../../utils/fechas';
import { claveNueva, enlaceValido, OPCIONES_REVISION } from '../../utils/ronda';
import { estadoDe, ESTADOS_ACTIVIDAD } from '../../constants/estados';
import { TARJETA_CLS, iconoBotonCls } from '../ui/estilosSemanticos';

const Seccion = ({ id, numero, titulo, ayuda, children, accion }) => (
  <section aria-labelledby={id} className={`${TARJETA_CLS} grid gap-4 p-5`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 id={id} className="font-display text-lg font-semibold leading-snug">
          <span className="mr-2 text-muted-foreground tabular-nums" aria-hidden="true">{numero}.</span>{titulo}
        </h3>
        {ayuda && <p className="mt-0.5 text-[13px] text-muted-foreground">{ayuda}</p>}
      </div>
      {accion}
    </div>
    {children}
  </section>
);

// Grupo de opciones tipo radio con botones grandes (≥ 40 px), navegable con flechas
const Opciones = ({ etiqueta, opciones, valor, onCambiar, tono = 'info' }) => {
  const refs = useRef([]);
  const mover = (e, i) => {
    const destino = { ArrowRight: (i + 1) % opciones.length, ArrowLeft: (i - 1 + opciones.length) % opciones.length }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    onCambiar(opciones[destino].valor);
    refs.current[destino]?.focus();
  };
  const activoCls = { info: 'bg-primary text-primary-foreground', success: 'bg-success-solid text-success-solid-foreground' };
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex shrink-0 gap-1 rounded-control bg-muted p-1">
      {opciones.map((o, i) => {
        const activo = o.valor === valor;
        return (
          <button
            key={String(o.valor)}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo || (valor == null && i === 0) ? 0 : -1}
            onClick={() => onCambiar(o.valor)}
            onKeyDown={(e) => mover(e, i)}
            className={`min-h-9 whitespace-nowrap rounded-[calc(var(--radius-control)-4px)] px-3 text-[13px] font-semibold transition-colors ${
              activo ? (activoCls[o.tono || tono] || activoCls.info) : 'text-muted-foreground hover:bg-card hover:text-foreground'
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
};

// Formulario de un emprendimiento en la ronda: revisa lo anterior, registra lo trabajado, deja
// compromisos nuevos y toma la asistencia del equipo. Controlado: `borrador` + `onCambio(fn)`.
const RondaFormulario = ({ emp, borrador, onCambio, proximaSesion }) => {
  const refsCompromisos = useRef({});
  // La fila nueva se enfoca tras pintarse (no con requestAnimationFrame: puede llegar tarde y
  // lo que se escribe mientras tanto se pierde)
  const focoPendiente = useRef(null);
  useEffect(() => {
    const clave = focoPendiente.current;
    if (clave && refsCompromisos.current[clave]) {
      refsCompromisos.current[clave].focus();
      focoPendiente.current = null;
    }
  });

  const setCampo = (campo) => (e) => onCambio((b) => ({ ...b, [campo]: e.target.value }));
  const agregarCompromiso = (despuesDe = null) => {
    const clave = claveNueva();
    onCambio((b) => {
      const lista = [...b.compromisos];
      const i = despuesDe ? lista.findIndex((c) => c.clave === despuesDe) + 1 : lista.length;
      lista.splice(i, 0, { id: null, clave, descripcion: '' });
      return { ...b, compromisos: lista };
    });
    focoPendiente.current = clave;
  };
  const quitarCompromiso = (clave) => onCambio((b) => ({ ...b, compromisos: b.compromisos.filter((c) => c.clave !== clave) }));
  const marcarTodos = (presente) => onCambio((b) => ({ ...b, asistencia: Object.fromEntries(emp.equipo.map((m) => [m.usuario_id, presente])) }));

  const tomada = emp.equipo.filter((m) => borrador.asistencia[m.usuario_id] !== null && borrador.asistencia[m.usuario_id] !== undefined).length;

  return (
    <div className="grid gap-4">
      {emp.anteriores.length > 0 && (
        <Seccion id="r-previos" numero={1} titulo="Compromisos de reuniones anteriores" ayuda="Marca cómo quedó cada uno. Se guarda como revisado en esta sesión.">
          <ul className="grid gap-2">
            {emp.anteriores.map((c) => {
              const valor = borrador.revisiones[c.id] ?? (c.revisadoAqui ? c.estado : null);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      De {c.sesion.titulo}, {formatFecha(c.sesion.fecha, { day: 'numeric', month: 'short' })}
                      {!c.revisadoAqui && c.estado !== 'planeado' && ` · estaba ${estadoDe(ESTADOS_ACTIVIDAD, c.estado).label.toLowerCase()}`}
                    </p>
                  </div>
                  <Opciones
                    etiqueta={`Estado de «${c.descripcion}»`}
                    opciones={OPCIONES_REVISION.map((o) => ({ ...o, tono: o.valor === 'completado' ? 'success' : 'info' }))}
                    valor={valor}
                    onCambiar={(estado) => onCambio((b) => ({ ...b, revisiones: { ...b.revisiones, [c.id]: estado } }))}
                  />
                </li>
              );
            })}
          </ul>
        </Seccion>
      )}

      <Seccion id="r-notas" numero={emp.anteriores.length ? 2 : 1} titulo="Lo trabajado">
        <Field label="Qué se trabajó en la reunión" ayuda="Con esto el emprendimiento queda como registrado.">
          <Textarea value={borrador.realizado} onChange={setCampo('realizado')} rows={4} className="resize-y" placeholder="Temas, avances y acuerdos de la reunión…" />
        </Field>
        <Field label="Observaciones" ayuda="Opcional. Solo las ve el equipo técnico.">
          <Textarea value={borrador.observaciones} onChange={setCampo('observaciones')} rows={2} className="resize-y" />
        </Field>
      </Seccion>

      <Seccion
        id="r-nuevos"
        numero={emp.anteriores.length ? 3 : 2}
        titulo="Compromisos para la siguiente sesión"
        ayuda={proximaSesion
          ? `Se revisarán en la próxima: ${proximaSesion.titulo}, ${formatFecha(proximaSesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}. Enter añade otro.`
          : 'Se revisarán en la próxima sesión. Enter añade otro.'}
      >
        {borrador.compromisos.length > 0 && (
          <ol className="grid gap-2">
            {borrador.compromisos.map((c, i) => (
              <li key={c.clave} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground" aria-hidden="true">{i + 1}.</span>
                <Input
                  ref={(el) => { refsCompromisos.current[c.clave] = el; }}
                  value={c.descripcion}
                  onChange={(e) => onCambio((b) => ({ ...b, compromisos: b.compromisos.map((x) => (x.clave === c.clave ? { ...x, descripcion: e.target.value } : x)) }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCompromiso(c.clave); } }}
                  placeholder="Describe el compromiso"
                  aria-label={`Compromiso ${i + 1}`}
                />
                <button type="button" onClick={() => quitarCompromiso(c.clave)} className={iconoBotonCls('danger')} aria-label={`Quitar compromiso ${i + 1}`} title="Quitar">
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <button type="button" onClick={() => agregarCompromiso()} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-control px-2 text-sm font-semibold text-link hover:bg-info-soft">
          <Plus size={16} aria-hidden="true" />Agregar compromiso
        </button>
      </Seccion>

      <Seccion
        id="r-asistencia"
        numero={emp.anteriores.length ? 4 : 3}
        titulo="Asistencia del equipo"
        ayuda={emp.equipo.length ? `${tomada} de ${emp.equipo.length} marcados` : 'Este emprendimiento aún no tiene integrantes.'}
        accion={emp.equipo.length > 1 && (
          <button type="button" onClick={() => marcarTodos(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-link hover:bg-info-soft">
            <UserCheck size={15} aria-hidden="true" />Todos presentes
          </button>
        )}
      >
        {emp.equipo.length > 0 && (
          <ul className="grid gap-2">
            {emp.equipo.map((m) => (
              <li key={m.usuario_id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border px-3 py-2">
                <span className="grid min-w-0">
                  <span className="text-sm font-medium">{m.nombre} {m.apellido}</span>
                  <span className="text-xs text-muted-foreground">{[m.es_lider && 'Líder', m.rol].filter(Boolean).join(' · ') || 'Integrante'}</span>
                </span>
                <Opciones
                  etiqueta={`Asistencia de ${m.nombre} ${m.apellido}`}
                  opciones={[{ valor: true, texto: 'Presente', tono: 'success' }, { valor: false, texto: 'Ausente' }]}
                  valor={borrador.asistencia[m.usuario_id] ?? null}
                  onCambiar={(presente) => onCambio((b) => ({ ...b, asistencia: { ...b.asistencia, [m.usuario_id]: presente } }))}
                />
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion id="r-grabacion" numero={emp.anteriores.length ? 5 : 4} titulo="Grabación" ayuda="Opcional.">
        <Field label="Enlace" error={enlaceValido(borrador.enlace_grabacion) ? null : 'Debe empezar por http:// o https://. No se guardará hasta corregirlo.'}>
          <Input type="url" value={borrador.enlace_grabacion} onChange={setCampo('enlace_grabacion')} placeholder="https://" />
        </Field>
      </Seccion>

      {borrador.realizado.trim() && (
        <p className="flex items-center gap-2 text-[13px] text-success" aria-live="polite">
          <Check size={15} aria-hidden="true" />Con «Lo trabajado» completo, este emprendimiento cuenta como registrado.
        </p>
      )}
    </div>
  );
};

export default RondaFormulario;
