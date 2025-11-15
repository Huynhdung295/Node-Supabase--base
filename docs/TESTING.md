# 🧪 Testing Guide

## 🚀 Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Unit only
npm run test:unit

# Integration only
npm run test:integration
```

## 📝 Write Tests

### Unit Test

```javascript
// tests/unit/myFunction.test.js
import { myFunction } from '../../src/utils/myFunction.js';

describe('myFunction', () => {
  test('should work', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

### Integration Test

```javascript
// tests/integration/myEndpoint.test.js
import request from 'supertest';
import app from '../../src/server.js';

describe('My Endpoint', () => {
  test('should return data', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## 📊 Coverage

```bash
npm run test:coverage
open coverage/index.html
```

**Goal**: 80%+ coverage

## ✅ What to Test

- ✅ Happy path
- ✅ Error cases
- ✅ Edge cases
- ✅ Authentication
- ✅ Authorization
- ✅ Validation

## 🎯 Best Practices

1. **One test = one thing**
2. **Clear test names**
3. **Arrange-Act-Assert**
4. **Mock external deps**
5. **Fast tests (<10s)**

---

**Test everything!** 🧪
