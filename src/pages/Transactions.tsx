import React, { useEffect, useState } from 'react';
import { Trash2, Image as ImageIcon, Filter, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    month: '',
    year: ''
  });

  const fetchTransactions = () => {
    const query = new URLSearchParams(filters).toString();
    fetch(`/api/finance/transactions?\${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTransactions(data.transactions);
      });
  };

  useEffect(() => {
    fetchTransactions();
    fetch('/api/finance/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.categories);
      });
  }, [filters]);

  const handleDelete = (id: number) => {
    if (confirm('Rostdan ham o\'chirmoqchimisiz?')) {
      fetch(`/api/finance/transactions/\${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) fetchTransactions();
        });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
          <Filter size={18} /> Filtrlar
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Barcha turlar</option>
            <option value="Kirim">Kirim</option>
            <option value="Chiqim">Chiqim</option>
          </select>

          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="">Barcha oylar</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const val = m.toString().padStart(2, '0');
              return <option key={val} value={val}>{val}-oy</option>;
            })}
          </select>

          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Barcha yillar</option>
            {['2023', '2024', '2025', '2026'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Sana</th>
              <th className="px-6 py-4 font-medium">Kategoriya</th>
              <th className="px-6 py-4 font-medium">Hisob</th>
              <th className="px-6 py-4 font-medium">Izoh</th>
              <th className="px-6 py-4 font-medium">Summa</th>
              <th className="px-6 py-4 font-medium">Chek</th>
              <th className="px-6 py-4 font-medium text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(trx => (
              <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-600">
                  {format(new Date(trx.date), 'dd.MM.yyyy')}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {trx.category_name}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {trx.account_name}
                </td>
                <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                  {trx.comment || '-'}
                </td>
                <td className="px-6 py-4 font-bold">
                  <span className={trx.type === 'Kirim' ? 'text-emerald-600' : 'text-rose-600'}>
                    {trx.type === 'Kirim' ? '+' : '-'}{trx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {trx.receipt_image ? (
                    <a href={trx.receipt_image} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                      <ImageIcon size={16} /> Ko'rish
                    </a>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {/* Edit button disabled for simplicity, but could route to an edit form */}
                  <button 
                    onClick={() => handleDelete(trx.id)}
                    className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Ma'lumot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
