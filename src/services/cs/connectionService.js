/**
 * CS Connection Service
 * Business logic for CS connection management
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

/**
 * Get pending connections for review
 */
export const getPendingConnections = async () => {
  const { data: connections, error } = await supabaseAdmin
    .from('user_exchange_links')
    .select(`
      *,
      profiles (
        id,
        email,
        full_name
      ),
      exchanges (
        id,
        code,
        name,
        logo_url
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return connections;
};

/**
 * Process connection (approve/reject)
 */
export const processConnection = async (connectionId, status, notes = null) => {
  const validStatuses = ['verified', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Status must be either verified or rejected');
  }

  const { data: connection, error } = await supabaseAdmin
    .from('user_exchange_links')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', connectionId)
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
  if (!connection) {
    throw new NotFoundError('Connection not found');
  }

  return connection;
};

/**
 * Create new connection (CS role)
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
