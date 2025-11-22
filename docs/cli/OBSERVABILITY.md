# 📊 Observability CLI Documentation

## Command

```bash
npm run install:observability
```

## Available Tools

### 1. 📊 Pino - Structured Logging (v8.16.0)

**What it does:**

- Fast JSON logging
- Request ID tracking
- Log levels (debug, info, warn, error, fatal)
- Pretty printing for development

**Files created:**

- `src/config/logger.js` - Logger configuration
- `src/middleware/requestContext.js` - Request ID middleware

**Usage:**

```javascript
import logger from './config/logger.js';
import { requestContext } from './middleware/requestContext.js';

// Add to server.js
app.use(requestContext);

// Use in code
req.logger.info('User created', { userId: user.id });
req.logger.error('Database error', { error: err.message });
```

**Environment Variables:**

```bash
LOG_LEVEL=info  # debug, info, warn, error, fatal
```

---

### 2. 🐛 Sentry - Error Tracking (v7.91.0)

**What it does:**

- Production error monitoring
- Performance profiling
- Release tracking
- User context

**Files created:**

- `src/config/sentry.js` - Sentry configuration

**Usage:**

```javascript
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './config/sentry.js';

const Sentry = initSentry(app);

app.use(sentryRequestHandler());
// ... your routes ...
app.use(sentryErrorHandler());
```

**Environment Variables:**

```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Setup:**

1. Create account at https://sentry.io
2. Create new project
3. Copy DSN to .env
4. Deploy and see errors in dashboard

---

### 3. 📈 Prometheus - Metrics (v15.0.0)

**What it does:**

- Application metrics
- HTTP request duration
- Request count
- Custom metrics

**Files created:**

- `src/config/prometheus.js` - Metrics configuration
- `src/middleware/metricsMiddleware.js` - Metrics collection
- `src/routes/metricsRoutes.js` - Metrics endpoint

**Usage:**

```javascript
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import metricsRoutes from './routes/metricsRoutes.js';

app.use(metricsMiddleware);
app.use(metricsRoutes);
```

**Access metrics:**

```bash
curl http://localhost:3000/metrics
```

**Grafana Dashboard:**

```yaml
# docker-compose.monitoring.yml
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - 3001:3000
```

---

### 4. 💚 Advanced Health Checks

**What it does:**

- Liveness probe (is app running?)
- Readiness probe (is app ready?)
- Database health check
- Memory monitoring

**Files created:**

- `src/middleware/healthCheck.js` - Health check logic

**Usage:**

```javascript
import { livenessProbe, readinessProbe } from './middleware/healthCheck.js';

app.get('/health/liveness', livenessProbe);
app.get('/health/readiness', readinessProbe);
```

**Kubernetes Integration:**

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Complete Integration Example

```javascript
// server.js
import express from 'express';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './config/sentry.js';
import { requestContext } from './middleware/requestContext.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { livenessProbe, readinessProbe } from './middleware/healthCheck.js';
import metricsRoutes from './routes/metricsRoutes.js';

const app = express();

// Initialize Sentry
const Sentry = initSentry(app);

// Middleware
app.use(sentryRequestHandler());
app.use(requestContext);
app.use(metricsMiddleware);

// Health checks
app.get('/health/liveness', livenessProbe);
app.get('/health/readiness', readinessProbe);

// Metrics
app.use(metricsRoutes);

// Your routes
app.use('/api/v1', routes);

// Error handler (must be last)
app.use(sentryErrorHandler());

const server = app.listen(3000);
```

---

## Monitoring Stack Setup

### 1. ELK Stack (Logs)

```bash
docker-compose -f docker-compose.elk.yml up -d
```

### 2. Prometheus + Grafana (Metrics)

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Sentry (Errors)

- Sign up at sentry.io
- Add DSN to .env

---

## Best Practices

1. **Always use request logger** - `req.logger.info()`
2. **Log structured data** - JSON format
3. **Set appropriate log levels** - debug in dev, info in prod
4. **Monitor error rates** - Set up alerts
5. **Track key metrics** - Response time, throughput
6. **Use health checks** - For load balancers

---

## Troubleshooting

### Logs not appearing

- Check LOG_LEVEL environment variable
- Verify requestContext middleware is added

### Sentry not tracking errors

- Verify SENTRY_DSN is set
- Check sentryErrorHandler is last middleware

### Metrics endpoint 404

- Verify metricsRoutes is added
- Check /metrics endpoint

---

**Monitor everything, know everything!** 📊
