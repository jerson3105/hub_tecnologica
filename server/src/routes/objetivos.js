const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const ctrl = require('../controllers/objetivoController');

// Objetivos por emprendimiento
router.get('/emprendimiento/:emprendimiento_id', verificarToken, ctrl.obtenerPorEmprendimiento);
router.post('/emprendimiento/:emprendimiento_id', verificarToken, ctrl.crear);
router.put('/:id', verificarToken, ctrl.actualizar);
router.delete('/:id', verificarToken, ctrl.eliminar);

// Resultados clave
router.post('/resultado-clave/:objetivo_id', verificarToken, ctrl.crearResultadoClave);
router.put('/resultado-clave/:id', verificarToken, ctrl.actualizarResultadoClave);
router.delete('/resultado-clave/:id', verificarToken, ctrl.eliminarResultadoClave);

// Actividades
router.post('/actividad/:resultado_clave_id', verificarToken, ctrl.crearActividad);
router.put('/actividad/:id', verificarToken, ctrl.actualizarActividad);
router.delete('/actividad/:id', verificarToken, ctrl.eliminarActividad);

// Evidencias
router.post('/evidencia/:objetivo_id', verificarToken, ctrl.crearEvidencia);
router.delete('/evidencia/:id', verificarToken, ctrl.eliminarEvidencia);

module.exports = router;
