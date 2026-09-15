import React from 'react';
import { 
  X, Printer, ShieldCheck, CheckCircle2, Download, Building2, 
  CreditCard, Calendar, QrCode, FileText, Check, Lock, ExternalLink
} from 'lucide-react';

export interface SaaSTenantInvoiceData {
  id: number;
  name: string;
  plan: string;
  adminName?: string;
  adminEmail?: string;
  paymentMethod?: string;
  paymentId?: string;
  amountPaid?: number;
  invoiceNumber?: string;
  gstin?: string;
  city?: string;
  renewalDate?: string;
  startDate?: string;
  billingCycle?: string;
  maxStores?: number;
  maxUsers?: number;
  status?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenant: SaaSTenantInvoiceData | null;
}

export const SaaSTaxInvoiceModal: React.FC<Props> = ({ isOpen, onClose, tenant }) => {
  if (!isOpen || !tenant) return null;

  const totalAmount = tenant.amountPaid || (tenant.plan.includes('Enterprise') ? 39999 : tenant.plan.includes('Standard') ? 14999 : 4999);
  
  // 18% GST Breakdown (Inclusive calculation)
  const taxableAmount = totalAmount / 1.18;
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const totalTax = cgst + sgst;

  const invoiceNo = tenant.invoiceNumber || `MM-SAAS-${String(1000 + tenant.id)}`;
  const invoiceDate = tenant.startDate || new Date().toISOString().split('T')[0];
  const renewalDate = tenant.renewalDate || '2027-09-14';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white max-w-3xl w-full rounded-3xl border border-amber-300 shadow-2xl overflow-hidden text-stone-900 my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Action Toolbar (Hidden when printing) */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-200" />
            <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">Official GST Tax Invoice • SaaS Subscription</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="saas-tax-invoice-content" className="p-4 sm:p-6 md:p-10 space-y-6 text-stone-800 bg-white overflow-y-auto flex-1">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-amber-950 tracking-tight leading-none">
                    MEGAMART<span className="text-amber-600">.OS</span>
                  </h1>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Retail Cloud Technologies</span>
                </div>
              </div>
              
              <div className="text-[11px] text-stone-600 mt-3 space-y-0.5 font-medium">
                <p className="font-bold text-stone-900">MegaMart Retail Technologies Private Limited</p>
                <p>Level 4, High Street Tech Park, Bandra West</p>
                <p>Mumbai, Maharashtra 400050, India</p>
                <p className="font-mono text-stone-700"><strong>GSTIN:</strong> 27AAAAA0000A1Z5 • <strong>PAN:</strong> AAAAA0000A</p>
                <p><strong>Email:</strong> billing@megamart.com • <strong>Tel:</strong> +91 (022) 8920-4000</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
                TAX INVOICE (B2B)
              </span>
              <div className="font-mono text-xs space-y-1 pt-2">
                <div>Invoice No: <strong className="text-stone-950 text-sm">{invoiceNo}</strong></div>
                <div>Invoice Date: <span className="font-semibold">{invoiceDate}</span></div>
                <div>Billing Period: <span className="font-semibold">{tenant.billingCycle || 'ANNUAL'}</span></div>
                <div>Place of Supply: <span className="font-semibold">27-Maharashtra</span></div>
                <div className="pt-1">
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    PAID IN FULL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To (Client / Tenant) & Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/80 p-4 rounded-2xl border border-stone-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-stone-500 tracking-wider block">Billed To (Subscriber):</span>
              <h3 className="font-black text-stone-900 text-sm">{tenant.name}</h3>
              <p className="text-stone-700 font-semibold">Attn: {tenant.adminName || 'Authorized Signatory'}</p>
              <p className="text-stone-600">Email: {tenant.adminEmail || 'admin@megamart.com'}</p>
              <p className="text-stone-600">Location: {tenant.city || 'Mumbai'}, India</p>
              <p className="font-mono text-stone-600">Client GSTIN: <span className="font-bold text-stone-800">{tenant.gstin || 'Unregistered B2B Client'}</span></p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-stone-200 sm:pl-6 font-mono">
              <span className="text-[10px] uppercase font-extrabold text-stone-500 tracking-wider block">Payment Verification:</span>
              <div>Gateway: <strong className="text-stone-900">{tenant.paymentMethod || 'Razorpay UPI'}</strong></div>
              <div>Transaction Ref: <strong className="text-stone-900">{tenant.paymentId || 'pay_rzp_verified'}</strong></div>
              <div>License Valid Until: <strong className="text-amber-900">{renewalDate}</strong></div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                <Lock className="w-3 h-3" /> PCI-DSS Verified 256-bit Encrypted Transaction
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-stone-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-stone-100 text-stone-700 uppercase font-extrabold text-[10px] border-b border-stone-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Service Description</th>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3">Tier Quotas</th>
                  <th className="p-3 text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="p-3 font-mono">1</td>
                  <td className="p-3">
                    <div className="font-bold text-stone-900">MegaMart Cloud Retail OS — {tenant.plan}</div>
                    <div className="text-[11px] text-stone-500">Full platform license, POS barcode engine, FEFO inventory, automated GST tax ledgers</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-700">997331</td>
                  <td className="p-3 text-stone-600">
                    <div>Stores: <strong>{tenant.maxStores || 10} Outlets</strong></div>
                    <div>Seats: <strong>{tenant.maxUsers || 50} Users</strong></div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-stone-900">
                    ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Calculation & Grand Total Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-[11px] text-stone-500 space-y-1 max-w-sm">
              <p className="font-bold text-stone-700">Tax Clause & Terms:</p>
              <p>SAC 997331 relates to Software as a Service (SaaS) and electronic data processing infrastructure.</p>
              <p>Goods & Services Tax is charged under CGST Act and Maharashtra SGST Act @ 9% each.</p>
            </div>

            <div className="w-full sm:w-72 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 font-mono text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Taxable Amount:</span>
                <span>₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>CGST @ 9.0%:</span>
                <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>SGST @ 9.0%:</span>
                <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-stone-600 pt-1 border-t border-amber-200">
                <span>Total GST (18%):</span>
                <span>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-950 font-black text-base pt-1 border-t-2 border-amber-300">
                <span>Grand Total:</span>
                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Sign-off & Bank Details */}
          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
            <div className="space-y-1 text-stone-500 text-[11px]">
              <p className="font-bold text-stone-700">Bank Settlement Details for Record:</p>
              <p>Bank: HDFC Bank Ltd • Branch: Bandra West, Mumbai</p>
              <p>Account Name: MegaMart Retail Technologies Pvt Ltd</p>
              <p className="font-mono">A/C: 50200088991122 • IFSC: HDFC0000123</p>
            </div>

            <div className="text-center sm:text-right space-y-2">
              <div className="w-32 h-10 border-b border-stone-400 mx-auto sm:ml-auto flex items-end justify-center pb-1">
                <span className="font-serif italic text-stone-500 text-xs">Digitally Verified</span>
              </div>
              <p className="font-bold text-stone-900 text-xs">For MegaMart Retail Technologies Pvt. Ltd.</p>
              <p className="text-[10px] text-stone-500">Authorised Signatory • Computer Generated Invoice</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
