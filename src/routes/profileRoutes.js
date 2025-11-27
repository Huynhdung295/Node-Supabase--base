import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/me/profile:
 *   get:
 *     summary: Get own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/profile', authenticate, profileController.getMyProfile);

/**
 * @swagger
 * /api/me/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated profile data
 */
router.put('/profile', authenticate, profileController.updateMyProfile);

/**
 * @swagger
 * /api/me/connections:
 *   get:
 *     summary: Get own exchange connections
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exchange connections
 */
router.get('/connections', authenticate, profileController.getMyConnections);

/**
 * @swagger
 * /api/me/connections:
 *   post:
 *     summary: Connect to new exchange
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Exchange connection created
 */
router.post('/connections', authenticate, profileController.createConnection);

/**
 * @swagger
 * /api/me/connections/:id:
 *   put:
 *     summary: Update exchange connection
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection updated
 */
router.put('/connections/:id', authenticate, profileController.updateConnection);

/**
 * @swagger
 * /api/me/connections/:id:
 *   delete:
 *     summary: Remove exchange connection
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection removed
 */
router.delete('/connections/:id', authenticate, profileController.deleteConnection);

/**
 * @swagger
 * /api/me/balance:
 *   get:
 *     summary: Get available balance
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User balance information
 */
router.get('/balance', authenticate, profileController.getMyBalance);

/**
 * @swagger
 * /api/me/transactions:
 *   get:
 *     summary: Get own transactions
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user transactions
 */
router.get('/transactions', authenticate, profileController.getMyTransactions);

/**
 * @swagger
 * /api/me/login-history:
 *   get:
 *     summary: Get login history
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User login history
 */
router.get('/login-history', authenticate, profileController.getLoginHistory);

export default router;