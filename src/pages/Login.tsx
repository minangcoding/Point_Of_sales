import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Utensils } from 'lucide-react';

export default function Login() {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, we fallback
        }
      } else if (data && data.length === 0) {
        setIsSetupMode(true);
      }
    } catch (err) {
      // Just silenty fail or assume it's login mode
    }
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/pos');
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Safety fallback
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      setError('Waktu koneksi habis. Silakan coba lagi (Pastikan internet stabil dan tidak ada adblocker).');
    }, 30000);

    try {
      if (isSetupMode) {
        // REGISTRATION FLOW (FIRST ADMIN)
        const { data, error: insertErr } = await supabase.from('app_users').insert({
          email,
          password,
          name: name || 'Admin',
          role: 'admin'
        }).select().single();
        
        if (insertErr) throw insertErr;
        
        localStorage.setItem('pos_user', JSON.stringify(data));
        setProfile(data);
      } else {
        // LOGIN FLOW
        const { data, error: loginErr } = await supabase
          .from('app_users')
          .select('*')
          .ilike('email', email.trim())
          .eq('password', password)
          .limit(1);
          
        if (loginErr || !data || data.length === 0) {
          throw new Error('Email atau password salah.');
        }

        const user = data[0];
        // Normalize legacy roles from previous mistakes
        if (['kasir', 'karyawan', 'operator'].includes(user.role.toLowerCase())) {
          user.role = 'operator';
        }
        
        localStorage.setItem('pos_user', JSON.stringify(user));
        setProfile(user);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      clearTimeout(fallbackTimer);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-32 w-32 relative flex items-center justify-center mb-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain drop-shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              document.getElementById('fallback-logo')?.classList.remove('hidden');
            }}
          />
          <div id="fallback-logo" className="absolute inset-0 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hidden">
            <Utensils className="h-16 w-16 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 flex flex-col items-center">
          Bakso <span className="text-red-600">Prasmanan</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sistem Point of Sale & Manajemen
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-blue-600">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-center text-gray-900">
              {isSetupMode ? 'Setup Akun Admin Pertama 👑' : 'Login ke Sistem'}
            </h3>
            {isSetupMode && (
              <p className="text-sm text-center text-gray-500 mt-2 bg-blue-50 py-2 rounded-lg border border-blue-100">
                Sistem mendeteksi belum ada admin. Silakan buat akun admin utama Anda.
              </p>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            
            {isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Lengkap
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  minLength={6}
                />
                {isSetupMode && <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter.</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : (isSetupMode ? 'Buat Akun Admin' : 'Masuk')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
