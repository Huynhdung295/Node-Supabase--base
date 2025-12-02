import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const tierController = {
  /**
   * @swagger
   * /api/tiers:
   *   get:
   *     summary: Get all tiers (Public)
   *     tags: [Tiers - Public]
   *     responses:
   *       200:
   *         description: Tiers retrieved successfully
   */
  async getAllTiers(req, res, next) {
    try {
      const { data: tiers, error } = await supabaseAdmin
        .from('tiers')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      return successResponse(res, tiers, 'Tiers retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/admin/tiers:
   *   post:
   *     summary: Create new tier (Admin)
   *     tags: [Admin - Tiers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - slug
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               priority:
   *                 type: integer
   *               color_hex:
   *                 type: string
   *     responses:
   *       201:
   *         description: Tier created successfully
   */
  async createTier(req, res, next) {
    try {
      const { name, slug, priority, color_hex } = req.body;

      if (!name || !slug) {
        throw new BadRequestError('Name and slug are required');
      }

      const { data: tier, error } = await supabaseAdmin
        .from('tiers')
        .insert({
          name,
          slug,
          priority: priority || 0,
          color_hex
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestError('Tier slug already exists');
        }
        throw error;
      }

      return successResponse(res, tier, 'Tier created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/admin/tiers/{id}:
   *   put:
   *     summary: Update tier (Admin)
   *     tags: [Admin - Tiers]
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
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               priority:
   *                 type: integer
   *               color_hex:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tier updated successfully
   */
  async updateTier(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, priority, color_hex } = req.body;

      const { data: tier, error } = await supabaseAdmin
        .from('tiers')
        .update({
          name,
          slug,
          priority,
          color_hex
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestError('Tier slug already exists');
        }
        throw error;
      }

      if (!tier) {
        throw new NotFoundError('Tier not found');
      }

      return successResponse(res, tier, 'Tier updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/admin/tiers/{id}:
   *   delete:
   *     summary: Delete tier (Admin)
   *     tags: [Admin - Tiers]
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
   *         description: Tier deleted successfully
   */
  async deleteTier(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return successResponse(res, null, 'Tier deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};