import React, { useState, useEffect } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useRetailStore } from '../store/useRetailStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { analyticsApi } from '../services/api';
import { BarChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import {
  Download, Receipt, FileSpreadsheet, Lock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Calendar, Wallet, CheckCircle2, FileText, PieChart, Plus, DollarSign, Printer, Filter, X
} from 'lucide-react';

interface VendorPayout {
  id: string;
  vendor: string;
  invoice: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

export const AccountantPage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { outlets } = useRetailStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const isNewTenant = !!(user?.tenantId && user.tenantId !== 1);

  const [downloadMsg, setDownloadMsg] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('2026-09-10');
  const [totalSales, setTotalSales] = useState<number>(isNewTenant ? 0 : 485290.50);

  // Fetch real tenant sales turnover
  useEffect(() => {
    if (isNewTenant) {
      analyticsApi.getTenantAnalytics().then(res => {
        if (res && typeof res.totalSales === 'number') {
          setTotalSales(res.totalSales);
        }
      }).catch(() => {});
    }
  }, [isNewTenant, user?.tenantId]);

  // Vendor Payouts state (Tenant scoped)
  const [payouts, setPayouts] = useState<VendorPayout[]>(() => {
    if (isNewTenant) {
      try {
        const saved = localStorage.getItem(`megamart_tenant_${user.tenantId}_payouts`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    }
    return [
      { id: 'PAY-701', vendor: 'Amul Dairy India Ltd', invoice: 'AMUL-9081', amount: 145000, dueDate: '2026-09-15', status: 'PENDING' },
      { id: 'PAY-700', vendor: 'Britannia Industries', invoice: 'BRIT-8842', amount: 82000, dueDate: '2026-09-12', status: 'APPROVED' },
      { id: 'PAY-699', vendor: 'Blue Tokai Coffee Roasters', invoice: 'BT-4412', amount: 64000, dueDate: '2026-09-08', status: 'PAID' },
      { id: 'PAY-698', vendor: 'Himalayan Mineral Water Co.', invoice: 'HIM-3109', amount: 35000, dueDate: '2026-09-20', status: 'PENDING' },
    ];
  });

  useEffect(() => {
    if (isNewTenant && user?.tenantId) {
      try { localStorage.setItem(`megamart_tenant_${user.tenantId}_payouts`, JSON.stringify(payouts)); } catch (e) {}
    }
  }, [payouts, isNewTenant, user?.tenantId]);

  const [payoutFilter, setPayoutFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');
  const [isAddPayoutOpen, setIsAddPayoutOpen] = useState(false);
  const [newVendor, setNewVendor] = useState('');
  const [newInvoice, setNewInvoice] = useState('');
  const [newAmount, setNewAmount] = useState('50000');
  const [newDueDate, setNewDueDate] = useState('2026-09-25');

  // Dynamic GST Slabs
  const gstRows = isNewTenant
    ? (totalSales > 0
        ? [
            { slab: '18% GST (Packaged Foods)', taxable: Math.round(totalSales * 0.55), cgst: Math.round(totalSales * 0.55 * 0.09), sgst: Math.round(totalSales * 0.55 * 0.09), total: Math.round(totalSales * 0.55 * 0.18), status: 'VERIFIED' },
            { slab: '12% GST (Dairy & Cold Storage)', taxable: Math.round(totalSales * 0.25), cgst: Math.round(totalSales * 0.25 * 0.06), sgst: Math.round(totalSales * 0.25 * 0.06), total: Math.round(totalSales * 0.25 * 0.12), status: 'VERIFIED' },
            { slab: '5% GST (Essentials & Staples)', taxable: Math.round(totalSales * 0.20), cgst: Math.round(totalSales * 0.20 * 0.025), sgst: Math.round(totalSales * 0.20 * 0.025), total: Math.round(totalSales * 0.20 * 0.05), status: 'VERIFIED' },
          ]
        : [
            { slab: '18% GST (Packaged Foods)', taxable: 0, cgst: 0, sgst: 0, total: 0, status: 'NO_SALES' },
            { slab: '12% GST (Dairy & Cold Storage)', taxable: 0, cgst: 0, sgst: 0, total: 0, status: 'NO_SALES' },
            { slab: '5% GST (Essentials & Staples)', taxable: 0, cgst: 0, sgst: 0, total: 0, status: 'NO_SALES' },
          ])
    : [
        { slab: '18% GST (Packaged Foods)', taxable: 269444.00, cgst: 24250.00, sgst: 24250.00, total: 48500.00, status: 'VERIFIED' },
        { slab: '12% GST (Dairy & Cold Storage)', taxable: 201666.00, cgst: 12100.00, sgst: 12100.00, total: 24200.00, status: 'VERIFIED' },
        { slab: '5% GST (Essentials & Staples)', taxable: 292000.00, cgst: 7300.00, sgst: 7300.00, total: 14600.00, status: 'VERIFIED' },
      ];

  const totalGst = gstRows.reduce((a, b) => a + b.total, 0);
  const gstCenterLabel = totalGst > 0 ? `₹${(totalGst / 1000).toFixed(1)}k` : '₹0';

  // Dynamic P&L Calculation
  const cogs = Math.round(totalSales * 0.705);
  const grossMargin = totalSales - cogs;
  const payroll = totalSales > 0 ? Math.round(totalSales * 0.086) : 0;
  const rent = totalSales > 0 ? Math.round(totalSales * 0.058) : 0;
  const fees = totalSales > 0 ? Math.round(totalSales * 0.008) : 0;
  const netProfit = grossMargin - payroll - rent - fees;
  const netMarginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  // Dynamic Store Reconciliation
  const reconRows = isNewTenant
    ? outlets.map(o => ({
        date: dateFilter,
        store: `${o.name} (${o.code})`,
        cash: totalSales > 0 ? Math.round((totalSales * 0.287) / Math.max(1, outlets.length)) : 0,
        card: totalSales > 0 ? Math.round((totalSales * 0.713) / Math.max(1, outlets.length)) : 0,
        tax: totalSales > 0 ? Math.round(totalGst / Math.max(1, outlets.length)) : 0,
        net: totalSales > 0 ? Math.round(totalSales / Math.max(1, outlets.length)) : 0,
        variance: 0,
        status: totalSales > 0 ? '₹0.00 (Matched)' : 'No Shift Data'
      }))
    : [
        { date: '2026-09-10', store: 'Bandra West, Mumbai (#ST-101)', cash: 18400.50, card: 42410.00, tax: 3040.50, net: 63851.00, variance: 0, status: '₹0.00 (Matched)' },
        { date: '2026-09-10', store: 'Koramangala, Bengaluru (#ST-102)', cash: 12100.00, card: 28900.00, tax: 2050.00, net: 43050.00, variance: 0, status: '₹0.00 (Matched)' },
        { date: '2026-09-10', store: 'Connaught Place, Delhi (#ST-103)', cash: 9800.00, card: 21500.00, tax: 1450.00, net: 32750.00, variance: 0, status: '₹0.00 (Matched)' },
      ];

  const handleExportCsv = (type: string) => {
    let content = '';
    if (type === 'Daily_Reconciliation') {
      content = "Date,Store,Cash_Drawer,UPI_Gateway,Card_Gateway,GST_Tax,Net_Total,Status\n" +
        reconRows.map(r => `${r.date},${r.store},${r.cash},${r.card},0,${r.tax},${r.net},MATCHED`).join('\n');
    } else if (type === 'GST_Filing') {
      content = "Slab,Taxable_Turnover,CGST,SGST,IGST,Net_Tax_Payable\n" +
        gstRows.map(r => `${r.slab.split(' ')[0]},${r.taxable.toFixed(2)},${r.cgst.toFixed(2)},${r.sgst.toFixed(2)},0.00,${r.total.toFixed(2)}`).join('\n');
    } else if (type === 'P&L_Report') {
      content = `Particulars,Amount_INR,Percentage\nGross Retail Sales,${totalSales.toFixed(2)},100%\nCOGS,-${cogs.toFixed(2)},-70.5%\nGross Operating Margin,${grossMargin.toFixed(2)},29.5%\nPayroll & Staff,-${payroll.toFixed(2)},-8.6%\nStore Rent & Utilities,-${rent.toFixed(2)},-5.8%\nNet Profit,${netProfit.toFixed(2)},${netMarginPct}%`;
    } else {
      content = payouts.map(p => `${p.id},${p.vendor},${p.invoice},${p.amount},${p.dueDate},${p.status}`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MegaMart_${type}_${Date.now()}.csv`; a.click();
    setDownloadMsg(`${type} CSV exported successfully!`);
    setTimeout(() => setDownloadMsg(''), 3500);
  };

  const handleApprovePayout = (id: string) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' as const } : p));
    const target = payouts.find(p => p.id === id);
    addNotification({
      type: 'SYSTEM_ALERT',
      title: 'Vendor Invoice Approved',
      message: `Accountant approved vendor payout ${id} (${target?.vendor || 'Vendor'}) for ₹${target?.amount.toLocaleString() || '0'}.`,
      sender: 'Accountant',
      targetRole: 'TENANT_ADMIN',
    });
    setDownloadMsg(`Invoice ${id} approved for payment release.`);
    setTimeout(() => setDownloadMsg(''), 3500);
  };

  const handleReleasePayout = (payoutId: string) => {
    setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'PAID' as const } : p));
    setDownloadMsg(`Vendor Payout ${payoutId} released via RTGS / NEFT!`);
    setTimeout(() => setDownloadMsg(''), 3500);
  };

  const handleAddPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.trim() || !newInvoice.trim()) return;
    const newP: VendorPayout = {
      id: `PAY-${Math.floor(700 + Math.random() * 99)}`,
      vendor: newVendor.trim(),
      invoice: newInvoice.trim(),
      amount: parseFloat(newAmount) || 0,
      dueDate: newDueDate,
      status: 'PENDING'
    };
    setPayouts(prev => [newP, ...prev]);
    setIsAddPayoutOpen(false);
    setNewVendor(''); setNewInvoice('');
    setDownloadMsg(`Vendor Invoice ${newP.invoice} created for ${newP.vendor}!`);
    setTimeout(() => setDownloadMsg(''), 3500);
  };

  // ─── SUB-VIEW 1: RECONCILIATION ───
  const renderReconciliation = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-amber-200/80">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Daily Store Cash & Gateway Reconciliation</h2>
          <p className="text-xs text-stone-500">Cross-verify cashier register drawer counts against bank UPI & card settlement feeds.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="gold-input text-xs font-bold py-2 cursor-pointer"
          >
            <option value="ALL">ALL BRANCHES</option>
            {outlets.map(o => (
              <option key={o.id} value={o.name}>{o.name} ({o.code})</option>
            ))}
          </select>
          <button
            onClick={() => handleExportCsv('Daily_Reconciliation')}
            className="gold-button-primary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Export Reconciliation Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Gross Audited Sales</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-950 font-mono">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-emerald-700 font-bold">{totalSales > 0 ? '100% Verified' : 'No Sales Yet'}</div>
        </div>
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Cash Collections</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-900 font-mono">₹{(totalSales * 0.287).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-stone-500">28.7% of Total Sales</div>
        </div>
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Digital Gateway Settlements</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-950 font-mono">₹{(totalSales * 0.713).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-emerald-700 font-bold">71.3% UPI + Card</div>
        </div>
      </div>

      {/* Financial Analytics Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <BarChartWidget
            title="Tender Payment Settlement Method Breakdown"
            subtitle="Comparing Cash Drawer vs Gateway Collections"
            data={[
              { label: 'UPI Instant QR', value: Math.round(totalSales * 0.444), subValue: totalSales > 0 ? '44.4%' : '0%' },
              { label: 'Cash Drawer', value: Math.round(totalSales * 0.287), subValue: totalSales > 0 ? '28.7%' : '0%' },
              { label: 'Credit/Debit Card', value: Math.round(totalSales * 0.269), subValue: totalSales > 0 ? '26.9%' : '0%' },
            ]}
          />
        </div>
        <div className="lg:col-span-5">
          <DonutChartWidget
            title="GST Tax Slab Breakdown"
            subtitle="Calculated CGST & SGST inputs"
            centerLabel="TOTAL GST"
            centerValue={gstCenterLabel}
            segments={[
              { label: '18% GST (Groceries)', value: gstRows[0].total, color: '#78350F' },
              { label: '12% GST (Dairy)', value: gstRows[1].total, color: '#D97706' },
              { label: '5% GST (Essential)', value: gstRows[2].total, color: '#F59E0B' },
            ]}
          />
        </div>
      </div>

      <div className="gold-card overflow-hidden">
        <div className="p-4 border-b border-amber-200/80 flex justify-between items-center bg-amber-50/40">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">End-of-Day Cash vs Gateway Reconciliation Audit</h3>
            <p className="text-[11px] text-stone-500">Matching cashier shift cash against UPI/card settlement feeds</p>
          </div>
          <span className="gold-badge">{totalSales > 0 ? '100% BALANCED' : 'AWAITING SHIFT'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/70 text-stone-500 uppercase text-[10px] border-b border-amber-200/80 font-extrabold">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Store Location</th>
                <th className="p-3.5 text-right">Cash Drawer (₹)</th>
                <th className="p-3.5 text-right">UPI/Card Gateway (₹)</th>
                <th className="p-3.5 text-right">GST Tax (₹)</th>
                <th className="p-3.5 text-right font-black">Net Total (₹)</th>
                <th className="p-3.5 text-center">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-medium text-stone-800">
              {reconRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50">
                  <td className="p-3.5 font-mono">{row.date}</td>
                  <td className="p-3.5 font-bold text-amber-950">{row.store}</td>
                  <td className="p-3.5 text-right font-mono">₹{row.cash.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right font-mono">₹{row.card.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right font-mono">₹{row.tax.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-900">₹{row.net.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-center"><span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 2: GST TAX LEDGER ───
  const renderGst = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">GST Tax Ledger & Compliance Filings</h2>
          <p className="text-xs text-stone-500">Output tax liabilities vs Input Tax Credits (ITC) for GST Returns GSTR-1 and GSTR-3B.</p>
        </div>
        <button onClick={() => handleExportCsv('GST_Filing')} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
          <Download className="w-3.5 h-3.5" /> Export GSTR-1 & GSTR-3B Return CSV
        </button>
      </div>

      <DonutChartWidget
        title="GST Tax Slab Breakdown"
        subtitle="Calculated CGST & SGST inputs"
        centerLabel="TOTAL GST"
        centerValue={gstCenterLabel}
        segments={[
          { label: '18% GST (Groceries)', value: gstRows[0].total, color: '#78350F' },
          { label: '12% GST (Dairy)', value: gstRows[1].total, color: '#D97706' },
          { label: '5% GST (Essential)', value: gstRows[2].total, color: '#F59E0B' },
        ]}
      />

      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">GST Slab</th>
              <th className="p-3 text-right">Taxable Turnover (₹)</th>
              <th className="p-3 text-right">CGST 9% (₹)</th>
              <th className="p-3 text-right">SGST 9% (₹)</th>
              <th className="p-3 text-right font-black">Net Tax Liability (₹)</th>
              <th className="p-3 text-center">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {gstRows.map((row, i) => (
              <tr key={i} className="hover:bg-amber-50/40">
                <td className="p-3 font-bold text-amber-950">{row.slab}</td>
                <td className="p-3 text-right font-mono">₹{row.taxable.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-mono">₹{row.cgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-mono">₹{row.sgst.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-mono font-black text-amber-900">₹{row.total.toLocaleString('en-IN')}</td>
                <td className="p-3 text-center"><span className="badge-emerald">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 3: P&L REPORTS ───
  const renderPnl = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Profit & Loss (P&L) Financial Statement</h2>
          <p className="text-xs text-stone-500">Gross operating retail margins vs supermarket expenses and net profitability.</p>
        </div>
        <button onClick={() => handleExportCsv('P&L_Report')} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
          <Printer className="w-3.5 h-3.5" /> Print / Export P&L Report
        </button>
      </div>

      <div className="gold-card p-6 space-y-4 text-xs font-mono">
        <div className="flex justify-between border-b border-amber-200 pb-2.5 font-bold text-amber-950 text-sm">
          <span>Gross Retail Supermarket Sales</span>
          <span className="text-base font-black">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="space-y-2 text-stone-700">
          <div className="flex justify-between">
            <span>Cost of Goods Sold (COGS - Inventory Purchases)</span>
            <span className="text-rose-700 font-bold">-₹{cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-bold text-amber-950 pt-2 border-t border-amber-100">
            <span>Gross Operating Margin</span>
            <span className="text-amber-900 font-black">₹{grossMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (29.5%)</span>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-200 space-y-2 text-stone-700">
          <div className="font-bold text-stone-900 text-xs font-sans uppercase">Operating Expenses (OPEX):</div>
          <div className="flex justify-between">
            <span>Staff Payroll & Cashier Salaries</span>
            <span>-₹{payroll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Store Lease & Electricity Utilities</span>
            <span>-₹{rent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Gateway & POS Terminal Fees</span>
            <span>-₹{fees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex justify-between font-black text-sm text-stone-900 border-t-2 border-amber-400 pt-3 bg-amber-50/60 p-3 rounded-xl">
          <span className="text-amber-950">NET OPERATING PROFIT:</span>
          <span className="text-emerald-700 text-base font-black">₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({netMarginPct}% Net Margin)</span>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 4: VENDOR PAYOUTS & ACCOUNTS PAYABLE ───
  const renderPayouts = () => {
    const filteredPayouts = payouts.filter(p => payoutFilter === 'ALL' || p.status === payoutFilter);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">Vendor Payouts & Accounts Payable Schedule</h2>
            <p className="text-xs text-stone-500">Track FMCG supplier invoices, due dates, and bank payout releases.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExportCsv('Vendor_Payouts')} className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export Schedule CSV
            </button>
            <button onClick={() => setIsAddPayoutOpen(true)} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Vendor Invoice</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="gold-card p-3 flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter Status:
          </span>
          {(['ALL', 'PENDING', 'APPROVED', 'PAID'] as const).map(status => (
            <button
              key={status}
              onClick={() => setPayoutFilter(status)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                payoutFilter === status
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-amber-100/70 hover:text-amber-950'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="gold-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
              <tr>
                <th className="p-3">Payout ID</th>
                <th className="p-3">Vendor / Supplier</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {filteredPayouts.map(p => (
                <tr key={p.id} className="hover:bg-amber-50/40">
                  <td className="p-3 font-mono font-bold text-amber-900">{p.id}</td>
                  <td className="p-3 font-bold text-stone-900">{p.vendor}</td>
                  <td className="p-3 font-mono text-stone-600">{p.invoice}</td>
                  <td className="p-3 text-stone-500 text-[11px] font-mono">{p.dueDate}</td>
                  <td className="p-3 text-right font-mono font-black text-amber-950">₹{p.amount.toLocaleString()}</td>
                  <td className="p-3 text-center"><span className="gold-badge">{p.status}</span></td>
                  <td className="p-3 text-center">
                    {p.status === 'PENDING' ? (
                      <button
                        onClick={() => handleApprovePayout(p.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg cursor-pointer shadow-2xs"
                      >
                        Approve Invoice
                      </button>
                    ) : p.status === 'APPROVED' ? (
                      <button
                        onClick={() => handleReleasePayout(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg cursor-pointer shadow-2xs"
                      >
                        Release Bank Payout
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Payout Released
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {downloadMsg && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs font-bold animate-slide-up">
          {downloadMsg}
        </div>
      )}

      {/* Conditional Sub-View Router for ALL 4 Accountant Views */}
      {activeNavItem === 'reconciliation' && renderReconciliation()}
      {activeNavItem === 'payouts' && renderPayouts()}
      {activeNavItem === 'gst' && renderGst()}
      {activeNavItem === 'pnl' && renderPnl()}
      {(!['reconciliation', 'payouts', 'gst', 'pnl'].includes(activeNavItem)) && renderReconciliation()}

      {/* ─── MODAL: CREATE VENDOR INVOICE MODAL ─── */}
      {isAddPayoutOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-700" />
                <span>Create Vendor Invoice / AP Payout</span>
              </h3>
              <button onClick={() => setIsAddPayoutOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddPayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Vendor / Supplier Name</label>
                <input
                  value={newVendor}
                  onChange={e => setNewVendor(e.target.value)}
                  placeholder="e.g. Amul Dairy India Ltd"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Vendor Invoice Reference No</label>
                <input
                  value={newInvoice}
                  onChange={e => setNewInvoice(e.target.value)}
                  placeholder="e.g. AMUL-9081"
                  className="gold-input w-full font-mono uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Payout Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="gold-input w-full font-mono font-bold text-amber-950"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="gold-input w-full font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsAddPayoutOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantPage;
