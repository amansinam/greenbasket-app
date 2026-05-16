import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageLayout } from '../components/Layout';
import { StatCard, Card, CardHeader, Badge, Btn, Table, Modal, FormGroup, Input, Select, Spinner, Alert, ProgressBar, formatCurrency, formatDateTime } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ===================== WAREHOUSE ===================== */
export function Warehouse() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/warehouse/packing-queue'); setQueue(r.data.data); }
    catch { toast.error('Failed to load packing queue'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleItem = async (orderId, productId, isPacked) => {
    try { await api.put(`/orders/${orderId}/pack-item`, { productId, isPacked }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const markAllPacked = async orderId => {
    try { await api.put(`/orders/${orderId}/packed`); toast.success('Order marked as Packed!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const processing = queue.filter(o => o.status === 'Processing');
  const packed = queue.filter(o => o.status === 'Packed');

  return (
    <PageLayout title="Warehouse Operations">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="To Pack" value={processing.length} color="#e76f51" />
        <StatCard label="Packed & Ready" value={packed.length} color="#457b9d" />
        <StatCard label="Total Active" value={queue.length} />
      </div>

      {queue.length === 0 && !loading && (
        <Alert type="success">✓ No pending packing tasks. All orders are up to date!</Alert>
      )}

      {loading ? <Spinner /> : (
        <div style={{ maxWidth: user?.role === 'warehouse_worker' ? 480 : '100%', margin: '0 auto' }}>
          {queue.map(order => {
            const packedCount = order.items.filter(i => i.isPacked).length;
            const total = order.items.length;
            const pct = total ? Math.round(packedCount / total * 100) : 0;
            return (
              <Card key={order._id} style={{ marginBottom: 16 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #ddeae0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2d6a4f' }}>{order.orderId}</div>
                    <div style={{ fontSize: 12, color: '#6b8f71' }}>{order.customer?.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge status={order.status} />
                    <span style={{ fontSize: 12, color: '#6b8f71' }}>{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
                <div style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b8f71' }}>Packing progress</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? '#2d6a4f' : '#6b8f71' }}>{packedCount}/{total} items ({pct}%)</span>
                  </div>
                  <ProgressBar value={packedCount} max={total} color={pct === 100 ? '#2d6a4f' : '#52b788'} />

                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: item.isPacked ? '#d8f3dc' : '#f5faf6',
                        borderRadius: 8, border: `1px solid ${item.isPacked ? '#95d5b2' : '#ddeae0'}`, transition: 'all .15s',
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 500, textDecoration: item.isPacked ? 'line-through' : 'none', color: item.isPacked ? '#6b8f71' : '#1a2e22' }}>
                          {item.productName || item.product?.name}
                        </span>
                        <span style={{ fontSize: 13, color: '#6b8f71', margin: '0 12px' }}>{item.quantityOrdered} {item.unit || item.product?.unit}</span>
                        {order.status === 'Processing' && (
                          <button onClick={() => toggleItem(order._id, item.product?._id || item.product, !item.isPacked)}
                            style={{
                              width: 34, height: 34, borderRadius: 8, border: `2px solid ${item.isPacked ? '#2d6a4f' : '#ddeae0'}`,
                              background: item.isPacked ? '#2d6a4f' : '#fff', color: item.isPacked ? '#fff' : '#aaa',
                              cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{item.isPacked ? '✓' : ''}</button>
                        )}
                        {order.status === 'Packed' && <span style={{ color: '#2d6a4f', fontSize: 16 }}>✓</span>}
                      </div>
                    ))}
                  </div>

                  {pct === 100 && order.status === 'Processing' && (
                    <Btn style={{ width: '100%', marginTop: 14, justifyContent: 'center' }} onClick={() => markAllPacked(order._id)}>
                      ✓ Mark as Packed & Ready for Delivery
                    </Btn>
                  )}
                  {order.status === 'Packed' && (
                    <Alert type="success">✓ Order packed and ready for dispatch.</Alert>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}

/* ===================== DELIVERY ===================== */
export function Delivery() {
  const { can } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [packedOrders, setPackedOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, packed, active] = await Promise.all([
        api.get('/delivery/drivers'),
        api.get('/orders', { params: { status: 'Packed' } }),
        api.get('/orders', { params: { status: 'Out for Delivery' } }),
      ]);
      setDrivers(dr.data.data);
      setPackedOrders(packed.data.data);
      setActiveDeliveries(active.data.data);
    } catch { toast.error('Failed to load delivery data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignDriver = async (orderId, driverId) => {
    if (!driverId) return toast.error('Select a driver');
    try {
      await api.put(`/orders/${orderId}/assign-driver`, { driverId });
      toast.success('Driver assigned & order dispatched!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const deliveredToday = drivers.reduce((s, d) => s + d.completedToday, 0);

  return (
    <PageLayout title="Delivery Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Packed & Ready" value={packedOrders.length} color="#e76f51" />
        <StatCard label="Out for Delivery" value={activeDeliveries.length} color="#9b72cf" />
        <StatCard label="Active Drivers" value={drivers.filter(d => d.activeDeliveries > 0).length} color="#457b9d" />
        <StatCard label="Delivered Today" value={deliveredToday} color="#52b788" />
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Drivers panel */}
          <Card>
            <CardHeader title="Driver Status" />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drivers.map(d => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f5faf6', borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d8f3dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#2d6a4f', flexShrink: 0 }}>
                    {d.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: '#6b8f71' }}>{d.vehicleNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge status={d.activeDeliveries > 0 ? 'Out for Delivery' : 'Delivered'} label={d.activeDeliveries > 0 ? 'On Route' : 'Available'} />
                    <div style={{ fontSize: 11, color: '#6b8f71', marginTop: 3 }}>{d.activeDeliveries} active · {d.completedToday} done</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Assign panel */}
          <Card>
            <CardHeader title="Assign Deliveries" />
            <div style={{ padding: 16 }}>
              {packedOrders.length === 0 ? (
                <div style={{ color: '#6b8f71', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No packed orders waiting for assignment.</div>
              ) : packedOrders.map(o => (
                <AssignRow key={o._id} order={o} drivers={drivers.filter(d => d.activeDeliveries === 0)} onAssign={assignDriver} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Active deliveries table */}
      <Card>
        <CardHeader title="Active Deliveries" />
        <Table
          columns={[
            { key: 'orderId', label: 'Order ID', render: v => <strong style={{ color: '#2d6a4f' }}>{v}</strong> },
            { key: 'customer', label: 'Customer', render: v => v?.name },
            { key: 'assignedDriver', label: 'Driver', render: v => v?.name || '—' },
            { key: 'totalAmount', label: 'Amount', render: v => formatCurrency(v) },
            { key: 'dispatchedAt', label: 'Dispatched', render: v => formatDateTime(v) },
            { key: '_id', label: 'Actions', render: (_, row) => (
              <Btn size="sm" onClick={() => setConfirmOrder(row)}>Confirm Delivery</Btn>
            )},
          ]}
          data={activeDeliveries}
          emptyMsg="No active deliveries."
        />
      </Card>

      {confirmOrder && (
        <ConfirmDeliveryModal order={confirmOrder} onClose={() => setConfirmOrder(null)}
          onRefresh={() => { setConfirmOrder(null); load(); }} />
      )}
    </PageLayout>
  );
}

function AssignRow({ order, drivers, onAssign }) {
  const [driverId, setDriverId] = useState('');
  return (
    <div style={{ padding: '10px 12px', background: '#f5faf6', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#2d6a4f', fontSize: 13 }}>{order.orderId}</span>
        <span style={{ fontSize: 12, color: '#6b8f71' }}>{order.customer?.name}</span>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{formatCurrency(order.totalAmount)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={driverId} onChange={e => setDriverId(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
          <option value="">Select driver…</option>
          {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <Btn size="sm" onClick={() => onAssign(order._id, driverId)}>Assign</Btn>
      </div>
    </div>
  );
}

function ConfirmDeliveryModal({ order, onClose, onRefresh }) {
  const [receivedBy, setReceivedBy] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/orders/${order._id}/deliver`, { receivedBy, paymentMode, deliveryNotes: notes });
      toast.success('Delivery confirmed! Invoice generated.');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title={`Confirm Delivery — ${order.orderId}`} onClose={onClose} width={480}>
      <div style={{ background: '#f5faf6', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Customer: {order.customer?.name}</div>
        <div style={{ fontSize: 13, color: '#6b8f71' }}>Amount: {formatCurrency(order.totalAmount)}</div>
      </div>
      <form onSubmit={handleSubmit}>
        <FormGroup label="Received By (Customer Staff)" required>
          <Input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Name of person receiving delivery" />
        </FormGroup>
        <FormGroup label="Payment Mode">
          <Select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
            {['Cash','UPI','Credit','Bank Transfer'].map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Delivery Notes">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes or discrepancies…" />
        </FormGroup>
        <div style={{ background: '#f5faf6', border: '1px dashed #ddeae0', borderRadius: 8, padding: '14px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#6b8f71', marginBottom: 6 }}>Digital Signature</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Tap to collect customer signature</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Confirming…' : 'Confirm Delivery'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ===================== ACCOUNTING ===================== */
export function Accounting() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices');
  const [viewInvoice, setViewInvoice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cust] = await Promise.all([api.get('/invoices'), api.get('/customers')]);
      setInvoices(inv.data.data);
      setCustomers(cust.data.data);
    } catch { toast.error('Failed to load accounting data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (invId, amount) => {
    try {
      await api.put(`/invoices/${invId}/mark-paid`, { amount });
      toast.success('Invoice marked as paid');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const exportTally = async () => {
    try {
      const res = await api.get('/invoices/export/tally', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'tally_export.xml'; a.click();
      toast.success('Tally XML exported successfully!');
    } catch { toast.error('Export failed'); }
  };

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount - (i.paidAmount || 0), 0);
  const custWithBalance = customers.filter(c => c.outstandingBalance > 0);

  const TABS = [{ id: 'invoices', label: 'Invoices' }, { id: 'balances', label: 'Customer Balances' }, { id: 'tally', label: 'Tally Export' }];

  return (
    <PageLayout title="Accounting & Invoicing">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} color="#52b788" />
        <StatCard label="Pending/Outstanding" value={formatCurrency(totalPending)} color="#c0392b" />
        <StatCard label="Total Invoices" value={invoices.length} />
        <StatCard label="Customers with Balance" value={custWithBalance.length} color={custWithBalance.length > 0 ? '#e76f51' : '#2d6a4f'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #ddeae0', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 18px', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#2d6a4f' : '#6b8f71', borderBottom: `2px solid ${tab === t.id ? '#2d6a4f' : 'transparent'}`, marginBottom: -2, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {tab === 'invoices' && (
            <Card>
              <Table
                columns={[
                  { key: 'invoiceNumber', label: 'Invoice #', render: v => <strong style={{ color: '#2d6a4f' }}>{v}</strong> },
                  { key: 'order', label: 'Order', render: v => <span style={{ color: '#457b9d' }}>{v?.orderId}</span> },
                  { key: 'customer', label: 'Customer', render: v => v?.name },
                  { key: 'totalAmount', label: 'Total', render: v => <strong>{formatCurrency(v)}</strong> },
                  { key: 'paidAmount', label: 'Paid', render: v => formatCurrency(v || 0) },
                  { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
                  { key: 'createdAt', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
                  { key: '_id', label: 'Actions', render: (_, row) => (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Btn size="sm" variant="outline" onClick={() => setViewInvoice(row)}>View</Btn>
                      {row.status !== 'Paid' && <Btn size="sm" onClick={() => markPaid(row._id, row.totalAmount)}>Mark Paid</Btn>}
                    </div>
                  )},
                ]}
                data={invoices}
                emptyMsg="No invoices found."
              />
            </Card>
          )}

          {tab === 'balances' && (
            <Card>
              <Table
                columns={[
                  { key: 'name', label: 'Customer', render: v => <strong>{v}</strong> },
                  { key: 'type', label: 'Type' },
                  { key: 'city', label: 'City' },
                  { key: 'outstandingBalance', label: 'Outstanding', render: v => <strong style={{ color: v > 0 ? '#c0392b' : '#2d6a4f' }}>{formatCurrency(v)}</strong> },
                  { key: 'creditLimit', label: 'Credit Limit', render: v => formatCurrency(v) },
                ]}
                data={customers}
                emptyMsg="No customers."
              />
            </Card>
          )}

          {tab === 'tally' && (
            <Card>
              <div style={{ padding: 20 }}>
                <Alert type="success">✓ Tally integration configured. Ready to export.</Alert>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {[
                    { label: 'Export Invoices to Tally', desc: 'Export all paid invoices as Tally XML format' },
                    { label: 'Export Payment Receipts', desc: 'Export payment collection records' },
                    { label: 'Sync Ledger', desc: 'Sync outstanding balances with Tally' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f5faf6', borderRadius: 8, border: '1px solid #ddeae0' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#6b8f71', marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <Btn onClick={exportTally}>Export Now</Btn>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {viewInvoice && <InvoiceDetailModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} onPaid={id => { markPaid(id, viewInvoice.totalAmount); setViewInvoice(null); }} />}
    </PageLayout>
  );
}

function InvoiceDetailModal({ invoice, onClose, onPaid }) {
  return (
    <Modal title={`Invoice ${invoice.invoiceNumber}`} onClose={onClose} width={560}>
      <div style={{ background: 'linear-gradient(135deg,#d8f3dc,#fff)', padding: '16px 20px', borderRadius: 10, marginBottom: 20, border: '1px solid #95d5b2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>🌿 GreenBasket</div>
            <div style={{ fontSize: 11, color: '#6b8f71' }}>Distribution Pvt. Ltd.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: 12, color: '#6b8f71' }}>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
            <Badge status={invoice.status} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><div style={{ fontSize: 11, color: '#6b8f71' }}>Bill To</div><div style={{ fontWeight: 600 }}>{invoice.customer?.name}</div></div>
        <div><div style={{ fontSize: 11, color: '#6b8f71' }}>Order Ref</div><div style={{ fontWeight: 600 }}>{invoice.order?.orderId}</div></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead><tr>{['Item','Qty','Rate','Amount'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#6b8f71', borderBottom: '2px solid #ddeae0', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
        <tbody>
          {invoice.items?.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef4f0', fontWeight: 500 }}>{item.productName}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef4f0', color: '#6b8f71' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef4f0' }}>₹{item.pricePerUnit}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef4f0', fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ background: '#d8f3dc', padding: '12px 20px', borderRadius: 8, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#2d6a4f' }}>Total Amount</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2d6a4f' }}>{formatCurrency(invoice.totalAmount)}</div>
          {invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount && (
            <div style={{ fontSize: 12, color: '#6b8f71' }}>Paid: {formatCurrency(invoice.paidAmount)} · Outstanding: {formatCurrency(invoice.totalAmount - invoice.paidAmount)}</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {invoice.status !== 'Paid' && <Btn onClick={() => onPaid(invoice._id)}>Mark as Paid</Btn>}
        <Btn variant="outline" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

/* ===================== CUSTOMERS ===================== */
export function Customers() {
  const { can, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewCust, setViewCust] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/customers'); setCustomers(r.data.data); }
    catch { toast.error('Failed to load customers'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()));

  if (user?.role === 'customer') {
    if (loading) return <PageLayout title="My Account"><Spinner /></PageLayout>;
    const c = customers[0];
    if (!c) return <PageLayout title="My Account"><Alert type="info">Your profile is not linked to any active business account.</Alert></PageLayout>;
    return (
      <PageLayout title="My Account">
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ddeae0', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, color: '#2d6a4f', fontSize: 24 }}>{c.name}</h2>
              <div style={{ color: '#6b8f71', marginTop: 4 }}>Business Account Profile</div>
            </div>
            <span style={{ padding: '6px 14px', background: '#d8f3dc', color: '#2d6a4f', borderRadius: 20, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{c.type}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <div style={{ background: '#f5faf6', padding: '16px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#6b8f71', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.05em' }}>Contact Info</div>
              <div style={{ fontWeight: 600, marginTop: 8, fontSize: 15 }}>{c.phone}</div>
              <div style={{ color: '#6b8f71', fontSize: 13, marginTop: 2 }}>{c.email || 'No email provided'}</div>
              <div style={{ color: '#6b8f71', fontSize: 13, marginTop: 2 }}>Contact: {c.contactName || c.name}</div>
            </div>
            <div style={{ background: '#f5faf6', padding: '16px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#6b8f71', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.05em' }}>Location & Tax</div>
              <div style={{ fontWeight: 600, marginTop: 8, fontSize: 15 }}>{c.city}</div>
              <div style={{ color: '#6b8f71', fontSize: 13, marginTop: 2 }}>{c.address || 'No address stored'}</div>
              <div style={{ color: '#6b8f71', fontSize: 13, marginTop: 2 }}>GSTIN: {c.gstin || '—'}</div>
            </div>
            <div style={{ background: c.outstandingBalance > 0 ? '#fce8e6' : '#f5faf6', padding: '16px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: c.outstandingBalance > 0 ? '#c0392b' : '#6b8f71', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.05em' }}>Balance Due</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: c.outstandingBalance > 0 ? '#c0392b' : '#2d6a4f', marginTop: 8 }}>
                 {c.outstandingBalance > 0 ? formatCurrency(c.outstandingBalance) : 'Fully Paid'}
              </div>
              <div style={{ color: '#6b8f71', fontSize: 12, marginTop: 4 }}>Credit Limit: {formatCurrency(c.creditLimit)}</div>
            </div>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Customer Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Customers" value={customers.length} />
        <StatCard label="With Balance" value={customers.filter(c => c.outstandingBalance > 0).length} color="#c0392b" />
        <StatCard label="Restaurants" value={customers.filter(c => c.type === 'Restaurant').length} />
        <StatCard label="Supermarkets" value={customers.filter(c => c.type === 'Supermarket').length} color="#457b9d" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#52b788'} onBlur={e => e.target.style.borderColor = '#ddeae0'} />
        {can('director','sales') && <Btn onClick={() => setShowAdd(true)}>+ Add Customer</Btn>}
      </div>

      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: 'name', label: 'Name', render: v => <strong>{v}</strong> },
              { key: 'type', label: 'Type' },
              { key: 'city', label: 'City' },
              { key: 'phone', label: 'Phone' },
              { key: 'outstandingBalance', label: 'Balance', render: v => <span style={{ fontWeight: 600, color: v > 0 ? '#c0392b' : '#52b788' }}>{v > 0 ? formatCurrency(v) : 'Clear'}</span> },
              { key: '_id', label: 'Actions', render: (_, row) => (
                <Btn size="sm" variant="outline" onClick={() => setViewCust(row)}>View</Btn>
              )},
            ]}
            data={filtered}
            onRow={row => setViewCust(row)}
            emptyMsg="No customers found."
          />
        )}
      </Card>

      {viewCust && <CustomerDetailModal customer={viewCust} onClose={() => setViewCust(null)} />}
      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onRefresh={() => { setShowAdd(false); load(); }} />}
    </PageLayout>
  );
}

function CustomerDetailModal({ customer, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get(`/customers/${customer._id}`).then(r => setData(r.data.data));
  }, [customer._id]);

  const c = data || customer;
  return (
    <Modal title={c.name} onClose={onClose} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[['Type',c.type],['City',c.city],['Phone',c.phone]].map(([l,v]) => (
          <div key={l} style={{ background: '#f5faf6', padding: '10px', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b8f71' }}>{l}</div><div style={{ fontWeight: 500 }}>{v}</div>
          </div>
        ))}
        {[['GSTIN',c.gstin||'—'],['Credit Limit',formatCurrency(c.creditLimit)],['Outstanding',<span style={{color:c.outstandingBalance>0?'#c0392b':'#2d6a4f',fontWeight:700}}>{formatCurrency(c.outstandingBalance)}</span>]].map(([l,v]) => (
          <div key={l} style={{ background: '#f5faf6', padding: '10px', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b8f71' }}>{l}</div><div style={{ fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
      {c.recentOrders?.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b8f71', textTransform: 'uppercase', marginBottom: 8 }}>Recent Orders</div>
          <Table
            columns={[
              { key: 'orderId', label: 'Order ID', render: v => <strong style={{ color: '#2d6a4f' }}>{v}</strong> },
              { key: 'createdAt', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
              { key: 'status', label: 'Status', render: v => <Badge status={v} size="sm" /> },
              { key: 'totalAmount', label: 'Total', render: v => formatCurrency(v) },
            ]}
            data={c.recentOrders || []}
          />
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <Btn variant="outline" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

function AddCustomerModal({ onClose, onRefresh }) {
  const [form, setForm] = useState({ name:'', type:'Restaurant', contactName:'', phone:'', email:'', address:'', city:'', gstin:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/customers', form);
      toast.success('Customer added!');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title="Add New Customer" onClose={onClose} width={520}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="Business Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} /></FormGroup>
          <FormGroup label="Type"><Select value={form.type} onChange={e => set('type', e.target.value)}>{['Restaurant','Supermarket','Café','Hotel','Other'].map(t=><option key={t}>{t}</option>)}</Select></FormGroup>
          <FormGroup label="Contact Person"><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></FormGroup>
          <FormGroup label="Phone" required><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></FormGroup>
          <FormGroup label="City" required><Input value={form.city} onChange={e => set('city', e.target.value)} /></FormGroup>
          <FormGroup label="Address"><Input value={form.address} onChange={e => set('address', e.target.value)} /></FormGroup>
          <FormGroup label="GSTIN"><Input value={form.gstin} onChange={e => set('gstin', e.target.value)} /></FormGroup>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Customer'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ===================== DRIVER: MY DELIVERIES ===================== */
export function MyDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState(null);

  useEffect(() => {
    api.get('/delivery/my-deliveries')
      .then(r => { setOrders(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const active = orders.filter(o => o.status === 'Out for Delivery');
  const done = orders.filter(o => o.status === 'Delivered');

  return (
    <PageLayout title="My Deliveries">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <StatCard label="Active Deliveries" value={active.length} color="#e76f51" />
        <StatCard label="Completed" value={done.length} color="#52b788" />
      </div>
      {loading ? <Spinner /> : (
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {active.length === 0 && <Alert type="success">No active deliveries. Check back later!</Alert>}
          {active.map(o => (
            <Card key={o._id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><div style={{ fontWeight: 700, color: '#2d6a4f', fontSize: 15 }}>{o.orderId}</div><div style={{ fontSize: 12, color: '#6b8f71' }}>{formatDateTime(o.dispatchedAt)}</div></div>
                <Badge status={o.status} />
              </div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{o.customer?.name}</div>
              <div style={{ fontSize: 12, color: '#6b8f71', marginBottom: 12 }}>{o.customer?.address}, {o.customer?.city}</div>
              <div style={{ marginBottom: 12 }}>
                {o.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eef4f0', fontSize: 13 }}>
                    <span>{item.productName}</span><span style={{ color: '#6b8f71' }}>{item.quantityOrdered} {item.unit}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#2d6a4f' }}>{formatCurrency(o.totalAmount)}</span>
                <Btn onClick={() => setConfirmOrder(o)}>Confirm Delivery</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {confirmOrder && <ConfirmDeliveryModal order={confirmOrder} onClose={() => setConfirmOrder(null)} onRefresh={() => { setConfirmOrder(null); api.get('/delivery/my-deliveries').then(r => setOrders(r.data.data)); }} />}
    </PageLayout>
  );
}
