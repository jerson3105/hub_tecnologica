// Control segmentado (filtro de una sola opción). Cada botón lleva aria-pressed.
// `opciones` = [{ valor, texto }]; en móvil ocupa el ancho y reparte los botones.
const Segmentado = ({ opciones, valor, onCambiar, etiqueta, className = '' }) => (
  <div className={`flex gap-1 rounded-control bg-muted p-1 sm:w-fit ${className}`.trim()} role="group" aria-label={etiqueta}>
    {opciones.map((o) => {
      const activo = o.valor === valor;
      return (
        <button
          key={String(o.valor)}
          type="button"
          aria-pressed={activo}
          onClick={() => onCambiar(o.valor)}
          className={`min-h-9 flex-1 whitespace-nowrap rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-semibold transition-colors sm:flex-none ${
            activo ? 'bg-card text-foreground elevation-1' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.texto}
        </button>
      );
    })}
  </div>
);

export default Segmentado;
