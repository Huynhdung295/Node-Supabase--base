/**
 * Admin Stats Controller
 * Handles admin dashboard statistics
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as StatsService from '../../services/admin/statsService.js';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     tags: [Admin - Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         by_role:
 *                           type: object
 *                     exchanges:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                     claims:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         total_amount:
 *                           type: number
 *                     transactions:
 *                       type: object
 *                       properties:
 *                         count_30d:
 *                           type: integer
 *                         commission_30d:
 *                           type: number
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await StatsService.getDashboardStats();

  return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
});
