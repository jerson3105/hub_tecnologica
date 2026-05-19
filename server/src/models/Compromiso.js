const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compromiso = sequelize.define('Compromiso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  seguimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'seguimientos',
      key: 'id'
    },
    comment: 'Seguimiento donde se creó el compromiso'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('planeado', 'en_progreso', 'completado', 'no_logrado'),
    allowNull: false,
    defaultValue: 'planeado'
  },
  seguimiento_revision_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'seguimientos',
      key: 'id'
    },
    comment: 'Seguimiento donde se revisó/actualizó el estado del compromiso'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'compromisos'
});

module.exports = Compromiso;
