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
  body('usuario_id').optional().isInt().withMessage('El usuario seleccionado es inválido'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido'),
  body().custom((_, { req }) => {
    if (req.body.usuario_id) {
      return true;
    }

    if (!req.body.nombre || !req.body.apellido || !req.body.email) {
      throw new Error('Nombre, apellido y correo son requeridos');
    }

    return true;
  })
], validate, emprendimientoController.agregarIntegrante);

router.post('/:id/integrantes/:integranteId/resetear-password', emprendimientoController.resetearPasswordIntegrante);

router.delete('/:id/integrantes/:integranteId', emprendimientoController.eliminarIntegrante);

module.exports = router;
