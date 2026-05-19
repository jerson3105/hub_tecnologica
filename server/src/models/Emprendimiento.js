const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emprendimiento = sequelize.define('Emprendimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sector: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'retirado', 'graduado'),
    allowNull: false,
    defaultValue: 'activo'
  },
  programa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'programas',
      key: 'id'
    }
  },
  empleos_generados: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Cantidad de empleos generados por el emprendimiento'
  }
}, {
  tableName: 'emprendimientos'
});

module.exports = Emprendimiento;
