import { supabase, supabaseAdmin } from '../config/supabase.js';
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký user mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *               ref_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, ref_code } = req.body;

    if (!email || !password || !full_name) {
      throw new ValidationError('Email, password, and full_name are required');
    }

    // Check if referrer exists if ref_code provided
    let referrer_id = null;
    if (ref_code) {
      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('ref_code', ref_code.toUpperCase())
        .single();
      
      if (referrer) {
        referrer_id = referrer.id;
      }
    }

    // Get default tier (Bronze)
    const { data: defaultTier } = await supabaseAdmin
      .from('tiers')
      .select('id')
      .eq('slug', 'bronze')
      .single();

    // Tạo user trong Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        full_name
      }
    });

    if (authError) {
      throw new ValidationError(authError.message);
    }

    // Generate unique ref code
    const { data: newRefCode } = await supabaseAdmin.rpc('generate_ref_code');

    // Profile will be created automatically by trigger
    // But we need to update it with additional info
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for trigger

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        ref_code: newRefCode,
        referrer_id,
        current_tier_id: defaultTier?.id || 1,
        is_email_verified: false
      })
      .eq('id', authData.user.id)
      .select(`
        *,
        tiers (
          id,
          name,
          slug
        )
      `)
      .single();

    if (profileError) {
      // Rollback: xóa user nếu update profile thất bại
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new ValidationError('Failed to create user profile');
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Lấy profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        tiers (
          id,
          name,
          slug,
          color_hex
        )
      `)
      .eq('id', data.user.id)
      .single();

    // Update last sign in
    await supabaseAdmin
      .from('profiles')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', data.user.id);

    res.json({
      message: 'Login successful',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        ...data.user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7);
    
    if (token) {
      await supabase.auth.signOut();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new ValidationError('Refresh token is required');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    next(error);
  }
};
