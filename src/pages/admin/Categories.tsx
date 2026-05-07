import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '../../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [categoryPage, setCategoryPage] = useState(1);
  const itemsPerPage = 7;

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ id: '', name: '' });
  const [editingCat, setEditingCat] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await supabase.from('categories').update({ name: catForm.name }).eq('id', catForm.id);
      } else {
        await supabase.from('categories').insert({ name: catForm.name });
      }
      setIsCatModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving category");
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Hapus kategori? Produk terkait akan kehilangan kategori.')) {
      try {
        await supabase.from('categories').delete().eq('id', id);
        fetchData();
      } catch (err) {
        alert("Error deleting category");
      }
    }
  };

  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * itemsPerPage;
    return categories.slice(start, start + itemsPerPage);
  }, [categories, categoryPage]);

  const totalCategoryPages = Math.ceil(categories.length / itemsPerPage);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Categories Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Master Kategori</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola jenis kategori makanan.</p>
          </div>
          <button
            onClick={() => { setEditingCat(false); setCatForm({id:'', name:''}); setIsCatModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:w-2/3 lg:w-1/2">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Nama Kategori</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCategories.length === 0 ? (
                    <tr><td colSpan={2} className="px-6 py-12 text-center text-gray-500">Belum ada kategori.</td></tr>
                  ) : paginatedCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCat(true); setCatForm({id: cat.id, name: cat.name}); setIsCatModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Categories Pagination */}
           {totalCategoryPages > 1 && (
             <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
               <span className="text-sm text-gray-500 font-medium">Halaman {categoryPage} dari {totalCategoryPages}</span>
               <div className="flex gap-2">
                 <button 
                   disabled={categoryPage === 1}
                   onClick={() => setCategoryPage(p => Math.max(1, p - 1))}
                   className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button 
                   disabled={categoryPage === totalCategoryPages}
                   onClick={() => setCategoryPage(p => Math.min(totalCategoryPages, p + 1))}
                   className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="text-xl font-bold text-gray-900">{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm border border-gray-100">×</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kategori</label>
                <input required type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="Makanan, Minuman, dl..." />
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm hover:shadow active:scale-95">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
