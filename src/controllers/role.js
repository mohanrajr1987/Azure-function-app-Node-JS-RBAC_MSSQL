import { Role, Permission, User } from '../models/index.js';

export const roleController = {
  async createRole(req, res) {
    try {
      const { name, description, permissions } = req.body;

      // Check if role already exists
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ message: 'Role already exists' });
      }

      // Create role
      const role = await Role.create({
        name,
        description
      });

      // Assign permissions if provided
      if (permissions && permissions.length > 0) {
        const permissionRecords = await Permission.findAll({
          where: { name: permissions }
        });
        await role.setPermissions(permissionRecords);
      }

      // Fetch role with permissions
      const roleWithPermissions = await Role.findByPk(role.id, {
        include: [Permission]
      });

      res.status(201).json({
        message: 'Role created successfully',
        role: roleWithPermissions
      });
    } catch (error) {
      console.error('Create role error:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  },

  async listRoles(req, res) {
    try {
      const roles = await Role.findAll({
        include: [Permission],
        order: [['name', 'ASC']]
      });

      res.json({ roles });
    } catch (error) {
      console.error('List roles error:', error);
      res.status(500).json({ message: 'Failed to list roles' });
    }
  },

  async getRole(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findByPk(id, {
        include: [Permission]
      });

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      res.json({ role });
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({ message: 'Failed to get role' });
    }
  },

  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Update basic info
      if (name) role.name = name;
      if (description) role.description = description;
      await role.save();

      // Update permissions if provided
      if (permissions) {
        const permissionRecords = await Permission.findAll({
          where: { name: permissions }
        });
        await role.setPermissions(permissionRecords);
      }

      // Fetch updated role with permissions
      const updatedRole = await Role.findByPk(id, {
        include: [Permission]
      });

      res.json({
        message: 'Role updated successfully',
        role: updatedRole
      });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  },

  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findByPk(id);

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (role.isDefault) {
        return res.status(400).json({ message: 'Cannot delete default role' });
      }

      await role.destroy();

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  },

  async assignRoleToUser(req, res) {
    try {
      const { userId, roleId } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      await user.addRole(role);

      // Fetch updated user with roles
      const updatedUser = await User.findByPk(userId, {
        include: [Role],
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'Role assigned successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({ message: 'Failed to assign role' });
    }
  },

  async removeRoleFromUser(req, res) {
    try {
      const { userId, roleId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      await user.removeRole(role);

      // Fetch updated user with roles
      const updatedUser = await User.findByPk(userId, {
        include: [Role],
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'Role removed successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({ message: 'Failed to remove role' });
    }
  }
};
