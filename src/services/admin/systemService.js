/**
 * Admin System Service
 * Business logic for crawler tokens and system settings
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError } from '../../middleware/errorHandler.js';

/**
 * Get all exchanges with their crawler tokens
 * Returns all exchanges, even if they don't have a token yet
 */
export const getCrawlerTokens = async () => {
  // Get all exchanges with their token info (left join)
  const { data: exchanges, error } = await supabaseAdmin
    .from('exchanges')
    .select(`
      id,
      code,
      name,
      status,
      logo_url,
      crawler_tokens (
        id,
        token,
        status,
        last_used_at,
        expired_at,
        created_at
      )
    `)
    .order('code', { ascending: true });

  if (error) throw error;

  // Transform data: flatten crawler_tokens array (should be 0 or 1 item)
  return exchanges.map(exchange => ({
    ...exchange,
    token_info: exchange.crawler_tokens?.[0] || null
  }));
};

/**
 * Update or create crawler token
 */
export const upsertCrawlerToken = async (exchangeId, token, expiredAt = null) => {
  // Check if token exists for this exchange
  const { data: existingToken } = await supabaseAdmin
    .from('crawler_tokens')
    .select('id')
    .eq('exchange_id', exchangeId)
    .single();

  let result;
  if (existingToken) {
    // Update existing token
    const { data, error } = await supabaseAdmin
      .from('crawler_tokens')
      .update({
        token,
        status: 'active',
        expired_at: expiredAt || null,
        last_used_at: null
      })
      .eq('exchange_id', exchangeId)
      .select(`
        *,
        exchanges (
          code,
          name
        )
      `)
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Create new token
    const { data, error } = await supabaseAdmin
      .from('crawler_tokens')
      .insert({
        exchange_id: exchangeId,
        token,
        status: 'active',
        expired_at: expiredAt || null
      })
      .select(`
        *,
        exchanges (
          code,
          name
        )
      `)
      .single();

    if (error) throw error;
    result = data;
  }

  return result;
};

/**
 * Get all system settings
 */
export const getSystemSettings = async () => {
  const { data: settings, error } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) throw error;

  return settings;
};

/**
 * Update system settings (batch)
 */
export const updateSystemSettings = async (settings) => {
  if (!Array.isArray(settings)) {
    throw new BadRequestError('Settings must be an array');
  }

  const updates = [];
  for (const setting of settings) {
    const { key, value, description } = setting;
    if (!key) continue;

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    updates.push(data);
  }

  return updates;
};
