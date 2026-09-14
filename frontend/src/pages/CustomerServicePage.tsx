import React, { useState, useEffect } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { BarChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import { CustomerDirectoryView } from '../components/CustomerDirectoryView';
import { Search, ShieldAlert, CheckCircle2, User, Gift, DollarSign, RotateCcw, Lock, AlertTriangle, FileText, Phone, Users, Plus, Award, Printer, Download, X } from 'lucide-react';

interface ReturnException {
  id: string; receiptId: string; customerName: string; item: string;
  refundAmount: number; reason: string; timestamp: string; status: string;
}

export const CustomerServicePage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const isNewTenant = !!(user?.tenantId && user.tenantId !== 1);
  const [msg, setMsg] = useState('');

  // Receipt Lookup
  const [trxId, setTrxId] = useState('');
  const [foundReceipt, setFoundReceipt] = useState<{ id: string; date: string; customer: string; items: { name: string; qty: number; price: number }[]; total: number; payment: string } | null>(null);

  // Refund
  const [refundAmount, setRefundAmount] = useState('850.00');
  const [returnReason, setReturnReason] = useState('Expired / Damaged');
  const [isOverrideModal, setIsOverrideModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');

  // Exceptions Audit Log (Tenant scoped)
  const [exceptions, setExceptions] = useState<ReturnException[]>(() => {
    if (isNewTenant) {
      try {
        const saved = localStorage.getItem(`megamart_tenant_${user.tenantId}_refund_exceptions`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    }
    return [
      { id: 'RET-901', receiptId: 'INV-891024', customerName: 'Rohan Sharma', item: 'Blue Tokai Coffee Beans 1kg', refundAmount: 850.00, reason: 'Expired / Damaged', timestamp: 'Today, 14:20 PM', status: 'MANAGER_APPROVED' },
      { id: 'RET-900', receiptId: 'INV-890912', customerName: 'Anjali Verma', item: 'Epigamia Greek Yogurt 500g', refundAmount: 95.00, reason: 'Customer Dissatisfied', timestamp: 'Today, 11:15 AM', status: 'AUTO_PROCESSED' },
      { id: 'RET-899', receiptId: 'INV-890845', customerName: 'Sunil Mehta', item: 'Britannia Sourdough Bread 500g', refundAmount: 110.00, reason: 'Defective Packaging', timestamp: 'Yesterday, 04:30 PM', status: 'MANAGER_APPROVED' },
    ];
  });

  useEffect(() => {
    if (isNewTenant && user?.tenantId) {
      try {
        localStorage.setItem(`megamart_tenant_${user.tenantId}_refund_exceptions`, JSON.stringify(exceptions));
      } catch (e) {}
    }
  }, [exceptions, isNewTenant, user?.tenantId]);

  const handleLookup = () => {
    setFoundReceipt({
      id: trxId || 'INV-891024', date: '10 Sep 2026, 02:15 PM', customer: 'Rohan Sharma (+91 9876543210)',
      items: [
        { name: 'Blue Tokai Coffee Beans 1kg', qty: 1, price: 850 },
        { name: 'Amul Taaza Milk 1L', qty: 2, price: 136 },
        { name: 'Britannia Sourdough Bread 500g', qty: 1, price: 110 },
      ],
      total: 1096, payment: 'UPI QR'
    });
  };

  const handleRefundClick = () => {
    const val = parseFloat(refundAmount) || 0;
    if (val > 500) { setIsOverrideModal(true); }
    else { processRefund(val, 'AUTO_PROCESSED'); }
  };

  const processRefund = (amt: number, status: string) => {
    setExceptions(prev => [{ id: `RET-${Math.floor(900 + Math.random() * 100)}`, receiptId: trxId || 'INV-891024', customerName: 'Rohan Sharma', item: 'Blue Tokai Coffee 1kg', refundAmount: amt, reason: returnReason, timestamp: 'Just now', status }, ...prev]);
    addNotification({
      type: 'PIN_OVERRIDE',
      title: 'Customer Refund Processed',
      message: `Customer Desk processed refund of ₹${amt.toFixed(2)} for invoice ${trxId || 'INV-891024'} (${status})`,
      sender: 'Customer Desk',
      targetRole: 'STORE_MANAGER',
    });
    setMsg(`Refund ₹${amt.toFixed(2)} processed! Store Credit / Cash Voucher issued.`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleManagerOverride = () => {
    if (managerPin === '1234') {
      setIsOverrideModal(false); setManagerPin('');
      processRefund(parseFloat(refundAmount) || 0, 'MANAGER_APPROVED');
    } else { alert('Invalid Manager PIN. Use 1234 for demo.'); }
  };

  const handleExportExceptions = () => {
    const csv = exceptions.map(e => `${e.id},${e.receiptId},${e.customerName},${e.item},${e.refundAmount},${e.reason},${e.status}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Return_Exceptions_${Date.now()}.csv`; a.click();
    setMsg('Return Exceptions Log exported!'); setTimeout(() => setMsg(''), 3000);
  };

  // ─── SUB-VIEW 1: RECEIPT LOOKUP ───
  const renderReceipts = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="gold-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-stone-900">Look Up Store Invoice / Receipt</h3>
        <div className="flex gap-2">
          <input value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="Enter Receipt ID (e.g. INV-891024)..." className="gold-input flex-1 font-mono" />
          <button onClick={handleLookup} className="gold-button-primary text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
            <Search className="w-3.5 h-3.5" /> Lookup Receipt
          </button>
        </div>
      </div>

      {foundReceipt && (
        <div className="gold-card p-6 space-y-4 font-mono text-xs border-2 border-amber-300">
          <div className="flex justify-between border-b border-amber-200 pb-3">
            <div>
              <div className="font-extrabold text-amber-950 text-sm">{foundReceipt.id}</div>
              <div className="text-stone-500 text-[11px]">{foundReceipt.date}</div>
              <div className="text-[11px] text-amber-900 font-bold">{foundReceipt.customer}</div>
            </div>
            <span className="gold-badge">{foundReceipt.payment} PAID</span>
          </div>

          <div className="space-y-2">
            {foundReceipt.items.map((it, i) => (
              <div key={i} className="flex justify-between font-medium">
                <span>{it.name} x{it.qty}</span>
                <span className="font-bold text-amber-950">₹{it.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-amber-200 pt-3 flex justify-between items-center">
            <div className="font-black text-sm text-stone-900">
              <span>TOTAL BILLED: </span>
              <span className="text-amber-900">₹{foundReceipt.total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => window.print()}
              className="gold-btn-secondary text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Duplicate Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── SUB-VIEW 2: EXCHANGE / REFUND ───
  const renderRefunds = () => (
    <div className="space-y-6 max-w-xl">
      <div className="gold-card p-6 space-y-4">
        <h3 className="font-extrabold text-amber-950 text-sm">Process Product Exchange / Customer Refund</h3>
        <p className="text-xs text-stone-500">Security Requirement: Refunds &gt; ₹500 require Store Manager PIN override (Demo PIN: 1234).</p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Receipt Invoice ID</label>
            <input value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="e.g. INV-891024" className="gold-input w-full font-mono" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Refund Amount (₹)</label>
            <input value={refundAmount} onChange={e => setRefundAmount(e.target.value)} type="number" className="gold-input w-full font-mono font-black text-amber-900" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Return Reason</label>
            <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="gold-input w-full">
              <option>Expired / Damaged</option>
              <option>Customer Dissatisfied</option>
              <option>Defective Packaging</option>
              <option>Wrong Item Billed</option>
            </select>
          </div>
          <button onClick={handleRefundClick} className="w-full gold-button-primary py-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
            <RotateCcw className="w-4 h-4" />
            <span>Process Refund / Issue Credit Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 3: EXCEPTION LOG ───
  const renderExceptions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Return & Refund Exception Audit Log</h2>
          <p className="text-xs text-stone-500">Historical log of all customer returns and manager approvals.</p>
        </div>
        <button onClick={handleExportExceptions} className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Log CSV
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Return ID</th>
              <th className="p-3">Receipt ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Item</th>
              <th className="p-3 text-right">Refund (₹)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {exceptions.map(ex => (
              <tr key={ex.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-mono font-bold text-amber-900">{ex.id}</td>
                <td className="p-3 font-mono text-stone-600">{ex.receiptId}</td>
                <td className="p-3 font-bold text-amber-950">{ex.customerName}</td>
                <td className="p-3 font-semibold">{ex.item}</td>
                <td className="p-3 text-right font-black text-amber-950">₹{ex.refundAmount.toFixed(2)}</td>
                <td className="p-3 text-center"><span className="gold-badge">{ex.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 select-none">
      {msg && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs font-bold animate-slide-up">
          {msg}
        </div>
      )}

      {/* Conditional Sub-View Router for Customer Service Views */}
      {(activeNavItem === 'crm' || activeNavItem === 'customers') && <CustomerDirectoryView />}
      {activeNavItem === 'receipts' && renderReceipts()}
      {activeNavItem === 'refunds' && renderRefunds()}
      {activeNavItem === 'exceptions' && renderExceptions()}
      {(!['crm', 'customers', 'receipts', 'refunds', 'exceptions'].includes(activeNavItem)) && <CustomerDirectoryView />}

      {/* ─── MODAL: MANAGER PIN OVERRIDE MODAL ─── */}
      {isOverrideModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-xs w-full p-5 space-y-3 bg-white border-2 border-amber-300 shadow-2xl">
            <h3 className="font-extrabold text-amber-950 text-sm">Manager Security Override</h3>
            <p className="text-xs text-stone-500">Refunds &gt; ₹500 require Store Manager PIN authorization (Demo PIN: <strong className="text-amber-950">1234</strong>).</p>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Enter Manager PIN</label>
              <input value={managerPin} onChange={e => setManagerPin(e.target.value)} type="password" placeholder="••••" className="gold-input w-full font-mono text-center text-lg tracking-widest font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsOverrideModal(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button onClick={handleManagerOverride} className="w-1/2 gold-button-primary py-2 rounded-xl text-xs font-bold cursor-pointer">Authorize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServicePage;
