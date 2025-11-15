import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getRequestMetrics } from '../middleware/requestLogger.js';
import { 
  getMemoryUsage, 
  getMemoryHistory, 
  forceGC 
} from '../middleware/memoryMonitor.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: System metrics and monitoring (Admin only)
 */

/**
 * @swagger
 * /api/v1/metrics/requests:
 *   get:
 *     summary: Get request metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Request metrics
 */
router.get('/requests', authenticate, authorize('admin'), getRequestMetrics);

/**
 * @swagger
 * /api/v1/metrics/memory:
 *   get:
 *     summary: Get memory usage
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memory usage
 */
router.get('/memory', authenticate, authorize('admin'), (req, res) => {
  const memory = getMemoryUsage();
  return successResponse(res, memory);
});

/**
 * @swagger
 * /api/v1/metrics/memory/history:
 *   get:
 *     summary: Get memory history
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memory history
 */
router.get('/memory/history', authenticate, authorize('admin'), (req, res) => {
  const history = getMemoryHistory();
  return successResponse(res, history);
});

/**
 * @swagger
 * /api/v1/metrics/gc:
 *   post:
 *     summary: Force garbage collection
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GC completed
 */
router.post('/gc', authenticate, authorize('admin'), (req, res, next) => {
  try {
    const result = forceGC();
    return successResponse(res, result, 'Garbage collection completed');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/metrics/system:
 *   get:
 *     summary: Get system info
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System info
 */
router.get('/system', authenticate, authorize('admin'), (req, res) => {
  const systemInfo = {
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version,
    cpuUsage: process.cpuUsage(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
    pid: process.pid
  };
  
  return successResponse(res, systemInfo);
});

export default router;
