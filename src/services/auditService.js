// Audit logging service

import { supabaseAdmin } from '../config/supabase.js';
import { AUDIT_ACTIONS, DB_TABLES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Log audit event
 * @param {object} params - Audit log parameters
 * @param {string} params.userId - User ID performing action
 * @param {string} params.action - Action type (from AUDIT_ACTIONS)
 * @param {string} params.resourceType - Type of resource (e.g., 'user', 'profile')
 * @param {string} params.resourceId - ID of affected resource
 * @param {object} params.metadata - Additional metadata
 * @param {string} params.ipAddress - IP address of request
 * @param {string} params.userAgent - User agent string
 */
export const logAudit = async ({
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {},
  ipAddress = null,
  userAgent = null
}) => {
  try {
    const { error } = await supabaseAdmin
      .from(DB_TABLES.AUDIT_LOGS)
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      logger.error('Failed to log audit event', { error, action, userId });
    }
  } catch (error) {
    logger.error('Audit logging error', { error: error.message });
  }
};

/**
 * Get audit logs for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
export const getUserAuditLogs = async (userId, options = {}) => {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.AUDIT_LOGS)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Get audit logs for a resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
export const getResourceAuditLogs = async (resourceType, resourceId, options = {}) => {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.AUDIT_LOGS)
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Get all audit logs (admin only)
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
export const getAllAuditLogs = async (options = {}) => {
  const { limit = 100, offset = 0, action = null } = options;

  let query = supabaseAdmin
    .from(DB_TABLES.AUDIT_LOGS)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, total: count };
};

/**
 * Delete old audit logs (cleanup)
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} - Number of deleted records
 */
export const cleanupOldAuditLogs = async (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.AUDIT_LOGS)
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throw error;
  }

  logger.info(`Cleaned up ${data?.length || 0} old audit logs`);
  return data?.length || 0;
};

export default {
  logAudit,
  getUserAuditLogs,
  getResourceAuditLogs,
  getAllAuditLogs,
  cleanupOldAuditLogs,
  AUDIT_ACTIONS
};
