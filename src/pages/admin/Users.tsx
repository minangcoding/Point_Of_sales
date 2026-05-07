import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Profile } from '../../types';

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', email: '', password: '', name: '', role: 'operator' as 'admin' | 'operator' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleOpenModal = (user?: Profile) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ id: user.id, email: '', password: '', name: user.name, role: user.role });
    } else {
      setEditingId(null);
      setFormData({ id: '', email: '', password: '', name: '', role: 'operator' });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      if (editingId) {
        const { error } = await supabase.from('app_users').update({
          name: formData.name,
          role: formData.role
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        if (!formData.email || !formData.password) {
          throw new Error('Email dan Password wajib diisi untuk pengguna baru.');
        }

        const { error } = await supabase.from('app_users').insert({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        });
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        const { error } = await supabase.from('app_users').delete().eq('id', id);
        if (error) throw error;
        fetchUsers();
      } catch (err) {
        alert('Gagal menghapus pengguna.');
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola data karyawan dan akses sistem.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Nama Karyawan</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Role</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      Belum ada data karyawan.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              {user.email || 'tanpa email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                          {user.role === 'admin' ? 'Admin / Owner' : 'Operator'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
           </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm border border-gray-100">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="Masukkan nama lengkap" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Peran (Role)</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900 bg-white">
                  <option value="operator">Operator / Kasir</option>
                  <option value="admin">Admin / Owner</option>
                </select>
              </div>
              
              {!editingId && (
                <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informasi Login</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="email@contoh.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900" placeholder="Minimal 6 karakter" />
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow active:scale-95">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
