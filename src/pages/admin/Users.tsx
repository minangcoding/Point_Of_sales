import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Profile } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', email: '', password: '', name: '', role: 'operator' as 'admin' | 'operator' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingId) {
        const updateData: any = {
          name: formData.name,
          role: formData.role,
        };

        // Password hanya di-update kalau diisi
        if (formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        const { error } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('id', editingId);

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
      showToast(editingId ? "Karyawan berhasil diperbarui" : "Karyawan berhasil ditambahkan", "success");
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        const { error } = await supabase.from('app_users').delete().eq('id', userToDelete);
        if (error) {
          if (error.code === '23503') throw new Error('Karyawan tercatat dalam transaksi dan tidak dapat dihapus.');
          throw error;
        }
        fetchUsers();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        showToast("Karyawan berhasil dihapus", "success");
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus pengguna.', "error");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-semibold tracking-wider">Nama Karyawan</th>
                <th className="px-6 py-5 font-semibold tracking-wider">Role</th>
                <th className="px-6 py-5 font-semibold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-gray-400">
                    Belum ada data karyawan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-red-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-amber-50 text-red-600 flex items-center justify-center font-bold shadow-sm border border-red-100">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                            {user.email || 'tanpa email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wide ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {user.role === 'admin' ? 'Admin / Owner' : 'Operator'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(user.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all" title="Hapus">
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 flex justify-between items-start bg-white relative border-b border-gray-50">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{editingId ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">{editingId ? 'Perbarui peran dan akses karyawan ini.' : 'Daftarkan anggota tim baru ke sistem.'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-sm transition-colors mt-1">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {errorMsg && <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl">{errorMsg}</div>}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400" placeholder="Contoh: Budi Santoso" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Peran (Role)</label>
                  <div className="relative">
                    <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 bg-white">
                      <option value="operator">Operator / Kasir</option>
                      <option value="admin">Admin / Owner</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                      placeholder="Kosongkan jika tidak ingin ubah password"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Isi hanya jika ingin mengganti password karyawan.
                    </p>
                  </div>
                )}
              </div>

              {!editingId && (
                <div className="pt-6 mt-4 border-t border-gray-100 bg-gray-50/50 -mx-8 px-8 pb-2">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-blue-600"></span> Informasi Kredensial
                  </p>
                  <div className="space-y-5 mb-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border-2 border-white shadow-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400 bg-white"
                        placeholder="email@contoh.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Password Login</label>
                      <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full border-2 border-white shadow-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-400 bg-white"
                        placeholder="Minimal 6 karakter rahasia"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">Batal</button>
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
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hapus Karyawan?</h3>
              <p className="text-sm text-gray-500 font-medium">Anda yakin ingin menghapus data karyawan ini? Tindakan ini tidak dapat dibatalkan.</p>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
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
