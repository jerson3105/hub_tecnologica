const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Deben coincidir con el ENUM de Archivo.categoria
const CATEGORIAS = ['bmc', 'taller', 'entregable', 'grabacion', 'otro'];

// La extensión guardada se deriva del tipo MIME aceptado, nunca del nombre original,
// para que no se puedan subir .html/.js disfrazados de otro tipo.
const EXTENSIONES_POR_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'video/mp4': '.mp4',
  'video/avi': '.avi',
  'video/quicktime': '.mov',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar'
};

const categoriaSegura = (categoria) => (CATEGORIAS.includes(categoria) ? categoria : 'otro');

const nombreUnico = (mimetype) => `${Date.now()}-${crypto.randomInt(1e9)}${EXTENSIONES_POR_MIME[mimetype] || ''}`;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, categoriaSegura(req.body.categoria));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, nombreUnico(file.mimetype));
  }
});

const fileFilter = (req, file, cb) => {
  if (EXTENSIONES_POR_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    const error = new Error('Tipo de archivo no permitido');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024
  }
});

module.exports = upload;
module.exports.CATEGORIAS = CATEGORIAS;
module.exports.categoriaSegura = categoriaSegura;
module.exports.EXTENSIONES_POR_MIME = EXTENSIONES_POR_MIME;
