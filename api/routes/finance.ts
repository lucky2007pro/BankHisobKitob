import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readDb, writeDb, generateId } from '../models.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  req.body.user_id = 1;
  next();
};
router.use(authMiddleware);

// --- Accounts ---
router.get('/accounts', (req, res) => {
  const db = readDb();
  res.json({ success: true, accounts: db.accounts.filter((a: any) => a.user_id === req.body.user_id) });
});

router.post('/accounts', (req, res) => {
  const { name, type, balance, user_id } = req.body;
  const db = readDb();
  const id = generateId(db.accounts);
  db.accounts.push({ id, user_id, name, type, balance: parseFloat(balance) || 0 });
  writeDb(db);
  res.json({ success: true, id });
});

// --- Categories ---
router.get('/categories', (req, res) => {
  const db = readDb();
  res.json({ success: true, categories: db.categories.filter((c: any) => c.user_id === req.body.user_id) });
});

router.post('/categories', (req, res) => {
  const { name, type, user_id } = req.body;
  const db = readDb();
  const id = generateId(db.categories);
  db.categories.push({ id, user_id, name, type });
  writeDb(db);
  res.json({ success: true, id });
});

// --- Transactions ---
router.get('/transactions', (req, res) => {
  const { type, category_id, account_id, month, year } = req.query;
  const user_id = req.body.user_id;
  const db = readDb();

  let trxs = db.transactions.filter((t: any) => t.user_id === user_id);
  
  if (type) trxs = trxs.filter((t: any) => t.type === type);
  if (category_id) trxs = trxs.filter((t: any) => String(t.category_id) === String(category_id));
  if (account_id) trxs = trxs.filter((t: any) => String(t.account_id) === String(account_id));
  
  if (month && year) {
    trxs = trxs.filter((t: any) => t.date.startsWith(`\${year}-\${month}`));
  } else if (year) {
    trxs = trxs.filter((t: any) => t.date.startsWith(year));
  }

  // Join names
  trxs = trxs.map((t: any) => {
    const acc = db.accounts.find((a: any) => String(a.id) === String(t.account_id));
    const cat = db.categories.find((c: any) => String(c.id) === String(t.category_id));
    return {
      ...t,
      account_name: acc ? acc.name : 'Noma\'lum',
      category_name: cat ? cat.name : 'Noma\'lum'
    };
  });

  trxs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ success: true, transactions: trxs });
});

router.post('/transactions', upload.single('receipt_image'), (req, res) => {
  const { account_id, category_id, type, amount, date, comment, user_id } = req.body;
  const receipt_image = req.file ? `/uploads/\${req.file.filename}` : null;
  
  const db = readDb();
  const id = generateId(db.transactions);
  const amt = parseFloat(amount);
  
  db.transactions.push({
    id, user_id, account_id: parseInt(account_id), category_id: parseInt(category_id), type, amount: amt, date, comment, receipt_image, created_at: new Date().toISOString()
  });

  const acc = db.accounts.find((a: any) => String(a.id) === String(account_id));
  if (acc) {
    acc.balance += (type === 'Kirim' ? amt : -amt);
  }
  
  writeDb(db);
  res.json({ success: true, id });
});

router.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const trxIdx = db.transactions.findIndex((t: any) => String(t.id) === String(id));
  if (trxIdx !== -1) {
    const trx = db.transactions[trxIdx];
    const acc = db.accounts.find((a: any) => String(a.id) === String(trx.account_id));
    if (acc) {
      acc.balance += (trx.type === 'Kirim' ? -trx.amount : trx.amount);
    }
    db.transactions.splice(trxIdx, 1);
    writeDb(db);
  }
  res.json({ success: true });
});

// --- Statistics ---
router.get('/statistics', (req, res) => {
  const user_id = req.body.user_id;
  const db = readDb();
  
  const userAccs = db.accounts.filter((a: any) => a.user_id === user_id);
  const totalBalance = userAccs.reduce((sum: number, a: any) => sum + a.balance, 0);
  
  const userTrxs = db.transactions.filter((t: any) => t.user_id === user_id);
  const totalIncome = userTrxs.filter((t: any) => t.type === 'Kirim').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpense = userTrxs.filter((t: any) => t.type === 'Chiqim').reduce((sum: number, t: any) => sum + t.amount, 0);

  const monthlyMap: Record<string, {Kirim: number, Chiqim: number}> = {};
  userTrxs.forEach((t: any) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { Kirim: 0, Chiqim: 0 };
    monthlyMap[month][t.type as 'Kirim' | 'Chiqim'] += t.amount;
  });

  const monthlyStats: any[] = [];
  Object.keys(monthlyMap).forEach(month => {
    if (monthlyMap[month].Kirim > 0) monthlyStats.push({ month, type: 'Kirim', total: monthlyMap[month].Kirim });
    if (monthlyMap[month].Chiqim > 0) monthlyStats.push({ month, type: 'Chiqim', total: monthlyMap[month].Chiqim });
  });

  res.json({
    success: true,
    stats: { totalBalance, totalIncome, totalExpense, monthlyStats }
  });
});

// --- Init default data ---
router.post('/init-defaults', (req, res) => {
  const user_id = req.body.user_id;
  const db = readDb();
  
  if (!db.users.find((u: any) => u.id === user_id)) {
    db.users.push({ id: user_id, username: 'demo', password: '123' });
  }
  
  if (db.accounts.filter((a: any) => a.user_id === user_id).length === 0) {
    db.accounts.push({ id: generateId(db.accounts), user_id, name: 'Asosiy karta', type: 'Karta', balance: 0 });
    db.accounts.push({ id: generateId(db.accounts)+1, user_id, name: 'Naqt pul', type: 'Naqt', balance: 0 });
    
    db.categories.push({ id: generateId(db.categories), user_id, name: 'Oylik maosh', type: 'Kirim' });
    db.categories.push({ id: generateId(db.categories)+1, user_id, name: 'Biznes', type: 'Kirim' });
    db.categories.push({ id: generateId(db.categories)+2, user_id, name: 'Transport', type: 'Chiqim' });
    db.categories.push({ id: generateId(db.categories)+3, user_id, name: 'Oziq-ovqat', type: 'Chiqim' });
    db.categories.push({ id: generateId(db.categories)+4, user_id, name: 'Kafe', type: 'Chiqim' });
    
    writeDb(db);
  }
  
  res.json({ success: true });
});

export default router;
