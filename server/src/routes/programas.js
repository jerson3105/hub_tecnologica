const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const programaController = require('../controllers/programaController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/', esAdmin, [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('fecha_inicio').isDate().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').isDate().withMessage('Fecha de fin inválida'),
  body('frecuencia_seguimiento').optional().isIn(['semanal', 'quincenal'])
], validate, programaController.crear);

router.get('/', programaController.listar);

router.get('/:id', programaController.obtenerPorId);

router.put('/:id', esAdmin, programaController.actualizar);

router.delete('/:id', esAdmin, programaController.eliminar);

module.exports = router;
