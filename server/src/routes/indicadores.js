const express = require('express');
const router = express.Router();
const indicadoresController = require('../controllers/indicadoresController');
const { verificarToken, esAdmin } = require('../middleware/auth');

router.use(verificarToken);
router.use(esAdmin);

router.get('/', indicadoresController.obtenerIndicadores);

module.exports = router;
