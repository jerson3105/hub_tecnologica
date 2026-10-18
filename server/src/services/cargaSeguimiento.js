const { Seguimiento, Sesion, Compromiso, Integrante, Usuario, Objetivo, ResultadoClave, ActividadOKR, Asistencia } = require('../models');

// Filas que necesitan construirCartera / resumirEmprendimiento para una lista de emprendimientos:
// sus seguimientos (con sesión y compromisos), integrantes, objetivos activos con actividades y la
// asistencia de las sesiones ya ocurridas. `sesionesExtra` añade sesiones cuya asistencia también
// hace falta (por ejemplo, todas las de un programa).
const cargarFilasDeEmprendimientos = async (empIds, hoy, { sesionesExtra = [] } = {}) => {
  if (!empIds.length) return { seguimientos: [], integrantes: [], objetivos: [], asistencias: [] };

  const [seguimientos, integrantes, objetivos] = await Promise.all([
    Seguimiento.findAll({
      where: { emprendimiento_id: empIds },
      attributes: ['id', 'sesion_id', 'emprendimiento_id', 'realizado'],
      include: [
        { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha', 'tipo'] },
        { model: Compromiso, as: 'compromisoItems', attributes: ['id', 'estado'] }
      ]
    }),
    Integrante.findAll({
      where: { emprendimiento_id: empIds },
      attributes: ['emprendimiento_id', 'usuario_id', 'es_lider'],
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }]
    }),
    Objetivo.findAll({
      where: { emprendimiento_id: empIds, activo: true },
      attributes: ['id', 'emprendimiento_id'],
      include: [{
        model: ResultadoClave, as: 'resultadosClave', attributes: ['id'],
        include: [{ model: ActividadOKR, as: 'actividades', attributes: ['meta_numerica', 'meta_real', 'estado'] }]
      }]
    })
  ]);

  const idsSesiones = [...new Set([
    ...seguimientos.filter((s) => s.sesion?.fecha && s.sesion.fecha <= hoy).map((s) => s.sesion_id),
    ...sesionesExtra
  ])];
  const asistencias = idsSesiones.length
    ? await Asistencia.findAll({ where: { sesion_id: idsSesiones }, attributes: ['sesion_id', 'usuario_id', 'presente'] })
    : [];

  return { seguimientos, integrantes, objetivos, asistencias };
};

module.exports = { cargarFilasDeEmprendimientos };
