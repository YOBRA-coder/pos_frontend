import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../api/client';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { Product, Category } from '../types';

interface ProductFormData {
  name: string; description: string; sku: string; price: string; cost_price: string;
  stock_quantity: string; category_id: string; low_stock_threshold: string;
  track_inventory: boolean; tax_exempt: boolean; is_active: boolean;
}

const defaultForm: ProductFormData = { name: '', description: '', sku: '', price: '', cost_price: '', stock_quantity: '0', category_id: '', low_stock_threshold: '10', track_inventory: true, tax_exempt: false, is_active: true };

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const currency = user?.currency || 'KES';
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products', search], queryFn: () => productsApi.list({ search, active: 'all' }).then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing ? productsApi.update(editing.id, data) : productsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowModal(false); toast.success(editing ? 'Product updated!' : 'Product added!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deactivated'); },
  });

  const openNew = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, description: p.description||'', sku: p.sku||'', price: p.price.toString(), cost_price: p.cost_price.toString(), stock_quantity: p.stock_quantity.toString(), category_id: p.category_id||'', low_stock_threshold: p.low_stock_threshold.toString(), track_inventory: p.track_inventory, tax_exempt: p.tax_exempt, is_active: p.is_active }); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, price: Number(form.price), cost_price: Number(form.cost_price), stock_quantity: Number(form.stock_quantity), low_stock_threshold: Number(form.low_stock_threshold) });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-dark-400 text-sm mt-1">{products.length} products in your catalog</p>
        </div>
        <button onClick={openNew} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU..." className="input-field w-full pl-9 pr-4 py-3 text-sm" />
      </div>

      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p: Product) => (
            <div key={p.id} className={clsx('card p-4 card-hover', !p.is_active && 'opacity-50')}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: p.category_color ? `${p.category_color}20` : '#1e293b' }}>
                  📦
                </div>
                <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-medium text-white text-sm leading-tight mb-1">{p.name}</h3>
              {p.category_name && <p className="text-xs mb-2" style={{ color: p.category_color || '#64748b' }}>{p.category_name}</p>}
              <p className="text-lg font-bold text-brand-400 number-display">{fmt(p.price)}</p>
              {p.sku && <p className="text-xs text-dark-500 font-mono mt-1">SKU: {p.sku}</p>}
              <div className="flex items-center justify-between mt-2">
                {p.track_inventory && (
                  <span className={clsx('text-xs font-medium', p.stock_quantity <= p.low_stock_threshold ? 'text-amber-400' : 'text-dark-400')}>
                    {p.stock_quantity} in stock
                  </span>
                )}
                {!p.is_active && <span className="badge status-cancelled">Inactive</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white p-1 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-300 mb-2">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Price ({currency}) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm number-display" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Cost Price ({currency})</label>
                  <input type="number" step="0.01" min="0" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm number-display" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
                  <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm">
                    <option value="">No category</option>
                    {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm number-display" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Low Stock Alert</label>
                  <input type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm({...form, low_stock_threshold: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="input-field w-full px-4 py-2.5 text-sm resize-none" />
                </div>
                <div className="col-span-2 flex gap-6">
                  {[
                    { key: 'track_inventory', label: 'Track inventory' },
                    { key: 'tax_exempt', label: 'Tax exempt' },
                    { key: 'is_active', label: 'Active' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.checked})} className="w-4 h-4 accent-green-500" />
                      <span className="text-sm text-dark-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editing ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
