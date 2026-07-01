import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, TrendingUp, ShoppingBag } from 'lucide-react';
import {
  format,
  subDays,
  startOfDay,
  startOfMonth,
  startOfYear,
  isAfter,
  isEqual,
} from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [paymentChartData, setPaymentChartData] = useState<any[]>([]);

  const [period, setPeriod] = useState<'today' | 'last7days' | 'month' | 'year' | 'all'>('today');
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    buildChartData();
  }, [period, allTransactions]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [txRes, usersRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('*, profiles:app_users(name)').order('created_at', { ascending: false }),
        supabase.from('app_users').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
      ]);

      const allTx = txRes.data || [];
      setAllTransactions(allTx);
      const todayTx = allTx.filter((t: any) => new Date(t.created_at) >= today && t.status === 'paid');

      const paidTx = allTx.filter((t: any) => t.status === 'paid');

      // Data penjualan 7 hari terakhir
      const last7Days = Array.from({ length: 7 }, (_, index) => {
        const date = subDays(new Date(), 6 - index);

        return {
          date,
          label: format(date, 'dd MMM', { locale: id }),
          revenue: 0,
          transactions: 0,
        };
      });

      paidTx.forEach((tx: any) => {
        const txDate = format(new Date(tx.created_at), 'yyyy-MM-dd');

        const dayData = last7Days.find(
          (item) => format(item.date, 'yyyy-MM-dd') === txDate
        );

        if (dayData) {
          dayData.revenue += Number(tx.total_amount || 0);
          dayData.transactions += 1;
        }
      });

      setSalesChartData(last7Days);

      // Data metode pembayaran
      const paymentSummary = paidTx.reduce((acc: any, tx: any) => {
        const method = String(tx.payment_method || 'unknown').toUpperCase();
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

      setPaymentChartData(
        Object.entries(paymentSummary).map(([name, value]) => ({
          name,
          value,
        }))
      );

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

  const getFilteredTransactionsByPeriod = () => {
    const paidTx = allTransactions.filter((tx: any) => tx.status === 'paid');
    const now = new Date();

    if (period === 'today') {
      const start = startOfDay(now);

      return paidTx.filter((tx: any) => {
        const txDate = new Date(tx.created_at);
        return isAfter(txDate, start) || isEqual(txDate, start);
      });
    }

    if (period === 'last7days') {
      const start = startOfDay(subDays(now, 6));

      return paidTx.filter((tx: any) => {
        const txDate = new Date(tx.created_at);
        return isAfter(txDate, start) || isEqual(txDate, start);
      });
    }

    if (period === 'month') {
      const start = startOfMonth(now);

      return paidTx.filter((tx: any) => {
        const txDate = new Date(tx.created_at);
        return isAfter(txDate, start) || isEqual(txDate, start);
      });
    }

    if (period === 'year') {
      const start = startOfYear(now);

      return paidTx.filter((tx: any) => {
        const txDate = new Date(tx.created_at);
        return isAfter(txDate, start) || isEqual(txDate, start);
      });
    }

    return paidTx;
  };

  const buildChartData = () => {
    const filteredTx = getFilteredTransactionsByPeriod();

    let groupedSales: any[] = [];

    if (period === 'today') {
      groupedSales = Array.from({ length: 24 }, (_, hour) => ({
        label: `${String(hour).padStart(2, '0')}:00`,
        revenue: 0,
        transactions: 0,
      }));

      filteredTx.forEach((tx: any) => {
        const hour = new Date(tx.created_at).getHours();
        groupedSales[hour].revenue += Number(tx.total_amount || 0);
        groupedSales[hour].transactions += 1;
      });
    }
    if (period === 'last7days') {
      groupedSales = Array.from({ length: 7 }, (_, index) => {
        const date = subDays(new Date(), 6 - index);

        return {
          date,
          label: format(date, 'dd MMM', { locale: id }),
          revenue: 0,
          transactions: 0,
        };
      });

      filteredTx.forEach((tx: any) => {
        const txDate = format(new Date(tx.created_at), 'yyyy-MM-dd');

        const dayData = groupedSales.find(
          (item) => format(item.date, 'yyyy-MM-dd') === txDate
        );

        if (dayData) {
          dayData.revenue += Number(tx.total_amount || 0);
          dayData.transactions += 1;
        }
      });
    }

    if (period === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      groupedSales = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;

        return {
          label: `${day}`,
          revenue: 0,
          transactions: 0,
        };
      });

      filteredTx.forEach((tx: any) => {
        const day = new Date(tx.created_at).getDate();
        groupedSales[day - 1].revenue += Number(tx.total_amount || 0);
        groupedSales[day - 1].transactions += 1;
      });
    }

    if (period === 'year') {
      groupedSales = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ].map((month) => ({
        label: month,
        revenue: 0,
        transactions: 0,
      }));

      filteredTx.forEach((tx: any) => {
        const month = new Date(tx.created_at).getMonth();
        groupedSales[month].revenue += Number(tx.total_amount || 0);
        groupedSales[month].transactions += 1;
      });
    }

    if (period === 'all') {
      const yearMap: any = {};

      filteredTx.forEach((tx: any) => {
        const year = format(new Date(tx.created_at), 'yyyy');

        if (!yearMap[year]) {
          yearMap[year] = {
            label: year,
            revenue: 0,
            transactions: 0,
          };
        }

        yearMap[year].revenue += Number(tx.total_amount || 0);
        yearMap[year].transactions += 1;
      });

      groupedSales = Object.values(yearMap);
    }

    setSalesChartData(groupedSales);

    const paymentSummary = filteredTx.reduce((acc: any, tx: any) => {
      const method = String(tx.payment_method || 'unknown').toUpperCase();
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    setPaymentChartData(
      Object.entries(paymentSummary).map(([name, value]) => ({
        name,
        value,
      }))
    );
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl flex items-center justify-center border border-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Hari Ini</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{formatCurrency(stats.todayRevenue)}</div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Pendapatan transaksi paid</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Hari Ini</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{stats.totalTransactions}</div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Jumlah nota cetak</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center border border-orange-100">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">Aktif</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{stats.totalProducts}</div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Total produk menu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center border border-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{stats.totalUsers}</div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Admin & Operator</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Grafik Penjualan</h3>
                  <p className="text-sm text-gray-400">Pendapatan berdasarkan periode transaksi paid</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Periode:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 bg-white outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
              >
                <option value="today">Hari Ini</option>
                <option value="last7days">7 Hari</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
                <option value="all">Semua</option>
              </select>
            </div>
          </div>

          <div className="h-80 min-h-[320px]">
            {!mounted ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              </div>
            ) : salesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Belum ada data penjualan
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={`bar-${salesChartData.length}`}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('id-ID', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(Number(value)),
                      'Pendapatan',
                    ]}
                    labelFormatter={(label) => {
                      if (period === 'today') return `Jam: ${label}`;
                      if (period === 'last7days') return `Tanggal: ${label}`;
                      if (period === 'month') return `Tanggal: ${label}`;
                      if (period === 'year') return `Bulan: ${label}`;
                      return `Tahun: ${label}`;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Pendapatan"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Metode Pembayaran</h3>
                <p className="text-sm text-gray-400">Berdasarkan periode yang dipilih</p>
              </div>
            </div>
          </div>

          <div className="h-64 min-h-[256px]">
            {!mounted ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              </div>
            ) : paymentChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Belum ada data pembayaran
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={`pie-${paymentChartData.length}`}>
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#16a34a' : '#f97316'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} transaksi`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-3 mt-4">
            {paymentChartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: index === 0 ? '#16a34a' : '#f97316',
                    }}
                  />
                  <span className="font-medium text-gray-700">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-gray-900">{String(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Tanggal</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Kasir</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Metode</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-red-50/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">{tx.profiles?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold capitalize
                        ${tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                        ${tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                        ${tx.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                        ${tx.status === 'voided' ? 'bg-red-50 text-red-700 border border-red-200 line-through' : ''}
                      `}>
                        {tx.status === 'voided' ? 'Dibatalkan' : tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
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
