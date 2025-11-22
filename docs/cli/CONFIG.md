# ⚙️ Configuration CLI Documentation

## Command

```bash
npm run install:config
```

## Available Tools

### 1. 🐶 Husky - Git Hooks (v8.0.0)

**Pre-commit Hook:**

- Runs ESLint
- Runs Prettier
- Runs lint-staged

**Commit-msg Hook:**

- Validates commit message format
- Enforces conventional commits

**Files created:**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `.lintstagedrc.json`
- `commitlint.config.js`

**Commit Format:**

```
type(scope): subject

feat: add user authentication
fix: resolve login bug
docs: update README
style: format code
refactor: restructure auth module
perf: optimize database queries
test: add user tests
chore: update dependencies
```

---

### 2. 🧪 k6 - Load Testing

**Files created:**

- `k6/load-test.js` - Load test scenario
- `k6/stress-test.js` - Stress test scenario

**Usage:**

```bash
k6 run k6/load-test.js
k6 run k6/stress-test.js
```

---

### 3. 🔷 TypeScript (v5.3.0)

**Files created:**

- `tsconfig.json`

**Scripts added:**

- `npm run build` - Compile TS
- `npm run dev:ts` - Run with ts-node-dev

---

### 4-9. Infrastructure Tools

- ☸️ Kubernetes - K8s manifests
- 🏗️ Terraform - IaC templates
- 🔄 CI/CD - GitHub Actions
- ⚙️ Makefile - Task automation
- 📏 ESLint - Code linting
- 💅 Prettier - Code formatting

See [CONFIGURATIONS.md](../CONFIGURATIONS.md) for details.

---

**Configure once, use forever!** ⚙️
