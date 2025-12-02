/**
 * Exchange Service
 * Business logic for exchange management
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

export const getActiveExchanges = async () => {
  const { data: exchanges, error } = await supabaseAdmin
    .from('exchanges')
    .select(`
      *,
      exchange_tier_configs (
        tier_id,
        required_points,
        default_commission_rate,
        is_active,
        tiers (
          id,
          name,
          slug
        )
      )
    `)
    .eq('status', 'active')
    .order('name');

  if (error) throw error;

  return exchanges;
};

export const getAllExchanges = async () => {
  const { data: exchanges, error } = await supabaseAdmin
    .from('exchanges')
    .select(`
      *,
      exchange_tier_configs (
        tier_id,
        required_points,
        default_commission_rate,
        is_active,
        tiers (
          id,
          name,
          slug
        )
      ),
      user_exchange_links (
        id,
        user_id
      )
    `)
    .order('name');

  if (error) throw error;

  // Add user count
  const exchangesWithStats = exchanges.map(exchange => ({
    ...exchange,
    connected_users_count: exchange.user_exchange_links?.length || 0,
    user_exchange_links: undefined
  }));

  return exchangesWithStats;
};

export const createExchange = async (data) => {
  const { code, name, status, logo_url, config_json } = data;

  const { data: exchange, error } = await supabaseAdmin
    .from('exchanges')
    .insert({
      code: code.toUpperCase(),
      name,
      status: status || 'active',
      logo_url,
      config_json: config_json || {}
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new BadRequestError('Exchange code already exists');
    }
    throw error;
  }

  return exchange;
};

export const updateExchange = async (id, data) => {
  const { code, name, status, logo_url, config_json } = data;

  const { data: exchange, error } = await supabaseAdmin
    .from('exchanges')
    .update({
      ...(code && { code: code.toUpperCase() }),
      ...(name && { name }),
      ...(status && { status }),
      ...(logo_url !== undefined && { logo_url }),
      ...(config_json && { config_json })
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new BadRequestError('Exchange code already exists');
    }
    throw error;
  }

  if (!exchange) {
    throw new NotFoundError('Exchange not found');
  }

  return exchange;
};

export const deleteExchange = async (id) => {
  const { error } = await supabaseAdmin
    .from('exchanges')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
};

export const getExchangeTiers = async (exchangeId) => {
  const { data: configs, error } = await supabaseAdmin
    .from('exchange_tier_configs')
    .select(`
      *,
      tiers (
        id,
        name,
        slug,
        color_hex
      )
    `)
    .eq('exchange_id', exchangeId)
    .order('required_points');

  if (error) throw error;

  return configs;
};

export const updateExchangeTiers = async (exchangeId, tierConfigs) => {
  // Delete existing configs
  await supabaseAdmin
    .from('exchange_tier_configs')
    .delete()
    .eq('exchange_id', exchangeId);

  // Insert new configs
  const configsToInsert = tierConfigs.map(config => ({
    exchange_id: exchangeId,
    tier_id: config.tier_id,
    required_points: config.required_points || 0,
    default_commission_rate: config.default_commission_rate || 0,
    is_active: config.is_active !== false
  }));

  const { data: newConfigs, error } = await supabaseAdmin
    .from('exchange_tier_configs')
    .insert(configsToInsert)
    .select(`
      *,
      tiers (
        id,
        name,
        slug
      )
    `);

  if (error) throw error;

  return newConfigs;
};
