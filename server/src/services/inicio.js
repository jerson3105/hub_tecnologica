// Cálculos puros del Inicio del admin (sin base de datos, para poder probarlos).
// Las fechas son DATEONLY ('YYYY-MM-DD') y se comparan como texto.

const ESTADOS_ABIERTOS = ['planeado', 'en_progreso'];

// Sesiones en las que se espera un registro por emprendimiento (los talleres son grupales)
const TIPOS_CON_REGISTRO = ['seguimiento', 'uno_a_uno_programa', 'uno_a_uno_taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final'];

const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const diasEntre = (desde, hasta) =>
  Math.round((new Date(`${hasta}T12:00:00Z`) - new Date(`${desde}T12:00:00Z`)) / 86400000);

const tieneTexto = (valor) => typeof valor === 'string' && valor.trim().length > 0;

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : null);

// Un compromiso abierto está vencido si el emprendimiento ya tuvo una sesión posterior a la de
// origen (los compromisos no tienen fecha límite: vencen con la siguiente sesión).
const compromisosDe = (seguimientos, hoy) => {
  const fechasPasadas = seguimientos
    .map((s) => s.sesion?.fecha)
    .filter((f) => f && f < hoy);
  let abiertos = 0;
  let vencidos = 0;
  seguimientos.forEach((seg) => {
    const origen = seg.sesion?.fecha;
    (seg.compromisoItems || []).forEach((c) => {
      if (!ESTADOS_ABIERTOS.includes(c.estado)) return;
      abiertos += 1;
      if (origen && fechasPasadas.some((f) => f > origen)) vencidos += 1;
    });
  });
  return { abiertos, vencidos };
};

// Avance medio de las actividades OKR (cada actividad cuenta hasta su meta)
const avanceOkr = (actividades) => {
  if (!actividades.length) return null;
  const suma = actividades.reduce((total, a) => {
    const meta = Number(a.meta_numerica);
    const real = Number(a.meta_real);
    if (!(meta > 0)) return total + (a.estado === 'completado' ? 1 : 0);
    return total + Math.min(Math.max(real, 0) / meta, 1);
  }, 0);
  return Math.round((suma / actividades.length) * 100);
};

// % de sesiones pasadas con asistencia tomada en las que estuvo al menos un integrante
const asistenciaDe = ({ seguimientos, hoy, usuarios, sesionesConAsistencia, presentesPorSesion }) => {
  const sesiones = seguimientos
    .map((s) => s.sesion)
    .filter((s) => s && s.fecha <= hoy && sesionesConAsistencia.has(s.id));
  const presentes = sesiones.filter((s) => {
    const enSesion = presentesPorSesion.get(s.id);
    return enSesion && [...usuarios].some((u) => enSesion.has(u));
  }).length;
  return porcentaje(presentes, sesiones.length);
};

// Fila de la cartera de un emprendimiento
const resumirEmprendimiento = ({ emprendimiento, seguimientos, hoy, usuarios, actividades, sesionesConAsistencia, presentesPorSesion }) => {
  const reuniones = seguimientos
    .filter((s) => s.sesion?.fecha && s.sesion.fecha <= hoy && tieneTexto(s.realizado))
    .map((s) => s.sesion.fecha)
    .sort();
  const ultimaReunion = reuniones.length ? reuniones[reuniones.length - 1] : null;
  const { abiertos, vencidos } = compromisosDe(seguimientos, hoy);
  return {
    id: emprendimiento.id,
    nombre: emprendimiento.nombre,
    sector: emprendimiento.sector,
    estado: emprendimiento.estado,
    programa: emprendimiento.programa ? { id: emprendimiento.programa.id, nombre: emprendimiento.programa.nombre } : null,
    ultimaReunion,
    diasSinReunion: ultimaReunion ? diasEntre(ultimaReunion, hoy) : null,
    abiertos,
    vencidos,
    okr: avanceOkr(actividades),
    asistencia: asistenciaDe({ seguimientos, hoy, usuarios, sesionesConAsistencia, presentesPorSesion })
  };
};

// Orden de la cartera: primero lo que requiere atención. Sin reuniones aún (recién llegados)
// va al final: no hay un «hace cuánto» que vigilar.
const ordenarCartera = (filas) => [...filas].sort((a, b) =>
  (b.vencidos - a.vencidos) ||
  ((b.diasSinReunion ?? -1) - (a.diasSinReunion ?? -1)) ||
  ((a.okr ?? 101) - (b.okr ?? 101)) ||
  a.nombre.localeCompare(b.nombre, 'es')
);

// Distribución NPS (escala 1-10): detractores ≤ 6, pasivos 7-8, promotores 9-10
const resumirNps = (respuestas) => {
  const total = respuestas.length;
  if (!total) return { total: 0, promedio: null, detractores: 0, pasivos: 0, promotores: 0 };
  const cuenta = (filtro) => respuestas.filter(filtro).length;
  const suma = respuestas.reduce((s, r) => s + Number(r.puntuacion || 0), 0);
  return {
    total,
    promedio: Math.round((suma / total) * 10) / 10,
    detractores: porcentaje(cuenta((r) => r.puntuacion <= 6), total),
    pasivos: porcentaje(cuenta((r) => r.puntuacion >= 7 && r.puntuacion <= 8), total),
    promotores: porcentaje(cuenta((r) => r.puntuacion >= 9), total)
  };
};

module.exports = {
  ESTADOS_ABIERTOS,
  TIPOS_CON_REGISTRO,
  sumarDias,
  diasEntre,
  tieneTexto,
  porcentaje,
  compromisosDe,
  avanceOkr,
  asistenciaDe,
  resumirEmprendimiento,
  ordenarCartera,
  resumirNps
};
