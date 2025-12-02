/**
 * Token Hashing Utility
 * Hashes sensitive tokens for display (abc***xyz)
 */

/**
 * Hash a token for display purposes
 * @param {string} token - Full token string
 * @returns {string} - Hashed token (first 3 + *** + last 3)
 */
export const hashToken = (token) => {
  if (!token || typeof token !== 'string') return '***';
  
  if (token.length < 10) {
    return '***';
  }

  const start = token.substring(0, 3);
  const end = token.substring(token.length - 3);
  const middleLength = Math.min(token.length - 6, 20); // Max 20 asterisks
  
  return `${start}${'*'.repeat(middleLength)}${end}`;
};

/**
 * Hash multiple tokens in an object
 * @param {object} obj - Object with token field
 * @param {string} tokenField - Name of token field (default: 'token')
 * @returns {object} - Object with hashed token
 */
export const hashTokenInObject = (obj, tokenField = 'token') => {
  if (!obj || !obj[tokenField]) return obj;

  return {
    ...obj,
    [tokenField]: hashToken(obj[tokenField])
  };
};
