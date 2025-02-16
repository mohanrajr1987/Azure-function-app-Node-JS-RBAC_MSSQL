import User from './User.js';
import Role from './Role.js';
import Permission from './Permission.js';
import Document from './Document.js';

// User-Role Many-to-Many relationship
User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });

// Role-Permission Many-to-Many relationship
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

// Document-User One-to-Many relationship
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'documents' });

export {
  User,
  Role,
  Permission,
  Document
};
