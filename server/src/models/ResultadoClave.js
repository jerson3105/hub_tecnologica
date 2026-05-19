const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResultadoClave = sequelize.define('ResultadoClave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  objetivo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'objetivos',
      key: 'id'
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'resultados_clave'
});

module.exports = ResultadoClave;
