// Resumen de un programa (listado y detalle de Programas). Cálculos puros sobre filas ya cargadas.
const {
  TIPOS_CON_REGISTRO, diasEntre, porcentaje, agruparPor, construirCartera, contadorDeRegistros,
  compromisosDe, resumirNps
} = require('./inicio');

const sesionResumida = (s) => (s ? { id: s.id, titulo: s.titulo, fecha: s.fecha, tipo: s.tipo } : null);

// Dónde está hoy el programa en su calendario. La fase sale de las fechas; el estado guardado
// (planificado / en curso / finalizado) lo cambia el equipo a mano y puede ir desfasado.
const periodoDe = ({ fecha_inicio: inicio, fecha_fin: fin }, hoy) => {
  if (!inicio || !fin) return null;
  const total = Math.max(diasEntre(inicio, fin), 1);
  const semanas = Math.ceil((total + 1) / 7);
  if (hoy < inicio) return { fase: 'por_empezar', porcentaje: 0, semana: null, semanas, diasParaEmpezar: diasEntre(hoy, inicio) };
  if (hoy > fin) return { fase: 'terminado', porcentaje: 100, semana: null, semanas, diasDesdeFin: diasEntre(fin, hoy) };
  const transcurridos = diasEntre(inicio, hoy);
  return {
    fase: 'en_curso',
    porcentaje: Math.round((transcurridos / total) * 100),
    semana: Math.min(Math.floor(transcurridos / 7) + 1, semanas),
    semanas,
    diasParaTerminar: diasEntre(hoy, fin)
  };
};

// Resumen completo de un programa. `sesiones` son las del programa, `emprendimientos` los suyos
// sin retirados, `nps` las respuestas de sus integrantes y `asistencia` el índice de
// indexarAsistencias para esas sesiones.
const resumirPrograma = ({ programa, hoy, emprendimientos, sesiones, seguimientos, integrantes, objetivos, nps, asistencia }) => {
  const { sesionesConAsistencia, presentesPorSesion, totalesPorSesion } = asistencia;
  const registrosDe = contadorDeRegistros({ emprendimientos, seguimientos });
  const npsPorSesion = agruparPor(nps.filter((r) => r.sesion_id), 'sesion_id');
  const segPorEmp = agruparPor(seguimientos, 'emprendimiento_id');

  const filasSesiones = sesiones.map((s) => {
    const conRegistro = TIPOS_CON_REGISTRO.includes(s.tipo);
    const { total, registrados } = registrosDe(s);
    const totalAsistencia = totalesPorSesion.get(s.id) || 0;
    const respuestas = npsPorSesion.get(s.id) || [];
    return {
      ...sesionResumida(s),
      momento: s.fecha < hoy ? 'pasada' : s.fecha === hoy ? 'hoy' : 'proxima',
      registros: conRegistro ? { registrados, total } : null,
      asistencia: totalAsistencia ? porcentaje(presentesPorSesion.get(s.id)?.size || 0, totalAsistencia) : null,
      nps: respuestas.length ? resumirNps(respuestas) : null
    };
  });

  const pasadas = filasSesiones.filter((s) => s.momento === 'pasada');
  const registrosPendientes = pasadas.reduce((t, s) => t + (s.registros ? s.registros.total - s.registros.registrados : 0), 0);
  const vencidos = emprendimientos.map((e) => compromisosDe(segPorEmp.get(e.id) || [], hoy).vencidos);
  const conAsistencia = sesiones.filter((s) => s.fecha <= hoy && totalesPorSesion.get(s.id));
  const presentes = conAsistencia.reduce((t, s) => t + (presentesPorSesion.get(s.id)?.size || 0), 0);
  const filasAsistencia = conAsistencia.reduce((t, s) => t + totalesPorSesion.get(s.id), 0);
  const idsConAsistencia = new Set(conAsistencia.map((s) => s.id));
  const respuestasDePresentes = nps.filter((r) => idsConAsistencia.has(r.sesion_id) && presentesPorSesion.get(r.sesion_id)?.has(r.usuario_id)).length;
  const resumenNps = resumirNps(nps);

  return {
    periodo: periodoDe(programa, hoy),
    kpis: {
      emprendimientosActivos: emprendimientos.filter((e) => e.estado === 'activo').length,
      emprendimientosGraduados: emprendimientos.filter((e) => e.estado === 'graduado').length,
      sesionesTotales: sesiones.length,
      sesionesRealizadas: pasadas.length,
      registrosPendientes,
      compromisosVencidos: vencidos.reduce((t, n) => t + n, 0),
      emprendimientosConVencidos: vencidos.filter((n) => n > 0).length,
      npsPromedio: resumenNps.promedio,
      asistenciaMedia: porcentaje(presentes, filasAsistencia)
    },
    proximaSesion: sesionResumida(sesiones.find((s) => s.fecha >= hoy)),
    sesiones: filasSesiones,
    cartera: construirCartera({ emprendimientos, seguimientos, integrantes, objetivos, hoy, sesionesConAsistencia, presentesPorSesion }),
    pulso: {
      nps: resumenNps,
      asistencia: {
        media: porcentaje(presentes, filasAsistencia),
        sesiones: filasSesiones.filter((s) => idsConAsistencia.has(s.id)).slice(-8)
          .map((s) => ({ id: s.id, titulo: s.titulo, fecha: s.fecha, porcentaje: s.asistencia }))
      },
      respuesta: { tasa: porcentaje(respuestasDePresentes, presentes), respuestas: respuestasDePresentes, presentes }
    }
  };
};

module.exports = { periodoDe, resumirPrograma };
