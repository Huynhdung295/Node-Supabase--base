/**
 * Profile Service
 * Business logic for user profile operations
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

export const getProfile = async (userId) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new NotFoundError('Profile not found');
  }

  return profile;
};

export const updateProfile = async (userId, updateData) => {
  const { full_name, phone, avatar_url } = updateData;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...(full_name && { full_name }),
      ...(phone && { phone }),
      ...(avatar_url && { avatar_url }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return profile;
};
