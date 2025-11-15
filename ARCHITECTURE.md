# 🏗️ Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js, React, Mobile App, etc.)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js API Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │ Controllers  │  │  Middleware  │     │
│  │              │  │              │  │              │     │
│  │ - Auth       │  │ - Auth Logic │  │ - Auth       │     │
│  │ - Users      │  │ - User CRUD  │  │ - Validation │     │
│  │ - ...        │  │ - ...        │  │ - Error      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │ Supabase Client
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  PostgreSQL  │  │   Storage    │     │
│  │              │  │              │  │              │     │
│  │ - JWT        │  │ - Tables     │  │ - Files      │     │
│  │ - Sessions   │  │ - RLS        │  │ - Images     │     │
│  │ - Providers  │  │ - Functions  │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Client Layer
- UI/UX
- User interactions
- API calls
- State management
- Token storage

### 2. API Server Layer
- Request routing
- Business logic
- Validation
- Authorization
- Error handling
- Rate limiting
- API documentation

### 3. Supabase Layer
- Authentication
- Database operations
- Row Level Security
- Real-time subscriptions
- File storage

## Request Flow

### Authentication Flow

```
User                API Server              Supabase
  │                     │                      │
  │  POST /register     │                      │
  ├────────────────────>│                      │
  │                     │  createUser()        │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  <user created>      │
  │                     │<─────────────────────┤
  │                     │                      │
  │                     │  insert profile      │
  │                     ├─────────────────────>│
  │                     │                      │
  │  <201 Created>      │                      │
  │<────────────────────┤                      │
  │                     │                      │
  │  POST /login        │                      │
  ├────────────────────>│                      │
  │                     │  signInWithPassword()│
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  <session + token>   │
  │                     │<─────────────────────┤
  │                     │                      │
  │  <200 + token>      │                      │
  │<────────────────────┤                      │
  │                     │                      │
```

### Protected Request Flow

```
User                API Server              Supabase
  │                     │                      │
  │  GET /users         │                      │
  │  + Bearer token     │                      │
  ├────────────────────>│                      │
  │                     │                      │
  │                     │  authenticate()      │
  │                     │  middleware          │
  │                     │                      │
  │                     │  getUser(token)      │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  <user data>         │
  │                     │<─────────────────────┤
  │                     │                      │
  │                     │  authorize()         │
  │                     │  check role          │
  │                     │                      │
  │                     │  query profiles      │
  │                     ├─────────────────────>│
  │                     │                      │
  │                     │  <profiles data>     │
  │                     │<─────────────────────┤
  │                     │                      │
  │  <200 + data>       │                      │
  │<────────────────────┤                      │
  │                     │                      │
```

## Database Schema

### Tables

#### profiles
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
full_name       TEXT
avatar_url      TEXT
role            ENUM('admin', 'user', 'aff')
tier_vip        ENUM('silver', 'gold', 'diamond')
is_active       BOOLEAN
metadata        JSONB
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### user_sessions
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
ip_address      TEXT
user_agent      TEXT
logged_in_at    TIMESTAMPTZ
logged_out_at   TIMESTAMPTZ
is_active       BOOLEAN
```

#### audit_logs
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
action          TEXT
table_name      TEXT
record_id       UUID
old_data        JSONB
new_data        JSONB
ip_address      TEXT
created_at      TIMESTAMPTZ
```

### Relationships

```
auth.users (Supabase Auth)
    │
    │ 1:1
    ▼
profiles
    │
    │ 1:N
    ▼
user_sessions

profiles
    │
    │ 1:N
    ▼
audit_logs
```

## Security Architecture

### Row Level Security (RLS)

```sql
-- Profiles table policies
1. Admins can do everything
2. Users can view own profile
3. Users can update own profile (except role/tier)
4. Public profiles are viewable by everyone

-- User sessions policies
1. Users can view own sessions
2. Admins can view all sessions

-- Audit logs policies
1. Only admins can view audit logs
```

### Authentication Layers

```
1. JWT Token Validation
   ├─> Verify signature
   ├─> Check expiration
   └─> Extract user ID

2. User Verification
   ├─> Get user from Supabase
   ├─> Check user exists
   └─> Check is_active

3. Authorization
   ├─> Check role
   ├─> Check tier
   └─> Check permissions
```

### Security Middleware Stack

```
Request
  │
  ▼
Rate Limiter (100 req/15min)
  │
  ▼
Helmet (Security headers)
  │
  ▼
CORS (Origin validation)
  │
  ▼
Body Parser
  │
  ▼
Authentication (if required)
  │
  ▼
Authorization (if required)
  │
  ▼
Validation (Joi schemas)
  │
  ▼
Controller
  │
  ▼
Response
```

## Design Patterns

### 1. Repository Pattern
```javascript
// Supabase client acts as repository
const { data } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### 2. Middleware Pattern
```javascript
// Composable middleware
router.get('/users', 
  authenticate,           // Auth middleware
  authorize('admin'),     // Authorization middleware
  validate(schemas.user), // Validation middleware
  getUsers               // Controller
);
```

### 3. Error Handling Pattern
```javascript
// Custom error classes
throw new ValidationError('Invalid input');
throw new UnauthorizedError('Not authenticated');
throw new ForbiddenError('Access denied');

// Global error handler
app.use(errorHandler);
```

### 4. Factory Pattern
```javascript
// Supabase client factory
export const createSupabaseClient = (useServiceRole = false) => {
  return createClient(
    supabaseUrl,
    useServiceRole ? serviceRoleKey : anonKey
  );
};
```

## API Design Principles

### RESTful Conventions

```
GET    /users          - List all users
GET    /users/:id      - Get specific user
POST   /users          - Create user (via /auth/register)
PUT    /users/:id      - Update user
DELETE /users/:id      - Delete user

POST   /users/:id/upgrade-tier  - Action endpoint
POST   /users/:id/change-role   - Action endpoint
```

### Response Format

```javascript
// Success
{
  data: { ... },
  message: "Success message",
  pagination: { ... } // if applicable
}

// Error
{
  error: "ErrorType",
  message: "Error message",
  details: { ... } // if applicable
}
```

### HTTP Status Codes

```
200 OK              - Success
201 Created         - Resource created
400 Bad Request     - Validation error
401 Unauthorized    - Not authenticated
403 Forbidden       - Not authorized
404 Not Found       - Resource not found
429 Too Many Requests - Rate limit exceeded
500 Internal Error  - Server error
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    │
    ├─> API Server 1
    ├─> API Server 2
    └─> API Server 3
         │
         └─> Supabase (shared)
```

### Caching Strategy

```javascript
// Redis cache (future implementation)
const cachedUser = await redis.get(`user:${userId}`);
if (cachedUser) return cachedUser;

const user = await supabase.from('profiles').select('*').eq('id', userId);
await redis.set(`user:${userId}`, user, 'EX', 3600);
```

### Database Optimization

1. **Indexes**: Created on frequently queried columns
2. **Connection Pooling**: Supabase handles this
3. **Query Optimization**: Use select() to limit fields
4. **Pagination**: Implemented in list endpoints

## Monitoring & Logging

### Audit Logging

```sql
-- Automatic logging via triggers
INSERT INTO audit_logs (user_id, action, table_name, ...)
VALUES (...);
```

### Error Logging

```javascript
console.error('Error:', {
  message: error.message,
  stack: error.stack,
  user: req.user?.id,
  path: req.path,
  method: req.method
});
```

### Performance Monitoring

```javascript
// Request timing
const start = Date.now();
// ... process request
const duration = Date.now() - start;
console.log(`Request took ${duration}ms`);
```

## Testing Strategy

### Unit Tests
- Controllers
- Middleware
- Utilities

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete user flows
- Admin operations
- Error scenarios

## Deployment Architecture

### Development
```
Local Machine
├─> Supabase Local (Docker)
└─> API Server (npm run dev)
```

### Production
```
Vercel/Railway/Heroku
├─> API Server
└─> Supabase Cloud
```

## Future Enhancements

1. **Redis Caching**: For frequently accessed data
2. **WebSocket Support**: Real-time features
3. **File Upload**: Avatar and document management
4. **Email Service**: Notifications and verification
5. **Analytics**: User behavior tracking
6. **Admin Dashboard**: Web UI for management
7. **API Versioning**: Support multiple API versions
8. **GraphQL**: Alternative to REST
9. **Microservices**: Split into smaller services
10. **Message Queue**: For async operations
