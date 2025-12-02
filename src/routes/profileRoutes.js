import express from 'express';
import * as ProfileController from '../controllers/profile/profile.controller.js';
import * as ConnectionController from '../controllers/profile/connection.controller.js';
import * as TransactionController from '../controllers/profile/transaction.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Profile
router.get('/profile', authenticate, ProfileController.getMyProfile);
router.put('/profile', authenticate, ProfileController.updateMyProfile);

// Connections
router.get('/connections', authenticate, ConnectionController.getMyConnections);
router.post('/connections', authenticate, ConnectionController.createConnection);
router.put('/connections/:id', authenticate, ConnectionController.updateConnection);
router.delete('/connections/:id', authenticate, ConnectionController.deleteConnection);

// Transactions & Balance
router.get('/balance', authenticate, TransactionController.getMyBalance);
router.get('/transactions', authenticate, TransactionController.getMyTransactions);
router.get('/login-history', authenticate, TransactionController.getLoginHistory);

export default router;