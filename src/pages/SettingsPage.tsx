import { useState } from 'react';
import { useAuthStore } from '../store';
import { Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import clsx from 'clsx';


export default function SettingsPage() {
  const { user } = useAuthStore();
  const [search] = useState('');
  const [tab, setTab] = useState('business');
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ businessName: '', name: '', email: '', phone: '', password: '' });
  const [editing, setEditing] = useState<User | null>(null);
  const qc = useQueryClient();


  const { data: users = [], isLoading } = useQuery({ queryKey: ['users', search], queryFn: () => usersApi.list({ search }).then(r => r.data) });
  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? usersApi.update(editing.id, d) : usersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false); toast.success(editing ? 'User updated!' : 'User added!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add user'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      saveMutation.mutate({ ...form, businessName: String(form.businessName), name: String(form.name), email: String(form.email), Phone: String(form.phone), password: String(form.password) });
  };

  const openNew = () => { setEditing(null); setForm(form); setShowModal(true); };
  const openEdit = (p: User) => { setEditing(p); setForm({ businessName: p.businessId, name: p.name, email: p.email, phone: "", password: "" }); setShowModal(true); };


  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated'); },
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 text-sm mt-1">Configure your POS system</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-dark-800 pb-4">
        {['business','payments','receipt','users'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-brand-500/15 text-brand-400' : 'text-dark-400 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {tab === 'business' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Business Information</h2>
          {[
            { label: 'Business Name', value: user?.business_name || '' },
            { label: 'Currency', value: user?.currency || 'KES' },
            { label: 'Tax Rate (%)', value: user?.tax_rate?.toString() || '16' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
              <input defaultValue={value} className="input-field w-full px-4 py-2.5 text-sm" />
            </div>
          ))}
          <button onClick={() => toast.success('Settings saved!')} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"><Save size={14} /> Save Changes</button>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <h2 className="font-semibold text-white">M-Pesa Configuration</h2>
            </div>
            <p className="text-sm text-dark-400">Configure your Safaricom M-Pesa Daraja API credentials.</p>
            {[
              { label: 'Shortcode / Paybill / Till', placeholder: '174379' },
              { label: 'Consumer Key', placeholder: 'Your Daraja consumer key' },
              { label: 'Consumer Secret', placeholder: 'Your Daraja consumer secret' },
              { label: 'Passkey', placeholder: 'Your M-Pesa passkey' },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
                <input className="input-field w-full px-4 py-2.5 text-sm" placeholder={placeholder} />
              </div>
            ))}
            <button onClick={() => toast.success('M-Pesa settings saved!')} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"><Save size={14} /> Save M-Pesa Settings</button>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h2 className="font-semibold text-white">Card Payment Gateway</h2>
            </div>
            <p className="text-sm text-dark-400">Connect Stripe, Flutterwave, DPO, or other payment gateways.</p>
            <select className="input-field w-full px-4 py-2.5 text-sm">
              <option>Select Gateway</option>
              <option>Stripe</option>
              <option>Flutterwave</option>
              <option>DPO Group</option>
              <option>Pesapal</option>
            </select>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">API Key</label>
              <input className="input-field w-full px-4 py-2.5 text-sm" placeholder="sk_live_..." />
            </div>
            <button onClick={() => toast.success('Gateway settings saved!')} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"><Save size={14} /> Save Gateway Settings</button>
          </div>
        </div>
      )}

      {tab === 'receipt' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Receipt Settings</h2>
          {[
            { label: 'Receipt Header', placeholder: 'Thank you for shopping with us!' },
            { label: 'Receipt Footer', placeholder: 'Visit us again!' },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
              <textarea className="input-field w-full px-4 py-2.5 text-sm resize-none" rows={2} placeholder={placeholder} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="print" className="w-4 h-4 accent-green-500" defaultChecked />
            <label htmlFor="print" className="text-sm text-dark-300">Auto-print receipt after payment</label>
          </div>
          <button onClick={() => toast.success('Receipt settings saved!')} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"><Save size={14} /> Save Receipt Settings</button>
        </div>
      )}

      {tab === 'users' && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">User Management</h2>
          <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-dark-950">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium text-white">{user?.name}</p>
              <p className="text-xs text-dark-400">{user?.email} · <span className="capitalize text-brand-400">{user?.role}</span></p>
            </div>
          </div>
          <p className="text-xs text-dark-500 mt-4">Team member management coming soon. You can invite cashiers and managers to your POS.</p>
          <button onClick={() => openNew()} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2"><Plus size={16} /> Add Users</button>
         
         {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div> : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((p: User) => (
            <div key={p.id} className={clsx('card p-4 card-hover opacity-50')}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                  📦
                </div>
                <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded transition-colors"><Trash2 size={13} /></button>
                </div>
             
              </div>
              <h3 className="font-medium text-white text-sm leading-tight mb-1">{p.name}</h3>
              <h3 className="font-medium text-white text-sm leading-tight mb-1">{p.email}</h3>
              <span className="capitalize text-brand-400">{p.role}</span>
            </div>
          ))}
        </div>
      )}
       
        </div>
      )}

{showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <h2 className="text-lg font-bold text-white">{editing ? "Editing User Account" : "New User Account"}</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white p-1 rounded"><X size={20} /></button>
            </div>
          <form onSubmit={handleSubmit} className="space-y-9">
          {[
            { key: 'businessName', label: 'Business Name', placeholder: 'Acme Store' },
            { key: 'name', label: 'Your Name', placeholder: 'John Doe' },
            { key: 'email', label: 'Email Address', placeholder: 'you@business.com', type: 'email' },
            { key: 'phone', label: 'Phone Number', placeholder: '+254 700 000 000' },
            { key: 'password', label: 'Password', placeholder: 'Min 8 characters', type: 'password' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="input-field w-full px-4 py-3 text-sm" placeholder={placeholder} required />
            </div>
          ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editing ? 'Update User' : 'Add User'}
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
