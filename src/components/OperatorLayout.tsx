import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function OperatorLayout() {
  const { signOut, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            className="sm:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex-shrink-0 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight hidden sm:block">Bakso <span className="text-red-600">Prasmanan</span></h1>
          </div>
          <nav className="hidden sm:flex gap-1 ml-4 border-l border-gray-200 pl-4">
            <Link to="/pos" className={cn("text-sm font-medium px-4 py-2 rounded-lg transition-colors", location.pathname === '/pos' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700')}>POS</Link>
            <Link to="/pos/history" className={cn("text-sm font-medium px-4 py-2 rounded-lg transition-colors", location.pathname === '/pos/history' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700')}>Riwayat Transaksi</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
             <Link to="/admin" className="hidden sm:flex text-sm text-gray-700 hover:text-blue-700 font-medium items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors border border-gray-200 mr-2">
               <Home className="w-4 h-4"/> Admin Panel
             </Link>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 capitalize">{profile?.name}</p>
            <p className="text-xs text-gray-500 capitalize font-medium">{profile?.role}</p>
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

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex flex-col z-50 w-64 transform transition-transform duration-300 sm:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Bakso <span className="text-red-600">Prasmanan</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
           <p className="text-sm font-bold text-gray-900 capitalize">{profile?.name}</p>
           <p className="text-xs text-gray-500 capitalize font-medium">{profile?.role}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/pos" className={cn("flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors", location.pathname === '/pos' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}>POS</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/pos/history" className={cn("flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors", location.pathname === '/pos/history' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}>Riwayat Transaksi</Link>
            {isAdmin && (
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <Home className="w-4 h-4 mr-2"/>
                Admin Panel
              </Link>
            )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
