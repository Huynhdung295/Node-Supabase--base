# ⚡ Quick Start - Mì Ăn Liền!

## 🚀 Method 1: ONE COMMAND (Recommended)

```bash
node setup.js
```

**Hoặc:**
```bash
npm run setup
```

**Làm gì:**
- ✅ Install dependencies
- ✅ Generate secure keys
- ✅ Create .env
- ✅ Start Supabase (optional)
- ✅ Add integrations (optional)
- ✅ Ready to code!

**Time:** 2 phút

---

## ⚡ Method 2: SUPER QUICK (No questions)

```bash
node quick-start.js
```

**Làm gì:**
- ✅ Install everything
- ✅ Generate keys
- ✅ Start Supabase
- ✅ Start server
- ✅ Done!

**Time:** 1 phút

---

## 📝 Method 3: Manual (Step by step)

### 1. Install
```bash
npm install
```

### 2. Generate Keys
```bash
npm run keys:generate
npm run keys:append
```

### 3. Start Supabase
```bash
npm run supabase:start
# Copy keys to .env
```

### 4. Start Server
```bash
npm run dev
```

---

## 🎯 After Setup

### Test API
```
http://localhost:3000/api-docs
```

### Test Accounts
```
Admin:  admin@example.com / admin123
User:   user@example.com / user123
```

### Create Resource
```bash
npm run create
# or
npm run g
```

### Add Integration
```bash
npm run add
```

---

## 🔥 Quick Commands

```bash
# Development
npm run dev              # Start server
npm run dev:memory       # With memory monitoring

# Supabase
npm run supabase:start   # Start Supabase
npm run supabase:studio  # Open UI
npm run supabase:stop    # Stop Supabase

# Database
npm run migration:new <name>  # Create migration
npm run migration:up          # Apply migrations
npm run seed                  # Seed data

# Generate
npm run create           # Generate resource
npm run g                # Short alias
npm run add              # Add integration

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage

# Maintenance
npm run logs:clean       # Clean logs
npm run audit:clean      # Clean audit logs
```

---

## 🆘 Troubleshooting

### Port already in use
```bash
# Change PORT in .env
PORT=3001
```

### Supabase won't start
```bash
npm run supabase:stop
npm run supabase:start
```

### Reset everything
```bash
npm run supabase:reset
```

---

## 📚 Next Steps

1. **Create your first resource:**
   ```bash
   npm run create
   ```

2. **Add integrations:**
   ```bash
   npm run add
   ```

3. **Read docs:**
   - [CLI Guide](CLI.md)
   - [Integrations](INTEGRATIONS.md)
   - [API Examples](API.md)

---

**That's it! Start coding!** 🚀
