import express from 'express';
import * as ClaimAdmin from '../controllers/claim/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Admin claim management
router.get('/claims', ClaimAdmin.getAllClaims);
router.put('/claims/:id', ClaimAdmin.updateClaimStatus);

export default router;
