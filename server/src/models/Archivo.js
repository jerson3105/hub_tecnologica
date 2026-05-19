const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Archivo = sequelize.define('Archivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('archivo', 'enlace'),
    allowNull: false,
    defaultValue: 'archivo',
    comment: 'Si es un archivo subido o un enlace externo'
  },
  nombre_original: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ruta: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: 'URL del enlace externo'
  },
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tamanio: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  categoria: {
    type: DataTypes.ENUM('bmc', 'taller', 'entregable', 'grabacion', 'otro'),
    allowNull: false,
    defaultValue: 'otro'
  },
  sesion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sesiones',
      key: 'id'
    }
  },
  subido_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'archivos',
  indexes: [
    { fields: ['sesion_id'] },
    { fields: ['subido_por'] },
    { fields: ['categoria'] }
  ]
});

module.exports = Archivo;
