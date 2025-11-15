# 🔄 Development Workflow Guide

## 🚀 Quick Start Development Flow

### 1. Initial Setup (One Time)
```bash
# Clone and install
npm install

# Generate secure keys
npm run keys:generate
# Copy keys to .env or run:
npm run keys:append

# Start Supabase
npm run supabase:start

# Start dev server
npm run dev
```

### 2. Daily Development Flow

```bash
# Morning: Start services
npm run supabase:start
npm run dev

# Evening: Stop services
npm run supabase:stop
```

## 📝 Creating New Features

### Step 1: Create Database Migration
```bash
npm run migration:new add_posts_table
```

Edit `supabase/migrations/xxx_add_posts_table.sql`:
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Apply migration:
```bash
npm run migration:up
```

### Step 2: Generate Controller
```bash
npm run generate:controller post
```

This creates `src/controllers/postController.js` with:
- ✅ Full CRUD operations
- ✅ Swagger documentation
- ✅ Audit logging
- ✅ Error handling
- ✅ Pagination support

### Step 3: Generate Routes
```bash
npm run generate:route post
```

This creates `src/routes/postRoutes.js` with:
- ✅ All REST endpoints
- ✅ Authentication middleware
- ✅ Authorization checks
- ✅ Validation placeholders

### Step 4: Add Validation
Edit `src/utils/validation.js`:
```javascript
export const schemas = {
  // ... existing schemas
  createPost: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().required()
  }),
  updatePost: Joi.object({
    title: Joi.string().min(3).max(200),
    content: Joi.string()
  }).min(1)
};
```

### Step 5: Register Routes
Edit `src/routes/index.js`:
```javascript
import postRoutes from './postRoutes.js';

router.use('/posts', postRoutes);
```

### Step 6: Test with Swagger
1. Open http://localhost:3000/api-docs
2. Test all endpoints
3. Verify responses

## 🔧 Common Commands

### Development
```bash
npm run dev                    # Start with auto-reload
npm run dev:memory            # Start with memory monitoring
npm run supabase:studio       # Open Supabase Studio UI
```

### Database
```bash
npm run migration:new <name>  # Create migration
npm run migration:up          # Apply migrations
npm run migration:list        # List all migrations
npm run supabase:reset        # Reset DB (⚠️ deletes data)
npm run seed                  # Seed test data
```

### Security
```bash
npm run keys:generate         # Generate new secure keys
npm run keys:append           # Append keys to .env
```

### Generators
```bash
npm run generate:controller <name>  # Generate controller
npm run generate:route <name>       # Generate route
```

### Maintenance
```bash
npm run logs:clean            # Clean old log files
npm run audit:clean           # Clean old audit logs
```

## 📊 Monitoring & Debugging

### Memory Monitoring
```bash
# Run with memory monitoring
npm run dev:memory

# Access metrics endpoint (admin only)
GET /api/v1/metrics/memory
```

### Request Logging
All requests are automatically logged with:
- Request ID
- Duration
- Status code
- User info
- IP address

### Slow Request Detection
Requests >2s are automatically flagged and logged.

## 🎯 Best Practices

### 1. Always Create Migrations
```bash
# ❌ Don't modify DB directly
# ✅ Create migration
npm run migration:new your_change
```

### 2. Use Generators
```bash
# ❌ Don't copy-paste controllers
# ✅ Use generator
npm run generate:controller feature
```

### 3. Add Validation
```javascript
// ✅ Always validate input
router.post('/', validate(schemas.create), controller);
```

### 4. Log Important Actions
```javascript
// ✅ Use audit logging
await logAudit({
  userId: req.user.id,
  action: 'important_action',
  resourceType: 'resource',
  resourceId: id
});
```

### 5. Test Before Commit
```bash
# Test all endpoints
# Check Swagger docs
# Verify logs
```

## 🔄 Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
npm run generate:controller feature
# ... develop ...

# 3. Test
# Test with Swagger
# Check logs

# 4. Commit
git add .
git commit -m "feat: add new feature"

# 5. Push
git push origin feature/new-feature

# 6. Create PR
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### Supabase Won't Start
```bash
npm run supabase:stop
npm run supabase:start
```

### Migration Failed
```bash
# Reset and try again
npm run supabase:reset
```

### Memory Issues
```bash
# Run with GC exposed
npm run dev:memory

# Force GC via API (admin only)
POST /api/v1/metrics/gc
```

## 📚 Quick Reference

### File Structure
```
src/
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Express middleware
├── services/        # Service layer
├── utils/           # Utilities
├── config/          # Configuration
├── generators/      # Code generators
└── scripts/         # Utility scripts
```

### Key Files
- `src/server.js` - Entry point
- `src/config/constants.js` - All constants
- `src/utils/validation.js` - Validation schemas
- `src/routes/index.js` - Route registry

### Environment Variables
- `.env` - Local development
- `.env.test` - Testing
- `.env.production.example` - Production template

## 🎓 Learning Resources

- **README.md** - Complete documentation
- **ARCHITECTURE.md** - System design
- **API_EXAMPLES.md** - API usage examples
- **SECURITY.md** - Security guidelines
- **DEPLOYMENT.md** - Deployment guide

---

**Pro Tip:** Bookmark this file for quick reference during development!
