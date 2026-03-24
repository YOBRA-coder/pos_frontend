import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@swiftpos.com');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <div className="hidden lg:flex flex-col w-1/2 bg-dark-900 border-r border-dark-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #22c55e 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #22c55e 0px, transparent 1px, transparent 60px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-dark-950" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SwiftPOS</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            The POS built for<br />
            <span className="gradient-text">professionals.</span>
          </h1>
          <p className="text-dark-400 text-lg leading-relaxed mb-12">
            Accept M-Pesa, cards, and cash. Track inventory. Understand your business.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[['📱','M-Pesa STK Push'],['💳','Credit & Debit Cards'],['📊','Real-time Reports'],['📦','Inventory Tracking']].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                <span className="text-2xl">{icon}</span>
                <span className="text-dark-300 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Zap size={16} className="text-dark-950" /></div>
            <span className="text-xl font-bold text-white">SwiftPOS</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-dark-400 mb-8">Enter your credentials to access your POS</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field w-full px-4 py-3 text-sm" placeholder="you@business.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field w-full px-4 py-3 pr-12 text-sm" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-dark-400 text-sm">
            New business? <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create an account</Link>
          </p>
          <div className="mt-8 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
            <p className="text-xs text-dark-400 font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-dark-500 font-mono">demo@swiftpos.com / demo1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
