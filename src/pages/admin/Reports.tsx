import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, TrendingUp, TrendingDown, Award, BarChart3, Layers, DollarSign, Wallet, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useToast } from '../../contexts/ToastContext';

interface ProductStat {
  name: string;
  qty: number;
  revenue: number;
  cost: number;    // Total Harga Modal
  profit: number;  // Keuntungan Bersih
}

interface CategoryStat {
  name: string;
  qty: number;
  revenue: number;
}

interface FinancialStat {
  revenue: number;
  cost: number;
  profit: number;
}

export default function Reports() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [financials, setFinancials] = useState<FinancialStat>({ revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'daily' | 'monthly'>('daily');

  // TAMBAHAN: State viewMode sekarang ada 3 pilihan
  const [viewMode, setViewMode] = useState<'analytics' | 'profit' | 'table'>('analytics');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let startLimit = new Date();
      startLimit.setHours(0, 0, 0, 0);

      if (filter === 'monthly') {
        startLimit.setDate(1);
      }

      // Kueri Supabase: Menambahkan cost_price dari transaction_items
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:app_users(name),
          transaction_items(
            quantity,
            price,
            cost_price,
            products(
              name,
              categories(name)
            )
          )
        `)
        .gte('created_at', startLimit.toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setTransactions(data);

        const pStats: Record<string, ProductStat> = {};
        const cStats: Record<string, CategoryStat> = {};
        let totalRev = 0;
        let totalCost = 0;

        data.forEach((tx) => {
          if (tx.status === 'paid' && tx.transaction_items) {
            tx.transaction_items.forEach((item: any) => {
              const pName = item.products?.name || 'Produk Terhapus';
              const cName = item.products?.categories?.name || 'Tanpa Kategori';

              const itemRev = item.quantity * item.price;
              const itemCost = item.quantity * (item.cost_price || 0);
              const itemProfit = itemRev - itemCost;

              // Keuangan Keseluruhan
              totalRev += itemRev;
              totalCost += itemCost;

              // Agregasi Produk
              if (!pStats[pName]) {
                pStats[pName] = { name: pName, qty: 0, revenue: 0, cost: 0, profit: 0 };
              }
              pStats[pName].qty += item.quantity;
              pStats[pName].revenue += itemRev;
              pStats[pName].cost += itemCost;
              pStats[pName].profit += itemProfit;

              // Agregasi Kategori
              if (!cStats[cName]) {
                cStats[cName] = { name: cName, qty: 0, revenue: 0 };
              }
              cStats[cName].qty += item.quantity;
              cStats[cName].revenue += itemRev;
            });
          }
        });

        setProductStats(Object.values(pStats));
        setCategoryStats(Object.values(cStats));
        setFinancials({ revenue: totalRev, cost: totalCost, profit: totalRev - totalCost });
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    try {
      const wsData = transactions.map((t) => ({
        ID: t.id,
        Tanggal: format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
        Kasir: t.profiles?.name || '-',
        Total: Number(t.total_amount) || 0,
        Metode: (t.payment_method || '').toUpperCase(),
        Status: (t.status || '').toUpperCase()
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penjualan");
      XLSX.writeFile(wb, `Laporan_Penjualan_${filter}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showToast('Gagal mengekspor Excel.', "error");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(`Laporan Penjualan (${filter === 'daily' ? 'Harian' : 'Bulanan'})`, 14, 15);

      const tableColumn = ["Tanggal", "Kasir", "Total", "Metode", "Status"];
      const tableRows = transactions.map(t => [
        format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
        t.profiles?.name || '-',
        `Rp ${(Number(t.total_amount) || 0).toLocaleString('id-ID')}`,
        (t.payment_method || '').toUpperCase(),
        (t.status || '').toUpperCase()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });

      doc.save(`Laporan_Penjualan_${filter}_${format(new Date(), 'ddMMyyyy')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Gagal mengekspor PDF.', "error");
    }
  };

  // Sorting
  const topSold = [...productStats].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topCategories = [...categoryStats].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topRevenue = [...productStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const leastSold = [...productStats].sort((a, b) => a.qty - b.qty).slice(0, 5);

  // Sorting untuk tabel laba rugi per produk
  const profitProducts = [...productStats].sort((a, b) => b.profit - a.profit);

  // Math max for charts
  const maxQty = Math.max(...productStats.map(s => s.qty), 1);
  const maxCatQty = Math.max(...categoryStats.map(s => s.qty), 1);
  const maxRev = Math.max(...productStats.map(s => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl flex items-center justify-center border border-red-100">
              <BarChart3 className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Laporan & Keuangan</h2>
          </div>
          <p className="text-sm text-gray-400 ml-[52px] mt-1">Pantau analitik, laba rugi, dan data transaksi usahamu.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 mr-2 overflow-x-auto">
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-5 py-1.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'analytics' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Analitik Usaha
            </button>
            <button
              onClick={() => setViewMode('profit')}
              className={`px-5 py-1.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'profit' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Laba Rugi
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-5 py-1.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${viewMode === 'table' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Data Transaksi
            </button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'daily' | 'monthly')}
            className="border-2 border-gray-200 px-3 py-2 rounded-2xl text-sm bg-white font-bold focus:border-red-400 focus:ring-4 focus:ring-red-100/50 outline-none transition-all"
          >
            <option value="daily">Hari Ini</option>
            <option value="monthly">Bulan Ini</option>
          </select>

          {viewMode === 'table' && (
            <>
              <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-bold transition-all shadow-sm btn-press">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold transition-all shadow-sm btn-press">
                <Download className="w-4 h-4" /> PDF
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'profit' ? (
        /* ================= PROFIT & LOSS VIEW ================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Omzet Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Omzet</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Rp {financials.revenue.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            {/* HPP / Modal Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <Calculator className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Modal (HPP)</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Rp {financials.cost.toLocaleString('id-ID')}</h3>
              </div>
            </div>

            {/* Laba Bersih Card */}
            <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${financials.profit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-600 text-white' : 'bg-gradient-to-br from-red-500 to-rose-600 border-red-600 text-white'}`}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Laba Bersih</p>
                <h3 className="text-2xl font-extrabold">Rp {financials.profit.toLocaleString('id-ID')}</h3>
              </div>
            </div>
          </div>

          {/* Profit Detail Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Rincian Laba per Produk</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Margin keuntungan dari masing-masing menu yang terjual</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Nama Produk</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-center">Terjual</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Omzet</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Modal (HPP)</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Laba Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profitProducts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada data laba rugi</td></tr>
                  ) : profitProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-600">{p.qty}x</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">Rp {p.revenue.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right font-bold text-orange-500">Rp {p.cost.toLocaleString('id-ID')}</td>
                      <td className={`px-6 py-4 text-right font-extrabold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.profit >= 0 ? '+ ' : '- '}Rp {Math.abs(p.profit).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : viewMode === 'analytics' ? (
        /* ================= ANALYTICS VIEW ================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          {productStats.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Belum Ada Data Penjualan</h3>
              <p className="text-gray-500 text-sm">Analitik akan muncul setelah ada transaksi yang berhasil (Paid).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Card 1: 5 Produk Terlaris */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 premium-shadow card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">5 Produk Terlaris</h3>
                    <p className="text-xs text-gray-500">Menu paling banyak dipesan pelanggan</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {topSold.map((prod, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{idx + 1}. {prod.name}</span>
                        <span className="font-bold text-green-600">{prod.qty} porsi</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(prod.qty / maxQty) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Kategori Terlaris */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kategori Terlaris</h3>
                    <p className="text-xs text-gray-500">Kelompok menu yang paling mendominasi</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {topCategories.map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{idx + 1}. {cat.name}</span>
                        <span className="font-bold text-purple-600">{cat.qty} item terjual</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(cat.qty / maxCatQty) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Top Revenue */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Penyumbang Omzet Terbesar</h3>
                    <p className="text-xs text-gray-500">Produk yang menghasilkan uang paling banyak</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {topRevenue.map((prod, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{prod.name}</span>
                        <span className="font-bold text-blue-600">Rp {prod.revenue.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(prod.revenue / maxRev) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Produk Kurang Laris */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Produk Kurang Diminati</h3>
                    <p className="text-xs text-gray-500">Menu dengan angka penjualan terendah</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {leastSold.map((prod, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{prod.name}</span>
                        <span className="font-bold text-red-500">{prod.qty} porsi</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.max(5, (prod.qty / maxQty) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300 card-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Kasir</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Metode</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Total Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada transaksi di periode ini</td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-600">{format(new Date(t.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}</td>
                    <td className="px-6 py-4 capitalize font-bold text-gray-900">{t.profiles?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl font-bold uppercase border border-gray-200">
                        {t.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold tracking-wide uppercase border ${t.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : t.status === 'voided' ? 'bg-red-50 text-red-700 border-red-200 line-through' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {t.status === 'voided' ? 'DIBATALKAN' : t.status}
                      </span>
                      {t.notes && <p className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate">{t.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-base">
                      Rp {Number(t.total_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
