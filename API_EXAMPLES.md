# 📖 API Examples - Ví Dụ Sử Dụng API

Collection các ví dụ thực tế để sử dụng API.

## 🔐 Authentication Examples

### 1. Đăng Ký User Mới

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "full_name": "John Doe"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "newuser@example.com",
      "full_name": "John Doe",
      "role": "user",
      "tier_vip": "silver",
      "is_active": true,
      "created_at": "2024-11-13T10:00:00Z"
    }
  }
}
```

### 2. Đăng Nhập

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjcyk1hraBKb-9pDUo...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "profile": { ... }
  }
}
```

💡 **Lưu `access_token` để dùng cho các requests tiếp theo!**

### 3. Lấy Thông Tin User Hiện Tại

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "profile": {
      "full_name": "John Doe",
      "role": "user",
      "tier_vip": "silver"
    }
  }
}
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "v1.MRjcyk1hraBKb-9pDUo..."
  }'
```

### 5. Đăng Xuất

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <your-token>"
```

## 👥 User Management Examples

### 1. Lấy Danh Sách Users (Admin Only)

```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "email": "user1@example.com",
      "full_name": "User One",
      "role": "user",
      "tier_vip": "silver",
      "is_active": true,
      "created_at": "2024-11-13T10:00:00Z"
    },
    {
      "id": "...",
      "email": "user2@example.com",
      "full_name": "User Two",
      "role": "aff",
      "tier_vip": "gold",
      "is_active": true,
      "created_at": "2024-11-13T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Filter Users by Role

```bash
curl -X GET "http://localhost:3000/api/v1/users?role=admin" \
  -H "Authorization: Bearer <admin-token>"
```

### 3. Filter Users by Tier

```bash
curl -X GET "http://localhost:3000/api/v1/users?tier=diamond" \
  -H "Authorization: Bearer <admin-token>"
```

### 4. Lấy User Theo ID

```bash
curl -X GET http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <your-token>"
```

### 5. Update Profile (User)

User chỉ có thể update `full_name` và `avatar_url`:

```bash
curl -X PUT http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe Updated",
    "avatar_url": "https://example.com/avatar.jpg"
  }'
```

### 6. Update User (Admin)

Admin có thể update tất cả fields:

```bash
curl -X PUT http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "role": "aff",
    "tier_vip": "gold",
    "is_active": true
  }'
```

### 7. Nâng Cấp Tier VIP (Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000/upgrade-tier \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "diamond"
  }'
```

**Response:**
```json
{
  "message": "Tier upgraded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tier_vip": "diamond",
    "updated_at": "2024-11-13T12:00:00Z"
  }
}
```

### 8. Thay Đổi Role (Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000/change-role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "aff"
  }'
```

### 9. Xóa User (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## 🔄 Complete User Flow Example

### Scenario: Tạo user mới và nâng cấp lên Gold tier

```bash
# 1. Admin login
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Tạo user mới
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"premium@example.com",
    "password":"premium123",
    "full_name":"Premium User"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.user.id')

# 3. Nâng cấp tier lên Gold
curl -X POST http://localhost:3000/api/v1/users/$USER_ID/upgrade-tier \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier":"gold"}'

# 4. Verify
curl -X GET http://localhost:3000/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🚨 Error Handling Examples

### 1. Invalid Credentials

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

**Response (401):**
```json
{
  "error": "UnauthorizedError",
  "message": "Invalid email or password"
}
```

### 2. Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Response (400):**
```json
{
  "error": "ValidationError",
  "message": "Email, password, and full_name are required"
}
```

### 3. Unauthorized Access

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer invalid-token"
```

**Response (401):**
```json
{
  "error": "UnauthorizedError",
  "message": "Invalid or expired token"
}
```

### 4. Forbidden (Insufficient Permissions)

```bash
# User trying to access admin endpoint
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <user-token>"
```

**Response (403):**
```json
{
  "error": "ForbiddenError",
  "message": "Access denied. Required roles: admin"
}
```

### 5. Resource Not Found

```bash
curl -X GET http://localhost:3000/api/v1/users/invalid-uuid \
  -H "Authorization: Bearer <admin-token>"
```

**Response (404):**
```json
{
  "error": "NotFoundError",
  "message": "User not found"
}
```

### 6. Rate Limit Exceeded

```bash
# After 100 requests in 15 minutes
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Response (429):**
```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded the rate limit. Please try again later."
}
```

## 🧪 Testing with JavaScript/Fetch

### Browser Console Example

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
});

const { access_token } = await loginResponse.json();

// 2. Get users
const usersResponse = await fetch('http://localhost:3000/api/v1/users', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const users = await usersResponse.json();
console.log(users);
```

## 🔧 Testing with Postman

### Setup Environment Variables

1. Tạo environment mới: "Supabase Local"
2. Thêm variables:
   - `base_url`: `http://localhost:3000/api/v1`
   - `access_token`: (sẽ set tự động)

### Pre-request Script (Login)

```javascript
// Trong request Login, tab "Tests"
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("access_token", response.access_token);
}
```

### Authorization Header

Trong các requests khác:
- Type: Bearer Token
- Token: `{{access_token}}`

## 📱 Testing with Next.js Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
}

export async function getUsers(token: string) {
  const response = await fetch(`${API_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
}

// Usage in component
const { access_token } = await login('admin@example.com', 'admin123');
const { data: users } = await getUsers(access_token);
```

## 💡 Tips

1. **Lưu token**: Store access_token trong localStorage hoặc cookie
2. **Refresh token**: Implement auto-refresh khi token hết hạn
3. **Error handling**: Luôn check response status và handle errors
4. **CORS**: Nếu call từ browser, đảm bảo CORS_ORIGIN được config đúng
5. **Rate limiting**: Implement retry logic với exponential backoff

## 🎯 Common Use Cases

### Use Case 1: User Registration Flow

```bash
# 1. Register
# 2. Login
# 3. Get profile
# 4. Update profile
```

### Use Case 2: Admin User Management

```bash
# 1. Admin login
# 2. Get all users
# 3. Filter by role/tier
# 4. Update user tier
# 5. Change user role
```

### Use Case 3: VIP Upgrade Flow

```bash
# 1. User login
# 2. Check current tier
# 3. Request upgrade (payment flow)
# 4. Admin approves and upgrades tier
# 5. User gets new permissions
```
