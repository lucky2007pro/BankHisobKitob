import React, { useEffect, useState } from 'react';
import { PlusCircle, Wallet, FolderOpen } from 'lucide-react';

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newAcc, setNewAcc] = useState({ name: '', type: 'Karta', balance: '' });
  const [newCat, setNewCat] = useState({ name: '', type: 'Chiqim' });

  const fetchAccounts = () => {
    fetch('/api/finance/accounts').then(r => r.json()).then(d => {
      if (d.success) setAccounts(d.accounts);
    });
  };

  const fetchCategories = () => {
    fetch('/api/finance/categories').then(r => r.json()).then(d => {
      if (d.success) setCategories(d.categories);
    });
  };

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/finance/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAcc)
    }).then(r => r.json()).then(d => {
      if (d.success) {
        setNewAcc({ name: '', type: 'Karta', balance: '' });
        fetchAccounts();
      }
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/finance/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    }).then(r => r.json()).then(d => {
      if (d.success) {
        setNewCat({ name: '', type: 'Chiqim' });
        fetchCategories();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Accounts */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 text-slate-800 font-bold text-xl mb-6">
          <Wallet className="text-blue-600" />
          Mening Hisoblarim
        </div>
        
        <form onSubmit={handleAddAccount} className="flex gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Nomi (masalan, Naqt)" 
            required 
            className="flex-1 px-4 py-2 border rounded-xl"
            value={newAcc.name}
            onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
          />
          <select 
            className="px-4 py-2 border rounded-xl"
            value={newAcc.type}
            onChange={e => setNewAcc({ ...newAcc, type: e.target.value })}
          >
            <option value="Karta">Karta</option>
            <option value="Naqt">Naqt</option>
            <option value="Elektron Hamyon">Elektron Hamyon</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <PlusCircle size={20} />
          </button>
        </form>

        <ul className="space-y-3">
          {accounts.map(a => (
            <li key={a.id} className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">{a.name}</p>
                <p className="text-sm text-slate-500">{a.type}</p>
              </div>
              <div className="font-bold text-slate-800">
                {a.balance.toLocaleString()} so'm
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 text-slate-800 font-bold text-xl mb-6">
          <FolderOpen className="text-blue-600" />
          Kategoriyalar
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Nomi (masalan, Transport)" 
            required 
            className="flex-1 px-4 py-2 border rounded-xl"
            value={newCat.name}
            onChange={e => setNewCat({ ...newCat, name: e.target.value })}
          />
          <select 
            className="px-4 py-2 border rounded-xl"
            value={newCat.type}
            onChange={e => setNewCat({ ...newCat, type: e.target.value })}
          >
            <option value="Kirim">Kirim</option>
            <option value="Chiqim">Chiqim</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <PlusCircle size={20} />
          </button>
        </form>

        <ul className="space-y-3">
          {categories.map(c => (
            <li key={c.id} className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-800">{c.name}</span>
              <span className={`text-sm px-2 py-1 rounded-md font-medium \${c.type === 'Kirim' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {c.type}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
