const { esAdmin } = require('./acceso');

// Campos del seguimiento que solo ve el equipo técnico: las observaciones de la ronda (el
// formulario dice «Solo las ve el equipo técnico») y el comentario del tallerista, que registra
// el equipo y solo se muestra en sus pantallas. Al emprendedor no se le envían.
const CAMPOS_INTERNOS_SEGUIMIENTO = ['observaciones', 'comentario_tallerista'];

// El seguimiento tal como lo puede recibir el usuario: al equipo técnico se le devuelve igual;
// a cualquier otro, como objeto plano y sin los campos internos
const seguimientoVisible = (usuario, seguimiento) => {
  if (!seguimiento || esAdmin(usuario)) return seguimiento;
  const datos = typeof seguimiento.toJSON === 'function' ? seguimiento.toJSON() : { ...seguimiento };
  CAMPOS_INTERNOS_SEGUIMIENTO.forEach((campo) => { delete datos[campo]; });
  return datos;
};

const seguimientosVisibles = (usuario, seguimientos) =>
  Array.isArray(seguimientos) ? seguimientos.map((s) => seguimientoVisible(usuario, s)) : seguimientos;

module.exports = { CAMPOS_INTERNOS_SEGUIMIENTO, seguimientoVisible, seguimientosVisibles };
