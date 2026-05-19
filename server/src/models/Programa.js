const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Programa = sequelize.define('Programa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  frecuencia_seguimiento: {
    type: DataTypes.ENUM('semanal', 'quincenal'),
    allowNull: false,
    defaultValue: 'semanal'
  },
  estado: {
    type: DataTypes.ENUM('planificado', 'en_curso', 'finalizado'),
    allowNull: false,
    defaultValue: 'planificado'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'programas'
});

module.exports = Programa;
