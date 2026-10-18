// La espiral de la «g» del logo (línea continua): isotipo provisional para el menú en rail
// mientras no haya logo en SVG. Hereda el color con currentColor.
const Espiral = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M16 29c-6 0-9-3.5-9-9.5V12c0-5.5 3.5-9 9-9s9 3.5 9 9v8c0 4.5-2.5 7-6.5 7S13 24.5 13 20.5V13c0-2.2 1.2-3.5 3-3.5s3 1.3 3 3.5v7" />
  </svg>
);

export default Espiral;
