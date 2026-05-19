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

// Archivos estáticos (uploads) — protegidos con JWT
const jwt = require('jsonwebtoken');
app.use('/uploads', (req, res, next) => {
  // Mentor photos are public (shown on entrepreneur view)
  if (req.path.startsWith('/mentores/')) return next();
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token requerido' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
}, express.static(path.join(__dirname, '../uploads')));

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos por ventana
  message: { mensaje: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rutas
app.use('/api/auth/login', loginLimiter);
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

  res.status(err.status || 500).json({
    mensaje: err.message || 'Error interno del servidor'
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
