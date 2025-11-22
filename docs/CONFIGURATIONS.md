# ⚙️ Available Configurations

Install additional configurations on-demand with:

```bash
npm run install:config
```

## Available Configurations

### 🐶 Husky - Git Hooks

**What it does:**

- Pre-commit: Runs linting and formatting
- Commit-msg: Validates commit message format
- Ensures code quality before commits

**Installs:**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `.lintstagedrc.json`
- `commitlint.config.js`

**Dependencies:** `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`

**Usage:**

```bash
git commit -m "feat: add new feature"  # ✅ Valid
git commit -m "random message"         # ❌ Invalid
```

---

### 🧪 k6 - Load Testing

**What it does:**

- Performance testing
- Load testing
- Stress testing

**Installs:**

- `k6/load-test.js`
- `k6/stress-test.js`

**Usage:**

```bash
k6 run k6/load-test.js
k6 run k6/stress-test.js
```

---

### 🔷 TypeScript

**What it does:**

- Full TypeScript configuration
- Type checking
- Path aliases

**Installs:**

- `tsconfig.json`

**Dependencies:** `typescript`, `@types/node`, `@types/express`, `ts-node`

**Usage:**

```bash
npm run build        # Compile TS to JS
npm run dev:ts       # Run with ts-node-dev
```

---

### ☸️ Kubernetes

**What it does:**

- K8s deployment manifests
- Service definitions
- Ingress configuration

**Installs:**

- `kubernetes/deployment.yaml`
- `kubernetes/service.yaml`
- `kubernetes/ingress.yaml`

**Usage:**

```bash
kubectl apply -f kubernetes/
kubectl get pods
```

---

### 🏗️ Terraform

**What it does:**

- Infrastructure as Code
- AWS VPC, ECS setup
- Automated infrastructure

**Installs:**

- `terraform/main.tf`
- `terraform/variables.tf`

**Usage:**

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

### 🔄 CI/CD

**What it does:**

- GitHub Actions workflow
- Automated testing
- Docker build

**Installs:**

- `.github/workflows/ci.yml`

**Triggers:**

- On push to main/develop
- On pull request

---

### ⚙️ Makefile

**What it does:**

- Common task automation
- One-command operations

**Installs:**

- `Makefile`

**Usage:**

```bash
make help          # Show all commands
make dev           # Start dev server
make test          # Run tests
make docker-up     # Start Docker
make k8s-deploy    # Deploy to K8s
```

---

### 📏 ESLint

**What it does:**

- Code linting
- Find problems
- Enforce code style

**Installs:**

- `.eslintrc.json`

**Dependencies:** `eslint`

**Usage:**

```bash
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues
```

---

### 💅 Prettier

**What it does:**

- Code formatting
- Consistent style
- Auto-format on save

**Installs:**

- `.prettierrc`

**Dependencies:** `prettier`

**Usage:**

```bash
npm run format         # Format all files
npm run format:check   # Check formatting
```

---

## Installation Examples

### Install Everything

```bash
npm run install:config
# Select all options
```

### Install Dev Tools

```bash
npm run install:config
# Select: Husky, ESLint, Prettier, TypeScript
```

### Install DevOps Tools

```bash
npm run install:config
# Select: Kubernetes, Terraform, CI/CD, Makefile
```

### Install Testing Tools

```bash
npm run install:config
# Select: k6
```

## How It Works

1. **Select configurations** - Interactive CLI
2. **Auto-install dependencies** - npm install
3. **Generate files** - Create config files
4. **Update package.json** - Add scripts
5. **Ready to use!** - Start using immediately

## Benefits

- ✅ **Clean base project** - No bloat
- ✅ **Install on-demand** - Only what you need
- ✅ **Auto-configured** - Works out of the box
- ✅ **Production-ready** - Battle-tested configs

## Tips

1. **Start small** - Install 2-3 configs first
2. **Read docs** - Check generated files
3. **Customize** - Modify configs as needed
4. **Commit** - Add to version control

---

**Configure once, use forever!** ⚙️
