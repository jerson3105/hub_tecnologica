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
