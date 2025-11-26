import express from 'express';
import { claimController } from '../controllers/claimController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/me/claims:
 *   post:
 *     summary: Create withdrawal request
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Claim request created
 */
router.post('/', authenticate, claimController.createClaim);

/**
 * @swagger
 * /api/me/claims/confirm:
 *   post:
 *     summary: Confirm withdrawal with verification code
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Claim confirmed successfully
 */
router.post('/confirm', authenticate, claimController.confirmClaim);

/**
 * @swagger
 * /api/me/claims:
 *   get:
 *     summary: Get own claim history
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user claims
 */
router.get('/', authenticate, claimController.getMyClaims);

export default router;