const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const npsController = require('../controllers/npsController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/', [
  body('programa_id').isInt().withMessage('El programa es requerido'),
  body('puntuacion').isInt({ min: 0, max: 10 }).withMessage('La puntuación debe ser entre 0 y 10'),
  body('tipo').isIn(['taller', 'seguimiento', 'programa_medio', 'programa_final']).withMessage('Tipo inválido')
], validate, npsController.crear);

router.get('/mis-pendientes', npsController.misPendientes);

router.get('/promedios', npsController.promediosPorSesiones);

router.get('/programa/:programaId', esAdmin, npsController.obtenerPorPrograma);

router.get('/sesion/:sesionId', esAdmin, npsController.obtenerPorSesion);

router.get('/resumen', esAdmin, npsController.resumenGeneral);

module.exports = router;
