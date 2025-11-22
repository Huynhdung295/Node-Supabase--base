# 🚀 Basesource CLI Guide

## 🎯 All Available CLIs

Basesource provides **7 powerful CLIs** to install features on-demand:

```bash
npm run install:config          # Dev tools & configs
npm run install:observability   # Logging & monitoring
npm run install:security        # Authorization & protection
npm run install:database        # DB optimization
npm run install:testing         # Test tools
npm run install:performance     # Caching & queues
npm run install:compliance      # GDPR & backups
```

## 📦 What Gets Installed?

### ⚙️ Configuration (9 tools)

- Husky, k6, TypeScript, Kubernetes, Terraform, CI/CD, Makefile, ESLint, Prettier

### 📊 Observability (4 tools)

- Pino, Sentry, Prometheus, Health Checks

### 🔐 Security (4 tools)

- CASL, Idempotency, Circuit Breaker, Graceful Shutdown

### 💾 Database (4 tools)

- Transactions, Seeding, Indexing Guide, Connection Pooling

### 🧪 Testing (4 tools)

- Test Factories, Playwright E2E, Pact Contract, Coverage

### ⚡ Performance (4 tools)

- Redis, Bull Queue, Compression, Rate Limiting

### 🇪🇺 Compliance (3 tools)

- GDPR, Backup Scripts, Data Lifecycle

**Total: 32 tools across 7 CLIs!**

## 🎬 Quick Start

### 1. Setup Base Project

```bash
npm run setup
```

### 2. Install What You Need

```bash
# For production app
npm run install:observability  # Select: Pino, Sentry, Health Checks
npm run install:security       # Select: CASL, Graceful Shutdown
npm run install:performance    # Select: Redis, Compression

# For development
npm run install:config         # Select: Husky, ESLint, Prettier
npm run install:testing        # Select: Test Factories, Playwright
```

### 3. Start Coding!

```bash
npm run dev
```

## 💡 Use Cases

### Startup MVP

```bash
npm run install:observability  # Pino, Health Checks
npm run install:security       # Graceful Shutdown
npm run install:config         # ESLint, Prettier
```

### Growing SaaS

```bash
npm run install:observability  # All tools
npm run install:security       # All tools
npm run install:performance    # Redis, Bull Queue
npm run install:compliance     # GDPR
```

### Enterprise Application

```bash
# Install everything!
npm run install:config
npm run install:observability
npm run install:security
npm run install:database
npm run install:testing
npm run install:performance
npm run install:compliance
```

## 🔥 Features

### ✅ Auto-Generate Code

- No templates needed
- Creates files directly in your project
- Installs dependencies automatically
- Updates package.json scripts

### ✅ Version Pinned

- All dependencies have specific versions
- Tested and production-ready
- No breaking changes

### ✅ Interactive

- Select only what you need
- Clear descriptions
- Usage instructions after install

### ✅ Modular

- Each tool is independent
- Install in any order
- No conflicts

## 📚 Documentation

Each CLI creates relevant documentation:

- `docs/DATABASE_OPTIMIZATION.md` - Indexing strategies
- `docs/DATA_LIFECYCLE.md` - Data retention policies
- `docs/CONFIGURATIONS.md` - Config tools guide

## 🎓 Learning Path

### Week 1: Basics

```bash
npm run install:config         # Dev tools
npm run install:observability  # Logging
```

### Week 2: Security

```bash
npm run install:security       # Authorization
npm run install:compliance     # GDPR
```

### Week 3: Performance

```bash
npm run install:performance    # Caching
npm run install:database       # Optimization
```

### Week 4: Testing

```bash
npm run install:testing        # All test tools
```

## 💰 Value

### Time Saved

- **Configuration**: 1-2 days → 1 minute
- **Observability**: 2-3 days → 2 minutes
- **Security**: 1-2 weeks → 2 minutes
- **Database**: 3-5 days → 2 minutes
- **Testing**: 1 week → 2 minutes
- **Performance**: 3-5 days → 2 minutes
- **Compliance**: 2-3 weeks → 2 minutes

**Total: 6-8 weeks → 15 minutes!**

### Cost Saved

- **CASL Authorization**: \$10k-20k
- **GDPR Compliance**: \$20k-30k
- **Testing Setup**: \$5k-10k
- **Observability**: \$5k-10k
- **Performance**: \$5k-10k

**Total: \$45k-80k+**

## 🤝 Contributing

Want to add more tools? Check `src/cli/` for examples!

## 📄 License

MIT

---

**From zero to production in minutes!** 🚀

Made with ❤️ for developers who want to ship fast.
