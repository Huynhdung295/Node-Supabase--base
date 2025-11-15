#!/usr/bin/env node
// Script to generate secure keys for JWT and other secrets

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const generateSecureKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateKeys = () => {
  console.log('🔑 Generating secure keys...\n');

  const keys = {
    JWT_SECRET: generateSecureKey(32),
    JWT_REFRESH_SECRET: generateSecureKey(32),
    ENCRYPTION_KEY: generateSecureKey(32),
    API_KEY_SECRET: generateSecureKey(32),
    COOKIE_SECRET: generateSecureKey(32)
  };

  console.log('Generated Keys:');
  console.log('================\n');
  
  Object.entries(keys).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\n================\n');

  // Option to append to .env file
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('📝 .env file exists.');
    console.log('\nOptions:');
    console.log('1. Copy the keys above and paste into your .env file');
    console.log('2. Or run: npm run keys:append (to append to .env)');
  } else {
    console.log('⚠️  .env file not found.');
    console.log('Run: cp .env.example .env');
    console.log('Then paste the keys above into your .env file');
  }

  // Save to temporary file
  const tempPath = path.join(process.cwd(), '.env.keys.tmp');
  const content = Object.entries(keys)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(tempPath, content);
  console.log(`\n✅ Keys also saved to: .env.keys.tmp`);
  console.log('⚠️  Remember to delete this file after copying keys!\n');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateKeys();
}

export { generateSecureKey, generateKeys };
