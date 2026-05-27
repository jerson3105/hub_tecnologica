require('dotenv').config();
const { sequelize, Usuario } = require('../models');

const initDatabase = async () => {
  try {
    // Crear la base de datos si no existe
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Base de datos '${process.env.DB_NAME}' verificada/creada.`);
    await connection.end();

    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    console.log('Tablas sincronizadas correctamente.');

    // Backfill: crear registros en sesion_programas para sesiones legacy con programa_id directo
    const { Sesion, SesionPrograma } = require('../models');
    const legacySesiones = await Sesion.findAll({
      where: { programa_id: { [require('sequelize').Op.not]: null } }
    });
    let backfillCount = 0;
    for (const ses of legacySesiones) {
      const [, created] = await SesionPrograma.findOrCreate({
        where: { sesion_id: ses.id, programa_id: ses.programa_id }
      });
      if (created) backfillCount++;
    }
    if (backfillCount > 0) {
      console.log(`Backfill: ${backfillCount} sesiones migradas a sesion_programas.`);
    }

    // Crear usuario admin por defecto si no existe
    const adminExiste = await Usuario.findOne({ where: { email: 'admin@incubadora.com' } });
    if (!adminExiste) {
      await Usuario.create({
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@incubadora.com',
        password: 'admin123',
        rol: 'admin'
      });
      console.log('Usuario admin creado: admin@incubadora.com / admin123');
    } else {
      console.log('Usuario admin ya existe.');
    }

    console.log('\n=== Base de datos inicializada correctamente ===');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

initDatabase();
