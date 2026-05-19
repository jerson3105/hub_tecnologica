const { Asistencia, Sesion, Usuario, Integrante, Emprendimiento } = require('../models');
const logger = require('../utils/logger');

const registrar = async (req, res) => {
  try {
    const { sesion_id, asistencias } = req.body;

    const sesion = await Sesion.findByPk(sesion_id);
    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const resultados = [];
    for (const item of asistencias) {
      const [asistencia, created] = await Asistencia.findOrCreate({
        where: { sesion_id, usuario_id: item.usuario_id },
        defaults: {
          presente: item.presente,
          observacion: item.observacion || null
        }
      });

      if (!created) {
        await asistencia.update({
          presente: item.presente,
          observacion: item.observacion || asistencia.observacion
        });
      }

      resultados.push(asistencia);
    }

    res.json({ mensaje: 'Asistencia registrada', asistencias: resultados });
  } catch (error) {
    logger.error('Error al registrar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;

    const asistencias = await Asistencia.findAll({
      where: { sesion_id: sesionId },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }
      ]
    });

    res.json({ asistencias });
  } catch (error) {
    logger.error('Error al obtener asistencias:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const reportePorEmprendimiento = async (req, res) => {
  try {
    const { emprendimientoId } = req.params;

    const integrantes = await Integrante.findAll({
      where: { emprendimiento_id: emprendimientoId },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido'],
          include: [
            {
              model: Asistencia,
              as: 'asistencias',
              include: [
                { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha', 'tipo'] }
              ]
            }
          ]
        }
      ]
    });

    res.json({ reporte: integrantes });
  } catch (error) {
    logger.error('Error al generar reporte:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { registrar, obtenerPorSesion, reportePorEmprendimiento };
