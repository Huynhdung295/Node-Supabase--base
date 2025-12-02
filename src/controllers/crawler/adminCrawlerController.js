/**
 * Admin Crawler Controller
 * Admin-only endpoints for managing exchange crawlers
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';
import { supabaseAdmin } from '../../config/supabase.js';
import * as BybitCrawler from '../../services/crawler/bybitCrawlerService.js';
import * as CommissionProcessor from '../../services/crawler/commissionProcessor.js';

/**
 * @swagger
 * /api/admin/crawler/refresh/{exchange_id}:
 *   post:
 *     summary: Manually refresh exchange commissions (Admin)
 *     tags: [Admin - Crawler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exchange_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exchange ID to crawl
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-11-29"
 *         description: Target date (default: today)
 *     responses:
 *       200:
 *         description: Crawl completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     total_records:
 *                       type: integer
 *                     processed:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *                     errors:
 *                       type: array
 *       400:
 *         description: Invalid token or exchange not supported
 */
export const refreshExchangeCrawl = asyncHandler(async (req, res) => {
  const { exchange_id } = req.params;
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new BadRequestError('Invalid date format. Use YYYY-MM-DD');
  }

  // 1. Get exchange information
  const { data: exchange, error: exchangeError } = await supabaseAdmin
    .from('exchanges')
    .select('id, code, name')
    .eq('id', exchange_id)
    .single();

  if (exchangeError || !exchange) {
    throw new NotFoundError('Exchange not found');
  }

  // 2. Get active crawler token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('crawler_tokens')
    .select('*')
    .eq('exchange_id', exchange_id)
    .eq('status', 'active')
    .single();

  if (tokenError || !tokenData) {
    throw new BadRequestError(`No active crawler token found for ${exchange.name}`);
  }

  // 3. Call appropriate crawler based on exchange code
  let crawlResult;
  const exchangeCode = exchange.code.toUpperCase();

  if (exchangeCode === 'BYBIT') {
    crawlResult = await BybitCrawler.crawlBybitAllPages(tokenData.token, targetDate);
  } else {
    throw new BadRequestError(`Exchange ${exchange.code} is not supported yet. Only BYBIT is currently supported.`);
  }

  // 4. Handle token validation error
  if (!crawlResult.success && crawlResult.error === 'INVALID_TOKEN') {
    // Update token status to failed
    await supabaseAdmin
      .from('crawler_tokens')
      .update({
        status: 'failed',
        last_used_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    throw new BadRequestError('Crawler token is invalid or expired. Please update the token in settings.');
  }

  // 5. Transform data using exchange-specific transformer
  let transformedData;
  if (exchangeCode === 'BYBIT') {
    transformedData = crawlResult.data.map(BybitCrawler.transformBybitData);
  }

  // 6. Process and save to database
  const processResult = await CommissionProcessor.processDailySnapshot(
    exchange_id,
    targetDate,
    transformedData
  );

  // 7. Update token status to active (successful crawl)
  await supabaseAdmin
    .from('crawler_tokens')
    .update({
      status: 'active',
      last_used_at: new Date().toISOString()
    })
    .eq('id', tokenData.id);

  // 8. Return results with detailed info
  return successResponse(res, {
    exchange: {
      id: exchange.id,
      code: exchange.code,
      name: exchange.name
    },
    date: targetDate,
    total_records: crawlResult.total,
    processed: processResult.processed,
    unlinked: processResult.unlinked || 0, // UIDs without user link
    duplicates: processResult.duplicates || 0,
    sample_records: processResult.records.slice(0, 5), // Show first 5 processed
    errors: processResult.errors.length > 0 ? processResult.errors.slice(0, 10) : [] // Limit errors to 10
  }, `Successfully crawled ${processResult.processed} records for ${exchange.name} on ${targetDate} (${processResult.unlinked} unlinked UIDs saved)`);
});

/**
 * @swagger
 * /api/admin/crawler/status/{exchange_id}:
 *   get:
 *     summary: Get crawler status for an exchange (Admin)
 *     tags: [Admin - Crawler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exchange_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Crawler status retrieved
 */
export const getCrawlerStatus = asyncHandler(async (req, res) => {
  const { exchange_id } = req.params;

  // Get exchange
  const { data: exchange } = await supabaseAdmin
    .from('exchanges')
    .select('id, code, name')
    .eq('id', exchange_id)
    .single();

  if (!exchange) {
    throw new NotFoundError('Exchange not found');
  }

  // Get token info (with hashed token)
  const { data: token } = await supabaseAdmin
    .from('crawler_tokens')
    .select('*')
    .eq('exchange_id', exchange_id)
    .single();

  // Get latest crawl stats
  const { data: latestCrawl } = await supabaseAdmin
    .from('daily_commissions')
    .select('date, is_finalized')
    .eq('exchange_id', exchange_id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Get total users with connections
  const { count: totalLinks } = await supabaseAdmin
    .from('user_exchange_links')
    .select('*', { count: 'exact', head: true })
    .eq('exchange_id', exchange_id)
    .eq('status', 'verified');

  return successResponse(res, {
    exchange,
    token: token ? {
      id: token.id,
      status: token.status,
      last_used_at: token.last_used_at,
      expired_at: token.expired_at
    } : null,
    latest_crawl: latestCrawl,
    total_verified_links: totalLinks || 0
  }, 'Crawler status retrieved');
});

/**
 * @swagger
 * /api/admin/crawler/data/{exchange_id}:
 *   get:
 *     summary: View crawled commission data (Admin)
 *     tags: [Admin - Crawler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exchange_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Daily commissions data retrieved
 */
export const getCommissionData = asyncHandler(async (req, res) => {
  const { exchange_id } = req.params;
  const { date, page = 1, limit = 50 } = req.query;

  const result = await CommissionProcessor.getDailyCommissions({
    exchangeId: parseInt(exchange_id),
    date,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return successResponse(res, result, 'Commission data retrieved');
});
