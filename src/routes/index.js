import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import tierRoutes from './tierRoutes.js';
import exchangeRoutes from './exchangeRoutes.js';
import profileRoutes from './profileRoutes.js';
import claimRoutes from './claimRoutes.js';
import adminRoutes from './adminRoutes.js';
import csRoutes from './csRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Exchange Management API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      // Public endpoints
      auth: '/auth',
      tiers: '/tiers',
      exchanges: '/exchanges',
      settings: '/settings',
      
      // User endpoints
      profile: '/me',
      claims: '/me/claims',
      
      // Admin endpoints
      admin: '/admin',
      
      // CS endpoints
      cs: '/cs',
      
      // Legacy
      users: '/users',
      docs: '/api-docs'
    }
  });
});

// Public routes (no authentication required)
router.use('/auth', authRoutes);
router.use('/tiers', tierRoutes);
router.use('/exchanges', exchangeRoutes);
router.use('/settings', settingsRoutes);

// User routes (authentication required)
router.use('/me', profileRoutes);
router.use('/me/claims', claimRoutes);

// Admin routes (admin role required)
router.use('/admin', adminRoutes);

// CS routes (CS or admin role required)
router.use('/cs', csRoutes);

// Legacy routes
router.use('/users', userRoutes);

// Import metrics routes dynamically to avoid circular dependencies
import('./metricsRoutes.js').then(module => {
  router.use('/metrics', module.default);
});

export default router;
