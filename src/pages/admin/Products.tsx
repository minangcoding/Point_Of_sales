import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Category } from '../../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [productPage, setProductPage] = useState(1);
  const itemsPerPage = 7;

  // Product Modal State
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', category_id: '', image_url: '' });
  const [editingProd, setEditingProd] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsResponse, prodsResponse] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select(`*, categories(name)`).order('name')
      ]);
      
      if (catsResponse.data) setCategories(catsResponse.data);
      if (prodsResponse.data) setProducts(prodsResponse.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodForm.name,
      price: Number(prodForm.price),
      category_id: prodForm.category_id || null,
      image_url: prodForm.image_url || null
    };

    try {
      if (editingProd) {
        await supabase.from('products').update(payload).eq('id', prodForm.id);
      } else {
        await supabase.from('products').insert(payload);
      }
      setIsProdModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving product");
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      try {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
      } catch(err) {
        alert("Error deleting product");
      }
    }
  };

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, productPage]);

  const totalProductPages = Math.ceil(products.length / itemsPerPage);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Products Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Master Produk</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola data makanan dan minuman.</p>
          </div>
          <button
            onClick={() => { setEditingProd(false); setProdForm({id:'', name:'', price:'', category_id:(categories[0]?.id || ''), image_url:''}); setIsProdModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Gambar</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Nama Produk</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Kategori</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Harga</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Belum ada produk.</td></tr>
                  ) : paginatedProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm">No img</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{prod.name}</td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                           {prod.categories?.name || '-'}
                         </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        Rp {prod.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingProd(true); setProdForm({id: prod.id, name: prod.name, price: String(prod.price), category_id: prod.category_id || '', image_url: prod.image_url || ''}); setIsProdModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(prod.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Products Pagination */}
           {totalProductPages > 1 && (
             <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
               <span className="text-sm text-gray-500 font-medium">Halaman {productPage} dari {totalProductPages}</span>
               <div className="flex gap-2">
                 <button 
                   disabled={productPage === 1}
                   onClick={() => setProductPage(p => Math.max(1, p - 1))}
                   className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button 
                   disabled={productPage === totalProductPages}
                   onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                   className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Product Modal */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{editingProd ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button type="button" onClick={() => setIsProdModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm border border-gray-100">×</button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk</label>
                <input required type="text" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="Masukkan nama produk" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900 bg-white">
                  <option value="">Tidak ada kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga (Rp)</label>
                <input required type="number" min="0" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Gambar (Opsional)</label>
                <input type="url" placeholder="https://contoh.com/gambar.jpg" value={prodForm.image_url} onChange={e => setProdForm({...prodForm, image_url: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" />
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow active:scale-95">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

