import express from 'express';
import * as AdminUser from '../controllers/admin/user.controller.js';
import * as AdminLink from '../controllers/admin/link.controller.js';
import * as AdminSystem from '../controllers/admin/system.controller.js';
import * as AdminStats from '../controllers/admin/stats.controller.js';
import * as AdminClaim from '../controllers/admin/claim.controller.js';
import * as ClaimAdmin from '../controllers/claim/admin.controller.js';
import { exchangeController } from '../controllers/exchangeController.js';
import { tierController } from '../controllers/tierController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User Management
router.get('/users', AdminUser.getAllUsers);
router.get('/users/:id', AdminUser.getUserDetails);
router.put('/users/:id/role', AdminUser.updateUserRole);

// Connection Management
router.put('/users/links/:link_id', AdminLink.setCustomCommissionRate);
router.patch('/users/links/:link_id/status', AdminLink.updateConnectionStatus);
router.post('/users/links', AdminLink.createConnection);
router.delete('/users/links/:link_id', AdminLink.deleteConnection);

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
router.get('/crawler-tokens', AdminSystem.getCrawlerTokens);
router.put('/crawler-tokens', AdminSystem.updateCrawlerToken);

// System Settings
router.get('/settings', AdminSystem.getSystemSettings);
router.put('/settings', AdminSystem.updateSystemSettings);

// Dashboard Statistics
router.get('/stats', AdminStats.getDashboardStats);

// Claims Management - Legacy
router.get('/claims', ClaimAdmin.getAllClaims);
router.put('/claims/:id', ClaimAdmin.updateClaimStatus);

// Claims Management - Admin Approval Workflow
router.get('/claims/pending', AdminClaim.getAwaitingApproval);
router.post('/claims/:id/approve', AdminClaim.approveClaim);
router.post('/claims/:id/reject', AdminClaim.rejectClaim);

export default router;