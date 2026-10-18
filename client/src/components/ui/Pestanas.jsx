import { useRef } from 'react';

// Pestañas accesibles (patrón tablist de WAI-ARIA): flechas, Inicio y Fin mueven el foco y
// activan la pestaña. El panel lo pinta quien llama, con id `${idBase}-panel-${id}`.
const Pestanas = ({ pestanas, activa, onCambiar, idBase, etiqueta }) => {
  const refs = useRef({});

  const mover = (e, indice) => {
    const ultima = pestanas.length - 1;
    const destino = { ArrowRight: indice === ultima ? 0 : indice + 1, ArrowLeft: indice === 0 ? ultima : indice - 1, Home: 0, End: ultima }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const { id } = pestanas[destino];
    onCambiar(id);
    refs.current[id]?.focus();
  };

  return (
    <div role="tablist" aria-label={etiqueta} className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none]">
      {pestanas.map((p, i) => {
        const seleccionada = p.id === activa;
        return (
          <button
            key={p.id}
            ref={(el) => { refs.current[p.id] = el; }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${p.id}`}
            aria-selected={seleccionada}
            aria-controls={`${idBase}-panel-${p.id}`}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambiar(p.id)}
            onKeyDown={(e) => mover(e, i)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${
              seleccionada ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
            {p.contador !== undefined && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${seleccionada ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {p.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Pestanas;
