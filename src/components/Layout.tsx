import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, List, PlusCircle, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const Layout = () => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Boshqaruv', icon: Home },
    { to: '/transactions', label: 'Tranzaksiyalar', icon: List },
    { to: '/add-transaction', label: 'Qo\'shish', icon: PlusCircle },
    { to: '/accounts', label: 'Hisoblar', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <span className="bg-blue-100 p-1.5 rounded-lg">M</span>
            Moliya Tizimi
          </h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              U
            </div>
            <div className="text-sm">
              <p className="font-medium">User</p>
              <p className="text-slate-500 text-xs">user@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800">
            {links.find(l => l.to === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
