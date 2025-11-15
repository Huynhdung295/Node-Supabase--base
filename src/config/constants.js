// Application Constants

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AFFILIATE: 'aff'
};

// VIP Tiers
export const VIP_TIERS = {
  SILVER: 'silver',
  GOLD: 'gold',
  DIAMOND: 'diamond'
};

// Tier Hierarchy (for comparison)
export const TIER_HIERARCHY = {
  [VIP_TIERS.SILVER]: 1,
  [VIP_TIERS.GOLD]: 2,
  [VIP_TIERS.DIAMOND]: 3
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_INACTIVE: 'Account is inactive',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  INVALID_INPUT: 'Invalid input data',
  REQUIRED_FIELD: 'This field is required',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  DATABASE_ERROR: 'Database operation failed'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  
  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  TIER_UPGRADED: 'Tier upgraded successfully',
  ROLE_CHANGED: 'Role changed successfully',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  STRICT_WINDOW_MS: 15 * 60 * 1000,
  STRICT_MAX_REQUESTS: 5
};

// JWT
export const JWT = {
  ACCESS_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
  ALGORITHM: 'HS256'
};

// Password
export const PASSWORD = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128,
  SALT_ROUNDS: 10
};

// File Upload (if needed in future)
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  AVATAR_MAX_SIZE: 2 * 1024 * 1024 // 2MB
};

// Database Tables
export const DB_TABLES = {
  PROFILES: 'profiles',
  AUDIT_LOGS: 'audit_logs'
};

// Audit Log Actions
export const AUDIT_ACTIONS = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  ROLE_CHANGED: 'role_changed',
  TIER_UPGRADED: 'tier_upgraded',
  PASSWORD_CHANGED: 'password_changed'
};

// Environment
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// CORS
export const CORS_OPTIONS = {
  ALLOWED_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
  CREDENTIALS: true,
  MAX_AGE: 86400 // 24 hours
};

// API Versioning
export const API = {
  VERSION: process.env.API_VERSION || 'v1',
  BASE_PATH: '/api'
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[1-9]\d{1,14}$/ // E.164 format
};

// Cache TTL (if using cache in future)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400 // 24 hours
};

export default {
  USER_ROLES,
  VIP_TIERS,
  TIER_HIERARCHY,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  RATE_LIMIT,
  JWT,
  PASSWORD,
  FILE_UPLOAD,
  DB_TABLES,
  AUDIT_ACTIONS,
  ENVIRONMENTS,
  CORS_OPTIONS,
  API,
  REGEX,
  CACHE_TTL
};
