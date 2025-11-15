import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';

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
    message: 'Supabase Management API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      users: '/users',
      docs: '/api-docs'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Import metrics routes dynamically to avoid circular dependencies
import('./metricsRoutes.js').then(module => {
  router.use('/metrics', module.default);
});

export default router;
