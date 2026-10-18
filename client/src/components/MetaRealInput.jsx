import { useEffect, useState } from 'react';

// Input del avance real de una actividad OKR. Mantiene el valor localmente y guarda al
// salir del campo o con Enter, en vez de enviar una petición (y un refetch) por tecla.
// Los DECIMAL llegan como '12.00': se muestran como número
const aTexto = (valor) => (valor === null || valor === undefined || valor === '' ? '' : String(Number(valor)));

const MetaRealInput = ({ valor, onGuardar, etiqueta = 'Avance real' }) => {
  const [texto, setTexto] = useState(aTexto(valor));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setTexto(aTexto(valor));
  }, [valor]);

  const guardar = async () => {
    const limpio = String(texto).trim();
    if (limpio === aTexto(valor)) return;
    setGuardando(true);
    try {
      await onGuardar(limpio === '' ? 0 : limpio);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      disabled={guardando}
      aria-label={etiqueta}
      title={etiqueta}
      className={`w-16 px-2 py-1 border border-gray-300 rounded-md text-xs text-center tabular-nums ${guardando ? 'opacity-60' : ''}`}
    />
  );
};

export default MetaRealInput;
