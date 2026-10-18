import useContador from '../../hooks/useContador';
import { TARJETA_CLS, TEXTO_TONO } from '../ui/estilosSemanticos';

// Indicador del Inicio (y de los detalles). El número cuenta hasta su valor al entrar; el lector
// de pantalla recibe directamente el valor final. `sufijo` se pinta tras la cifra (« %»).
// `cifra` (texto, p. ej. «8,5») sustituye al contador cuando el valor no es un entero.
const TarjetaKpi = ({ titulo, valor, cifra, sufijo = '', nota, tonoNota = 'muted', indice = 0 }) => {
  const mostrado = useContador(cifra === undefined ? valor : null);
  const sinDato = cifra === undefined && (valor === null || valor === undefined);
  return (
    <div className={`${TARJETA_CLS} animate-enter escalonado flex flex-col gap-1.5 p-4 sm:p-5`} style={{ '--i': indice }}>
      <dt className="text-sm font-medium text-muted-foreground">{titulo}</dt>
      <dd className="text-3xl font-semibold leading-tight tracking-tight tabular-nums">
        <span aria-hidden="true">
          {sinDato ? '—' : <>{cifra ?? mostrado}{sufijo && <span className="text-xl font-medium text-muted-foreground">{sufijo}</span>}</>}
        </span>
        <span className="sr-only">{sinDato ? 'Sin datos' : `${cifra ?? valor}${sufijo}`}</span>
      </dd>
      {nota && <dd className={`text-[13px] leading-snug ${TEXTO_TONO[tonoNota] || TEXTO_TONO.muted}`}>{nota}</dd>}
    </div>
  );
};

export default TarjetaKpi;
