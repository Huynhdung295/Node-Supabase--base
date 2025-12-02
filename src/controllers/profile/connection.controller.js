/**
 * Profile Connection Controller
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as ConnectionService from '../../services/profile/connectionService.js';

/**
 * @swagger
 * /api/me/connections:
 *   get:
 *     summary: Get own exchange connections
 *     tags: [Profile - Connections]
 *     security:
 *       - bearerAuth: []
 */
export const getMyConnections = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const connections = await ConnectionService.getMyConnections(userId);
  return successResponse(res, connections, 'Connections retrieved successfully');
});

/**
 * @swagger
 * /api/me/connections:
 *   post:
 *     summary: Create new exchange connection
 *     tags: [Profile - Connections]
 *     security:
 *       - bearerAuth: []
 */
export const createConnection = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { exchange_id, exchange_uid } = req.body;
  
  if (!exchange_id || !exchange_uid) {
    throw new BadRequestError('exchange_id and exchange_uid are required');
  }
  
  const link = await ConnectionService.createConnection(userId, exchange_id, exchange_uid);
  return successResponse(res, link, 'Connection created successfully');
});

/**
 * @swagger
 * /api/me/connections/{id}:
 *   put:
 *     summary: Update exchange connection
 *     tags: [Profile - Connections]
 */
export const updateConnection = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { exchange_uid, exchange_email } = req.body;
  
  const link = await ConnectionService.updateConnection(userId, id, { exchange_uid, exchange_email });
  return successResponse(res, link, 'Connection updated successfully');
});

/**
 * @swagger
 * /api/me/connections/{id}:
 *   delete:
 *     summary: Delete exchange connection
 *     tags: [Profile - Connections]
 */
export const deleteConnection = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  await ConnectionService.deleteConnection(userId, id);
  return successResponse(res, null, 'Connection removed successfully');
});
