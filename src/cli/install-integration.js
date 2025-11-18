#!/usr/bin/env node
// Integration/Plugin Installer - Add Firebase, WebSocket, Redis, etc.

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTEGRATIONS = {
  firebase: {
    name: '🔥 Firebase',
    description: 'Firebase Admin SDK (Auth, Firestore, Storage)',
    packages: ['firebase-admin'],
    envVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
  },
  websocket: {
    name: '🔌 WebSocket',
    description: 'Real-time WebSocket with Socket.io',
    packages: ['socket.io'],
    envVars: ['WEBSOCKET_PORT']
  },
  redis: {
    name: '⚡ Redis',
    description: 'Redis caching and session store',
    packages: ['redis', 'connect-redis', 'express-session'],
    envVars: ['REDIS_URL']
  },
  s3: {
    name: '☁️ AWS S3',
    description: 'AWS S3 file storage',
    packages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
    envVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']
  },
  sendgrid: {
    name: '📧 SendGrid',
    description: 'Email service with SendGrid',
    packages: ['@sendgrid/mail'],
    envVars: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
  },
  stripe: {
    name: '💳 Stripe',
    description: 'Payment processing with Stripe',
    packages: ['stripe'],
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET']
  },
  twilio: {
    name: '📱 Twilio',
    description: 'SMS and WhatsApp messaging',
    packages: ['twilio'],
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
  },
  elasticsearch: {
    name: '🔍 Elasticsearch',
    description: 'Advanced search with Elasticsearch',
    packages: ['@elastic/elasticsearch'],
    envVars: ['ELASTICSEARCH_NODE', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD']
  },
  bull: {
    name: '📋 Bull Queue',
    description: 'Job queue with Bull (requires Redis)',
    packages: ['bull'],
    envVars: ['REDIS_URL'],
    requires: ['redis']
  },
  passport: {
    name: '🔐 Passport.js',
    description: 'OAuth providers (Google, Facebook, GitHub)',
    packages: ['passport', 'passport-google-oauth20', 'passport-facebook', 'passport-github2'],
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']
  }
};

// ============================================
// FIREBASE INTEGRATION
// ============================================

const installFirebase = () => {
  console.log('\n🔥 Installing Firebase...\n');

  // 1. Create config
  const configPath = path.join(process.cwd(), 'src', 'config', 'firebase.js');
  const configCode = `// Firebase Admin SDK Configuration

import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

let firebaseApp;

export const initializeFirebase = () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: \`\${process.env.FIREBASE_PROJECT_ID}.appspot.com\`
    });

    logger.success('Firebase initialized');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase initialization failed', { error: error.message });
    throw error;
  }
};

export const getFirestore = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.firestore();
};

export const getAuth = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.auth();
};

export const getStorage = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.storage();
};

export default { initializeFirebase, getFirestore, getAuth, getStorage };
`;

  fs.writeFileSync(configPath, configCode);
  console.log('✅ Created src/config/firebase.js');

  // 2. Create service
  const servicePath = path.join(process.cwd(), 'src', 'services', 'firebaseService.js');
  const serviceCode = `// Firebase Service

import { getFirestore, getAuth, getStorage } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

/**
 * Firestore Operations
 */
export const createDocument = async (collection, data) => {
  try {
    const db = getFirestore();
    const docRef = await db.collection(collection).add(data);
    logger.info(\`Document created in \${collection}\`, { id: docRef.id });
    return { id: docRef.id, ...data };
  } catch (error) {
    logger.error('Firestore create error', { error: error.message });
    throw error;
  }
};

export const getDocument = async (collection, id) => {
  try {
    const db = getFirestore();
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('Firestore get error', { error: error.message });
    throw error;
  }
};

export const updateDocument = async (collection, id, data) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(id).update(data);
    logger.info(\`Document updated in \${collection}\`, { id });
    return { id, ...data };
  } catch (error) {
    logger.error('Firestore update error', { error: error.message });
    throw error;
  }
};

export const deleteDocument = async (collection, id) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(id).delete();
    logger.info(\`Document deleted from \${collection}\`, { id });
    return true;
  } catch (error) {
    logger.error('Firestore delete error', { error: error.message });
    throw error;
  }
};

/**
 * Firebase Auth Operations
 */
export const verifyFirebaseToken = async (token) => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    logger.error('Firebase token verification failed', { error: error.message });
    throw error;
  }
};

export const createFirebaseUser = async (email, password, displayName) => {
  try {
    const auth = getAuth();
    const user = await auth.createUser({
      email,
      password,
      displayName
    });
    logger.info('Firebase user created', { uid: user.uid });
    return user;
  } catch (error) {
    logger.error('Firebase user creation failed', { error: error.message });
    throw error;
  }
};

/**
 * Firebase Storage Operations
 */
export const uploadFile = async (filePath, destination) => {
  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    await bucket.upload(filePath, { destination });
    logger.info('File uploaded to Firebase Storage', { destination });
    return \`https://storage.googleapis.com/\${bucket.name}/\${destination}\`;
  } catch (error) {
    logger.error('Firebase upload error', { error: error.message });
    throw error;
  }
};

export default {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  verifyFirebaseToken,
  createFirebaseUser,
  uploadFile
};
`;

  fs.writeFileSync(servicePath, serviceCode);
  console.log('✅ Created src/services/firebaseService.js');

  // 3. Update .env.example
  updateEnvExample(['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']);

  console.log('\n✅ Firebase integration installed!\n');
  console.log('📝 Next steps:');
  console.log('1. Add Firebase credentials to .env');
  console.log('2. Import in server.js: import { initializeFirebase } from "./config/firebase.js"');
  console.log('3. Initialize: initializeFirebase()');
  console.log('4. Use firebaseService in your controllers\n');
};

// ============================================
// WEBSOCKET INTEGRATION
// ============================================

const installWebSocket = () => {
  console.log('\n🔌 Installing WebSocket...\n');

  // 1. Create config
  const configPath = path.join(process.cwd(), 'src', 'config', 'websocket.js');
  const configCode = `// WebSocket Configuration with Socket.io

import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io;

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });

    // Example: Join room
    socket.on('join', (room) => {
      socket.join(room);
      logger.info('Client joined room', { socketId: socket.id, room });
    });

    // Example: Send message
    socket.on('message', (data) => {
      logger.info('Message received', { socketId: socket.id, data });
      io.to(data.room).emit('message', data);
    });
  });

  logger.success('WebSocket initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

export const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export default { initializeWebSocket, getIO, emitToRoom, emitToAll };
`;

  fs.writeFileSync(configPath, configCode);
  console.log('✅ Created src/config/websocket.js');

  // 2. Create service
  const servicePath = path.join(process.cwd(), 'src', 'services', 'websocketService.js');
  const serviceCode = `// WebSocket Service

import { getIO, emitToRoom, emitToAll } from '../config/websocket.js';
import { logger } from '../utils/logger.js';

/**
 * Send notification to specific user
 */
export const sendNotification = (userId, notification) => {
  try {
    emitToRoom(\`user_\${userId}\`, 'notification', notification);
    logger.info('Notification sent', { userId });
  } catch (error) {
    logger.error('Failed to send notification', { error: error.message });
  }
};

/**
 * Broadcast message to all connected clients
 */
export const broadcast = (event, data) => {
  try {
    emitToAll(event, data);
    logger.info('Broadcast sent', { event });
  } catch (error) {
    logger.error('Failed to broadcast', { error: error.message });
  }
};

/**
 * Send message to specific room
 */
export const sendToRoom = (room, event, data) => {
  try {
    emitToRoom(room, event, data);
    logger.info('Message sent to room', { room, event });
  } catch (error) {
    logger.error('Failed to send to room', { error: error.message });
  }
};

export default { sendNotification, broadcast, sendToRoom };
`;

  fs.writeFileSync(servicePath, serviceCode);
  console.log('✅ Created src/services/websocketService.js');

  // 3. Update server.js instructions
  console.log('\n✅ WebSocket integration installed!\n');
  console.log('📝 Next steps:');
  console.log('1. Update src/server.js:');
  console.log('   import { createServer } from "http";');
  console.log('   import { initializeWebSocket } from "./config/websocket.js";');
  console.log('   const server = createServer(app);');
  console.log('   initializeWebSocket(server);');
  console.log('   server.listen(PORT, ...)');
  console.log('2. Use websocketService in your controllers\n');
};

// ============================================
// REDIS INTEGRATION
// ============================================

const installRedis = () => {
  console.log('\n⚡ Installing Redis...\n');

  const configPath = path.join(process.cwd(), 'src', 'config', 'redis.js');
  const configCode = `// Redis Configuration

import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient;

export const initializeRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('connect', () => logger.success('Redis connected'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed', { error: error.message });
    throw error;
  }
};

export const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
};

// Cache helpers
export const setCache = async (key, value, ttl = 3600) => {
  try {
    const client = getRedis();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis set error', { error: error.message });
  }
};

export const getCache = async (key) => {
  try {
    const client = getRedis();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get error', { error: error.message });
    return null;
  }
};

export const deleteCache = async (key) => {
  try {
    const client = getRedis();
    await client.del(key);
  } catch (error) {
    logger.error('Redis delete error', { error: error.message });
  }
};

export default { initializeRedis, getRedis, setCache, getCache, deleteCache };
`;

  fs.writeFileSync(configPath, configCode);
  console.log('✅ Created src/config/redis.js');

  updateEnvExample(['REDIS_URL']);

  console.log('\n✅ Redis integration installed!\n');
  console.log('📝 Next steps:');
  console.log('1. Start Redis: docker run -d -p 6379:6379 redis');
  console.log('2. Add REDIS_URL to .env');
  console.log('3. Import in server.js: import { initializeRedis } from "./config/redis.js"');
  console.log('4. Initialize: await initializeRedis()\n');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const updateEnvExample = (vars) => {
  const envPath = path.join(process.cwd(), '.env.example');
  let content = fs.readFileSync(envPath, 'utf-8');
  
  vars.forEach(varName => {
    if (!content.includes(varName)) {
      content += `\n${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}`;
    }
  });
  
  fs.writeFileSync(envPath, content);
  console.log('✅ Updated .env.example');
};

const installPackages = (packages) => {
  console.log(`\n📦 Installing packages: ${packages.join(', ')}...\n`);
  try {
    execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
    console.log('\n✅ Packages installed');
  } catch (error) {
    console.error('❌ Package installation failed');
    throw error;
  }
};

// ============================================
// MAIN CLI
// ============================================

const main = async () => {
  console.log('\n🔌 Integration Installer\n');
  console.log('Add Firebase, WebSocket, Redis, and more to your API!\n');

  const { integrations } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'integrations',
      message: 'Select integrations to install:',
      choices: Object.entries(INTEGRATIONS).map(([key, value]) => ({
        name: `${value.name} - ${value.description}`,
        value: key
      }))
    }
  ]);

  if (integrations.length === 0) {
    console.log('\n⚠️  No integrations selected. Exiting.\n');
    return;
  }

  console.log('\n🚀 Installing integrations...\n');

  for (const integration of integrations) {
    const config = INTEGRATIONS[integration];
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Installing ${config.name}...`);
    console.log('='.repeat(50));

    // Install packages
    installPackages(config.packages);

    // Run integration-specific setup
    if (integration === 'firebase') installFirebase();
    else if (integration === 'websocket') installWebSocket();
    else if (integration === 'redis') installRedis();
    // Add more integrations here
  }

  console.log('\n✅ All integrations installed successfully!\n');
  console.log('📝 Don\'t forget to:');
  console.log('1. Add required environment variables to .env');
  console.log('2. Initialize integrations in src/server.js');
  console.log('3. Restart your server\n');
};

main().catch(console.error);
