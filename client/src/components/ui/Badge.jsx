import { TONOS_BADGE, PUNTOS_BADGE } from './estilos';

// Etiqueta de estado. `forma="tag"` es la variante rectangular (categorías, áreas).
const Badge = ({ tono = 'neutral', punto = false, forma = 'pill', icono: Icono, className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold ${forma === 'tag' ? 'rounded-md' : 'rounded-full'} ${TONOS_BADGE[tono] || TONOS_BADGE.neutral} ${className}`.trim()}
  >
    {punto && <span className={`w-1.5 h-1.5 rounded-full ${PUNTOS_BADGE[tono] || PUNTOS_BADGE.neutral}`} aria-hidden="true" />}
    {Icono && <Icono size={12} aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;
