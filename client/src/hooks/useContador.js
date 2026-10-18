import { useEffect, useRef, useState } from 'react';

const DURACION = 700; // --dur-count
const salida = (t) => 1 - (1 - t) ** 3; // ease-out cúbica, cercana a --ease-enter

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Cuenta de 0 (o del valor anterior) hasta `valor` en ~700 ms. Con reduced motion, o si el valor
// no es un número, devuelve el valor final directamente.
export default function useContador(valor) {
  const objetivo = typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  const estatico = objetivo === null || prefiereMenosMovimiento();
  const [animado, setAnimado] = useState(0);
  const previo = useRef(0);

  useEffect(() => {
    if (estatico) return undefined;
    const desde = previo.current;
    const inicio = performance.now();
    let raf;
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / DURACION);
      const actual = Math.round(desde + (objetivo - desde) * salida(t));
      previo.current = actual;
      setAnimado(actual);
      if (t < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, estatico]);

  return estatico ? objetivo : animado;
}
