const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sesionController = require('../controllers/sesionController');
const sesionResumenController = require('../controllers/sesionResumenController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const TIPOS = ['seguimiento', 'taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final', 'uno_a_uno_programa', 'uno_a_uno_taller'];
const HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const vacio = (v) => v === undefined || v === null || v === '';

// Horario, modalidad y enlaces: opcionales en crear y editar (cadena vacía = quitar el dato)
const validarHorario = [
  body('hora_inicio').optional({ values: 'falsy' }).matches(HORA).withMessage('Hora de inicio inválida'),
  body('hora_fin').optional({ values: 'falsy' }).matches(HORA).withMessage('Hora de fin inválida')
    .custom((fin, { req }) => vacio(req.body.hora_inicio) || fin > req.body.hora_inicio)
    .withMessage('La hora de fin debe ser posterior a la de inicio'),
  body('modalidad').optional({ values: 'falsy' }).isIn(['presencial', 'virtual', 'hibrida']).withMessage('Modalidad inválida'),
  body('lugar').optional({ values: 'falsy' }).isLength({ max: 200 }).withMessage('El lugar admite hasta 200 caracteres'),
  body('enlace_reunion').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('El enlace de la reunión debe empezar por http:// o https://'),
  body('enlace_grabacion').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('El enlace de la grabación debe empezar por http:// o https://')
];

router.use(verificarToken);

router.post('/', esAdmin, [
  body('programa_ids').isArray({ min: 1 }).withMessage('Debe seleccionar al menos un programa'),
  body('programa_ids.*').isInt().withMessage('ID de programa inválido'),
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('fecha').isDate().withMessage('La fecha es requerida'),
  body('tipo').optional().isIn(TIPOS),
  ...validarHorario
], validate, sesionController.crear);

router.get('/', sesionController.listar);

// Listado con estado (registros, asistencia, evaluación) y registro de una ronda.
// Antes de /:id para que «resumen» no se tome como id.
router.get('/resumen', sesionResumenController.listarResumen);
router.get('/:id/registro', esAdmin, sesionResumenController.obtenerRegistro);
router.put('/:id/registro/:emprendimientoId', esAdmin, sesionResumenController.guardarRegistro);

router.get('/:id', sesionController.obtenerPorId);

router.put('/:id', esAdmin, [
  body('fecha').optional().isDate().withMessage('Fecha inválida'),
  body('tipo').optional().isIn(TIPOS),
  ...validarHorario
], validate, sesionController.actualizar);

router.delete('/:id', esAdmin, sesionController.eliminar);

module.exports = router;
