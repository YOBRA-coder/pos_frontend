import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/client';
import { useAuthStore } from '../store';
import { TrendingUp, ShoppingCart, DollarSign, Users, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

const PIE_COLORS = { mpesa: '#22c55e', credit_card: '#3b82f6', debit_card: '#8b5cf6', cash: '#f59e0b', bank_transfer: '#06b6d4' };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => reportsApi.dashboard().then(r => r.data), refetchInterval: 30000 });
  const currency = user?.currency || 'KES';
  const fmt = (n: number | string) => `${currency} ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

  if (isLoading) return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  );

  const stats = [
    { label: "Today's Revenue", value: fmt(data?.today?.revenue || 0), sub: `${data?.today?.count || 0} transactions`, icon: DollarSign, color: '#22c55e' },
    { label: "This Week", value: fmt(data?.week?.revenue || 0), sub: `${data?.week?.count || 0} orders`, icon: TrendingUp, color: '#3b82f6' },
    { label: "This Month", value: fmt(data?.month?.revenue || 0), sub: `${data?.month?.count || 0} orders`, icon: ShoppingCart, color: '#8b5cf6' },
    { label: "Avg Order Value", value: fmt(data?.month?.count > 0 ? data?.month?.revenue / data?.month?.count : 0), sub: 'Last 30 days', icon: Users, color: '#f59e0b' },
  ];

  const chartData = (data?.dailyRevenue || []).map((d: any) => ({
    date: format(parseISO(d.date), 'EEE'),
    revenue: Number(d.revenue),
    orders: Number(d.orders)
  }));

  const paymentData = (data?.paymentMethods || []).map((p: any) => ({
    name: p.payment_method.replace('_', ' ').toUpperCase(),
    value: Number(p.total),
    count: p.count
  }));

  const statusColors: Record<string, string> = { completed: 'status-completed', pending: 'status-pending', cancelled: 'status-cancelled', processing: 'status-processing', refunded: 'status-refunded' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">Welcome back, {user?.name}. Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white number-display">{value}</p>
            <p className="text-xs text-dark-400 mt-1">{label}</p>
            <p className="text-xs text-dark-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-white mb-4">Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} formatter={(v: any) => [fmt(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Payment Methods</h3>
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {paymentData.map((_entry: any, i: number) => (
                      <Cell key={i} fill={Object.values(PIE_COLORS)[i % Object.values(PIE_COLORS).length] as string} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => [fmt(v), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentData.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: Object.values(PIE_COLORS)[i % Object.values(PIE_COLORS).length] as string }} />
                      <span className="text-dark-300">{p.name}</span>
                    </div>
                    <span className="text-dark-400">{p.count} txns</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-dark-500 text-sm text-center py-8">No payment data yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Top Products (30 days)</h3>
            <Link to="/products" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {data?.topProducts?.length ? data.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-dark-500 text-xs w-4">{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{p.product_name}</p>
                  <div className="h-1 bg-dark-700 rounded-full mt-1">
                    <div className="h-1 bg-brand-500 rounded-full" style={{ width: `${(p.revenue / data.topProducts[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white number-display">{fmt(p.revenue)}</p>
                  <p className="text-xs text-dark-400">{p.qty} sold</p>
                </div>
              </div>
            )) : <p className="text-dark-500 text-sm">No sales data yet</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {data?.recentOrders?.length ? data.recentOrders.slice(0,6).map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white font-mono">{o.order_number}</p>
                  <p className="text-xs text-dark-400">{o.customer_name || 'Walk-in'}</p>
                </div>
                <span className={clsx('badge', statusColors[o.status] || '')}>{o.status}</span>
                <span className="text-sm font-bold text-white number-display">{fmt(o.total)}</span>
              </div>
            )) : <p className="text-dark-500 text-sm">No orders yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
