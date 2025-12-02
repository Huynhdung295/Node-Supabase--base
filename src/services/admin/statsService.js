/**
 * Admin Stats Service
 * Business logic for admin dashboard statistics
 */

import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Get dashboard statistics for admin
 */
export const getDashboardStats = async () => {
  // Get user stats
  const { data: users, error: userError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, status');

  if (userError) throw userError;

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    by_role: {
      admin: users.filter(u => u.role === 'admin').length,
      cs: users.filter(u => u.role === 'cs').length,
      user: users.filter(u => u.role === 'user').length
    }
  };

  // Get exchange stats
  const { data: exchanges, error: exchangeError } = await supabaseAdmin
    .from('exchanges')
    .select('id, status');

  if (exchangeError) throw exchangeError;

  const exchangeStats = {
    total: exchanges.length,
    active: exchanges.filter(e => e.status === 'active').length
  };

  // Get claim stats
  const { data: claims, error: claimError } = await supabaseAdmin
    .from('claim_requests')
    .select('status, amount');

  if (claimError) throw claimError;

  const claimStats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    total_amount: claims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  };

  // Get transaction stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('commission_amount')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (txError) throw txError;

  const txStats = {
    count_30d: transactions.length,
    commission_30d: transactions.reduce((sum, t) => sum + parseFloat(t.commission_amount || 0), 0)
  };

  // Get commission stats per exchange from daily_commissions
  const { data: commissions, error: commError } = await supabaseAdmin
    .from('daily_commissions')
    .select(`
      exchange_id,
      commissions,
      commissions_pending,
      exchanges (code, name)
    `);

  if (commError) throw commError;

  // Group by exchange
  const commissionByExchange = {};
  commissions.forEach(c => {
    const exchangeCode = c.exchanges?.code || 'UNKNOWN';
    if (!commissionByExchange[exchangeCode]) {
      commissionByExchange[exchangeCode] = {
        id: c.exchange_id, // Add ID for frontend linking
        name: c.exchanges?.name || 'Unknown',
        total_finalized: 0,
        total_pending: 0,
        total: 0
      };
    }
    commissionByExchange[exchangeCode].total_finalized += parseFloat(c.commissions || 0);
    commissionByExchange[exchangeCode].total_pending += parseFloat(c.commissions_pending || 0);
    commissionByExchange[exchangeCode].total = 
      commissionByExchange[exchangeCode].total_finalized + 
      commissionByExchange[exchangeCode].total_pending;
  });

  return {
    users: userStats,
    exchanges: exchangeStats,
    claims: claimStats,
    transactions: txStats,
    commissions: commissionByExchange
  };
};
