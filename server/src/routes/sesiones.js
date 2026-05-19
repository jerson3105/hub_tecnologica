const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sesionController = require('../controllers/sesionController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/', esAdmin, [
  body('programa_id').isInt().withMessage('El programa es requerido'),
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('fecha').isDate().withMessage('La fecha es requerida'),
  body('tipo').optional().isIn(['seguimiento', 'taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final', 'uno_a_uno_programa', 'uno_a_uno_taller'])
], validate, sesionController.crear);

router.get('/', sesionController.listar);

router.get('/:id', sesionController.obtenerPorId);

router.put('/:id', esAdmin, sesionController.actualizar);

router.delete('/:id', esAdmin, sesionController.eliminar);

module.exports = router;
