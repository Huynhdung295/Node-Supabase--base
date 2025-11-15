// Logger utility - Better than console.log
import fs from 'fs';
import path from 'path';

const LOG_DIR = 'logs';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

const getTimestamp = () => new Date().toISOString();

const writeLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };

  const logString = JSON.stringify(logEntry) + '\n';

  // Console output
  const colors = {
    info: '\x1b[36m',    // Cyan
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    success: '\x1b[32m', // Green
    reset: '\x1b[0m'
  };

  console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${message}${colors.reset}`, meta);

  // File output (production)
  if (process.env.NODE_ENV === 'production') {
    const logFile = path.join(LOG_DIR, `${level}.log`);
    fs.appendFileSync(logFile, logString);
  }
};

export const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  success: (message, meta) => writeLog('success', message, meta),
  
  // Request logger middleware
  request: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      if (res.statusCode >= 400) {
        logger.error(`${req.method} ${req.url}`, logData);
      } else {
        logger.info(`${req.method} ${req.url}`, logData);
      }
    });
    
    next();
  }
};

export default logger;
