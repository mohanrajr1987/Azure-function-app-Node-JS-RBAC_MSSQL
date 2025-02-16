import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function up(queryInterface) {
  const now = new Date();
  
  // Create default roles
  const roles = [
    {
      id: uuidv4(),
      name: 'Super Admin',
      description: 'Super administrator with full system access',
      isDefault: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'User',
      description: 'Regular user with basic privileges',
      isDefault: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  await queryInterface.bulkInsert('Roles', roles);

  // Create default permissions
  const permissions = [
    // User management permissions
    {
      id: uuidv4(),
      name: 'user:create',
      description: 'Create new users',
      resource: 'user',
      action: 'create',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'user:read',
      description: 'View user information',
      resource: 'user',
      action: 'read',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'user:update',
      description: 'Update user information',
      resource: 'user',
      action: 'update',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'user:delete',
      description: 'Delete users',
      resource: 'user',
      action: 'delete',
      createdAt: now,
      updatedAt: now
    },
    // Document management permissions
    {
      id: uuidv4(),
      name: 'document:create',
      description: 'Upload new documents',
      resource: 'document',
      action: 'create',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'document:read',
      description: 'View documents',
      resource: 'document',
      action: 'read',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'document:update',
      description: 'Update document information',
      resource: 'document',
      action: 'update',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'document:delete',
      description: 'Delete documents',
      resource: 'document',
      action: 'delete',
      createdAt: now,
      updatedAt: now
    },
    // Role management permissions
    {
      id: uuidv4(),
      name: 'role:manage',
      description: 'Manage roles and permissions',
      resource: 'role',
      action: 'manage',
      createdAt: now,
      updatedAt: now
    }
  ];

  await queryInterface.bulkInsert('Permissions', permissions);

  // Create super admin user
  const superAdminId = uuidv4();
  const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
  
  await queryInterface.bulkInsert('Users', [{
    id: superAdminId,
    email: 'admin@example.com',
    password: hashedPassword,
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    createdAt: now,
    updatedAt: now
  }]);

  // Assign super admin role to the super admin user
  await queryInterface.bulkInsert('UserRoles', [{
    userId: superAdminId,
    roleId: roles[0].id,
    createdAt: now,
    updatedAt: now
  }]);

  // Assign all permissions to super admin role
  await queryInterface.bulkInsert('RolePermissions', 
    permissions.map(permission => ({
      roleId: roles[0].id,
      permissionId: permission.id,
      createdAt: now,
      updatedAt: now
    }))
  );

  // Assign basic permissions to default user role
  const userPermissions = permissions.filter(p => 
    p.name === 'document:create' || 
    p.name === 'document:read' || 
    p.name === 'document:update' || 
    p.name === 'document:delete'
  );

  await queryInterface.bulkInsert('RolePermissions',
    userPermissions.map(permission => ({
      roleId: roles[1].id,
      permissionId: permission.id,
      createdAt: now,
      updatedAt: now
    }))
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('RolePermissions', null, {});
  await queryInterface.bulkDelete('UserRoles', null, {});
  await queryInterface.bulkDelete('Permissions', null, {});
  await queryInterface.bulkDelete('Roles', null, {});
  await queryInterface.bulkDelete('Users', null, {});
}
