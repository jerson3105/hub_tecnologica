const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OnePager = sequelize.define('OnePager', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  emprendimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'emprendimientos',
      key: 'id'
    }
  },
  // Información general
  estado_proyecto: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ej: Idea, Prototipo, MVP, Operando'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Redes y contacto
  pagina_web: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  facebook: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  instagram: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  twitter: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  youtube: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  linkedin: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  otros_links: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  correo_proyecto: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Enlace al logo en Drive u otro servicio'
  },
  // Contenido clave
  problematica: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Problemática / Oportunidad'
  },
  solucion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Solución / Propuesta de valor'
  },
  modelo_negocio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mercado_objetivo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mercado objetivo / Clientes'
  },
  ventaja_competitiva: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hitos: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Hitos / Logros alcanzados'
  },
  necesidades: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Necesidades del proyecto'
  },
  estado_actual: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Estado actual / Tracción'
  }
}, {
  tableName: 'one_pagers'
});

module.exports = OnePager;
