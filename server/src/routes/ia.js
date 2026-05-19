const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const iaController = require('../controllers/iaController');
const { verificarToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(verificarToken);

router.post('/match-mentor', [
  body('areas').isArray({ min: 1 }).withMessage('Selecciona al menos un área de mentoría'),
  body('reto_principal').notEmpty().withMessage('El reto principal es requerido')
], validate, iaController.matchMentor);

module.exports = router;
