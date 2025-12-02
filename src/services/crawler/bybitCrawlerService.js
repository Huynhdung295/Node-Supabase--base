/**
 * Bybit Crawler Service
 * Handles Bybit API integration for commission data
 */

import axios from 'axios';

const BYBIT_API_URL = 'https://affiliates.bybit.com/api/v2/commissions/get_clients_list';

/**
 * Crawl Bybit commissions for a specific date
 * @param {string} token - Bearer token for Bybit API
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 100)
 * @returns {Promise<{success: boolean, data?: array, total?: number, page?: number, error?: string}>}
 */
export const crawlBybitDaily = async (token, targetDate, page = 1, pageSize = 100) => {
  try {
    const response = await axios.post(BYBIT_API_URL, {
      coin: 'All',
      symbol: '',
      symbol_type: 0,
      start_date: targetDate,
      end_date: targetDate,
      page_size: pageSize,
      business_type: 0,
      page,
      sort_type: 1,
      sort_status: 0,
      user_engagement: '',
      user_asset_stats: '',
      vip_level: ''
    }, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'origin': 'https://affiliates.bybit.com',
        'pragma': 'no-cache',
        'referer': `https://affiliates.bybit.com/v2/affiliate-portal/clients?start_date=${targetDate}&end_date=${targetDate}`,
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Check Bybit response code
    if (response.data.ret_code === 30101) {
      return { success: false, error: 'INVALID_TOKEN' };
    }

    if (response.data.ret_code !== 0) {
      throw new Error(`Bybit API error: ${response.data.ret_msg || 'Unknown error'}`);
    }

    return {
      success: true,
      data: response.data.result.data || [],
      total: response.data.result.total || 0,
      page: response.data.result.page || page
    };

  } catch (error) {
    if (error.message === 'INVALID_TOKEN') {
      return { success: false, error: 'INVALID_TOKEN' };
    }
    
    // Re-throw with more context
    throw new Error(`Bybit crawl failed: ${error.message}`);
  }
};

/**
 * Transform Bybit API response record to standard format
 * @param {object} bybitRecord - Raw Bybit record
 * @returns {object} - Standardized commission record
 */
export const transformBybitData = (bybitRecord) => {
  return {
    exchange_uid: String(bybitRecord.user_id),
    commissions: parseFloat(bybitRecord.commissions || 0),
    commissions_pending: parseFloat(bybitRecord.pending_commissions || 0),
    trading_amount: parseFloat(bybitRecord.trading_amount || 0),
    deposits: parseFloat(bybitRecord.deposits || 0),
    taker_amount: parseFloat(bybitRecord.taker_amount || 0),
    maker_amount: parseFloat(bybitRecord.maker_amount || 0),
    raw_data: bybitRecord
  };
};

/**
 * Crawl all pages for a given date
 * @param {string} token - Bearer token
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - All records from all pages
 */
export const crawlBybitAllPages = async (token, targetDate) => {
  const allRecords = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await crawlBybitDaily(token, targetDate, page, 100);
    
    if (!result.success) {
      return result; // Return error result
    }

    allRecords.push(...result.data);

    // Check if there are more pages
    hasMore = result.data.length === 100 && allRecords.length < result.total;
    page++;

    // Safety limit: max 100 pages (10,000 records)
    if (page > 100) {
      console.warn(`Reached maximum page limit (100) for date ${targetDate}`);
      break;
    }
  }

  return {
    success: true,
    data: allRecords,
    total: allRecords.length
  };
};
