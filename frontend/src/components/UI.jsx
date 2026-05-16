import React from 'react';

export const STATUS_COLORS = {
  New:               { bg: '#fef3e2', color: '#b35c00', border: '#f5c07a' },
  Processing:        { bg: '#e3f0fb', color: '#1a5e8c', border: '#a3cce8' },
  Packed:            { bg: '#e8f5fd', color: '#1a6a8c', border: '#7ec8e3' },
  'Out for Delivery':{ bg: '#f0e8fb', color: '#6435a8', border: '#c3a8e8' },
  Delivered:         { bg: '#d8f3dc', color: '#2d6a4f', border: '#95d5b2' },
  Cancelled:         { bg: '#fce8e6', color: '#c0392b', border: '#f5a9a3' },
  Paid:              { bg: '#d8f3dc', color: '#2d6a4f', border: '#95d5b2' },
  Issued:            { bg: '#fef3e2', color: '#b35c00', border: '#f5c07a' },
  Partial:           { bg: '#e3f0fb', color: '#1a5e8c', border: '#a3cce8' },
  Overdue:           { bg: '#fce8e6', color: '#c0392b', border: '#f5a9a3' },
  Pending:           { bg: '#fef3e2', color: '#b35c00', border: '#f5c07a' },
};

export function Badge({ status, label, size = 'md' }) {
  const styles = STATUS_COLORS[status] || { bg: '#f0f0f0', color: '#555', border: '#ccc' };
  const pad = size === 'sm' ? '2px 7px' : '4px 10px';
  const fs = size === 'sm' ? '11px' : '12px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: pad, borderRadius: 20, fontSize: fs, fontWeight: 500,
      background: styles.bg, color: styles.color,
      border: `1px solid ${styles.border}`, whiteSpace: 'nowrap',
    }}>
      {label || status}
    </span>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1px solid transparent', borderRadius: 8,
    fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', opacity: disabled ? 0.6 : 1,
    padding: size === 'sm' ? '5px 12px' : size === 'lg' ? '10px 22px' : '7px 16px',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px',
  };
  const variants = {
    primary:  { background: '#2d6a4f', color: '#fff', borderColor: '#2d6a4f' },
    outline:  { background: 'transparent', color: '#2d6a4f', borderColor: '#52b788' },
    danger:   { background: '#c0392b', color: '#fff', borderColor: '#c0392b' },
    amber:    { background: '#e76f51', color: '#fff', borderColor: '#e76f51' },
    ghost:    { background: 'transparent', color: '#6b8f71', borderColor: 'transparent' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: '#fff', border: '1px solid #ddeae0',
      borderRadius: 10, boxShadow: '0 1px 3px rgba(45,106,79,0.08)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, actions, border = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', borderBottom: border ? '1px solid #ddeae0' : 'none',
    }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#1a2e22' }}>{title}</span>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, color = '#2d6a4f', icon }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ddeae0', borderRadius: 10,
      padding: '16px 18px', boxShadow: '0 1px 3px rgba(45,106,79,0.08)',
    }}>
      <div style={{ fontSize: 11, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b8f71', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Table({ columns, data, onRow, emptyMsg = 'No data found.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{
                textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600,
                color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.06em',
                borderBottom: '2px solid #ddeae0', whiteSpace: 'nowrap',
                width: c.width,
              }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: '32px 14px', textAlign: 'center', color: '#6b8f71', fontSize: 13 }}>{emptyMsg}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row._id || row.id || i}
              onClick={() => onRow && onRow(row)}
              style={{ cursor: onRow ? 'pointer' : 'default', transition: 'background .1s' }}
              onMouseEnter={e => onRow && (e.currentTarget.style.background = '#f5faf6')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '10px 14px', borderBottom: '1px solid #eef4f0', fontSize: 13, verticalAlign: 'middle' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormGroup({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#c0392b', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', min, max, step, required, disabled, style = {} }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      min={min} max={max} step={step} required={required} disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7,
        fontSize: 13, fontFamily: 'inherit', background: disabled ? '#f5f5f5' : '#fff',
        color: '#1a2e22', outline: 'none', transition: 'border-color .15s', ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#52b788'}
      onBlur={e => e.target.style.borderColor = '#ddeae0'}
    />
  );
}

export function Select({ value, onChange, children, disabled, style = {} }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7,
        fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#1a2e22',
        outline: 'none', cursor: 'pointer', ...style,
      }}>
      {children}
    </select>
  );
}

export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: width,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #ddeae0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#6b8f71', cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #ddeae0',
        borderTopColor: '#2d6a4f', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const styles = {
    info:    { bg: '#e3f0fb', color: '#1a5e8c', border: '#a3cce8', icon: 'ℹ' },
    success: { bg: '#d8f3dc', color: '#2d6a4f', border: '#95d5b2', icon: '✓' },
    warning: { bg: '#fef3e2', color: '#b35c00', border: '#f5c07a', icon: '⚠' },
    danger:  { bg: '#fce8e6', color: '#c0392b', border: '#f5a9a3', icon: '✕' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 13, marginBottom: 12 }}>
      <span>{s.icon}</span><span>{children}</span>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = '#52b788' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height: 6, background: '#e8f0ea', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  );
}

export function formatCurrency(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }
export function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
export function formatDateTime(d) { return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
