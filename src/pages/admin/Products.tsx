import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Product, Category } from '../../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product Modal State
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', category_id: '', image_url: '' });
  const [editingProd, setEditingProd] = useState(false);
  
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

  return (
    <div className="space-y-8">
      {/* Products Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Master Produk</h2>
          <button
            onClick={() => { setEditingProd(false); setProdForm({id:'', name:'', price:'', category_id:(categories[0]?.id || ''), image_url:''}); setIsProdModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Gambar</th>
                  <th className="px-6 py-3 font-medium">Nama Produk</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Harga</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center">Memuat...</td></tr>
                ) : products.map((prod) => (
                  <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50 gap-4">
                    <td className="px-6 py-4">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded-md" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                    <td className="px-6 py-4">{prod.categories?.name || '-'}</td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-600">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingProd(true); setProdForm({id: prod.id, name: prod.name, price: String(prod.price), category_id: prod.category_id || '', image_url: prod.image_url || ''}); setIsProdModalOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteProduct(prod.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kategori Produk</h2>
          <button
            onClick={() => { setEditingCat(false); setCatForm({id:'', name:''}); setIsCatModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:w-1/2">
           <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Nama Kategori</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setEditingCat(true); setCatForm({id: cat.id, name: cat.name}); setIsCatModalOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Product Modal */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingProd ? 'Edit Produk' : 'Tambah Produk'}</h3>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input required type="text" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                  <option value="">Tidak ada kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                <input required type="number" min="0" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar (Opsional)</label>
                <input type="url" placeholder="https://contoh.com/gambar.jpg" value={prodForm.image_url} onChange={e => setProdForm({...prodForm, image_url: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{editingCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input required type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
