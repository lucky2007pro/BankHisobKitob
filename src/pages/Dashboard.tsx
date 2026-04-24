import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

interface Stats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyStats: { month: string, type: string, total: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/finance/statistics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      });
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>;

  // Process data for charts
  const chartDataMap: Record<string, any> = {};
  stats.monthlyStats.forEach(item => {
    if (!chartDataMap[item.month]) {
      chartDataMap[item.month] = { name: item.month, Kirim: 0, Chiqim: 0 };
    }
    chartDataMap[item.month][item.type] = item.total;
  });
  const chartData = Object.values(chartDataMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jami Balans</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalBalance.toLocaleString()} so'm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpCircle size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jami Kirim</p>
            <p className="text-2xl font-bold text-emerald-600">+{stats.totalIncome.toLocaleString()} so'm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownCircle size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jami Chiqim</p>
            <p className="text-2xl font-bold text-rose-600">-{stats.totalExpense.toLocaleString()} so'm</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Oylik Statistika</h3>
        <div className="h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Kirim" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Chiqim" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">Ma'lumot topilmadi</div>
          )}
        </div>
      </div>
    </div>
  );
}
