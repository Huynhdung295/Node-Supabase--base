#!/usr/bin/env node
// Integration Installer - Complete with all integrations

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

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
    envVars: []
  },
  redis: {
    name: '⚡ Redis',
    description: 'Redis caching and session store',
    packages: ['redis'],
    envVars: ['REDIS_URL']
  },
  sendgrid: {
    name: '📧 SendGrid',
    description: 'Email service with SendGrid',
    packages: ['@sendgrid/mail'],
    envVars: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
  },
  s3: {
    name: '☁️ AWS S3',
    description: 'AWS S3 file storage',
    packages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
    envVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']
  }
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const updateEnvExample = (vars) => {
  const envPath = path.join(process.cwd(), '.env.example');
  let content = fs.readFileSync(envPath, 'utf-8');
  
  vars.forEach(varName => {
    if (!content.includes(varName)) {
      content += `\n${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}`;
    }
  });
  
  fs.writeFileSync(envPath, content);
};

const installPackages = (packages) => {
  console.log(`\n📦 Installing: ${packages.join(', ')}...`);
  try {
    execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Packages installed\n');
  } catch (error) {
    console.error('❌ Installation failed');
    throw error;
  }
};

// Integration installers
const INSTALLERS = {
  firebase: () => {
    console.log('🔥 Setting up Firebase...\n');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 'firebase.js');
    fs.writeFileSync(configPath, `import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

let firebaseApp;

export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
  
  logger.success('Firebase initialized');
  return firebaseApp;
};

export const getFirestore = () => admin.firestore();
export const getAuth = () => admin.auth();
export const getStorage = () => admin.storage();

export default { initializeFirebase, getFirestore, getAuth, getStorage };
`);
    
    const servicePath = path.join(process.cwd(), 'src', 'services', 'firebaseService.js');
    fs.writeFileSync(servicePath, `import { getFirestore, getAuth, getStorage } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export const createDocument = async (collection, data) => {
  const db = getFirestore();
  const docRef = await db.collection(collection).add(data);
  logger.info(\`Document created in \${collection}\`, { id: docRef.id });
  return { id: docRef.id, ...data };
};

export const getDocument = async (collection, id) => {
  const db = getFirestore();
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export default { createDocument, getDocument };
`);
    
    console.log('✅ Created src/config/firebase.js');
    console.log('✅ Created src/services/firebaseService.js');
    updateEnvExample(['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']);
  },
  
  websocket: () => {
    console.log('🔌 Setting up WebSocket...\n');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 'websocket.js');
    fs.writeFileSync(configPath, `import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io;

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true }
  });
  
  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });
    
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
    
    socket.on('join', (room) => {
      socket.join(room);
      logger.info('Client joined room', { socketId: socket.id, room });
    });
  });
  
  logger.success('WebSocket initialized');
  return io;
};

export const getIO = () => io;
export const emitToRoom = (room, event, data) => io?.to(room).emit(event, data);
export const emitToAll = (event, data) => io?.emit(event, data);

export default { initializeWebSocket, getIO, emitToRoom, emitToAll };
`);
    
    const servicePath = path.join(process.cwd(), 'src', 'services', 'websocketService.js');
    fs.writeFileSync(servicePath, `import { emitToRoom, emitToAll } from '../config/websocket.js';
import { logger } from '../utils/logger.js';

export const sendNotification = (userId, notification) => {
  emitToRoom(\`user_\${userId}\`, 'notification', notification);
  logger.info('Notification sent', { userId });
};

export const broadcast = (event, data) => {
  emitToAll(event, data);
  logger.info('Broadcast sent', { event });
};

export default { sendNotification, broadcast };
`);
    
    console.log('✅ Created src/config/websocket.js');
    console.log('✅ Created src/services/websocketService.js');
  },
  
  redis: () => {
    console.log('⚡ Setting up Redis...\n');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 'redis.js');
    fs.writeFileSync(configPath, `import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient;

export const initializeRedis = async () => {
  redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
  await redisClient.connect();
  logger.success('Redis connected');
  return redisClient;
};

export const getRedis = () => redisClient;

export const setCache = async (key, value, ttl = 3600) => {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
};

export const getCache = async (key) => {
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
};

export const deleteCache = async (key) => {
  await redisClient.del(key);
};

export default { initializeRedis, getRedis, setCache, getCache, deleteCache };
`);
    
    console.log('✅ Created src/config/redis.js');
    updateEnvExample(['REDIS_URL']);
  },
  
  sendgrid: () => {
    console.log('📧 Setting up SendGrid...\n');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 'sendgrid.js');
    fs.writeFileSync(configPath, `import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger.js';

export const initializeSendGrid = () => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.success('SendGrid initialized');
};

export const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html
  };
  
  await sgMail.send(msg);
  logger.info('Email sent', { to, subject });
};

export default { initializeSendGrid, sendEmail };
`);
    
    // Update existing emailService.js
    const servicePath = path.join(process.cwd(), 'src', 'services', 'emailService.js');
    fs.writeFileSync(servicePath, `import { sendEmail as sendEmailSG } from '../config/sendgrid.js';
import { logger } from '../utils/logger.js';

export const sendWelcomeEmail = async (email, name) => {
  await sendEmailSG(email, 'Welcome!', \`<h1>Welcome \${name}!</h1>\`);
  logger.info('Welcome email sent', { email });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = \`\${process.env.FRONTEND_URL}/reset-password?token=\${resetToken}\`;
  await sendEmailSG(email, 'Reset Password', \`<a href="\${resetLink}">Reset Password</a>\`);
  logger.info('Password reset email sent', { email });
};

export default { sendWelcomeEmail, sendPasswordResetEmail };
`);
    
    console.log('✅ Created src/config/sendgrid.js');
    console.log('✅ Updated src/services/emailService.js');
    updateEnvExample(['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']);
  },
  
  s3: () => {
    console.log('☁️  Setting up AWS S3...\n');
    
    const configPath = path.join(process.cwd(), 'src', 'config', 's3.js');
    fs.writeFileSync(configPath, `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const uploadFile = async (key, body, contentType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType
  });
  
  await s3Client.send(command);
  logger.info('File uploaded to S3', { key });
  return \`https://\${process.env.AWS_S3_BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${key}\`;
};

export const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
};

export default { uploadFile, getPresignedUrl };
`);
    
    console.log('✅ Created src/config/s3.js');
    updateEnvExample(['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']);
  }
};

const main = async () => {
  console.log('\n🔌 Integration Installer\n');

  const { integrations } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'integrations',
      message: 'Select integrations to install:',
      choices: Object.entries(INTEGRATIONS).map(([key, value]) => ({
        name: `${value.name} - ${value.description}`,
        value: key,
        checked: false
      })),
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must choose at least one integration.';
        }
        return true;
      }
    }
  ]);

  console.log('\n🚀 Installing integrations...\n');

  for (const integration of integrations) {
    const config = INTEGRATIONS[integration];
    
    console.log(`${'='.repeat(50)}`);
    console.log(`${config.name}`);
    console.log('='.repeat(50));

    installPackages(config.packages);
    INSTALLERS[integration]();
    
    console.log(`\n✅ ${config.name} installed!\n`);
  }

  console.log('✅ All integrations installed successfully!\n');
  console.log('📝 Next steps:');
  console.log('1. Add environment variables to .env');
  console.log('2. Initialize in src/server.js');
  console.log('3. Restart server\n');
};

main().catch(console.error);
