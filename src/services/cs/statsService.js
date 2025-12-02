/**
 * CS Stats Service
 * Business logic for CS dashboard statistics
 */

import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Get CS dashboard statistics
 */
export const getDashboardStats = async () => {
  // Get user stats (CS can only see regular users)
  const { data: userStats } = await supabaseAdmin
    .from('profiles')
    .select('status')
    .eq('role', 'user');

  // Get pending connections
  const { data: pendingConnections } = await supabaseAdmin
    .from('user_exchange_links')
    .select('id')
    .eq('status', 'pending');

  // Get pending claims
  const { data: pendingClaims } = await supabaseAdmin
    .from('claim_requests')
    .select('id, amount')
    .eq('status', 'pending');

  const stats = {
    users: {
      total: userStats?.length || 0,
      active: userStats?.filter(u => u.status === 'active').length || 0
    },
    pending_connections: pendingConnections?.length || 0,
    pending_claims: {
      count: pendingClaims?.length || 0,
      total_amount: pendingClaims?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0
    }
  };

  return stats;
};
