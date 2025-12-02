/**
 * Role and Status Constants
 * Centralized constants for user roles, role hierarchy, and user statuses
 */

// Role hierarchy for permission checks (higher number = higher privilege)
export const ROLE_HIERARCHY = {
  system: 4,
  admin: 3,
  cs: 2,
  user: 1
};

// Available user roles
export const ROLES = {
  SYSTEM: 'system',
  ADMIN: 'admin',
  CS: 'cs',
  USER: 'user'
};

// User account statuses
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned'
};

// Exchange connection/link statuses
export const LINK_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Helper function to get role level
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

// Helper function to check if requester can modify target
export const canModifyRole = (requesterRole, targetRole, newRole = null) => {
  if (requesterRole === ROLES.SYSTEM) return true;
  
  const requesterLevel = getRoleLevel(requesterRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // Cannot modify peer or higher
  if (targetLevel >= requesterLevel) return false;
  
  // If setting new role, cannot set to peer or higher
  if (newRole) {
    const newRoleLevel = getRoleLevel(newRole);
    if (newRoleLevel >= requesterLevel) return false;
  }
  
  return true;
};
