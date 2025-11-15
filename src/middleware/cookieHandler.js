// Cookie handling middleware with security best practices

import { logger } from '../utils/logger.js';

// Cookie configuration
export const COOKIE_CONFIG = {
  httpOnly: true, // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined
};

// Refresh token cookie config (longer expiry)
export const REFRESH_COOKIE_CONFIG = {
  ...COOKIE_CONFIG,
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

/**
 * Set access token cookie
 */
export const setAccessTokenCookie = (res, token) => {
  res.cookie('access_token', token, COOKIE_CONFIG);
  logger.info('Access token cookie set');
};

/**
 * Set refresh token cookie
 */
export const setRefreshTokenCookie = (res, token) => {
  res.cookie('refresh_token', token, REFRESH_COOKIE_CONFIG);
  logger.info('Refresh token cookie set');
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  logger.info('Auth cookies cleared');
};

/**
 * Get token from cookie or header
 */
export const getTokenFromRequest = (req) => {
  // Try to get from Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to cookie
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
};

/**
 * Middleware to parse cookies (if not using cookie-parser)
 */
export const parseCookies = (req, res, next) => {
  const cookieHeader = req.headers.cookie;
  
  if (!cookieHeader) {
    req.cookies = {};
    return next();
  }

  req.cookies = cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});

  next();
};

/**
 * Set custom cookie with security defaults
 */
export const setSecureCookie = (res, name, value, options = {}) => {
  const config = {
    ...COOKIE_CONFIG,
    ...options
  };
  
  res.cookie(name, value, config);
  logger.info(`Cookie set: ${name}`);
};

/**
 * Middleware to validate cookie security
 */
export const validateCookieSecurity = (req, res, next) => {
  // In production, ensure HTTPS
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    logger.warn('Insecure request in production', {
      url: req.url,
      ip: req.ip
    });
  }

  next();
};

export default {
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getTokenFromRequest,
  parseCookies,
  setSecureCookie,
  validateCookieSecurity
};
