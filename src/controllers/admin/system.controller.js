/**
 * Admin System Controller
 * System settings and crawler token management
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import { hashToken } from '../../utils/hashToken.js';
import * as SystemService from '../../services/admin/systemService.js';

/**
 * @swagger
 * /api/admin/crawler-tokens:
 *   get:
 *     summary: Get all exchanges with crawler token info (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All exchanges with token info retrieved (tokens are hashed)
 */
export const getCrawlerTokens = asyncHandler(async (req, res) => {
  const exchanges = await SystemService.getCrawlerTokens();
  
  // Hash tokens before sending to client
  const hashedExchanges = exchanges.map(ex => ({
    ...ex,
    token_info: ex.token_info && ex.token_info.token ? {
      ...ex.token_info,
      token: hashToken(ex.token_info.token)
    } : null,
    crawler_tokens: undefined // Remove raw array
  }));
  
  return successResponse(res, hashedExchanges, 'Exchanges with crawler tokens retrieved');
});

/**
 * @swagger
 * /api/admin/crawler-tokens:
 *   put:
 *     summary: Update or create crawler token (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exchange_id
 *               - token
 *             properties:
 *               exchange_id:
 *                 type: integer
 *               token:
 *                 type: string
 *               expired_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Crawler token updated successfully
 */
export const updateCrawlerToken = asyncHandler(async (req, res) => {
  const { exchange_id, token, expired_at } = req.body;

  if (!exchange_id || !token) {
    throw new BadRequestError('exchange_id and token are required');
  }

  const result = await SystemService.upsertCrawlerToken(exchange_id, token, expired_at);

  return successResponse(res, result, 'Crawler token updated successfully');
});

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all system settings (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved
 */
export const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await SystemService.getSystemSettings();

  return successResponse(res, settings, 'System settings retrieved successfully');
});

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings (Admin)
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: object
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: System settings updated
 */
export const updateSystemSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  const updates = await SystemService.updateSystemSettings(settings);

  return successResponse(res, updates, 'System settings updated successfully');
});
