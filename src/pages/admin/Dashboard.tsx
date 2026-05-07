import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, TrendingUp, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      const [txRes, usersRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('*, profiles:app_users(name)').order('created_at', { ascending: false }),
        supabase.from('app_users').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
      ]);
      
      const allTx = txRes.data || [];
      const todayTx = allTx.filter((t: any) => new Date(t.created_at) >= today && t.status === 'paid');
      
      setStats({
        todayRevenue: todayTx.reduce((sum, t) => sum + Number(t.total_amount), 0),
        totalTransactions: todayTx.length,
        totalUsers: usersRes.count || 0,
        totalProducts: prodRes.count || 0
      });

      setRecentTransactions(allTx.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  if (loading) {
    return <div className="text-gray-500">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Pendapatan Hari Ini</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</div>
          <p className="text-xs text-gray-500 mt-1">Status transaksi sukses (Paid)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Transaksi Hari Ini</h3>
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</div>
          <p className="text-xs text-gray-500 mt-1">Jumlah nota cetak</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Produk</h3>
            <ShoppingBag className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          <p className="text-xs text-gray-500 mt-1">Item aktif</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Karyawan</h3>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <p className="text-xs text-gray-500 mt-1">Admin & Kasir</p>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th padding-3="true" className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium">Kasir</th>
                <th className="px-6 py-3 font-medium">Metode</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4 capitalize">{tx.profiles?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 uppercase font-medium">{tx.payment_method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                        ${tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${tx.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(Number(tx.total_amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
