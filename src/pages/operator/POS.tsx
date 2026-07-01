


import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Category } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, QrCode, Banknote, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';

type CartItem = Product & { qty: number };

interface ReceiptData {
  items: CartItem[];
  subTotal: number;       // Tambahan untuk struck
  totalDiscount: number;  // Tambahan untuk struck
  totalAmount: number;
  paymentMethod: 'cash' | 'qr';
  amountPaid: number;
  changeAmount: number;
  date: Date;
  transactionId?: string;
}

export default function POS() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [cashModal, setCashModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name')
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === activeCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // LOGIKA HITUNG OTOMATIS DISKON PER PRODUK
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
  const totalAmount = Math.max(0, subTotal - totalDiscount);
  const changeAmount = typeof amountPaid === 'number' ? amountPaid - totalAmount : 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (qrModal) {
      timeout = setTimeout(() => {
        handleCheckout('qr');
      }, 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [qrModal]);

  const handleCheckout = async (method: 'cash' | 'qr') => {
    if (cart.length === 0 || !profile) return;
    setIsProcessing(true);

    try {
      const { data: tx, error: txError } = await supabase.from('transactions').insert({
        operator_id: profile.id,
        total_amount: totalAmount, // Menyimpan total bersih setelah diskon
        payment_method: method,
        status: 'paid'
      }).select().single();

      if (txError) throw txError;

      const itemsData = cart.map(item => ({
        transaction_id: tx.id,
        product_id: item.id,
        quantity: item.qty,
        price: item.price - (item.discount || 0),
        cost_price: item.cost_price || 0 // TAMBAHAN: Menyimpan harga modal saat transaksi terjadi
      }));

      const { error: itemsError } = await supabase.from('transaction_items').insert(itemsData);
      if (itemsError) throw itemsError;

      if (method === 'cash') {
        const change = typeof amountPaid === 'number' ? amountPaid - totalAmount : 0;
        setReceiptData({
          items: cart,
          subTotal,
          totalDiscount,
          totalAmount,
          paymentMethod: 'cash',
          amountPaid: typeof amountPaid === 'number' ? amountPaid : totalAmount,
          changeAmount: change,
          date: new Date(),
          transactionId: tx.id
        });
        setPaymentModal(false);
        setCashModal(false);
      } else {
        setReceiptData({
          items: cart,
          subTotal,
          totalDiscount,
          totalAmount,
          paymentMethod: 'qr',
          amountPaid: totalAmount,
          changeAmount: 0,
          date: new Date(),
          transactionId: tx.id
        });
        setPaymentModal(false);
        setQrModal(false);
      }

    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeReceipt = () => {
    setCart([]);
    setAmountPaid('');
    setReceiptData(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Product List Section */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Category Filters */}
        <div className="p-4 bg-white border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", activeCategory === 'all' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", activeCategory === c.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-24 sm:pb-4">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer select-none active:scale-95 flex flex-col overflow-hidden group relative"
              >
                {/* Badge Diskon jika ada */}
                {(p.discount || 0) > 0 ? (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-lg shadow-sm z-10 animate-pulse">
                    POTONGAN Rp {p.discount.toLocaleString('id-ID')}
                  </div>
                ) : null}

                <div className="h-32 sm:h-40 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 mb-1 flex-1 leading-snug">{p.name}</h3>

                  {/* Tampilan Harga Asli & Harga Diskon */}
                  <div className="mt-2">
                    {p.discount && p.discount > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through font-medium">Rp {p.price.toLocaleString('id-ID')}</span>
                        <span className="font-extrabold text-red-500 text-sm sm:text-base">Rp {(p.price - p.discount).toLocaleString('id-ID')}</span>
                      </div>
                    ) : (
                      <p className="font-bold text-blue-600 text-sm sm:text-base">Rp {p.price.toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      {!paymentModal && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-30">
          <button
            onClick={() => document.getElementById('mobile-cart')?.classList.remove('translate-y-full')}
            className="w-full relative bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 font-bold py-4 px-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-left flex flex-col">
                <span>{cart.length} Item</span>
                <span className="text-xs text-blue-100 font-normal">Lihat Pesanan</span>
              </span>
            </div>
            <span className="text-lg">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar (Desktop & Mobile) */}
      <div id="mobile-cart" className="fixed inset-0 z-40 bg-gray-50 sm:relative sm:z-20 flex flex-col sm:flex flex-shrink-0 w-full sm:w-96 border-l border-gray-200 transition-transform duration-300 translate-y-full sm:translate-y-0 shadow-2xl sm:shadow-none">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 pt-8 sm:pt-4">
          <button onClick={() => document.getElementById('mobile-cart')?.classList.add('translate-y-full')} className="sm:hidden mr-2 p-1 hover:bg-gray-200 rounded-full">
            <Minus className="w-6 h-6 rotate-90 text-gray-600" />
          </button>
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Nota Pesanan</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{cart.length} Item</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 space-y-4 min-h-0">
            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-400 space-y-4">
                <ShoppingCart className="w-12 h-12" />
                <p>Belum ada pesanan</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-xl hover:border-blue-300 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 pr-2 leading-tight flex-1">{item.name}</h4>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      {item.discount && item.discount > 0 ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">Rp {item.price.toLocaleString('id-ID')}</span>
                          <span className="text-sm font-bold text-red-500">{`Rp ${(item.price - item.discount).toLocaleString('id-ID')}`}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-blue-600">{`Rp ${item.price.toLocaleString('id-ID')}`}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Bottom Area */}
          <div className="p-4 border-t border-gray-200 bg-white mt-auto space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-red-500 font-medium">
                <span>Total Diskon Produk</span>
                <span>- Rp {totalDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-2">
              <span className="text-gray-700 font-bold">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-gray-900">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => setPaymentModal(true)}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Pilih Metode</h2>
              <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">×</button>
            </div>

            <div className="p-6">
              <div className="text-center mb-8">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Tagihan</p>
                <p className="text-4xl font-extrabold text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={isProcessing}
                  onClick={() => { setPaymentModal(false); setCashModal(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors group disabled:opacity-50"
                >
                  <Banknote className="w-10 h-10 text-gray-400 group-hover:text-green-600 mb-3" />
                  <span className="font-bold text-gray-700 group-hover:text-green-700">Tunai</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => { setPaymentModal(false); setQrModal(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50"
                >
                  <QrCode className="w-10 h-10 text-gray-400 group-hover:text-blue-600 mb-3" />
                  <span className="font-bold text-gray-700 group-hover:text-blue-700">QRIS / QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {cashModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[450px] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Pembayaran Tunai</h2>
              <button onClick={() => { setCashModal(false); setAmountPaid(''); }} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">×</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Struk Pesanan</h3>
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.qty}x {item.name} {item.discount && item.discount > 0 ? '(Disc)' : ''}
                      </span>
                      <span className="font-medium text-gray-900">Rp {((item.price - (item.discount || 0)) * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 border-t border-dashed border-gray-300 pt-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>Rp {subTotal.toLocaleString('id-ID')}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Total Diskon</span>
                      <span>- Rp {totalDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                    <span>Total Harga</span>
                    <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duit Customer (Rp)</label>
                  <input
                    type="number"
                    autoFocus
                    value={amountPaid === '' ? '' : amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-2xl font-bold text-gray-900 p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                  <span className="text-blue-800 font-medium">Kembalian</span>
                  <span className={cn("text-xl font-bold", changeAmount < 0 ? "text-red-500" : "text-blue-700")}>
                    Rp {changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
              <button
                disabled={isProcessing || changeAmount < 0 || amountPaid === ''}
                onClick={() => handleCheckout('cash')}
                className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Memproses...' : 'Selesaikan Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[380px] sm:rounded-[24px] rounded-t-[24px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300 flex flex-col relative">
            <button onClick={() => setQrModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 transition-colors">×</button>

            <div className="bg-[#ED1F24] p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 skew-x-12 translate-x-16 -translate-y-8"></div>
              <div className="flex justify-center items-center h-10 mb-2 mt-2">
                <span className="text-white text-4xl font-extrabold italic tracking-wider drop-shadow-sm">QRIS</span>
              </div>
              <div className="bg-black/10 text-white/90 text-[10px] py-1 px-3 rounded-full inline-block font-medium backdrop-blur-sm">
                Quick Response Code Indonesian Standard
              </div>
            </div>

            <div className="p-8 text-center bg-white">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">Pondok Salero</h3>
              <p className="text-sm text-gray-500 mb-6 font-mono mt-1">NMID: ID1029384756</p>

              <div className="bg-white p-4 rounded-2xl mx-auto w-64 border-2 border-gray-100 shadow-sm mb-8 relative">
                <QRCode value={`QRIS-BAKSOPRASMANAN-${totalAmount}`} size={220} className="w-full h-auto mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-[#ED1F24] text-[10px] font-bold italic">QRIS</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 text-blue-900 py-4 px-4 rounded-2xl mb-8">
                <p className="text-xs font-semibold mb-1 uppercase tracking-wide text-blue-600">Total Pembayaran</p>
                <p className="text-3xl font-bold tracking-tight">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-gray-600 animate-pulse font-medium flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Menunggu pembayaran...
                </p>
                <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2 rounded-full animate-pulse transition-all duration-500"></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 p-4 text-center relative z-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dicetak oleh Pondok Salero</p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal & Layout Cetak */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto" id="receipt-content">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Pondok Salero</h2>
                <p className="text-gray-500 text-sm">Pasar Minggu, Jakarta Selatan</p>
                <p className="text-gray-400 text-xs mt-1">{format(receiptData.date, 'dd MMM yyyy HH:mm')}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-4 mb-4">
                <div className="space-y-3">
                  {receiptData.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700 flex-1 pr-4">
                        {item.qty}x {item.name}
                        {item.discount && item.discount > 0 ? ` (Disc -Rp ${item.discount.toLocaleString('id-ID')})` : ''}
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        Rp {((item.price - (item.discount || 0)) * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm border-b border-dashed border-gray-300 pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rp {receiptData.subTotal.toLocaleString('id-ID')}</span>
                </div>
                {receiptData.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Total Diskon</span>
                    <span>- Rp {receiptData.totalDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                  <span>Total Akhir</span>
                  <span>Rp {receiptData.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Metode Bayar</span>
                  <span className="uppercase font-bold">{receiptData.paymentMethod}</span>
                </div>
                {receiptData.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Tunai / Bayar</span>
                      <span>Rp {receiptData.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-100">
                      <span>Kembalian</span>
                      <span>Rp {receiptData.changeAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center mt-8 text-gray-500 text-xs">
                <p>Terima kasih atas kunjungannya!</p>
                <p className="mt-1 flex items-center justify-center gap-1">
                  ID: <span className="font-mono">{receiptData.transactionId?.substring(0, 8)}</span>
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  const printContent = document.getElementById('receipt-content');
                  const windowPrint = window.open('', '', 'width=600,height=800');
                  if (windowPrint && printContent) {
                    windowPrint.document.write(`
                        <html>
                          <head>
                            <title>Cetak Struk - Bakso Prasmanan</title>
                            <style>
                              @page { margin: 0; }
                              body { font-family: monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
                              .text-center { text-align: center; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .font-bold { font-weight: bold; }
                              .text-sm { font-size: 14px; }
                              .text-xs { font-size: 12px; }
                              .text-base { font-size: 16px; }
                              .text-2xl { font-size: 24px; }
                              .mb-6 { margin-bottom: 24px; }
                              .mb-4 { margin-bottom: 16px; }
                              .mt-8 { margin-top: 32px; }
                              .mt-1 { margin-top: 4px; }
                              .pt-1 { padding-top: 4px; }
                              .pt-2 { padding-top: 8px; }
                              .pb-4 { padding-bottom: 16px; }
                              .py-4 { padding-top: 16px; padding-bottom: 16px; }
                              .space-y-3 > * + * { margin-top: 12px; }
                              .space-y-2 > * + * { margin-top: 8px; }
                              .border-t { border-top: 1px solid #ccc; }
                              .border-b { border-bottom: 1px solid #ccc; }
                              .border-dashed { border-top-style: dashed; border-bottom-style: dashed; }
                              .uppercase { text-transform: uppercase; }
                              .whitespace-nowrap { white-space: nowrap; }
                              .flex-1 { flex: 1; }
                              .pr-4 { padding-right: 16px; }
                              .text-red-500 { color: #ef4444; }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                            <script>
                              window.onload = function() { window.print(); window.close(); }
                            </script>
                          </body>
                        </html>
                      `);
                    windowPrint.document.close();
                  }
                }}
                className="flex-1 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" /> Cetak
              </button>
              <button
                onClick={closeReceipt}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}