# 🚀 Supabase Management API

Production-ready Supabase API - Mì ăn liền, setup 1 lệnh!

## ⚡ Quick Start (1 phút)

```bash
node setup.js
```

Hoặc super quick (không hỏi gì):
```bash
node quick-start.js
```

**Done!** API chạy tại http://localhost:3000

## 🎯 Features

- ✅ **One-command setup** - Mì ăn liền
- ✅ **Resource generator** - Tạo CRUD trong 1 phút
- ✅ **Integration installer** - Firebase, WebSocket, Redis, etc.
- ✅ **Testing** - Jest, unit + integration
- ✅ **Monitoring** - Memory, requests, metrics
- ✅ **Security** - JWT, RLS, rate limiting
- ✅ **Documentation** - Swagger + 10+ guides

## 🎨 Generate Resources

```bash
npm run create
# or
npm run g

? Choose preset: 🎯 Ultimate
? Resource name: product

✅ Generated in 1 minute!
```

## 🔌 Add Integrations

```bash
npm run add

? Select integrations:
  ◉ 🔥 Firebase
  ◉ 🔌 WebSocket
  ◉ ⚡ Redis
  ◉ 📧 SendGrid
  ◉ ☁️ AWS S3

✅ Installed in 1 minute!
```

## 🧪 Testing

```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage
```

## 📚 Documentation

- **[Quick Start](docs/QUICK_START.md)** - Setup trong 2 phút
- **[CLI Guide](docs/CLI.md)** - Resource generator
- **[Integrations](docs/INTEGRATIONS.md)** - Firebase, WebSocket, etc.
- **[Testing](docs/TESTING.md)** - Testing guide
- **[Deploy](docs/DEPLOY.md)** - Deployment guide
- **[API Examples](docs/API.md)** - API usage
- **[Security](docs/SECURITY.md)** - Security guide
- **[Architecture](docs/ARCHITECTURE.md)** - System design

## 🔧 Commands

```bash
# Setup
npm run setup              # Interactive setup
npm run quick              # Quick start (no questions)

# Development
npm run dev                # Start server
npm run dev:memory         # With memory monitoring

# Supabase
npm run supabase:start     # Start Supabase
npm run supabase:studio    # Open UI

# Generate
npm run create             # Generate resource
npm run g                  # Short alias
npm run add                # Add integration

# Database
npm run migration:new <name>  # Create migration
npm run migration:up          # Apply migrations
npm run seed                  # Seed data

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage

# Maintenance
npm run logs:clean         # Clean logs
npm run audit:clean        # Clean audit logs
```

## 📊 Project Structure

```
├── src/
│   ├── cli/              # CLI tools
│   ├── config/           # Configurations
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── utils/            # Utilities
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
├── supabase/
│   └── migrations/       # Database migrations
├── setup.js              # One-command setup
└── quick-start.js        # Super quick start
```

## 🎯 Use Cases

Perfect for:
- SaaS Applications
- Mobile App Backends
- Web Applications
- Admin Dashboards
- API-First Projects
- Microservices
- Startups (MVP)

## 🔐 Test Accounts

```
Admin:     admin@example.com / admin123
User:      user@example.com / user123
Affiliate: aff@example.com / aff123
```

## 🌐 Links

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api-docs
- **Supabase Studio**: http://localhost:54323
- **Health**: http://localhost:3000/health

## ⭐ Rating

**5/5 Stars** - Production-ready với:
- One-command setup
- Resource generator
- Integration installer
- Testing suite
- Complete documentation

## 📄 License

MIT

---

**Setup trong 1 phút, code ngay!** 🚀
