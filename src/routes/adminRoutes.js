import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { exchangeController } from '../controllers/exchangeController.js';
import { tierController } from '../controllers/tierController.js';
import { claimController } from '../controllers/claimController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User Management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:id', adminController.getUserDetails);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role/status (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:id/role', adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/links/{link_id}:
 *   put:
 *     summary: Set custom commission rate (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission rate updated
 */
router.put('/users/links/:link_id', adminController.setCustomCommissionRate);

// Exchange Management
/**
 * @swagger
 * /api/admin/exchanges:
 *   get:
 *     summary: Get all exchanges (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all exchanges
 */
router.get('/exchanges', exchangeController.getAllExchanges);

/**
 * @swagger
 * /api/admin/exchanges:
 *   post:
 *     summary: Create exchange (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Exchange created successfully
 */
router.post('/exchanges', exchangeController.createExchange);

/**
 * @swagger
 * /api/admin/exchanges/{id}:
 *   put:
 *     summary: Update exchange (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exchange updated successfully
 */
router.put('/exchanges/:id', exchangeController.updateExchange);

/**
 * @swagger
 * /api/admin/exchanges/{id}:
 *   delete:
 *     summary: Delete exchange (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exchange deleted successfully
 */
router.delete('/exchanges/:id', exchangeController.deleteExchange);

/**
 * @swagger
 * /api/admin/exchanges/{id}/tiers:
 *   get:
 *     summary: Get exchange tier configs (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exchange tier configurations
 */
router.get('/exchanges/:id/tiers', exchangeController.getExchangeTiers);

/**
 * @swagger
 * /api/admin/exchanges/tiers:
 *   put:
 *     summary: Update exchange tier configs (Admin)
 *     tags: [Admin - Exchanges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tier configs updated successfully
 */
router.put('/exchanges/tiers', exchangeController.updateExchangeTiers);

// Tier Management
/**
 * @swagger
 * /api/admin/tiers:
 *   post:
 *     summary: Create tier (Admin)
 *     tags: [Admin - Tiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tier created successfully
 */
router.post('/tiers', tierController.createTier);

/**
 * @swagger
 * /api/admin/tiers/{id}:
 *   put:
 *     summary: Update tier (Admin)
 *     tags: [Admin - Tiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tier updated successfully
 */
router.put('/tiers/:id', tierController.updateTier);

/**
 * @swagger
 * /api/admin/tiers/{id}:
 *   delete:
 *     summary: Delete tier (Admin)
 *     tags: [Admin - Tiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tier deleted successfully
 */
router.delete('/tiers/:id', tierController.deleteTier);

// Crawler Token Management
/**
 * @swagger
 * /api/admin/crawler-tokens:
 *   get:
 *     summary: Get crawler tokens (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of crawler tokens
 */
router.get('/crawler-tokens', adminController.getCrawlerTokens);

/**
 * @swagger
 * /api/admin/crawler-tokens:
 *   put:
 *     summary: Update crawler token (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token updated successfully
 */
router.put('/crawler-tokens', adminController.updateCrawlerToken);

// System Settings
/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 */
router.get('/settings', adminController.getSystemSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings', adminController.updateSystemSettings);

// Claims Management
/**
 * @swagger
 * /api/admin/claims:
 *   get:
 *     summary: Get all claims (Admin)
 *     tags: [Admin - Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all claims
 */
router.get('/claims', claimController.getAllClaims);

// Dashboard Stats
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', adminController.getDashboardStats);

export default router;