// Unit tests for helper functions

import {
  compareTiers,
  hasTierAccess,
  getNextTier,
  sanitizeUser,
  generateRandomString,
  parsePagination,
  isValidUUID,
  maskEmail,
  calculatePercentage,
  removeEmpty,
  capitalize
} from '../../src/utils/helpers.js';

describe('Helper Functions', () => {
  describe('compareTiers', () => {
    test('should compare tiers correctly', () => {
      expect(compareTiers('silver', 'gold')).toBeLessThan(0);
      expect(compareTiers('gold', 'silver')).toBeGreaterThan(0);
      expect(compareTiers('gold', 'gold')).toBe(0);
    });
  });

  describe('hasTierAccess', () => {
    test('should check tier access correctly', () => {
      expect(hasTierAccess('diamond', 'silver')).toBe(true);
      expect(hasTierAccess('silver', 'diamond')).toBe(false);
      expect(hasTierAccess('gold', 'gold')).toBe(true);
    });
  });

  describe('getNextTier', () => {
    test('should return next tier', () => {
      expect(getNextTier('silver')).toBe('gold');
      expect(getNextTier('gold')).toBe('diamond');
      expect(getNextTier('diamond')).toBeNull();
    });
  });

  describe('sanitizeUser', () => {
    test('should remove sensitive data', () => {
      const user = {
        id: '123',
        email: 'test@test.com',
        password: 'secret',
        refresh_token: 'token'
      };
      
      const sanitized = sanitizeUser(user);
      
      expect(sanitized.id).toBe('123');
      expect(sanitized.email).toBe('test@test.com');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.refresh_token).toBeUndefined();
    });
  });

  describe('generateRandomString', () => {
    test('should generate random string of correct length', () => {
      const str = generateRandomString(32);
      expect(str).toHaveLength(32);
      expect(typeof str).toBe('string');
    });

    test('should generate different strings', () => {
      const str1 = generateRandomString(32);
      const str2 = generateRandomString(32);
      expect(str1).not.toBe(str2);
    });
  });

  describe('parsePagination', () => {
    test('should parse pagination with defaults', () => {
      const result = parsePagination({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    test('should parse custom pagination', () => {
      const result = parsePagination({ page: '3', limit: '20' });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    test('should enforce max limit', () => {
      const result = parsePagination({ limit: '200' });
      expect(result.limit).toBe(100);
    });
  });

  describe('isValidUUID', () => {
    test('should validate UUID correctly', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
    });
  });

  describe('maskEmail', () => {
    test('should mask email correctly', () => {
      expect(maskEmail('test@example.com')).toBe('t***t@example.com');
      expect(maskEmail('a@example.com')).toBe('a***a@example.com');
    });
  });

  describe('calculatePercentage', () => {
    test('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    test('should handle zero total', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('removeEmpty', () => {
    test('should remove null and undefined values', () => {
      const obj = {
        a: 1,
        b: null,
        c: undefined,
        d: 'test',
        e: 0,
        f: false
      };
      
      const result = removeEmpty(obj);
      
      expect(result.a).toBe(1);
      expect(result.b).toBeUndefined();
      expect(result.c).toBeUndefined();
      expect(result.d).toBe('test');
      expect(result.e).toBe(0);
      expect(result.f).toBe(false);
    });
  });

  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('a')).toBe('A');
    });
  });
});
