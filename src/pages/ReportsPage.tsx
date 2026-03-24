import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/client';
import { useAuthStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

export default function ReportsPage() {
  const [range, setRange] = useState('7');
  const { user } = useAuthStore();
  const currency = user?.currency || 'KES';
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

  const fromDate = format(subDays(new Date(), Number(range)), 'yyyy-MM-dd');
  const { data: salesData = [] } = useQuery({ queryKey: ['sales', range], queryFn: () => reportsApi.sales({ from: fromDate, group_by: Number(range) <= 7 ? 'day' : 'week' }).then(r => r.data) });
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: () => reportsApi.dashboard().then(r => r.data) });

  const chartData = salesData.map((d: any) => ({ period: format(new Date(d.period), Number(range) <= 7 ? 'EEE' : 'MMM d'), revenue: Number(d.revenue), orders: Number(d.orders) }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-dark-400 text-sm mt-1">Business performance insights</p>
        </div>
        <select value={range} onChange={e => setRange(e.target.value)} className="input-field px-4 py-2.5 text-sm">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Revenue', value: fmt(dash?.month?.revenue || 0), sub: 'This month' },
          { label: 'Orders', value: dash?.month?.count || 0, sub: 'This month' },
          { label: 'Avg Order', value: fmt(dash?.month?.count > 0 ? dash?.month?.revenue / dash?.month?.count : 0), sub: 'Per transaction' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-dark-400 mb-1">{sub}</p>
            <p className="text-2xl font-bold text-white number-display">{value}</p>
            <p className="text-sm text-dark-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => [fmt(v), 'Revenue']} />
            <Bar dataKey="revenue" fill="#22c55e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Order Volume</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products Table */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Top Selling Products (30 Days)</h3>
        <div className="space-y-3">
          {(dash?.topProducts || []).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-dark-500 text-sm w-5">{i+1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">{p.product_name}</span>
                  <span className="text-sm font-bold text-white number-display">{fmt(p.revenue)}</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full">
                  <div className="h-1.5 bg-brand-500 rounded-full transition-all" style={{ width: `${(Number(p.revenue) / Number(dash.topProducts[0].revenue)) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-dark-400 w-16 text-right">{p.qty} units</span>
            </div>
          ))}
          {(!dash?.topProducts || dash.topProducts.length === 0) && <p className="text-dark-500 text-sm">No sales data for this period</p>}
        </div>
      </div>
    </div>
  );
}
