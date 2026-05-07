import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function History() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchHistory();
  }, [profile]);

  const fetchHistory = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0,0,0,0);

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
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (data) setTransactions(data);
    } catch (err) {
      console.error(err);
    }
    
    setLoading(false);
  };

  if (loading) {
     return <div className="p-8 text-gray-500">Memuat riwayat transaksi...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-gray-50">
       <div className="max-w-4xl mx-auto">
         <h2 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Transaksi (Hari Ini)</h2>
         
         <div className="space-y-4">
           {transactions.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                Belum ada transaksi yang Anda proses hari ini.
             </div>
           ) : (
             transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 border-b border-gray-100 pb-4">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Waktu Transaksi</span>
                        <span className="font-semibold text-gray-900">
                          {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                        </span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="font-bold uppercase text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                           {tx.payment_method}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                           tx.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                           {tx.status}
                        </span>
                      </div>
                   </div>

                   <div className="space-y-2 mb-4">
                     {tx.transaction_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                           <span className="text-gray-700">
                             {item.quantity}x <span className="font-medium text-gray-900">{item.products?.name}</span>
                           </span>
                           <span className="text-gray-600">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                     ))}
                   </div>

                   <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="font-medium text-gray-500">Total Harga</span>
                      <span className="text-xl font-bold text-gray-900">Rp {Number(tx.total_amount).toLocaleString('id-ID')}</span>
                   </div>
                </div>
             ))
           )}
         </div>
       </div>
    </div>
  );
}
