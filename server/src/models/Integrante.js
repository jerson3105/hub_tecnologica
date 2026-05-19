const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Integrante = sequelize.define('Integrante', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  rol_emprendimiento: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Rol dentro del emprendimiento: líder, co-fundador, etc.'
  },
  es_lider: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si es líder puede agregar miembros a su equipo'
  }
}, {
  tableName: 'integrantes',
  indexes: [
    {
      unique: true,
      fields: ['emprendimiento_id', 'usuario_id']
    }
  ]
});

module.exports = Integrante;
