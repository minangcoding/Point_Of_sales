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

  if (loading) return <div className="p-4 text-gray-500">Memuat data karyawan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Karyawan</h2>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nama</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role)</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                  <option value="operator">Operator / Kasir</option>
                  <option value="admin">Admin / Owner</option>
                </select>
              </div>
              
              {!editingId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">Informasi Login</p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 mb-3" />
                  
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
              )}
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
