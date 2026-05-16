import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const QUICK_LOGINS = [
  { label: 'Director',    email: 'director@greenbasket.com',   icon: '📊' },
  { label: 'Sales',       email: 'sales@greenbasket.com',       icon: '📦' },
  { label: 'WH Supervisor', email: 'wsup@greenbasket.com',      icon: '🗄️' },
  { label: 'WH Worker',   email: 'worker@greenbasket.com',      icon: '📋' },
  { label: 'Driver',      email: 'driver1@greenbasket.com',     icon: '🚚' },
  { label: 'Accounting',  email: 'accounting@greenbasket.com',  icon: '💰' },
  { label: 'Customer',    email: 'customer1@greenbasket.com',   icon: '🏪' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('director@greenbasket.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'warehouse_worker') navigate('/warehouse');
      else if (user.role === 'driver') navigate('/my-deliveries');
      else if (user.role === 'customer') navigate('/my-orders');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', color: '#fff' }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            GreenBasket<br />Distribution
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 40 }}>
            Centralized operations management for orders, inventory, warehouse, delivery, and accounting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['📦 Real-time order tracking', '🗄️ Live inventory management', '🚚 Driver delivery confirmation', '💰 Automated invoice generation', '📊 Management dashboards'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 460, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 44px', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a2e22', marginBottom: 6 }}>Sign in</h2>
        <p style={{ fontSize: 13, color: '#6b8f71', marginBottom: 28 }}>Access the GreenBasket platform</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddeae0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#52b788'}
              onBlur={e => e.target.style.borderColor = '#ddeae0'} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddeae0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#52b788'}
              onBlur={e => e.target.style.borderColor = '#ddeae0'} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '24px 0 12px', position: 'relative', textAlign: 'center' }}>
          <div style={{ height: 1, background: '#ddeae0' }} />
          <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: 11, color: '#6b8f71' }}>QUICK LOGIN</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {QUICK_LOGINS.map(q => (
            <button key={q.email} onClick={() => { setEmail(q.email); setPassword('password123'); }}
              style={{ padding: '6px 4px', background: '#f5faf6', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 11, color: '#2d6a4f', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', fontWeight: 500 }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{q.icon}</div>
              {q.label}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 11, color: '#aaa', textAlign: 'center' }}>All accounts use password: <strong>password123</strong></p>
      </div>
    </div>
  );
}
