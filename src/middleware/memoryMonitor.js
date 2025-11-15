// Memory leak detection and monitoring middleware

import { logger } from '../utils/logger.js';

const MEMORY_THRESHOLD = 0.9; // 90% of heap limit
const CHECK_INTERVAL = 60000; // Check every minute

let memoryCheckInterval = null;
let memoryHistory = [];
const MAX_HISTORY = 60; // Keep 60 data points

// Get memory usage info
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(usage.rss / 1024 / 1024);
  const externalMB = Math.round(usage.external / 1024 / 1024);
  
  return {
    heapUsed: heapUsedMB,
    heapTotal: heapTotalMB,
    rss: rssMB,
    external: externalMB,
    heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    timestamp: new Date().toISOString()
  };
};

// Check for memory leaks
const checkMemoryLeak = () => {
  const usage = getMemoryUsage();
  
  // Add to history
  memoryHistory.push(usage);
  if (memoryHistory.length > MAX_HISTORY) {
    memoryHistory.shift();
  }

  // Check if memory usage is too high
  if (usage.heapUsedPercent > MEMORY_THRESHOLD * 100) {
    logger.warn('High memory usage detected', usage);
    
    // Force garbage collection if available
    if (global.gc) {
      logger.info('Running garbage collection...');
      global.gc();
      
      const afterGC = getMemoryUsage();
      logger.info('Memory after GC', afterGC);
    } else {
      logger.warn('Garbage collection not available. Run with --expose-gc flag');
    }
  }

  // Detect potential memory leak (steadily increasing memory)
  if (memoryHistory.length >= 10) {
    const recent = memoryHistory.slice(-10);
    const isIncreasing = recent.every((curr, idx) => {
      if (idx === 0) return true;
      return curr.heapUsed >= recent[idx - 1].heapUsed;
    });

    if (isIncreasing) {
      logger.error('Potential memory leak detected - memory steadily increasing', {
        history: recent.map(h => ({ heapUsed: h.heapUsed, timestamp: h.timestamp }))
      });
    }
  }
};

// Start memory monitoring
export const startMemoryMonitoring = () => {
  if (memoryCheckInterval) {
    logger.warn('Memory monitoring already started');
    return;
  }

  logger.info('Starting memory monitoring', {
    interval: `${CHECK_INTERVAL / 1000}s`,
    threshold: `${MEMORY_THRESHOLD * 100}%`
  });

  memoryCheckInterval = setInterval(checkMemoryLeak, CHECK_INTERVAL);
  
  // Initial check
  checkMemoryLeak();
};

// Stop memory monitoring
export const stopMemoryMonitoring = () => {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
    memoryCheckInterval = null;
    logger.info('Memory monitoring stopped');
  }
};

// Middleware to track memory per request
export const memoryMonitor = (req, res, next) => {
  const startMemory = process.memoryUsage().heapUsed;

  res.on('finish', () => {
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDiff = endMemory - startMemory;
    const memoryDiffMB = Math.round(memoryDiff / 1024 / 1024 * 100) / 100;

    // Log if request used significant memory (>10MB)
    if (Math.abs(memoryDiffMB) > 10) {
      logger.warn('High memory usage in request', {
        method: req.method,
        url: req.url,
        memoryDiff: `${memoryDiffMB}MB`,
        requestId: req.requestId
      });
    }
  });

  next();
};

// Get memory history
export const getMemoryHistory = () => {
  return {
    current: getMemoryUsage(),
    history: memoryHistory,
    uptime: process.uptime()
  };
};

// Force garbage collection (if available)
export const forceGC = () => {
  if (global.gc) {
    const before = getMemoryUsage();
    global.gc();
    const after = getMemoryUsage();
    
    return {
      before,
      after,
      freed: before.heapUsed - after.heapUsed
    };
  }
  
  throw new Error('Garbage collection not available. Run with --expose-gc flag');
};

export default {
  memoryMonitor,
  startMemoryMonitoring,
  stopMemoryMonitoring,
  getMemoryUsage,
  getMemoryHistory,
  forceGC
};
