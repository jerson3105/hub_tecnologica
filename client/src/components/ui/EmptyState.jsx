const FONDOS_ICONO = {
  cyan: 'bg-info-soft text-info-soft-foreground',
  green: 'bg-success-soft text-success-soft-foreground',
  purple: 'bg-programa-soft text-programa-soft-foreground',
  neutral: 'bg-muted text-muted-foreground'
};

// Estado vacío de una lista o página. `accion` es un nodo (normalmente un <Button>).
// `compacto` reduce el relleno; `sinMarco` quita fondo, borde y sombra para usarlo dentro
// de una tarjeta que ya los tiene (evita el recuadro dentro de otro recuadro).
const EmptyState = ({ icono: Icono, tono = 'cyan', titulo, descripcion, accion, compacto = false, sinMarco = false, className = '' }) => (
  <div
    className={`text-center ${sinMarco ? '' : 'bg-card rounded-card border border-border elevation-1'} ${compacto ? (sinMarco ? 'px-4 py-8' : 'p-8') : 'p-10 sm:p-16'} ${className}`.trim()}
  >
    {Icono && (
      <div className={`${compacto ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} rounded-2xl flex items-center justify-center mx-auto ${FONDOS_ICONO[tono] || FONDOS_ICONO.cyan}`}>
        <Icono size={compacto ? 24 : 32} aria-hidden="true" />
      </div>
    )}
    <p className="text-foreground font-medium">{titulo}</p>
    {descripcion && <p className="text-muted-foreground text-sm mt-1">{descripcion}</p>}
    {accion && <div className="mt-5 flex justify-center">{accion}</div>}
  </div>
);

export default EmptyState;
