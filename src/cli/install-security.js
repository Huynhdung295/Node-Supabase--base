#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const SECURITY_TOOLS = {
    casl: {
        name: '🔐 CASL - Authorization',
        description: 'RBAC/ABAC permission system',
        version: '^6.5.0',
        dependencies: ['@casl/ability@^6.5.0'],
        install: () => {
            fs.writeFileSync('src/config/casl.js', `import { AbilityBuilder, createMongoAbility } from '@casl/ability';

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  MODERATOR: 'moderator',
  VIEWER: 'viewer',
  USER: 'user',
};

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
};

export const SUBJECTS = {
  USER: 'User',
  POST: 'Post',
  COMMENT: 'Comment',
  ALL: 'all',
};

export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user) {
    can(ACTIONS.READ, SUBJECTS.POST, { isPublic: true });
    return build();
  }

  can(ACTIONS.READ, SUBJECTS.POST);
  can(ACTIONS.UPDATE, SUBJECTS.USER, { id: user.id });

  switch (user.role) {
    case ROLES.ADMIN:
      can(ACTIONS.MANAGE, SUBJECTS.ALL);
      break;
    case ROLES.EDITOR:
      can(ACTIONS.MANAGE, SUBJECTS.POST);
      can(ACTIONS.MANAGE, SUBJECTS.COMMENT);
      break;
    case ROLES.MODERATOR:
      can(ACTIONS.MANAGE, SUBJECTS.COMMENT);
      can(ACTIONS.READ, SUBJECTS.POST);
      break;
    case ROLES.VIEWER:
      can(ACTIONS.READ, SUBJECTS.POST);
      can(ACTIONS.READ, SUBJECTS.COMMENT);
      break;
    case ROLES.USER:
    default:
      can(ACTIONS.CREATE, SUBJECTS.POST);
      can(ACTIONS.UPDATE, SUBJECTS.POST, { authorId: user.id });
      can(ACTIONS.DELETE, SUBJECTS.POST, { authorId: user.id });
      break;
  }

  return build();
};

export default defineAbilitiesFor;
`);

            fs.writeFileSync('src/middleware/authorization.js', `import { ForbiddenError } from '@casl/ability';
import defineAbilitiesFor from '../config/casl.js';

export const authorize = (action, subject) => {
  return (req, res, next) => {
    try {
      const ability = defineAbilitiesFor(req.user);
      ForbiddenError.from(ability).throwUnlessCan(action, subject);
      req.ability = ability;
      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
        });
      }
      next(error);
    }
  };
};

export const can = (req, action, subject) => {
  const ability = defineAbilitiesFor(req.user);
  return ability.can(action, subject);
};
`);

            console.log('✅ CASL authorization configured!');
            console.log('📝 Usage: authorize(ACTIONS.CREATE, SUBJECTS.POST)');
        }
    },

    idempotency: {
        name: '🎯 Idempotency Middleware',
        description: 'Prevent duplicate requests',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/middleware/idempotency.js', `const requestCache = new Map();

export const idempotency = (options = {}) => {
  const { ttl = 86400000, methods = ['POST', 'PUT', 'PATCH'] } = options;

  return async (req, res, next) => {
    if (!methods.includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Idempotency-Key header is required',
      });
    }

    const cacheKey = \`\${req.method}:\${req.path}:\${idempotencyKey}\`;
    const cached = requestCache.get(cacheKey);

    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }

    const originalSend = res.send;
    res.send = function(data) {
      const response = {
        statusCode: res.statusCode,
        body: typeof data === 'string' ? JSON.parse(data) : data,
        timestamp: new Date().toISOString(),
      };
      
      requestCache.set(cacheKey, response);
      setTimeout(() => requestCache.delete(cacheKey), ttl);
      
      return originalSend.call(this, data);
    };

    next();
  };
};

export default idempotency;
`);

            console.log('✅ Idempotency middleware configured!');
            console.log('📝 Usage: app.use(idempotency({ ttl: 86400000 }));');
            console.log('📝 Client must send: Idempotency-Key header');
        }
    },

    circuitBreaker: {
        name: '🔄 Circuit Breaker',
        description: 'Resilience pattern for external services',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/middleware/circuitBreaker.js', `class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = Date.now();
    this.successCount = 0;
  }

  async execute(fn, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        return fallback ? fallback() : Promise.reject(new Error('Circuit breaker is OPEN'));
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    };
  }
}

export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
});

export const externalApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60000,
});

export default CircuitBreaker;
`);

            console.log('✅ Circuit breaker configured!');
            console.log('📝 Usage: await circuitBreaker.execute(() => apiCall(), fallback);');
        }
    },

    gracefulShutdown: {
        name: '👋 Graceful Shutdown',
        description: 'Zero-downtime deployments',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/utils/gracefulShutdown.js', `let isShuttingDown = false;
let server = null;

export const setServer = (serverInstance) => {
  server = serverInstance;
};

export const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(\`\${signal} received, starting graceful shutdown\`);

  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  try {
    await Promise.race([
      closeConnections(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Shutdown timeout')), 30000)
      ),
    ]);

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
};

const closeConnections = async () => {
  // Close database connections, Redis, etc.
  await new Promise(resolve => setTimeout(resolve, 5000));
};

export const setupGracefulShutdown = (serverInstance) => {
  setServer(serverInstance);
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

export default { setupGracefulShutdown, gracefulShutdown };
`);

            console.log('✅ Graceful shutdown configured!');
            console.log('📝 Add to server.js:');
            console.log('   import { setupGracefulShutdown } from "./utils/gracefulShutdown.js";');
            console.log('   const server = app.listen(PORT);');
            console.log('   setupGracefulShutdown(server);');
        }
    },
};

async function main() {
    console.log('\n🔐 Security Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select security tools:',
            choices: Object.entries(SECURITY_TOOLS).map(([key, tool]) => ({
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
        const tool = SECURITY_TOOLS[toolKey];
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
        const tool = SECURITY_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} security tools!\n`);
}

main().catch(console.error);
