// Bloque de carga con pulso de opacidad (estático con reduced motion). El tamaño va en className.
const Skeleton = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-skeleton rounded-control bg-skeleton ${className}`.trim()} />
);

export default Skeleton;
