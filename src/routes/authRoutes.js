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
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/recover', recoverPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;
