const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sesion = sequelize.define('Sesion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  programa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'programas',
      key: 'id'
    },
    comment: 'Nullable para sesiones multi-programa. Usar sesion_programas para la relacion real.'
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('seguimiento', 'taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final', 'uno_a_uno_programa', 'uno_a_uno_taller'),
    allowNull: false,
    defaultValue: 'seguimiento'
  },
  enlace_grabacion: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sesion_taller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sesiones',
      key: 'id'
    },
    comment: 'Para sesiones 1 a 1 de taller: referencia al taller padre'
  }
}, {
  tableName: 'sesiones'
});

module.exports = Sesion;
