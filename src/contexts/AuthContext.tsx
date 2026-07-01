import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  setProfile: () => { },
  signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const stored = localStorage.getItem('pos_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (['kasir', 'karyawan'].includes(parsed.role?.toLowerCase())) {
          parsed.role = 'operator';
          localStorage.setItem('pos_user', JSON.stringify(parsed));
        }
        setProfile(parsed);
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('pos_user');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('pos_user');
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ profile, loading, setProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
