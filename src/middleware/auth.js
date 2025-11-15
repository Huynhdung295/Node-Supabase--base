import { supabase, supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

// Middleware để verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Verify token với Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Lấy profile từ database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedError('User profile not found');
    }

    if (!profile.is_active) {
      throw new ForbiddenError('Account is inactive');
    }

    // Attach user info vào request
    req.user = {
      ...user,
      profile
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware để check role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.profile.role;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware để check tier VIP
export const requireTier = (...allowedTiers) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userTier = req.user.profile.tier_vip;
      const tierHierarchy = { silver: 1, gold: 2, diamond: 3 };

      const userTierLevel = tierHierarchy[userTier];
      const requiredTierLevel = Math.min(...allowedTiers.map(t => tierHierarchy[t]));

      if (userTierLevel < requiredTierLevel) {
        throw new ForbiddenError(`Access denied. Required tier: ${allowedTiers.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
