import { ESTADOS_ACTIVIDAD } from '../constants/estados';

// Compromisos de un seguimiento como texto plano (PDFs): «descripción (estado)» separados por
// punto y coma. Usa la tabla `compromisos` (compromisoItems) y, si no hay, el campo de texto antiguo.
export const textoCompromisos = (seguimiento) => {
  const items = seguimiento?.compromisoItems || [];
  if (items.length === 0) return seguimiento?.compromisos || '';
  return items.map(c => `${c.descripcion} (${ESTADOS_ACTIVIDAD[c.estado]?.label || c.estado})`).join('; ');
};

// Fechas (AAAA-MM-DD) de las sesiones ya pasadas de un emprendimiento, para `vencidoDe`
export const fechasPasadasDe = (seguimientos = [], hoy) => seguimientos
  .map((s) => s.sesion?.fecha)
  .filter((f) => f && hoy && f < hoy);

// Misma regla que el servidor (services/inicio.js compromisosDe): un compromiso abierto vence
// cuando el emprendimiento ya tuvo una sesión posterior a la de origen (no tienen fecha límite).
export const vencidoDe = (compromiso, fechasPasadas = []) => {
  const origen = compromiso.seguimientoOrigen?.sesion?.fecha;
  return !!origen && fechasPasadas.some((f) => f > origen);
};
