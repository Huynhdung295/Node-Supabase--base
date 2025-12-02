/**
 * Profile Transaction Controller
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as TransactionService from '../../services/profile/transactionService.js';

/**
 * @swagger
 * /api/me/balance:
 *   get:
 *     summary: Get available balance
 *     tags: [Profile - Transactions]
 */
export const getMyBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const balance = await TransactionService.getBalance(userId);
  return successResponse(res, balance, 'Balance retrieved successfully');
});

/**
 * @swagger
 * /api/me/transactions:
 *   get:
 *     summary: Get own transactions
 *     tags: [Profile - Transactions]
 */
export const getMyTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  
  const transactions = await TransactionService.getTransactions(userId, { 
    page: parseInt(page), 
    limit: parseInt(limit) 
  });
  return successResponse(res, transactions, 'Transactions retrieved successfully');
});

/**
 * @swagger
 * /api/me/login-history:
 *   get:
 *     summary: Get login history
 *     tags: [Profile - Security]
 */
export const getLoginHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  
  const history = await TransactionService.getLoginHistory(userId, { 
    page: parseInt(page), 
    limit: parseInt(limit) 
  });
  return successResponse(res, history, 'Login history retrieved successfully');
});
