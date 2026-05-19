const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asistencia = sequelize.define('Asistencia', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  presente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  observacion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'asistencias',
  indexes: [
    {
      unique: true,
      fields: ['sesion_id', 'usuario_id']
    }
  ]
});

module.exports = Asistencia;
