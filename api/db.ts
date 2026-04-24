import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const dbPath = path.join(dbDir, 'finance.json');

const defaultDb = {
  users: [],
  accounts: [],
  categories: [],
  transactions: []
};

export const initDb = () => {
  return new Promise<void>((resolve) => {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    }
    resolve();
  });
};

