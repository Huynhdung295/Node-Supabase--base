import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const adminController = {
  // GET /api/admin/users - Admin: Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, role, tier_id } = req.query;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('profiles')
        .select(`
          *,
          tiers (
            id,
            name,
            slug
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
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Role hierarchy filtering
      const requesterRole = req.user.profile.role;
      if (requesterRole === 'admin') {
        query = query.in('role', ['user', 'cs']);
      } else if (requesterRole === 'cs') {
        query = query.eq('role', 'user');
      }

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      if (role) {
        query = query.eq('role', role);
      }
      if (tier_id) {
        query = query.eq('current_tier_id', tier_id);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/users/:id - Admin: Get user details
  async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabaseAdmin
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
            *,
            exchanges (
              id,
              code,
              name,
              logo_url
            )
          ),
          transactions (
            id,
            raw_volume,
            commission_amount,
            transaction_date,
            exchange_id
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

      return successResponse(res, user, 'User details retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/users/:id/role - Admin: Update user role/status
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role, status } = req.body;

      const updateData = {};
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('Role or status is required');
      }

      // Role hierarchy check
      const roleHierarchy = { 'system': 4, 'admin': 3, 'cs': 2, 'user': 1 };
      const requesterRole = req.user.profile.role;
      const requesterLevel = roleHierarchy[requesterRole] || 0;

      // Get target user current role
      const { data: targetUser } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single();

      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      const targetLevel = roleHierarchy[targetUser.role] || 0;

      // Prevent updating peer or higher (unless system)
      if (requesterRole !== 'system' && targetLevel >= requesterLevel) {
        throw new ForbiddenError('Cannot update user with equal or higher role');
      }

      // Prevent setting role to peer or higher
      if (role) {
        const newRoleLevel = roleHierarchy[role] || 0;
        if (requesterRole !== 'system' && newRoleLevel >= requesterLevel) {
          throw new ForbiddenError('Cannot set role equal to or higher than your own');
        }
      }

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/users/links/:link_id - Admin: Set custom commission rate
  async setCustomCommissionRate(req, res, next) {
    try {
      const { link_id } = req.params;
      const { custom_commission_rate } = req.body;

      if (custom_commission_rate === undefined) {
        throw new BadRequestError('custom_commission_rate is required');
      }

      const { data: link, error } = await supabaseAdmin
        .from('user_exchange_links')
        .update({
          custom_commission_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', link_id)
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

      if (!link) {
        throw new NotFoundError('Exchange link not found');
      }

      return successResponse(res, link, 'Custom commission rate updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/admin/users/links/:link_id/status - Admin: Update connection status
  async updateConnectionStatus(req, res, next) {
    try {
      const { link_id } = req.params;
      const { status } = req.body;

      // Valid statuses based on DB enum: pending, verified, rejected
      if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
        throw new BadRequestError('Valid status (pending/verified/rejected) is required');
      }

      const { data: link, error } = await supabaseAdmin
        .from('user_exchange_links')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', link_id)
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

      if (!link) {
        throw new NotFoundError('Exchange link not found');
      }

      return successResponse(res, link, 'Connection status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // POST /api/admin/users/links - Admin: Create user connection
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
  },

  // DELETE /api/admin/users/links/:link_id - Admin: Remove user connection
  async deleteConnection(req, res, next) {
    try {
      const { link_id } = req.params;

      // Check if connection exists
      const { data: existingLink } = await supabaseAdmin
        .from('user_exchange_links')
        .select('id')
        .eq('id', link_id)
        .single();

      if (!existingLink) {
        throw new NotFoundError('Connection not found');
      }

      const { error } = await supabaseAdmin
        .from('user_exchange_links')
        .delete()
        .eq('id', link_id);

      if (error) throw error;

      return successResponse(res, null, 'Connection removed successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/crawler-tokens - Admin: Get crawler tokens
  async getCrawlerTokens(req, res, next) {
    try {
      const { data: tokens, error } = await supabaseAdmin
        .from('crawler_tokens')
        .select(`
          *,
          exchanges (
            id,
            code,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return successResponse(res, tokens, 'Crawler tokens retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/crawler-tokens - Admin: Update crawler token
  async updateCrawlerToken(req, res, next) {
    try {
      const { exchange_id, token, expired_at } = req.body;

      if (!exchange_id || !token) {
        throw new BadRequestError('exchange_id and token are required');
      }

      // Check if token exists for this exchange
      const { data: existingToken } = await supabaseAdmin
        .from('crawler_tokens')
        .select('id')
        .eq('exchange_id', exchange_id)
        .single();

      let result;
      if (existingToken) {
        // Update existing token
        const { data, error } = await supabaseAdmin
          .from('crawler_tokens')
          .update({
            token,
            status: 'active',
            expired_at: expired_at || null,
            last_used_at: null
          })
          .eq('exchange_id', exchange_id)
          .select(`
            *,
            exchanges (
              code,
              name
            )
          `)
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new token
        const { data, error } = await supabaseAdmin
          .from('crawler_tokens')
          .insert({
            exchange_id,
            token,
            status: 'active',
            expired_at: expired_at || null
          })
          .select(`
            *,
            exchanges (
              code,
              name
            )
          `)
          .single();

        if (error) throw error;
        result = data;
      }

      return successResponse(res, result, 'Crawler token updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/settings - Admin: Get system settings
  async getSystemSettings(req, res, next) {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;

      return successResponse(res, settings, 'System settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/settings - Admin: Update system settings
  async updateSystemSettings(req, res, next) {
    try {
      const { settings } = req.body;

      if (!Array.isArray(settings)) {
        throw new BadRequestError('Settings must be an array');
      }

      const updates = [];
      for (const setting of settings) {
        const { key, value, description } = setting;
        if (!key) continue;

        const { data, error } = await supabaseAdmin
          .from('system_settings')
          .upsert({
            key,
            value,
            description,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        updates.push(data);
      }

      return successResponse(res, updates, 'System settings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/stats - Admin: Get dashboard statistics
  async getDashboardStats(req, res, next) {
    try {
      // Get user counts by role
      const { data: userStats } = await supabaseAdmin
        .from('profiles')
        .select('role, status')
        .neq('role', 'system');

      // Get exchange stats
      const { data: exchangeStats } = await supabaseAdmin
        .from('exchanges')
        .select('status');

      // Get claim stats
      const { data: claimStats } = await supabaseAdmin
        .from('claim_requests')
        .select('status, amount');

      // Get transaction stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactionStats } = await supabaseAdmin
        .from('transactions')
        .select('commission_amount, transaction_date')
        .gte('transaction_date', thirtyDaysAgo.toISOString());

      const stats = {
        users: {
          total: userStats?.length || 0,
          active: userStats?.filter(u => u.status === 'active').length || 0,
          by_role: userStats?.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {}) || {}
        },
        exchanges: {
          total: exchangeStats?.length || 0,
          active: exchangeStats?.filter(e => e.status === 'active').length || 0
        },
        claims: {
          total: claimStats?.length || 0,
          pending: claimStats?.filter(c => c.status === 'pending').length || 0,
          total_amount: claimStats?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0
        },
        transactions: {
          count_30d: transactionStats?.length || 0,
          commission_30d: transactionStats?.reduce((sum, t) => sum + parseFloat(t.commission_amount || 0), 0) || 0
        }
      };

      return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};