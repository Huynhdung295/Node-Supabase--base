# Contributing Guide

Cảm ơn bạn đã quan tâm đến việc đóng góp cho project này! 🎉

## 📋 Quy Trình Đóng Góp

### 1. Fork và Clone

```bash
# Fork repo trên GitHub, sau đó clone
git clone https://github.com/your-username/supabase-management-api.git
cd supabase-management-api
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Tạo Branch Mới

```bash
git checkout -b feature/your-feature-name
# hoặc
git checkout -b fix/your-bug-fix
```

### 4. Development

- Viết code của bạn
- Tuân thủ coding standards (xem bên dưới)
- Test kỹ trước khi commit

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
# hoặc
git commit -m "fix: resolve bug in authentication"
```

**Commit Message Format:**
- `feat:` - Tính năng mới
- `fix:` - Sửa bug
- `docs:` - Cập nhật documentation
- `style:` - Format code, không thay đổi logic
- `refactor:` - Refactor code
- `test:` - Thêm tests
- `chore:` - Cập nhật build tools, dependencies

### 6. Push và Create Pull Request

```bash
git push origin feature/your-feature-name
```

Sau đó tạo Pull Request trên GitHub.

## 📝 Coding Standards

### JavaScript/Node.js

- Sử dụng ES6+ syntax
- Sử dụng `const` và `let`, không dùng `var`
- Arrow functions cho callbacks
- Async/await thay vì callbacks
- Meaningful variable names
- Comment cho logic phức tạp

### File Structure

```javascript
// 1. Imports
import express from 'express';
import { supabase } from '../config/supabase.js';

// 2. Constants
const MAX_RETRIES = 3;

// 3. Helper functions
const helperFunction = () => { ... };

// 4. Main functions
export const mainFunction = async () => { ... };

// 5. Default export (if needed)
export default { ... };
```

### Error Handling

```javascript
// ✅ Good
try {
  const result = await someAsyncOperation();
  return successResponse(res, result);
} catch (error) {
  next(error); // Let error middleware handle it
}

// ❌ Bad
try {
  const result = await someAsyncOperation();
  return res.json(result);
} catch (error) {
  console.log(error); // Don't just log
  return res.status(500).json({ error: 'Error' }); // Don't handle here
}
```

### API Response Format

Luôn sử dụng helper functions từ `src/utils/response.js`:

```javascript
// Success
return successResponse(res, data, 'Operation successful', 200);

// Error - let middleware handle
throw new ValidationError('Invalid input');
```

### Database Operations

```javascript
// ✅ Good - Use supabaseAdmin for admin operations
const { data, error } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (error) throw error;

// ✅ Good - Use supabase for user operations (with RLS)
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', req.user.id)
  .single();
```

## 🧪 Testing

### Chạy Tests (khi có)

```bash
npm test
```

### Test Checklist

- [ ] Unit tests cho functions mới
- [ ] Integration tests cho API endpoints
- [ ] Test error cases
- [ ] Test authentication/authorization
- [ ] Test với different user roles

### Manual Testing

1. Start Supabase local:
   ```bash
   npm run supabase:start
   ```

2. Start API server:
   ```bash
   npm run dev
   ```

3. Test với Swagger UI:
   http://localhost:3000/api-docs

4. Test với curl hoặc Postman

## 📚 Documentation

### Code Comments

```javascript
/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<object>} User object
 * @throws {NotFoundError} If user not found
 */
export const getUserById = async (userId) => {
  // Implementation
};
```

### API Documentation

Thêm Swagger comments cho endpoints mới:

```javascript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 */
router.get('/:id', authenticate, getUser);
```

### README Updates

Nếu thêm features mới, cập nhật:
- README.md
- API_EXAMPLES.md
- ARCHITECTURE.md (nếu thay đổi cấu trúc)

## 🗄️ Database Changes

### Migrations

1. Tạo migration mới:
   ```bash
   npm run migration:new your_migration_name
   ```

2. Viết migration SQL:
   ```sql
   -- Up migration
   CREATE TABLE ...
   
   -- Down migration (trong comment)
   -- DROP TABLE ...
   ```

3. Test migration:
   ```bash
   npm run migration:up
   ```

4. Test rollback (nếu cần):
   ```bash
   npm run supabase:reset
   ```

### Migration Best Practices

- Một migration = một thay đổi logic
- Luôn có down migration (rollback plan)
- Test trên local trước
- Không sửa migrations đã deployed
- Thêm indexes cho performance
- Sử dụng transactions khi cần

## 🔒 Security

### Checklist

- [ ] Không commit sensitive data (.env, keys, passwords)
- [ ] Validate tất cả user input
- [ ] Sử dụng parameterized queries
- [ ] Check authorization cho mọi endpoint
- [ ] Rate limiting cho sensitive endpoints
- [ ] Sanitize output data
- [ ] Use HTTPS trong production

### Common Vulnerabilities

❌ **SQL Injection:**
```javascript
// Bad
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// Good
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

❌ **XSS:**
```javascript
// Bad
res.send(`<h1>Welcome ${userName}</h1>`);

// Good
res.json({ message: `Welcome ${userName}` });
```

## 🐛 Bug Reports

### Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment:**
- OS: [e.g. Windows, macOS]
- Node version: [e.g. 18.0.0]
- Browser: [e.g. Chrome, Safari]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

## 📞 Questions?

- Open an issue với label `question`
- Email: your-email@example.com
- Discord: [Your Discord Server]

## 📜 License

Bằng việc contribute, bạn đồng ý rằng contributions của bạn sẽ được licensed dưới MIT License.

---

Cảm ơn bạn đã đóng góp! 🙏
