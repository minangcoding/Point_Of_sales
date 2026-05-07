-- SQL Script untuk setup tabel app_users di Supabase
-- Buka supabase.com -> SQL Editor -> New Query, lalu run script ini.

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hapus RLS (Row Level Security) agar bisa diakses langsung via frontend untuk simulasi POS ini
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Ubah foreign key constraint jika sebelumnya mengarah ke profiles atau auth.users
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_operator_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES app_users(id) ON DELETE SET NULL;
