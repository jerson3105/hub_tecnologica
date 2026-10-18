const { Op } = require('sequelize');
const { Seguimiento, SesionPrograma, Emprendimiento } = require('../models');

// Hay un seguimiento por sesión y emprendimiento. Se crean al escribir datos (crear o editar los
// programas de una sesión, crear un emprendimiento o moverlo de programa), no al leer el
// timeline: un GET no debe escribir en la base de datos.

const crearFaltantes = async (pares) => {
  if (pares.length === 0) return 0;
  // El índice único (sesion_id, emprendimiento_id) protege de duplicados si dos peticiones coinciden
  await Seguimiento.bulkCreate(
    pares.map((p) => ({ ...p, estado_avance: 'sin_iniciar' })),
    { ignoreDuplicates: true }
  );
  return pares.length;
};

// Seguimientos de una sesión para los emprendimientos activos de sus programas
const asegurarSeguimientosDeSesion = async (sesionId) => {
  const programas = await SesionPrograma.findAll({ where: { sesion_id: sesionId }, attributes: ['programa_id'] });
  const programaIds = [...new Set(programas.map((p) => p.programa_id))];
  if (programaIds.length === 0) return 0;

  const emprendimientos = await Emprendimiento.findAll({
    where: { programa_id: programaIds, estado: { [Op.ne]: 'retirado' } },
    attributes: ['id']
  });
  const existentes = await Seguimiento.findAll({ where: { sesion_id: sesionId }, attributes: ['emprendimiento_id'] });
  const yaTienen = new Set(existentes.map((s) => s.emprendimiento_id));

  return crearFaltantes(
    emprendimientos
      .filter((e) => !yaTienen.has(e.id))
      .map((e) => ({ sesion_id: Number(sesionId), emprendimiento_id: e.id }))
  );
};

// Seguimientos de un emprendimiento para todas las sesiones de su programa
const asegurarSeguimientosDeEmprendimiento = async (emprendimientoId) => {
  const emprendimiento = await Emprendimiento.findByPk(emprendimientoId, { attributes: ['id', 'programa_id', 'estado'] });
  if (!emprendimiento || !emprendimiento.programa_id || emprendimiento.estado === 'retirado') return 0;

  const sesiones = await SesionPrograma.findAll({ where: { programa_id: emprendimiento.programa_id }, attributes: ['sesion_id'] });
  const existentes = await Seguimiento.findAll({ where: { emprendimiento_id: emprendimiento.id }, attributes: ['sesion_id'] });
  const yaTiene = new Set(existentes.map((s) => s.sesion_id));

  return crearFaltantes(
    [...new Set(sesiones.map((s) => s.sesion_id))]
      .filter((id) => !yaTiene.has(id))
      .map((sesionId) => ({ sesion_id: sesionId, emprendimiento_id: emprendimiento.id }))
  );
};

module.exports = { asegurarSeguimientosDeSesion, asegurarSeguimientosDeEmprendimiento };
