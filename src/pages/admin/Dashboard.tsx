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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Grafik Penjualan
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Pendapatan berdasarkan periode transaksi paid
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="h-80">
            {salesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Belum ada data penjualan
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Metode Pembayaran
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Berdasarkan periode yang dipilih
            </p>
          </div>

          <div className="h-64">
            {paymentChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Belum ada data pembayaran
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
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
