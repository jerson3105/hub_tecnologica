import { ESTADOS_ACTIVIDAD } from '../constants/estados';

// Compromisos de un seguimiento como texto plano (PDFs): «descripción (estado)» separados por
// punto y coma. Usa la tabla `compromisos` (compromisoItems) y, si no hay, el campo de texto antiguo.
export const textoCompromisos = (seguimiento) => {
  const items = seguimiento?.compromisoItems || [];
  if (items.length === 0) return seguimiento?.compromisos || '';
  return items.map(c => `${c.descripcion} (${ESTADOS_ACTIVIDAD[c.estado]?.label || c.estado})`).join('; ');
};
