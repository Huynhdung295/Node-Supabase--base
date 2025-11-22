# 💾 Database CLI Documentation

## Command

```bash
npm run install:database
```

## Available Tools

### 1. 💾 Transaction Helpers

**What it does:**

- Database transaction utilities
- Retry with exponential backoff
- Batch operations

**Files created:**

- `src/utils/transaction.js` - Transaction helpers

**Usage:**

**Simple Transaction:**

```javascript
import { withTransaction } from './utils/transaction.js';

const transferMoney = async (fromId, toId, amount) => {
  return await withTransaction(async client => {
    // Deduct from sender
    await client
      .from('accounts')
      .update({ balance: balance - amount })
      .eq('id', fromId);

    // Add to receiver
    await client
      .from('accounts')
      .update({ balance: balance + amount })
      .eq('id', toId);

    // Create transaction record
    await client.from('transactions').insert({ from_id: fromId, to_id: toId, amount });
  });
};
```

**Retry with Backoff:**

```javascript
import { withRetry } from './utils/transaction.js';

const fetchData = async () => {
  return await withRetry(() => supabase.from('users').select('*'), {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2
  });
};
```

**Batch Operations:**

```javascript
import { batchOperation } from './utils/transaction.js';

const users = [/* 1000 users */];

const { results, errors } = await batchOperation(
  users,
  async (user) => {
    return await supabase.from('users').insert(user);
  },
  {
    batchSize: 100,
    concurrency: 5,
  }
);

console.log(\`Inserted \${results.length} users\`);
console.log(\`Failed \${errors.length} users\`);
```

---

### 2. 🌱 Advanced Seeding (v8.3.0)

**What it does:**

- Generate fake data with Faker.js
- Relational data seeding
- Customizable data generation

**Files created:**

- `src/database/seeders.js` - Seeding functions

**Usage:**

```bash
npm run seed:advanced
```

**Custom Seeding:**

```javascript
import { seedUsers, seedPosts, seedAll } from './database/seeders.js';

// Seed specific data
const users = await seedUsers(100);
const posts = await seedPosts(users, 500);

// Or seed everything
await seedAll();
```

**Create Custom Seeders:**

```javascript
// src/database/seeders.js
export const seedProducts = async (count = 100) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    products.push({
      name: faker.commerce.productName(),
      price: faker.commerce.price(),
      description: faker.commerce.productDescription(),
      stock: faker.number.int({ min: 0, max: 1000 })
    });
  }

  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (error) throw error;
  return data;
};
```

---

### 3. 📊 Indexing Guide

**What it does:**

- Database optimization documentation
- Query analysis guide
- Index strategies

**Files created:**

- `docs/DATABASE_OPTIMIZATION.md` - Complete guide

**Find Slow Queries:**

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Analyze Query:**

```sql
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE author_id = '123'
ORDER BY created_at DESC;
```

**Create Indexes:**

```sql
-- Simple index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_posts_author_created
ON posts(author_id, created_at DESC);

-- Partial index
CREATE INDEX idx_active_users
ON users(email)
WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_posts_search
ON posts USING GIN(to_tsvector('english', title || ' ' || content));
```

**Check Index Usage:**

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_tup_read DESC;
```

---

### 4. 🔌 Connection Pooling

**What it does:**

- Optimize database connections
- Configure pool size
- Connection timeout

**Files created:**

- `src/config/database.js` - Pool configuration

**Usage:**

```javascript
import { supabaseWithPool } from './config/database.js';

// Use instead of regular supabase client
const { data } = await supabaseWithPool.from('users').select('*');
```

**Environment Variables:**

```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

**Configuration:**

```javascript
export const poolConfig = {
  min: 2, // Minimum connections
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Timeout after 2s
};
```

---

## Complete Database Setup

```javascript
// server.js
import { supabaseWithPool } from './config/database.js';
import { withTransaction, withRetry } from './utils/transaction.js';

// Use pooled connection
const getUsers = async () => {
  return await withRetry(() => supabaseWithPool.from('users').select('*'));
};

// Use transactions for critical operations
const createOrder = async orderData => {
  return await withTransaction(async client => {
    const order = await client
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    await client.from('inventory').update({ stock: stock - 1 });
    return order;
  });
};
```

---

## Performance Tips

### 1. Avoid N+1 Queries

❌ Bad:

```javascript
const posts = await supabase.from('posts').select('*');
for (const post of posts.data) {
  const author = await supabase
    .from('users')
    .select('*')
    .eq('id', post.author_id);
}
```

✅ Good:

```javascript
const { data } = await supabase
  .from('posts')
  .select(\`
    *,
    author:users(id, name, email)
  \`);
```

### 2. Use Pagination

```javascript
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(0, 19); // First 20 items
```

### 3. Select Only Needed Fields

```javascript
const { data } = await supabase.from('users').select('id, name, email'); // Not *
```

### 4. Use Indexes

```sql
-- Index foreign keys
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Index WHERE clause columns
CREATE INDEX idx_users_email ON users(email);

-- Index ORDER BY columns
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

---

## Monitoring

### Table Statistics

```sql
SELECT
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables;
```

### Connection Pool Status

```sql
SELECT
  count(*) as total_connections,
  sum(case when state = 'active' then 1 else 0 end) as active,
  sum(case when state = 'idle' then 1 else 0 end) as idle
FROM pg_stat_activity;
```

---

## Best Practices

1. ✅ Use transactions for multi-step operations
2. ✅ Add retry logic for transient failures
3. ✅ Use batch operations for bulk inserts
4. ✅ Index foreign keys and WHERE columns
5. ✅ Monitor slow queries
6. ✅ Use connection pooling
7. ✅ Seed with realistic data
8. ❌ Don't over-index (slows writes)
9. ❌ Don't use SELECT \* in production

---

**Optimize your database!** 💾
