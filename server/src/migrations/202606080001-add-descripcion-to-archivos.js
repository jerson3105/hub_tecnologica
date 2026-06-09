'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('archivos');

    if (!table.descripcion) {
      await queryInterface.addColumn('archivos', 'descripcion', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'url'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('archivos');

    if (table.descripcion) {
      await queryInterface.removeColumn('archivos', 'descripcion');
    }
  }
};