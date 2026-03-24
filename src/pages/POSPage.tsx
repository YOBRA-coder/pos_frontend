import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Tag, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, customersApi } from '../api/client';
import { useCartStore, useAuthStore } from '../store';
import PaymentModal from '../components/payments/PaymentModal';
import clsx from 'clsx';
import type { Product, Customer } from '../types';

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const { user } = useAuthStore();
  const cart = useCartStore();

  const { data: products = [] } = useQuery({ queryKey: ['products', activeCategory, search], queryFn: () => productsApi.list({ category: activeCategory === 'all' ? undefined : activeCategory, search }).then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then(r => r.data) });
  const { data: customers = [] } = useQuery({ queryKey: ['customers', customerSearch], queryFn: () => customersApi.list({ search: customerSearch }).then(r => r.data), enabled: customerSearch.length > 1 });

  const taxRate = user?.tax_rate || 16;
  const subtotal = cart.getSubtotal();
  const discount = cart.getDiscount();
  const tax = cart.getTax(taxRate);
  const total = cart.getTotal(taxRate);
  const currency = user?.currency || 'KES';

  const fmt = (n: number) => `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Product Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search & Filter */}
        <div className="p-4 border-b border-dark-800 bg-dark-900">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or scan barcode..." className="input-field w-full pl-9 pr-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveCategory('all')} className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', activeCategory === 'all' ? 'bg-brand-500 text-dark-950' : 'bg-dark-800 text-dark-300 hover:bg-dark-700')}>
              All
            </button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={clsx('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', activeCategory === cat.id ? 'text-dark-950' : 'bg-dark-800 text-dark-300 hover:bg-dark-700')} style={activeCategory === cat.id ? { background: cat.color } : {}}>
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="product-grid">
            {products.map((product: Product) => (
              <button key={product.id} onClick={() => cart.addItem(product)} disabled={product.track_inventory && product.stock_quantity <= 0}
                className={clsx('card card-hover p-3 text-left flex flex-col gap-2 cursor-pointer', product.track_inventory && product.stock_quantity <= 0 && 'opacity-40 cursor-not-allowed')}>
                <div className="w-full h-20 rounded-lg flex items-center justify-center text-3xl" style={{ background: product.category_color ? `${product.category_color}20` : '#1e293b' }}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" /> : '📦'}
                </div>
                <div>
                  <p className="font-medium text-white text-xs leading-tight line-clamp-2">{product.name}</p>
                  {product.category_name && (
                    <p className="text-xs mt-0.5" style={{ color: product.category_color || '#64748b' }}>{product.category_name}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-brand-400 text-sm number-display">{fmt(product.price)}</span>
                  {product.track_inventory && (
                    <span className={clsx('text-xs', product.stock_quantity <= product.low_stock_threshold ? 'text-amber-400' : 'text-dark-400')}>
                      {product.stock_quantity} left
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-dark-400">
              <ShoppingCart size={40} className="mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 flex flex-col border-l border-dark-800 bg-dark-900">
        {/* Cart Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-400" />
            <span className="font-semibold text-white">Cart</span>
            {cart.items.length > 0 && (
              <span className="bg-brand-500 text-dark-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.items.length}</span>
            )}
          </div>
          {cart.items.length > 0 && (
            <button onClick={cart.clearCart} className="text-xs text-dark-400 hover:text-red-400 transition-colors">Clear all</button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-3 border-b border-dark-800">
          <div className="relative">
            <div className="flex items-center gap-2">
              <User size={14} className="text-dark-400" />
              {cart.customer ? (
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">{cart.customer.name}</span>
                    <span className="text-xs text-brand-400 ml-2">⭐ {cart.customer.loyalty_points} pts</span>
                  </div>
                  <button onClick={() => cart.setCustomer(null)} className="text-dark-400 hover:text-white"><X size={14} /></button>
                </div>
              ) : (
                <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Add customer (optional)" className="flex-1 bg-transparent text-sm text-dark-300 placeholder-dark-500 outline-none" />
              )}
            </div>
            {showCustomerDropdown && customers.length > 0 && !cart.customer && (
              <div className="absolute top-8 left-0 right-0 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                {customers.map((c: Customer) => (
                  <button key={c.id} onClick={() => { cart.setCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-700 text-left">
                    <div>
                      <p className="text-sm text-white">{c.name}</p>
                      <p className="text-xs text-dark-400">{c.phone}</p>
                    </div>
                    <span className="text-xs text-brand-400">{c.loyalty_points} pts</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-500 py-12">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Add items to start a sale</p>
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.product_id} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg animate-slide-in">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                  <p className="text-xs text-dark-400 number-display">{fmt(item.unit_price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white number-display">{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-bold text-white number-display">{fmt(item.total)}</p>
                  <button onClick={() => cart.removeItem(item.product_id)} className="text-dark-500 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount */}
        {cart.items.length > 0 && (
          <div className="px-4 py-3 border-t border-dark-800">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-dark-400" />
              <input
                type="number"
                min="0"
                placeholder="Discount"
                value={cart.discount || ''}
                onChange={e => cart.setDiscount(Number(e.target.value), cart.discountType)}
                className="input-field flex-1 px-3 py-2 text-sm"
              />
              <select value={cart.discountType} onChange={e => cart.setDiscount(cart.discount, e.target.value as 'fixed' | 'percentage')} className="input-field px-2 py-2 text-sm">
                <option value="fixed">KES</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="p-4 border-t border-dark-800 space-y-2">
          <div className="flex justify-between text-sm text-dark-400">
            <span>Subtotal</span><span className="number-display">{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-brand-400">
              <span>Discount</span><span className="number-display">-{fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-dark-400">
            <span>VAT ({taxRate}%)</span><span className="number-display">{fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-dark-700">
            <span>Total</span><span className="number-display text-brand-400">{fmt(total)}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.items.length === 0}
            className="btn-primary w-full py-4 text-base font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Charge {cart.items.length > 0 ? fmt(total) : ''}
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          orderId={null}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); cart.clearCart(); }}
        />
      )}
    </div>
  );
}
