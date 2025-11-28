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
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/role', adminController.updateUserRole);

// Connection Management
router.put('/users/links/:link_id', adminController.setCustomCommissionRate);
router.patch('/users/links/:link_id/status', adminController.updateConnectionStatus);
router.delete('/users/links/:link_id', adminController.deleteConnection);

// Exchange Management
router.get('/exchanges', exchangeController.getAllExchanges);
router.post('/exchanges', exchangeController.createExchange);
router.put('/exchanges/:id', exchangeController.updateExchange);
router.delete('/exchanges/:id', exchangeController.deleteExchange);
router.get('/exchanges/:id/tiers', exchangeController.getExchangeTiers);
router.put('/exchanges/tiers', exchangeController.updateExchangeTiers);

// Tier Management
router.get('/tiers', tierController.getAllTiers);
router.post('/tiers', tierController.createTier);
router.put('/tiers/:id', tierController.updateTier);
router.delete('/tiers/:id', tierController.deleteTier);

// Crawler Token Management
router.get('/crawler-tokens', adminController.getCrawlerTokens);
router.put('/crawler-tokens', adminController.updateCrawlerToken);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Dashboard Statistics
router.get('/stats', adminController.getDashboardStats);

// Claims Management
router.get('/claims', claimController.getAllClaims);
router.put('/claims/:id', claimController.updateClaimStatus);

export default router;