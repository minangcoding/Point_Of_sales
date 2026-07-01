// import React, { useState, useEffect, useMemo } from 'react';
// import { supabase } from '../../lib/supabase';
// import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
// import { Product, Category } from '../../types';

// export default function Products() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Pagination State
//   const [productPage, setProductPage] = useState(1);
//   const itemsPerPage = 7;

//   // Product Modal State
//   const [isProdModalOpen, setIsProdModalOpen] = useState(false);
//   const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', category_id: '', image_url: '' });
//   const [editingProd, setEditingProd] = useState(false);

//   // Delete Modal State
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [prodToDelete, setProdToDelete] = useState<string | null>(null);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [catsResponse, prodsResponse] = await Promise.all([
//         supabase.from('categories').select('*').order('name'),
//         supabase.from('products').select(`*, categories(name)`).order('name')
//       ]);

//       if (catsResponse.data) setCategories(catsResponse.data);
//       if (prodsResponse.data) setProducts(prodsResponse.data);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   const handleProductSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const payload = {
//       name: prodForm.name,
//       price: Number(prodForm.price),
//       category_id: prodForm.category_id || null,
//       image_url: prodForm.image_url || null
//     };

//     try {
//       if (editingProd) {
//         await supabase.from('products').update(payload).eq('id', prodForm.id);
//       } else {
//         await supabase.from('products').insert(payload);
//       }
//       setIsProdModalOpen(false);
//       fetchData();
//     } catch (err) {
//       alert("Error saving product");
//     }
//   };

//   const confirmDelete = (id: string) => {
//     setProdToDelete(id);
//     setIsDeleteModalOpen(true);
//   };

//   const deleteProduct = async () => {
//     if (prodToDelete) {
//       try {
//         await supabase.from('products').delete().eq('id', prodToDelete);
//         fetchData();
//         setIsDeleteModalOpen(false);
//         setProdToDelete(null);
//       } catch(err) {
//         alert("Error deleting product");
//         setIsDeleteModalOpen(false);
//         setProdToDelete(null);
//       }
//     }
//   };

//   const paginatedProducts = useMemo(() => {
//     const start = (productPage - 1) * itemsPerPage;
//     return products.slice(start, start + itemsPerPage);
//   }, [products, productPage]);

//   const totalProductPages = Math.ceil(products.length / itemsPerPage);

//   if (loading) return (
//     <div className="flex justify-center items-center h-64">
//        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//     </div>
//   );

//   return (
//     <div className="max-w-6xl mx-auto space-y-8">
//       {/* Products Section */}
//       <div>
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Master Produk</h2>
//             <p className="text-sm text-gray-500 mt-1">Kelola data makanan dan minuman.</p>
//           </div>
//           <button
//             onClick={() => { setEditingProd(false); setProdForm({id:'', name:'', price:'', category_id:(categories[0]?.id || ''), image_url:''}); setIsProdModalOpen(true); }}
//             className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
//           >
//             <Plus className="w-4 h-4" /> Tambah Produk
//           </button>
//         </div>

//         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//            <div className="overflow-x-auto">
//              <table className="w-full text-sm text-left whitespace-nowrap">
//                 <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
//                   <tr>
//                     <th className="px-6 py-5 font-semibold tracking-wider">Gambar</th>
//                     <th className="px-6 py-5 font-semibold tracking-wider">Nama Produk</th>
//                     <th className="px-6 py-5 font-semibold tracking-wider">Kategori</th>
//                     <th className="px-6 py-5 font-semibold tracking-wider">Harga</th>
//                     <th className="px-6 py-5 font-semibold tracking-wider text-right">Aksi</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {paginatedProducts.length === 0 ? (
//                     <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 bg-gray-50/30">Belum ada produk.</td></tr>
//                   ) : paginatedProducts.map((prod) => (
//                     <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
//                       <td className="px-6 py-4">
//                         {prod.image_url ? (
//                           <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-xl shadow-sm border border-gray-100" />
//                         ) : (
//                           <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm uppercase tracking-wider">No img</div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 font-bold text-gray-900">{prod.name}</td>
//                       <td className="px-6 py-4">
//                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
//                            {prod.categories?.name || '-'}
//                          </span>
//                       </td>
//                       <td className="px-6 py-4 font-mono font-bold text-blue-700">
//                         Rp {prod.price.toLocaleString('id-ID')}
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         <div className="flex items-center justify-end gap-2">
//                           <button onClick={() => { setEditingProd(true); setProdForm({id: prod.id, name: prod.name, price: String(prod.price), category_id: prod.category_id || '', image_url: prod.image_url || ''}); setIsProdModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
//                           <button onClick={() => confirmDelete(prod.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//              </table>
//            </div>

//            {/* Products Pagination */}
//            {totalProductPages > 1 && (
//              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
//                <span className="text-sm text-gray-500 font-medium">Halaman {productPage} dari {totalProductPages}</span>
//                <div className="flex gap-2">
//                  <button 
//                    disabled={productPage === 1}
//                    onClick={() => setProductPage(p => Math.max(1, p - 1))}
//                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                  >
//                    <ChevronLeft className="w-5 h-5" />
//                  </button>
//                  <button 
//                    disabled={productPage === totalProductPages}
//                    onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
//                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                  >
//                    <ChevronRight className="w-5 h-5" />
//                  </button>
//                </div>
//              </div>
//            )}
//         </div>
//       </div>

//       {/* Product Modal */}
//       {isProdModalOpen && (
//         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
//             <div className="px-8 py-6 flex justify-between items-start bg-white relative border-b border-gray-50">
//               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
//               <div>
//                 <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{editingProd ? 'Edit Produk' : 'Tambah Produk'}</h3>
//                 <p className="text-sm text-gray-500 mt-1.5 font-medium">{editingProd ? 'Perbarui informasi produk.' : 'Tambahkan produk baru ke menu.'}</p>
//               </div>
//               <button type="button" onClick={() => setIsProdModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-sm transition-colors mt-1">×</button>
//             </div>
//             <form onSubmit={handleProductSubmit} className="p-8 space-y-6">

//               <div className="space-y-5">
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">Nama Produk</label>
//                   <input required type="text" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" placeholder="Masukkan nama produk" />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
//                   <div className="relative">
//                     <select value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})} className="w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 bg-white">
//                       <option value="">Tidak ada kategori</option>
//                       {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">Harga (Rp)</label>
//                   <div className="relative">
//                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
//                       <span className="text-gray-500 font-bold">Rp</span>
//                     </div>
//                     <input required type="number" min="0" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" placeholder="0" />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">URL Gambar (Opsional)</label>
//                   <input type="url" placeholder="https://contoh.com/gambar.jpg" value={prodForm.image_url} onChange={e => setProdForm({...prodForm, image_url: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" />
//                 </div>
//               </div>

//               <div className="pt-6 flex justify-end gap-3 mt-2">
//                 <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">Batal</button>
//                 <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex-1 sm:flex-none">Simpan Data</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//       {/* Delete Confirmation Modal */}
//       {isDeleteModalOpen && (
//         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
//             <div className="p-8 text-center space-y-6">
//               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <Trash2 className="w-8 h-8" />
//               </div>
//               <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hapus Produk?</h3>
//               <p className="text-sm text-gray-500 font-medium">Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>

//               <div className="pt-2 flex gap-3">
//                 <button 
//                   type="button" 
//                   onClick={() => { setIsDeleteModalOpen(false); setProdToDelete(null); }} 
//                   className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
//                 >
//                   Batal
//                 </button>
//                 <button 
//                   onClick={deleteProduct} 
//                   className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
//                 >
//                   Ya, Hapus
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }







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
  // TAMBAHAN: state cost_price
  const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', cost_price: '', discount: '', category_id: '', image_url: '' });
  const [editingProd, setEditingProd] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [prodToDelete, setProdToDelete] = useState<string | null>(null);

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
      cost_price: Number(prodForm.cost_price) || 0, // TAMBAHAN: Menyimpan harga modal
      discount: Number(prodForm.discount) || 0,
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

  const confirmDelete = (id: string) => {
    setProdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteProduct = async () => {
    if (prodToDelete) {
      try {
        await supabase.from('products').delete().eq('id', prodToDelete);
        fetchData();
        setIsDeleteModalOpen(false);
        setProdToDelete(null);
      } catch (err) {
        alert("Error deleting product");
        setIsDeleteModalOpen(false);
        setProdToDelete(null);
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
            <p className="text-sm text-gray-500 mt-1">Kelola data makanan dan minuman beserta harga modalnya.</p>
          </div>
          <button
            onClick={() => { setEditingProd(false); setProdForm({ id: '', name: '', price: '', cost_price: '', discount: '', category_id: (categories[0]?.id || ''), image_url: '' }); setIsProdModalOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 font-semibold tracking-wider">Gambar</th>
                  <th className="px-6 py-5 font-semibold tracking-wider">Nama Produk</th>
                  <th className="px-6 py-5 font-semibold tracking-wider">Kategori</th>
                  <th className="px-6 py-5 font-semibold tracking-wider">Harga Modal</th>
                  <th className="px-6 py-5 font-semibold tracking-wider">Harga Jual</th>
                  <th className="px-6 py-5 font-semibold tracking-wider">Diskon</th>
                  <th className="px-6 py-5 font-semibold tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500 bg-gray-50/30">Belum ada produk.</td></tr>
                ) : paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-xl shadow-sm border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm uppercase tracking-wider">No img</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{prod.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
                        {prod.categories?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-500">
                      Rp {(prod.cost_price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-red-500">
                      {prod.discount && prod.discount > 0 ? `- Rp ${prod.discount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingProd(true); setProdForm({ id: prod.id, name: prod.name, price: String(prod.price), cost_price: String(prod.cost_price || ''), discount: String(prod.discount || ''), category_id: prod.category_id || '', image_url: prod.image_url || '' }); setIsProdModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => confirmDelete(prod.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 flex justify-between items-start bg-white relative border-b border-gray-50">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{editingProd ? 'Edit Produk' : 'Tambah Produk'}</h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">{editingProd ? 'Perbarui informasi dan harga produk.' : 'Tambahkan produk baru ke menu.'}</p>
              </div>
              <button type="button" onClick={() => setIsProdModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-sm transition-colors mt-1">×</button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-6">

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Produk</label>
                  <input required type="text" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" placeholder="Masukkan nama produk" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                  <div className="relative">
                    <select value={prodForm.category_id} onChange={e => setProdForm({ ...prodForm, category_id: e.target.value })} className="w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 bg-white">
                      <option value="">Tidak ada kategori</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Tiga Kolom Harga: Modal, Jual, Diskon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Harga Modal */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Harga Modal</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-400 font-bold text-sm">Rp</span>
                      </div>
                      <input required type="number" min="0" value={prodForm.cost_price} onChange={e => setProdForm({ ...prodForm, cost_price: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-3 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400 text-sm" placeholder="0" />
                    </div>
                  </div>
                  {/* Harga Jual */}
                  <div>
                    <label className="block text-sm font-bold text-blue-700 mb-2">Harga Jual</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-blue-500 font-bold text-sm">Rp</span>
                      </div>
                      <input required type="number" min="0" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} className="w-full border-2 border-blue-200 rounded-xl pl-10 pr-3 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400 text-sm" placeholder="0" />
                    </div>
                  </div>
                  {/* Diskon */}
                  <div>
                    <label className="block text-sm font-bold text-red-600 mb-2">Diskon</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-red-400 font-bold text-sm">Rp</span>
                      </div>
                      <input type="number" min="0" value={prodForm.discount} onChange={e => setProdForm({ ...prodForm, discount: e.target.value })} className="w-full border-2 border-red-100 rounded-xl pl-10 pr-3 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400 text-sm" placeholder="0" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Gambar (Opsional)</label>
                  <input type="url" placeholder="https://contoh.com/gambar.jpg" value={prodForm.image_url} onChange={e => setProdForm({ ...prodForm, image_url: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">Batal</button>
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
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hapus Produk?</h3>
              <p className="text-sm text-gray-500 font-medium">Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setProdToDelete(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={deleteProduct}
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