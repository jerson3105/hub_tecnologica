const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], validate, authController.login);

router.post('/registrar', verificarToken, esAdmin, [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('rol').optional().isIn(['admin', 'emprendedor']).withMessage('Rol inválido')
], validate, authController.registrarUsuario);

router.get('/perfil', verificarToken, authController.obtenerPerfil);

router.put('/cambiar-password', verificarToken, [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
  body('passwordNuevo').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], validate, authController.cambiarPassword);

router.get('/usuarios', verificarToken, esAdmin, authController.listarUsuarios);

router.put('/usuarios/:id', verificarToken, esAdmin, authController.actualizarUsuario);

router.post('/usuarios/:id/resetear-password', verificarToken, esAdmin, authController.resetearPassword);

module.exports = router;
