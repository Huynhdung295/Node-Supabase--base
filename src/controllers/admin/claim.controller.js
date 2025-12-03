/**
 * Admin Claim Controller
 * Handles admin approval/rejection of claims
 */

import asyncHandler from 'express-async-handler';
import * as ClaimService from '../../services/claim/claimService.js';
import { successResponse } from '../../utils/response.js';

/**
 * Get claims awaiting admin approval
 * GET /api/v1/admin/claims/pending
 */
export const getAwaitingApproval = asyncHandler(async (req, res) => {
  const claims = await ClaimService.getClaimsAwaitingAdmin();
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * Approve a claim
 * POST /api/v1/admin/claims/:id/approve
 */
export const approveClaim = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params;
  const { notes } = req.body;

  const claim = await ClaimService.adminApproveClaim(id, adminId, notes);
  return successResponse(res, claim, 'Claim approved successfully');
});

/**
 * Reject a claim
 * POST /api/v1/admin/claims/:id/reject
 */
export const rejectClaim = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const claim = await ClaimService.adminRejectClaim(id, adminId, reason);
  return successResponse(res, claim, 'Claim rejected successfully');
});
