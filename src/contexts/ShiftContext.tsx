import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Shift {
  id: string;
  operator_id: string;
  opening_amount: number;
  closing_amount: number | null;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
}

interface ShiftContextType {
  currentShift: Shift | null;
  loading: boolean;
  tableReady: boolean;
  openShift: (amount: number) => Promise<void>;
  closeShift: (amount: number) => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType>({
  currentShift: null,
  loading: true,
  tableReady: false,
  openShift: async () => {},
  closeShift: async () => {},
});

export const useShift = () => useContext(ShiftContext);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(false);

  const checkAndFetch = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    try {
      // Test apakah tabel bisa diakses
      const { error } = await supabase.from('shifts').select('id').limit(1);
      if (error) {
        setTableReady(false);
        setLoading(false);
        return;
      }

      // Tabel ada, fetch shift aktif
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('operator_id', profile.id)
        .eq('status', 'open')
        .gte('opened_at', today.toISOString())
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setTableReady(true);
      setCurrentShift(data || null);
    } catch {
      setTableReady(false);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    checkAndFetch();
  }, [checkAndFetch]);

  const openShift = async (amount: number) => {
    if (!profile || !tableReady) return;
    const { error } = await supabase.from('shifts').insert({
      operator_id: profile.id,
      opening_amount: amount,
      status: 'open'
    });
    if (error) throw error;
    await checkAndFetch();
  };

  const closeShift = async (amount: number) => {
    if (!currentShift) return;
    const { error } = await supabase.from('shifts').update({
      closing_amount: amount,
      status: 'closed',
      closed_at: new Date().toISOString()
    }).eq('id', currentShift.id);
    if (error) throw error;
    await checkAndFetch();
  };

  return (
    <ShiftContext.Provider value={{ currentShift, loading, tableReady, openShift, closeShift }}>
      {children}
    </ShiftContext.Provider>
  );
};
