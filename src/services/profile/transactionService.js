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

  // Get manual transactions (added by system)
  // These are NOT in daily_commissions, so we must add them separately
  const { data: manualTransactions } = await supabaseAdmin
    .from('transactions')
    .select('commission_amount')
    .eq('user_id', userId)
    .not('raw_data->manual', 'is', null); // Check if manual flag exists

  const manual_amount = manualTransactions?.reduce((sum, t) => sum + parseFloat(t.commission_amount || 0), 0) || 0;

  // Total finalized includes daily commissions + manual additions
  const total_finalized = finalized_commission + manual_amount;
  const total_commission = total_finalized + pending_commission;

  // Get claimed amounts (deducted from balance until explicitly refunded)
  // Important: rejected/admin_rejected still deduct until CS processes refund
  const { data: claims } = await supabaseAdmin
    .from('claim_requests')
    .select('amount')
    .eq('user_id', userId)
    .in('status', [
      'pending',                    // User verified, in review
      'email_verified',             // CS verified
      'verified',                   // CS manual verify  
      'awaiting_admin_approval',    // Waiting admin
      'admin_approved',             // Admin approved
      'transferred',                // Paid out (final)
      'rejected',                   // Rejected but NOT yet refunded
      'admin_rejected'              // Admin rejected but NOT yet refunded
    ]);

  const claimed_amount = claims?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;

  // Note: 'refunded' and 'verify_failed' statuses do NOT deduct
  // Money is returned to available balance only when status = 'refunded'

  return {
    total_commission,
    finalized_commission: total_finalized,
    pending_commission,
    claimed_amount,
    available_balance: total_finalized - claimed_amount // Only finalized can be claimed
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
