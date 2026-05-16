import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { PageLayout } from '../components/Layout';
import { StatCard, Card, CardHeader, Badge, Btn, Spinner, formatCurrency, formatDateTime } from '../components/UI';
import api from '../utils/api';

const PIE_COLORS = { New: '#f4a261', Processing: '#457b9d', Packed: '#74b3ce', 'Out for Delivery': '#9b72cf', Delivered: '#52b788' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <PageLayout title="Dashboard"><Spinner /></PageLayout>;
  if (!data) return <PageLayout title="Dashboard"><div style={{ color: '#c0392b' }}>Failed to load dashboard.</div></PageLayout>;

  const { stats, weeklyData, orderStatusBreakdown, lowStockProducts, recentOrders } = data;
  const pieData = Object.entries(orderStatusBreakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <PageLayout title="Dashboard">
      {/* Low stock alert */}
      {stats.lowStockCount > 0 && (
        <div style={{ background: '#fef3e2', border: '1px solid #f5c07a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b35c00', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠ <strong>{stats.lowStockCount} product(s)</strong> are running low on stock —{' '}
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/inventory')}>view inventory</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Today's Orders" value={stats.todayOrders} sub={`${stats.totalOrders} total`} />
        <StatCard label="Out for Delivery" value={stats.outForDelivery} sub={`${stats.packedOrders} packed`} color="#e76f51" />
        <StatCard label="Revenue Collected" value={formatCurrency(stats.totalRevenue)} sub="From delivered orders" color="#457b9d" />
        <StatCard label="Pending Invoices" value={formatCurrency(stats.pendingInvoiceAmount)} sub="Outstanding" color={stats.pendingInvoiceAmount > 0 ? '#c0392b' : '#2d6a4f'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Processing" value={stats.processingOrders} color="#457b9d" />
        <StatCard label="Delivered Today" value={stats.deliveredToday} color="#52b788" />
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Total Products" value={stats.totalProducts} sub={`${stats.lowStockCount} low stock`} color={stats.lowStockCount > 0 ? '#c0392b' : '#2d6a4f'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Orders This Week" />
          <div style={{ padding: '16px 12px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b8f71' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b8f71' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ddeae0' }} />
                <Bar dataKey="count" fill="#52b788" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Order Status" />
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Orders + Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Recent Orders"
            actions={<Btn variant="outline" size="sm" onClick={() => navigate('/orders')}>View All</Btn>} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Status', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 11, color: '#6b8f71', textAlign: 'left', borderBottom: '1px solid #ddeae0', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentOrders || []).map(o => (
                <tr key={o._id} style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/orders')}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5faf6'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#2d6a4f', borderBottom: '1px solid #eef4f0' }}>{o.orderId}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #eef4f0' }}>{o.customer?.name}</td>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid #eef4f0' }}><Badge status={o.status} /></td>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #eef4f0' }}>{formatCurrency(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Low Stock Alerts"
            actions={<Btn variant="outline" size="sm" onClick={() => navigate('/inventory')}>Manage</Btn>} />
          <div style={{ padding: '8px 0' }}>
            {lowStockProducts?.length === 0 ? (
              <div style={{ padding: '20px 18px', color: '#6b8f71', fontSize: 13, textAlign: 'center' }}>✓ All products sufficiently stocked</div>
            ) : lowStockProducts?.map(p => {
              const avail = p.stock - p.reservedStock;
              const pct = Math.round(avail / Math.max(p.stock, 1) * 100);
              return (
                <div key={p._id} style={{ padding: '10px 18px', borderBottom: '1px solid #eef4f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 600 }}>{avail} {p.unit}</span>
                  </div>
                  <div style={{ height: 5, background: '#e8f0ea', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct < 20 ? '#c0392b' : '#e76f51', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#6b8f71', marginTop: 3 }}>Min: {p.minStockLevel} {p.unit}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
