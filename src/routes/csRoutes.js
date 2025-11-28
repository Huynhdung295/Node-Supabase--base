import express from 'express';
import { csController } from '../controllers/csController.js';
import { claimController } from '../controllers/claimController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All CS routes require authentication and CS or admin role
router.use(authenticate);
router.use(authorize('cs', 'admin'));

// Dashboard
router.get('/dashboard', csController.getDashboardStats);

// User Management
router.get('/users', csController.getUsers);
router.get('/users/:id', csController.getUserInfo);
router.put('/users/:id', csController.updateUser);
router.post('/users/:id/reset-password', csController.resetUserPassword);

// Connection Management
router.post('/users/links', csController.createConnection);
router.get('/connections', csController.getPendingConnections);
router.put('/connections/:id', csController.processConnection);

// Claim Management
router.get('/claims', claimController.getPendingClaims);
router.put('/claims/:id', claimController.processClaim);

export default router;