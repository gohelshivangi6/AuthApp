const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const TEMP_PATH = path.join(DB_DIR, 'db.tmp.json');
const BACKUP_PATH = path.join(DB_DIR, 'db.backup.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Simple Promise-based write queue to prevent concurrent write collisions
let writeQueue = Promise.resolve();

/**
 * Reads user data from db.json safely, recovering from backup if main database is corrupted.
 */
async function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      if (fs.existsSync(BACKUP_PATH)) {
        console.warn('db.json missing. Restoring from backup...');
        const backupData = await fs.promises.readFile(BACKUP_PATH, 'utf8');
        await fs.promises.writeFile(DB_PATH, backupData, 'utf8');
        return JSON.parse(backupData);
      }
      return { users: [] };
    }
    const data = await fs.promises.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json, attempting backup restore:', error);
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        const backupData = await fs.promises.readFile(BACKUP_PATH, 'utf8');
        await fs.promises.writeFile(DB_PATH, backupData, 'utf8');
        return JSON.parse(backupData);
      }
    } catch (backupError) {
      console.error('Backup restoration failed:', backupError);
    }
    // If all fail, return empty db structure
    return { users: [] };
  }
}

/**
 * Writes data to db.json atomically.
 * It writes to db.tmp.json, renames it to db.json, and copies to db.backup.json.
 */
async function writeDB(data) {
  // Chain to the write queue to prevent concurrent file modifications
  writeQueue = writeQueue.then(async () => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      
      // 1. Write to temp file
      await fs.promises.writeFile(TEMP_PATH, dataStr, 'utf8');
      
      // 2. Rename temp file to target file (atomic operation in OS)
      await fs.promises.rename(TEMP_PATH, DB_PATH);
      
      // 3. Make backup copy
      await fs.promises.copyFile(DB_PATH, BACKUP_PATH);
    } catch (error) {
      console.error('Failed to write to JSON database atomically:', error);
      throw new Error('Database write operation failed');
    }
  });

  return writeQueue;
}

module.exports = {
  readDB,
  writeDB
};
