/**
 * Profile Controller - Main profile operations
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as ProfileService from '../../services/profile/profileService.js';

/**
 * @swagger
 * /api/me/profile:
 *   get:
 *     summary: Get own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await ProfileService.getProfile(userId);
  return successResponse(res, profile, 'Profile retrieved successfully');
});

/**
 * @swagger
 * /api/me/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
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
 *               avatar_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, avatar_url } = req.body;
  
  const profile = await ProfileService.updateProfile(userId, { full_name, phone, avatar_url });
  return successResponse(res, profile, 'Profile updated successfully');
});
