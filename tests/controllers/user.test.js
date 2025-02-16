import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index.js';
import { User, Role } from '../../src/models/index.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('User Controller', () => {
  let defaultRole;
  let testUser;
  let authToken;

  before(async () => {
    // Create default role
    defaultRole = await Role.create({
      name: 'User',
      description: 'Default user role',
      isDefault: true
    });
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', userData.email);

      testUser = await User.findOne({ where: { email: userData.email } });
      expect(testUser).to.not.be.null;
    });

    it('should not register a user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Another',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Email already registered');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(credentials);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      authToken = response.body.token;
    });

    it('should not login with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(credentials);

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user).to.have.property('email', 'test@example.com');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).to.equal(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body.user).to.have.property('firstName', 'Updated');
      expect(response.body.user).to.have.property('lastName', 'Name');
    });
  });

  after(async () => {
    // Clean up
    await User.destroy({ where: {} });
    await Role.destroy({ where: {} });
  });
});
