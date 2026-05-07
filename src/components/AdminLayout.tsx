import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Settings, LogOut, FileText, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Transaksi & POS', href: '/pos', icon: ShoppingCart },
    { name: 'Data Karyawan', href: '/admin/users', icon: Users },
    { name: 'Master Produk', href: '/admin/products', icon: Package },
    { name: 'Laporan Penjualan', href: '/admin/reports', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div id="admin-logo-wrapper" className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] relative flex-shrink-0 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Bakso<br className="sm:hidden" /><span className="text-red-600 sm:ml-1">Prasmanan</span></h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                )} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 md:hidden bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-[40px] h-[40px] relative flex-shrink-0 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Bakso <span className="text-red-600">Prasmanan</span></h1>
          </div>
          <button onClick={signOut} className="text-gray-500 hover:text-gray-700">
            <LogOut className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
