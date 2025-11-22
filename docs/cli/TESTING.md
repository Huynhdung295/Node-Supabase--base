# 🧪 Testing CLI Documentation

## Command

```bash
npm run install:testing
```

## Available Tools

### 1. 🏭 Test Factories (v8.3.0)

**What it does:**

- Generate test data with Faker.js
- Factory pattern for consistent data
- Relational data support

**Files created:**

- `tests/factories/userFactory.js` - User factory
- `tests/factories/postFactory.js` - Post factory
- `tests/helpers/dbCleanup.js` - Database cleanup

**Usage:**

```javascript
import { createUser, createUsers, createAdmin } from '../factories/userFactory.js';
import { createPost, createPosts } from '../factories/postFactory.js';

describe('User API', () => {
  test('should create user', async () => {
    const user = createUser({ role: 'admin' });
    expect(user.role).toBe('admin');
  });

  test('should create multiple users', async () => {
    const users = createUsers(10);
    expect(users).toHaveLength(10);
  });

  test('should create post with author', async () => {
    const author = createUser();
    const post = createPost({ author });
    expect(post.author_id).toBe(author.id);
  });
});
```

**Database Cleanup:**

```javascript
import { cleanDatabase } from '../helpers/dbCleanup.js';

beforeEach(async () => {
  await cleanDatabase();
});
```

**Custom Factories:**

```javascript
// tests/factories/productFactory.js
import { faker } from '@faker-js/faker';

export const createProduct = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: parseFloat(faker.commerce.price()),
  stock: faker.number.int({ min: 0, max: 1000 }),
  ...overrides
});
```

---

### 2. 🎭 Playwright E2E (v1.40.0)

**What it does:**

- End-to-end testing
- Browser automation
- API testing
- Multiple browsers support

**Files created:**

- `playwright.config.js` - Playwright configuration
- `tests/e2e/auth.spec.js` - Example E2E test

**Setup:**

```bash
npx playwright install
```

**Usage:**

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:report   # View report
```

**Example Test:**

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('complete registration flow', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('API: create post', async ({ request }) => {
    const response = await request.post('/api/v1/posts', {
      data: {
        title: 'Test Post',
        content: 'Test content'
      },
      headers: {
        Authorization: 'Bearer token'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
  });
});
```

---

### 3. 🤝 Pact Contract Testing (v12.1.0)

**What it does:**

- API contract testing
- Consumer-driven contracts
- Prevent breaking changes

**Files created:**

- `tests/contract/user.contract.test.js` - Example contract test

**Usage:**

```javascript
import { Pact } from '@pact-foundation/pact';

describe('User API Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'API',
    port: 8080
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  describe('GET /users/:id', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request for a user',
        withRequest: {
          method: 'GET',
          path: '/api/v1/users/123'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      });
    });

    it('returns user data', async () => {
      const response = await fetch('http://localhost:8080/api/v1/users/123');
      const data = await response.json();

      expect(data.id).toBe('123');
      expect(data.name).toBe('John Doe');
    });
  });
});
```

**Verify Provider:**

```javascript
// tests/contract/provider.test.js
import { Verifier } from '@pact-foundation/pact';

describe('Pact Verification', () => {
  it('validates the expectations of Frontend', () => {
    return new Verifier({
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['./pacts/frontend-api.json']
    }).verifyProvider();
  });
});
```

---

### 4. 📊 Coverage Reports

**What it does:**

- Enhanced test coverage
- Coverage thresholds
- HTML reports

**Files created:**

- `jest.config.js` - Updated with coverage config

**Usage:**

```bash
npm run test:coverage
open coverage/index.html
```

**Coverage Thresholds:**

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

**Exclude Files:**

```javascript
collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/cli/**', '!src/generators/**'];
```

---

## Testing Pyramid

```
       /\
      /  \     E2E Tests (Few)
     /____\
    /      \   Integration Tests (Some)
   /________\
  /          \ Unit Tests (Many)
 /____________\
```

### Unit Tests (70%)

- Test individual functions
- Mock dependencies
- Fast execution

### Integration Tests (20%)

- Test API endpoints
- Real database
- Test interactions

### E2E Tests (10%)

- Test user flows
- Browser automation
- Slow but comprehensive

---

## Complete Testing Setup

```javascript
// tests/integration/users.test.js
import request from 'supertest';
import app from '../../src/server.js';
import { createUser } from '../factories/userFactory.js';
import { cleanDatabase } from '../helpers/dbCleanup.js';

describe('User API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/users', () => {
    it('should create user', async () => {
      const userData = createUser();

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
    });

    it('should reject duplicate email', async () => {
      const userData = createUser();

      await request(app)
        .post('/api/v1/users')
        .send(userData);
      const response = await request(app)
        .post('/api/v1/users')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });
  });
});
```

---

## Best Practices

1. **Use factories** - Consistent test data
2. **Clean database** - Before each test
3. **Test happy path** - And edge cases
4. **Mock external APIs** - Don't call real services
5. **Keep tests fast** - Unit tests < 1s
6. **Aim for 70%+ coverage** - But don't obsess
7. **Write E2E for critical flows** - Login, checkout, etc.
8. **Use contract testing** - For API consumers

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

**Test everything, ship confidently!** 🧪
