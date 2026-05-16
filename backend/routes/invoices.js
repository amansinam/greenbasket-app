const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, customer } = req.query;
    let query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;
    const invoices = await Invoice.find(query)
      .populate('customer', 'name city').populate('order', 'orderId').sort('-createdAt');
    res.json({ success: true, data: invoices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer').populate('order').populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/mark-paid', authorize('director', 'accounting'), async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const paidAmount = Number(amount) || invoice.totalAmount;
    invoice.paidAmount += paidAmount;
    invoice.paymentMode = paymentMode || invoice.paymentMode;
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
      await Customer.findByIdAndUpdate(invoice.customer, { $inc: { outstandingBalance: -invoice.totalAmount } });
    } else {
      invoice.status = 'Partial';
      await Customer.findByIdAndUpdate(invoice.customer, { $inc: { outstandingBalance: -paidAmount } });
    }
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Tally export - returns XML/JSON for Tally integration
router.get('/export/tally', authorize('director', 'accounting'), async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = { status: 'Paid' };
    if (from && to) query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    const invoices = await Invoice.find(query).populate('customer').populate('order', 'orderId');
    // Generate Tally XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        ${invoices.map(inv => `
        <TALLYMESSAGE>
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${new Date(inv.createdAt).toISOString().split('T')[0].replace(/-/g,'')}</DATE>
            <PARTYLEDGERNAME>${inv.customer?.name}</PARTYLEDGERNAME>
            <VOUCHERNUMBER>${inv.invoiceNumber}</VOUCHERNUMBER>
            <AMOUNT>${inv.totalAmount}</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>`).join('')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
