const { Emprendimiento, Integrante, Usuario, Programa } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

const obtenerIndicadores = async (req, res) => {
  try {
    // Obtener todos los programas
    const programas = await Programa.findAll({
      attributes: ['id', 'nombre', 'estado'],
      order: [['nombre', 'ASC']]
    });

    // Obtener todos los emprendimientos con sus integrantes y usuarios
    const emprendimientos = await Emprendimiento.findAll({
      include: [{
        model: Integrante,
        as: 'integrantes',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'genero']
        }]
      }]
    });

    // Calcular indicadores globales
    const totalEmprendimientos = emprendimientos.length;
    let totalEmpleos = 0;
    let totalMujeresLideres = 0;
    let totalMujeresEmprendedoras = 0;
    const usuariosContados = new Set();

    emprendimientos.forEach(emp => {
      totalEmpleos += emp.empleos_generados || 0;
      
      emp.integrantes?.forEach(int => {
        const genero = int.usuario?.genero;
        const usuarioId = int.usuario?.id;
        
        if (genero === 'femenino') {
          if (int.es_lider) {
            totalMujeresLideres++;
          }
          if (usuarioId && !usuariosContados.has(usuarioId)) {
            totalMujeresEmprendedoras++;
            usuariosContados.add(usuarioId);
          }
        }
      });
    });

    // Calcular indicadores por programa
    const porPrograma = programas.map(prog => {
      const empsDelPrograma = emprendimientos.filter(e => e.programa_id === prog.id);
      let empleos = 0;
      let mujeresLideres = 0;
      let mujeresEmprendedoras = 0;
      const usuariosProg = new Set();

      empsDelPrograma.forEach(emp => {
        empleos += emp.empleos_generados || 0;
        
        emp.integrantes?.forEach(int => {
          const genero = int.usuario?.genero;
          const usuarioId = int.usuario?.id;
          
          if (genero === 'femenino') {
            if (int.es_lider) {
              mujeresLideres++;
            }
            if (usuarioId && !usuariosProg.has(usuarioId)) {
              mujeresEmprendedoras++;
              usuariosProg.add(usuarioId);
            }
          }
        });
      });

      return {
        programa_id: prog.id,
        programa_nombre: prog.nombre,
        programa_estado: prog.estado,
        emprendimientos: empsDelPrograma.length,
        empleos_generados: empleos,
        mujeres_lideres: mujeresLideres,
        mujeres_emprendedoras: mujeresEmprendedoras
      };
    });

    res.json({
      totales: {
        emprendimientos: totalEmprendimientos,
        empleos_generados: totalEmpleos,
        mujeres_lideres: totalMujeresLideres,
        mujeres_emprendedoras: totalMujeresEmprendedoras
      },
      por_programa: porPrograma
    });
  } catch (error) {
    logger.error('Error al obtener indicadores:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { obtenerIndicadores };
