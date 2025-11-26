import express from 'express';
import { tierController } from '../controllers/tierController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/tiers:
 *   get:
 *     summary: Get all tiers (public)
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: List of all tiers
 */
router.get('/', tierController.getAllTiers);

export default router;