-- SQL Script untuk menambahkan fitur Stok/Inventory dan Shift Management
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom stok ke tabel products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 2. Buat tabel shifts untuk manajemen kasir
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Disable RLS untuk shifts
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- 3. Buat RPC function untuk mengurangi stok secara atomik
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = GREATEST(0, stock - p_qty) 
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Buat RPC function untuk menambah stok
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = stock + p_qty 
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Tambah kolom notes ke transactions untuk void
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;
