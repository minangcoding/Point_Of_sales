import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Menu, X, Wallet, Banknote, Utensils } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useShift } from '../contexts/ShiftContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

export default function OperatorLayout() {
  const { signOut, profile } = useAuth();
  const { currentShift, tableReady } = useShift();
  const { showToast } = useToast();
  const isAdmin = profile?.role === 'admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftAmount, setShiftAmount] = useState<number | ''>('');
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-warm-50 to-warm-100">
      {/* Premium Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            className="sm:hidden text-gray-500 hover:text-gray-900 p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-amber-600 rounded-xl blur-sm opacity-50" />
              <div className="relative w-full h-full bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                <img
                  src="/logo Pondok Salero.png"
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight hidden sm:block">Pondok <span className="text-red-600">Salero</span></h1>
          </div>
          <nav className="hidden sm:flex gap-1 ml-4 border-l border-gray-200 pl-4">
            <Link to="/pos" className={cn("text-sm font-medium px-4 py-2 rounded-xl transition-all", location.pathname === '/pos' ? 'bg-red-50 text-red-700 shadow-sm' : 'hover:bg-warm-100 text-gray-600')}>POS</Link>
            <Link to="/pos/history" className={cn("text-sm font-medium px-4 py-2 rounded-xl transition-all", location.pathname === '/pos/history' ? 'bg-red-50 text-red-700 shadow-sm' : 'hover:bg-warm-100 text-gray-600')}>Riwayat Transaksi</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shift Status Button */}
          {tableReady && (
          <button
            onClick={() => setShowShiftModal(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border shadow-sm",
              currentShift
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-md"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-md"
            )}
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">
              {currentShift ? `Kasir Buka (Rp ${currentShift.opening_amount.toLocaleString('id-ID')})` : 'Buka Kasir'}
            </span>
            <span className="sm:hidden">
              {currentShift ? 'Buka' : 'Tutup'}
            </span>
          </button>
          )}

          {isAdmin && (
            <Link to="/admin" className="hidden sm:flex text-sm text-gray-600 hover:text-red-700 font-medium items-center gap-2 bg-warm-50 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-gray-200 hover:border-red-200 shadow-sm">
              <Home className="w-4 h-4" /> Admin
            </Link>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-gray-900 capitalize">{profile?.name}</p>
            <p className="text-xs text-gray-500 capitalize font-medium">{profile?.role}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col z-50 w-72 transform transition-transform duration-300 ease-in-out sm:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 relative flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-amber-600 rounded-xl blur-sm opacity-60" />
              <div className="relative w-full h-full bg-gray-900 rounded-xl flex items-center justify-center border border-white/10">
                <Utensils className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-white leading-tight">Pondok <span className="text-red-400">Salero</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-white capitalize">{profile?.name}</p>
              <p className="text-xs text-gray-400 capitalize font-medium">{profile?.role}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <Link
            onClick={() => setIsMobileMenuOpen(false)}
            to="/pos"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/pos'
                ? 'bg-gradient-to-r from-red-600/20 to-amber-600/10 text-red-300 border border-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
            POS
          </Link>
          <Link
            onClick={() => setIsMobileMenuOpen(false)}
            to="/pos/history"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/pos/history'
                ? 'bg-gradient-to-r from-red-600/20 to-amber-600/10 text-red-300 border border-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
            Riwayat Transaksi
          </Link>
          {isAdmin && (
            <Link
              onClick={() => setIsMobileMenuOpen(false)}
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Home className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>

      {/* Shift Modal */}
      {tableReady && showShiftModal && (
        <ShiftModal
          isOpen={showShiftModal}
          onClose={() => { setShowShiftModal(false); setShiftAmount(''); }}
          currentShift={currentShift}
          amount={shiftAmount}
          setAmount={setShiftAmount}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function ShiftModal({
  isOpen,
  onClose,
  currentShift,
  amount,
  setAmount,
  showToast
}: {
  isOpen: boolean;
  onClose: () => void;
  currentShift: any;
  amount: number | '';
  setAmount: (v: number | '') => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const { openShift, closeShift } = useShift();
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (amount === '' || Number(amount) < 0) return;
    setLoading(true);
    try {
      await openShift(Number(amount));
      showToast('Kasir berhasil dibuka!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuka kasir', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (amount === '' || Number(amount) < 0) return;
    setLoading(true);
    try {
      await closeShift(Number(amount));
      showToast('Kasir berhasil ditutup!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menutup kasir', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">
            {currentShift ? 'Tutup Kasir' : 'Buka Kasir'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors">×</button>
        </div>
        
        <div className="p-6">
          {currentShift ? (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Kasir Sedang Buka</p>
                  <p className="text-xs text-emerald-600 font-medium">Modal awal: Rp {currentShift.opening_amount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">Mulai Shift Hari Ini</p>
                  <p className="text-xs text-amber-600 font-medium">Masukkan jumlah uang modal kasir</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {currentShift ? 'Jumlah Uang di Kasir (Rp)' : 'Modal Awal Kasir (Rp)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-gray-400 font-bold text-lg">Rp</span>
              </div>
              <input
                type="number"
                autoFocus
                value={amount === '' ? '' : amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-2xl font-bold text-gray-900 p-4 pl-14 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <button
            disabled={loading || amount === ''}
            onClick={currentShift ? handleClose : handleOpen}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]",
              currentShift
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-red-600/20"
                : "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-emerald-600/20"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : currentShift ? (
              'Tutup Kasir'
            ) : (
              'Buka Kasir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
