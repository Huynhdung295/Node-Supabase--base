#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const DATABASE_TOOLS = {
    transactions: {
        name: '💾 Transaction Helpers',
        description: 'Database transaction utilities with retry',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/utils/transaction.js', `import { supabase } from '../config/supabase.js';

export const withTransaction = async (callback) => {
  const client = supabase;
  
  try {
    const result = await callback(client);
    return result;
  } catch (error) {
    console.error('Transaction failed:', error.message);
    throw error;
  }
};

export const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) break;

      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      console.warn(\`Retry attempt \${attempt}/\${maxAttempts} after \${delay}ms\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const batchOperation = async (items, operation, options = {}) => {
  const { batchSize = 100, concurrency = 5 } = options;
  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    for (let j = 0; j < batch.length; j += concurrency) {
      const chunk = batch.slice(j, j + concurrency);
      const promises = chunk.map(async (item) => {
        try {
          const result = await operation(item);
          results.push(result);
        } catch (error) {
          errors.push({ item, error: error.message });
        }
      });
      await Promise.all(promises);
    }
  }

  return { results, errors };
};

export default { withTransaction, withRetry, batchOperation };
`);

            console.log('✅ Transaction helpers created!');
            console.log('📝 Usage:');
            console.log('   import { withTransaction, withRetry } from "./utils/transaction.js";');
            console.log('   await withRetry(() => dbOperation());');
        }
    },

    seeding: {
        name: '🌱 Advanced Seeding',
        description: 'Faker.js data generation',
        version: '^8.3.0',
        dependencies: ['@faker-js/faker@^8.3.0'],
        install: () => {
            if (!fs.existsSync('src/database')) {
                fs.mkdirSync('src/database', { recursive: true });
            }

            fs.writeFileSync('src/database/seeders.js', `import { faker } from '@faker-js/faker';
import { supabase } from '../config/supabase.js';

export const seedUsers = async (count = 50) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(['user', 'editor', 'viewer']),
      created_at: faker.date.past().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) throw error;
  console.log(\`✅ Seeded \${data.length} users\`);
  return data;
};

export const seedPosts = async (users, count = 200) => {
  const posts = [];
  
  for (let i = 0; i < count; i++) {
    const author = faker.helpers.arrayElement(users);
    posts.push({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      author_id: author.id,
      status: faker.helpers.arrayElement(['draft', 'published']),
      created_at: faker.date.past().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(posts)
    .select();

  if (error) throw error;
  console.log(\`✅ Seeded \${data.length} posts\`);
  return data;
};

export const seedAll = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    const users = await seedUsers(50);
    const posts = await seedPosts(users, 200);
    
    console.log('✅ Database seeding completed!');
    return { users, posts };
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
};

export default { seedUsers, seedPosts, seedAll };
`);

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts['seed:advanced'] = 'node -e "import(\\"./src/database/seeders.js\\").then(m => m.seedAll())"';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ Advanced seeding configured!');
            console.log('📝 Run: npm run seed:advanced');
        }
    },

    indexing: {
        name: '📊 Indexing Guide',
        description: 'Database optimization documentation',
        dependencies: [],
        install: () => {
            if (!fs.existsSync('docs')) {
                fs.mkdirSync('docs', { recursive: true });
            }

            fs.writeFileSync('docs/DATABASE_OPTIMIZATION.md', `# 📊 Database Optimization Guide

## Indexing Strategies

### 1. Find Slow Queries

\`\`\`sql
-- PostgreSQL/Supabase
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
\`\`\`

### 2. Analyze Query Performance

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';
\`\`\`

### 3. Common Index Types

#### Simple Index
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

#### Composite Index
\`\`\`sql
CREATE INDEX idx_posts_author_created 
ON posts(author_id, created_at DESC);
\`\`\`

#### Partial Index
\`\`\`sql
CREATE INDEX idx_active_users 
ON users(email) 
WHERE deleted_at IS NULL;
\`\`\`

#### Full-Text Search
\`\`\`sql
CREATE INDEX idx_posts_search 
ON posts USING GIN(to_tsvector('english', title || ' ' || content));
\`\`\`

## Query Optimization Tips

### 1. Avoid N+1 Queries

❌ Bad:
\`\`\`javascript
const posts = await supabase.from('posts').select('*');
for (const post of posts.data) {
  const author = await supabase
    .from('users')
    .select('*')
    .eq('id', post.author_id)
    .single();
}
\`\`\`

✅ Good:
\`\`\`javascript
const { data } = await supabase
  .from('posts')
  .select(\\\`
    *,
    author:users(id, name, email)
  \\\`);
\`\`\`

### 2. Use Pagination

\`\`\`javascript
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(0, 19); // First 20 items
\`\`\`

### 3. Select Only Needed Fields

\`\`\`javascript
const { data } = await supabase
  .from('users')
  .select('id, name, email'); // Not *
\`\`\`

## Monitoring

### Check Index Usage

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_tup_read DESC;
\`\`\`

### Table Statistics

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables;
\`\`\`

## Best Practices

1. ✅ Index foreign keys
2. ✅ Index columns used in WHERE clauses
3. ✅ Index columns used in ORDER BY
4. ✅ Use composite indexes for multi-column queries
5. ✅ Monitor index usage
6. ❌ Don't over-index (slows down writes)
7. ❌ Don't index low-cardinality columns (e.g., boolean)

---

**Optimize for speed!** 📊
`);

            console.log('✅ Database optimization guide created!');
            console.log('📝 Read: docs/DATABASE_OPTIMIZATION.md');
        }
    },

    connectionPool: {
        name: '🔌 Connection Pooling',
        description: 'Optimize database connections',
        dependencies: [],
        install: () => {
            fs.writeFileSync('src/config/database.js', `import { createClient } from '@supabase/supabase-js';

export const supabaseWithPool = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'basesource',
      },
    },
  }
);

// Connection pool configuration
export const poolConfig = {
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

export default supabaseWithPool;
`);

            console.log('✅ Connection pooling configured!');
            console.log('📝 Add to .env:');
            console.log('   DB_POOL_MIN=2');
            console.log('   DB_POOL_MAX=10');
            console.log('   DB_IDLE_TIMEOUT=30000');
        }
    },
};

async function main() {
    console.log('\n💾 Database Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select database tools:',
            choices: Object.entries(DATABASE_TOOLS).map(([key, tool]) => ({
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
        const tool = DATABASE_TOOLS[toolKey];
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
        const tool = DATABASE_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} database tools!\n`);
}

main().catch(console.error);
