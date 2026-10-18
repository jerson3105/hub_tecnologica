const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const asistenciaController = require('../controllers/asistenciaController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// La asistencia (nombres y correos de los participantes) solo la gestiona el admin
router.use(verificarToken, esAdmin);

router.post('/', [
  body('sesion_id').isInt().withMessage('La sesión es requerida'),
  body('asistencias').isArray().withMessage('Las asistencias deben ser un arreglo')
], validate, asistenciaController.registrar);

router.get('/sesion/:sesionId', asistenciaController.obtenerPorSesion);

router.get('/emprendimiento/:emprendimientoId', asistenciaController.reportePorEmprendimiento);

module.exports = router;
