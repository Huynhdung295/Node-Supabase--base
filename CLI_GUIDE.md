# 🎨 CLI Guide - Interactive Resource Generator

NestJS-style interactive CLI để tạo resources nhanh chóng!

## 🚀 Quick Start

```bash
npm run create
```

## 📋 Features

### 1. Complete Resource
Tạo tất cả trong một lần:
- ✅ Migration
- ✅ Service
- ✅ Controller
- ✅ Route

### 2. Individual Components
Tạo từng component riêng lẻ:
- Controller
- Route
- Service
- Middleware
- Migration

## 🎯 Usage Examples

### Create Complete Resource

```bash
$ npm run create

? What would you like to create? Complete Resource (Controller + Route + Migration)
? Resource name (singular, lowercase): post

🚀 Creating complete resource: post

1️⃣  Creating migration...
✅ Migration created: supabase/migrations/xxx_add_posts_table.sql

2️⃣  Creating service...
✅ Service created: src/services/postService.js

3️⃣  Creating controller...
✅ Controller created: src/controllers/postController.js

4️⃣  Creating route...
✅ Route created: src/routes/postRoutes.js

✅ Resource created successfully!

📝 Next steps:
1. Edit migration: supabase/migrations/*_add_posts_table.sql
2. Apply migration: npm run migration:up
3. Register route in src/routes/index.js:
   import postRoutes from './postRoutes.js';
   router.use('/posts', postRoutes);
4. Test in Swagger UI: http://localhost:3000/api-docs
```

### Create Controller Only

```bash
$ npm run create

? What would you like to create? Controller only
? Resource name: comment

✅ Controller created: src/controllers/commentController.js

Next steps:
1. Create routes file: src/routes/commentRoutes.js
2. Add validation schema in src/utils/validation.js
3. Create database migration for comments table
4. Import and use in src/routes/index.js
```

### Create Service Only

```bash
$ npm run create

? What would you like to create? Service
? Resource name: notification

✅ Service created: src/services/notificationService.js
```

### Create Middleware

```bash
$ npm run create

? What would you like to create? Middleware
? Resource name: checkPermission

✅ Middleware created: src/middleware/checkPermission.js
```

## 📁 What Gets Created

### Complete Resource: `post`

```
supabase/migrations/
  └── xxx_add_posts_table.sql    # Database migration

src/services/
  └── postService.js              # Business logic

src/controllers/
  └── postController.js           # API handlers

src/routes/
  └── postRoutes.js               # Route definitions
```

### Service Template

```javascript
// src/services/postService.js
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const getAllPosts = async (options = {}) => {
  // Full implementation with error handling
};

export const getPostById = async (id) => {
  // Full implementation
};

export const createPost = async (postData) => {
  // Full implementation with logging
};

export const updatePost = async (id, updates) => {
  // Full implementation
};

export const deletePost = async (id) => {
  // Full implementation
};
```

### Controller Template

```javascript
// src/controllers/postController.js
import { getAllPosts } from '../services/postService.js';
import { successResponse } from '../utils/response.js';
import { logAudit } from '../services/auditService.js';

export const getAllPostsController = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, count } = await getAllPosts({ limit, offset });
    
    return successResponse(res, {
      posts: data,
      pagination: { page, limit, total: count }
    });
  } catch (error) {
    next(error);
  }
};

// ... more CRUD operations
```

### Route Template

```javascript
// src/routes/postRoutes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as controller from '../controllers/postController.js';

const router = express.Router();

router.get('/', authenticate, controller.getAllPostsController);
router.get('/:id', authenticate, controller.getPostByIdController);
router.post('/', authenticate, controller.createPostController);
router.put('/:id', authenticate, controller.updatePostController);
router.delete('/:id', authenticate, authorize('admin'), controller.deletePostController);

export default router;
```

## 🎯 Workflow

### 1. Create Resource
```bash
npm run create
# Select "Complete Resource"
# Enter name: "post"
```

### 2. Edit Migration
```sql
-- supabase/migrations/xxx_add_posts_table.sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
```

### 3. Apply Migration
```bash
npm run migration:up
```

### 4. Add Validation (Optional)
```javascript
// src/utils/validation.js
export const schemas = {
  // ... existing schemas
  createPost: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().required(),
    published: Joi.boolean()
  }),
  updatePost: Joi.object({
    title: Joi.string().min(3).max(200),
    content: Joi.string(),
    published: Joi.boolean()
  }).min(1)
};
```

### 5. Register Route
```javascript
// src/routes/index.js
import postRoutes from './postRoutes.js';

router.use('/posts', postRoutes);
```

### 6. Test
```bash
# Start server
npm run dev

# Open Swagger
http://localhost:3000/api-docs

# Test endpoints
POST /api/v1/posts
GET /api/v1/posts
GET /api/v1/posts/:id
PUT /api/v1/posts/:id
DELETE /api/v1/posts/:id
```

## 💡 Tips

### Naming Conventions
- Use **singular, lowercase** names: `post`, `comment`, `user`
- CLI will pluralize automatically: `posts`, `comments`, `users`
- Use **camelCase** for multi-word: `blogPost` → `blogPosts`

### Best Practices
1. **Always create migration first** before applying
2. **Add validation schemas** after creating routes
3. **Test endpoints** in Swagger UI
4. **Add business logic** to services
5. **Keep controllers thin** - delegate to services

### Customization
Edit templates in:
- `src/cli/create.js` - Main CLI logic
- `src/generators/controllerGenerator.js` - Controller template
- `src/generators/routeGenerator.js` - Route template

## 🔧 Advanced Usage

### Create Multiple Resources
```bash
# Create blog system
npm run create  # post
npm run create  # comment
npm run create  # category
npm run create  # tag
```

### Create E-commerce
```bash
npm run create  # product
npm run create  # order
npm run create  # cart
npm run create  # payment
```

### Create Social Network
```bash
npm run create  # post
npm run create  # like
npm run create  # follow
npm run create  # notification
```

## 📊 Time Savings

### Without CLI (Manual)
- Create migration: 5 minutes
- Create service: 10 minutes
- Create controller: 15 minutes
- Create route: 10 minutes
- **Total: 40 minutes**

### With CLI (Interactive)
- Run command: 10 seconds
- Answer prompts: 5 seconds
- Edit migration: 2 minutes
- Register route: 30 seconds
- **Total: 3 minutes**

**Time Saved: 93%!**

## 🎨 Comparison with NestJS

### NestJS CLI
```bash
nest generate resource post
```

### Our CLI
```bash
npm run create
# Select: Complete Resource
# Name: post
```

### Similarities
- ✅ Interactive prompts
- ✅ Multiple component types
- ✅ Complete resource generation
- ✅ Consistent templates

### Differences
- ✅ Supabase-specific (migrations, RLS)
- ✅ Swagger docs included
- ✅ Audit logging included
- ✅ Service layer pattern
- ✅ Simpler, focused on API

## 🐛 Troubleshooting

### "Command not found"
```bash
# Make sure dependencies are installed
npm install
```

### "File already exists"
```bash
# Choose a different name or delete existing file
rm src/controllers/postController.js
npm run create
```

### "Migration failed"
```bash
# Check SQL syntax
# Check if table already exists
npm run supabase:reset  # Warning: deletes data!
```

## 📚 Related Commands

```bash
# CLI
npm run create                    # Interactive CLI

# Generators (non-interactive)
npm run generate:controller post  # Controller only
npm run generate:route post       # Route only

# Database
npm run migration:new add_posts   # Migration only
npm run migration:up              # Apply migrations
```

## 🎯 Next Steps

After creating resources:
1. **Add validation** - Edit `src/utils/validation.js`
2. **Add business logic** - Edit service files
3. **Add tests** - Create test files
4. **Update Swagger** - Add more documentation
5. **Deploy** - Follow DEPLOYMENT.md

---

**Happy Creating!** 🎨✨
