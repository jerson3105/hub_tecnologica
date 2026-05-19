const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArchivoEmprendimiento = sequelize.define('ArchivoEmprendimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  archivo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'archivos',
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
  }
}, {
  tableName: 'archivo_emprendimientos',
  indexes: [
    {
      unique: true,
      fields: ['archivo_id', 'emprendimiento_id']
    }
  ]
});

module.exports = ArchivoEmprendimiento;
