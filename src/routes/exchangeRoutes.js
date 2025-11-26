import express from 'express';
import { exchangeController } from '../controllers/exchangeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/exchanges:
 *   get:
 *     summary: Get active exchanges (public)
 *     tags: [Exchanges]
 *     responses:
 *       200:
 *         description: List of active exchanges
 */
router.get('/', exchangeController.getActiveExchanges);

export default router;