import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/client';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import type { Customer } from '../types';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.currency || 'KES';
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

  const { data: customers = [], isLoading } = useQuery({ queryKey: ['customers', search], queryFn: () => customersApi.list({ search }).then(r => r.data) });
  const createMutation = useMutation({
    mutationFn: (d: any) => customersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setShowModal(false); setForm({ name: '', email: '', phone: '', address: '', notes: '' }); toast.success('Customer added!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add customer'),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-dark-400 text-sm mt-1">{customers.length} customers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2"><Plus size={16} /> Add Customer</button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="input-field w-full pl-9 pr-4 py-3 text-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />) : customers.map((c: Customer) => (
          <div key={c.id} className="card p-4 card-hover">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-dark-950">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{c.name}</h3>
                {c.phone && <p className="text-sm text-dark-400">{c.phone}</p>}
                {c.email && <p className="text-xs text-dark-500 truncate">{c.email}</p>}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-brand-400">⭐ {c.loyalty_points} pts</span>
                  <span className="text-xs text-dark-400">Spent: {fmt(c.total_spent)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <h2 className="text-lg font-bold text-white">New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white p-1 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              {[
                { key: 'name', label: 'Full Name', required: true },
                { key: 'phone', label: 'Phone Number' },
                { key: 'email', label: 'Email Address', type: 'email' },
                { key: 'address', label: 'Address' },
              ].map(({ key, label, required, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-dark-300 mb-2">{label}{required && ' *'}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm" required={required} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Add Customer
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
