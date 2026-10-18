// Estado de las sesiones (listado) y del registro de una ronda. Cálculos puros sobre filas cargadas.
const { TIPOS_CON_REGISTRO, tieneTexto, agruparPor, contadorDeRegistros, resumirNps } = require('./inicio');

const ESTADOS_ABIERTOS = ['planeado', 'en_progreso'];

const momentoDe = (fecha, hoy) => (fecha < hoy ? 'pasada' : fecha === hoy ? 'hoy' : 'proxima');

const datosSesion = (s) => ({
  id: s.id,
  titulo: s.titulo,
  descripcion: s.descripcion,
  fecha: s.fecha,
  tipo: s.tipo,
  hora_inicio: s.hora_inicio,
  hora_fin: s.hora_fin,
  modalidad: s.modalidad,
  lugar: s.lugar,
  enlace_reunion: s.enlace_reunion,
  enlace_grabacion: s.enlace_grabacion,
  programas: (s.programas || []).map((p) => ({ id: p.id, nombre: p.nombre }))
});

// Filas del listado para el equipo técnico: registros (solo en sesiones que los llevan),
// asistencia tomada y evaluación NPS de cada sesión
const resumirSesionesAdmin = ({ sesiones, emprendimientos, seguimientos, asistencias, nps, hoy }) => {
  const registrosDe = contadorDeRegistros({ emprendimientos, seguimientos });
  const asistenciaPorSesion = agruparPor(asistencias, 'sesion_id');
  const npsPorSesion = agruparPor(nps, 'sesion_id');
  return sesiones.map((s) => {
    const filasAsistencia = asistenciaPorSesion.get(s.id) || [];
    const respuestas = npsPorSesion.get(s.id) || [];
    const { total, registrados } = registrosDe(s);
    return {
      ...datosSesion(s),
      momento: momentoDe(s.fecha, hoy),
      participantes: total,
      registros: TIPOS_CON_REGISTRO.includes(s.tipo) ? { registrados, total } : null,
      asistencia: filasAsistencia.length
        ? { presentes: filasAsistencia.filter((a) => a.presente).length, total: filasAsistencia.length }
        : null,
      nps: respuestas.length ? { promedio: resumirNps(respuestas).promedio, total: respuestas.length } : null
    };
  });
};

// Filas del listado para un emprendedor: sus sesiones y si le falta evaluarlas (solo las ya
// ocurridas se pueden evaluar)
const resumirSesionesEmprendedor = ({ sesiones, evaluadas, hoy }) => sesiones.map((s) => {
  const momento = momentoDe(s.fecha, hoy);
  return {
    ...datosSesion(s),
    momento,
    evaluacion: momento === 'proxima' ? null : evaluadas.has(s.id) ? 'hecha' : 'pendiente'
  };
});

// Estado de un emprendimiento en la ronda: registrado (hay «lo trabajado»), no asistió (se tomó
// asistencia a su equipo y nadie estuvo) o pendiente
const estadoEnRonda = ({ seguimiento, equipo }) => {
  if (tieneTexto(seguimiento?.realizado)) return 'registrado';
  const tomada = equipo.filter((m) => m.presente !== null);
  if (equipo.length > 0 && tomada.length === equipo.length && tomada.every((m) => !m.presente)) return 'no_asistio';
  return 'pendiente';
};

// Todo lo que necesita la pantalla «Registrar ronda» para un emprendimiento
const filaDeRonda = ({ emprendimiento, sesion, seguimientos, integrantes, asistencias }) => {
  const actual = seguimientos.find((s) => s.sesion_id === sesion.id) || null;
  const presentes = new Map(asistencias.map((a) => [a.usuario_id, a.presente]));
  const equipo = integrantes.map((i) => ({
    usuario_id: i.usuario_id,
    nombre: i.usuario?.nombre || '',
    apellido: i.usuario?.apellido || '',
    rol: i.rol_emprendimiento || null,
    es_lider: !!i.es_lider,
    presente: presentes.has(i.usuario_id) ? !!presentes.get(i.usuario_id) : null
  }));

  // Compromisos de reuniones anteriores que siguen abiertos, más los que ya se revisaron en esta
  // (para que no desaparezcan de la pantalla al guardar su nuevo estado)
  const anteriores = seguimientos
    .filter((s) => s.sesion_id !== sesion.id && s.sesion?.fecha && s.sesion.fecha < sesion.fecha)
    .flatMap((s) => (s.compromisoItems || []).map((c) => ({ c, s })))
    .filter(({ c }) => ESTADOS_ABIERTOS.includes(c.estado) || (actual && c.seguimiento_revision_id === actual.id))
    .sort((a, b) => String(a.s.sesion.fecha).localeCompare(String(b.s.sesion.fecha)) || (a.c.orden ?? 0) - (b.c.orden ?? 0))
    .map(({ c, s }) => ({
      id: c.id,
      descripcion: c.descripcion,
      estado: c.estado,
      revisadoAqui: !!actual && c.seguimiento_revision_id === actual.id,
      sesion: { id: s.sesion.id, titulo: s.sesion.titulo, fecha: s.sesion.fecha }
    }));

  return {
    id: emprendimiento.id,
    nombre: emprendimiento.nombre,
    sector: emprendimiento.sector,
    programa: emprendimiento.programa ? { id: emprendimiento.programa.id, nombre: emprendimiento.programa.nombre } : null,
    seguimiento: actual
      ? { id: actual.id, realizado: actual.realizado || '', observaciones: actual.observaciones || '', enlace_grabacion: actual.enlace_grabacion || '' }
      : { id: null, realizado: '', observaciones: '', enlace_grabacion: '' },
    compromisos: [...(actual?.compromisoItems || [])]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((c) => ({ id: c.id, descripcion: c.descripcion, estado: c.estado })),
    anteriores,
    equipo,
    estado: estadoEnRonda({ seguimiento: actual, equipo })
  };
};

module.exports = {
  ESTADOS_ABIERTOS,
  momentoDe,
  datosSesion,
  resumirSesionesAdmin,
  resumirSesionesEmprendedor,
  estadoEnRonda,
  filaDeRonda
};
