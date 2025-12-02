/**
 * Claim Admin Controller
 * Admin/CS claim management operations
 */

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';
import * as ClaimService from '../../services/claim/claimService.js';

/**
 * @swagger
 * /api/cs/claims:
 *   get:
 *     summary: Get pending claims (CS)
 *     tags: [Claims - CS]
 */
export const getPendingClaims = asyncHandler(async (req, res) => {
  const claims = await ClaimService.getPendingClaims();
  return successResponse(res, claims, 'Pending claims retrieved successfully');
});

/**
 * @swagger
 * /api/cs/claims/{id}:
 *   put:
 *     summary: Process claim (CS)
 *     tags: [Claims - CS]
 */
export const processClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  const claim = await ClaimService.processClaim(id, status, notes);
  return successResponse(res, claim, 'Claim processed successfully');
});

/**
 * @swagger
 * /api/cs/claims/{id}/send-code:
 *   post:
 *     summary: Send CS verification code (CS)
 *     tags: [Claims - CS]
 */
export const sendCSCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const csUserId = req.user.id;
  
  const result = await ClaimService.createCSVerification(id, csUserId);
  return successResponse(res, result, 'CS verification code sent');
});

/**
 * @swagger
 * /api/cs/claims/{id}/verify:
 *   post:
 *     summary: Verify CS code (CS)
 *     tags: [Claims - CS]
 */
export const verifyClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;
  
  if (!code) {
    throw new BadRequestError('Verification code is required');
  }
  
  const claim = await ClaimService.confirmCSVerification(id, code);
  return successResponse(res, claim, 'Claim verified successfully');
});

/**
 * @swagger
 * /api/cs/claims/{id}/status:
 *   put:
 *     summary: Manual status update (CS)
 *     tags: [Claims - CS]
 */
export const manualUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const csUserId = req.user.id;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  const claim = await ClaimService.updateClaimStatus(id, status, csUserId, notes);
  return successResponse(res, claim, 'Claim status updated successfully');
});

/**
 * @swagger
 * /api/admin/claims:
 *   get:
 *     summary: Get all claims (Admin)
 *     tags: [Claims - Admin]
 */
export const getAllClaims = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const claims = await ClaimService.getAllClaims({ 
    page: parseInt(page), 
    limit: parseInt(limit), 
    status 
  });
  return successResponse(res, claims, 'Claims retrieved successfully');
});

/**
 * @swagger
 * /api/admin/claims/{id}:
 *   put:
 *     summary: Update claim status (Admin)
 *     tags: [Claims - Admin]
 */
export const updateClaimStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  const claim = await ClaimService.processClaim(id, status, notes);
  return successResponse(res, claim, 'Claim status updated successfully');
});
