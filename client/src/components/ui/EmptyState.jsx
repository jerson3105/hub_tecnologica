const FONDOS_ICONO = {
  cyan: 'bg-brand-cyan/10 text-brand-cyan-ink',
  green: 'bg-brand-green/10 text-brand-green-ink',
  purple: 'bg-brand-purple/10 text-brand-purple',
  neutral: 'bg-gray-100 text-gray-500'
};

// Estado vacío de una lista o página. `accion` es un nodo (normalmente un <Button>).
// `compacto` reduce el relleno; `sinMarco` quita fondo, borde y sombra para usarlo dentro
// de una tarjeta que ya los tiene (evita el recuadro dentro de otro recuadro).
const EmptyState = ({ icono: Icono, tono = 'cyan', titulo, descripcion, accion, compacto = false, sinMarco = false, className = '' }) => (
  <div
    className={`text-center ${sinMarco ? '' : 'bg-white rounded-2xl border border-gray-100 shadow-sm'} ${compacto ? (sinMarco ? 'px-4 py-8' : 'p-8') : 'p-10 sm:p-16'} ${className}`.trim()}
  >
    {Icono && (
      <div className={`${compacto ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} rounded-2xl flex items-center justify-center mx-auto ${FONDOS_ICONO[tono] || FONDOS_ICONO.cyan}`}>
        <Icono size={compacto ? 24 : 32} aria-hidden="true" />
      </div>
    )}
    <p className="text-gray-700 font-medium">{titulo}</p>
    {descripcion && <p className="text-gray-500 text-sm mt-1">{descripcion}</p>}
    {accion && <div className="mt-5 flex justify-center">{accion}</div>}
  </div>
);

export default EmptyState;
