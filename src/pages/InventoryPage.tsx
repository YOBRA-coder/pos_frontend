import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, inventoryApi } from '../api/client';
import { AlertTriangle, Plus, Minus, RefreshCw, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { Product } from '../types';

export default function InventoryPage() {
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'purchase'|'adjustment'|'return'>('adjustment');
  const [adjustNotes, setAdjustNotes] = useState('');
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products-inventory'], queryFn: () => productsApi.list({ active: 'all' }).then(r => r.data) });
  const { data: lowStock = [] } = useQuery({ queryKey: ['lowStock'], queryFn: () => inventoryApi.lowStock().then(r => r.data) });

  const adjustMutation = useMutation({
    mutationFn: (d: any) => inventoryApi.adjust(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products-inventory'] });
      qc.invalidateQueries({ queryKey: ['lowStock'] });
      setAdjustProduct(null); setAdjustQty(''); setAdjustNotes('');
      toast.success('Stock updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update stock'),
  });

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const qty = adjustType === 'adjustment' ? Number(adjustQty) : Math.abs(Number(adjustQty));
    adjustMutation.mutate({ product_id: adjustProduct.id, quantity_change: qty, type: adjustType, notes: adjustNotes });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="text-dark-400 text-sm mt-1">Track and manage your stock levels</p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">{lowStock.length} items running low</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p: Product) => (
              <button key={p.id} onClick={() => setAdjustProduct(p)} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 hover:bg-amber-500/20 transition-colors">
                {p.name} — {p.stock_quantity} left
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-800">
              {['Product','SKU','Category','In Stock','Low Alert','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>) :
              products.filter((p: Product) => p.track_inventory).map((p: Product) => {
                const isLow = p.stock_quantity <= p.low_stock_threshold;
                const isEmpty = p.stock_quantity <= 0;
                return (
                  <tr key={p.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white text-sm">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-dark-400 font-mono">{p.sku || '—'}</td>
                    <td className="px-4 py-3">
                      {p.category_name && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${p.category_color}20`, color: p.category_color || '#64748b' }}>{p.category_name}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-sm font-bold number-display', isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white')}>{p.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-400">{p.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', isEmpty ? 'status-cancelled' : isLow ? 'bg-amber-500/15 text-amber-400' : 'status-completed')}>
                        {isEmpty ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setAdjustProduct(p)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"><RefreshCw size={14} /></button>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {adjustProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <h2 className="font-bold text-white">Adjust Stock</h2>
              <button onClick={() => setAdjustProduct(null)} className="text-dark-400 hover:text-white p-1 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div className="bg-dark-800 rounded-lg p-3">
                <p className="font-medium text-white">{adjustProduct.name}</p>
                <p className="text-sm text-dark-400">Current stock: <span className="text-white font-bold">{adjustProduct.stock_quantity}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Adjustment Type</label>
                <select value={adjustType} onChange={e => setAdjustType(e.target.value as any)} className="input-field w-full px-4 py-2.5 text-sm">
                  <option value="purchase">Purchase (add stock)</option>
                  <option value="adjustment">Manual Adjustment (+ or -)</option>
                  <option value="return">Return (add stock)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  {adjustType === 'adjustment' ? 'Quantity Change (use - to reduce)' : 'Quantity to Add'}
                </label>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="input-field w-full px-4 py-2.5 text-sm number-display" placeholder={adjustType === 'adjustment' ? '-5 or +10' : '50'} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Notes</label>
                <input value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)} className="input-field w-full px-4 py-2.5 text-sm" placeholder="Reason for adjustment..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={adjustMutation.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {adjustMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Update Stock
                </button>
                <button type="button" onClick={() => setAdjustProduct(null)} className="btn-secondary px-4 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
