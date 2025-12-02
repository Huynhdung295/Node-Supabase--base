/**
 * Admin User Controller
 * Handles user management operations for admin role
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as UserService from '../../services/admin/userService.js';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or full name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, cs, admin]
 *       - in: query
 *         name: tier_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, tier_id } = req.query;
  const requesterRole = req.user.profile.role;

  const users = await UserService.listUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    role,
    tier_id,
    requesterRole
  });

  return successResponse(res, users, 'Users retrieved successfully');
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 */
export const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await UserService.getUserById(id);

  return successResponse(res, user, 'User details retrieved successfully');
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role and/or status (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, cs, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Role or status is required
 *       403:
 *         description: Cannot update user with equal or higher role
 *       404:
 *         description: User not found
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  const updateData = {};
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('Role or status is required');
  }

  const requesterRole = req.user.profile.role;

  const user = await UserService.updateUserRole(id, updateData, requesterRole);

  return successResponse(res, user, 'User updated successfully');
});
