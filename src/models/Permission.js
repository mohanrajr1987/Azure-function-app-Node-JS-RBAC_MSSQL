import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Permission extends Model {}

Permission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Permission'
});

export default Permission;
