/**
 * Admin Link Service
 * Business logic for managing user-exchange connections
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

/**
 * Set custom commission rate for a link
 */
export const setCustomCommissionRate = async (linkId, customRate) => {
  const { data: link, error } = await supabaseAdmin
    .from('user_exchange_links')
    .update({
      custom_commission_rate: customRate,
      updated_at: new Date().toISOString()
    })
    .eq('id', linkId)
    .select(`
      *,
      profiles (
        email,
        full_name
      ),
      exchanges (
        code,
        name
      )
    `)
    .single();

  if (error) throw error;
  if (!link) {
    throw new NotFoundError('Exchange link not found');
  }

  return link;
};

/**
 * Update connection status (pending/verified/rejected)
 */
export const updateConnectionStatus = async (linkId, status) => {
  const { data: link, error } = await supabaseAdmin
    .from('user_exchange_links')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', linkId)
    .select(`
      *,
      profiles (
        email,
        full_name
      ),
      exchanges (
        code,
        name
      )
    `)
    .single();

  if (error) throw error;
  if (!link) {
    throw new NotFoundError('Exchange link not found');
  }

  return link;
};

/**
 * Create new user-exchange connection
 */
export const createConnection = async (userId, exchangeId, exchangeUid, status = 'verified') => {
  // Check if connection already exists
  const { data: existingLink } = await supabaseAdmin
    .from('user_exchange_links')
    .select('id')
    .eq('user_id', userId)
    .eq('exchange_id', exchangeId)
    .single();

  if (existingLink) {
    throw new BadRequestError('Connection already exists for this user and exchange');
  }

  const { data: link, error } = await supabaseAdmin
    .from('user_exchange_links')
    .insert({
      user_id: userId,
      exchange_id: exchangeId,
      exchange_uid: exchangeUid,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      profiles (
        email,
        full_name
      ),
      exchanges (
        code,
        name
      )
    `)
    .single();

  if (error) throw error;

  return link;
};

/**
 * Delete user-exchange connection
 */
export const deleteConnection = async (linkId) => {
  // Check if connection exists
  const { data: existingLink } = await supabaseAdmin
    .from('user_exchange_links')
    .select('id')
    .eq('id', linkId)
    .single();

  if (!existingLink) {
    throw new NotFoundError('Connection not found');
  }

  const { error } = await supabaseAdmin
    .from('user_exchange_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;

  return true;
};
