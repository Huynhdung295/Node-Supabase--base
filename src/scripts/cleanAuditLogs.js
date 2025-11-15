// Script to clean old audit logs from database

import dotenv from 'dotenv';
import { cleanupOldAuditLogs } from '../services/auditService.js';

dotenv.config();

const DAYS_TO_KEEP = parseInt(process.env.AUDIT_LOGS_RETENTION_DAYS) || 90;

const run = async () => {
  try {
    console.log(`🧹 Cleaning audit logs older than ${DAYS_TO_KEEP} days...`);
    const deletedCount = await cleanupOldAuditLogs(DAYS_TO_KEEP);
    console.log(`✅ Deleted ${deletedCount} old audit log entries`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning audit logs:', error.message);
    process.exit(1);
  }
};

run();
