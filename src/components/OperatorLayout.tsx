import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OperatorLayout() {
  const { signOut, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] relative flex-shrink-0 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Bakso<br className="sm:hidden" /><span className="text-red-600 sm:ml-1">Prasmanan</span></h1>
          </div>
          <nav className="hidden sm:flex gap-1 ml-4 border-l border-gray-200 pl-4">
            <Link to="/pos" className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700">POS</Link>
            <Link to="/pos/history" className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700">Riwayat Transaksi</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
             <Link to="/admin" className="hidden sm:flex text-sm text-gray-500 hover:text-blue-600 items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-md mr-2">
               <Home className="w-4 h-4"/> Admin Panel
             </Link>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 capitalize">{profile?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
