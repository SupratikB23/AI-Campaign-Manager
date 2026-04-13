import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'campaign.db');

const db = new Database(dbPath);
initializeDatabase(db);

export default db;
