import express from 'express';
import * as ClaimUser from '../controllers/claim/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// User claim operations
router.post('/', authenticate, ClaimUser.createClaim);
router.post('/confirm', authenticate, ClaimUser.confirmClaim);
router.post('/:id/resend', authenticate, ClaimUser.resendCode);
router.get('/', authenticate, ClaimUser.getMyClaims);

export default router;