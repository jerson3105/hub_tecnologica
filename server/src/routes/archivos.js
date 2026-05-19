const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verificarToken);

router.post('/', upload.single('archivo'), archivoController.subir);

router.post('/enlace', archivoController.crearEnlace);

router.get('/', archivoController.listar);

router.get('/:id/descargar', archivoController.descargar);

router.delete('/:id', esAdmin, archivoController.eliminar);

module.exports = router;
