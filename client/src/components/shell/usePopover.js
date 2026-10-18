import { useEffect, useRef, useState } from 'react';

// Estado de un panel desplegable (menú de usuario, avisos): se cierra con un clic fuera o con
// Escape, y Escape devuelve el foco al botón que lo abrió.
const usePopover = () => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (!contenedorRef.current?.contains(e.target)) setAbierto(false); };
    const tecla = (e) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      botonRef.current?.focus();
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return {
    abierto,
    alternar: () => setAbierto((a) => !a),
    cerrar: () => setAbierto(false),
    contenedorRef,
    botonRef
  };
};

export default usePopover;
