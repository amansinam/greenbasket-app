import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageLayout } from '../components/Layout';
import { Badge, Btn, Card, CardHeader, Table, Modal, FormGroup, Input, Select, Spinner, Alert, formatCurrency, formatDate, formatDateTime } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUSES = ['All', 'New', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function Orders({ openCreate = false }) {
  const { can, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [showCreate, setShowCreate] = useState(openCreate);

  useEffect(() => {
    if (openCreate) setShowCreate(true);
  }, [openCreate]);

  const handleCloseCreate = () => {
    setShowCreate(false);
    if (window.location.pathname === '/new-order') {
       navigate('/my-orders');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o =>
    !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleProcess = async id => {
    try {
      await api.put(`/orders/${id}/process`);
      toast.success('Order moved to Processing');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCancel = async id => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleRepeat = async id => {
    try {
      await api.post(`/orders/${id}/repeat`);
      toast.success('Repeat order created');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const cols = [
    { key: 'orderId', label: 'Order ID', render: v => <span style={{ fontWeight: 700, color: '#2d6a4f' }}>{v}</span> },
    { key: 'customer', label: 'Customer', render: v => v?.name || '—' },
    { key: 'createdAt', label: 'Date', render: v => formatDate(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'totalAmount', label: 'Total', render: v => <strong>{formatCurrency(v)}</strong> },
    { key: 'assignedDriver', label: 'Driver', render: v => v?.name || <span style={{ color: '#6b8f71' }}>—</span> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <div style={{ display: 'flex', gap: 5 }}>
        <Btn size="sm" variant="outline" onClick={e => { e.stopPropagation(); setViewOrder(row); }}>View</Btn>
        {row.status === 'New' && can('director','sales','warehouse_supervisor') && (
          <Btn size="sm" onClick={e => { e.stopPropagation(); handleProcess(row._id); }}>Process</Btn>
        )}
        {['Delivered','Cancelled'].includes(row.status) && (
          <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleRepeat(row._id); }}>Repeat</Btn>
        )}
        {!['Delivered','Cancelled'].includes(row.status) && can('director','sales') && (
          <Btn size="sm" variant="danger" onClick={e => { e.stopPropagation(); handleCancel(row._id); }}>Cancel</Btn>
        )}
      </div>
    )},
  ];

  return (
    <PageLayout title="Order Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 300 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer…"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#52b788'} onBlur={e => e.target.style.borderColor = '#ddeae0'} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {can('director','sales','customer') && (
          <Btn onClick={() => setShowCreate(true)}>+ New Order</Btn>
        )}
      </div>

      {/* Status quick filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', fontWeight: filter===s?600:400,
              background: filter===s ? '#2d6a4f' : '#f5faf6', color: filter===s ? '#fff' : '#6b8f71', border: `1px solid ${filter===s?'#2d6a4f':'#ddeae0'}` }}>
            {s}
          </button>
        ))}
      </div>

      <Card>
        {loading ? <Spinner /> : <Table columns={cols} data={filtered} onRow={row => setViewOrder(row)} emptyMsg="No orders match your filter." />}
      </Card>

      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} onRefresh={() => { setViewOrder(null); load(); }} />}
      {showCreate && <CreateOrderModal onClose={handleCloseCreate} onRefresh={() => { handleCloseCreate(); load(); }} />}
    </PageLayout>
  );
}

function OrderDetailModal({ order, onClose, onRefresh }) {
  const { can } = useAuth();
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${order._id}`).then(r => { setFull(r.data.data); setLoading(false); });
  }, [order._id]);

  if (loading) return <Modal title={order.orderId} onClose={onClose}><Spinner /></Modal>;

  const o = full || order;
  const TIMELINE = [
    { label: 'Order Created', date: o.createdAt, always: true },
    { label: 'Processing Started', date: o.status !== 'New' ? o.updatedAt : null },
    { label: 'Packed', date: o.packedAt },
    { label: 'Dispatched', date: o.dispatchedAt, extra: o.assignedDriver?.name },
    { label: 'Delivered', date: o.deliveredAt, extra: o.receivedBy },
  ];

  return (
    <Modal title={`Order ${o.orderId}`} onClose={onClose} width={600}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Customer', v: o.customer?.name },
          { l: 'Status', v: <Badge status={o.status} /> },
          { l: 'Date', v: formatDate(o.createdAt) },
          { l: 'Driver', v: o.assignedDriver?.name || 'Not assigned' },
          { l: 'Payment', v: o.paymentMode },
          { l: 'Total', v: <strong style={{ color: '#2d6a4f' }}>{formatCurrency(o.totalAmount)}</strong> },
        ].map(({ l, v }) => (
          <div key={l} style={{ background: '#f5faf6', padding: '10px 14px', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b8f71', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Items</div>
        {o.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f5faf6', borderRadius: 7, marginBottom: 6 }}>
            <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{item.productName || item.product?.name}</span>
            <span style={{ fontSize: 12, color: '#6b8f71' }}>{item.quantityOrdered} {item.unit}</span>
            {item.quantityDelivered != null && item.quantityDelivered !== item.quantityOrdered && (
              <span style={{ fontSize: 11, color: '#e76f51' }}>Delivered: {item.quantityDelivered}</span>
            )}
            <span style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(item.pricePerUnit * item.quantityOrdered)}</span>
            {item.isPacked && <span style={{ color: '#52b788', fontSize: 12 }}>✓</span>}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <div style={{ background: '#d8f3dc', padding: '10px 18px', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: '#2d6a4f' }}>Total: </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#2d6a4f' }}>{formatCurrency(o.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Timeline</div>
        {TIMELINE.filter(t => t.date || t.always).map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, position: 'relative' }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.date ? '#52b788' : '#ddeae0', border: `2px solid ${t.date ? '#2d6a4f' : '#c5d9c9'}` }} />
              {i < TIMELINE.filter(t2 => t2.date || t2.always).length - 1 && (
                <div style={{ width: 2, height: 20, background: '#ddeae0', margin: '2px auto 0' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.date ? '#1a2e22' : '#aaa' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#6b8f71' }}>
                {t.date ? formatDateTime(t.date) : 'Pending'}
                {t.extra && ` · ${t.extra}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {o.notes && <Alert type="info">Note: {o.notes}</Alert>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #ddeae0' }}>
        {o.status === 'New' && can('director','sales','warehouse_supervisor') && (
          <Btn onClick={async () => { await api.put(`/orders/${o._id}/process`); toast.success('Moved to Processing'); onRefresh(); }}>Process</Btn>
        )}
        <Btn variant="outline" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

function CreateOrderModal({ onClose, onRefresh }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, pricePerUnit: 0 }]);
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/customers'), api.get('/products')]).then(([c, p]) => {
      setCustomers(c.data.data);
      setProducts(p.data.data);
      if (c.data.data.length) setCustomerId(c.data.data[0]._id);
    });
  }, []);

  const setItemField = (i, field, value) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) next[i].pricePerUnit = prod.pricePerUnit;
    }
    setItems(next);
  };

  const total = items.reduce((s, i) => s + (i.quantity || 0) * (i.pricePerUnit || 0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!customerId) return toast.error('Select a customer');
    if (!items[0].productId) return toast.error('Add at least one item');
    setLoading(true);
    try {
      await api.post('/orders', { customerId, items: items.filter(i => i.productId), notes, paymentMode });
      toast.success('Order created successfully!');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating order'); }
    setLoading(false);
  };

  return (
    <Modal title="Create New Order" onClose={onClose} width={580}>
      <form onSubmit={handleSubmit}>
        {user?.role !== 'customer' && (
          <FormGroup label="Customer" required>
            <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} — {c.city}</option>)}
            </Select>
          </FormGroup>
        )}
        
        {user?.role === 'customer' && customers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#6b8f71', display: 'block', marginBottom: 4 }}>Ordering for Business:</span>
            <div style={{ padding: '10px 14px', background: '#eef4f0', borderRadius: 8, fontWeight: 600 }}>{customers[0].name}</div>
          </div>
        )}
        {user?.role === 'customer' && customers.length === 0 && (
          <Alert type="danger">Your customer profile is not properly linked. Cannot create order yet.</Alert>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Order Items *</div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select value={item.productId} onChange={e => setItemField(i, 'productId', e.target.value)}
                style={{ flex: 2, padding: '8px 10px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} — ₹{p.pricePerUnit}/{p.unit} ({p.availableStock} avail)</option>)}
              </select>
              <input type="number" min="1" value={item.quantity} onChange={e => setItemField(i, 'quantity', Number(e.target.value))}
                placeholder="Qty" style={{ width: 70, padding: '8px 10px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
              <input type="number" min="0" value={item.pricePerUnit} onChange={e => setItemField(i, 'pricePerUnit', Number(e.target.value))}
                placeholder="₹ Rate" style={{ width: 90, padding: '8px 10px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
              <span style={{ fontSize: 12, color: '#2d6a4f', fontWeight: 600, minWidth: 70, textAlign: 'right' }}>{formatCurrency(item.quantity * item.pricePerUnit)}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
                  style={{ background: '#fce8e6', border: 'none', borderRadius: 6, color: '#c0392b', padding: '6px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              )}
            </div>
          ))}
          <Btn variant="outline" size="sm" type="button" onClick={() => setItems([...items, { productId: '', quantity: 1, pricePerUnit: 0 }])}>+ Add Item</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Payment Mode">
            <Select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              {['Cash','UPI','Credit','Bank Transfer'].map(m => <option key={m}>{m}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </FormGroup>
        </div>

        <div style={{ background: '#d8f3dc', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#2d6a4f', fontWeight: 600 }}>Order Total</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
