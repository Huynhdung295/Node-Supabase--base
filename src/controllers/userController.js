import { supabaseAdmin } from '../config/supabase.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách users (Admin only)
 *     tags: [Users]
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
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, aff]
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [silver, gold, diamond]
 *     responses:
 *       200:
 *         description: List of users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, tier } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (tier) {
      query = query.eq('tier_vip', tier);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         description: User not found
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check permission: user chỉ xem được profile của mình, admin xem được tất cả
    if (req.user.profile.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('User not found');
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user
 *     tags: [Users]
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
 *             properties:
 *               full_name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user, aff]
 *               tier_vip:
 *                 type: string
 *                 enum: [silver, gold, diamond]
 *     responses:
 *       200:
 *         description: User updated
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, avatar_url, role, tier_vip, is_active } = req.body;

    // Check permission
    const isOwnProfile = req.user.id === id;
    const isAdmin = req.user.profile.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // User thường không thể thay đổi role, tier, is_active
    const updateData = {};
    
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Chỉ admin mới được thay đổi role, tier, is_active
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (tier_vip !== undefined) updateData.tier_vip = tier_vip;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      message: 'User updated successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Không cho phép xóa chính mình
    if (req.user.id === id) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    // Xóa user từ Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      throw new Error(authError.message);
    }

    // Profile sẽ tự động xóa do CASCADE

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}/upgrade-tier:
 *   post:
 *     summary: Nâng cấp tier VIP (Admin only)
 *     tags: [Users]
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
 *               - tier
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [silver, gold, diamond]
 *     responses:
 *       200:
 *         description: Tier upgraded
 */
export const upgradeTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!['silver', 'gold', 'diamond'].includes(tier)) {
      throw new ValidationError('Invalid tier. Must be silver, gold, or diamond');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ tier_vip: tier })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      message: 'Tier upgraded successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}/change-role:
 *   post:
 *     summary: Thay đổi role (Admin only)
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, aff]
 *     responses:
 *       200:
 *         description: Role changed
 */
export const changeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user', 'aff'].includes(role)) {
      throw new ValidationError('Invalid role. Must be admin, user, or aff');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      message: 'Role changed successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
