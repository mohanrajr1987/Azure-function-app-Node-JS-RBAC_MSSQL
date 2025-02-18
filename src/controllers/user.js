import { User, Role } from '../models/index.js';
import { generateTokens, generateAccessToken, verifyToken } from '../utils/jwt.js';
import emailService from '../services/email.js';

export const userController = {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName
      });

      // Assign default role
      const defaultRole = await Role.findOne({ where: { isDefault: true } });
      if (defaultRole) {
        await user.addRole(defaultRole);
      }

      // Send welcome email
      await emailService.sendWelcomeEmail(user);

      // Generate token
      const token = generateToken({ id: user.id });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({
        where: { email },
        include: [Role]
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or inactive account' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({ id: user.id });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.Roles.map(role => ({
            id: role.id,
            name: role.name
          }))
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [Role],
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { firstName, lastName, password } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (password) user.password = password;

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  },

  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isActive = false;
      await user.save();

      // Send deactivation email
      await emailService.sendDeactivationEmail(user);

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ message: 'Failed to deactivate user' });
    }
  },

  async listUsers(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const users = await User.findAndCountAll({
        include: [Role],
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        users: users.rows,
        total: users.count,
        page: parseInt(page),
        totalPages: Math.ceil(users.count / limit)
      });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ message: 'Failed to list users' });
    }
  }
,

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid token or inactive account' });
      }

      // Generate new access token
      const accessToken = generateAccessToken({ id: user.id });

      res.json({
        token: accessToken
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};
