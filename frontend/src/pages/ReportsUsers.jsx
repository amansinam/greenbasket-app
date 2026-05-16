import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { PageLayout } from '../components/Layout';
import { StatCard, Card, CardHeader, Table, Btn, Spinner, Alert, formatCurrency, FormGroup, Modal, Input, Select } from '../components/UI';
import api from '../utils/api';

/* ===================== REPORTS ===================== */
export function Reports() {
  const [salesData, setSalesData] = useState(null);
  const [invData, setInvData] = useState(null);
  const [custData, setCustData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sales');

  useEffect(() => {
    Promise.all([
      api.get('/reports/sales'),
      api.get('/reports/inventory'),
      api.get('/reports/customers'),
    ]).then(([s, i, c]) => {
      setSalesData(s.data.data);
      setInvData(i.data.data);
      setCustData(c.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const TABS = [{ id: 'sales', label: '📈 Sales' }, { id: 'inventory', label: '🗄️ Inventory' }, { id: 'customers', label: '🏪 Customers' }, { id: 'delivery', label: '🚚 Delivery' }];

  const exportCSV = (data, filename) => {
    if (!data?.length) return toast.error('No data to export');
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename; a.click();
    toast.success('CSV exported!');
  };

  return (
    <PageLayout title="Reports & Analytics">
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #ddeae0', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 18px', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#2d6a4f' : '#6b8f71', borderBottom: `2px solid ${tab === t.id ? '#2d6a4f' : 'transparent'}`, marginBottom: -2, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {tab === 'sales' && salesData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Revenue" value={formatCurrency(salesData.summary.totalRevenue)} color="#2d6a4f" />
                <StatCard label="Delivered Orders" value={salesData.summary.totalOrders} />
                <StatCard label="Avg Order Value" value={formatCurrency(salesData.summary.avgOrderValue)} color="#457b9d" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
                <Card>
                  <CardHeader title="Daily Revenue" actions={<Btn size="sm" variant="outline" onClick={() => exportCSV(salesData.byDay, 'daily_revenue.csv')}>Export CSV</Btn>} />
                  <div style={{ padding: '16px 12px' }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={salesData.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef4f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b8f71' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b8f71' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="revenue" fill="#52b788" radius={[4,4,0,0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="By Customer Type" />
                  <div style={{ padding: 16 }}>
                    {salesData.byCustomerType.map(t => (
                      <div key={t.type} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{t.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#2d6a4f' }}>{formatCurrency(t.revenue)}</span>
                        </div>
                        <div style={{ height: 6, background: '#e8f0ea', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${Math.round(t.revenue / salesData.summary.totalRevenue * 100)}%`, background: '#52b788', borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#6b8f71', marginTop: 2 }}>{t.orders} orders</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'inventory' && invData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Products" value={invData.summary.length} />
                <StatCard label="Total Stock Value" value={formatCurrency(invData.totalValue)} color="#457b9d" />
                <StatCard label="Low Stock Items" value={invData.lowStockCount} color={invData.lowStockCount > 0 ? '#c0392b' : '#2d6a4f'} />
              </div>
              <Card>
                <CardHeader title="Inventory Summary" actions={<Btn size="sm" variant="outline" onClick={() => exportCSV(invData.summary, 'inventory.csv')}>Export CSV</Btn>} />
                <Table columns={[
                  { key: 'name', label: 'Product', render: v => <strong>{v}</strong> },
                  { key: 'category', label: 'Category' },
                  { key: 'stock', label: 'In Stock' },
                  { key: 'reserved', label: 'Reserved', render: v => <span style={{ color: '#e76f51' }}>{v}</span> },
                  { key: 'available', label: 'Available', render: (v, r) => <span style={{ fontWeight: 600, color: r.isLow ? '#c0392b' : '#2d6a4f' }}>{v}</span> },
                  { key: 'stockValue', label: 'Stock Value', render: v => formatCurrency(v) },
                  { key: 'isLow', label: 'Alert', render: v => v ? <span style={{ color: '#c0392b', fontSize: 12, fontWeight: 600 }}>⚠ LOW</span> : <span style={{ color: '#52b788', fontSize: 12 }}>✓ OK</span> },
                ]} data={invData.summary} emptyMsg="No inventory data." />
              </Card>
            </>
          )}

          {tab === 'customers' && custData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Customers" value={custData.length} />
                <StatCard label="Total Revenue" value={formatCurrency(custData.reduce((s,c)=>s+c.totalRevenue,0))} color="#2d6a4f" />
                <StatCard label="With Balance" value={custData.filter(c=>c.outstandingBalance>0).length} color="#c0392b" />
                <StatCard label="Total Orders" value={custData.reduce((s,c)=>s+c.totalOrders,0)} />
              </div>
              <Card>
                <CardHeader title="Top Customers" actions={<Btn size="sm" variant="outline" onClick={() => exportCSV(custData, 'customers.csv')}>Export CSV</Btn>} />
                <Table columns={[
                  { key: 'name', label: 'Customer', render: v => <strong>{v}</strong> },
                  { key: 'type', label: 'Type' },
                  { key: 'city', label: 'City' },
                  { key: 'totalOrders', label: 'Total Orders', render: v => <strong style={{ color: '#2d6a4f' }}>{v}</strong> },
                  { key: 'deliveredOrders', label: 'Delivered' },
                  { key: 'totalRevenue', label: 'Revenue', render: v => <strong>{formatCurrency(v)}</strong> },
                  { key: 'outstandingBalance', label: 'Outstanding', render: v => <span style={{ color: v>0?'#c0392b':'#52b788', fontWeight: 600 }}>{v>0?formatCurrency(v):'Clear'}</span> },
                ]} data={custData} emptyMsg="No customer data." />
              </Card>
            </>
          )}

          {tab === 'delivery' && (
            <DeliveryReport />
          )}
        </>
      )}
    </PageLayout>
  );
}

function DeliveryReport() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/reports/delivery').then(r => setData(r.data.data)).catch(() => {});
  }, []);
  if (!data) return <Spinner />;
  return (
    <>
      <StatCard label="Total Delivered" value={data.totalDelivered} style={{ marginBottom: 16 }} />
      <Card>
        <CardHeader title="Deliveries by Driver" />
        <Table columns={[
          { key: 'driver', label: 'Driver', render: v => <strong>{v}</strong> },
          { key: 'deliveries', label: 'Deliveries', render: v => <strong style={{ color: '#2d6a4f' }}>{v}</strong> },
          { key: 'revenue', label: 'Revenue', render: v => formatCurrency(v) },
        ]} data={data.byDriver} emptyMsg="No delivery data." />
      </Card>
    </>
  );
}

/* ===================== USERS ===================== */
export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    api.get('/users').then(r => { setUsers(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleActive = async (id, active) => {
    await api.put(`/users/${id}`, { active: !active });
    toast.success(active ? 'User deactivated' : 'User activated');
    load();
  };

  const ROLE_LABELS = { director:'Director', sales:'Sales', warehouse_supervisor:'WH Supervisor', warehouse_worker:'WH Worker', driver:'Driver', accounting:'Accounting', customer:'Customer' };

  return (
    <PageLayout title="User Management">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn onClick={() => setShowAdd(true)}>+ Add User</Btn>
      </div>
      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: 'name', label: 'Name', render: v => <strong>{v}</strong> },
              { key: 'email', label: 'Email', render: v => <span style={{ color: '#457b9d' }}>{v}</span> },
              { key: 'role', label: 'Role', render: v => <span style={{ background: '#d8f3dc', color: '#2d6a4f', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>{ROLE_LABELS[v]||v}</span> },
              { key: 'phone', label: 'Phone' },
              { key: 'vehicleNumber', label: 'Vehicle' },
              { key: 'active', label: 'Status', render: v => <span style={{ color: v ? '#52b788' : '#c0392b', fontWeight: 600, fontSize: 12 }}>{v ? '● Active' : '○ Inactive'}</span> },
              { key: '_id', label: 'Actions', render: (_, row) => (
                <Btn size="sm" variant={row.active ? 'danger' : 'outline'} onClick={() => toggleActive(row._id, row.active)}>
                  {row.active ? 'Deactivate' : 'Activate'}
                </Btn>
              )},
            ]}
            data={users}
            emptyMsg="No users found."
          />
        )}
      </Card>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onRefresh={() => { setShowAdd(false); load(); }} />}
    </PageLayout>
  );
}

function AddUserModal({ onClose, onRefresh }) {
  const [form, setForm] = useState({ name:'', email:'', password:'password123', role:'sales', phone:'', vehicleNumber:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title="Add New User" onClose={onClose} width={460}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Name" required><Input value={form.name} onChange={e => set('name',e.target.value)} /></FormGroup>
          <FormGroup label="Email" required><Input type="email" value={form.email} onChange={e => set('email',e.target.value)} /></FormGroup>
          <FormGroup label="Password" required><Input value={form.password} onChange={e => set('password',e.target.value)} /></FormGroup>
          <FormGroup label="Role"><Select value={form.role} onChange={e => set('role',e.target.value)}>
            {[['director','Director'],['sales','Sales'],['warehouse_supervisor','WH Supervisor'],['warehouse_worker','WH Worker'],['driver','Driver'],['accounting','Accounting'],['customer','Customer']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </Select></FormGroup>
          <FormGroup label="Phone"><Input value={form.phone} onChange={e => set('phone',e.target.value)} /></FormGroup>
          <FormGroup label="Vehicle No."><Input value={form.vehicleNumber} onChange={e => set('vehicleNumber',e.target.value)} /></FormGroup>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create User'}</Btn>
        </div>
      </form>
    </Modal>
  );
}


