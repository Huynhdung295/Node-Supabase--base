import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const csController = {
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

      // TODO: Send notification email to user
      // await emailService.sendConnectionProcessed(connection.profiles.email, connection);

      return successResponse(res, connection, `Connection ${status} successfully`);
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

  // GET /api/cs/claims - CS: Get claims for review (inherited from claimController)
  // This is handled in claimController.getPendingClaims

  // PUT /api/cs/claims/:id - CS: Process claim (inherited from claimController)
  // This is handled in claimController.processClaim

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

      // Get today's processed items
      const today = new Date().toISOString().split('T')[0];

      const { count: processedConnectionsToday } = await supabaseAdmin
        .from('user_exchange_links')
        .select('*', { count: 'exact', head: true })
        .in('status', ['verified', 'rejected'])
        .gte('updated_at', today);

      const { count: processedClaimsToday } = await supabaseAdmin
        .from('claim_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'rejected'])
        .gte('updated_at', today);

      const stats = {
        pending: {
          connections: pendingConnections || 0,
          claims: pendingClaims || 0
        },
        processed_today: {
          connections: processedConnectionsToday || 0,
          claims: processedClaimsToday || 0
        }
      };

      return successResponse(res, stats, 'CS dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};