/**
 * CS User Controller
 * Handles user management for CS role
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as UserService from '../../services/cs/userService.js';

/**
 * @swagger
 * /api/cs/users:
 *   get:
 *     summary: Get all regular users (CS role)
 *     tags: [CS - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const users = await UserService.listUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    search
  });

  return successResponse(res, users, 'Users retrieved successfully');
});

/**
 * @swagger
 * /api/cs/users/{id}:
 *   get:
 *     summary: Get user info for support (CS role)
 *     tags: [CS - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User info retrieved
 *       404:
 *         description: User not found
 */
export const getUserInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await UserService.getUserById(id);

  return successResponse(res, user, 'User info retrieved successfully');
});

/**
 * @swagger
 * /api/cs/users/{id}:
 *   put:
 *     summary: Update user (limited fields) (CS role)
 *     tags: [CS - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, phone } = req.body;

  const updateData = { full_name, phone };
  const user = await UserService.updateUser(id, updateData);

  return successResponse(res, user, 'User updated successfully');
});

/**
 * @swagger
 * /api/cs/users/{id}/reset-password:
 *   post:
 *     summary: Send password reset email (CS role)
 *     tags: [CS - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.sendPasswordResetEmail(id);

  return successResponse(res, result, 'Password reset email sent successfully');
});
