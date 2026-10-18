import toast from 'react-hot-toast';

// Pide confirmación, ejecuta el borrado y avisa del resultado (antes algunos borrados eran
// inmediatos, sin confirmación y sin aviso si fallaban).
export const eliminarConConfirmacion = async (mensaje, accion, alTerminar, textoExito = 'Eliminado') => {
  if (!window.confirm(mensaje)) return false;
  try {
    await accion();
    toast.success(textoExito);
    alTerminar?.();
    return true;
  } catch (error) {
    toast.error(error.response?.data?.mensaje || 'No se pudo eliminar');
    return false;
  }
};

// Botón de borrar pequeño: en dispositivos con hover aparece al pasar o enfocar la fila;
// en pantallas táctiles queda siempre visible.
export const BTN_BORRAR_SUAVE = 'p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-opacity focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100';
