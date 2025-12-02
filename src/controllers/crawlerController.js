import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';

export const crawlerController = {
  /**
   * @swagger
   * /api/crawler/transactions:
   *   post:
   *     summary: Submit transactions from crawler (Crawler API)
   *     tags: [Crawler]
   *     security:
   *       - crawlerToken: []
   *     parameters:
   *       - in: header
   *         name: x-crawler-token
   *         required: true
   *         schema:
   *           type: string
   *         description: Crawler authentication token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exchange_id
   *               - transactions
   *             properties:
   *               exchange_id:
   *                 type: string
   *                 format: uuid
   *                 description: Exchange ID
   *               transactions:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - exchange_uid
   *                     - raw_volume
   *                   properties:
   *                     exchange_uid:
   *                       type: string
   *                       description: User's UID on the exchange
   *                     raw_volume:
   *                       type: number
   *                       description: Transaction volume
   *                     transaction_date:
   *                       type: string
   *                       format: date-time
   *                     raw_data:
   *                       type: object
   *                       description: Additional transaction data
   *     responses:
   *       200:
   *         description: Transactions processed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: integer
   *                 failed:
   *                   type: integer
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *       401:
   *         description: Invalid or expired crawler token
   */
  async submitTransactions(req, res, next) {
    try {
      const { exchange_id, transactions } = req.body;
      const crawlerToken = req.headers['x-crawler-token'];

      if (!crawlerToken) {
        throw new UnauthorizedError('Crawler token is required');
      }

      if (!exchange_id || !Array.isArray(transactions)) {
        throw new BadRequestError('exchange_id and transactions array are required');
      }

      // 1. Validate Token
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('crawler_tokens')
        .select('*')
        .eq('token', crawlerToken)
        .eq('exchange_id', exchange_id)
        .eq('status', 'active')
        .single();

      if (tokenError || !tokenData) {
        throw new UnauthorizedError('Invalid or inactive crawler token');
      }

      if (tokenData.expired_at && new Date(tokenData.expired_at) < new Date()) {
        throw new UnauthorizedError('Crawler token has expired');
      }

      // Update last_used_at
      await supabaseAdmin
        .from('crawler_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // 2. Process Transactions
      for (const tx of transactions) {
        try {
          const { exchange_uid, raw_volume, transaction_date, raw_data } = tx;

          if (!exchange_uid || raw_volume === undefined) {
            throw new Error('exchange_uid and raw_volume are required');
          }

          // Find user link
          const { data: link, error: linkError } = await supabaseAdmin
            .from('user_exchange_links')
            .select(`
              id,
              user_id,
              custom_commission_rate,
              total_volume,
              profiles (
                id,
                current_tier_id
              )
            `)
            .eq('exchange_id', exchange_id)
            .eq('exchange_uid', exchange_uid)
            .single();

          if (linkError || !link) {
            throw new Error(`User link not found for UID ${exchange_uid}`);
          }

          // Calculate Commission Rate
          let rate = 0;
          if (link.custom_commission_rate !== null) {
            rate = parseFloat(link.custom_commission_rate);
          } else {
            const tierId = link.profiles.current_tier_id;
            if (tierId) {
              const { data: tierConfig } = await supabaseAdmin
                .from('exchange_tier_configs')
                .select('default_commission_rate')
                .eq('exchange_id', exchange_id)
                .eq('tier_id', tierId)
                .eq('is_active', true)
                .single();
              
              if (tierConfig) {
                rate = parseFloat(tierConfig.default_commission_rate);
              }
            }
          }

          const commission_amount = parseFloat(raw_volume) * rate;

          // Insert Transaction
          const { error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: link.user_id,
              link_id: link.id,
              exchange_id,
              raw_volume,
              commission_amount,
              rate_snapshot: rate,
              transaction_date: transaction_date || new Date().toISOString(),
              raw_data: raw_data || {}
            });

          if (insertError) throw insertError;

          // Update Link Total Volume
          const newTotalVolume = parseFloat(link.total_volume || 0) + parseFloat(raw_volume);
          await supabaseAdmin
            .from('user_exchange_links')
            .update({ 
              total_volume: newTotalVolume,
              updated_at: new Date().toISOString()
            })
            .eq('id', link.id);

          // Trigger Tier Update (DB Function)
          await supabaseAdmin.rpc('update_user_tier', {
            user_uuid: link.user_id,
            exchange_id_param: exchange_id
          });

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            uid: tx.exchange_uid,
            error: err.message
          });
        }
      }

      return successResponse(res, results, 'Transactions processed');
    } catch (error) {
      next(error);
    }
  }
};
