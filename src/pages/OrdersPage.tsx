import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/client';
import { useAuthStore } from '../store';
import { Search, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { Order } from '../types';

const statusColors: Record<string, string> = { completed: 'status-completed', pending: 'status-pending', cancelled: 'status-cancelled', processing: 'status-processing', refunded: 'status-refunded' };

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuthStore();
  const currency = user?.currency || 'KES';
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const { data, isLoading } = useQuery({ queryKey: ['orders', statusFilter], queryFn: () => ordersApi.list({ status: statusFilter || undefined, limit: 100 }).then(r => r.data) });
  const orders: Order[] = data?.orders || [];
  const filtered = orders.filter(o => !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-dark-400 text-sm mt-1">{data?.total || 0} total orders</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number or customer..." className="input-field w-full pl-9 pr-4 py-2.5 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field px-4 py-2.5 text-sm">
          <option value="">All Status</option>
          {['pending','processing','completed','cancelled','refunded'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-800">
              {['Order #','Customer','Date','Items','Status','Total',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            )) : filtered.map(order => (
              <tr key={order.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-white font-medium">{order.order_number}</td>
                <td className="px-4 py-3 text-sm text-dark-300">{order.customer_name || 'Walk-in'}</td>
                <td className="px-4 py-3 text-sm text-dark-400">{format(new Date(order.created_at), 'MMM d, HH:mm')}</td>
                <td className="px-4 py-3 text-sm text-dark-400">{order.items?.length || '—'}</td>
                <td className="px-4 py-3"><span className={clsx('badge', statusColors[order.status])}>{order.status}</span></td>
                <td className="px-4 py-3 text-sm font-bold text-white number-display">{fmt(order.total)}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => { const res = await ordersApi.get(order.id); setSelectedOrder(res.data); }} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-dark-400">No orders found</div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <div>
                <h2 className="font-bold text-white font-mono">{selectedOrder.order_number}</h2>
                <span className={clsx('badge mt-1', statusColors[selectedOrder.status])}>{selectedOrder.status}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-dark-400 hover:text-white p-1 rounded"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-dark-300">{item.product_name} × {item.quantity}</span>
                    <span className="text-white number-display">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dark-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-dark-400">Subtotal</span><span className="text-white number-display">{fmt(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discount_amount > 0 && <div className="flex justify-between text-sm"><span className="text-dark-400">Discount</span><span className="text-brand-400 number-display">-{fmt(selectedOrder.discount_amount)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-dark-400">Tax</span><span className="text-white number-display">{fmt(selectedOrder.tax_amount)}</span></div>
                <div className="flex justify-between font-bold"><span className="text-white">Total</span><span className="text-brand-400 text-lg number-display">{fmt(selectedOrder.total)}</span></div>
              </div>
              {(selectedOrder.payments || []).map((p: any, i: number) => (
                <div key={i} className="bg-dark-800 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-300 capitalize">{p.payment_method.replace('_', ' ')}</span>
                    <span className="text-white number-display">{fmt(p.amount)}</span>
                  </div>
                  {p.mpesa_receipt && <p className="text-xs text-dark-400 font-mono mt-1">Receipt: {p.mpesa_receipt}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
