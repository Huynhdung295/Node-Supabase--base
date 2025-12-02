/**
 * Claim User Controller
 * User-facing claim operations
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as ClaimService from '../../services/claim/claimService.js';

/**
 * @swagger
 * /api/me/claims:
 *   post:
 *     summary: Create withdrawal request
 *     tags: [Claims - User]
 */
export const createClaim = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    throw new BadRequestError('Valid amount is required');
  }
  
  const result = await ClaimService.createClaim(userId, amount);
  return successResponse(res, result, 'Claim created. Check your email for verification code.');
});

/**
 * @swagger
 * /api/me/claims/confirm:
 *   post:
 *     summary: Confirm withdrawal with verification code
 *     tags: [Claims - User]
 */
export const confirmClaim = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { claim_id, verification_code } = req.body;
  
  if (!claim_id || !verification_code) {
    throw new BadRequestError('claim_id and verification_code are required');
  }
  
  const claim = await ClaimService.confirmClaim(userId, claim_id, verification_code);
  return successResponse(res, claim, 'Claim confirmed successfully');
});

/**
 * @swagger
 * /api/me/claims:
 *   get:
 *     summary: Get own claim history
 *     tags: [Claims - User]
 */
export const getMyClaims = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const claims = await ClaimService.getMyClaims(userId);
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * @swagger
 * /api/me/claims/{id}/resend:
 *   post:
 *     summary: Resend verification code
 *     tags: [Claims - User]
 */
export const resendCode = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const result = await ClaimService.resendUserCode(userId, id);
  return successResponse(res, result, 'New verification code sent to your email');
});
