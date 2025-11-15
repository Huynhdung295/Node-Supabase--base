# 📡 API Examples

## 🔐 Authentication

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response:
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "user": { ... }
  }
}
```

### Get Profile

```bash
GET /api/v1/auth/me
Authorization: Bearer <token>
```

## 👥 Users

### Get All Users (Admin)

```bash
GET /api/v1/users?page=1&limit=10
Authorization: Bearer <admin-token>
```

### Get User by ID

```bash
GET /api/v1/users/:id
Authorization: Bearer <token>
```

### Update User

```bash
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "New Name"
}
```

### Delete User (Admin)

```bash
DELETE /api/v1/users/:id
Authorization: Bearer <admin-token>
```

## 📊 Metrics (Admin)

### Memory Usage

```bash
GET /api/v1/metrics/memory
Authorization: Bearer <admin-token>
```

### Request Metrics

```bash
GET /api/v1/metrics/requests
Authorization: Bearer <admin-token>
```

### System Info

```bash
GET /api/v1/metrics/system
Authorization: Bearer <admin-token>
```

## 🔧 Using with Frontend

### JavaScript/Fetch

```javascript
const API_URL = 'http://localhost:3000/api/v1';

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Get users
const getUsers = async (token) => {
  const response = await fetch(`${API_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1'
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
await api.post('/auth/login', { email, password });

// Get users
await api.get('/users');
```

## 📚 Swagger UI

**Interactive API docs:**
```
http://localhost:3000/api-docs
```

---

**Test APIs easily!** 📡
