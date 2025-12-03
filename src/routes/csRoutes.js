import express from 'express';
import * as CSUser from '../controllers/cs/user.controller.js';
import * as CSConnection from '../controllers/cs/connection.controller.js';
import * as CSStats from '../controllers/cs/stats.controller.js';
import * as CSClaim from '../controllers/cs/claim.controller.js';
import * as ClaimAdmin from '../controllers/claim/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All CS routes require authentication and CS or admin role
router.use(authenticate);
router.use(authorize('cs', 'admin'));

// Dashboard
router.get('/dashboard', CSStats.getDashboardStats);

// User Management
router.get('/users', CSUser.getUsers);
router.get('/users/:id', CSUser.getUserInfo);
router.put('/users/:id', CSUser.updateUser);
router.post('/users/:id/reset-password', CSUser.resetUserPassword);

// Connection Management
router.post('/users/links', CSConnection.createConnection);
router.get('/connections', CSConnection.getPendingConnections);
router.put('/connections/:id', CSConnection.processConnection);

// Claim Management - Legacy
router.get('/claims', ClaimAdmin.getPendingClaims);
router.post('/claims/:id/send-code', ClaimAdmin.sendCSCode);
router.post('/claims/:id/verify', ClaimAdmin.verifyClaim);
router.put('/claims/:id/status', ClaimAdmin.manualUpdate);
router.put('/claims/:id', ClaimAdmin.processClaim);

// Claim Management - Admin Approval Workflow
router.post('/claims/:id/request-approval', CSClaim.requestAdminApproval);
router.post('/claims/:id/refund', CSClaim.processRefund);
router.post('/claims/:id/re-request-admin', CSClaim.reRequestAdminApproval);
router.get('/claims/approved', CSClaim.getAdminApprovedClaims);
router.get('/claims/refund-pending', CSClaim.getClaimsNeedingRefund);

export default router;