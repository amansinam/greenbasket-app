import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageLayout } from '../components/Layout';
import { StatCard, Card, CardHeader, Badge, Btn, Table, Modal, FormGroup, Input, Select, Spinner, ProgressBar, Alert, formatCurrency } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Inventory() {
  const { can } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [addStockProduct, setAddStockProduct] = useState(null);
  const [lossProduct, setLossProduct] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cats = ['All', ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStockItems = products.filter(p => p.isLowStock);
  const totalValue = products.reduce((s, p) => s + p.stock * p.pricePerUnit, 0);

  const cols = [
    { key: 'sku', label: 'SKU', render: v => <span style={{ fontSize: 11, color: '#6b8f71', fontFamily: 'monospace' }}>{v}</span> },
    { key: 'name', label: 'Product', render: (v, r) => <span style={{ fontWeight: 500 }}>{v} <span style={{ fontSize: 11, color: '#aaa' }}>({r.unit})</span></span> },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'In Stock', render: v => <strong>{v}</strong> },
    { key: 'reservedStock', label: 'Reserved', render: v => <span style={{ color: '#e76f51' }}>{v}</span> },
    { key: 'availableStock', label: 'Available', render: (v, r) => (
      <div>
        <span style={{ fontWeight: 600, color: r.isLowStock ? '#c0392b' : '#2d6a4f' }}>{v}</span>
        <ProgressBar value={v} max={Math.max(r.stock, 1)} color={r.isLowStock ? '#c0392b' : '#52b788'} />
        {r.isLowStock && <Badge status="Pending" label="Low" size="sm" />}
      </div>
    )},
    { key: 'minStockLevel', label: 'Min Level' },
    { key: 'pricePerUnit', label: 'Price', render: v => formatCurrency(v) },
    { key: '_id', label: 'Actions', render: (_, r) => can('director','warehouse_supervisor') ? (
      <div style={{ display: 'flex', gap: 4 }}>
        <Btn size="sm" variant="outline" onClick={e => { e.stopPropagation(); setAddStockProduct(r); }}>+ Stock</Btn>
        <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setLossProduct(r); }}>Loss</Btn>
        <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setAdjustProduct(r); }}>Adjust</Btn>
      </div>
    ) : null },
  ];

  return (
    <PageLayout title="Inventory Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Low Stock Alerts" value={lowStockItems.length} color={lowStockItems.length > 0 ? '#c0392b' : '#2d6a4f'} />
        <StatCard label="Total Stock Value" value={formatCurrency(totalValue)} color="#457b9d" />
        <StatCard label="Categories" value={cats.length - 1} />
      </div>

      {lowStockItems.length > 0 && (
        <Alert type="warning">⚠ Low stock: {lowStockItems.map(p => p.name).join(', ')}</Alert>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#52b788'} onBlur={e => e.target.style.borderColor = '#ddeae0'} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddeae0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {can('director','warehouse_supervisor') && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" onClick={() => setLossProduct('pick')}>Record Loss</Btn>
            <Btn onClick={() => setShowAdd(true)}>+ Add Product</Btn>
          </div>
        )}
      </div>

      <Card>
        {loading ? <Spinner /> : <Table columns={cols} data={filtered} emptyMsg="No products found." />}
      </Card>

      {addStockProduct && <AddStockModal product={addStockProduct} onClose={() => setAddStockProduct(null)} onRefresh={() => { setAddStockProduct(null); load(); }} />}
      {lossProduct && lossProduct !== 'pick' && <RecordLossModal product={lossProduct} onClose={() => setLossProduct(null)} onRefresh={() => { setLossProduct(null); load(); }} />}
      {lossProduct === 'pick' && <PickProductModal products={products} title="Select Product for Loss" onPick={p => setLossProduct(p)} onClose={() => setLossProduct(null)} />}
      {adjustProduct && <AdjustStockModal product={adjustProduct} onClose={() => setAdjustProduct(null)} onRefresh={() => { setAdjustProduct(null); load(); }} />}
      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onRefresh={() => { setShowAdd(false); load(); }} />}
    </PageLayout>
  );
}

function AddStockModal({ product, onClose, onRefresh }) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) return toast.error('Enter valid quantity');
    setLoading(true);
    try {
      await api.post(`/products/${product._id}/add-stock`, { quantity: Number(qty), reason });
      toast.success(`Added ${qty} ${product.unit} of ${product.name}`);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title={`Add Stock — ${product.name}`} onClose={onClose} width={420}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[['Current Stock', product.stock],['Reserved', product.reservedStock],['Available', product.availableStock]].map(([l, v]) => (
          <div key={l} style={{ background: '#f5faf6', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b8f71' }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>{v}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <FormGroup label="Quantity to Add" required>
          <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder={`e.g. 100 ${product.unit}`} />
        </FormGroup>
        <FormGroup label="Supplier / Reason">
          <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Supplier name or notes" />
        </FormGroup>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Stock'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function RecordLossModal({ product, onClose, onRefresh }) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('Spoilage');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/products/${product._id}/record-loss`, { quantity: Number(qty), reason });
      toast.success(`Loss of ${qty} ${product.unit} recorded`);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title={`Record Loss — ${product.name}`} onClose={onClose} width={420}>
      <form onSubmit={handleSubmit}>
        <FormGroup label="Quantity Lost" required>
          <Input type="number" min="1" max={product.availableStock} value={qty} onChange={e => setQty(e.target.value)} placeholder={`Max: ${product.availableStock} ${product.unit}`} />
        </FormGroup>
        <FormGroup label="Reason">
          <Select value={reason} onChange={e => setReason(e.target.value)}>
            {['Spoilage','Damage','Theft','Weighing Error','Other'].map(r => <option key={r}>{r}</option>)}
          </Select>
        </FormGroup>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Record Loss'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function AdjustStockModal({ product, onClose, onRefresh }) {
  const [stock, setStock] = useState(product.stock);
  const [minStock, setMinStock] = useState(product.minStockLevel);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/products/${product._id}`, { stock: Number(stock), minStockLevel: Number(minStock) });
      toast.success('Stock adjusted');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title={`Adjust Stock — ${product.name}`} onClose={onClose} width={400}>
      <form onSubmit={handleSubmit}>
        <FormGroup label="Set Total Stock">
          <Input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} />
        </FormGroup>
        <FormGroup label="Minimum Stock Level">
          <Input type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value)} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function PickProductModal({ products, title, onPick, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {products.map(p => (
          <button key={p._id} onClick={() => onPick(p)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f5faf6', border: '1px solid #ddeae0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <span style={{ fontWeight: 500 }}>{p.name}</span>
            <span style={{ fontSize: 12, color: '#6b8f71' }}>{p.availableStock} {p.unit} available</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function AddProductModal({ onClose, onRefresh }) {
  const [form, setForm] = useState({ sku: '', name: '', category: 'Vegetable', unit: 'kg', pricePerUnit: '', stock: '0', minStockLevel: '20' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', { ...form, pricePerUnit: Number(form.pricePerUnit), stock: Number(form.stock), minStockLevel: Number(form.minStockLevel) });
      toast.success('Product added');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setLoading(false);
  };

  return (
    <Modal title="Add New Product" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormGroup label="SKU" required><Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. VEG-011" /></FormGroup>
          <FormGroup label="Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name" /></FormGroup>
          <FormGroup label="Category"><Select value={form.category} onChange={e => set('category', e.target.value)}>{['Vegetable','Fruit','Herb','Leafy','Spice','Exotic','Packaged','Other'].map(c => <option key={c}>{c}</option>)}</Select></FormGroup>
          <FormGroup label="Unit"><Select value={form.unit} onChange={e => set('unit', e.target.value)}>{['kg','g','piece','bundle','box','litre'].map(u => <option key={u}>{u}</option>)}</Select></FormGroup>
          <FormGroup label="Price per Unit" required><Input type="number" min="0" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="₹" /></FormGroup>
          <FormGroup label="Initial Stock"><Input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} /></FormGroup>
          <FormGroup label="Min Stock Level"><Input type="number" min="0" value={form.minStockLevel} onChange={e => set('minStockLevel', e.target.value)} /></FormGroup>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="outline" type="button" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Product'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
