/**
 * CS Claim Controller
 * Handles CS claim management operations with admin approval workflow
 */

import asyncHandler from 'express-async-handler';
import * as ClaimService from '../../services/claim/claimService.js';
import { successResponse } from '../../utils/response.js';

/**
 * Get pending claims needing CS review
 * GET /api/v1/cs/claims
 */
export const getPendingClaims = asyncHandler(async (req, res) => {
  const claims = await ClaimService.getPendingClaims();
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * Send CS verification code to user
 * POST /api/v1/cs/claims/:id/send-code
 */
export const sendCSCode = asyncHandler(async (req, res) => {
  const csUserId = req.user.id;
  const { id } = req.params;

  const result = await ClaimService.createCSVerification(id, csUserId);
  return successResponse(res, result, `CS verification code sent to: ${result.sent_to_email}`);
});

/**
 * CS verify claim via code
 * POST /api/v1/cs/claims/:id/verify
 */
export const verifyClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  const claim = await ClaimService.confirmCSVerification(id, code);
  return successResponse(res, claim, 'Claim verified successfully');
});

/**
 * CS request admin approval for claim
 * POST /api/v1/cs/claims/:id/request-approval
 */
export const requestAdminApproval = asyncHandler(async (req, res) => {
  const csUserId = req.user.id;
  const { id } = req.params;
  const { notes } = req.body;

  const claim = await ClaimService.requestAdminApproval(id, csUserId, notes);
  return successResponse(res, claim, 'Claim sent to admin for approval');
});

/**
 * CS process refund for rejected claim
 * POST /api/v1/cs/claims/:id/refund
 */
export const processRefund = asyncHandler(async (req, res) => {
  const csUserId = req.user.id;
  const { id } = req.params;

  const claim = await ClaimService.refundClaim(id, csUserId);
  return successResponse(res, claim, 'Refund processed successfully');
});

/**
 * CS re-request admin approval (for corrections)
 * POST /api/v1/cs/claims/:id/re-request-admin
 */
export const reRequestAdminApproval = asyncHandler(async (req, res) => {
  const csUserId = req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Re-request reason is required'
    });
  }

  const claim = await ClaimService.reRequestAdminApproval(id, csUserId, reason);
  return successResponse(res, claim, 'Re-requested admin approval successfully');
});

/**
 * Get admin-approved claims (ready for transfer)
 * GET /api/v1/cs/claims/approved
 */
export const getAdminApprovedClaims = asyncHandler(async (req, res) => {
  const claims = await ClaimService.getAdminApprovedClaims();
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * Get claims needing refund
 * GET /api/v1/cs/claims/refund-pending
 */
export const getClaimsNeedingRefund = asyncHandler(async (req, res) => {
  const claims = await ClaimService.getClaimsNeedingRefund();
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * CS manually update claim status (with validation)
 * PUT /api/v1/cs/claims/:id/status
 */
export const manualUpdate = asyncHandler(async (req, res) => {
  const csUserId = req.user.id;
  const { id } = req.params;
  const { status, notes } = req.body;

  const claim = await ClaimService.updateClaimStatus(id, status, csUserId, notes);
  return successResponse(res, claim, 'Claim status updated successfully');
});
