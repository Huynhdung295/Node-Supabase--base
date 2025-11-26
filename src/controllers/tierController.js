import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export const tierController = {
  // GET /api/tiers - Public endpoint to get all tiers
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

  // POST /api/admin/tiers - Admin only
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

  // PUT /api/admin/tiers/:id - Admin only
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

  // DELETE /api/admin/tiers/:id - Admin only
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