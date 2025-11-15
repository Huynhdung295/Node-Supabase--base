#!/usr/bin/env node
// Append generated keys to .env file

import fs from 'fs';
import path from 'path';
import { generateSecureKey } from './generateKeys.js';

const appendKeys = () => {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('Run: cp .env.example .env');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check if keys already exist
  if (envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=your-')) {
    console.log('⚠️  Keys already exist in .env file.');
    console.log('If you want to regenerate, manually delete the old keys first.');
    process.exit(0);
  }

  const keys = {
    JWT_SECRET: generateSecureKey(32),
    JWT_REFRESH_SECRET: generateSecureKey(32),
    ENCRYPTION_KEY: generateSecureKey(32),
    API_KEY_SECRET: generateSecureKey(32),
    COOKIE_SECRET: generateSecureKey(32)
  };

  let newContent = envContent;

  // Replace or append keys
  Object.entries(keys).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `${key}=${value}`);
    } else {
      newContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, newContent);
  
  console.log('✅ Keys generated and added to .env file!');
  console.log('\nGenerated keys:');
  Object.keys(keys).forEach(key => console.log(`  - ${key}`));
  console.log('\n⚠️  Keep these keys secret and never commit them to git!');
};

appendKeys();
