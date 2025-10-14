import request from 'supertest';
import app from '../../../src/app';
import mongoose from 'mongoose';

describe('Auth Integration Tests (Real DB)', () => {
  const userData = {
    email: 'integration@example.com',
    password: 'password123',
    name: 'Integration Test'
  };

  afterAll(async () => {
    await mongoose.connection.dropDatabase(); // optional cleanup
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(userData);
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid', password: 'short' })
        .expect(422);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(userData);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
      
      token = response.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });
});
