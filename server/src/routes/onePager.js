const express = require('express');
const router = express.Router();
const onePagerController = require('../controllers/onePagerController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

// Verificar estado de completitud (para sidebar badge)
router.get('/estado', onePagerController.verificarEstado);

// Obtener one pager de un emprendimiento
router.get('/:emprendimiento_id', onePagerController.obtener);

// Crear o actualizar one pager
router.put('/:emprendimiento_id', onePagerController.guardar);

module.exports = router;
