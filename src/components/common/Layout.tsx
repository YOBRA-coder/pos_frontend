import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Settings, LogOut, Menu, X, AlertTriangle, Boxes, FileText,
  Zap
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../api/client';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', highlight: true },
  { to: '/orders', icon: FileText, label: 'Orders' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  const { data: lowStock } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => inventoryApi.lowStock().then(r => r.data),
    refetchInterval: 60000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col transition-all duration-300 ease-in-out border-r border-dark-800 bg-dark-900 z-40',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800 h-16">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-dark-950" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">SwiftPOS</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center mx-auto">
              <Zap size={16} className="text-dark-950" />
            </div>
          )}
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="text-dark-400 hover:text-white p-1 rounded">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-3 mx-2 my-0.5 rounded-lg transition-all duration-150 group relative',
              isActive
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-dark-400 hover:text-white hover:bg-dark-800',
              highlight && !isActive && 'border border-dark-700'
            )}>
              <Icon size={18} className={clsx('flex-shrink-0', highlight && 'text-brand-400')} />
              {sidebarOpen && (
                <span className="font-medium text-sm whitespace-nowrap">{label}</span>
              )}
              {sidebarOpen && to === '/inventory' && lowStock && lowStock.length > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {lowStock.length}
                </span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-14 bg-dark-800 border border-dark-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-dark-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-dark-950">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="text-dark-400 hover:text-red-400 p-1 rounded transition-colors">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-dark-400 hover:text-red-400 p-2 rounded transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-dark-800 bg-dark-900 flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-dark-400 hover:text-white p-1 rounded transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {lowStock && lowStock.length > 0 && (
            <NavLink to="/inventory" className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm hover:bg-amber-500/15 transition-colors">
              <AlertTriangle size={14} />
              <span className="font-medium">{lowStock.length} low stock</span>
            </NavLink>
          )}
          <div className="text-sm text-dark-400">
            <span className="text-white font-medium">{user?.business_name}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
