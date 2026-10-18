// Las columnas DATEONLY llegan como 'YYYY-MM-DD'. `new Date('2026-10-17')` las interpreta
// como medianoche UTC, que en Perú (UTC-5) se muestra como el día anterior. Aquí se
// construyen como fecha local; los timestamps completos (created_at) se dejan igual.
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const match = SOLO_FECHA.exec(String(valor));
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const formatFecha = (valor, opciones) => {
  const fecha = parseFecha(valor);
  return fecha ? fecha.toLocaleDateString('es-PE', opciones) : '';
};
