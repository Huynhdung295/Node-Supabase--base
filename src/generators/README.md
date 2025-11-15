# 🎨 Code Generators

Auto-generate boilerplate code để tiết kiệm thời gian!

## 📝 Controller Generator

Generate full CRUD controller với tất cả best practices.

### Usage
```bash
npm run generate:controller <name>

# Example
npm run generate:controller post
```

### What It Creates
- `src/controllers/postController.js` với:
  - ✅ getAll (with pagination)
  - ✅ getById
  - ✅ create
  - ✅ update
  - ✅ delete
  - ✅ Swagger documentation
  - ✅ Audit logging
  - ✅ Error handling
  - ✅ Logger integration

### Example Output
```javascript
// src/controllers/postController.js
export const getAllPosts = async (req, res, next) => {
  // Full implementation with pagination, logging, error handling
};

export const getPostById = async (req, res, next) => {
  // Full implementation
};

// ... and more
```

## 🛣️ Route Generator

Generate routes với authentication, authorization, validation.

### Usage
```bash
npm run generate:route <name>

# Example
npm run generate:route post
```

### What It Creates
- `src/routes/postRoutes.js` với:
  - ✅ All CRUD endpoints
  - ✅ Authentication middleware
  - ✅ Authorization checks
  - ✅ Validation placeholders
  - ✅ Proper HTTP methods

### Example Output
```javascript
// src/routes/postRoutes.js
router.get('/', authenticate, getAllPosts);
router.get('/:id', authenticate, getPostById);
router.post('/', authenticate, validate(schemas.createPost), createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, authorize('admin'), deletePost);
```

## 🚀 Complete Workflow

### Step 1: Create Migration
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

### Step 2: Apply Migration
```bash
npm run migration:up
```

### Step 3: Generate Controller
```bash
npm run generate:controller post
```

### Step 4: Generate Route
```bash
npm run generate:route post
```

### Step 5: Add Validation (Optional)
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

### Step 6: Register Route
Edit `src/routes/index.js`:
```javascript
import postRoutes from './postRoutes.js';

router.use('/posts', postRoutes);
```

### Step 7: Test
Open http://localhost:3000/api-docs and test your new endpoints!

## ⏱️ Time Savings

### Without Generators (Old Way)
- Create controller: 20-30 minutes
- Create routes: 10-15 minutes
- Add Swagger docs: 10-15 minutes
- Add audit logging: 5-10 minutes
- Add error handling: 5-10 minutes
- **Total: 50-80 minutes**

### With Generators (New Way)
- Generate controller: 5 seconds
- Generate routes: 5 seconds
- Register route: 10 seconds
- **Total: 20 seconds**

**Time Saved: 99.6%!**

## 🎯 Best Practices Built-In

### Controller Generator Includes:
- ✅ Pagination support
- ✅ Error handling
- ✅ Audit logging
- ✅ Logger integration
- ✅ Swagger documentation
- ✅ Consistent response format
- ✅ Security checks
- ✅ Input validation placeholders

### Route Generator Includes:
- ✅ Authentication middleware
- ✅ Authorization checks
- ✅ Validation placeholders
- ✅ Proper HTTP methods
- ✅ RESTful conventions
- ✅ Consistent structure

## 💡 Tips

1. **Always create migration first** before generating code
2. **Add validation schemas** after generating routes
3. **Customize generated code** to fit your needs
4. **Test endpoints** in Swagger UI
5. **Add business logic** to controllers as needed

## 🔧 Customization

### Modify Templates
Edit generator files to customize output:
- `src/generators/controllerGenerator.js`
- `src/generators/routeGenerator.js`

### Add New Generators
Create new generators for:
- Services
- Middleware
- Tests
- Models
- etc.

## 📚 Examples

### Generate Blog Feature
```bash
npm run migration:new add_blog_tables
npm run generate:controller post
npm run generate:controller comment
npm run generate:route post
npm run generate:route comment
```

### Generate E-commerce Feature
```bash
npm run migration:new add_ecommerce_tables
npm run generate:controller product
npm run generate:controller order
npm run generate:controller cart
npm run generate:route product
npm run generate:route order
npm run generate:route cart
```

### Generate Social Network Feature
```bash
npm run migration:new add_social_tables
npm run generate:controller post
npm run generate:controller like
npm run generate:controller follow
npm run generate:route post
npm run generate:route like
npm run generate:route follow
```

## 🎉 Benefits

- ⚡ **99.6% faster** than manual coding
- 🎯 **Consistent code** across project
- 🛡️ **Best practices** built-in
- 📚 **Auto-documentation** with Swagger
- 🔒 **Security** by default
- 📊 **Audit logging** included
- 🐛 **Fewer bugs** (tested templates)
- 🚀 **Faster development** cycle

---

**Happy generating!** 🎨✨
