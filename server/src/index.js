require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const programaRoutes = require('./routes/programas');
const emprendimientoRoutes = require('./routes/emprendimientos');
const sesionRoutes = require('./routes/sesiones');
const seguimientoRoutes = require('./routes/seguimientos');
const archivoRoutes = require('./routes/archivos');
const asistenciaRoutes = require('./routes/asistencias');
const npsRoutes = require('./routes/nps');
const onePagerRoutes = require('./routes/onePager');
const bmcRoutes = require('./routes/bmc');
const mentorRoutes = require('./routes/mentores');
const iaRoutes = require('./routes/ia');
const indicadoresRoutes = require('./routes/indicadores');
const objetivoRoutes = require('./routes/objetivos');
const compromisoRoutes = require('./routes/compromisos');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Solo las fotos de mentores se sirven como estáticos públicos. El resto de archivos
// se descarga por /api/archivos/:id/descargar, que verifica el acceso del usuario.
app.use('/uploads/mentores', express.static(path.join(__dirname, '../uploads/mentores'), {
  setHeaders: (res) => res.setHeader('Content-Security-Policy', "default-src 'none'")
}));
app.use('/uploads', (req, res) => res.status(404).json({ mensaje: 'Recurso no encontrado' }));

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos por ventana
  message: { mensaje: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para el match con IA (cada llamada consume cuota de Gemini)
const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { mensaje: 'Has alcanzado el límite de consultas a la IA. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rutas
app.use('/api/auth/login', loginLimiter);
app.use('/api/ia', iaLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/programas', programaRoutes);
app.use('/api/emprendimientos', emprendimientoRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/seguimientos', seguimientoRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/nps', npsRoutes);
app.use('/api/one-pager', onePagerRoutes);
app.use('/api/bmc', bmcRoutes);
app.use('/api/mentores', mentorRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/objetivos', objetivoRoutes);
app.use('/api/compromisos', compromisoRoutes);

// Ruta de salud
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'El archivo excede el tamaño máximo permitido (10MB)' });
    }
    return res.status(400).json({ mensaje: err.message });
  }

  const status = err.status || err.statusCode || 500;
  // Los errores 5xx pueden contener detalles internos (SQL, rutas): no se exponen al cliente
  res.status(status).json({
    mensaje: status < 500 && err.message ? err.message : 'Error interno del servidor'
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida');

    await sequelize.sync({ alter: false });
    logger.info('Modelos sincronizados');

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
