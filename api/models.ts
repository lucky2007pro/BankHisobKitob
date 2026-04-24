import fs from 'fs';
import { dbPath } from './db.js';

export const readDb = () => {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

export const writeDb = (data: any) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const generateId = (table: any[]) => {
  if (table.length === 0) return 1;
  return Math.max(...table.map(t => t.id)) + 1;
};
