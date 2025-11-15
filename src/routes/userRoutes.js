import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upgradeTier,
  changeRole
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints cho user management
 */

// Routes yêu cầu authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), getUsers);

// Get user by ID (user có thể xem profile của mình, admin xem tất cả)
router.get('/:id', getUserById);

// Update user (user update profile của mình, admin update tất cả)
router.put('/:id', updateUser);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), deleteUser);

// Upgrade tier (admin only)
router.post('/:id/upgrade-tier', authorize('admin'), upgradeTier);

// Change role (admin only)
router.post('/:id/change-role', authorize('admin'), changeRole);

export default router;
