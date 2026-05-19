const crypto = require('crypto');

const generarPasswordAleatorio = (longitud = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(longitud);
  let password = '';
  for (let i = 0; i < longitud; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
};

module.exports = { generarPasswordAleatorio };
