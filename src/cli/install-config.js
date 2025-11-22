#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIGS = {
    husky: {
        name: '🐶 Husky - Git Hooks',
        description: 'Pre-commit linting, commit message validation',
        dependencies: ['husky', 'lint-staged', '@commitlint/cli', '@commitlint/config-conventional'],
        devDependencies: true,
        install: async () => {
            // Create .husky directory
            if (!fs.existsSync('.husky')) {
                fs.mkdirSync('.husky', { recursive: true });
            }

            // pre-commit hook
            fs.writeFileSync('.husky/pre-commit', `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`, { mode: 0o755 });

            // commit-msg hook
            fs.writeFileSync('.husky/commit-msg', `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit \${1}
`, { mode: 0o755 });

            // lint-staged config
            fs.writeFileSync('.lintstagedrc.json', JSON.stringify({
                "*.js": ["eslint --fix", "prettier --write"],
                "*.{json,md,yml,yaml}": ["prettier --write"]
            }, null, 2));

            // commitlint config
            fs.writeFileSync('commitlint.config.js', `export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'build', 'revert'
    ]],
    'subject-case': [0],
  },
};
`);

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.prepare = 'husky install';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            // Initialize husky
            execSync('npx husky install', { stdio: 'inherit' });

            console.log('✅ Husky configured successfully!');
        }
    },

    k6: {
        name: '🧪 k6 - Load Testing',
        description: 'Performance and stress testing',
        dependencies: [],
        install: async () => {
            // Create k6 directory
            if (!fs.existsSync('k6')) {
                fs.mkdirSync('k6', { recursive: true });
            }

            // Load test
            fs.writeFileSync('k6/load-test.js', `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  let res = http.get(\`\${BASE_URL}/health\`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);
}
`);

            // Stress test
            fs.writeFileSync('k6/stress-test.js', `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '10m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(\`\${BASE_URL}/health\`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
`);

            console.log('✅ k6 tests created successfully!');
            console.log('📝 Run: k6 run k6/load-test.js');
        }
    },

    typescript: {
        name: '🔷 TypeScript',
        description: 'TypeScript configuration',
        dependencies: ['typescript', '@types/node', '@types/express', 'ts-node'],
        devDependencies: true,
        install: async () => {
            fs.writeFileSync('tsconfig.json', JSON.stringify({
                compilerOptions: {
                    target: "ES2022",
                    module: "ESNext",
                    lib: ["ES2022"],
                    moduleResolution: "node",
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    strict: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                    resolveJsonModule: true,
                    outDir: "./dist",
                    rootDir: "./src",
                    types: ["node", "jest"],
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                        "@config/*": ["src/config/*"],
                        "@controllers/*": ["src/controllers/*"],
                        "@middleware/*": ["src/middleware/*"],
                        "@services/*": ["src/services/*"],
                        "@utils/*": ["src/utils/*"]
                    }
                },
                include: ["src/**/*"],
                exclude: ["node_modules", "dist", "tests"]
            }, null, 2));

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.build = 'tsc';
            pkg.scripts['build:watch'] = 'tsc --watch';
            pkg.scripts['start:ts'] = 'node dist/server.js';
            pkg.scripts['dev:ts'] = 'ts-node-dev --respawn src/server.ts';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ TypeScript configured successfully!');
        }
    },

    kubernetes: {
        name: '☸️ Kubernetes',
        description: 'K8s deployment manifests',
        dependencies: [],
        install: async () => {
            if (!fs.existsSync('kubernetes')) {
                fs.mkdirSync('kubernetes', { recursive: true });
            }

            // Deployment
            fs.writeFileSync('kubernetes/deployment.yaml', `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`);

            // Service
            fs.writeFileSync('kubernetes/service.yaml', `apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
`);

            // Ingress
            fs.writeFileSync('kubernetes/ingress.yaml', `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: api-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 80
`);

            console.log('✅ Kubernetes manifests created!');
        }
    },

    terraform: {
        name: '🏗️ Terraform',
        description: 'Infrastructure as Code (AWS)',
        dependencies: [],
        install: async () => {
            if (!fs.existsSync('terraform')) {
                fs.mkdirSync('terraform', { recursive: true });
            }

            fs.writeFileSync('terraform/main.tf', `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_ecs_cluster" "main" {
  name = "\${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
`);

            fs.writeFileSync('terraform/variables.tf', `variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "basesource"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}
`);

            console.log('✅ Terraform files created!');
        }
    },

    makefile: {
        name: '⚙️ Makefile',
        description: 'Common task automation',
        dependencies: [],
        install: async () => {
            fs.writeFileSync('Makefile', `.PHONY: help install dev test build deploy clean

help:
\t@echo 'Usage: make [target]'
\t@echo ''
\t@echo 'Available targets:'
\t@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
\tnpm install

dev: ## Start development server
\tnpm run dev

test: ## Run tests
\tnpm test

test-watch: ## Run tests in watch mode
\tnpm run test:watch

lint: ## Run linter
\tnpm run lint

build: ## Build for production
\tnpm run build

docker-build: ## Build Docker image
\tdocker build -t basesource:latest .

docker-up: ## Start Docker containers
\tdocker-compose up -d

docker-down: ## Stop Docker containers
\tdocker-compose down

k8s-deploy: ## Deploy to Kubernetes
\tkubectl apply -f kubernetes/

clean: ## Clean build artifacts
\trm -rf dist node_modules coverage
`);

            console.log('✅ Makefile created!');
        }
    },

    cicd: {
        name: '🔄 CI/CD',
        description: 'GitHub Actions workflow',
        dependencies: [],
        install: async () => {
            if (!fs.existsSync('.github/workflows')) {
                fs.mkdirSync('.github/workflows', { recursive: true });
            }

            fs.writeFileSync('.github/workflows/ci.yml', `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t basesource:latest .
`);

            console.log('✅ CI/CD workflow created!');
        }
    },

    eslint: {
        name: '📏 ESLint',
        description: 'Code linting configuration',
        dependencies: ['eslint'],
        devDependencies: true,
        install: async () => {
            fs.writeFileSync('.eslintrc.json', JSON.stringify({
                env: {
                    node: true,
                    es2021: true,
                    jest: true
                },
                extends: ['eslint:recommended'],
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module'
                },
                rules: {
                    'no-console': 'warn',
                    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
                    'prefer-const': 'error',
                    'no-var': 'error'
                }
            }, null, 2));

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.lint = 'eslint src/**/*.js';
            pkg.scripts['lint:fix'] = 'eslint src/**/*.js --fix';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ ESLint configured!');
        }
    },

    prettier: {
        name: '💅 Prettier',
        description: 'Code formatting',
        dependencies: ['prettier'],
        devDependencies: true,
        install: async () => {
            fs.writeFileSync('.prettierrc', JSON.stringify({
                semi: true,
                trailingComma: 'es5',
                singleQuote: true,
                printWidth: 80,
                tabWidth: 2
            }, null, 2));

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.format = 'prettier --write "src/**/*.{js,json,md}"';
            pkg.scripts['format:check'] = 'prettier --check "src/**/*.{js,json,md}"';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ Prettier configured!');
        }
    }
};

async function main() {
    console.log('\n⚙️  Configuration Installer\n');

    const { configs } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'configs',
            message: 'Select configurations to install:',
            choices: Object.entries(CONFIGS).map(([key, config]) => ({
                name: `${config.name} - ${config.description}`,
                value: key,
                checked: false,
            })),
            pageSize: 15,
        },
    ]);

    if (configs.length === 0) {
        console.log('❌ No configurations selected');
        return;
    }

    console.log(`\n✅ Installing ${configs.length} configurations...\n`);

    // Collect dependencies
    const allDeps = new Set();
    const allDevDeps = new Set();

    for (const configKey of configs) {
        const config = CONFIGS[configKey];
        if (config.dependencies && config.dependencies.length > 0) {
            config.dependencies.forEach(dep => {
                if (config.devDependencies) {
                    allDevDeps.add(dep);
                } else {
                    allDeps.add(dep);
                }
            });
        }
    }

    // Install dependencies
    if (allDeps.size > 0) {
        console.log('📦 Installing dependencies...');
        const deps = Array.from(allDeps).join(' ');
        try {
            execSync(`npm install ${deps}`, { stdio: 'inherit' });
            console.log('✅ Dependencies installed\n');
        } catch (error) {
            console.error('❌ Failed to install dependencies');
        }
    }

    if (allDevDeps.size > 0) {
        console.log('📦 Installing dev dependencies...');
        const devDeps = Array.from(allDevDeps).join(' ');
        try {
            execSync(`npm install -D ${devDeps}`, { stdio: 'inherit' });
            console.log('✅ Dev dependencies installed\n');
        } catch (error) {
            console.error('❌ Failed to install dev dependencies');
        }
    }

    // Run installers
    console.log('📁 Creating configuration files...\n');
    for (const configKey of configs) {
        const config = CONFIGS[configKey];
        console.log(`Installing ${config.name}...`);
        try {
            await config.install();
        } catch (error) {
            console.error(`❌ Failed to install ${config.name}:`, error.message);
        }
    }

    console.log(`\n✨ Successfully installed ${configs.length} configurations!\n`);
}

main().catch(console.error);
