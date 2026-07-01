import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Category } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ShoppingCart, Plus, Minus, Trash2, QrCode, Banknote, Printer, Search, X, UtensilsCrossed, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';

type CartItem = Product & { qty: number };

interface ReceiptData {
  items: CartItem[];
  subTotal: number;
  totalDiscount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'qr';
  amountPaid: number;
  changeAmount: number;
  date: Date;
  transactionId?: string;
}

export default function POS() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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
        total_amount: totalAmount,
        payment_method: method,
        status: 'paid'
      }).select().single();

      if (txError) throw txError;

      const itemsData = cart.map(item => ({
        transaction_id: tx.id,
        product_id: item.id,
        quantity: item.qty,
        price: item.price - (item.discount || 0),
        cost_price: item.cost_price || 0
      }));

      const { error: itemsError } = await supabase.from('transaction_items').insert(itemsData);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        const { error: rpcError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_qty: item.qty
        });
        if (rpcError) {
          const { data: stockData } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();
          if (stockData) {
            await supabase
              .from('products')
              .update({ stock: Math.max(0, (stockData.stock || 0) - item.qty) })
              .eq('id', item.id);
          }
        }
      }

      showToast('Pembayaran berhasil diproses!', "success");

      const change = typeof amountPaid === 'number' ? amountPaid - totalAmount : 0;
      setReceiptData({
        items: cart,
        subTotal,
        totalDiscount,
        totalAmount,
        paymentMethod: method,
        amountPaid: method === 'cash' ? (typeof amountPaid === 'number' ? amountPaid : totalAmount) : totalAmount,
        changeAmount: method === 'cash' ? change : 0,
        date: new Date(),
        transactionId: tx.id
      });
      setPaymentModal(false);
      setCashModal(false);
      setQrModal(false);
    } catch (error) {
      console.error(error);
      showToast('Terjadi kesalahan saat memproses pembayaran.', "error");
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
    <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-warm-50 to-white">
      {/* Product List Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category Filters & Search */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all premium-shadow"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide -mx-1 px-1 pb-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                  activeCategory === 'all'
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/20"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                )}
              >
                Semua
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                    activeCategory === c.id
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/20"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-24 sm:pb-4">
            {filteredProducts.map(p => {
              const isOutOfStock = (p.stock || 0) === 0;
              const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5;
              return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={cn(
                  "bg-white rounded-2xl border border-gray-100 transition-all overflow-hidden group relative premium-shadow card-hover",
                  isOutOfStock
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer active:scale-[0.98]'
                )}
              >
                {/* Badge */}
                {isOutOfStock ? (
                  <div className="absolute top-2 left-2 z-10 bg-gray-900/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    HABIS
                  </div>
                ) : isLowStock ? (
                  <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg">
                    SISA {p.stock}
                  </div>
                ) : (p.discount || 0) > 0 ? (
                  <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg animate-pulse">
                    POTONGAN Rp {p.discount.toLocaleString('id-ID')}
                  </div>
                ) : null}

                <div className="h-32 sm:h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-2 mb-1 flex-1 leading-snug">{p.name}</h3>
                  <div className="mt-2">
                    {p.discount && p.discount > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through font-medium">Rp {p.price.toLocaleString('id-ID')}</span>
                        <span className="font-extrabold text-red-500 text-sm sm:text-base">Rp {(p.price - p.discount).toLocaleString('id-ID')}</span>
                      </div>
                    ) : (
                      <p className="font-bold text-gray-900 text-sm sm:text-base">Rp {p.price.toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
                {!isOutOfStock && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                      <Plus className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Cart Floating Button */}
      {!paymentModal && cart.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-30">
          <button
            onClick={() => document.getElementById('mobile-cart')?.classList.remove('translate-y-full')}
            className="w-full relative bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl shadow-xl shadow-red-600/30 font-bold py-4 px-6 flex items-center justify-between btn-press"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-left flex flex-col">
                <span>{cart.length} Item</span>
                <span className="text-xs text-red-100 font-normal">Lihat Pesanan</span>
              </span>
            </div>
            <span className="text-lg font-extrabold">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar */}
      <div id="mobile-cart" className="fixed inset-0 z-40 bg-white sm:relative sm:z-20 flex flex-col sm:flex w-full sm:w-96 border-l border-gray-200 transition-transform duration-300 translate-y-full sm:translate-y-0 shadow-2xl sm:shadow-none">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex items-center gap-3 pt-8 sm:pt-4">
          <button onClick={() => document.getElementById('mobile-cart')?.classList.add('translate-y-full')} className="sm:hidden mr-1 p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <Minus className="w-5 h-5 rotate-90 text-gray-500" />
          </button>
          <div className="w-9 h-9 bg-gradient-to-br from-red-50 to-amber-50 rounded-xl flex items-center justify-center border border-red-100">
            <Receipt className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-900">Pesanan</h2>
          <span className="ml-auto bg-red-50 text-red-600 text-xs font-extrabold px-2.5 py-1.5 rounded-lg">{cart.length} Item</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-300 space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <p className="text-gray-400 font-medium">Belum ada pesanan</p>
                <p className="text-xs text-gray-300">Klik menu untuk memulai</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex flex-col gap-2 p-4 border border-gray-100 rounded-2xl bg-white hover:border-red-200 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 pr-2 leading-tight flex-1 text-sm">{item.name}</h4>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      {item.discount && item.discount > 0 ? (
                        <>
                          <span className="text-[11px] text-gray-400 line-through font-medium">Rp {item.price.toLocaleString('id-ID')}</span>
                          <span className="text-sm font-extrabold text-red-500">Rp {(item.price - item.discount).toLocaleString('id-ID')}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-gray-900">Rp {item.price.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-150 p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition-all">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-sm w-6 text-center text-gray-900">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Area */}
          <div className="sticky bottom-0 p-4 sm:p-5 border-t border-gray-100 bg-white/80 backdrop-blur-xl mt-auto space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-red-500 font-medium">
                <span>Diskon</span>
                <span>- Rp {totalDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-gray-900 font-bold">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-gray-900">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => setPaymentModal(true)}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-extrabold text-base hover:from-red-700 hover:to-red-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-gray-900">Pilih Metode</h2>
              <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors">×</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-8">
                <p className="text-sm font-medium text-gray-400 mb-2">Total Tagihan</p>
                <p className="text-4xl font-extrabold text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={isProcessing}
                  onClick={() => { setPaymentModal(false); setCashModal(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group disabled:opacity-50 card-hover"
                >
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                    <Banknote className="w-7 h-7 text-emerald-600" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-emerald-700">Tunai</span>
                  <span className="text-xs text-gray-400 mt-1">Pembayaran tunai</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => { setPaymentModal(false); setQrModal(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group disabled:opacity-50 card-hover"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <QrCode className="w-7 h-7 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-blue-700">QRIS / QR</span>
                  <span className="text-xs text-gray-400 mt-1">Scan QR code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {cashModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Pembayaran Tunai</h2>
              </div>
              <button onClick={() => { setCashModal(false); setAmountPaid(''); }} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors">×</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Order summary */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/60">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-700 text-sm">Struk Pesanan</h3>
                </div>
                <div className="space-y-2.5 mb-4 max-h-36 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.qty}x <span className="font-medium text-gray-800">{item.name}</span>
                        {item.discount && item.discount > 0 ? ' (Disc)' : ''}
                      </span>
                      <span className="font-bold text-gray-900">Rp {((item.price - (item.discount || 0)) * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-dashed border-gray-200 pt-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>Rp {subTotal.toLocaleString('id-ID')}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-red-500 font-medium">
                      <span>Diskon</span>
                      <span>- Rp {totalDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-extrabold">
                    <span>Total</span>
                    <span className="text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Uang Customer (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-400 font-bold text-lg">Rp</span>
                    </div>
                    <input
                      type="number"
                      autoFocus
                      value={amountPaid === '' ? '' : amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-3xl font-extrabold text-gray-900 p-4 pl-14 rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={cn(
                  "rounded-2xl p-4 flex justify-between items-center border transition-all",
                  changeAmount < 0
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-200"
                )}>
                  <span className={cn(
                    "font-bold",
                    changeAmount < 0 ? "text-red-700" : "text-emerald-700"
                  )}>Kembalian</span>
                  <span className={cn(
                    "text-2xl font-extrabold",
                    changeAmount < 0 ? "text-red-500" : "text-emerald-600"
                  )}>
                    Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                    {changeAmount < 0 && ' (Kurang)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80">
              <button
                disabled={isProcessing || changeAmount < 0 || amountPaid === ''}
                onClick={() => handleCheckout('cash')}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-extrabold text-base hover:from-emerald-700 hover:to-green-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : 'Selesaikan Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[380px] sm:rounded-[28px] rounded-t-[28px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300 flex flex-col relative">
            <button onClick={() => setQrModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 transition-colors backdrop-blur-sm">×</button>

            <div className="bg-[#ED1F24] p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 skew-x-12 translate-x-20 -translate-y-10 rounded-full" />
              <span className="text-white text-4xl font-extrabold italic tracking-wider drop-shadow-sm block mb-2 mt-4">QRIS</span>
              <div className="bg-black/10 text-white/90 text-[10px] py-1 px-3 rounded-full inline-block font-medium backdrop-blur-sm">
                Quick Response Code Indonesian Standard
              </div>
            </div>

            <div className="p-8 text-center bg-white">
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">Pondok Salero</h3>
              <p className="text-sm text-gray-400 mb-6 font-mono mt-1">NMID: ID1029384756</p>

              <div className="bg-white p-4 rounded-2xl mx-auto w-64 border-2 border-gray-100 shadow-sm mb-8 relative">
                <QRCode value={`QRIS-BAKSOPRASMANAN-${totalAmount}`} size={220} className="w-full h-auto mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-[#ED1F24] text-[10px] font-bold italic">QRIS</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 text-blue-900 py-4 px-4 rounded-2xl mb-8">
                <p className="text-xs font-bold mb-1 uppercase tracking-wider text-blue-500">Total Pembayaran</p>
                <p className="text-3xl font-extrabold tracking-tight">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-gray-500 animate-pulse font-medium flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Menunggu pembayaran...
                </p>
                <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 w-1/2 rounded-full animate-pulse transition-all duration-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Dicetak oleh Pondok Salero</p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto" id="receipt-content">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <UtensilsCrossed className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Pondok Salero</h2>
                <p className="text-gray-500 text-sm font-medium">Pasar Minggu, Jakarta Selatan</p>
                <p className="text-gray-400 text-xs mt-1">{format(receiptData.date, 'dd MMM yyyy HH:mm')}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 py-4 mb-4">
                <div className="space-y-3">
                  {receiptData.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700 flex-1 pr-4 font-medium">
                        {item.qty}x {item.name}
                        {item.discount && item.discount > 0 ? ` (Disc -Rp ${item.discount.toLocaleString('id-ID')})` : ''}
                      </span>
                      <span className="font-bold text-gray-900 whitespace-nowrap">
                        Rp {((item.price - (item.discount || 0)) * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm border-b border-dashed border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>Rp {receiptData.subTotal.toLocaleString('id-ID')}</span>
                </div>
                {receiptData.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Diskon</span>
                    <span>- Rp {receiptData.totalDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-100">
                  <span>Total Akhir</span>
                  <span>Rp {receiptData.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode Bayar</span>
                  <span className="uppercase font-extrabold text-gray-900">{receiptData.paymentMethod}</span>
                </div>
                {receiptData.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tunai</span>
                      <span className="font-bold text-gray-900">Rp {receiptData.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-500 font-medium">Kembalian</span>
                      <span className="font-extrabold text-emerald-600">Rp {receiptData.changeAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center mt-8 text-gray-400 text-xs space-y-1">
                <p className="font-medium text-gray-500">Terima kasih atas kunjungannya!</p>
                <p className="font-mono text-gray-300">ID: {receiptData.transactionId?.substring(0, 8)}</p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 flex gap-3">
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
                              body { font-family: 'Courier New', monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
                              .text-center { text-align: center; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .font-bold { font-weight: 700; }
                              .font-extrabold { font-weight: 800; }
                              .font-medium { font-weight: 500; }
                              .text-sm { font-size: 14px; }
                              .text-xs { font-size: 12px; }
                              .text-base { font-size: 16px; }
                              .text-2xl { font-size: 24px; }
                              .text-3xl { font-size: 30px; }
                              .mb-6 { margin-bottom: 24px; }
                              .mb-4 { margin-bottom: 16px; }
                              .mb-2 { margin-bottom: 8px; }
                              .mb-1 { margin-bottom: 4px; }
                              .mt-8 { margin-top: 32px; }
                              .mt-1 { margin-top: 4px; }
                              .mt-2 { margin-top: 8px; }
                              .pt-1 { padding-top: 4px; }
                              .pt-2 { padding-top: 8px; }
                              .pb-4 { padding-bottom: 16px; }
                              .py-4 { padding-top: 16px; padding-bottom: 16px; }
                              .px-4 { padding-left: 16px; padding-right: 16px; }
                              .space-y-3 > * + * { margin-top: 12px; }
                              .space-y-2 > * + * { margin-top: 8px; }
                              .space-y-1 > * + * { margin-top: 4px; }
                              .border-t { border-top: 1px solid #ccc; }
                              .border-b { border-bottom: 1px solid #ccc; }
                              .border-dashed { border-top-style: dashed; border-bottom-style: dashed; }
                              .uppercase { text-transform: uppercase; }
                              .whitespace-nowrap { white-space: nowrap; }
                              .flex-1 { flex: 1; }
                              .pr-4 { padding-right: 16px; }
                              .text-red-500 { color: #ef4444; }
                              .text-emerald-600 { color: #059669; }
                              .text-gray-900 { color: #111827; }
                              .text-gray-500 { color: #6b7280; }
                              .text-gray-400 { color: #9ca3af; }
                              .text-gray-300 { color: #d1d5db; }
                              .font-mono { font-family: 'Courier New', monospace; }
                              .tracking-tight { letter-spacing: -0.025em; }
                              .leading-tight { line-height: 1.25; }
                              .w-14 { width: 56px; }
                              .h-14 { height: 56px; }
                              .mx-auto { margin-left: auto; margin-right: auto; }
                              .rounded-2xl { border-radius: 16px; }
                              .border { border: 1px solid; }
                              .border-red-100 { border-color: #fee2e2; }
                              .flex-col { flex-direction: column; }
                              .items-center { align-items: center; }
                              .gap-2 { gap: 8px; }
                              .gap-3 { gap: 12px; }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                            <script>window.onload = function() { window.print(); window.close(); }</script>
                          </body>
                        </html>
                      `);
                    windowPrint.document.close();
                  }
                }}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-extrabold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" /> Cetak
              </button>
              <button
                onClick={closeReceipt}
                className="flex-1 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl font-extrabold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg active:scale-[0.98]"
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
