import { useRef } from 'react';

const ACTIVO = {
  info: 'bg-primary text-primary-foreground',
  success: 'bg-success-solid text-success-solid-foreground',
  danger: 'bg-danger-solid text-danger-solid-foreground'
};

// Grupo de opciones tipo radio con botones grandes (≥ 36 px), navegable con flechas.
// `opciones` = [{ valor, texto, tono? }]; `valor` puede ser null (ninguna elegida).
const OpcionesRadio = ({ etiqueta, opciones, valor, onCambiar, tono = 'info', deshabilitado = false }) => {
  const refs = useRef([]);
  const mover = (e, i) => {
    const destino = { ArrowRight: (i + 1) % opciones.length, ArrowLeft: (i - 1 + opciones.length) % opciones.length }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    onCambiar(opciones[destino].valor);
    refs.current[destino]?.focus();
  };
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
            disabled={deshabilitado}
            tabIndex={activo || (valor == null && i === 0) ? 0 : -1}
            onClick={() => onCambiar(o.valor)}
            onKeyDown={(e) => mover(e, i)}
            className={`min-h-9 whitespace-nowrap rounded-[calc(var(--radius-control)-4px)] px-3 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
              activo ? (ACTIVO[o.tono || tono] || ACTIVO.info) : 'text-muted-foreground hover:bg-card hover:text-foreground'
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
};

export default OpcionesRadio;
