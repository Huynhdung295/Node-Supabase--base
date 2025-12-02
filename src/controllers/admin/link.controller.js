/**
 * Admin Link Controller
 * Handles user-exchange connection management for admin role
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import { LINK_STATUS } from '../../constants/index.js';
import * as LinkService from '../../services/admin/linkService.js';

/**
 * @swagger
 * /api/admin/users/links/{link_id}:
 *   put:
 *     summary: Set custom commission rate for a connection (Admin only)
 *     tags: [Admin - Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: link_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custom_commission_rate
 *             properties:
 *               custom_commission_rate:
 *                 type: number
 *                 format: float
 *                 description: Custom commission rate (e.g., 0.05 for 5%)
 *     responses:
 *       200:
 *         description: Custom commission rate updated successfully
 *       400:
 *         description: custom_commission_rate is required
 *       404:
 *         description: Exchange link not found
 */
export const setCustomCommissionRate = asyncHandler(async (req, res) => {
  const { link_id } = req.params;
  const { custom_commission_rate } = req.body;

  if (custom_commission_rate === undefined) {
    throw new BadRequestError('custom_commission_rate is required');
  }

  const link = await LinkService.setCustomCommissionRate(link_id, custom_commission_rate);

  return successResponse(res, link, 'Custom commission rate updated successfully');
});

/**
 * @swagger
 * /api/admin/users/links/{link_id}/status:
 *   patch:
 *     summary: Update connection status (Admin only)
 *     tags: [Admin - Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: link_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: Connection status updated successfully
 *       400:
 *         description: Valid status is required
 *       404:
 *         description: Exchange link not found
 */
export const updateConnectionStatus = asyncHandler(async (req, res) => {
  const { link_id } = req.params;
  const { status } = req.body;

  // Validate status using constant
  const validStatuses = Object.values(LINK_STATUS);
  if (!status || !validStatuses.includes(status)) {
    throw new BadRequestError(`Valid status (${validStatuses.join('/')}) is required`);
  }

  const link = await LinkService.updateConnectionStatus(link_id, status);

  return successResponse(res, link, 'Connection status updated successfully');
});

/**
 * @swagger
 * /api/admin/users/links:
 *   post:
 *     summary: Create user-exchange connection (Admin only)
 *     tags: [Admin - Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - exchange_id
 *               - exchange_uid
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               exchange_id:
 *                 type: string
 *                 format: uuid
 *               exchange_uid:
 *                 type: string
 *                 description: User's UID on the exchange platform
 *               status:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *                 default: verified
 *     responses:
 *       200:
 *         description: Connection created successfully
 *       400:
 *         description: Required fields missing or connection already exists
 */
export const createConnection = asyncHandler(async (req, res) => {
  const { user_id, exchange_id, exchange_uid, status = 'verified' } = req.body;

  if (!user_id || !exchange_id || !exchange_uid) {
    throw new BadRequestError('user_id, exchange_id, and exchange_uid are required');
  }

  const link = await LinkService.createConnection(user_id, exchange_id, exchange_uid, status);

  return successResponse(res, link, 'Connection created successfully');
});

/**
 * @swagger
 * /api/admin/users/links/{link_id}:
 *   delete:
 *     summary: Remove user-exchange connection (Admin only)
 *     tags: [Admin - Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: link_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Connection removed successfully
 *       404:
 *         description: Connection not found
 */
export const deleteConnection = asyncHandler(async (req, res) => {
  const { link_id } = req.params;

  await LinkService.deleteConnection(link_id);

  return successResponse(res, null, 'Connection removed successfully');
});
