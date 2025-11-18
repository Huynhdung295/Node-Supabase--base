# 🔌 Integrations Guide

## 🚀 One Command to Add Integrations

```bash
npm run add
# or
npm run install:integration
```

## 📦 Available Integrations

### 1. 🔥 Firebase
**What:** Firebase Admin SDK (Auth, Firestore, Storage)

**Use cases:**
- Firebase Authentication
- Firestore database
- Cloud Storage
- Push notifications

**Auto-generates:**
- `src/config/firebase.js` - Configuration
- `src/services/firebaseService.js` - Service methods
- Environment variables

### 2. 🔌 WebSocket
**What:** Real-time WebSocket with Socket.io

**Use cases:**
- Real-time chat
- Live notifications
- Collaborative editing
- Live updates

**Auto-generates:**
- `src/config/websocket.js` - Socket.io setup
- `src/services/websocketService.js` - Helper methods
- Room management

### 3. ⚡ Redis
**What:** Redis caching and session store

**Use cases:**
- API response caching
- Session storage
- Rate limiting
- Job queues

**Auto-generates:**
- `src/config/redis.js` - Redis client
- Cache helper methods
- Connection management

### 4. ☁️ AWS S3
**What:** AWS S3 file storage

**Use cases:**
- File uploads
- Image storage
- Document management
- CDN integration

**Auto-generates:**
- `src/config/s3.js` - S3 client
- `src/services/s3Service.js` - Upload/download methods
- Presigned URLs

### 5. 📧 SendGrid
**What:** Email service with SendGrid

**Use cases:**
- Transactional emails
- Marketing emails
- Email templates
- Email tracking

**Auto-generates:**
- `src/config/sendgrid.js` - SendGrid client
- `src/services/emailService.js` - Email methods (replaces placeholder)
- Template support

### 6. 💳 Stripe
**What:** Payment processing with Stripe

**Use cases:**
- Payment processing
- Subscriptions
- Invoicing
- Webhooks

**Auto-generates:**
- `src/config/stripe.js` - Stripe client
- `src/services/stripeService.js` - Payment methods
- Webhook handling

### 7. 📱 Twilio
**What:** SMS and WhatsApp messaging

**Use cases:**
- SMS notifications
- WhatsApp messages
- Phone verification
- 2FA

**Auto-generates:**
- `src/config/twilio.js` - Twilio client
- `src/services/twilioService.js` - Messaging methods

### 8. 🔍 Elasticsearch
**What:** Advanced search with Elasticsearch

**Use cases:**
- Full-text search
- Faceted search
- Analytics
- Log aggregation

**Auto-generates:**
- `src/config/elasticsearch.js` - ES client
- `src/services/searchService.js` - Search methods
- Index management

### 9. 📋 Bull Queue
**What:** Job queue with Bull (requires Redis)

**Use cases:**
- Background jobs
- Email queues
- Image processing
- Scheduled tasks

**Auto-generates:**
- `src/config/queue.js` - Bull setup
- `src/services/queueService.js` - Job methods
- Worker processes

### 10. 🔐 Passport.js
**What:** OAuth providers (Google, Facebook, GitHub)

**Use cases:**
- Social login
- OAuth authentication
- Multiple providers
- User profiles

**Auto-generates:**
- `src/config/passport.js` - Passport strategies
- `src/routes/oauthRoutes.js` - OAuth routes
- Provider callbacks

## 🎯 Complete Workflow

```bash
$ npm run add

🔌 Integration Installer

Add Firebase, WebSocket, Redis, and more to your API!

? Select integrations to install:
  ◉ 🔥 Firebase - Firebase Admin SDK (Auth, Firestore, Storage)
  ◉ 🔌 WebSocket - Real-time WebSocket with Socket.io
  ◉ ⚡ Redis - Redis caching and session store
  ◯ ☁️ AWS S3 - AWS S3 file storage
  ◯ 📧 SendGrid - Email service with SendGrid
  ◯ 💳 Stripe - Payment processing with Stripe
  ◯ 📱 Twilio - SMS and WhatsApp messaging
  ◯ 🔍 Elasticsearch - Advanced search
  ◯ 📋 Bull Queue - Job queue (requires Redis)
  ◯ 🔐 Passport.js - OAuth providers

🚀 Installing integrations...

==================================================
Installing 🔥 Firebase...
==================================================

📦 Installing packages: firebase-admin...
✅ Packages installed

🔥 Installing Firebase...

✅ Created src/config/firebase.js
✅ Created src/services/firebaseService.js
✅ Updated .env.example

✅ Firebase integration installed!

📝 Next steps:
1. Add Firebase credentials to .env
2. Import in server.js: import { initializeFirebase } from "./config/firebase.js"
3. Initialize: initializeFirebase()
4. Use firebaseService in your controllers

==================================================
Installing 🔌 WebSocket...
==================================================

📦 Installing packages: socket.io...
✅ Packages installed

🔌 Installing WebSocket...

✅ Created src/config/websocket.js
✅ Created src/services/websocketService.js

✅ WebSocket integration installed!

📝 Next steps:
1. Update src/server.js:
   import { createServer } from "http";
   import { initializeWebSocket } from "./config/websocket.js";
   const server = createServer(app);
   initializeWebSocket(server);
   server.listen(PORT, ...)
2. Use websocketService in your controllers

✅ All integrations installed successfully!
```

## 📚 Usage Examples

### Firebase Example

```javascript
// In your controller
import { createDocument, getDocument } from '../services/firebaseService.js';

export const createPost = async (req, res) => {
  const post = await createDocument('posts', req.body);
  res.json(post);
};

export const getPost = async (req, res) => {
  const post = await getDocument('posts', req.params.id);
  res.json(post);
};
```

### WebSocket Example

```javascript
// In your controller
import { sendNotification, broadcast } from '../services/websocketService.js';

export const createOrder = async (req, res) => {
  const order = await createOrderInDB(req.body);
  
  // Send notification to user
  sendNotification(req.user.id, {
    type: 'order_created',
    order
  });
  
  // Broadcast to admins
  broadcast('new_order', order);
  
  res.json(order);
};
```

### Redis Caching Example

```javascript
// In your controller
import { setCache, getCache } from '../config/redis.js';

export const getProducts = async (req, res) => {
  // Try cache first
  const cached = await getCache('products');
  if (cached) {
    return res.json(cached);
  }
  
  // Fetch from database
  const products = await fetchProductsFromDB();
  
  // Cache for 1 hour
  await setCache('products', products, 3600);
  
  res.json(products);
};
```

## 🎯 Best Practices

### 1. Environment Variables
Always add credentials to `.env`, never commit them:
```bash
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
REDIS_URL=redis://localhost:6379
```

### 2. Error Handling
All integrations include error handling:
```javascript
try {
  await firebaseOperation();
} catch (error) {
  logger.error('Firebase error', { error: error.message });
  throw error;
}
```

### 3. Initialization
Initialize in `server.js` before starting server:
```javascript
// src/server.js
import { initializeFirebase } from './config/firebase.js';
import { initializeRedis } from './config/redis.js';

// Initialize integrations
initializeFirebase();
await initializeRedis();

// Then start server
app.listen(PORT, ...);
```

### 4. Service Layer
Use services in controllers, not direct integration:
```javascript
// ✅ Good
import { sendEmail } from '../services/emailService.js';

// ❌ Bad
import sendgrid from '@sendgrid/mail';
```

## 🔧 Manual Setup

If you prefer manual setup, check generated files:
- `src/config/` - Configuration files
- `src/services/` - Service methods
- `.env.example` - Required variables

## 📊 Integration Matrix

| Integration | Auto-Config | Auto-Service | Auto-Routes | Env Vars |
|-------------|-------------|--------------|-------------|----------|
| Firebase | ✅ | ✅ | ❌ | 3 |
| WebSocket | ✅ | ✅ | ❌ | 0 |
| Redis | ✅ | ✅ | ❌ | 1 |
| AWS S3 | ✅ | ✅ | ❌ | 4 |
| SendGrid | ✅ | ✅ | ❌ | 2 |
| Stripe | ✅ | ✅ | ✅ | 3 |
| Twilio | ✅ | ✅ | ❌ | 3 |
| Elasticsearch | ✅ | ✅ | ❌ | 3 |
| Bull Queue | ✅ | ✅ | ❌ | 1 |
| Passport.js | ✅ | ❌ | ✅ | 4+ |

## 🎊 Summary

**One command to add any integration:**
- ✅ Auto-install packages
- ✅ Auto-generate config
- ✅ Auto-generate services
- ✅ Auto-update .env.example
- ✅ Best practices built-in
- ✅ Production-ready code

**Add Firebase, WebSocket, Redis, and more in 1 minute!** 🚀✨

---

**Next:** [CLI Guide](CLI.md) | [Quick Start](QUICK_START.md)
