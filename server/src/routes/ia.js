const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const iaController = require('../controllers/iaController');
const { verificarToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

// Los textos van al prompt de Gemini: se limitan para acotar coste y abuso
router.post('/match-mentor', [
  body('areas').isArray({ min: 1, max: 15 }).withMessage('Selecciona entre 1 y 15 áreas de mentoría'),
  body('areas.*').isString().isLength({ max: 100 }).withMessage('Área inválida'),
  body('reto_principal').notEmpty().withMessage('El reto principal es requerido')
    .isLength({ max: 2000 }).withMessage('El reto principal es demasiado largo'),
  body(['apoyo_esperado', 'resultados_esperados', 'preferencia_sector', 'comentarios'])
    .optional({ values: 'falsy' }).isLength({ max: 2000 }).withMessage('El texto es demasiado largo')
], validate, iaController.matchMentor);

module.exports = router;
