import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const exchangeController = {
  // GET /api/exchanges - Get active exchanges (public)
  async getActiveExchanges(req, res, next) {
    try {
      const { data: exchanges, error } = await supabaseAdmin
        .from('exchanges')
        .select(`
          *,
          exchange_tier_configs (
            tier_id,
            required_points,
            default_commission_rate,
            is_active,
            tiers (
              id,
              name,
              slug
            )
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return successResponse(res, exchanges, 'Active exchanges retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/exchanges - Admin: Get all exchanges
  async getAllExchanges(req, res, next) {
    try {
      const { data: exchanges, error } = await supabaseAdmin
        .from('exchanges')
        .select(`
          *,
          exchange_tier_configs (
            tier_id,
            required_points,
            default_commission_rate,
            is_active,
            tiers (
              id,
              name,
              slug
            )
          ),
          user_exchange_links (
            id,
            user_id
          )
        `)
        .order('name');

      if (error) throw error;

      // Add user count for each exchange
      const exchangesWithStats = exchanges.map(exchange => ({
        ...exchange,
        connected_users_count: exchange.user_exchange_links?.length || 0,
        user_exchange_links: undefined // Remove the raw data
      }));

      return successResponse(res, exchangesWithStats, 'All exchanges retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // POST /api/admin/exchanges - Admin: Create exchange
  async createExchange(req, res, next) {
    try {
      const { code, name, status, logo_url, config_json } = req.body;

      if (!code || !name) {
        throw new BadRequestError('Code and name are required');
      }

      const { data: exchange, error } = await supabaseAdmin
        .from('exchanges')
        .insert({
          code: code.toUpperCase(),
          name,
          status: status || 'active',
          logo_url,
          config_json: config_json || {}
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestError('Exchange code already exists');
        }
        throw error;
      }

      return successResponse(res, exchange, 'Exchange created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/exchanges/:id - Admin: Update exchange
  async updateExchange(req, res, next) {
    try {
      const { id } = req.params;
      const { code, name, status, logo_url, config_json } = req.body;

      const { data: exchange, error } = await supabaseAdmin
        .from('exchanges')
        .update({
          code: code?.toUpperCase(),
          name,
          status,
          logo_url,
          config_json
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestError('Exchange code already exists');
        }
        throw error;
      }

      if (!exchange) {
        throw new NotFoundError('Exchange not found');
      }

      return successResponse(res, exchange, 'Exchange updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/admin/exchanges/:id - Admin: Delete exchange
  async deleteExchange(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('exchanges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return successResponse(res, null, 'Exchange deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/exchanges/:id/tiers - Admin: Get tier configs for exchange
  async getExchangeTiers(req, res, next) {
    try {
      const { id } = req.params;

      const { data: configs, error } = await supabaseAdmin
        .from('exchange_tier_configs')
        .select(`
          *,
          tiers (
            id,
            name,
            slug,
            color_hex
          )
        `)
        .eq('exchange_id', id)
        .order('required_points');

      if (error) throw error;

      return successResponse(res, configs, 'Exchange tier configs retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/exchanges/tiers - Admin: Update tier configs
  async updateExchangeTiers(req, res, next) {
    try {
      const { exchange_id, tier_configs } = req.body;

      if (!exchange_id || !Array.isArray(tier_configs)) {
        throw new BadRequestError('exchange_id and tier_configs array are required');
      }

      // Delete existing configs for this exchange
      await supabaseAdmin
        .from('exchange_tier_configs')
        .delete()
        .eq('exchange_id', exchange_id);

      // Insert new configs
      const configsToInsert = tier_configs.map(config => ({
        exchange_id,
        tier_id: config.tier_id,
        required_points: config.required_points || 0,
        default_commission_rate: config.default_commission_rate || 0,
        is_active: config.is_active !== false
      }));

      const { data: newConfigs, error } = await supabaseAdmin
        .from('exchange_tier_configs')
        .insert(configsToInsert)
        .select(`
          *,
          tiers (
            id,
            name,
            slug
          )
        `);

      if (error) throw error;

      return successResponse(res, newConfigs, 'Exchange tier configs updated successfully');
    } catch (error) {
      next(error);
    }
  }
};