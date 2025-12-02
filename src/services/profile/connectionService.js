/**
 * Profile Connection Service
 * Business logic for user's own exchange connections
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

export const getMyConnections = async (userId) => {
  const { data: connections, error } = await supabaseAdmin
    .from('user_exchange_links')
    .select(`
      *,
      exchanges (
        id,
        code,
        name,
        logo_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // For each connection, get commission totals from daily_commissions
  const connectionsWithCommissions = await Promise.all(
    connections.map(async (conn) => {
      const { data: commissions } = await supabaseAdmin
        .from('daily_commissions')
        .select('commissions, commissions_pending')
        .eq('user_id', userId)
        .eq('exchange_id', conn.exchange_id);

      const total_finalized = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions || 0), 0) || 0;
      const total_pending = commissions?.reduce((sum, c) => sum + parseFloat(c.commissions_pending || 0), 0) || 0;

      return {
        ...conn,
        commission_summary: {
          finalized: total_finalized,
          pending: total_pending,
          total: total_finalized + total_pending
        }
      };
    })
  );

  return connectionsWithCommissions;
};

export const createConnection = async (userId, exchangeId, exchangeUid) => {
  const { data: existingLink } = await supabaseAdmin
    .from('user_exchange_links')
    .select('id')
    .eq('user_id', userId)
    .eq('exchange_id', exchangeId)
    .single();

  if (existingLink) {
    throw new BadRequestError('You are already connected to this exchange');
  }

  const { data: link, error } = await supabaseAdmin
    .from('user_exchange_links')
    .insert({
      user_id: userId,
      exchange_id: exchangeId,
      exchange_uid: exchangeUid,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      exchanges (
        code,
        name,
        logo_url
      )
    `)
    .single();

  if (error) throw error;

  return link;
};

export const updateConnection = async (userId, connectionId, updateData) => {
  const { exchange_uid, exchange_email } = updateData;
  
  const updateFields = {
    updated_at: new Date().toISOString()
  };
  
  if (exchange_uid) updateFields.exchange_uid = exchange_uid;
  if (exchange_email !== undefined) updateFields.exchange_email = exchange_email;

  const { data: link, error } = await supabaseAdmin
    .from('user_exchange_links')
    .update(updateFields)
    .eq('id', connectionId)
    .eq('user_id', userId)
    .select(`
      *,
      exchanges (
        id,
        code,
        name,
        logo_url
      )
    `)
    .single();

  if (error) throw error;
  if (!link) {
    throw new NotFoundError('Connection not found');
  }

  return link;
};

export const deleteConnection = async (userId, connectionId) => {
  const { error } = await supabaseAdmin
    .from('user_exchange_links')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', userId);

  if (error) throw error;

  return true;
};
