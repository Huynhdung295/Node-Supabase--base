// Unit tests for validation schemas

import { schemas } from '../../src/utils/validation.js';

describe('Validation Schemas', () => {
  describe('register schema', () => {
    test('should validate correct registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User'
      };
      
      const { error } = schemas.register.validate(data);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        full_name: 'Test User'
      };
      
      const { error } = schemas.register.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject short password', () => {
      const data = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Test User'
      };
      
      const { error } = schemas.register.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject short name', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'A'
      };
      
      const { error } = schemas.register.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('login schema', () => {
    test('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const { error } = schemas.login.validate(data);
      expect(error).toBeUndefined();
    });

    test('should reject missing password', () => {
      const data = {
        email: 'test@example.com'
      };
      
      const { error } = schemas.login.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('updateProfile schema', () => {
    test('should validate profile update', () => {
      const data = {
        full_name: 'New Name'
      };
      
      const { error } = schemas.updateProfile.validate(data);
      expect(error).toBeUndefined();
    });

    test('should reject invalid role', () => {
      const data = {
        role: 'invalid_role'
      };
      
      const { error } = schemas.updateProfile.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject invalid tier', () => {
      const data = {
        tier_vip: 'platinum'
      };
      
      const { error } = schemas.updateProfile.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject empty update', () => {
      const data = {};
      
      const { error } = schemas.updateProfile.validate(data);
      expect(error).toBeDefined();
    });
  });
});
