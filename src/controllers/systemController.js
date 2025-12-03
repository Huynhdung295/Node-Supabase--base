import { supabaseAdmin } from '../config/supabase.js';

/**
 * Manually add balance to a user account
 * System admin only
 */
export const addBalanceToUser = async (req, res) => {
  try {
    const { user_id, amount, reason } = req.body;
    const systemUserId = req.user.id; // System admin who is adding balance

    if (!user_id || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'user_id, amount, and reason are required'
      });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create manual transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        raw_volume: 0, // Manual balance addition has no trading volume
        commission_amount: amount,
        transaction_date: new Date().toISOString(),
        raw_data: {
          manual: true,
          reason,
          added_by: systemUserId,
          added_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    return res.json({
      success: true,
      message: `Added $${amount} to ${user.full_name || user.email}`,
      data: {
        transaction_id: transaction.id,
        user_id,
        amount,
        user_name: user.full_name || user.email
      }
    });
  } catch (error) {
    console.error('Add balance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add balance'
    });
  }
};
