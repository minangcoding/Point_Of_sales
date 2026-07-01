-- Jalankan ini di Supabase SQL Editor untuk fix shifts table RLS

-- Pastikan tabel shifts ada
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Matikan RLS (penting!)
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Kalau sudah ada tapi RLS masih nyala, drop dan recreate
-- DROP TABLE IF EXISTS shifts;
-- CREATE TABLE shifts ( ... ); (copy dari atas)
-- ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Pastikan kolom stock ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Pastikan kolom notes ada
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Buat RPC functions
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - p_qty) WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = stock + p_qty WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
