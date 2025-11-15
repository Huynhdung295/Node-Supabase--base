// Unit tests for constants

import {
  USER_ROLES,
  VIP_TIERS,
  TIER_HIERARCHY,
  HTTP_STATUS,
  PAGINATION
} from '../../src/config/constants.js';

describe('Constants', () => {
  describe('USER_ROLES', () => {
    test('should have all required roles', () => {
      expect(USER_ROLES.ADMIN).toBe('admin');
      expect(USER_ROLES.USER).toBe('user');
      expect(USER_ROLES.AFFILIATE).toBe('aff');
    });
  });

  describe('VIP_TIERS', () => {
    test('should have all tiers', () => {
      expect(VIP_TIERS.SILVER).toBe('silver');
      expect(VIP_TIERS.GOLD).toBe('gold');
      expect(VIP_TIERS.DIAMOND).toBe('diamond');
    });
  });

  describe('TIER_HIERARCHY', () => {
    test('should have correct hierarchy', () => {
      expect(TIER_HIERARCHY.silver).toBe(1);
      expect(TIER_HIERARCHY.gold).toBe(2);
      expect(TIER_HIERARCHY.diamond).toBe(3);
    });

    test('should maintain order', () => {
      expect(TIER_HIERARCHY.silver).toBeLessThan(TIER_HIERARCHY.gold);
      expect(TIER_HIERARCHY.gold).toBeLessThan(TIER_HIERARCHY.diamond);
    });
  });

  describe('HTTP_STATUS', () => {
    test('should have common status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('PAGINATION', () => {
    test('should have default values', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
      expect(PAGINATION.MIN_LIMIT).toBe(1);
    });
  });
});
