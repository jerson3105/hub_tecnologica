const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActividadOKR = sequelize.define('ActividadOKR', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  resultado_clave_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'resultados_clave',
      key: 'id'
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  meta_numerica: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 1
  },
  meta_real: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.ENUM('planeado', 'en_progreso', 'completado', 'no_logrado'),
    allowNull: false,
    defaultValue: 'planeado'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'actividades_okr'
});

module.exports = ActividadOKR;
