// Helper utility functions

import { TIER_HIERARCHY, VIP_TIERS } from '../config/constants.js';

/**
 * Compare two VIP tiers
 * @param {string} tier1 - First tier
 * @param {string} tier2 - Second tier
 * @returns {number} - Negative if tier1 < tier2, 0 if equal, positive if tier1 > tier2
 */
export const compareTiers = (tier1, tier2) => {
  return TIER_HIERARCHY[tier1] - TIER_HIERARCHY[tier2];
};

/**
 * Check if user has required tier or higher
 * @param {string} userTier - User's current tier
 * @param {string} requiredTier - Required tier
 * @returns {boolean}
 */
export const hasTierAccess = (userTier, requiredTier) => {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
};

/**
 * Get next tier upgrade
 * @param {string} currentTier - Current tier
 * @returns {string|null} - Next tier or null if already at max
 */
export const getNextTier = (currentTier) => {
  const tiers = Object.keys(TIER_HIERARCHY).sort((a, b) => TIER_HIERARCHY[a] - TIER_HIERARCHY[b]);
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
};

/**
 * Sanitize user object (remove sensitive data)
 * @param {object} user - User object
 * @returns {object} - Sanitized user
 */
export const sanitizeUser = (user) => {
  const { password, refresh_token, ...sanitized } = user;
  return sanitized;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string}
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse pagination params from query
 * @param {object} query - Request query object
 * @returns {object} - { page, limit, offset }
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Format error for API response
 * @param {Error} error - Error object
 * @returns {object}
 */
export const formatError = (error) => {
  return {
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
};

/**
 * Check if string is valid UUID
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Mask email for privacy
 * @param {string} email - Email to mask
 * @returns {string}
 */
export const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number}
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Deep clone object
 * @param {object} obj - Object to clone
 * @returns {object}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove null/undefined values from object
 * @param {object} obj - Object to clean
 * @returns {object}
 */
export const removeEmpty = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string}
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default {
  compareTiers,
  hasTierAccess,
  getNextTier,
  sanitizeUser,
  generateRandomString,
  sleep,
  parsePagination,
  formatError,
  isValidUUID,
  maskEmail,
  calculatePercentage,
  deepClone,
  removeEmpty,
  capitalize,
  formatDate
};
