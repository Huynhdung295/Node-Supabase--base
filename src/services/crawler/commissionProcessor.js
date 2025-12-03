/**
 * Commission Processor Service
 * Processes daily commission snapshots and saves to database
 */

import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Process daily snapshot for all users
 * @param {number} exchangeId - Exchange ID
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @param {Array} crawledData - Array of transformed commission records
 * @returns {Promise<{processed: number, skipped: number, duplicates: number, errors: Array, records: Array}>}
 */
export const processDailySnapshot = async (exchangeId, targetDate, crawledData) => {
  const results = {
    processed: 0,
    skipped: 0,
    duplicates: 0,
    unlinked: 0, // Track UIDs without user link
    errors: [],
    records: [] // Store processed records for response
  };

  // Check if targetDate is today
  const today = new Date().toISOString().split('T')[0];
  const isToday = targetDate === today;

  for (const record of crawledData) {
    try {
      let userId = null;
      let linkId = null;

      // 1. Try to find user link by exchange_uid (optional now)
      const { data: link } = await supabaseAdmin
        .from('user_exchange_links')
        .select('id, user_id')
        .eq('exchange_id', exchangeId)
        .eq('exchange_uid', record.exchange_uid)
        .eq('status', 'verified')
        .single();

      if (link) {
        userId = link.user_id;
        linkId = link.id;
      } else {
        // No link found - still save the data with user_id = null
        results.unlinked++;
      }

      // 2. Get exchange default commission rate
      const { data: exchange } = await supabaseAdmin
        .from('exchanges')
        .select('default_commission_rate')
        .eq('id', exchangeId)
        .single();

      const exchangeCommissionRate = exchange?.default_commission_rate || 0.20; // 20% default

      // 3. Get user's tier rate if linked
      let tierRate = 0.00; // Default 0%
      if (userId) {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('current_tier_id')
          .eq('id', userId)
          .single();

        if (userProfile?.current_tier_id) {
          const { data: tierData } = await supabaseAdmin
            .from('exchange_tiers')
            .select('commission_percentage')
            .eq('tier_id', userProfile.current_tier_id)
            .eq('exchange_id', exchangeId)
            .single();

          if (tierData?.commission_percentage) {
            tierRate = parseFloat(tierData.commission_percentage) / 100; // Convert to decimal
          }
        }
      }

      // 4. Check if record already exists (prevent duplicate for past dates)
      if (!isToday) {
        const { data: existing } = await supabaseAdmin
          .from('daily_commissions')
          .select('id')
          .eq('exchange_uid', record.exchange_uid)
          .eq('exchange_id', exchangeId)
          .eq('date', targetDate)
          .single();

        if (existing) {
          results.duplicates++;
          continue; // Already exists, skip
        }
      }

      // 5. Calculate commission values with 2-step deduction
      // RAW amount = Full commission from exchange (e.g., $100)
      const rawTotalCommissions = record.commissions + record.commissions_pending;
      
      // Step 1: Apply exchange default commission (e.g., 20%)
      // $100 * (1 - 0.20) = $80
      const afterExchangeCommission = rawTotalCommissions * (1 - exchangeCommissionRate);
      
      // Step 2: Apply tier rate (e.g., 10% for Bronze)
      // $80 * (1 - 0.10) = $72
      const userTotalCommissions = afterExchangeCommission * (1 - tierRate);
      
      // SKIP ZERO-VALUE RECORDS
      // If everything is 0, don't save it
      if (
        rawTotalCommissions === 0 &&
        (record.trading_amount || 0) === 0 &&
        (record.deposits || 0) === 0
      ) {
        results.skipped++;
        continue;
      }

      const commissionData = {
        user_id: userId, // Will be null if unlinked
        link_id: linkId, // Will be null if unlinked
        exchange_id: exchangeId,
        exchange_uid: record.exchange_uid,
        date: targetDate,
        trading_amount: record.trading_amount,
        deposits: record.deposits,
        taker_amount: record.taker_amount,
        maker_amount: record.maker_amount,
        raw_data: record.raw_data,
        updated_at: new Date().toISOString()
      };

      // If today: Update pending, keep commissions as is
      // If past day: Finalize (pending → commissions)
      if (isToday) {
        commissionData.raw_commissions_pending = rawTotalCommissions; // Store raw amount
        commissionData.commissions_pending = userTotalCommissions; // Store user amount after both rates
        commissionData.is_finalized = false;
      } else {
        commissionData.raw_commissions = rawTotalCommissions; // Store raw amount
        commissionData.commissions = userTotalCommissions; // Store user amount after both rates
        commissionData.raw_commissions_pending = 0;
        commissionData.commissions_pending = 0;
        commissionData.is_finalized = true;

        // AUTO-CREATE TRANSACTION RECORD
        // Only if linked user, commission > 0, and not already created
        if (userId && userTotalCommissions > 0) {
          // Check if transaction already exists for this day/user/exchange
          const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('exchange_id', exchangeId)
            .eq('transaction_date', targetDate) // Assuming date string matches or cast needed
            .maybeSingle();

          if (!existingTx) {
            await supabaseAdmin.from('transactions').insert({
              user_id: userId,
              link_id: linkId,
              exchange_id: exchangeId,
              raw_volume: record.trading_amount || 0,
              commission_amount: userTotalCommissions, // User's commission after both rates
              transaction_date: targetDate,
              raw_data: record.raw_data
            });
          }
        }
      }

      // 4. Upsert daily_commissions (unique on exchange_uid + exchange_id + date)
      if (isToday) {
        const { error: upsertError } = await supabaseAdmin
          .from('daily_commissions')
          .upsert(commissionData, {
            onConflict: 'exchange_uid,exchange_id,date'
          });

        if (upsertError) throw upsertError;
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('daily_commissions')
          .insert(commissionData);

        if (insertError) throw insertError;
      }
      
      results.processed++;
      results.records.push({
        exchange_uid: record.exchange_uid,
        user_id: userId,
        linked: !!userId,
        commissions: isToday ? 0 : totalCommissions,
        commissions_pending: isToday ? totalCommissions : 0,
        trading_amount: record.trading_amount
      });

    } catch (err) {
      results.errors.push({
        exchange_uid: record.exchange_uid,
        error: err.message
      });
    }
  }

  return results;
};

/**
 * Get total commissions for a user (finalized + pending)
 * @param {string} userId - User UUID
 * @param {number} exchangeId - Exchange ID (optional)
 * @returns {Promise<{total: number, finalized: number, pending: number}>}
 */
export const getUserTotalCommissions = async (userId, exchangeId = null) => {
  let query = supabaseAdmin
    .from('daily_commissions')
    .select('commissions, commissions_pending')
    .eq('user_id', userId);

  if (exchangeId) {
    query = query.eq('exchange_id', exchangeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const totals = data.reduce((acc, record) => {
    acc.finalized += parseFloat(record.commissions || 0);
    acc.pending += parseFloat(record.commissions_pending || 0);
    return acc;
  }, { finalized: 0, pending: 0 });

  return {
    total: totals.finalized + totals.pending,
    finalized: totals.finalized,
    pending: totals.pending
  };
};

/**
 * Get daily commissions for a user
 * @param {string} userId - User UUID
 * @param {object} filters - Filters { exchangeId, startDate, endDate, page, limit }
 * @returns {Promise<Array>}
 */
export const getUserDailyCommissions = async (userId, filters = {}) => {
  const {
    exchangeId,
    startDate,
    endDate,
    page = 1,
    limit = 30
  } = filters;

  let query = supabaseAdmin
    .from('daily_commissions')
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
    .order('date', { ascending: false });

  if (exchangeId) {
    query = query.eq('exchange_id', exchangeId);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;

  return data;
};

/**
 * Get daily commissions data for admin viewing
 * @param {object} filters - Filters { exchangeId, date, page, limit }
 * @returns {Promise<{data: Array, total: number, page: number, limit: number}>}
 */
export const getDailyCommissions = async (filters = {}) => {
  const {
    exchangeId,
    date,
    page = 1,
    limit = 100
  } = filters;

  let query = supabaseAdmin
    .from('daily_commissions')
    .select(`
      *,
      user_exchange_links (
        exchange_uid,
        exchanges (
          code,
          name
        )
      ),
      profiles (
        full_name,
        email
      )
    `, { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (exchangeId) {
    query = query.eq('exchange_id', exchangeId);
  }

  if (date) {
    query = query.eq('date', date);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data,
    total: count,
    page,
    limit
  };
};
