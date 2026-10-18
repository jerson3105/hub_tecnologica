const express = require('express');
const router = express.Router();
const { verificarToken, esAdmin } = require('../middleware/auth');
const { obtenerInicio } = require('../controllers/inicioController');

router.use(verificarToken);

// Inicio del equipo técnico (el del emprendedor llegará en la siguiente fase)
router.get('/', esAdmin, obtenerInicio);

module.exports = router;
