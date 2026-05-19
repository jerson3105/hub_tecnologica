const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const ctrl = require('../controllers/compromisoController');

// Timeline de un emprendimiento
router.get('/timeline/:emprendimiento_id', verificarToken, ctrl.timelineEmprendimiento);

// Compromisos por seguimiento
router.get('/seguimiento/:seguimiento_id', verificarToken, ctrl.obtenerPorSeguimiento);

// Compromisos pendientes por emprendimiento
router.get('/pendientes/:emprendimiento_id', verificarToken, ctrl.obtenerPendientesPorEmprendimiento);

// CRUD
router.post('/seguimiento/:seguimiento_id', verificarToken, ctrl.crear);
router.put('/:id', verificarToken, ctrl.actualizarEstado);
router.delete('/:id', verificarToken, ctrl.eliminar);

module.exports = router;
