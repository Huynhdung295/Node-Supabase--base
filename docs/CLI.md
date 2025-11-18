# 🎨 CLI Guide - Unified Generator

## 🚀 One Command for Everything

```bash
npm run create
# or
npm run g
# or
npm run generate
```

**Giống NestJS/Angular - Một lệnh duy nhất!**

## 🎯 6 Presets

### 1. 🎯 Ultimate (All features)
**Perfect for:** Main business entities

**Includes:**
- All CRUD operations
- Search & Export
- Pagination
- Authentication
- Admin-only delete
- Validation
- Tests
- RLS policies
- Timestamps

**Use case:** Products, Orders, Posts

### 2. 📦 CRUD (Standard)
**Perfect for:** Standard entities

**Includes:**
- All CRUD operations
- Pagination
- Authentication
- Admin-only delete
- Validation
- RLS policies
- Timestamps

**Use case:** Categories, Tags, Comments

### 3. 📖 Read-Only (Public)
**Perfect for:** Reference data

**Includes:**
- Get All + Get By ID
- Pagination
- No authentication
- Timestamps

**Use case:** Countries, Cities, Static data

### 4. 🔐 User-Protected
**Perfect for:** User-specific data

**Includes:**
- All CRUD operations
- Pagination
- Authentication (users manage own)
- Validation
- RLS policies
- Timestamps

**Use case:** Cart, Wishlist, Favorites

### 5. 👑 Admin-Only
**Perfect for:** System management

**Includes:**
- All CRUD operations
- Pagination
- Authentication
- Admin-only for ALL operations
- Validation
- Export
- RLS policies
- Timestamps

**Use case:** Settings, Configurations

### 6. 🎨 Custom
**Perfect for:** Special requirements

**Includes:**
- Full customization
- Choose everything yourself

## 📋 Complete Workflow

```bash
$ npm run create

🚀 Supabase API Generator

? Choose a preset:
  🎯 Ultimate (All features) - Full CRUD + Search + Export + Tests + RLS
  📦 CRUD (Standard) - Basic CRUD operations with auth
  📖 Read-Only (Public) - Get All + Get By ID, no auth
  🔐 User-Protected - Users manage their own data
  👑 Admin-Only - All operations require admin
❯ 🎨 Custom - Choose everything yourself

? Resource name (singular, lowercase): post

🎯 Generating resource...

1️⃣  Creating migration...
   ✅ 20241114120000_add_posts_table.sql

2️⃣  Creating controller...
   ✅ postController.js

3️⃣  Creating route...
   ✅ postRoutes.js

4️⃣  Adding validation...
   ✅ Updated validation.js

5️⃣  Auto-registering route...
   ✅ Updated routes/index.js

6️⃣  Creating tests...
   ✅ Created post.test.js

✅ Resource generated successfully!

📝 Next steps:
1. Edit migration: supabase/migrations/*_add_posts_table.sql
2. Customize columns and business logic
3. Apply migration: npm run migration:up
4. Test in Swagger: http://localhost:3000/api-docs
```

## ✨ Auto-Implementation

### 1. Migration
**Auto-generates:**
- Table structure
- Indexes
- RLS policies
- Triggers (updated_at)
- Full-text search (if enabled)

### 2. Controller
**Auto-generates:**
- All selected operations
- Pagination logic
- Error handling
- Audit logging
- Swagger docs

### 3. Route
**Auto-generates:**
- All endpoints
- Authentication middleware
- Authorization middleware
- Validation middleware

### 4. Validation
**Auto-adds to validation.js:**
```javascript
createPost: Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null)
}),

updatePost: Joi.object({
  name: Joi.string().min(2).max(200),
  description: Joi.string().allow('', null)
}).min(1),
```

### 5. Route Registration
**Auto-adds to routes/index.js:**
```javascript
import postRoutes from './postRoutes.js';
router.use('/posts', postRoutes);
```

**No manual editing needed!** ✨

### 6. Tests (Optional)
**Auto-generates:**
- Integration tests
- All CRUD operations
- Authentication tests

## 🎯 Examples

### Example 1: Blog Post (Ultimate)

```bash
npm run create
→ Ultimate
→ post

Generated:
✅ Migration with RLS, indexes, search
✅ Controller with all operations
✅ Route with auth & validation
✅ Validation schemas
✅ Integration tests
✅ Auto-registered in routes/index.js
```

### Example 2: User Cart (Protected)

```bash
npm run create
→ User-Protected
→ cart

Generated:
✅ Migration with RLS (users manage own)
✅ Controller with CRUD
✅ Route with auth
✅ Validation schemas
✅ Auto-registered
```

### Example 3: Category (Read-Only)

```bash
npm run create
→ Read-Only
→ category

Generated:
✅ Migration (no RLS)
✅ Controller (Get All, Get By ID)
✅ Route (no auth)
✅ Auto-registered
```

### Example 4: Settings (Admin-Only)

```bash
npm run create
→ Admin-Only
→ setting

Generated:
✅ Migration with RLS
✅ Controller with CRUD
✅ Route with admin-only middleware
✅ Validation schemas
✅ Auto-registered
```

### Example 5: Custom

```bash
npm run create
→ Custom
→ notification

? Select operations:
  ◉ Get All
  ◉ Get By ID
  ◯ Create
  ◯ Update
  ◉ Delete

? Pagination? Yes
? Authentication? Yes
? Admin-only delete? No
? Validation? No
? Tests? No
? Soft delete? Yes
? Timestamps? Yes
? RLS policies? Yes

Generated:
✅ Exactly what you need!
```

## 💡 Best Practices

### Preset Selection Guide

| Use Case | Preset | Why |
|----------|--------|-----|
| **Products** | Ultimate | Need search, export, full features |
| **Orders** | Ultimate | Need all features + audit |
| **Categories** | CRUD | Standard CRUD is enough |
| **Tags** | Read-Only | Just reference data |
| **Cart** | User-Protected | Users manage own |
| **Wishlist** | User-Protected | Users manage own |
| **Settings** | Admin-Only | System management |
| **Blog (public)** | Read-Only | Public access |
| **Notifications** | Custom | Special requirements |

### When to Use Custom

- ✅ Unique operation combinations
- ✅ Special authentication needs
- ✅ Soft delete requirements
- ✅ No standard preset fits

## ⚡ Time Savings

| Method | Time | Savings |
|--------|------|---------|
| **Manual** | 60 min | 0% |
| **CLI** | 1 min | **98%!** |

## 🎊 Summary

**One CLI to rule them all:**
- ✅ One command: `npm run create`
- ✅ 6 smart presets
- ✅ Full customization
- ✅ Auto-implementation
- ✅ No manual editing
- ✅ Production-ready code

**Just like NestJS/Angular!** 🚀✨

---

**Next:** [Quick Start](QUICK_START.md) | [API Examples](API.md)
