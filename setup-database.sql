-- ============================================
-- SETUP LENGKAP POS - JALANKAN SATU KALI SAJA
-- Buka: Supabase Dashboard > SQL Editor > New Query
-- Paste semua script ini, lalu klik RUN (atau tekan Ctrl+Enter)
-- ============================================

-- 1. BUAT TABEL SHIFTS (untuk buka/tutup kasir)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 2. MATIKAN RLS DI TABEL SHIFTS (agar bisa diakses dari aplikasi)
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- 3. TAMBAH KOLOM STOCK KE TABEL PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 4. TAMBAH KOLOM NOTES KE TABEL TRANSACTIONS
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. BUAT FUNCTION UNTUK MENGURANGI STOK (otomatis saat transaksi)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - p_qty) WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 6. BUAT FUNCTION UNTUK MENAMBAH STOT (saat transaksi dibatalkan)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = stock + p_qty WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
