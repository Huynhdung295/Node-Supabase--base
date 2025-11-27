import { supabaseAdmin, supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const profileController = {
  // GET /api/me/profile - User: Get own profile
  async getMyProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const { data: profile, error } = await supabaseAdmin
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
        .eq('id', userId)
        .single();

      if (error) throw error;

      return successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/me/profile - User: Update own profile
  async updateMyProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Get allowed fields from system settings
      const { data: settings } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'user_editable_fields')
        .single();

      const allowedFields = settings?.value || ['full_name', 'phone', 'dob', 'gender', 'location'];
      
      // Filter updates to only allowed fields
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        throw new BadRequestError('No valid fields to update');
      }

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...filteredUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
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

      return successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/me/connections - User: Get own exchange connections
  async getMyConnections(req, res, next) {
    try {
      const userId = req.user.id;

      const { data: connections, error } = await supabaseAdmin
        .from('user_exchange_links')
        .select(`
          *,
          exchanges (
            id,
            code,
            name,
            logo_url,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return successResponse(res, connections, 'Exchange connections retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // POST /api/me/connections - User: Connect to new exchange
  async createConnection(req, res, next) {
    try {
      const userId = req.user.id;
      const { exchange_id, exchange_uid, exchange_email } = req.body;

      if (!exchange_id || !exchange_uid) {
        throw new BadRequestError('exchange_id and exchange_uid are required');
      }

      // Check if exchange exists and is active
      const { data: exchange, error: exchangeError } = await supabaseAdmin
        .from('exchanges')
        .select('id, status')
        .eq('id', exchange_id)
        .single();

      if (exchangeError || !exchange) {
        throw new NotFoundError('Exchange not found');
      }

      if (exchange.status !== 'active') {
        throw new BadRequestError('Exchange is not active');
      }

      const { data: connection, error } = await supabaseAdmin
        .from('user_exchange_links')
        .insert({
          user_id: userId,
          exchange_id,
          exchange_uid,
          exchange_email,
          status: 'pending'
        })
        .select(`
          *,
          exchanges (
            id,
            code,
            name,
            logo_url
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestError('You are already connected to this exchange with this UID');
        }
        throw error;
      }

      return successResponse(res, connection, 'Exchange connection created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/me/connections/:id - User: Update exchange connection
  async updateConnection(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { exchange_uid, exchange_email } = req.body;

      // Check if connection exists and belongs to user
      const { data: existingConnection } = await supabaseAdmin
        .from('user_exchange_links')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingConnection) {
        throw new NotFoundError('Connection not found');
      }

      const updateData = {};
      if (exchange_uid) updateData.exchange_uid = exchange_uid;
      if (exchange_email) updateData.exchange_email = exchange_email;

      const { data: connection, error } = await supabaseAdmin
        .from('user_exchange_links')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          exchanges (
            id,
            code,
            name,
            logo_url
          )
        `)
        .single();

      if (error) throw error;

      return successResponse(res, connection, 'Connection updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/me/connections/:id - User: Remove exchange connection
  async deleteConnection(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Check if connection exists and belongs to user
      const { data: existingConnection } = await supabaseAdmin
        .from('user_exchange_links')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingConnection) {
        throw new NotFoundError('Connection not found');
      }

      const { error } = await supabaseAdmin
        .from('user_exchange_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return successResponse(res, null, 'Connection removed successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/me/balance - User: Get available balance
  async getMyBalance(req, res, next) {
    try {
      const userId = req.user.id;

      const { data: balance, error } = await supabaseAdmin
        .rpc('get_user_balance', { user_uuid: userId });

      if (error) throw error;

      return successResponse(res, { 
        balance: parseFloat(balance) || 0,
        currency: 'USD'
      }, 'Balance retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/me/transactions - User: Get own transactions
  async getMyTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, exchange_id, start_date, end_date } = req.query;

      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          user_exchange_links (
            exchange_uid,
            exchanges (
              code,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (exchange_id) {
        query = query.eq('exchange_id', exchange_id);
      }
      if (start_date) {
        query = query.gte('transaction_date', start_date);
      }
      if (end_date) {
        query = query.lte('transaction_date', end_date);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: transactions, error } = await query;

      if (error) throw error;

      return successResponse(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/me/login-history - User: Get own login history
  async getLoginHistory(req, res, next) {
    try {
      const userId = req.user.id;
      
      const { data: history, error } = await supabaseAdmin
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return successResponse(res, history, 'Login history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};