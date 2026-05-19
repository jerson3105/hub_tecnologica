const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      mensaje: errors.array()[0].msg,
      errores: errors.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
};

module.exports = validate;
