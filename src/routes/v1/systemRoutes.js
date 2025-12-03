import { Router } from 'express';
import * as systemController from '../../controllers/systemController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/v1/system/add-balance
 * @desc    Manually add balance to user account
 * @access  System only
 */
router.post('/add-balance', authenticate, authorize('system'), systemController.addBalanceToUser);

export default router;
