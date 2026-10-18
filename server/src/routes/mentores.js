const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { body } = require('express-validator');
const mentorController = require('../controllers/mentorController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Upload config for mentor photos
const uploadDir = path.join(__dirname, '../../uploads/mentores');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Las fotos se sirven públicamente: la extensión sale del tipo MIME validado, no del nombre original
const EXTENSIONES_IMAGEN = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomInt(1e9);
    cb(null, uniqueSuffix + EXTENSIONES_IMAGEN[file.mimetype]);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES_IMAGEN[file.mimetype]) return cb(null, true);
    const error = new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
    error.status = 400;
    cb(error, false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(verificarToken);

router.post('/', esAdmin, upload.single('foto'), [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('linkedin').notEmpty().withMessage('El LinkedIn es requerido')
], validate, mentorController.crear);

router.get('/', mentorController.listar);

router.get('/:id', mentorController.obtenerPorId);

router.put('/:id', esAdmin, upload.single('foto'), mentorController.actualizar);

router.delete('/:id', esAdmin, mentorController.eliminar);

module.exports = router;
