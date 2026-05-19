const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
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
  url: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'evidencias'
});

module.exports = Evidencia;
