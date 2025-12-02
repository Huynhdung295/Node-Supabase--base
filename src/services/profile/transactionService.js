/**
 * Profile Transaction Service  
 * Business logic for user's transactions and balance
 */

import { supabaseAdmin } from '../../config/supabase.js';

export const getBalance = async (userId) => {
  // Get commission totals from daily_commissions (primary source)
  const { data: dailyCommissions, error: dcError } = await supabaseAdmin
    .from('daily_commissions')
    .select('commissions, commissions_pending')
    .eq('user_id', userId);

  if (dcError) throw dcError;

  const finalized_commission = dailyCommissions?.reduce((sum, c) => sum + parseFloat(c.commissions || 0), 0) || 0;
  const pending_commission = dailyCommissions?.reduce((sum, c) => sum + parseFloat(c.commissions_pending || 0), 0) || 0;
  const total_commission = finalized_commission + pending_commission;

  // Get claimed amounts
  const { data: claims } = await supabaseAdmin
    .from('claim_requests')
    .select('amount')
    .eq('user_id', userId)
    .in('status', ['pending', 'approved']);

  const claimed_amount = claims?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;

  return {
    total_commission,
    finalized_commission,
    pending_commission,
    claimed_amount,
    available_balance: total_commission - claimed_amount
  };
};

export const getTransactions = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      user_exchange_links (
        exchange_uid,
        exchanges (
          code,
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return transactions;
};

export const getLoginHistory = async (userId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const { data: history, error } = await supabaseAdmin
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return history;
};
