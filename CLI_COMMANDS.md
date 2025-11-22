# 🎯 CLI Commands Reference

## Available CLIs

### 1. ⚙️ Configuration Installer

```bash
npm run install:config
```

**Installs:**

- 🐶 Husky - Git Hooks (v8.0.0)
- 🧪 k6 - Load Testing (no deps)
- 🔷 TypeScript (v5.3.0)
- ☸️ Kubernetes (no deps)
- 🏗️ Terraform (no deps)
- 🔄 CI/CD (no deps)
- ⚙️ Makefile (no deps)
- 📏 ESLint (v8.55.0)
- 💅 Prettier (v3.1.0)

### 2. 📊 Observability Installer

```bash
npm run install:observability
```

**Installs:**

- 📊 Pino - Structured Logging (v8.16.0)
- 🐛 Sentry - Error Tracking (v7.91.0)
- 📈 Prometheus - Metrics (v15.0.0)
- 💚 Advanced Health Checks (no deps)

### 3. 🔐 Security Installer

```bash
npm run install:security
```

**Installs:**

- 🔐 CASL - Authorization (v6.5.0)
- 🎯 Idempotency Middleware (no deps)
- 🔄 Circuit Breaker (no deps)
- 👋 Graceful Shutdown (no deps)

---

## Quick Start Examples

### Setup Observability Stack

```bash
npm run install:observability
# Select: Pino, Sentry, Prometheus, Health Checks
```

**Result:**

- `src/config/logger.js` - Pino logger
- `src/config/sentry.js` - Sentry config
- `src/config/prometheus.js` - Metrics
- `src/middleware/requestContext.js` - Request ID tracking
- `src/middleware/metricsMiddleware.js` - Metrics collection
- `src/middleware/healthCheck.js` - Health probes

### Setup Security Stack

```bash
npm run install:security
# Select: CASL, Idempotency, Circuit Breaker, Graceful Shutdown
```

**Result:**

- `src/config/casl.js` - RBAC/ABAC config
- `src/middleware/authorization.js` - Permission checks
- `src/middleware/idempotency.js` - Duplicate prevention
- `src/middleware/circuitBreaker.js` - Resilience pattern
- `src/utils/gracefulShutdown.js` - Zero-downtime shutdown

### Setup Dev Tools

```bash
npm run install:config
# Select: Husky, ESLint, Prettier, TypeScript
```

**Result:**

- `.husky/pre-commit` - Pre-commit hook
- `.husky/commit-msg` - Commit message validation
- `.eslintrc.json` - Linting rules
- `.prettierrc` - Formatting rules
- `tsconfig.json` - TypeScript config

---

## Dependencies with Versions

### Observability

- `pino@^8.16.0` - Fast JSON logger
- `pino-pretty@^10.2.0` - Pretty printing
- `@sentry/node@^7.91.0` - Error tracking
- `@sentry/profiling-node@^1.3.0` - Performance profiling
- `prom-client@^15.0.0` - Prometheus metrics

### Security

- `@casl/ability@^6.5.0` - Authorization

### Configuration

- `husky@^8.0.0` - Git hooks
- `lint-staged@^15.2.0` - Staged files linting
- `@commitlint/cli@^18.4.0` - Commit linting
- `@commitlint/config-conventional@^18.4.0` - Commit rules
- `typescript@^5.3.0` - TypeScript compiler
- `@types/node@^20.10.0` - Node types
- `@types/express@^4.17.0` - Express types
- `ts-node@^10.9.0` - TS execution
- `eslint@^8.55.0` - Code linting
- `prettier@^3.1.0` - Code formatting

---

## Integration Guide

### After Installing Observability

**1. Update server.js:**

```javascript
import { requestContext } from './middleware/requestContext.js';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './config/sentry.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import metricsRoutes from './routes/metricsRoutes.js';

const Sentry = initSentry(app);

app.use(sentryRequestHandler());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(metricsRoutes);

// ... your routes ...

app.use(sentryErrorHandler());
```

**2. Update .env:**

```bash
SENTRY_DSN=your-sentry-dsn
SENTRY_TRACES_SAMPLE_RATE=0.1
LOG_LEVEL=info
```

### After Installing Security

**1. Use CASL in routes:**

```javascript
import { authorize } from './middleware/authorization.js';
import { ACTIONS, SUBJECTS } from './config/casl.js';

router.post('/posts', authenticate, authorize(ACTIONS.CREATE, SUBJECTS.POST), createPost);
```

**2. Use Idempotency:**

```javascript
import { idempotency } from './middleware/idempotency.js';

app.use(idempotency({ ttl: 86400000 }));
```

**3. Setup Graceful Shutdown:**

```javascript
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

const server = app.listen(PORT);
setupGracefulShutdown(server);
```

---

## Benefits

### Time Saved

- **Observability Setup**: 2-3 days → 2 minutes
- **Security Setup**: 1-2 weeks → 2 minutes
- **Dev Tools Setup**: 1-2 days → 1 minute

### Cost Saved

- **Observability**: \$2k-3k
- **Security (CASL)**: \$10k-20k
- **Total**: \$12k-23k+

---

## Tips

1. **Start with Observability** - Essential for production
2. **Add Security next** - Protect your app
3. **Dev Tools last** - Improve DX

4. **Read generated files** - Understand what was created
5. **Customize as needed** - Files are yours to modify
6. **Check package.json** - New scripts added

---

**All CLIs auto-generate code, no templates needed!** 🎯
