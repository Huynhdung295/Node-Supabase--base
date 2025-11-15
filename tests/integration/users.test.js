// Integration tests for user endpoints

import request from 'supertest';
import app from '../../src/server.js';

describe('User Endpoints', () => {
  let adminToken;
  let userToken;
  let userId;

  beforeAll(async () => {
    // Login as admin
    const adminResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    
    adminToken = adminResponse.body.data.access_token;

    // Login as regular user
    const userResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123'
      });
    
    userToken = userResponse.body.data.access_token;
    userId = userResponse.body.data.user.id;
  });

  describe('GET /api/v1/users', () => {
    test('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should reject non-admin users', async () => {
      await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    test('should reject invalid UUID', async () => {
      await request(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    test('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    test('should update own profile', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          full_name: 'Updated Name'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.full_name).toBe('Updated Name');
    });

    test('should reject updating other users profile', async () => {
      // Try to update admin profile with user token
      await request(app)
        .put('/api/v1/users/some-other-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          full_name: 'Hacked Name'
        })
        .expect(403);
    });

    test('should reject invalid data', async () => {
      await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'invalid_role'
        })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('should allow admin to delete user', async () => {
      // Create a test user first
      const newUser = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `delete${Date.now()}@example.com`,
          password: 'Test123456',
          full_name: 'To Delete'
        });

      const deleteUserId = newUser.body.data.user.id;

      // Delete as admin
      await request(app)
        .delete(`/api/v1/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('should reject non-admin deletion', async () => {
      await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
