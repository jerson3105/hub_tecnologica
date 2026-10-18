const express = require('express');
const router = express.Router();
const indicadoresController = require('../controllers/indicadoresController');
const { verificarToken, esAdmin } = require('../middleware/auth');

router.use(verificarToken);
router.use(esAdmin);

router.get('/', indicadoresController.obtenerIndicadores);
router.get('/satisfaccion', indicadoresController.obtenerSatisfaccion);

module.exports = router;
