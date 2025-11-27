import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  refreshToken,
  recoverPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints cho authentication
 */

// Routes
router.post('/register', register); // strictRateLimiter removed
router.post('/login', login); // strictRateLimiter removed
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/recover', recoverPassword); // strictRateLimiter removed

export default router;
