import React, { useState } from 'react';
import { 
  X, ShieldCheck, FileText, RefreshCcw, Truck, Phone, 
  Mail, MapPin, Clock, Printer, CheckCircle2, AlertCircle, ExternalLink, Globe, Lock
} from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'refund' | 'shipping' | 'contact';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const LegalPoliciesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 select-none animate-fadeIn">
      <div className="bg-white max-w-4xl w-full h-[90vh] rounded-3xl border border-amber-200 shadow-2xl flex flex-col overflow-hidden text-stone-900">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-stone-900 text-sm md:text-base tracking-tight">Legal, Privacy & Compliance Center</h2>
              <p className="text-[11px] text-amber-800 font-medium">Business-Ready Policies for Razorpay, Stripe & RBI/GDPR Compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Document"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer hidden md:flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-amber-50/50 border-b border-amber-200/80 px-4 md:px-6 flex items-center gap-1 md:gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'terms' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'refund' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Refund & Cancellation</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'shipping' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shipping & Delivery (SaaS)</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contact' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>
        </div>

        {/* Policy Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs text-stone-700 leading-relaxed font-sans select-text">
          
          {/* 1. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="gold-badge text-[10px] mb-1 inline-block">MANDATORY RAZORPAY / STRIPE COMPLIANCE</span>
                <h3 className="text-lg font-black text-amber-950">Privacy Policy</h3>
                <p className="text-[11px] text-stone-500">Last updated: September 14, 2026 | Effective immediately for all platform users</p>
              </div>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">1. Introduction & Overview</h4>
                <p>
                  MegaMart Retail SaaS ("MegaMart", "we", "us", or "our") is dedicated to protecting the privacy, confidentiality, and security of our business clients, retail tenants, cashiers, and store consumers. This Privacy Policy outlines how we collect, process, store, and disclose information when you utilize our Point-of-Sale (POS) terminal, inventory ERP, and cloud subscription services.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">2. Information We Collect</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Credentials:</strong> Company name, administrator email, password hash, phone number, and physical billing address.</li>
                  <li><strong>Retail & Transaction Data:</strong> Sales orders, line items, product quantities, tax ledgers, and payment transaction identifiers.</li>
                  <li><strong>Customer Loyalty Information:</strong> Customer name and telephone digits collected at POS checkout stations strictly for customer bill issuance, receipts, and loyalty reward redemption.</li>
                  <li><strong>Payment Information:</strong> All card details, UPI VPAs, and banking credentials are processed directly through PCI-DSS Level 1 compliant gateways (Razorpay, Stripe). <strong>MegaMart never stores raw credit/debit card numbers or CVV codes on our servers.</strong></li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">3. How We Use Collected Data</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide automated retail POS operations, stock deduction, and billing invoice generation.</li>
                  <li>To facilitate payments via Razorpay (UPI, Netbanking, Cards) and Stripe.</li>
                  <li>To prevent fraud, brute-force attempts, and unauthorized multitenant cross-access.</li>
                  <li>To deliver GST tax ledgers and audit records required under applicable commercial laws.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">4. Data Security & Encryption</h4>
                <p>
                  All data in transit is protected using industry-standard Transport Layer Security (TLS 1.3 / 256-bit SSL encryption). Data at rest is encrypted in high-security relational PostgreSQL databases with strict row-level multitenant data isolation.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">5. Your Data Rights</h4>
                <p>
                  You have the right to request access to your company records, download your transaction ledgers, rectify inaccurate information, or request tenant account termination by contacting our compliance officer at <span className="font-bold text-amber-900">privacy@megamart.com</span>.
                </p>
              </section>
            </div>
          )}

          {/* 2. TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="gold-badge text-[10px] mb-1 inline-block">LEGAL USER AGREEMENT</span>
                <h3 className="text-lg font-black text-amber-950">Terms & Conditions (Terms of Service)</h3>
                <p className="text-[11px] text-stone-500">Last updated: September 14, 2026 | Governing platform usage & SaaS licensing</p>
              </div>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">1. Agreement to Terms</h4>
                <p>
                  By registering an account, purchasing a subscription, or accessing the MegaMart Retail POS software, you agree to be bound by these Terms & Conditions. If you are entering into this agreement on behalf of a company or entity, you warrant that you have full legal authority to bind that entity.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">2. SaaS Subscription & License Grant</h4>
                <p>
                  Subject to timely payment of applicable subscription plan fees (Essential, Professional, or Enterprise), MegaMart grants you a non-exclusive, non-transferable, revocable license to access our cloud-based POS and Retail ERP application for your commercial store locations.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">3. Payment Terms & Billing Cycle</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Subscription fees are billed in advance on a monthly or annual recurring cycle via integrated payment gateways (Razorpay, Stripe).</li>
                  <li>Applicable Goods & Services Tax (GST 18%) or local digital service taxes will be calculated and invoiced according to governing regulations.</li>
                  <li>Failure to process renewal payments within a 7-day grace period may result in automated suspension of POS write operations.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">4. Acceptable Use Policy</h4>
                <p>
                  You agree not to reverse engineer, decompile, resell, or exploit the software platform; inject malicious code; or circumvent multi-tenant authentication boundaries.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">5. Service Availability & SLA</h4>
                <p>
                  MegaMart strives to achieve a 99.9% application uptime. Planned maintenance windows are scheduled during off-peak commercial hours with advance notification provided on the executive dashboard.
                </p>
              </section>
            </div>
          )}

          {/* 3. REFUND & CANCELLATION */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="gold-badge text-[10px] mb-1 inline-block">MANDATORY RAZORPAY / STRIPE DISPUTE POLICY</span>
                <h3 className="text-lg font-black text-amber-950">Refund & Cancellation Policy</h3>
                <p className="text-[11px] text-stone-500">Clear guidelines on plan cancellations, chargeback resolution & return processing</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs">7-Day Risk-Free Money-Back Guarantee</h4>
                  <p className="text-[11px] text-emerald-800">
                    If you are unsatisfied with your MegaMart SaaS subscription within the first 7 days of initial registration, you are eligible for a 100% full refund with no questions asked.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">1. Subscription Cancellation</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You may cancel your recurring SaaS subscription at any time directly from the <strong>Executive HQ &gt; Subscription Plans</strong> dashboard or by emailing <span className="font-bold text-amber-900">billing@megamart.com</span>.</li>
                  <li>Upon cancellation, your store terminals will remain active until the end of your current paid billing period, and no further automated renewals will be charged.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">2. Refund Eligibility & Conditions</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Initial Purchase:</strong> Full refund within 7 days of initial subscription signup.</li>
                  <li><strong>Service Interruptions:</strong> If our cloud infrastructure experiences downtime exceeding our SLA (&gt;0.1% monthly downtime), pro-rated service credits or refunds will be issued.</li>
                  <li><strong>Duplicate / Failed Transactions:</strong> If your card or UPI account is charged multiple times due to a network glitch, all duplicate charges will be automatically reversed.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">3. Refund Processing Timeline</h4>
                <p>
                  Once your refund request is approved:
                </p>
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1 font-mono text-[11px]">
                  <p><strong>Razorpay (UPI / NetBanking / Cards):</strong> Refund credited within <strong>5 to 7 business days</strong> directly to the original bank account or UPI ID.</p>
                  <p><strong>Stripe (Credit / Debit Cards):</strong> Refund reflected on credit statement within <strong>5 to 10 business days</strong> depending on the issuing bank.</p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">4. Retail Store In-Store Refund Policy</h4>
                <p>
                  For individual store customers shopping at a retail location running MegaMart POS, exchange and return policies for physical items are governed independently by each merchant. Store managers can issue instant on-terminal cash or UPI credit refunds via the <strong>Exchange / Refund Desk</strong> module.
                </p>
              </section>
            </div>
          )}

          {/* 4. SHIPPING & DELIVERY (SAAS) */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="gold-badge text-[10px] mb-1 inline-block">DIGITAL SERVICE PROVISIONING</span>
                <h3 className="text-lg font-black text-amber-950">Shipping & Delivery Policy (Digital Goods)</h3>
                <p className="text-[11px] text-stone-500">Guidelines on electronic service delivery, provisioning timelines & credential access</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">Instant Electronic Digital Delivery (Zero Physical Shipping)</h4>
                  <p className="text-[11px] text-amber-800">
                    MegaMart is a 100% Software-as-a-Service (SaaS) cloud application. No physical goods or packages are shipped. Delivery of all subscription services is conducted entirely electronically via the Internet.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">1. Delivery Timeline & Activation</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Automated Instant Provisioning:</strong> Upon successful payment confirmation through Razorpay or Stripe, your dedicated multi-tenant workspace is provisioned immediately (within <strong>2 to 5 minutes</strong>).</li>
                  <li><strong>Welcome & Access Email:</strong> A confirmation email containing your tenant credentials, admin dashboard access link, and onboarding setup instructions is dispatched immediately to your registered work email.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wide">2. Delivery Confirmation & Support</h4>
                <p>
                  If you do not receive your digital account activation confirmation within 15 minutes of completing payment, please check your spam folder or contact our 24/7 technical operations desk at <span className="font-bold text-amber-900">delivery@megamart.com</span> with your Payment ID (e.g. `pay_xxx` or `ch_xxx`).
                </p>
              </section>
            </div>
          )}

          {/* 5. CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="gold-badge text-[10px] mb-1 inline-block">MERCHANT CONTACT & GRIEVANCE REDRESSAL</span>
                <h3 className="text-lg font-black text-amber-950">Contact Us & Grievance Redressal</h3>
                <p className="text-[11px] text-stone-500">Official registered business communication channels & escalation matrix</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    <span>Registered Business Office</span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed font-medium">
                    <strong>MegaMart Retail SaaS Technologies Pvt. Ltd.</strong><br />
                    Level 4, High Street Tech Park, Linking Road,<br />
                    Bandra West, Mumbai, Maharashtra - 400050, India.<br />
                    <strong>GSTIN:</strong> 27AAAAA0000A1Z5 | <strong>CIN:</strong> U72900MH2026PTC123456
                  </p>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Mail className="w-4 h-4 text-amber-700" />
                    <span>Official Email Contacts</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <p><strong>General Inquiries:</strong> <a href="mailto:support@megamart.com" className="text-amber-800 underline">support@megamart.com</a></p>
                    <p><strong>Billing & Refunds:</strong> <a href="mailto:billing@megamart.com" className="text-amber-800 underline">billing@megamart.com</a></p>
                    <p><strong>Grievance Officer:</strong> <a href="mailto:grievance@megamart.com" className="text-amber-800 underline">grievance@megamart.com</a></p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Phone className="w-4 h-4 text-amber-700" />
                    <span>Telephonic Helpline</span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    <strong>Toll-Free Support:</strong> +91 (022) 8920-4000<br />
                    <strong>WhatsApp Business:</strong> +91 98765 43210<br />
                    <strong>Operating Hours:</strong> Monday – Saturday (9:00 AM – 7:00 PM IST)
                  </p>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Grievance Response Time</span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    In compliance with the Information Technology (Intermediary Guidelines) Rules, all customer grievances are acknowledged within <strong>24 hours</strong> and resolved within <strong>15 business days</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted SSL Gateway Verification</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition text-xs"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
