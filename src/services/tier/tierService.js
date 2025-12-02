/**
 * Tier Service
 * Business logic for tier management
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

export const getAllTiers = async () => {
  const { data: tiers, error } = await supabaseAdmin
    .from('tiers')
    .select('*')
    .order('priority', { ascending: true });

  if (error) throw error;

  return tiers;
};

export const createTier = async (data) => {
  const { name, slug, priority, color_hex } = data;

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

  return tier;
};

export const updateTier = async (id, data) => {
  const { name, slug, priority, color_hex } = data;

  const { data: tier, error } = await supabaseAdmin
    .from('tiers')
    .update({
      ...(name && { name }),
      ...(slug && { slug }),
      ...(priority !== undefined && { priority }),
      ...(color_hex && { color_hex })
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

  return tier;
};

export const deleteTier = async (id) => {
  const { error } = await supabaseAdmin
    .from('tiers')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
};
