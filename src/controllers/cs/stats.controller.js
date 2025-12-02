/**
 * CS Stats Controller
 * Handles CS dashboard statistics
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as StatsService from '../../services/cs/statsService.js';

/**
 * @swagger
 * /api/cs/dashboard:
 *   get:
 *     summary: Get CS dashboard statistics
 *     tags: [CS - Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await StatsService.getDashboardStats();

  return successResponse(res, stats, 'CS dashboard stats retrieved successfully');
});
