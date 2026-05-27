const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SesionPrograma = sequelize.define('SesionPrograma', {
  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: { model: 'sesiones', key: 'id' }
  },
  programa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: { model: 'programas', key: 'id' }
  }
}, {
  tableName: 'sesion_programas',
  timestamps: false
});

module.exports = SesionPrograma;
