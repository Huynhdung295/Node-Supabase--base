import express from 'express';
import { crawlerController } from '../controllers/crawlerController.js';

const router = express.Router();

/**
 * @swagger
 * /api/crawler/transactions:
 *   post:
 *     summary: Submit transactions (Crawler)
 *     tags: [Crawler]
 *     parameters:
 *       - in: header
 *         name: x-crawler-token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exchange_id
 *               - transactions
 *             properties:
 *               exchange_id:
 *                 type: integer
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - exchange_uid
 *                     - raw_volume
 *                   properties:
 *                     exchange_uid:
 *                       type: string
 *                     raw_volume:
 *                       type: number
 *                     transaction_date:
 *                       type: string
 *                       format: date-time
 *                     raw_data:
 *                       type: object
 *     responses:
 *       200:
 *         description: Transactions processed
 *       401:
 *         description: Invalid token
 */
router.post('/transactions', crawlerController.submitTransactions);

export default router;
