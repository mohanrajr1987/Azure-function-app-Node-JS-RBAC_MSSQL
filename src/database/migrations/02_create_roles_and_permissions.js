export async function up(queryInterface, Sequelize) {
  // Create Roles table
  await queryInterface.createTable('Roles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.STRING
    },
    isDefault: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
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

  // Create Permissions table
  await queryInterface.createTable('Permissions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.STRING
    },
    resource: {
      type: Sequelize.STRING,
      allowNull: false
    },
    action: {
      type: Sequelize.ENUM('create', 'read', 'update', 'delete', 'manage'),
      allowNull: false
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

  // Create UserRoles junction table
  await queryInterface.createTable('UserRoles', {
    userId: {
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    roleId: {
      type: Sequelize.UUID,
      references: {
        model: 'Roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
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

  // Create RolePermissions junction table
  await queryInterface.createTable('RolePermissions', {
    roleId: {
      type: Sequelize.UUID,
      references: {
        model: 'Roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    permissionId: {
      type: Sequelize.UUID,
      references: {
        model: 'Permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
  await queryInterface.dropTable('RolePermissions');
  await queryInterface.dropTable('UserRoles');
  await queryInterface.dropTable('Permissions');
  await queryInterface.dropTable('Roles');
}
