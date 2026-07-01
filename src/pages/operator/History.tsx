import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function History() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week'>('today');
  const [voidModal, setVoidModal] = useState<{ open: boolean; txId: string | null }>({ open: false, txId: null });
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    if (profile) fetchHistory();
  }, [profile, dateFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    const now = new Date();
    let startDate: Date;

    if (dateFilter === 'today') {
      startDate = startOfDay(now);
    } else if (dateFilter === 'yesterday') {
      startDate = startOfDay(subDays(now, 1));
    } else {
      startDate = startOfDay(subDays(now, 6));
    }

    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items(
            *,
            products(name)
          )
        `)
        .eq('operator_id', profile?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (data) setTransactions(data);
    } catch (err) {
      console.error(err);
    }
    
    setLoading(false);
  };

  const handleVoid = async () => {
    if (!voidModal.txId) return;
    
    try {
      // Get transaction items to restore stock
      const { data: items } = await supabase
        .from('transaction_items')
        .select('product_id, quantity')
        .eq('transaction_id', voidModal.txId);

      // Restore stock
      if (items) {
        for (const item of items) {
          await supabase.rpc('increment_stock', { 
            p_product_id: item.product_id, 
            p_qty: item.quantity 
          }).then(({ error }) => {
            if (error) {
              // Fallback
              supabase.from('products').select('stock').eq('id', item.product_id).single().then(({ data }) => {
                if (data) {
                  supabase.from('products').update({ stock: (data.stock || 0) + item.quantity }).eq('id', item.product_id);
                }
              });
            }
          });
        }
      }

      // Update transaction status to voided
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'voided',
          notes: voidReason || 'Dibatalkan oleh operator'
        })
        .eq('id', voidModal.txId);

      if (error) throw error;

      showToast('Transaksi berhasil dibatalkan', 'success');
      setVoidModal({ open: false, txId: null });
      setVoidReason('');
      fetchHistory();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan transaksi', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-500 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-gradient-to-br from-warm-50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl flex items-center justify-center border border-red-100">
                <Calendar className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Riwayat Transaksi</h2>
            </div>
            <p className="text-sm text-gray-400 ml-[52px] mt-1">Catatan transaksi POS Pondok Salero</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setDateFilter('today')}
              className={cn("px-5 py-2 rounded-xl text-sm font-bold transition-all", dateFilter === 'today' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={cn("px-5 py-2 rounded-xl text-sm font-bold transition-all", dateFilter === 'yesterday' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Kemarin
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={cn("px-5 py-2 rounded-xl text-sm font-bold transition-all", dateFilter === 'week' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              7 Hari
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center premium-shadow">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">Belum ada transaksi di periode ini.</p>
              <p className="text-xs text-gray-300 mt-1">Transaksi yang sudah diproses akan muncul disini</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className={cn(
                "bg-white rounded-2xl border overflow-hidden premium-shadow card-hover",
                tx.status === 'voided' ? 'border-red-100 opacity-60' : 'border-gray-100'
              )}>
                 <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                   <div className="flex items-center gap-3">
                     <div className={cn(
                       "w-10 h-10 rounded-2xl flex items-center justify-center",
                       tx.status === 'paid' ? 'bg-emerald-50' : 'bg-red-50'
                     )}>
                       <Calendar className={cn("w-5 h-5", tx.status === 'paid' ? 'text-emerald-600' : 'text-red-400')} />
                     </div>
                     <div>
                       <p className="text-xs text-gray-400 font-medium">Waktu Transaksi</p>
                       <p className="font-bold text-gray-900">
                         {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                       </p>
                     </div>
                   </div>
                   <div className="flex gap-2 items-center">
                     <span className="font-bold uppercase text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                        {tx.payment_method}
                     </span>
                     <span className={cn("px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border",
                        tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        tx.status === 'voided' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                     )}>
                        {tx.status === 'voided' ? 'DIBATALKAN' : tx.status}
                     </span>
                     {tx.status === 'paid' && (
                       <button
                         onClick={() => setVoidModal({ open: true, txId: tx.id })}
                         className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                         title="Batalkan Transaksi"
                       >
                         <XCircle className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="px-6 py-4 space-y-2">
                   {tx.transaction_items?.map((item: any) => (
                     <div key={item.id} className="flex justify-between items-center text-sm">
                         <span className="text-gray-600">
                           {item.quantity}x <span className="font-bold text-gray-900">{item.products?.name}</span>
                         </span>
                         <span className="font-semibold text-gray-900">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                     </div>
                   ))}
                 </div>

                 <div className="px-6 py-4 flex justify-between items-center border-t border-dashed border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                   <span className="font-medium text-gray-500">Total Harga</span>
                   <span className="text-xl font-extrabold text-gray-900">Rp {Number(tx.total_amount).toLocaleString('id-ID')}</span>
                 </div>

                 {tx.notes && (
                   <div className="mx-6 mb-4 p-3 bg-red-50/80 border border-red-100 rounded-xl">
                     <p className="text-xs font-medium text-red-600">Catatan: {tx.notes}</p>
                   </div>
                 )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {voidModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-rose-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Batalkan Transaksi?</h3>
              <p className="text-sm text-gray-500 mb-6">Stok akan dikembalikan secara otomatis. Tindakan ini tidak dapat dibatalkan.</p>
              
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Alasan pembatalan (opsional)"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-100/50 outline-none text-sm font-medium transition-all mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setVoidModal({ open: false, txId: null }); setVoidReason(''); }}
                  className="flex-1 px-4 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleVoid}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold rounded-2xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
