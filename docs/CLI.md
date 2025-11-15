# 🎨 CLI Guide - Tạo Code Tự Động

## 🚀 Interactive CLI (Như NestJS)

### Advanced CLI (Recommended)

```bash
npm run create
```

**Features:**
- ✅ Chọn operations cần thiết (Get All, Get By ID, Create, Update, Delete)
- ✅ Tùy chọn pagination
- ✅ Tùy chọn authentication
- ✅ Tùy chọn admin-only
- ✅ **Auto-register route** trong index.js

### Basic CLI

```bash
npm run create:basic
```

Tạo tất cả operations mặc định (không có options).

## 📋 Advanced CLI Workflow

### 1. Chọn Loại Resource

```
? What would you like to create?
  > Complete Resource (Customizable)
    Controller only
    Route only
    Service only
    Middleware
    Migration only
```

### 2. Nhập Tên

```
? Resource name (singular, lowercase): post
```

### 3. Chọn Operations

```
? Select operations to include:
  ◉ Get All (List)
  ◉ Get By ID
  ◉ Create
  ◉ Update
  ◉ Delete
```

### 4. Tùy Chọn Pagination

```
? Include pagination for Get All? (Y/n)
```

### 5. Tùy Chọn Authentication

```
? Require authentication? (Y/n)
```

### 6. Tùy Chọn Admin Role

```
? Require admin role for delete? (Y/n)
```

### 7. Auto-Register Route

```
? Auto-register route in src/routes/index.js? (Y/n)
```

### 8. Kết Quả

```
🚀 Creating resource with custom options...

1️⃣  Creating migration...
✅ Migration created

2️⃣  Creating controller...
✅ Controller created

3️⃣  Creating route...
✅ Route created

4️⃣  Registering route...
✅ Route registered in src/routes/index.js

✅ Resource created successfully!

📝 Next steps:
1. Edit migration SQL
2. npm run migration:up
3. Test in Swagger UI
```

## 📝 Ví Dụ Use Cases

### Tạo Blog System

```bash
# Post (Full CRUD + Pagination + Auth)
npm run create
# → Complete Resource
# → post
# → Select all operations
# → Yes to pagination
# → Yes to auth
# → Yes to auto-register

# Comment (No pagination, auth required)
npm run create
# → Complete Resource
# → comment
# → Select all operations
# → No to pagination
# → Yes to auth

# Category (Read-only for users)
npm run create
# → Complete Resource
# → category
# → Select: Get All, Get By ID only
# → No to pagination
# → Yes to auth
```

### Tạo E-commerce

```bash
# Product (Public read, admin write)
npm run create
# → product
# → All operations
# → Yes to pagination
# → Yes to auth
# → Yes to admin for delete

# Order (User-specific)
npm run create
# → order
# → All operations
# → Yes to pagination
# → Yes to auth

# Cart (No delete, user-specific)
npm run create
# → cart
# → Get All, Get By ID, Create, Update
# → No to pagination
# → Yes to auth
```

### Tạo API-Only Resource (No Auth)

```bash
npm run create
# → public-data
# → Get All, Get By ID
# → Yes to pagination
# → No to auth  ← Public API
```

## ⚡ Time Savings

- **Manual**: 40 phút
- **Basic CLI**: 3 phút
- **Advanced CLI**: 2 phút (với auto-register!)
- **Saved**: 95%!

## 🎯 Workflow

1. **Create resource**: `npm run create`
2. **Edit migration**: `supabase/migrations/*.sql`
3. **Apply migration**: `npm run migration:up`
4. **Register route**: `src/routes/index.js`
5. **Test**: Swagger UI

## 🎯 Customization Options

### Operations
- **Get All**: List all resources (with optional pagination)
- **Get By ID**: Get single resource
- **Create**: Create new resource
- **Update**: Update existing resource
- **Delete**: Delete resource

### Features
- **Pagination**: Add pagination to Get All
- **Authentication**: Require JWT token
- **Admin Role**: Require admin role for delete
- **Auto-Register**: Automatically add route to index.js

## 💡 Best Practices

### When to Use What

**Full CRUD + Pagination + Auth:**
- User-generated content (posts, comments)
- E-commerce (products, orders)
- Admin resources

**Read-Only + Pagination:**
- Public data (categories, tags)
- Reference data

**No Pagination:**
- Small datasets (<100 items)
- User-specific data (cart, wishlist)

**No Auth:**
- Public APIs
- Health checks
- Static data

## 📚 Commands

```bash
# Advanced CLI (Recommended)
npm run create

# Basic CLI (All operations, no options)
npm run create:basic

# Non-interactive generators
npm run generate:controller post
npm run generate:route post

# Migration
npm run migration:new add_posts
npm run migration:up
```

## 🔧 Auto-Register Feature

CLI tự động thêm route vào `src/routes/index.js`:

**Before:**
```javascript
import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
```

**After (auto-generated):**
```javascript
import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import postRoutes from './postRoutes.js';  // ← Added

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);  // ← Added

export default router;
```

**No manual editing needed!** ✨

---

**Tạo features trong 30 giây với full customization!** ⚡
