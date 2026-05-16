import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_NAV = {
  director: [
    { to: '/',           icon: '📊', label: 'Dashboard' },
    { to: '/orders',     icon: '📦', label: 'Orders' },
    { to: '/inventory',  icon: '🗄️',  label: 'Inventory' },
    { to: '/warehouse',  icon: '📋', label: 'Warehouse' },
    { to: '/delivery',   icon: '🚚', label: 'Delivery' },
    { to: '/accounting', icon: '💰', label: 'Accounting' },
    { to: '/customers',  icon: '🏪', label: 'Customers' },
    { to: '/reports',    icon: '📈', label: 'Reports' },
    { to: '/users',      icon: '👥', label: 'Users' },
  ],
  sales: [
    { to: '/',          icon: '📊', label: 'Dashboard' },
    { to: '/orders',    icon: '📦', label: 'Orders' },
    { to: '/customers', icon: '🏪', label: 'Customers' },
    { to: '/inventory', icon: '🗄️',  label: 'Inventory' },
  ],
  warehouse_supervisor: [
    { to: '/',          icon: '📊', label: 'Dashboard' },
    { to: '/inventory', icon: '🗄️',  label: 'Inventory' },
    { to: '/warehouse', icon: '📋', label: 'Warehouse' },
    { to: '/orders',    icon: '📦', label: 'Orders' },
  ],
  warehouse_worker: [
    { to: '/warehouse', icon: '📋', label: 'Packing Queue' },
  ],
  driver: [
    { to: '/my-deliveries', icon: '🚚', label: 'My Deliveries' },
  ],
  accounting: [
    { to: '/',           icon: '📊', label: 'Dashboard' },
    { to: '/accounting', icon: '💰', label: 'Accounting' },
    { to: '/orders',     icon: '📦', label: 'Orders' },
    { to: '/reports',    icon: '📈', label: 'Reports' },
  ],
  customer: [
    { to: '/my-orders', icon: '📦', label: 'My Orders' },
    { to: '/new-order', icon: '➕', label: 'New Order' },
  ],
};

const ROLE_LABELS = {
  director: 'Operations Director', sales: 'Sales Staff',
  warehouse_supervisor: 'Warehouse Supervisor', warehouse_worker: 'Warehouse Worker',
  driver: 'Delivery Driver', accounting: 'Accounting Team', customer: 'Customer',
};

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const nav = ROLE_NAV[user?.role] || ROLE_NAV.sales;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'GB';

  return (
    <aside style={{
      width: collapsed ? 64 : 220, flexShrink: 0, background: '#1b4332',
      display: 'flex', flexDirection: 'column', transition: 'width .2s', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: '#fff', fontWeight: 700 }}>🌿 GreenBasket</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Distribution Management</div>
          </div>
        )}
        {collapsed && <span style={{ fontSize: 22 }}>🌿</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)',
          borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: 13, flexShrink: 0,
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div style={{ margin: '10px 10px 4px', padding: '9px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#52b788', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 16px', justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #52b788' : '3px solid transparent',
              transition: 'all .15s', textDecoration: 'none',
            })}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: 10 }}>
        <button onClick={logout} style={{
          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)', borderRadius: 7, padding: collapsed ? '8px 0' : '8px 12px',
          fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8,
        }}>
          <span>🚪</span>{!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}

export function TopBar({ title }) {
  const now = new Date();
  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid #ddeae0', padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#2d6a4f' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#6b8f71' }}>
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#52b788' }} />
          <span style={{ fontSize: 11, color: '#2d6a4f', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>
    </header>
  );
}

export function PageLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f5faf6' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
