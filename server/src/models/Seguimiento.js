const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seguimiento = sequelize.define('Seguimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  },
  emprendimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'emprendimientos',
      key: 'id'
    }
  },
  realizado: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Lo realizado en la sesión'
  },
  compromisos: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Compromisos para la siguiente sesión'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado_avance: {
    type: DataTypes.ENUM('sin_iniciar', 'en_progreso', 'avanzado', 'completado'),
    allowNull: false,
    defaultValue: 'en_progreso'
  },
  enlace_grabacion: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Enlace a la grabación individual de esta reunión de seguimiento'
  },
  comentario_emprendedor: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentario del emprendedor (usado en sesiones 1 a 1 de taller)'
  },
  comentario_tallerista: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentario del tallerista registrado por el admin (usado en sesiones 1 a 1 de taller)'
  }
}, {
  tableName: 'seguimientos',
  indexes: [
    {
      unique: true,
      fields: ['sesion_id', 'emprendimiento_id']
    }
  ]
});

module.exports = Seguimiento;
