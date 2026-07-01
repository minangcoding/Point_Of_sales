import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Setup CORS Headers agar React JS kamu di localhost bisa mengakses fungsi ini
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle preflight request untuk CORS browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ambil data yang dikirim oleh React POS.tsx
    const { order_id, total_amount, items, operator_id } = await req.json()

    // Ambil Server Key dari Environment Variable Supabase (Lebih Aman)
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!MIDTRANS_SERVER_KEY) {
      throw new Error("Kunci MIDTRANS_SERVER_KEY belum diatur di server Supabase.")
    }

    // Ubah Server Key menjadi format Base64 untuk autentikasi API Midtrans
    const base64Auth = btoa(MIDTRANS_SERVER_KEY + ":")

    // 1. Tembak API Midtrans Core untuk meminta QRIS Dinamis (gopay otomatis menghasilkan QRIS universal)
    const midtransRequest = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64Auth}`
      },
      body: JSON.stringify({
        payment_type: "gopay", 
        transaction_details: {
          order_id: order_id,
          gross_amount: total_amount
        }
      })
    })

    const midtransData = await midtransRequest.json()

    // Cari string data QRIS di dalam response dari Midtrans
    const qrAction = midtransData.actions?.find((action: any) => action.name === "generate-qr-code")
    const qrString = qrAction ? qrAction.url : null

    if (!qrString) {
      throw new Error("Midtrans gagal memberikan kode QRIS. Periksa konfigurasi akun Anda.")
    }

    // 2. Hubungkan ke Database Supabase internal untuk mencatat transaksi awal dengan status 'pending'
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Insert ke tabel transactions bawaan tokomu dengan status 'pending'
    const { error: txError } = await supabase.from('transactions').insert({
      id: order_id, // Kita pakai order_id custom string dari frontend sebagai ID utama
      operator_id: operator_id,
      total_amount: total_amount,
      payment_method: 'qr',
      status: 'pending' // Wajib pending, nanti diubah jadi 'paid' oleh webhook otomatis
    })

    if (txError) throw txError

    // Siapkan data array untuk tabel transaction_items milikmu
    const itemsData = items.map((item: any) => ({
      transaction_id: order_id,
      product_id: item.id,
      quantity: item.qty,
      price: item.price - (item.discount || 0),
      cost_price: item.cost_price || 0
    }))

    const { error: itemsError } = await supabase.from('transaction_items').insert(itemsData)
    if (itemsError) throw itemsError

    // Kembalikan kode QRIS asli ke React agar bisa ditampilkan di layar kasir
    return new Response(
      JSON.stringify({ qr_string: qrString, order_id: order_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})