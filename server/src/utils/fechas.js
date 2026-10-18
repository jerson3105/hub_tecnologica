// Zona horaria del negocio: las fechas DATEONLY (sesiones) se comparan con «hoy» en Perú,
// no con el «hoy» del servidor (que puede estar en UTC y adelantarse 5 horas).
const ZONA = process.env.APP_TZ || 'America/Lima';

// Fecha de hoy como 'YYYY-MM-DD' en la zona del negocio
const hoyLocal = (ahora = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);

// true si la fecha (DATEONLY 'YYYY-MM-DD') es posterior a hoy
const esFutura = (fecha, ahora = new Date()) => !!fecha && String(fecha).slice(0, 10) > hoyLocal(ahora);

module.exports = { hoyLocal, esFutura };
