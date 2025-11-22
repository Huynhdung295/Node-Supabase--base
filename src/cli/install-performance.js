#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const PERFORMANCE_TOOLS = {
    redis: {
        name: '⚡ Redis Caching',
        description: 'Fast in-memory caching',
        version: '^5.3.0',
        dependencies: ['ioredis@^5.3.0'],
        install: () => {
            fs.writeFileSync('src/config/redis.js', `import Redis from 'ioredis';

let redisClient = null;

export const initRedis = () => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn('⚠️  Redis not configured');
    return null;
  }

  const config = process.env.REDIS_URL ? process.env.REDIS_URL : {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  };

  redisClient = new Redis(config, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));

  return redisClient;
};

export const getRedisClient = () => redisClient;

export const cache = {
  async get(key) {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return false;
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  async del(key) {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  async flush() {
    if (!redisClient) return false;
    try {
      await redisClient.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  },
};

export default { initRedis, getRedisClient, cache };
`);

            fs.writeFileSync('src/middleware/cacheMiddleware.js', `import { cache } from '../config/redis.js';

export const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = \`cache:\${req.originalUrl}\`;
    const cached = await cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
};

export default cacheMiddleware;
`);

            console.log('✅ Redis caching configured!');
            console.log('📝 Add to .env: REDIS_URL=redis://localhost:6379');
            console.log('📝 Usage: app.use(cacheMiddleware(300));');
        }
    },

    bullQueue: {
        name: '🐂 Bull Queue',
        description: 'Background job processing',
        version: '^4.12.0',
        dependencies: ['bull@^4.12.0'],
        install: () => {
            fs.writeFileSync('src/config/queue.js', `import Bull from 'bull';

const queues = {};

export const createQueue = (name, options = {}) => {
  if (queues[name]) return queues[name];

  const redisConfig = process.env.REDIS_URL ? {
    redis: process.env.REDIS_URL,
  } : {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  };

  const queue = new Bull(name, {
    ...redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
    ...options,
  });

  queue.on('error', (error) => {
    console.error(\`Queue \${name} error:\`, error.message);
  });

  queue.on('failed', (job, err) => {
    console.error(\`Job \${job.id} failed:\`, err.message);
  });

  queue.on('completed', (job) => {
    console.log(\`Job \${job.id} completed in \${job.finishedOn - job.processedOn}ms\`);
  });

  queues[name] = queue;
  return queue;
};

export const getQueue = (name) => queues[name];

export const closeAllQueues = async () => {
  await Promise.all(Object.values(queues).map(q => q.close()));
  console.log('All queues closed');
};

// Pre-defined queues
export const emailQueue = createQueue('email');
export const notificationQueue = createQueue('notification');
export const reportQueue = createQueue('report');

export default { createQueue, getQueue, closeAllQueues };
`);

            if (!fs.existsSync('src/workers')) {
                fs.mkdirSync('src/workers', { recursive: true });
            }

            fs.writeFileSync('src/workers/emailWorker.js', `import { emailQueue } from '../config/queue.js';

emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  
  console.log(\`Sending email to \${to}\`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(\`Email sent to \${to}\`);
  return { success: true, to };
});

console.log('Email worker started');
`);

            console.log('✅ Bull Queue configured!');
            console.log('📝 Usage:');
            console.log('   import { emailQueue } from "./config/queue.js";');
            console.log('   await emailQueue.add({ to: "user@example.com", subject: "Hello" });');
            console.log('📝 Start worker: node src/workers/emailWorker.js');
        }
    },

    compression: {
        name: '🗜️ Response Compression',
        description: 'Gzip/Brotli compression',
        version: '^1.7.0',
        dependencies: ['compression@^1.7.0'],
        install: () => {
            fs.writeFileSync('src/middleware/compression.js', `import compression from 'compression';

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
});

export default compressionMiddleware;
`);

            console.log('✅ Compression configured!');
            console.log('📝 Add to server.js: app.use(compressionMiddleware);');
        }
    },

    rateLimit: {
        name: '🚦 Advanced Rate Limiting',
        description: 'Per-user rate limiting with Redis',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/middleware/advancedRateLimit.js', `import { getRedisClient } from '../config/redis.js';

export const advancedRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    keyGenerator = (req) => req.user?.id || req.ip,
  } = options;

  return async (req, res, next) => {
    const redis = getRedisClient();
    if (!redis) return next();

    const key = \`ratelimit:\${keyGenerator(req)}\`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      const ttl = await redis.ttl(key);
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: ttl,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error.message);
      next();
    }
  };
};

export default advancedRateLimit;
`);

            console.log('✅ Advanced rate limiting configured!');
            console.log('📝 Usage: app.use(advancedRateLimit({ maxRequests: 100 }));');
        }
    },
};

async function main() {
    console.log('\n⚡ Performance Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select performance tools:',
            choices: Object.entries(PERFORMANCE_TOOLS).map(([key, tool]) => ({
                name: `${tool.name} - ${tool.description}${tool.version ? ` (v${tool.version})` : ''}`,
                value: key,
            })),
        },
    ]);

    if (tools.length === 0) {
        console.log('❌ No tools selected');
        return;
    }

    console.log(`\n✅ Installing ${tools.length} tools...\n`);

    const allDeps = [];
    for (const toolKey of tools) {
        const tool = PERFORMANCE_TOOLS[toolKey];
        if (tool.dependencies) {
            allDeps.push(...tool.dependencies);
        }
    }

    if (allDeps.length > 0) {
        console.log('📦 Installing dependencies...');
        try {
            execSync(`npm install ${allDeps.join(' ')}`, { stdio: 'inherit' });
            console.log('✅ Dependencies installed\n');
        } catch (error) {
            console.error('❌ Failed to install dependencies');
        }
    }

    for (const toolKey of tools) {
        const tool = PERFORMANCE_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} performance tools!\n`);
}

main().catch(console.error);
