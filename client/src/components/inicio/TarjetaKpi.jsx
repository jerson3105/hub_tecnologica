import useContador from '../../hooks/useContador';
import { TARJETA_CLS, TEXTO_TONO } from './estilosInicio';

// Indicador del Inicio. El número cuenta hasta su valor al entrar; el lector de pantalla
// recibe directamente el valor final.
const TarjetaKpi = ({ titulo, valor, nota, tonoNota = 'muted', indice = 0 }) => {
  const mostrado = useContador(valor);
  return (
    <div className={`${TARJETA_CLS} animate-enter escalonado flex flex-col gap-1.5 p-4 sm:p-5`} style={{ '--i': indice }}>
      <dt className="text-sm font-medium text-muted-foreground">{titulo}</dt>
      <dd className="text-3xl font-semibold leading-tight tracking-tight tabular-nums">
        <span aria-hidden="true">{mostrado ?? '—'}</span>
        <span className="sr-only">{valor ?? 'Sin datos'}</span>
      </dd>
      {nota && <dd className={`text-[13px] leading-snug ${TEXTO_TONO[tonoNota] || TEXTO_TONO.muted}`}>{nota}</dd>}
    </div>
  );
};

export default TarjetaKpi;
