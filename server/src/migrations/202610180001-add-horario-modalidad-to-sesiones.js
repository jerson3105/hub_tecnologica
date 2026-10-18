'use strict';

// Hora, modalidad, lugar y enlace de reunión de las sesiones (todas opcionales: las sesiones
// antiguas solo tienen fecha). Defensiva como la anterior: solo añade lo que falta, así se puede
// ejecutar en bases que ya tengan alguna columna creada por sync.
const COLUMNAS = (Sequelize) => ({
  hora_inicio: { type: Sequelize.TIME, allowNull: true, after: 'fecha' },
  hora_fin: { type: Sequelize.TIME, allowNull: true, after: 'hora_inicio' },
  modalidad: { type: Sequelize.ENUM('presencial', 'virtual', 'hibrida'), allowNull: true, after: 'hora_fin' },
  lugar: { type: Sequelize.STRING(200), allowNull: true, after: 'modalidad' },
  enlace_reunion: { type: Sequelize.STRING(500), allowNull: true, after: 'lugar' }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    const tabla = await queryInterface.describeTable('sesiones');
    for (const [nombre, definicion] of Object.entries(COLUMNAS(Sequelize))) {
      if (!tabla[nombre]) await queryInterface.addColumn('sesiones', nombre, definicion);
    }
  },

  async down(queryInterface, Sequelize) {
    const tabla = await queryInterface.describeTable('sesiones');
    for (const nombre of Object.keys(COLUMNAS(Sequelize)).reverse()) {
      if (tabla[nombre]) await queryInterface.removeColumn('sesiones', nombre);
    }
  }
};
