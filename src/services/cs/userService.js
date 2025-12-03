/**
 * CS User Service
 * Business logic for CS user management operations
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

/**
 * List all regular users (CS can only see 'user' role)
 */
export const listUsers = async ({ page = 1, limit = 20, search }) => {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
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
        id,
        exchange_id,
        exchange_uid,
        status,
        total_volume,
        exchanges (
          id,
          code,
          name,
          logo_url
        )
      )
    `)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: users, error } = await query;
  if (error) throw error;

  // Add commission summary for each user
  const usersWithCommissions = await Promise.all(
    users.map(async (user) => {
      const { data: commissions } = await supabaseAdmin
        .from('daily_commissions')
        .select('commissions, commissions_pending')
        .eq('user_id', user.id);

      const total_finalized = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions || 0), 0) || 0;
      const total_pending = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions_pending || 0), 0) || 0;

      return {
        ...user,
        commission_summary: {
          finalized: total_finalized,
          pending: total_pending,
          total: total_finalized + total_pending
        }
      };
    })
  );

  return usersWithCommissions;
};

/**
 * Get user info by ID for support purposes
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
      claim_requests!claim_requests_user_id_fkey (
        id,
        amount,
        bonus_amount,
        status,
        created_at
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new NotFoundError('User not found');
  }

  // Calculate per-exchange commission breakdown with raw amounts
  const { data: commissions } = await supabaseAdmin
    .from('daily_commissions')
    .select('exchange_id, commissions, commissions_pending, raw_commissions, raw_commissions_pending')
    .eq('user_id', userId);

  const exchangeCommissions = {};
  commissions?.forEach(c => {
    if (!exchangeCommissions[c.exchange_id]) {
      exchangeCommissions[c.exchange_id] = {
        raw_total: 0,
        user_total: 0,
        raw_finalized: 0,
        user_finalized: 0,
        raw_pending: 0,
        user_pending: 0
      };
    }
    const ec = exchangeCommissions[c.exchange_id];
    ec.raw_finalized += parseFloat(c.raw_commissions || 0);
    ec.user_finalized += parseFloat(c.commissions || 0);
    ec.raw_pending += parseFloat(c.raw_commissions_pending || 0);
    ec.user_pending += parseFloat(c.commissions_pending || 0);
    ec.raw_total = ec.raw_finalized + ec.raw_pending;
    ec.user_total = ec.user_finalized + ec.user_pending;
  });

  // Add commission summary
  const total_finalized = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions || 0), 0) || 0;
  const total_pending = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions_pending || 0), 0) || 0;

  // Calculate total withdrawals
  const totalWithdrawn = user.claim_requests
    ?.filter(c => c.status === 'transferred')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;

  return {
    ...user,
    exchange_commissions: exchangeCommissions,
    total_withdrawn: totalWithdrawn,
    commission_summary: {
      finalized: total_finalized,
      pending: total_pending,
      total: total_finalized + total_pending
    }
  };
};

/**
 * Update user (limited fields for CS role)
 */
export const updateUser = async (userId, updateData) => {
  const { full_name, phone } = updateData;

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...(full_name && { full_name }),
      ...(phone && { phone }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userId) => {
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Trigger password reset via Supabase Auth Admin API
  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email
  });

  if (error) throw error;

  return { email: user.email };
};
