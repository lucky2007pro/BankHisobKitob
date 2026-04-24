import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';

export default function AddTransaction() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    type: 'Chiqim',
    account_id: '',
    category_id: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    comment: ''
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetch('/api/finance/accounts').then(r => r.json()).then(d => {
      if (d.success) {
        setAccounts(d.accounts);
        if (d.accounts.length > 0) setForm(f => ({ ...f, account_id: d.accounts[0].id }));
      }
    });
    fetch('/api/finance/categories').then(r => r.json()).then(d => {
      if (d.success) {
        setCategories(d.categories);
        const filtered = d.categories.filter((c: any) => c.type === 'Chiqim');
        if (filtered.length > 0) setForm(f => ({ ...f, category_id: filtered[0].id }));
      }
    });
  }, []);

  const handleTypeChange = (type: string) => {
    const filtered = categories.filter(c => c.type === type);
    setForm(f => ({ 
      ...f, 
      type, 
      category_id: filtered.length > 0 ? filtered[0].id : '' 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    if (file) {
      formData.append('receipt_image', file);
    }

    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        navigate('/transactions');
      } else {
        alert('Xatolik yuz berdi');
      }
    } catch (error) {
      console.error(error);
      alert('Xatolik yuz berdi');
    }
  };

  const filteredCategories = categories.filter(c => c.type === form.type);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Yangi Tranzaksiya Qo'shish</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl w-full max-w-sm">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors \${form.type === 'Chiqim' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => handleTypeChange('Chiqim')}
          >
            Chiqim
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors \${form.type === 'Kirim' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => handleTypeChange('Kirim')}
          >
            Kirim
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Summa (so'm)</label>
            <input 
              type="number" 
              required
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sana</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Hisob raqam</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={form.account_id}
              onChange={e => setForm({...form, account_id: e.target.value})}
            >
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Kategoriya</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={form.category_id}
              onChange={e => setForm({...form, category_id: e.target.value})}
            >
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Izoh (ixtiyoriy)</label>
          <textarea 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[100px]"
            placeholder="Tranzaksiya haqida qisqacha ma'lumot..."
            value={form.comment}
            onChange={e => setForm({...form, comment: e.target.value})}
          />
        </div>

        {/* Receipt Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Chek / Rasm (ixtiyoriy)</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <UploadCloud size={32} className="text-slate-400" />
              <p className="text-sm text-slate-600 font-medium">
                {file ? file.name : "Faylni tanlang yoki shu yerga tashlang"}
              </p>
              <p className="text-xs text-slate-400">PNG, JPG 10MB gacha</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
          >
            <Save size={20} />
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
}
