// Enlaces que escriben los usuarios: se aceptan sin esquema («instagram.com/miproyecto») y se
// guardan con https:// (el servidor exige http:// o https://).
export const conEsquema = (valor) => (/^https?:\/\//i.test(valor) ? valor : `https://${valor}`);

// ¿Parece un enlace web una vez completado el esquema? (dominio con punto y sin espacios)
export const esEnlaceValido = (valor) => /^https?:\/\/[^\s./]+\.\S+$/i.test(conEsquema(String(valor || '').trim()));
