# 🔐 Security CLI Documentation

## Command

```bash
npm run install:security
```

## Available Tools

### 1. 🔐 CASL - Authorization (v6.5.0)

**What it does:**

- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Field-level permissions
- 5 built-in roles

**Files created:**

- `src/config/casl.js` - Permission definitions
- `src/middleware/authorization.js` - Authorization middleware

**Built-in Roles:**

- **admin** - Can do everything
- **editor** - Can manage posts and comments
- **moderator** - Can manage comments only
- **viewer** - Read-only access
- **user** - Can manage own content

**Usage:**

```javascript
import { authorize } from './middleware/authorization.js';
import { ACTIONS, SUBJECTS } from './config/casl.js';

// Protect routes
router.post('/posts', authenticate, authorize(ACTIONS.CREATE, SUBJECTS.POST), createPost);

router.delete('/posts/:id', authenticate, authorize(ACTIONS.DELETE, SUBJECTS.POST), deletePost);

// Check permissions in code
import { can } from './middleware/authorization.js';

if (can(req, ACTIONS.UPDATE, SUBJECTS.POST)) {
  // User can update post
}
```

**Custom Permissions:**

```javascript
// Add to src/config/casl.js
export const SUBJECTS = {
  USER: 'User',
  POST: 'Post',
  COMMENT: 'Comment',
  INVOICE: 'Invoice',  // Add new subject
  ALL: 'all',
};

// Define permissions
case ROLES.ACCOUNTANT:
  can(ACTIONS.MANAGE, SUBJECTS.INVOICE);
  can(ACTIONS.READ, SUBJECTS.USER);
  break;
```

---

### 2. 🎯 Idempotency Middleware

**What it does:**

- Prevents duplicate requests
- Caches responses
- Configurable TTL

**Files created:**

- `src/middleware/idempotency.js` - Idempotency logic

**Usage:**

```javascript
import { idempotency } from './middleware/idempotency.js';

// Apply globally
app.use(idempotency({ ttl: 86400000 })); // 24 hours

// Or per route
router.post(
  '/payments',
  authenticate,
  idempotency({ ttl: 3600000 }), // 1 hour
  createPayment
);
```

**Client Usage:**

```javascript
// Client must send Idempotency-Key header
fetch('/api/v1/payments', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
    'Idempotency-Key': 'unique-key-123'
  },
  body: JSON.stringify({ amount: 100 })
});

// If request fails and retried, same response returned
```

**When to use:**

- Payment processing
- Order creation
- Email sending
- Any critical operation

---

### 3. 🔄 Circuit Breaker

**What it does:**

- Prevents cascading failures
- Automatic failure detection
- Graceful degradation

**Files created:**

- `src/middleware/circuitBreaker.js` - Circuit breaker implementation

**Usage:**

```javascript
import { externalApiCircuitBreaker } from './middleware/circuitBreaker.js';

// Wrap external API calls
const fetchUserData = async (userId) => {
  return await externalApiCircuitBreaker.execute(
    () => fetch(\`https://api.example.com/users/\${userId}\`),
    () => ({ id: userId, name: 'Fallback User' }) // Fallback
  );
};

// Check circuit state
const state = externalApiCircuitBreaker.getState();
console.log(state); // { state: 'CLOSED', failures: 0 }
```

**States:**

- **CLOSED** - Normal operation
- **OPEN** - Too many failures, reject requests
- **HALF_OPEN** - Testing if service recovered

**Configuration:**

```javascript
import CircuitBreaker from './middleware/circuitBreaker.js';

const myCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  resetTimeout: 60000 // Try again after 60s
});
```

---

### 4. 👋 Graceful Shutdown

**What it does:**

- Zero-downtime deployments
- Complete in-flight requests
- Close connections safely
- Kubernetes-ready

**Files created:**

- `src/utils/gracefulShutdown.js` - Shutdown logic

**Usage:**

```javascript
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

const server = app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

setupGracefulShutdown(server);
```

**What happens on shutdown:**

1. Stop accepting new connections
2. Wait for in-flight requests (max 30s)
3. Close database connections
4. Close Redis connections
5. Exit process

**Kubernetes Integration:**

```yaml
lifecycle:
  preStop:
    exec:
      command: ['/bin/sh', '-c', 'sleep 5']
terminationGracePeriodSeconds: 30
```

---

## Complete Security Setup

```javascript
// server.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';
import { authorize } from './middleware/authorization.js';
import { ACTIONS, SUBJECTS } from './config/casl.js';
import { idempotency } from './middleware/idempotency.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

const app = express();

// Security headers
app.use(helmet());
app.use(cors());

// Idempotency for critical routes
app.use('/api/v1/payments', idempotency());
app.use('/api/v1/orders', idempotency());

// Protected routes with CASL
router.post('/posts', authenticate, authorize(ACTIONS.CREATE, SUBJECTS.POST), createPost);

router.delete('/posts/:id', authenticate, authorize(ACTIONS.DELETE, SUBJECTS.POST), deletePost);

const server = app.listen(3000);
setupGracefulShutdown(server);
```

---

## Security Checklist

- [ ] CASL authorization implemented
- [ ] Idempotency for critical operations
- [ ] Circuit breaker for external APIs
- [ ] Graceful shutdown configured
- [ ] Helmet security headers
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation (Joi)
- [ ] JWT authentication
- [ ] HTTPS in production

---

## Best Practices

1. **Use CASL for all permissions** - Don't hardcode roles
2. **Add idempotency to payments** - Prevent double charges
3. **Wrap external APIs in circuit breaker** - Prevent cascading failures
4. **Always use graceful shutdown** - Zero-downtime deploys
5. **Test permissions thoroughly** - Unit test CASL rules

---

## Troubleshooting

### Permission denied errors

- Check user role in database
- Verify CASL rules in `src/config/casl.js`
- Test with `can(req, action, subject)`

### Idempotency not working

- Verify client sends `Idempotency-Key` header
- Check TTL configuration
- Ensure middleware is before route handler

### Circuit breaker always open

- Check failure threshold
- Verify external service is up
- Increase reset timeout

---

**Security first, always!** 🔐
