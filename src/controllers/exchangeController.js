import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const exchangeController = {
  /**
   * @swagger
   * /api/exchanges:
   *   get:
   *     summary: Get active exchanges (Public)
   *     tags: [Exchanges - Public]
   *     responses:
   *       200:
   *         description: Active exchanges retrieved successfully
   */
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

  /**
   * @swagger
   * /api/admin/exchanges:
   *   get:
   *     summary: Get all exchanges (Admin)
   *     tags: [Admin - Exchanges]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All exchanges with stats retrieved
   */
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

  /**
   * @swagger
   * /api/admin/exchanges:
   *   post:
   *     summary: Create new exchange (Admin)
   *     tags: [Admin - Exchanges]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - name
   *             properties:
   *               code:
   *                 type: string
   *               name:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *               logo_url:
   *                 type: string
   *               config_json:
   *                 type: object
   *     responses:
   *       201:
   *         description: Exchange created successfully
   */
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

  /**
   * @swagger
   * /api/admin/exchanges/{id}:
   *   put:
   *     summary: Update exchange (Admin)
   *     tags: [Admin - Exchanges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *               name:
   *                 type: string
   *               status:
   *                 type: string
   *               logo_url:
   *                 type: string
   *               config_json:
   *                 type: object
   *     responses:
   *       200:
   *         description: Exchange updated successfully
   */
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

  /**
   * @swagger
   * /api/admin/exchanges/{id}:
   *   delete:
   *     summary: Delete exchange (Admin)
   *     tags: [Admin - Exchanges]
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
   *         description: Exchange deleted successfully
   */
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

  /**
   * @swagger
   * /api/admin/exchanges/{id}/tiers:
   *   get:
   *     summary: Get tier configs for exchange (Admin)
   *     tags: [Admin - Exchanges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Exchange ID
   *     responses:
   *       200:
   *         description: Exchange tier configs retrieved
   */
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

  /**
   * @swagger
   * /api/admin/exchanges/tiers:
   *   put:
   *     summary: Update exchange tier configs (Admin)
   *     tags: [Admin - Exchanges]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exchange_id
   *               - tier_configs
   *             properties:
   *               exchange_id:
   *                 type: string
   *               tier_configs:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     tier_id:
   *                       type: string
   *                     required_points:
   *                       type: number
   *                     default_commission_rate:
   *                       type: number
   *                     is_active:
   *                       type: boolean
   *     responses:
   *       200:
   *         description: Tier configs updated successfully
   */
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