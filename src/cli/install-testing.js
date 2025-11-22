#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const TESTING_TOOLS = {
    factories: {
        name: '🏭 Test Factories',
        description: 'Factory pattern for test data',
        version: '^8.3.0',
        dependencies: ['@faker-js/faker@^8.3.0'],
        install: () => {
            if (!fs.existsSync('tests/factories')) {
                fs.mkdirSync('tests/factories', { recursive: true });
            }

            fs.writeFileSync('tests/factories/userFactory.js', `import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createUsers = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, () => createUser(overrides));
};

export const createAdmin = (overrides = {}) => {
  return createUser({ role: 'admin', ...overrides });
};

export default { createUser, createUsers, createAdmin };
`);

            fs.writeFileSync('tests/factories/postFactory.js', `import { faker } from '@faker-js/faker';
import { createUser } from './userFactory.js';

export const createPost = (overrides = {}) => {
  const author = overrides.author || createUser();
  
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    author_id: author.id,
    status: 'published',
    created_at: new Date().toISOString(),
    ...overrides,
  };
};

export const createPosts = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, () => createPost(overrides));
};

export default { createPost, createPosts };
`);

            fs.writeFileSync('tests/helpers/dbCleanup.js', `import { supabase } from '../../src/config/supabase.js';

export const cleanDatabase = async () => {
  // Clean in correct order (respect foreign keys)
  await supabase.from('comments').delete().neq('id', '');
  await supabase.from('posts').delete().neq('id', '');
  await supabase.from('users').delete().neq('id', '');
};

export const resetSequences = async () => {
  // Reset auto-increment sequences if needed
  // This is database-specific
};

export default { cleanDatabase, resetSequences };
`);

            console.log('✅ Test factories created!');
            console.log('📝 Usage in tests:');
            console.log('   import { createUser } from "../factories/userFactory.js";');
            console.log('   const user = createUser({ role: "admin" });');
        }
    },

    playwright: {
        name: '🎭 Playwright E2E',
        description: 'End-to-end testing',
        version: '^1.40.0',
        dependencies: ['@playwright/test@^1.40.0'],
        devDependencies: true,
        install: () => {
            fs.writeFileSync('playwright.config.js', `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`);

            if (!fs.existsSync('tests/e2e')) {
                fs.mkdirSync('tests/e2e', { recursive: true });
            }

            fs.writeFileSync('tests/e2e/auth.spec.js', `import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register new user', async ({ request }) => {
    const response = await request.post('/api/v1/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
  });

  test('should login user', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'admin123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
  });

  test('should reject invalid credentials', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'wrong@example.com',
        password: 'wrongpass',
      },
    });

    expect(response.status()).toBe(401);
  });
});
`);

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts['test:e2e'] = 'playwright test';
            pkg.scripts['test:e2e:ui'] = 'playwright test --ui';
            pkg.scripts['test:e2e:report'] = 'playwright show-report';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ Playwright E2E configured!');
            console.log('📝 Run: npx playwright install');
            console.log('📝 Run: npm run test:e2e');
        }
    },

    pact: {
        name: '🤝 Pact Contract Testing',
        description: 'API contract testing',
        version: '^12.1.0',
        dependencies: ['@pact-foundation/pact@^12.1.0'],
        devDependencies: true,
        install: () => {
            if (!fs.existsSync('tests/contract')) {
                fs.mkdirSync('tests/contract', { recursive: true });
            }

            fs.writeFileSync('tests/contract/user.contract.test.js', `import { Pact } from '@pact-foundation/pact';
import path from 'path';

describe('User API Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'API',
    port: 8080,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  describe('GET /api/v1/users/:id', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request for a user',
        withRequest: {
          method: 'GET',
          path: '/api/v1/users/123',
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      });
    });

    it('returns user data', async () => {
      const response = await fetch('http://localhost:8080/api/v1/users/123', {
        headers: { Accept: 'application/json' },
      });
      
      const data = await response.json();
      expect(data.id).toBe('123');
      expect(data.name).toBe('John Doe');
    });
  });
});
`);

            console.log('✅ Pact contract testing configured!');
            console.log('📝 Run contract tests to generate pact files');
        }
    },

    coverage: {
        name: '📊 Coverage Reports',
        description: 'Enhanced test coverage',
        dependencies: [],
        install: () => {
            // Update jest.config.js
            const jestConfig = `export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/cli/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
  ],
};
`;

            fs.writeFileSync('jest.config.js', jestConfig);

            console.log('✅ Coverage configuration updated!');
            console.log('📝 Run: npm run test:coverage');
            console.log('📝 View: open coverage/index.html');
        }
    },
};

async function main() {
    console.log('\n🧪 Testing Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select testing tools:',
            choices: Object.entries(TESTING_TOOLS).map(([key, tool]) => ({
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
    const allDevDeps = [];

    for (const toolKey of tools) {
        const tool = TESTING_TOOLS[toolKey];
        if (tool.dependencies) {
            if (tool.devDependencies) {
                allDevDeps.push(...tool.dependencies);
            } else {
                allDeps.push(...tool.dependencies);
            }
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

    if (allDevDeps.length > 0) {
        console.log('📦 Installing dev dependencies...');
        try {
            execSync(`npm install -D ${allDevDeps.join(' ')}`, { stdio: 'inherit' });
            console.log('✅ Dev dependencies installed\n');
        } catch (error) {
            console.error('❌ Failed to install dev dependencies');
        }
    }

    for (const toolKey of tools) {
        const tool = TESTING_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} testing tools!\n`);
}

main().catch(console.error);
