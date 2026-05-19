const express = require('express');
const router = express.Router();
const bmcController = require('../controllers/bmcController');
const { verificarToken, esAdmin } = require('../middleware/auth');

router.use(verificarToken);

// Listar versiones de un emprendimiento
router.get('/emprendimiento/:emprendimientoId', bmcController.listarVersiones);

// Obtener versión específica
router.get('/:id', bmcController.obtenerVersion);

// Crear nueva versión
router.post('/', bmcController.crearVersion);

// Actualizar versión
router.put('/:id', bmcController.actualizarVersion);

// Eliminar versión (solo admin)
router.delete('/:id', esAdmin, bmcController.eliminarVersion);

// Admin da feedback
router.put('/:id/feedback', esAdmin, bmcController.darFeedback);

module.exports = router;
