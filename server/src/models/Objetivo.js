const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Objetivo = sequelize.define('Objetivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  emprendimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'emprendimientos',
      key: 'id'
    }
  },
  titulo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('ventas', 'marketing', 'producto_desarrollo', 'financiero', 'legal', 'talento_rrhh'),
    allowNull: false
  },
  fecha_limite: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'objetivos'
});

module.exports = Objetivo;
