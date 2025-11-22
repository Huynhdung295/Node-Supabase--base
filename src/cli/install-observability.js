#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const OBSERVABILITY_TOOLS = {
    pino: {
        name: '📊 Pino - Structured Logging',
        description: 'Fast JSON logger with request ID tracking',
        version: '^8.16.0',
        devVersion: '^4.0.0',
        dependencies: ['pino@^8.16.0', 'pino-pretty@^10.2.0'],
        install: () => {
            // Logger config
            fs.writeFileSync('src/config/logger.js', `import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

export const createRequestLogger = (requestId, userId = null) => {
  return logger.child({ requestId, userId });
};

export default logger;
`);

            // Request context middleware
            fs.writeFileSync('src/middleware/requestContext.js', `import { randomUUID } from 'crypto';
import { createRequestLogger } from '../config/logger.js';

export const requestContext = (req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  req.logger = createRequestLogger(req.id, req.user?.id);
  
  req.logger.info({
    msg: 'Incoming request',
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  
  req.startTime = Date.now();
  next();
};
`);

            console.log('✅ Pino logging configured!');
            console.log('📝 Add to server.js: app.use(requestContext);');
        }
    },

    sentry: {
        name: '🐛 Sentry - Error Tracking',
        description: 'Production error monitoring and APM',
        version: '^7.91.0',
        dependencies: ['@sentry/node@^7.91.0', '@sentry/profiling-node@^1.3.0'],
        install: () => {
            fs.writeFileSync('src/config/sentry.js', `import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured');
    return null;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
  });

  return Sentry;
};

export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();
export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = () => Sentry.Handlers.errorHandler();

export default Sentry;
`);

            console.log('✅ Sentry configured!');
            console.log('📝 Add to .env: SENTRY_DSN=your-dsn-here');
            console.log('📝 Add to server.js:');
            console.log('   import { initSentry, sentryRequestHandler, sentryErrorHandler } from "./config/sentry.js";');
            console.log('   const Sentry = initSentry(app);');
            console.log('   app.use(sentryRequestHandler());');
            console.log('   app.use(sentryErrorHandler()); // Before other error handlers');
        }
    },

    prometheus: {
        name: '📈 Prometheus - Metrics',
        description: 'Application metrics and monitoring',
        version: '^15.0.0',
        dependencies: ['prom-client@^15.0.0'],
        install: () => {
            fs.writeFileSync('src/config/prometheus.js', `import client from 'prom-client';

const register = new client.Registry();

// Default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export { register };
`);

            // Metrics middleware
            fs.writeFileSync('src/middleware/metricsMiddleware.js', `import { httpRequestDuration, httpRequestTotal } from '../config/prometheus.js';

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  
  next();
};
`);

            // Metrics route
            fs.writeFileSync('src/routes/metricsRoutes.js', `import express from 'express';
import { register } from '../config/prometheus.js';

const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
`);

            console.log('✅ Prometheus metrics configured!');
            console.log('📝 Add to server.js:');
            console.log('   import { metricsMiddleware } from "./middleware/metricsMiddleware.js";');
            console.log('   import metricsRoutes from "./routes/metricsRoutes.js";');
            console.log('   app.use(metricsMiddleware);');
            console.log('   app.use(metricsRoutes);');
            console.log('📝 Access metrics at: http://localhost:3000/metrics');
        }
    },

    healthCheck: {
        name: '💚 Advanced Health Checks',
        description: 'Liveness and readiness probes',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/middleware/healthCheck.js', `import { supabase } from '../config/supabase.js';

const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
};

const checkDatabase = async () => {
  try {
    const start = Date.now();
    const { error } = await supabase.from('users').select('count').limit(1);
    const duration = Date.now() - start;
    
    if (error) throw error;
    
    return {
      status: HealthStatus.HEALTHY,
      responseTime: duration,
      message: 'Database OK',
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: error.message,
    };
  }
};

const checkMemory = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentage = Math.round((heapUsedMB / heapTotalMB) * 100);
  
  let status = HealthStatus.HEALTHY;
  if (percentage > 90) status = HealthStatus.UNHEALTHY;
  else if (percentage > 75) status = HealthStatus.DEGRADED;
  
  return {
    status,
    heapUsed: \`\${heapUsedMB}MB\`,
    heapTotal: \`\${heapTotalMB}MB\`,
    percentage: \`\${percentage}%\`,
  };
};

export const livenessProbe = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

export const readinessProbe = async (req, res) => {
  try {
    const [database, memory] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
    ]);

    const checks = { database, memory };
    const statuses = Object.values(checks).map(c => c.status);
    
    let overallStatus = HealthStatus.HEALTHY;
    if (statuses.includes(HealthStatus.UNHEALTHY)) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (statuses.includes(HealthStatus.DEGRADED)) {
      overallStatus = HealthStatus.DEGRADED;
    }

    const statusCode = overallStatus === HealthStatus.UNHEALTHY ? 503 : 200;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      error: error.message,
    });
  }
};
`);

            console.log('✅ Health checks configured!');
            console.log('📝 Add to routes:');
            console.log('   import { livenessProbe, readinessProbe } from "./middleware/healthCheck.js";');
            console.log('   app.get("/health/liveness", livenessProbe);');
            console.log('   app.get("/health/readiness", readinessProbe);');
        }
    },
};

async function main() {
    console.log('\n📊 Observability Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select observability tools:',
            choices: Object.entries(OBSERVABILITY_TOOLS).map(([key, tool]) => ({
                name: `${tool.name} - ${tool.description}${tool.version ? ` (v${tool.version})` : ''}`,
                value: key,
                checked: false,
            })),
        },
    ]);

    if (tools.length === 0) {
        console.log('❌ No tools selected');
        return;
    }

    console.log(`\n✅ Installing ${tools.length} tools...\n`);

    // Collect dependencies
    const allDeps = [];
    for (const toolKey of tools) {
        const tool = OBSERVABILITY_TOOLS[toolKey];
        if (tool.dependencies) {
            allDeps.push(...tool.dependencies);
        }
    }

    // Install dependencies
    if (allDeps.length > 0) {
        console.log('📦 Installing dependencies...');
        try {
            execSync(`npm install ${allDeps.join(' ')}`, { stdio: 'inherit' });
            console.log('✅ Dependencies installed\n');
        } catch (error) {
            console.error('❌ Failed to install dependencies');
        }
    }

    // Run installers
    for (const toolKey of tools) {
        const tool = OBSERVABILITY_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} observability tools!\n`);
}

main().catch(console.error);
