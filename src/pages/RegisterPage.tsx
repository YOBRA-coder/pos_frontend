import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ businessName: '', name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.token);
      toast.success('Business account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Zap size={16} className="text-dark-950" /></div>
          <span className="text-xl font-bold text-white">SwiftPOS</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-dark-400 mb-8">Set up your business and start selling</p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-dark-400 text-sm">
          Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
