import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

/**
 * @swagger
 * /api/settings/public:
 *   get:
 *     summary: Get public system settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public system settings
 */
router.get('/public', async (req, res, next) => {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'user_editable_fields',
        'maintenance_mode',
        'min_claim_amount',
        'max_claim_amount',
        'email_verification_required'
      ]);

    if (error) throw error;

    // Convert to object format
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return successResponse(res, settingsObj, 'Public settings retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;