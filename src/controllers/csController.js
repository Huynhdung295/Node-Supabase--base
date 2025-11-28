import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const csController = {
  // GET /api/cs/dashboard - CS: Get CS dashboard stats
  async getDashboardStats(req, res, next) {
    try {
      // Get pending connections count
      const { count: pendingConnections } = await supabaseAdmin
        .from('user_exchange_links')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get pending claims count
      const { count: pendingClaims } = await supabaseAdmin
        .from('claim_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const stats = {
        pending_connections: pendingConnections || 0,
        pending_claims: pendingClaims || 0
      };

      return successResponse(res, stats, 'CS dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /cs/users - CS: Get all regular users
  async getUsers(req, res, next) {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          tiers (
            id,
            name,
            slug,
            color_hex
          ),
          user_exchange_links (
            id,
            exchange_id,
            exchange_uid,
            status,
            total_volume,
            exchanges (
              code,
              name
            )
          )
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/cs/users/:id - CS: Get user info for support
  async getUserInfo(req, res, next) {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          location,
          role,
          status,
          created_at,
          last_sign_in_at,
          tiers (
            name,
            slug
          ),
          user_exchange_links (
            id,
            exchange_uid,
            status,
            total_volume,
            created_at,
            exchanges (
              code,
              name
            )
          ),
          claim_requests (
            id,
            amount,
            status,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error || !user) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, user, 'User info retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /cs/users/:id - CS: Update user (limited fields)
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { full_name, phone, location } = req.body;

      // Check user exists and is regular user
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single();

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.role !== 'user') {
        throw new BadRequestError('Cannot edit admin/cs/system users');
      }

      // CS can only update these fields
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          tiers (
            id,
            name,
            slug,
            color_hex
          )
        `)
        .single();

      if (error) throw error;

      return successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // POST /cs/users/:id/reset-password - CS: Send password reset email
  async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;

      // Check user exists
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('email, role')
        .eq('id', id)
        .single();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.role !== 'user') {
        throw new BadRequestError('Cannot reset password for admin/cs/system users');
      }

      // Generate reset link via Supabase Admin API
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email
      });

      if (error) throw error;

      return successResponse(res, { 
        message: 'Password reset email sent'
      }, 'Password reset email sent successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/cs/connections - CS: Get pending connections
  async getPendingConnections(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const { data: connections, error } = await supabaseAdmin
        .from('user_exchange_links')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          ),
          exchanges (
            id,
            code,
            name,
            logo_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return successResponse(res, connections, 'Pending connections retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/cs/connections/:id - CS: Approve/reject exchange connection
  async processConnection(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        throw new BadRequestError('Status must be verified or rejected');
      }

      const { data: connection, error } = await supabaseAdmin
        .from('user_exchange_links')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'pending')
        .select(`
          *,
          profiles (
            email,
            full_name
          ),
          exchanges (
            code,
            name
          )
        `)
        .single();

      if (error) throw error;

      if (!connection) {
        throw new NotFoundError('Connection not found or not in pending status');
      }

      return successResponse(res, connection, `Connection ${status} successfully`);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/cs/users/links - CS: Create user connection
  async createConnection(req, res, next) {
    try {
      const { user_id, exchange_id, exchange_uid, status = 'verified' } = req.body;

      if (!user_id || !exchange_id || !exchange_uid) {
        throw new BadRequestError('user_id, exchange_id, and exchange_uid are required');
      }

      // Check if connection already exists
      const { data: existingLink } = await supabaseAdmin
        .from('user_exchange_links')
        .select('id')
        .eq('user_id', user_id)
        .eq('exchange_id', exchange_id)
        .single();

      if (existingLink) {
        throw new BadRequestError('Connection already exists for this user and exchange');
      }

      const { data: link, error } = await supabaseAdmin
        .from('user_exchange_links')
        .insert({
          user_id,
          exchange_id,
          exchange_uid,
          status, // Default to verified if not provided
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          profiles (
            email,
            full_name
          ),
          exchanges (
            code,
            name
          )
        `)
        .single();

      if (error) throw error;

      return successResponse(res, link, 'Connection created successfully');
    } catch (error) {
      next(error);
    }
  }
};