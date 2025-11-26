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
      .select(`
        *,
        tiers (
          id,
          name,
          slug
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedError('User profile not found');
    }

    if (profile.status !== 'active') {
      throw new ForbiddenError('Account is inactive');
    }

    // Update last sign in
    await supabaseAdmin
      .from('profiles')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', user.id);

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

// Middleware để check tier level
export const requireTier = (...allowedTierSlugs) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userTier = req.user.profile.tiers?.slug;
      
      if (!userTier || !allowedTierSlugs.includes(userTier)) {
        throw new ForbiddenError(`Access denied. Required tier: ${allowedTierSlugs.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
