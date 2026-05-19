const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Nps = sequelize.define('Nps', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  },
  programa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'programas',
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
  puntuacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 10 }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('taller', 'seguimiento', 'programa_medio', 'programa_final'),
    allowNull: false
  },
  areas_mejora: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'nps',
  indexes: [
    { fields: ['sesion_id'] },
    { fields: ['programa_id'] },
    { fields: ['usuario_id'] },
    { unique: true, fields: ['sesion_id', 'usuario_id', 'tipo'] }
  ]
});

module.exports = Nps;
