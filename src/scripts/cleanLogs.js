// Script to clean old log files

import fs from 'fs';
import path from 'path';

const LOG_DIR = 'logs';
const DAYS_TO_KEEP = 30;

const cleanOldLogs = () => {
  if (!fs.existsSync(LOG_DIR)) {
    console.log('No logs directory found');
    return;
  }

  const files = fs.readdirSync(LOG_DIR);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const stats = fs.statSync(filePath);

    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`Deleted: ${file}`);
    }
  });

  console.log(`\n✅ Cleaned ${deletedCount} old log files`);
};

cleanOldLogs();
