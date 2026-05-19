const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const seguimientoController = require('../controllers/seguimientoController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/', esAdmin, [
  body('sesion_id').isInt().withMessage('La sesión es requerida')
], validate, seguimientoController.crear);

router.get('/emprendimiento/:emprendimientoId', seguimientoController.listarPorEmprendimiento);

router.get('/:id', seguimientoController.obtenerPorId);

router.put('/:id', esAdmin, seguimientoController.actualizar);

router.delete('/:id', esAdmin, seguimientoController.eliminar);

module.exports = router;
