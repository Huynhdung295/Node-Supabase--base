/**
 * Admin User Service
 * Business logic for admin user management operations
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler.js';
import { ROLE_HIERARCHY, canModifyRole } from '../../constants/index.js';

/**
 * List users with filtering and pagination
 */
export const listUsers = async ({ page = 1, limit = 20, search, role, tier_id, requesterRole }) => {
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

  const { data, error } = await query;
  if (error) throw error;

  return data;
};

/**
 * Get user details by ID
 */
export const getUserById = async (userId) => {
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
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Update user role and/or status with permission checks
 */
export const updateUserRole = async (userId, updateData, requesterRole) => {
  const { role, status } = updateData;

  // Get target user current role
  const { data: targetUser } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  // Permission check using helper
  if (!canModifyRole(requesterRole, targetUser.role, role)) {
    throw new ForbiddenError('Cannot update user with equal or higher role');
  }

  // Perform update
  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...(role && { role }),
      ...(status && { status }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return user;
};
