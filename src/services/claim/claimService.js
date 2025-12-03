/**
 * Claim Service
 * Business logic for claim/withdrawal requests
 */

import { supabaseAdmin } from '../../config/supabase.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';
import crypto from 'crypto';
import * as EmailService from '../email/emailService.js';

/**
 * Generate 8-character verification code with special characters
 * Format: alphanumeric + @$!#
 */
const generateVerificationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!#';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createClaim = async (userId, amount) => {
  // Get user's exchange connection and exchange_id
  const { data: connection } = await supabaseAdmin
    .from('user_exchange_links')
    .select('exchange_id, exchange_email, exchanges(name)')
    .eq('user_id', userId)
    .eq('status', 'verified')
    .not('exchange_email', 'is', null)
    .limit(1)
    .single();

  if (!connection || !connection.exchange_email) {
    throw new BadRequestError('No verified exchange email found. Please add and verify your exchange email first.');
  }

  // Generate verification code
  const verification_code = generateVerificationCode();
  const code_expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Create claim (tier bonus removed - tier rate is applied at crawl time)
  const { data: claim, error } = await supabaseAdmin
    .from('claim_requests')
    .insert({
      user_id: userId,
      amount,
      verification_code,
      code_expiry,
      verification_attempts: 0,
      status: 'wait_email_confirm',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Send verification email
  await EmailService.sendVerificationCode(connection.exchange_email, verification_code, 5);

  return { 
    claim, 
    verification_code,
    sent_to_email: connection.exchange_email,
    exchange_name: connection.exchanges?.name
  };
};

export const confirmClaim = async (userId, claimId, code) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('*')
    .eq('id', claimId)
    .eq('user_id', userId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Check if already failed
  if (claim.status === 'verify_failed') {
    throw new BadRequestError('Claim verification failed. Please create a new request.');
  }

  // Check if code expired
  if (new Date(claim.code_expiry) < new Date()) {
    throw new BadRequestError('Verification code expired. Please request a new code.');
  }

  // Check verification attempts
  if (claim.verification_attempts >= 3) {
    // Auto-cancel after 3 attempts
    await supabaseAdmin
      .from('claim_requests')
      .update({ status: 'verify_failed' })
      .eq('id', claimId);
    
    throw new BadRequestError('Maximum verification attempts exceeded. Claim cancelled.');
  }

  // Verify code
  if (claim.verification_code !== code) {
    // Increment attempts
    const newAttempts = claim.verification_attempts + 1;
    
    await supabaseAdmin
      .from('claim_requests')
      .update({ 
        verification_attempts: newAttempts,
        ...(newAttempts >= 3 ? { status: 'verify_failed' } : {})
      })
      .eq('id', claimId);

    const remainingAttempts = 3 - newAttempts;
    if (remainingAttempts > 0) {
      throw new BadRequestError(`Invalid verification code. ${remainingAttempts} attempt(s) remaining.`);
    } else {
      throw new BadRequestError('Invalid verification code. Maximum attempts exceeded. Claim cancelled.');
    }
  }

  // Success - update to pending status
  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({  
      status: 'pending',
      verification_attempts: 0 // Reset for potential CS verification
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

export const resendUserCode = async (userId, claimId) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('user_id')
    .eq('id', claimId)
    .eq('user_id', userId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Get user's exchange email
  const { data: connection } = await supabaseAdmin
    .from('user_exchange_links')
    .select('exchange_email, exchanges(name)')
    .eq('user_id', userId)
    .eq('status', 'verified')
    .not('exchange_email', 'is', null)
    .limit(1)
    .single();

  if (!connection || !connection.exchange_email) {
    throw new BadRequestError('No verified exchange email found.');
  }

  // Generate new code and reset expiry
  const verification_code = generateVerificationCode();
  const code_expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      verification_code,
      code_expiry,
      verification_attempts: 0,
      status: 'wait_email_confirm' // Reset to waiting if was verify_failed
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  // Send verification email to exchange email
  await EmailService.sendVerificationCode(connection.exchange_email, verification_code, 5);

  return { 
    claim: updated, 
    verification_code,
    sent_to_email: connection.exchange_email
  };
};

export const getMyClaims = async (userId) => {
  const { data: claims, error } = await supabaseAdmin
    .from('claim_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return claims;
};

// CS Functions

export const getPendingClaims = async () => {
  const { data: claims, error } = await supabaseAdmin
    .from('claim_requests')
    .select(`
      *,
      user:profiles!claim_requests_user_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .in('status', [
      'pending', 
      'email_verified', 
      'verified',
      'awaiting_admin_approval',
      'admin_approved',
      'admin_rejected',
      'rejected',
      'transferred',
      'refunded'
    ])
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get exchange email for each claim
  const claimsWithExchange = await Promise.all(
    claims.map(async (claim) => {
      const { data: connection } = await supabaseAdmin
        .from('user_exchange_links')
        .select('exchange_email, exchanges(name)')
        .eq('user_id', claim.user_id)
        .eq('status', 'verified')
        .not('exchange_email', 'is', null)
        .limit(1)
        .single();

      return {
        ...claim,
        profiles: claim.user,
        exchange_email: connection?.exchange_email,
        exchange_name: connection?.exchanges?.name
      };
    })
  );

  return claimsWithExchange;
};

export const createCSVerification = async (claimId, csUserId) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('user_id')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Get user's exchange email
  const { data: connection } = await supabaseAdmin
    .from('user_exchange_links')
    .select('exchange_email, exchanges(name)')
    .eq('user_id', claim.user_id)
    .eq('status', 'verified')
    .not('exchange_email', 'is', null)
    .limit(1)
    .single();

  if (!connection || !connection.exchange_email) {
    throw new BadRequestError('User has no verified exchange email.');
  }

  // Get user info for email template
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', claim.user_id)
    .single();

  // Generate CS verification code (8-char, 2 hour expiry)
  const cs_verification_code = generateVerificationCode();
  const cs_code_expiry = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      cs_verification_code,
      cs_code_expiry
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  // Send CS verification email to exchange email
  await EmailService.sendCSVerificationCode(
    connection.exchange_email, 
    cs_verification_code, 
    user?.full_name || 'User'
  );

  return { 
    claim: updated, 
    cs_verification_code,
    sent_to_email: connection.exchange_email
  };
};

export const confirmCSVerification = async (claimId, code) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('*')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  if (!claim.cs_verification_code) {
    throw new BadRequestError('No CS verification code sent for this claim');
  }

  // Check expiry
  if (new Date(claim.cs_code_expiry) < new Date()) {
    throw new BadRequestError('CS verification code expired. Please resend.');
  }

  // Verify code
  if (claim.cs_verification_code !== code) {
    throw new BadRequestError('Invalid CS verification code');
  }

  // Success - update to email_verified
  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({ status: 'email_verified' })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

export const updateClaimStatus = async (claimId, status, csUserId, notes = null) => {
  const validStatuses = ['verified', 'transferred', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Status must be verified, transferred, or rejected');
  }

  const { data: claim, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status,
      processed_by: csUserId
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return claim;
};

// ========================================
// ADMIN APPROVAL WORKFLOW FUNCTIONS
// ========================================

// Helper to append notes with timestamp and role
const appendNote = (currentNotes, newNote, role, action) => {
  const timestamp = new Date().toLocaleString('vi-VN');
  const entry = `[${timestamp}] [${role} ${action}]: ${newNote}`;
  return currentNotes ? `${currentNotes}\n\n${entry}` : entry;
};

/**
 * CS requests admin approval for a claim
 */
export const requestAdminApproval = async (claimId, csUserId, notes = null) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('status, user_id, cs_note')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Can only request approval from verified statuses
  const validStatuses = ['pending', 'email_verified', 'verified'];
  if (!validStatuses.includes(claim.status)) {
    throw new BadRequestError(`Cannot request admin approval from status: ${claim.status}`);
  }

  let updatedNotes = claim.cs_note;
  if (notes) {
    updatedNotes = appendNote(claim.cs_note, notes, 'CS', 'Request');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status: 'awaiting_admin_approval',
      cs_note: updatedNotes,
      processed_by: csUserId
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

/**
 * Admin approves a claim
 */
export const adminApproveClaim = async (claimId, adminUserId, notes = null) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('status, cs_note')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  if (claim.status !== 'awaiting_admin_approval') {
    throw new BadRequestError('Claim is not awaiting admin approval');
  }

  let updatedNotes = claim.cs_note;
  if (notes) {
    updatedNotes = appendNote(claim.cs_note, notes, 'Admin', 'Approve');
  } else {
    updatedNotes = appendNote(claim.cs_note, 'Approved', 'Admin', 'Approve');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status: 'admin_approved',
      admin_approved_by: adminUserId,
      admin_approved_at: new Date().toISOString(),
      admin_notes: notes, // Keep last note in dedicated column too
      cs_note: updatedNotes // Append to conversation history
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

/**
 * Admin rejects a claim
 */
export const adminRejectClaim = async (claimId, adminUserId, reason) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('status, cs_note')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  if (claim.status !== 'awaiting_admin_approval') {
    throw new BadRequestError('Claim is not awaiting admin approval');
  }

  const updatedNotes = appendNote(claim.cs_note, reason, 'Admin', 'Reject');

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status: 'admin_rejected',
      admin_approved_by: adminUserId,
      admin_approved_at: new Date().toISOString(),
      admin_notes: reason,
      cs_note: updatedNotes
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

/**
 * CS processes refund for rejected claim
 */
export const refundClaim = async (claimId, csUserId) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('status, amount, user_id, cs_note')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Can only refund from rejected statuses
  const refundableStatuses = ['rejected', 'admin_rejected'];
  if (!refundableStatuses.includes(claim.status)) {
    throw new BadRequestError(`Cannot refund claim with status: ${claim.status}`);
  }

  const updatedNotes = appendNote(claim.cs_note, 'Refund Processed', 'CS', 'Refund');

  const { data: updated, error} = await supabaseAdmin
    .from('claim_requests')
    .update({
      status: 'refunded',
      refunded_by: csUserId,
      refunded_at: new Date().toISOString(),
      refund_amount: claim.amount,
      cs_note: updatedNotes
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

/**
 * CS re-requests admin approval (for corrections)
 */
export const reRequestAdminApproval = async (claimId, csUserId, reason) => {
  const { data: claim } = await supabaseAdmin
    .from('claim_requests')
    .select('status, cs_note')
    .eq('id', claimId)
    .single();

  if (!claim) {
    throw new NotFoundError('Claim request not found');
  }

  // Can only re-request from admin-decided statuses
  const validStatuses = ['admin_approved', 'admin_rejected'];
  if (!validStatuses.includes(claim.status)) {
    throw new BadRequestError(`Cannot re-request from status: ${claim.status}`);
  }

  // Append re-request reason to existing notes
  const updatedNotes = appendNote(claim.cs_note, reason, 'CS', 'Re-Request');

  const { data: updated, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status: 'awaiting_admin_approval',
      cs_note: updatedNotes,
      processed_by: csUserId,
      // Clear previous admin decision
      admin_approved_by: null,
      admin_approved_at: null,
      admin_notes: null
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return updated;
};

/**
 * Get claims awaiting admin approval
 */
export const getClaimsAwaitingAdmin = async () => {
  const { data: claims, error } = await supabaseAdmin
    .from('claim_requests')
    .select(`
      *,
      user:profiles!claim_requests_user_id_fkey (
        id,
        email,
        full_name
      ),
      cs_user:profiles!claim_requests_processed_by_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('status', 'awaiting_admin_approval')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform to expected format
  return claims.map(claim => ({
    ...claim,
    profiles: claim.user,
    processed_by_user: claim.cs_user
  }));
};

/**
 * Get admin-approved claims (CS can transfer these)
 */
export const getAdminApprovedClaims = async () => {
  const { data: claims, error } = await supabaseAdmin
    .from('claim_requests')
    .select(`
      *,
      user:profiles!claim_requests_user_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('status', 'admin_approved')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return claims.map(claim => ({
    ...claim,
    profiles: claim.user
  }));
};

/**
 * Get claims needing refund (rejected but not refunded)
 */
export const getClaimsNeedingRefund = async () => {
  const { data: claims, error } = await supabaseAdmin
    .from('claim_requests')
    .select(`
      *,
      user:profiles!claim_requests_user_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .in('status', ['rejected', 'admin_rejected'])
    .order('created_at', { ascending: false});

  if (error) throw error;

  return claims.map(claim => ({
    ...claim,
    profiles: claim.user
  }));
};

// ========================================
// LEGACY / BACKWARD COMPATIBILITY
// ========================================

// Keep backward compatibility
export const processClaim = async (claimId, status, notes = null) => {
  const validStatuses = ['approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Status must be approved or rejected');
  }

  const { data: claim, error } = await supabaseAdmin
    .from('claim_requests')
    .update({
      status,
      cs_note: notes
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;

  return claim;
};

export const getAllClaims = async ({ page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('claim_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: claims, error } = await query;

  if (error) throw error;

  return claims;
};
