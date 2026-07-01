import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Utensils, Mail, Lock, User, Loader2, ShieldCheck } from "lucide-react";


export default function Login() {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("id")
        .limit(1);
      if (error) {
        if (error.code === "42P01") {
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
      navigate(profile.role === "admin" ? "/admin" : "/pos");
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSetupMode) {
        // REGISTRATION FLOW (FIRST ADMIN)
        const { data, error: insertErr } = await supabase
          .from("app_users")
          .insert({
            email,
            password,
            name: name || "Admin",
            role: "admin",
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        localStorage.setItem("pos_user", JSON.stringify(data));
        setProfile(data);
      } else {
        // LOGIN FLOW
        const { data, error: loginErr } = await supabase
          .from("app_users")
          .select("*")
          .ilike("email", email.trim())
          .eq("password", password)
          .limit(1);

        if (loginErr || !data || data.length === 0) {
          throw new Error("Email atau password salah.");
        }

        const user = data[0];
        // Normalize legacy roles from previous mistakes
        if (
          ["kasir", "karyawan", "operator"].includes(user.role.toLowerCase())
        ) {
          user.role = "operator";
        }

        localStorage.setItem("pos_user", JSON.stringify(user));
        setProfile(user);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f8f3ea] flex items-center justify-center px-4 py-10">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-200/40 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-24 w-96 h-96 bg-yellow-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-green-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/70">
        {/* Left Branding Section */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-red-950 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-40 h-40 border border-yellow-300 rounded-full" />
            <div className="absolute bottom-10 right-10 w-56 h-56 border border-yellow-300 rounded-full" />
            <div className="absolute top-1/2 -right-20 w-72 h-72 bg-red-600 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-8">
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              POS & Manajemen Rumah Makan
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Pondok <br />
              <span className="text-yellow-300">Salero</span>
            </h1>

            <p className="mt-5 text-base text-white/80 leading-relaxed max-w-md">
              Kelola transaksi, produk, karyawan, dan laporan penjualan dalam satu
              sistem yang rapi, cepat, dan mudah digunakan.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
              <p className="text-2xl font-black text-yellow-300">POS</p>
              <p className="text-xs text-white/70 mt-1">Transaksi cepat</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
              <p className="text-2xl font-black text-yellow-300">QR</p>
              <p className="text-xs text-white/70 mt-1">Cash & QR</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
              <p className="text-2xl font-black text-yellow-300">PDF</p>
              <p className="text-xs text-white/70 mt-1">Export laporan</p>
            </div>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300/40 rounded-full blur-2xl" />
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center p-3">
                  <img
                    src="/logo Pondok Salero.png"
                    alt="Logo Pondok Salero"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      document
                        .getElementById("fallback-logo")
                        ?.classList.remove("hidden");
                    }}
                  />
                  <div
                    id="fallback-logo"
                    className="absolute inset-3 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-lg hidden"
                  >
                    <Utensils className="h-16 w-16 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <p className="text-sm font-bold tracking-[0.25em] uppercase text-red-600 mb-3">
                Rumah Makan Padang
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
                Pondok <span className="text-red-600">Salero</span>
              </h2>
              <p className="mt-3 text-gray-500 font-medium">
                Masuk untuk mengelola sistem Point of Sale
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-[28px] shadow-xl border border-gray-100 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-800 via-yellow-500 to-red-600" />

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-950 text-center">
                    {isSetupMode ? "Setup Admin Pertama" : "Login ke Sistem"}
                  </h3>

                  {isSetupMode && (
                    <p className="text-sm text-center text-emerald-700 mt-3 bg-emerald-50 py-3 px-4 rounded-2xl border border-emerald-100 font-medium">
                      Sistem mendeteksi belum ada admin. Silakan buat akun admin
                      utama Anda.
                    </p>
                  )}
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                      {error}
                    </div>
                  )}

                  {isSetupMode && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-gray-900 font-semibold outline-none focus:bg-white focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 transition-all"
                          placeholder="Contoh: Refido Arjunal Akmal"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-gray-900 font-semibold outline-none focus:bg-white focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 transition-all"
                        placeholder="admin@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-gray-900 font-semibold outline-none focus:bg-white focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 transition-all"
                        placeholder="Masukkan password"
                        minLength={6}
                      />
                    </div>

                    {isSetupMode && (
                      <p className="text-xs text-gray-500 mt-2">
                        Minimal 6 karakter.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-800 to-red-700 hover:from-emerald-900 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-700/20 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 active:scale-[0.99] transition-all"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading
                      ? "Memproses..."
                      : isSetupMode
                        ? "Buat Akun Admin"
                        : "Masuk ke Dashboard"}
                  </button>
                </form>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              © {new Date().getFullYear()} Pondok Salero. Sistem Point of Sale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}