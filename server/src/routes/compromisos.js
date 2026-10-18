const express = require('express');
const router = express.Router();
const { verificarToken, esAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/compromisoController');

router.use(verificarToken);

// Lectura: admin o integrantes del emprendimiento (se valida en el controlador)
// Timeline de un emprendimiento
router.get('/timeline/:emprendimiento_id', ctrl.timelineEmprendimiento);

// Compromisos por seguimiento
router.get('/seguimiento/:seguimiento_id', ctrl.obtenerPorSeguimiento);

// Compromisos pendientes por emprendimiento
router.get('/pendientes/:emprendimiento_id', ctrl.obtenerPendientesPorEmprendimiento);

// Escritura: los compromisos los registra el equipo de la incubadora
router.post('/seguimiento/:seguimiento_id', esAdmin, ctrl.crear);
router.delete('/:id', esAdmin, ctrl.eliminar);

// Estado: el admin o un integrante del emprendimiento (solo el estado; se valida en el controlador)
router.put('/:id', ctrl.actualizarEstado);

module.exports = router;
