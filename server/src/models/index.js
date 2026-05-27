const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Programa = require('./Programa');
const Emprendimiento = require('./Emprendimiento');
const Integrante = require('./Integrante');
const Sesion = require('./Sesion');
const SesionPrograma = require('./SesionPrograma');
const Seguimiento = require('./Seguimiento');
const Archivo = require('./Archivo');
const ArchivoEmprendimiento = require('./ArchivoEmprendimiento');
const Asistencia = require('./Asistencia');
const Nps = require('./Nps');
const OnePager = require('./OnePager');
const BmcVersion = require('./BmcVersion');
const Mentor = require('./Mentor');
const Objetivo = require('./Objetivo');
const ResultadoClave = require('./ResultadoClave');
const ActividadOKR = require('./ActividadOKR');
const Evidencia = require('./Evidencia');
const Compromiso = require('./Compromiso');

// === ASOCIACIONES ===

// Programa -> Emprendimientos
Programa.hasMany(Emprendimiento, { foreignKey: 'programa_id', as: 'emprendimientos' });
Emprendimiento.belongsTo(Programa, { foreignKey: 'programa_id', as: 'programa' });

// Emprendimiento -> Integrantes -> Usuario
Emprendimiento.hasMany(Integrante, { foreignKey: 'emprendimiento_id', as: 'integrantes' });
Integrante.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id', as: 'emprendimiento' });

Usuario.hasMany(Integrante, { foreignKey: 'usuario_id', as: 'integrantes' });
Integrante.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Programa -> Sesiones (legacy: sesiones con programa_id directo)
Programa.hasMany(Sesion, { foreignKey: 'programa_id', as: 'sesiones' });
Sesion.belongsTo(Programa, { foreignKey: 'programa_id', as: 'programa' });

// Sesion <-> Programa many-to-many via sesion_programas (sesiones multi-programa)
Sesion.belongsToMany(Programa, { through: SesionPrograma, foreignKey: 'sesion_id', otherKey: 'programa_id', as: 'programas' });
Programa.belongsToMany(Sesion, { through: SesionPrograma, foreignKey: 'programa_id', otherKey: 'sesion_id', as: 'sesionesMixtas' });
SesionPrograma.belongsTo(Sesion, { foreignKey: 'sesion_id' });
SesionPrograma.belongsTo(Programa, { foreignKey: 'programa_id' });

// Sesion + Emprendimiento -> Seguimiento
Sesion.hasMany(Seguimiento, { foreignKey: 'sesion_id', as: 'seguimientos' });
Seguimiento.belongsTo(Sesion, { foreignKey: 'sesion_id', as: 'sesion' });

Emprendimiento.hasMany(Seguimiento, { foreignKey: 'emprendimiento_id', as: 'seguimientos' });
Seguimiento.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id', as: 'emprendimiento' });

// Archivos - Many to Many con Emprendimientos
Archivo.belongsToMany(Emprendimiento, { through: ArchivoEmprendimiento, foreignKey: 'archivo_id', otherKey: 'emprendimiento_id', as: 'emprendimientos' });
Emprendimiento.belongsToMany(Archivo, { through: ArchivoEmprendimiento, foreignKey: 'emprendimiento_id', otherKey: 'archivo_id', as: 'archivos' });

ArchivoEmprendimiento.belongsTo(Archivo, { foreignKey: 'archivo_id' });
ArchivoEmprendimiento.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id' });
Archivo.hasMany(ArchivoEmprendimiento, { foreignKey: 'archivo_id', as: 'archivoEmprendimientos' });

Sesion.hasMany(Archivo, { foreignKey: 'sesion_id', as: 'archivos' });
Archivo.belongsTo(Sesion, { foreignKey: 'sesion_id', as: 'sesion' });

Usuario.hasMany(Archivo, { foreignKey: 'subido_por', as: 'archivos' });
Archivo.belongsTo(Usuario, { foreignKey: 'subido_por', as: 'subidoPor' });

// Asistencias
Sesion.hasMany(Asistencia, { foreignKey: 'sesion_id', as: 'asistencias' });
Asistencia.belongsTo(Sesion, { foreignKey: 'sesion_id', as: 'sesion' });

Usuario.hasMany(Asistencia, { foreignKey: 'usuario_id', as: 'asistencias' });
Asistencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// OnePager
Emprendimiento.hasOne(OnePager, { foreignKey: 'emprendimiento_id', as: 'onePager' });
OnePager.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id', as: 'emprendimiento' });

// BMC Versiones
Emprendimiento.hasMany(BmcVersion, { foreignKey: 'emprendimiento_id', as: 'bmcVersiones' });
BmcVersion.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id', as: 'emprendimiento' });

Usuario.hasMany(BmcVersion, { foreignKey: 'feedback_por', as: 'bmcFeedbacks' });
BmcVersion.belongsTo(Usuario, { foreignKey: 'feedback_por', as: 'feedbackUsuario' });

// NPS
Sesion.hasMany(Nps, { foreignKey: 'sesion_id', as: 'nps' });
Nps.belongsTo(Sesion, { foreignKey: 'sesion_id', as: 'sesion' });

Programa.hasMany(Nps, { foreignKey: 'programa_id', as: 'nps' });
Nps.belongsTo(Programa, { foreignKey: 'programa_id', as: 'programa' });

Usuario.hasMany(Nps, { foreignKey: 'usuario_id', as: 'nps' });
Nps.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Objetivos OKR
Emprendimiento.hasMany(Objetivo, { foreignKey: 'emprendimiento_id', as: 'objetivos' });
Objetivo.belongsTo(Emprendimiento, { foreignKey: 'emprendimiento_id', as: 'emprendimiento' });

Objetivo.hasMany(ResultadoClave, { foreignKey: 'objetivo_id', as: 'resultadosClave' });
ResultadoClave.belongsTo(Objetivo, { foreignKey: 'objetivo_id', as: 'objetivo' });

ResultadoClave.hasMany(ActividadOKR, { foreignKey: 'resultado_clave_id', as: 'actividades' });
ActividadOKR.belongsTo(ResultadoClave, { foreignKey: 'resultado_clave_id', as: 'resultadoClave' });

Objetivo.hasMany(Evidencia, { foreignKey: 'objetivo_id', as: 'evidencias' });
Evidencia.belongsTo(Objetivo, { foreignKey: 'objetivo_id', as: 'objetivo' });

// Compromisos de seguimiento
Seguimiento.hasMany(Compromiso, { foreignKey: 'seguimiento_id', as: 'compromisoItems' });
Compromiso.belongsTo(Seguimiento, { foreignKey: 'seguimiento_id', as: 'seguimientoOrigen' });

Seguimiento.hasMany(Compromiso, { foreignKey: 'seguimiento_revision_id', as: 'compromisosRevisados' });
Compromiso.belongsTo(Seguimiento, { foreignKey: 'seguimiento_revision_id', as: 'seguimientoRevision' });

module.exports = {
  sequelize,
  Usuario,
  Programa,
  Emprendimiento,
  Integrante,
  Sesion,
  SesionPrograma,
  Seguimiento,
  Archivo,
  ArchivoEmprendimiento,
  Asistencia,
  Nps,
  OnePager,
  BmcVersion,
  Mentor,
  Objetivo,
  ResultadoClave,
  ActividadOKR,
  Evidencia,
  Compromiso
};
