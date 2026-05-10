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
  const [catForm, setCatForm] = useState({ id: '', name: '', code: '' });
  const [editingCat, setEditingCat] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

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
        const { error } = await supabase.from('categories').update({ name: catForm.name, code: catForm.code }).eq('id', catForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert({ name: catForm.name, code: catForm.code });
        if (error) throw error;
      }
      setIsCatModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error saving category");
    }
  };

  const confirmDelete = (id: string) => {
    setCatToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteCategory = async () => {
    if (catToDelete) {
      try {
        await supabase.from('categories').delete().eq('id', catToDelete);
        fetchData();
        setIsDeleteModalOpen(false);
        setCatToDelete(null);
      } catch (err) {
        alert("Error deleting category");
        setIsDeleteModalOpen(false);
        setCatToDelete(null);
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
            onClick={() => { setEditingCat(false); setCatForm({id:'', name:'', code:''}); setIsCatModalOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 font-semibold tracking-wider">Kode Kategori</th>
                    <th className="px-6 py-5 font-semibold tracking-wider">Nama Kategori</th>
                    <th className="px-6 py-5 font-semibold tracking-wider text-center">Created By</th>
                    <th className="px-6 py-5 font-semibold tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCategories.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500 bg-gray-50/30">Belum ada kategori.</td></tr>
                  ) : paginatedCategories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                        {cat.code || `CAT-${cat.name.substring(0, 3).toUpperCase()}${(index + 1).toString().padStart(2, '0')}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-purple-100 text-purple-700 border border-purple-200">
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingCat(true); setCatForm({id: cat.id, name: cat.name, code: cat.code || `CAT-${cat.name.substring(0, 3).toUpperCase()}${(index + 1).toString().padStart(2, '0')}`}); setIsCatModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => confirmDelete(cat.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 flex justify-between items-start bg-white relative border-b border-gray-50">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">{editingCat ? 'Perbarui nama kategori.' : 'Tambahkan kategori makanan baru.'}</p>
              </div>
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-sm transition-colors mt-1">×</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kode Kategori</label>
                  <input required type="text" value={catForm.code} onChange={e => setCatForm({...catForm, code: e.target.value.toUpperCase()})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-mono font-semibold text-gray-900 placeholder:font-sans placeholder:font-medium placeholder:text-gray-400" placeholder="Contoh: CAT-MAK" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kategori</label>
                  <input required type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" placeholder="Makanan, Minuman, dll..." />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex-1 sm:flex-none">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hapus Kategori?</h3>
              <p className="text-sm text-gray-500 font-medium">Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.</p>
              
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsDeleteModalOpen(false); setCatToDelete(null); }} 
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={deleteCategory} 
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
