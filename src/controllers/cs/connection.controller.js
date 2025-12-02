/**
 * CS Connection Controller
 * Handles connection management for CS role
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as ConnectionService from '../../services/cs/connectionService.js';

/**
 * @swagger
 * /api/cs/connections:
 *   get:
 *     summary: Get pending connections (CS role)
 *     tags: [CS - Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending connections retrieved
 */
export const getPendingConnections = asyncHandler(async (req, res) => {
  const connections = await ConnectionService.getPendingConnections();

  return successResponse(res, connections, 'Pending connections retrieved successfully');
});

/**
 * @swagger
 * /api/cs/connections/{id}:
 *   put:
 *     summary: Approve or reject connection (CS role)
 *     tags: [CS - Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [verified, rejected]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection processed
 */
export const processConnection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    throw new BadRequestError('Status is required');
  }

  const connection = await ConnectionService.processConnection(id, status, notes);

  return successResponse(res, connection, 'Connection processed successfully');
});

/**
 * @swagger
 * /api/cs/users/links:
 *   post:
 *     summary: Create user connection (CS role)
 *     tags: [CS - Connections]
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
 *               exchange_id:
 *                 type: string
 *               exchange_uid:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, verified]
 *     responses:
 *       200:
 *         description: Connection created
 */
export const createConnection = asyncHandler(async (req, res) => {
  const { user_id, exchange_id, exchange_uid, status = 'verified' } = req.body;

  if (!user_id || !exchange_id || !exchange_uid) {
    throw new BadRequestError('user_id, exchange_id, and exchange_uid are required');
  }

  const link = await ConnectionService.createConnection(user_id, exchange_id, exchange_uid, status);

  return successResponse(res, link, 'Connection created successfully');
});
