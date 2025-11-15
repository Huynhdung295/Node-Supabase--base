// Advanced request logging middleware with performance tracking

import { logger } from '../utils/logger.js';

// Store for tracking request metrics
const requestMetrics = {
  total: 0,
  byMethod: {},
  byStatus: {},
  byEndpoint: {},
  slowRequests: []
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach request ID to request object
  req.requestId = requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    return res.send(data);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent']
    };

    // Update metrics
    requestMetrics.total++;
    requestMetrics.byMethod[req.method] = (requestMetrics.byMethod[req.method] || 0) + 1;
    requestMetrics.byStatus[res.statusCode] = (requestMetrics.byStatus[res.statusCode] || 0) + 1;
    requestMetrics.byEndpoint[req.url] = (requestMetrics.byEndpoint[req.url] || 0) + 1;

    // Track slow requests (>2 seconds)
    if (duration > 2000) {
      requestMetrics.slowRequests.push({
        ...logData,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 slow requests
      if (requestMetrics.slowRequests.length > 100) {
        requestMetrics.slowRequests.shift();
      }
    }

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else if (duration > 2000) {
      logger.warn('Slow request', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Endpoint to get metrics (admin only)
export const getRequestMetrics = (req, res) => {
  return res.json({
    success: true,
    data: {
      ...requestMetrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
};

// Reset metrics
export const resetRequestMetrics = () => {
  requestMetrics.total = 0;
  requestMetrics.byMethod = {};
  requestMetrics.byStatus = {};
  requestMetrics.byEndpoint = {};
  requestMetrics.slowRequests = [];
};

export default requestLogger;
