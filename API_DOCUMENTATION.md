# Exchange Management API Documentation

## Overview
This is a comprehensive API system for managing cryptocurrency exchange integrations, user tiers, commissions, and withdrawal claims.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints by Category

### 1. PUBLIC & AUTH APIs

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - User login  
- `POST /auth/recover` - Password recovery
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

#### Public Settings
- `GET /settings/public` - Get public system settings
- `GET /tiers` - Get all available tiers
- `GET /exchanges` - Get active exchanges

### 2. USER APIs (Requires Authentication)

#### Profile Management
- `GET /me/profile` - Get own profile
- `PUT /me/profile` - Update own profile
- `GET /me/balance` - Get available balance

#### Exchange Connections
- `GET /me/connections` - Get connected exchanges
- `POST /me/connections` - Connect to new exchange

#### Transactions & Claims
- `GET /me/transactions` - Get transaction history
- `POST /me/claims` - Create withdrawal request
- `POST /me/claims/confirm` - Confirm withdrawal with OTP
- `GET /me/claims` - Get claim history

### 3. ADMIN APIs (Admin Role Required)

#### User Management
- `GET /admin/users` - Get all users
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id/role` - Update user role/status
- `PUT /admin/users/links/:link_id` - Set custom commission rate

#### Exchange Management
- `GET /admin/exchanges` - Get all exchanges
- `POST /admin/exchanges` - Create exchange
- `PUT /admin/exchanges/:id` - Update exchange
- `DELETE /admin/exchanges/:id` - Delete exchange
- `GET /admin/exchanges/:id/tiers` - Get exchange tier configs
- `PUT /admin/exchanges/tiers` - Update tier configs

#### Tier Management
- `POST /admin/tiers` - Create tier
- `PUT /admin/tiers/:id` - Update tier
- `DELETE /admin/tiers/:id` - Delete tier

#### System Management
- `GET /admin/crawler-tokens` - Get crawler tokens
- `PUT /admin/crawler-tokens` - Update crawler token
- `GET /admin/settings` - Get system settings
- `PUT /admin/settings` - Update system settings
- `GET /admin/claims` - Get all claims
- `GET /admin/stats` - Get dashboard statistics

### 4. CS APIs (CS or Admin Role Required)

#### Connection Management
- `GET /cs/connections` - Get pending connections
- `PUT /cs/connections/:id` - Approve/reject connection

#### Claim Management
- `GET /cs/claims` - Get pending claims
- `PUT /cs/claims/:id` - Process claim (approve/reject)

#### Support
- `GET /cs/users/:id` - Get user info for support
- `GET /cs/dashboard` - Get CS dashboard stats

## Data Models

### User Profile
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user|cs|admin|system",
  "ref_code": "ABC12345",
  "referrer_id": "uuid",
  "current_tier_id": 1,
  "full_name": "John Doe",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "gender": "male",
  "avatar_url": "https://...",
  "location": {"city": "New York", "country": "US"},
  "status": "active|inactive|banned",
  "is_email_verified": true,
  "last_sign_in_at": "2023-11-25T10:00:00Z",
  "created_at": "2023-11-25T10:00:00Z",
  "tiers": {
    "id": 1,
    "name": "Bronze",
    "slug": "bronze",
    "color_hex": "#CD7F32"
  }
}
```

### Exchange
```json
{
  "id": 1,
  "code": "BINANCE",
  "name": "Binance",
  "status": "active|inactive|maintenance",
  "logo_url": "https://...",
  "config_json": {},
  "created_at": "2023-11-25T10:00:00Z"
}
```

### Exchange Connection
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "exchange_id": 1,
  "exchange_uid": "12345678",
  "exchange_email": "user@exchange.com",
  "status": "pending|verified|rejected",
  "custom_commission_rate": 0.15,
  "total_volume": 1000.50,
  "created_at": "2023-11-25T10:00:00Z"
}
```

### Transaction
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "link_id": "uuid",
  "exchange_id": 1,
  "raw_volume": 1000.00,
  "commission_amount": 15.00,
  "rate_snapshot": 0.015,
  "transaction_date": "2023-11-25T10:00:00Z",
  "raw_data": {},
  "created_at": "2023-11-25T10:00:00Z"
}
```

### Claim Request
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 100.00,
  "status": "pending|wait_email_confirm|approved|rejected",
  "verification_code": "ABC123",
  "cs_note": "Processed successfully",
  "proof_img_url": "https://...",
  "created_at": "2023-11-25T10:00:00Z",
  "updated_at": "2023-11-25T10:00:00Z"
}
```

## Commission Calculation Logic

The system calculates commissions with the following priority:

1. **Custom Rate**: Check `user_exchange_links.custom_commission_rate`
2. **Tier Rate**: If no custom rate, use `exchange_tier_configs.default_commission_rate` based on user's current tier
3. **Formula**: `Commission = Raw Volume × Rate`

## Tier Auto-Upgrade Logic

When new transactions are processed:
1. Update `user_exchange_links.total_volume`
2. Check if total volume meets requirements in `exchange_tier_configs.required_points`
3. Auto-upgrade `profiles.current_tier_id` if qualified

## Security & Permissions

### Row Level Security (RLS)
- Users can only access their own data
- CS can view user data for support
- Admin has full access
- System role for automated processes

### API Security
- JWT token validation
- Role-based access control
- Rate limiting
- Input validation
- SQL injection protection

## Error Responses

All errors follow this format:
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2023-11-25T10:00:00Z"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Admin endpoints: 2000 requests/minute

## Pagination

List endpoints support pagination:
```
GET /api/admin/users?page=1&limit=20
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Webhooks & Events

The system can trigger webhooks for:
- New user registration
- Exchange connection approved
- Claim processed
- Tier upgraded

## Development Setup

1. Install dependencies: `npm install`
2. Set up Supabase project
3. Run migrations: `npm run migration:up`
4. Seed data: `npm run seed`
5. Start server: `npm run dev`

## API Testing

Use the built-in Swagger documentation:
```
http://localhost:3000/api-docs
```

## Support

For API support, contact the development team or check the CS dashboard for user-related issues.