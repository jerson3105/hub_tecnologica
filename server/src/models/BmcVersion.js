const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BmcVersion = sequelize.define('BmcVersion', {
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
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nombre descriptivo de la versión, ej: "Versión inicial", "Post-taller pivoteo"'
  },
  // 9 bloques del BMC
  socios_clave: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actividades_clave: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recursos_clave: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  propuesta_valor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  relacion_clientes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  canales: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  segmento_clientes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estructura_costos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fuentes_ingresos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Feedback del admin
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Retroalimentación del administrador'
  },
  feedback_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  feedback_fecha: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bmc_versiones',
  indexes: [
    {
      unique: true,
      fields: ['emprendimiento_id', 'version']
    }
  ]
});

module.exports = BmcVersion;
