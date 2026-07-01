-- COPY PASTE INI KE SUPABASE SQL EDITOR, LALU KLIK RUN

-- Hapus tabel lama jika ada (untuk reset)
DROP TABLE IF EXISTS shifts;

-- Buat tabel shifts dengan referensi ke app_users
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Matikan RLS agar bisa diakses tanpa Supabase Auth
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
