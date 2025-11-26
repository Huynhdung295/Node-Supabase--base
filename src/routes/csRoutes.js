import express from 'express';
import { csController } from '../controllers/csController.js';
import { claimController } from '../controllers/claimController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All CS routes require authentication and CS or admin role
router.use(authenticate);
router.use(authorize('cs', 'admin'));

// Connection Management
/**
 * @swagger
 * /api/cs/connections:
 *   get:
 *     summary: Get pending connections (CS)
 *     tags: [CS - Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending connections
 */
router.get('/connections', csController.getPendingConnections);

/**
 * @swagger
 * /api/cs/connections/{id}:
 *   put:
 *     summary: Process connection (CS)
 *     tags: [CS - Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection processed successfully
 */
router.put('/connections/:id', csController.processConnection);

// Claim Management
/**
 * @swagger
 * /api/cs/claims:
 *   get:
 *     summary: Get pending claims (CS)
 *     tags: [CS - Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending claims
 */
router.get('/claims', claimController.getPendingClaims);

/**
 * @swagger
 * /api/cs/claims/{id}:
 *   put:
 *     summary: Process claim (CS)
 *     tags: [CS - Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Claim processed successfully
 */
router.put('/claims/:id', claimController.processClaim);

// User Support
/**
 * @swagger
 * /api/cs/users/{id}:
 *   get:
 *     summary: Get user info for support (CS)
 *     tags: [CS - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information for support
 */
router.get('/users/:id', csController.getUserInfo);

// Dashboard
/**
 * @swagger
 * /api/cs/dashboard:
 *   get:
 *     summary: Get CS dashboard stats
 *     tags: [CS - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CS dashboard statistics
 */
router.get('/dashboard', csController.getDashboardStats);

export default router;