require('dotenv').config();
const { sequelize, Objetivo, ResultadoClave, ActividadOKR, Evidencia, Compromiso } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Sync only new tables
    await Objetivo.sync({ alter: true });
    console.log('✓ objetivos');
    await ResultadoClave.sync({ alter: true });
    console.log('✓ resultados_clave');
    await ActividadOKR.sync({ alter: true });
    console.log('✓ actividades_okr');
    await Evidencia.sync({ alter: true });
    console.log('✓ evidencias');
    await Compromiso.sync({ alter: true });
    console.log('✓ compromisos');

    // Also alter sesiones and seguimientos for new columns
    const Sesion = require('./src/models/Sesion');
    const Seguimiento = require('./src/models/Seguimiento');
    await Sesion.sync({ alter: true });
    console.log('✓ sesiones (altered)');
    await Seguimiento.sync({ alter: true });
    console.log('✓ seguimientos (altered)');

    console.log('\nAll tables synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
