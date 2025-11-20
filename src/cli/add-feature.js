#!/usr/bin/env node
// Feature Installer - Add common features to your API

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FEATURES = {
  upload: {
    name: '📁 File Upload',
    description: 'Multer + S3/Supabase Storage + Image resize',
    packages: ['multer', 'sharp', '@supabase/storage-js']
  },
  email: {
    name: '📧 Email Templates',
    description: 'Handlebars templates + SendGrid',
    packages: ['handlebars', '@sendgrid/mail']
  },
  notifications: {
    name: '🔔 Notification System',
    description: 'In-app + Email + Push notifications',
    packages: ['firebase-admin']
  },
  pagination: {
    name: '📄 Advanced Pagination',
    description: 'Filter + Sort + Search helpers',
    packages: []
  },
  cron: {
    name: '⏰ Cron Jobs',
    description: 'Scheduled tasks with node-cron',
    packages: ['node-cron']
  },
  payment: {
    name: '💳 Payment (Stripe)',
    description: 'Stripe integration + webhooks',
    packages: ['stripe']
  },
  versioning: {
    name: '🔢 API Versioning',
    description: 'Support multiple API versions (v1, v2)',
    packages: []
  },
  multitenancy: {
    name: '🏢 Multi-tenancy',
    description: 'Tenant isolation for SaaS apps',
    packages: []
  },
  audit: {
    name: '📝 Audit Trail',
    description: 'Track all data changes with history',
    packages: []
  },
  health: {
    name: '💚 Health Checks',
    description: 'System health monitoring endpoints',
    packages: []
  },
  backup: {
    name: '💾 Backup & Restore',
    description: 'Database backup automation',
    packages: ['pg']
  },
  webhooks: {
    name: '🔗 Webhooks',
    description: 'Send webhooks to external services',
    packages: ['axios']
  },
  i18n: {
    name: '🌍 Internationalization',
    description: 'Multi-language support',
    packages: ['i18next', 'i18next-fs-backend']
  },
  analytics: {
    name: '📊 Analytics',
    description: 'Track events and user behavior',
    packages: []
  },
  export: {
    name: '📤 Data Export',
    description: 'Export data to CSV/Excel/PDF',
    packages: ['exceljs', 'pdfkit']
  }
};

const installPackages = (packages) => {
  if (packages.length === 0) return;
  console.log(`\n📦 Installing: ${packages.join(', ')}...`);
  execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Packages installed\n');
};

const INSTALLERS = {
  upload: () => {
    console.log('📁 Setting up File Upload...\n');

    // Middleware
    const middlewarePath = path.join(process.cwd(), 'src', 'middleware', 'upload.js');
    fs.writeFileSync(middlewarePath, `import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { supabaseAdmin } from '../config/supabase.js';

// Memory storage for processing
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type'));
};

// Upload middleware
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Image resize middleware
export const resizeImage = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const buffer = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    req.file.buffer = buffer;
    next();
  } catch (error) {
    next(error);
  }
};

// Upload to Supabase Storage
export const uploadToStorage = async (file, folder = 'uploads') => {
  const fileName = \`\${Date.now()}-\${file.originalname}\`;
  const filePath = \`\${folder}/\${fileName}\`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('files')
    .getPublicUrl(filePath);
  
  return publicUrl;
};

export default { upload, resizeImage, uploadToStorage };
`);

    // Controller example
    const controllerPath = path.join(process.cwd(), 'src', 'controllers', 'uploadController.js');
    fs.writeFileSync(controllerPath, `import { uploadToStorage } from '../middleware/upload.js';
import { successResponse } from '../utils/response.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const url = await uploadToStorage(req.file);
    
    return successResponse(res, { url }, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const urls = await Promise.all(
      req.files.map(file => uploadToStorage(file))
    );
    
    return successResponse(res, { urls }, 'Files uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export default { uploadFile, uploadMultiple };
`);

    // Route example
    const routePath = path.join(process.cwd(), 'src', 'routes', 'uploadRoutes.js');
    fs.writeFileSync(routePath, `import express from 'express';
import { upload, resizeImage } from '../middleware/upload.js';
import { uploadFile, uploadMultiple } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Single file upload
router.post('/single', authenticate, upload.single('file'), resizeImage, uploadFile);

// Multiple files upload
router.post('/multiple', authenticate, upload.array('files', 10), uploadMultiple);

export default router;
`);

    console.log('✅ Created src/middleware/upload.js');
    console.log('✅ Created src/controllers/uploadController.js');
    console.log('✅ Created src/routes/uploadRoutes.js');
    console.log('\n📝 Add to routes/index.js:');
    console.log('   import uploadRoutes from "./uploadRoutes.js";');
    console.log('   router.use("/upload", uploadRoutes);\n');
  },

  email: () => {
    console.log('📧 Setting up Email Templates...\n');

    // Create templates folder
    const templatesDir = path.join(process.cwd(), 'src', 'templates', 'emails');
    fs.mkdirSync(templatesDir, { recursive: true });

    // Welcome template
    fs.writeFileSync(path.join(templatesDir, 'welcome.hbs'), `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{appName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Welcome to {{appName}}! We're excited to have you on board.</p>
      <p>Get started by exploring our features:</p>
      <p style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      </p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    </div>
  </div>
</body>
</html>
`);

    // Email service
    const servicePath = path.join(process.cwd(), 'src', 'services', 'emailTemplateService.js');
    fs.writeFileSync(servicePath, `import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { sendEmail } from '../config/sendgrid.js';
import { logger } from '../utils/logger.js';

const templatesDir = path.join(process.cwd(), 'src', 'templates', 'emails');

const renderTemplate = (templateName, data) => {
  const templatePath = path.join(templatesDir, \`\${templateName}.hbs\`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  return template(data);
};

export const sendWelcomeEmail = async (email, name) => {
  const html = renderTemplate('welcome', {
    name,
    appName: process.env.APP_NAME || 'Our App',
    dashboardUrl: \`\${process.env.FRONTEND_URL}/dashboard\`
  });
  
  await sendEmail(email, 'Welcome!', html);
  logger.info('Welcome email sent', { email });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const html = renderTemplate('password-reset', {
    resetUrl: \`\${process.env.FRONTEND_URL}/reset-password?token=\${resetToken}\`,
    appName: process.env.APP_NAME || 'Our App'
  });
  
  await sendEmail(email, 'Reset Your Password', html);
  logger.info('Password reset email sent', { email });
};

export default { sendWelcomeEmail, sendPasswordResetEmail };
`);

    console.log('✅ Created src/templates/emails/welcome.hbs');
    console.log('✅ Created src/services/emailTemplateService.js');
    console.log('\n📝 Use in your code:');
    console.log('   import { sendWelcomeEmail } from "../services/emailTemplateService.js";\n');
  },

  pagination: () => {
    console.log('📄 Setting up Advanced Pagination...\n');

    const utilPath = path.join(process.cwd(), 'src', 'utils', 'queryBuilder.js');
    fs.writeFileSync(utilPath, `// Advanced Query Builder for Supabase

export const buildQuery = (baseQuery, options = {}) => {
  let query = baseQuery;
  
  // Pagination
  if (options.page && options.limit) {
    const offset = (options.page - 1) * options.limit;
    query = query.range(offset, offset + options.limit - 1);
  }
  
  // Sorting
  if (options.sort) {
    const [field, order = 'asc'] = options.sort.split(':');
    query = query.order(field, { ascending: order === 'asc' });
  }
  
  // Filtering
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
  }
  
  // Search
  if (options.search && options.searchFields) {
    const searchConditions = options.searchFields
      .map(field => \`\${field}.ilike.%\${options.search}%\`)
      .join(',');
    query = query.or(searchConditions);
  }
  
  // Date range
  if (options.dateFrom) {
    query = query.gte(options.dateField || 'created_at', options.dateFrom);
  }
  if (options.dateTo) {
    query = query.lte(options.dateField || 'created_at', options.dateTo);
  }
  
  return query;
};

export const parsePaginationQuery = (query) => {
  return {
    page: parseInt(query.page) || 1,
    limit: Math.min(parseInt(query.limit) || 10, 100),
    sort: query.sort,
    search: query.search,
    searchFields: query.searchFields?.split(','),
    filters: query.filters ? JSON.parse(query.filters) : {},
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    dateField: query.dateField
  };
};

export default { buildQuery, parsePaginationQuery };
`);

    console.log('✅ Created src/utils/queryBuilder.js');
    console.log('\n📝 Usage example:');
    console.log('   const options = parsePaginationQuery(req.query);');
    console.log('   const query = buildQuery(supabase.from("products").select("*"), options);\n');
  },

  cron: () => {
    console.log('⏰ Setting up Cron Jobs...\n');

    const cronPath = path.join(process.cwd(), 'src', 'config', 'cron.js');
    fs.writeFileSync(cronPath, `import cron from 'node-cron';
import { logger } from '../utils/logger.js';

// Example: Clean old logs every day at 2 AM
export const cleanOldLogs = cron.schedule('0 2 * * *', () => {
  logger.info('Running scheduled task: Clean old logs');
  // Your cleanup logic here
}, {
  scheduled: false
});

// Example: Send daily report every day at 9 AM
export const sendDailyReport = cron.schedule('0 9 * * *', () => {
  logger.info('Running scheduled task: Send daily report');
  // Your report logic here
}, {
  scheduled: false
});

// Start all cron jobs
export const startCronJobs = () => {
  cleanOldLogs.start();
  sendDailyReport.start();
  logger.success('Cron jobs started');
};

// Stop all cron jobs
export const stopCronJobs = () => {
  cleanOldLogs.stop();
  sendDailyReport.stop();
  logger.info('Cron jobs stopped');
};

export default { startCronJobs, stopCronJobs };
`);

    console.log('✅ Created src/config/cron.js');
    console.log('\n📝 Add to server.js:');
    console.log('   import { startCronJobs } from "./config/cron.js";');
    console.log('   startCronJobs();\n');
  },

  payment: () => {
    console.log('💳 Setting up Stripe Payment...\n');

    const configPath = path.join(process.cwd(), 'src', 'config', 'stripe.js');
    fs.writeFileSync(configPath, `import Stripe from 'stripe';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency,
    metadata
  });
  
  logger.info('Payment intent created', { id: paymentIntent.id, amount });
  return paymentIntent;
};

export const createCustomer = async (email, name, metadata = {}) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata
  });
  
  logger.info('Customer created', { id: customer.id, email });
  return customer;
};

export const createSubscription = async (customerId, priceId) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }]
  });
  
  logger.info('Subscription created', { id: subscription.id, customerId });
  return subscription;
};

export const verifyWebhook = (payload, signature) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

export default { createPaymentIntent, createCustomer, createSubscription, verifyWebhook };
`);

    console.log('✅ Created src/config/stripe.js');
    console.log('\n📝 Add to .env:');
    console.log('   STRIPE_SECRET_KEY=sk_test_...');
    console.log('   STRIPE_PUBLISHABLE_KEY=pk_test_...');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_...\n');
  }
};

const main = async () => {
  console.log('\n🎯 Feature Installer\n');

  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to add:',
      choices: Object.entries(FEATURES).map(([key, value]) => ({
        name: `${value.name} - ${value.description}`,
        value: key
      })),
      validate: (answer) => answer.length > 0 || 'Choose at least one feature'
    }
  ]);

  console.log('\n🚀 Installing features...\n');

  for (const feature of features) {
    const config = FEATURES[feature];

    console.log('='.repeat(50));
    console.log(config.name);
    console.log('='.repeat(50));

    installPackages(config.packages);
    INSTALLERS[feature]();

    console.log(`\n✅ ${config.name} installed!\n`);
  }

  console.log('✅ All features installed!\n');
};

main().catch(console.error);
