// Barra de progreso «en trazo», la firma del sistema visual: la línea se dibuja una vez al entrar
// (estática con reduced motion). `valor` va de 0 a 100; a partir de 100 pasa al verde de completado.
const Trazo = ({ valor, completo = valor >= 100, retraso = 0.5, className = '' }) => (
  <svg
    viewBox="0 0 100 6"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={`block h-1.5 w-full overflow-visible rounded-full bg-muted ${className}`.trim()}
  >
    {valor > 0 && (
      <line
        x1="3" y1="3" x2="97" y2="3" pathLength="100"
        strokeWidth="6" strokeLinecap="round" strokeDasharray="100"
        className={`animate-draw ${completo ? 'stroke-trazo-completo' : 'stroke-trazo'}`}
        style={{ strokeDashoffset: 100 - Math.min(valor, 100), '--desde': 100, animationDelay: `calc(var(--dur-draw) * ${retraso})` }}
      />
    )}
  </svg>
);

export default Trazo;
