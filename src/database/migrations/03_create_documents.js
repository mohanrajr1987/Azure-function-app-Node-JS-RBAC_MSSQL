export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Documents', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    filename: {
      type: Sequelize.STRING,
      allowNull: false
    },
    originalName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    mimeType: {
      type: Sequelize.STRING,
      allowNull: false
    },
    size: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    isPublic: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: Sequelize.JSON
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Documents');
}
