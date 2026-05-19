const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mentor = sequelize.define('Mentor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  linkedin: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  calendly: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  biografia: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sesiones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de sesiones que puede trabajar'
  },
  startups: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de tipos de startups que puede trabajar'
  },
  ods: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de ODS en los que se especializa'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'mentores'
});

module.exports = Mentor;
