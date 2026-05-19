const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const emprendimientoController = require('../controllers/emprendimientoController');
const { verificarToken, esAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/', esAdmin, [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('programa_id').isInt().withMessage('El programa es requerido')
], validate, emprendimientoController.crear);

router.get('/', emprendimientoController.listar);

router.get('/mi-emprendimiento', emprendimientoController.miEmprendimiento);

router.get('/:id', emprendimientoController.obtenerPorId);

router.put('/:id', esAdmin, emprendimientoController.actualizar);

router.delete('/:id', esAdmin, emprendimientoController.eliminar);

router.get('/:id/usuarios-disponibles', emprendimientoController.buscarUsuariosParaIntegrante);

router.post('/:id/integrantes', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('email').isEmail().withMessage('Email inválido')
], validate, emprendimientoController.agregarIntegrante);

router.delete('/:id/integrantes/:integranteId', emprendimientoController.eliminarIntegrante);

module.exports = router;
