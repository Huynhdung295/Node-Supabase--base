# 🇪🇺 Compliance CLI Documentation

## Command

```bash
npm run install:compliance
```

## Available Tools

### 1. 🇪🇺 GDPR Compliance

**What it does:**

- Data export (Right to access)
- Data deletion (Right to be forgotten)
- Consent management
- Data anonymization

**Files created:**

- `src/controllers/gdprController.js` - GDPR endpoints
- `src/services/gdprService.js` - GDPR logic
- `src/routes/gdprRoutes.js` - GDPR routes

**Setup:**

```javascript
// server.js
import gdprRoutes from './routes/gdprRoutes.js';

app.use('/api/v1/gdpr', gdprRoutes);
```

**Endpoints:**

**Export User Data:**

```bash
GET /api/v1/gdpr/export
Authorization: Bearer <token>

Response:
{
  "exportDate": "2024-01-01T00:00:00.000Z",
  "userId": "123",
  "personalData": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "content": {
    "posts": [...],
    "comments": [...]
  }
}
```

**Delete User Data:**

```bash
DELETE /api/v1/gdpr/delete
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Your data has been deleted"
}
```

**Get Consent:**

```bash
GET /api/v1/gdpr/consent
Authorization: Bearer <token>

Response:
{
  "marketing": false,
  "analytics": true,
  "necessary": true
}
```

**Update Consent:**

```bash
PUT /api/v1/gdpr/consent
Authorization: Bearer <token>
Content-Type: application/json

{
  "marketing": true,
  "analytics": true
}
```

**Database Schema:**

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  marketing BOOLEAN DEFAULT false,
  analytics BOOLEAN DEFAULT false,
  necessary BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. 💾 Backup Scripts

**What it does:**

- Automated database backups
- Backup compression
- Retention policy (7 days)
- Easy restore

**Files created:**

- `scripts/backup.js` - Backup script
- `scripts/restore.js` - Restore script

**Environment Variables:**

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
BACKUP_DIR=./backups
```

**Usage:**

**Create Backup:**

```bash
npm run backup
```

**Output:**

```
📦 Creating backup: backup-2024-01-01T12-00-00.sql
✅ Backup created: backups/backup-2024-01-01T12-00-00.sql.gz
🗑️  Deleted old backup: backup-2023-12-25T12-00-00.sql.gz
```

**Restore Backup:**

```bash
npm run restore backups/backup-2024-01-01T12-00-00.sql.gz
```

**Automated Backups (Cron):**

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/app && npm run backup
```

**Docker Compose:**

```yaml
services:
  backup:
    image: node:18
    volumes:
      - ./:/app
      - ./backups:/backups
    environment:
      - DATABASE_URL=postgresql://...
    command: npm run backup
    restart: unless-stopped
```

**S3 Upload:**

```javascript
// scripts/backup.js
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

await s3.upload({
  Bucket: 'my-backups',
  Key: \`database/\${filename}\`,
  Body: fs.createReadStream(filepath),
}).promise();
```

---

### 3. ♻️ Data Lifecycle Policy

**What it does:**

- Data classification guide
- Retention policies
- Deletion procedures
- Anonymization strategies

**Files created:**

- `docs/DATA_LIFECYCLE.md` - Complete policy document

**Data Classification:**

**PII (Personal Identifiable Information):**

- Email, name, phone, address
- Retention: Until user deletion
- Protection: Encrypted at rest

**Sensitive Data:**

- Passwords (hashed)
- Payment info
- Retention: As required by law
- Protection: Encrypted + access logs

**Operational Data:**

- Logs, metrics, analytics
- Retention: 30-90 days
- Protection: Access controlled

**Retention Policies:**

**User Data:**

- Active users: Indefinite
- Inactive 1 year: Notification
- Inactive 2 years: Archive
- Inactive 3 years: Delete

**Logs:**

- Application logs: 30 days
- Audit logs: 1 year
- Security logs: 2 years

**Backups:**

- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months

**Automated Cleanup:**

```javascript
// scripts/cleanup.js
import { supabase } from '../src/config/supabase.js';

// Delete inactive users (3 years)
const cleanupInactiveUsers = async () => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const { data } = await supabase
    .from('users')
    .delete()
    .lt('last_login_at', threeYearsAgo.toISOString())
    .select();

  console.log(\`Deleted \${data.length} inactive users\`);
};

// Delete old logs (30 days)
const cleanupOldLogs = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from('logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select();

  console.log(\`Deleted \${data.length} old logs\`);
};

// Run daily
cleanupInactiveUsers();
cleanupOldLogs();
```

**Cron Schedule:**

```bash
# Daily cleanup at 3 AM
0 3 * * * cd /path/to/app && node scripts/cleanup.js
```

---

## GDPR Compliance Checklist

- [ ] **Right to Access** - Export user data endpoint
- [ ] **Right to be Forgotten** - Delete user data endpoint
- [ ] **Right to Rectification** - Update user data endpoint
- [ ] **Right to Data Portability** - Export in machine-readable format
- [ ] **Consent Management** - Track and manage consents
- [ ] **Data Breach Notification** - Process in place
- [ ] **Privacy Policy** - Clear and accessible
- [ ] **Data Protection Officer** - Appointed (if required)
- [ ] **Data Processing Agreement** - With third parties
- [ ] **Regular Audits** - Compliance reviews

---

## Data Breach Response

### 1. Detection (0-1 hour)

- Monitor for unusual activity
- Alert on-call team
- Assess scope

### 2. Containment (1-4 hours)

- Isolate affected systems
- Stop data leak
- Preserve evidence

### 3. Investigation (4-24 hours)

- Identify root cause
- Determine data affected
- Document timeline

### 4. Notification (24-72 hours)

- Notify authorities (if required)
- Notify affected users
- Public statement (if needed)

### 5. Recovery (1-7 days)

- Fix vulnerability
- Restore from backup
- Implement safeguards

### 6. Post-Incident (7-30 days)

- Post-mortem review
- Update policies
- Train team

---

## Best Practices

1. **Encrypt PII at rest** - Use database encryption
2. **Log all data access** - Audit trail
3. **Minimize data collection** - Only what's needed
4. **Regular backups** - Daily automated
5. **Test restore process** - Monthly
6. **Document everything** - Policies, procedures
7. **Train your team** - GDPR awareness
8. **Review third parties** - Data processors
9. **Update privacy policy** - Keep current
10. **Respond quickly** - Data requests within 30 days

---

## Useful Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [ICO Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [GDPR Checklist](https://gdpr.eu/checklist/)

---

**Protect user data, build trust!** 🇪🇺
