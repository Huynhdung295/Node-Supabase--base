#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { execSync } from 'child_process';

const COMPLIANCE_TOOLS = {
    gdpr: {
        name: '🇪🇺 GDPR Compliance',
        description: 'Data export, deletion, consent management',
        dependencies: [],
        install: () => {
            // GDPR Controller
            fs.writeFileSync('src/controllers/gdprController.js', `import gdprService from '../services/gdprService.js';

export const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await gdprService.exportUserData(userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', \`attachment; filename="user-data-\${userId}.json"\`);
    
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const requestDataDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    await gdprService.deleteUserData(userId);
    
    return res.json({
      success: true,
      message: 'Your data has been deleted',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const consent = await gdprService.getConsentStatus(userId);
    
    return res.json(consent);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const consents = req.body;
    
    const result = await gdprService.updateConsent(userId, consents);
    
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
`);

            // GDPR Service
            fs.writeFileSync('src/services/gdprService.js', `import { supabase } from '../config/supabase.js';

class GDPRService {
  async exportUserData(userId) {
    const [user, posts, comments] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('posts').select('*').eq('author_id', userId),
      supabase.from('comments').select('*').eq('author_id', userId),
    ]);

    return {
      exportDate: new Date().toISOString(),
      userId,
      personalData: user.data,
      content: {
        posts: posts.data || [],
        comments: comments.data || [],
      },
    };
  }

  async deleteUserData(userId) {
    await supabase.from('comments').delete().eq('author_id', userId);
    await supabase.from('posts').delete().eq('author_id', userId);
    
    await supabase.from('users').update({
      email: \`deleted_\${userId}@anonymized.local\`,
      name: 'Deleted User',
      deleted_at: new Date().toISOString(),
      is_deleted: true,
    }).eq('id', userId);

    return { success: true, userId };
  }

  async getConsentStatus(userId) {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      marketing: false,
      analytics: false,
      necessary: true,
    };
  }

  async updateConsent(userId, consents) {
    const { data, error } = await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        ...consents,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new GDPRService();
`);

            // GDPR Routes
            fs.writeFileSync('src/routes/gdprRoutes.js', `import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  exportUserData,
  requestDataDeletion,
  getConsent,
  updateConsent,
} from '../controllers/gdprController.js';

const router = express.Router();

router.get('/export', authenticate, exportUserData);
router.delete('/delete', authenticate, requestDataDeletion);
router.get('/consent', authenticate, getConsent);
router.put('/consent', authenticate, updateConsent);

export default router;
`);

            console.log('✅ GDPR compliance configured!');
            console.log('📝 Add to routes: app.use("/api/v1/gdpr", gdprRoutes);');
        }
    },

    backup: {
        name: '💾 Backup Scripts',
        description: 'Automated database backups',
        dependencies: [],
        install: () => {
            if (!fs.existsSync('scripts')) {
                fs.mkdirSync('scripts', { recursive: true });
            }

            fs.writeFileSync('scripts/backup.js', `#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = \`backup-\${timestamp}.sql\`;
const filepath = path.join(BACKUP_DIR, filename);

console.log(\`📦 Creating backup: \${filename}\`);

try {
  execSync(\`pg_dump \${DATABASE_URL} > \${filepath}\`, { stdio: 'inherit' });
  
  // Compress backup
  execSync(\`gzip \${filepath}\`, { stdio: 'inherit' });
  
  console.log(\`✅ Backup created: \${filepath}.gz\`);
  
  // Clean old backups (keep last 7 days)
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > sevenDays) {
      fs.unlinkSync(filePath);
      console.log(\`🗑️  Deleted old backup: \${file}\`);
    }
  });
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}
`);

            fs.writeFileSync('scripts/restore.js', `#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const DATABASE_URL = process.env.DATABASE_URL;
const backupFile = process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

if (!backupFile) {
  console.error('❌ Usage: node scripts/restore.js <backup-file>');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(\`❌ Backup file not found: \${backupFile}\`);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('⚠️  This will overwrite the database. Continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Restore cancelled');
    rl.close();
    process.exit(0);
  }

  console.log(\`📦 Restoring from: \${backupFile}\`);

  try {
    // Decompress if needed
    let sqlFile = backupFile;
    if (backupFile.endsWith('.gz')) {
      execSync(\`gunzip -c \${backupFile} > /tmp/restore.sql\`);
      sqlFile = '/tmp/restore.sql';
    }

    // Restore database
    execSync(\`psql \${DATABASE_URL} < \${sqlFile}\`, { stdio: 'inherit' });
    
    // Cleanup
    if (sqlFile === '/tmp/restore.sql') {
      fs.unlinkSync(sqlFile);
    }

    console.log('✅ Restore completed!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }

  rl.close();
});
`);

            // Update package.json
            const pkgPath = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.backup = 'node scripts/backup.js';
            pkg.scripts.restore = 'node scripts/restore.js';
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            console.log('✅ Backup scripts created!');
            console.log('📝 Run: npm run backup');
            console.log('📝 Restore: npm run restore backups/backup-xxx.sql.gz');
        }
    },

    dataLifecycle: {
        name: '♻️ Data Lifecycle',
        description: 'Data retention policies',
        dependencies: [],
        install: () => {
            if (!fs.existsSync('docs')) {
                fs.mkdirSync('docs', { recursive: true });
            }

            fs.writeFileSync('docs/DATA_LIFECYCLE.md', `# ♻️ Data Lifecycle Policy

## Data Classification

### Personal Identifiable Information (PII)
- Email addresses
- Names
- Phone numbers
- Addresses
- Payment information

### Sensitive Data
- Passwords (hashed)
- API keys
- Authentication tokens
- Financial data

### Operational Data
- Logs
- Metrics
- Audit trails
- Analytics

## Retention Policies

### User Data
- **Active users**: Retained indefinitely
- **Inactive users (1 year)**: Notification sent
- **Inactive users (2 years)**: Data archived
- **Inactive users (3 years)**: Data deleted

### Logs
- **Application logs**: 30 days
- **Audit logs**: 1 year
- **Security logs**: 2 years

### Backups
- **Daily backups**: 7 days
- **Weekly backups**: 4 weeks
- **Monthly backups**: 12 months

## Data Deletion Process

### 1. User-Requested Deletion (GDPR)
\`\`\`javascript
// Immediate deletion
await gdprService.deleteUserData(userId);
\`\`\`

### 2. Automated Cleanup
\`\`\`javascript
// Run daily
const cleanupInactiveUsers = async () => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  
  await supabase
    .from('users')
    .delete()
    .lt('last_login_at', threeYearsAgo.toISOString());
};
\`\`\`

### 3. Log Rotation
\`\`\`javascript
// Run daily
const cleanupOldLogs = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await supabase
    .from('logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString());
};
\`\`\`

## Anonymization

### When to Anonymize
- User requests deletion but data needed for analytics
- Legal requirements to retain transaction history
- Compliance with data retention laws

### How to Anonymize
\`\`\`javascript
const anonymizeUser = async (userId) => {
  await supabase
    .from('users')
    .update({
      email: \`anon_\${userId}@anonymized.local\`,
      name: 'Anonymous User',
      phone: null,
      address: null,
      anonymized_at: new Date().toISOString(),
    })
    .eq('id', userId);
};
\`\`\`

## Compliance Checklist

- [ ] Data classification documented
- [ ] Retention policies defined
- [ ] Automated cleanup scheduled
- [ ] Backup rotation configured
- [ ] GDPR endpoints implemented
- [ ] Data anonymization process
- [ ] Audit trail maintained
- [ ] Team trained on policies

---

**Protect user data responsibly!** ♻️
`);

            console.log('✅ Data lifecycle policy created!');
            console.log('📝 Read: docs/DATA_LIFECYCLE.md');
        }
    },
};

async function main() {
    console.log('\n🇪🇺 Compliance Tools Installer\n');

    const { tools } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'tools',
            message: 'Select compliance tools:',
            choices: Object.entries(COMPLIANCE_TOOLS).map(([key, tool]) => ({
                name: `${tool.name} - ${tool.description}`,
                value: key,
            })),
        },
    ]);

    if (tools.length === 0) {
        console.log('❌ No tools selected');
        return;
    }

    console.log(`\n✅ Installing ${tools.length} tools...\n`);

    for (const toolKey of tools) {
        const tool = COMPLIANCE_TOOLS[toolKey];
        console.log(`\nInstalling ${tool.name}...`);
        try {
            await tool.install();
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
        }
    }

    console.log(`\n✨ Successfully installed ${tools.length} compliance tools!\n`);
}

main().catch(console.error);
