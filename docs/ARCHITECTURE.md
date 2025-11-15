# 🏗️ Architecture Overview

## 📁 Project Structure

```
├── src/
│   ├── cli/              # Interactive CLI
│   ├── config/           # Configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   ├── generators/       # Code generators
│   └── scripts/          # Utility scripts
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Seed data
├── nginx/                # Nginx config
└── docs/                 # Documentation
```

## 🔄 Request Flow

```
Client Request
    ↓
Nginx (Load Balancer)
    ↓
Express Server
    ↓
Middleware (Auth, Rate Limit, Logging)
    ↓
Routes
    ↓
Controllers
    ↓
Services (Business Logic)
    ↓
Supabase (Database)
    ↓
Response
```

## 🎯 Design Patterns

### 1. Service Layer Pattern
```
Controller → Service → Database
```

### 2. Middleware Pattern
```
Request → Middleware Chain → Handler
```

### 3. Repository Pattern
```
Service → Supabase Client → Database
```

## 🔐 Security Layers

1. **Helmet** - Security headers
2. **CORS** - Cross-origin protection
3. **Rate Limiting** - DDoS protection
4. **JWT** - Authentication
5. **RLS** - Row Level Security
6. **Input Validation** - Joi schemas
7. **Audit Logging** - Track changes

## 📊 Data Flow

```
User Input
    ↓
Validation (Joi)
    ↓
Authentication (JWT)
    ↓
Authorization (Roles)
    ↓
Business Logic (Service)
    ↓
Database (Supabase)
    ↓
Audit Log
    ↓
Response
```

## 🚀 Scalability

- **Horizontal**: Multiple API instances + Nginx
- **Vertical**: Increase server resources
- **Database**: Supabase auto-scales
- **Caching**: Ready for Redis integration

---

**Clean & Scalable!** 🏗️
