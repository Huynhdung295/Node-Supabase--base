import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

export const claimController = {
  // POST /api/me/claims - User: Create withdrawal request
  async createClaim(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        throw new BadRequestError('Valid amount is required');
      }

      // Get system settings for min/max amounts
      const { data: minSetting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'min_claim_amount')
        .single();

      const { data: maxSetting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'max_claim_amount')
        .single();

      const minAmount = parseFloat(minSetting?.value || 10);
      const maxAmount = parseFloat(maxSetting?.value || 10000);

      if (amount < minAmount || amount > maxAmount) {
        throw new BadRequestError(`Amount must be between ${minAmount} and ${maxAmount}`);
      }

      // Check user balance
      const { data: balance, error: balanceError } = await supabaseAdmin
        .rpc('get_user_balance', { user_uuid: userId });

      if (balanceError) throw balanceError;

      if (parseFloat(balance) < amount) {
        throw new BadRequestError('Insufficient balance');
      }

      // Generate verification code
      const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

      const { data: claim, error } = await supabaseAdmin
        .from('claim_requests')
        .insert({
          user_id: userId,
          amount,
          status: 'wait_email_confirm',
          verification_code: verificationCode
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send email with verification code
      // await emailService.sendClaimVerification(req.user.email, verificationCode);

      return successResponse(res, {
        id: claim.id,
        amount: claim.amount,
        status: claim.status,
        message: 'Verification code sent to your email'
      }, 'Claim request created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/me/claims/confirm - User: Confirm withdrawal with verification code
  async confirmClaim(req, res, next) {
    try {
      const userId = req.user.id;
      const { claim_id, verification_code } = req.body;

      if (!claim_id || !verification_code) {
        throw new BadRequestError('claim_id and verification_code are required');
      }

      const { data: claim, error } = await supabaseAdmin
        .from('claim_requests')
        .select('*')
        .eq('id', claim_id)
        .eq('user_id', userId)
        .eq('status', 'wait_email_confirm')
        .single();

      if (error || !claim) {
        throw new NotFoundError('Claim request not found or already processed');
      }

      if (claim.verification_code !== verification_code.toUpperCase()) {
        throw new BadRequestError('Invalid verification code');
      }

      // Update status to pending for CS review
      const { data: updatedClaim, error: updateError } = await supabaseAdmin
        .from('claim_requests')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', claim_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return successResponse(res, updatedClaim, 'Claim confirmed successfully. Pending CS review.');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/me/claims - User: Get own claim history
  async getMyClaims(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const { data: claims, error } = await supabaseAdmin
        .from('claim_requests')
        .select('id, amount, status, created_at, updated_at, cs_note')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return successResponse(res, claims, 'Claims retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/cs/claims - CS: Get pending claims
  async getPendingClaims(req, res, next) {
    try {
      const { page = 1, limit = 20, status = 'pending' } = req.query;

      const offset = (page - 1) * limit;

      const { data: claims, error } = await supabaseAdmin
        .from('claim_requests')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return successResponse(res, claims, 'Claims retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/cs/claims/:id - CS: Process claim
  async processClaim(req, res, next) {
    try {
      const { id } = req.params;
      const { status, cs_note, proof_img_url } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        throw new BadRequestError('Status must be approved or rejected');
      }

      const updateData = {
        status,
        cs_note,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved' && proof_img_url) {
        updateData.proof_img_url = proof_img_url;
      }

      const { data: claim, error } = await supabaseAdmin
        .from('claim_requests')
        .update(updateData)
        .eq('id', id)
        .eq('status', 'pending')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      if (!claim) {
        throw new NotFoundError('Claim not found or not in pending status');
      }

      // TODO: Send notification email to user
      // await emailService.sendClaimProcessed(claim.profiles.email, claim);

      return successResponse(res, claim, `Claim ${status} successfully`);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/admin/claims - Admin: Get all claims
  async getAllClaims(req, res, next) {
    try {
      const { page = 1, limit = 20, status, user_id } = req.query;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('claim_requests')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const { data: claims, error } = await query;

      if (error) throw error;

      return successResponse(res, claims, 'Claims retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/claims/:id - Admin: Update claim status
  async updateClaimStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, cs_note, proof_img_url } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        throw new BadRequestError('Status must be approved, rejected, or pending');
      }

      const updateData = {
        status,
        cs_note,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved' && proof_img_url) {
        updateData.proof_img_url = proof_img_url;
      }

      const { data: claim, error } = await supabaseAdmin
        .from('claim_requests')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      if (!claim) {
        throw new NotFoundError('Claim not found');
      }

      return successResponse(res, claim, `Claim ${status} successfully`);
    } catch (error) {
      next(error);
    }
  }
};