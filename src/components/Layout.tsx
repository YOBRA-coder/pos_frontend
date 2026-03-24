import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Users, Settings, LogOut, ChevronLeft, Bell, Search,
  Zap, Menu, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#89b4fa' },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', color: '#a6e3a1' },
  { to: '/products', icon: Package, label: 'Products', color: '#cba6f7' },
  { to: '/orders', icon: ClipboardList, label: 'Orders', color: '#f9e2af' },
  { to: '/customers', icon: Users, label: 'Customers', color: '#f5c2e7' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#94e2d5' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--bg-crust)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 65,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-mauve))',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={18} color="#11111b" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                  ProPOS
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-subtext)', letterSpacing: '1px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>
                  {user?.business_name?.slice(0, 12) || 'Business'}
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-mauve))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#11111b" strokeWidth={2.5} />
            </div>
          )}
          {!collapsed && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCollapsed(true)}>
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCollapsed(false)}>
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label, color }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.75rem' : '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'rgba(137, 180, 250, 0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(137, 180, 250, 0.25)' : 'transparent'}`,
                color: isActive ? 'var(--text-primary)' : 'var(--text-subtext)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? color : undefined} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: color }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {!collapsed && (
            <div style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface0)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}>
              <div style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-mauve))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--bg-crust)',
                flexShrink: 0,
              }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-subtext)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.75rem' : '0.5rem 0.75rem',
              color: 'var(--accent-red)',
              gap: '0.625rem',
            }}
          >
            <LogOut size={16} />
            {!collapsed && <span style={{ fontSize: 13 }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 65,
          background: 'var(--bg-mantle)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-subtext)' }}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(166, 227, 161, 0.1)',
              border: '1px solid rgba(166, 227, 161, 0.2)',
              fontSize: 11,
              color: 'var(--accent-green)',
              fontFamily: 'DM Mono, monospace',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 2s infinite' }} />
              {user?.currency || 'KES'} · Live
            </span>

            <button className="btn btn-ghost btn-icon">
              <Bell size={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
