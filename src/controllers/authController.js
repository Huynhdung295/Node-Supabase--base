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

    // Tạo user trong Supabase Auth (using signUp to ensure proper password hashing)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name
        }
      }
    });

    if (authError) {
      throw new ValidationError(authError.message);
    }

    if (!authData.user) {
      throw new ValidationError('Failed to create user');
    }

    // Generate unique ref code
    const { data: newRefCode } = await supabaseAdmin.rpc('generate_ref_code');

    // Poll for profile creation (wait for trigger)
    let profile = null;
    let attempts = 0;
    const maxAttempts = 10; // 2 seconds total
    
    while (!profile && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (data) {
        profile = data;
      }
      attempts++;
    }

    if (!profile) {
      // If trigger failed to create profile after timeout, try to create it manually
      // This is a fallback in case the trigger is disabled or failing silently
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name,
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        // Rollback: delete user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new ValidationError('Failed to create user profile: ' + createError.message);
      }
      profile = newProfile;
    }

    // Update profile with additional info
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name, // Ensure full_name is set
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

    if (updateError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new ValidationError('Failed to update user profile details');
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: updatedProfile
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

    // Authenticate with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ValidationError('Invalid credentials');
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, tiers(id, name, slug, color_hex)')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    // Check if user is banned
    if (profile.status === 'banned') {
      throw new ValidationError('Your account has been banned');
    }

    // Log login history
    await supabaseAdmin.from('login_history').insert({
      user_id: data.user.id,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'] || 'Unknown',
      location: req.headers['cf-ipcountry'] || 'Unknown'
    });

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        full_name: profile.full_name,
        tier: profile.tiers
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

/**
 * @swagger
 * /auth/recover:
 *   post:
 *     summary: Gửi email reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Validation error
 */
export const recoverPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      // Don't reveal if user exists or not for security, unless it's a validation error
      if (error.status === 429) {
        throw new ValidationError('Too many requests. Please try again later.');
      }
      // Log the real error
      console.error('Recover password error:', error);
    }

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};
