import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Reports() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let startLimit = new Date();
      startLimit.setHours(0,0,0,0);

      if (filter === 'monthly') {
        startLimit.setDate(1); // First day of current month
      }

      const { data } = await supabase
        .from('transactions')
        .select(`*, profiles:app_users(name)`)
        .gte('created_at', startLimit.toISOString())
        .order('created_at', { ascending: false });

      if (data) setTransactions(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    const wsData = transactions.map((t) => ({
      ID: t.id,
      Tanggal: format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      Kasir: t.profiles?.name || '-',
      Total: Number(t.total_amount),
      Metode: t.payment_method.toUpperCase(),
      Status: t.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penjualan");
    XLSX.writeFile(wb, `Laporan_Penjualan_${filter}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan Penjualan (${filter === 'daily' ? 'Harian' : 'Bulanan'})`, 14, 15);
    
    const tableColumn = ["Tanggal", "Kasir", "Total", "Metode", "Status"];
    const tableRows = transactions.map(t => [
      format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      t.profiles?.name || '-',
      `Rp ${Number(t.total_amount).toLocaleString('id-ID')}`,
      t.payment_method.toUpperCase(),
      t.status.toUpperCase()
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save(`Laporan_Penjualan_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Penjualan</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as 'daily' | 'monthly')}
            className="border px-3 py-2 rounded-lg text-sm bg-white"
          >
            <option value="daily">Hari Ini</option>
            <option value="monthly">Bulan Ini</option>
          </select>

          <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Download className="w-4 h-4" /> Excel
          </button>
          
          <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium">Kasir</th>
                <th className="px-6 py-3 font-medium">Metode</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Memuat data...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada transaksi</td></tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">{format(new Date(t.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}</td>
                  <td className="px-6 py-4 capitalize">{t.profiles?.name || '-'}</td>
                  <td className="px-6 py-4 font-bold uppercase">{t.payment_method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">Rp {Number(t.total_amount).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
