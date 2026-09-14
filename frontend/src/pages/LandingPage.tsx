import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRetailStore } from '../store/useRetailStore';
import { authApi } from '../services/api';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { LegalPoliciesModal, PolicyTab } from '../components/LegalPoliciesModal';
import { InteractiveProductDemo } from '../components/InteractiveProductDemo';
import { 
  Building2, Check, ArrowRight, Sparkles, ShoppingBag, 
  Boxes, LayoutDashboard, ShieldCheck, Users, Zap, Award, Star, Globe, Lock, CheckCircle2, ChevronRight,
  TrendingUp, Clock, Receipt, BarChart3, Shield, LogIn, Phone, Mail, MapPin,
  FileText, RefreshCcw, Truck
} from 'lucide-react';

interface Props {
  onNavigateLogin: () => void;
}

export const LandingPage: React.FC<Props> = ({ onNavigateLogin }) => {
  const { setAuth } = useAuthStore();

  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; name: string; priceMonthly: number; priceAnnual: number; maxStores: number; maxUsers: number } | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: PolicyTab }>({ isOpen: false, tab: 'privacy' });

  // Deep linking for Razorpay & Stripe compliance: Supports both hashes (#privacy) and paths (/privacy-policy)
  React.useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const path = window.location.pathname.toLowerCase();
      
      let matchedTab: PolicyTab | null = null;
      if (hash === 'privacy' || path.includes('privacy')) matchedTab = 'privacy';
      else if (hash === 'terms' || path.includes('terms')) matchedTab = 'terms';
      else if (hash === 'refund' || path.includes('refund') || path.includes('cancel')) matchedTab = 'refund';
      else if (hash === 'shipping' || path.includes('shipping') || path.includes('delivery')) matchedTab = 'shipping';
      else if (hash === 'contact' || path.includes('contact') || path.includes('support')) matchedTab = 'contact';

      if (matchedTab) {
        setPolicyModal({ isOpen: true, tab: matchedTab });
      }
    };
    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenSubscribe = (planId: number, planName: string, priceMonthly: number, priceAnnual: number, stores: number, users: number) => {
    setSelectedPlan({ id: planId, name: planName, priceMonthly, priceAnnual, maxStores: stores, maxUsers: users });
    setError('');
  };

  const handleSubscribeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all company registration fields including password.');
      return;
    }
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    setShowPaymentGateway(false);
    setLoading(true);

    const targetCompany = companyName.trim();
    const targetAdmin = adminName.trim();
    const targetEmail = email.trim();
    const targetPassword = password.trim();

    try {
      const res = await authApi.registerTenant({
        companyName: targetCompany,
        adminName: targetAdmin,
        email: targetEmail,
        password: targetPassword,
        planId: selectedPlan.id
      });
      
      const tenantInfo = {
        id: res.user.tenantId,
        companyName: targetCompany,
        status: 'ACTIVE',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly,
        maxStores: selectedPlan.maxStores,
        maxUsers: selectedPlan.maxUsers,
        activeStoresCount: 1,
        activeUsersCount: 1
      };

      try {
        const existingUsers = JSON.parse(localStorage.getItem('megamart_registered_users') || '[]');
        const newUserRecord = {
          email: targetEmail.toLowerCase(),
          password: targetPassword,
          name: targetAdmin,
          companyName: targetCompany,
          role: 'TENANT_ADMIN',
          tenantId: tenantInfo.id,
          storeId: 1,
          tenantInfo: tenantInfo
        };
        localStorage.setItem('megamart_registered_users', JSON.stringify([newUserRecord, ...existingUsers.filter((u: any) => u.email !== targetEmail.toLowerCase())]));
      } catch (e) {}

      useRetailStore.getState().loadTenantData(res.user.tenantId, targetCompany);
      setAuth(res.user, res.token, tenantInfo);
    } catch (err: any) {
      const generatedTenantId = Date.now();
      const mockUser = {
        id: generatedTenantId + 1,
        tenantId: generatedTenantId,
        storeId: 1,
        name: targetAdmin,
        email: targetEmail,
        role: 'TENANT_ADMIN' as const,
        pinCode: '1234'
      };

      const tenantInfo = {
        id: generatedTenantId,
        companyName: targetCompany,
        status: 'ACTIVE',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly,
        maxStores: selectedPlan.maxStores,
        maxUsers: selectedPlan.maxUsers,
        activeStoresCount: 1,
        activeUsersCount: 1
      };

      try {
        const existingUsers = JSON.parse(localStorage.getItem('megamart_registered_users') || '[]');
        const newUserRecord = {
          email: targetEmail.toLowerCase(),
          password: targetPassword,
          name: targetAdmin,
          companyName: targetCompany,
          role: 'TENANT_ADMIN',
          tenantId: generatedTenantId,
          storeId: 1,
          tenantInfo: tenantInfo
        };
        localStorage.setItem('megamart_registered_users', JSON.stringify([newUserRecord, ...existingUsers.filter((u: any) => u.email !== targetEmail.toLowerCase())]));
      } catch (e) {}

      useRetailStore.getState().loadTenantData(generatedTenantId, targetCompany);
      setAuth(mockUser, 'demo_jwt_token', tenantInfo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-900 flex flex-col font-sans select-none relative">
      
      {/* Background Ambient Lighting Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-400/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-amber-300/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* SaaS Header Nav */}
      <nav className="h-16 border-b border-stone-200/80 px-6 md:px-12 flex items-center justify-between bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-black shadow-md shadow-amber-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-amber-950 block leading-none">MEGAMART<span className="text-amber-600">.OS</span></span>
            <span className="text-[10px] font-medium text-stone-500">Enterprise Retail SaaS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateLogin}
            className="text-xs font-bold text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LogIn className="w-4 h-4 text-amber-700" />
            <span>Admin / Staff Login</span>
          </button>
          <button
            onClick={() => handleOpenSubscribe(1, 'Enterprise Hyper-Scale', 39999, 31999, 50, 500)}
            className="gold-button-primary text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <span>Start Free Trial</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-16 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-amber-100/80 border border-amber-300 text-amber-900 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-xs animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse-glow" />
          <span>Next-Gen Supermarket SaaS Platform • Multi-Tenant & Zero-Scroll POS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 max-w-4xl mx-auto leading-[1.12]">
          Hyper-Scale Retail OS for <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900">Modern Supermarkets</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Engineered for high-volume retail chains across India. Seamlessly connects customer-first POS terminals, FEFO stock rotation audit, GST tax ledger, and executive analytics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onNavigateLogin}
            className="w-full sm:w-auto gold-button-primary text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4.5 h-4.5" />
            <span>Login to Account</span>
          </button>
          <button
            onClick={() => handleOpenSubscribe(1, 'Enterprise Hyper-Scale', 39999, 31999, 50, 500)}
            className="w-full sm:w-auto bg-white hover:bg-stone-100 border border-amber-300 text-amber-950 font-bold text-sm px-7 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Deploy Enterprise SaaS Chain</span>
            <ArrowRight className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-xs">
          <div className="gold-card p-4 text-center">
            <div className="text-amber-800 font-extrabold text-xl">₹48.5L+</div>
            <div className="text-stone-500 text-[11px] font-medium mt-1">Daily Sales Processed</div>
          </div>
          <div className="gold-card p-4 text-center">
            <div className="text-amber-800 font-extrabold text-xl">50+</div>
            <div className="text-stone-500 text-[11px] font-medium mt-1">Active Supermarket Outlets</div>
          </div>
          <div className="gold-card p-4 text-center">
            <div className="text-amber-800 font-extrabold text-xl">&lt; 50ms</div>
            <div className="text-stone-500 text-[11px] font-medium mt-1">POS Barcode Scan Speed</div>
          </div>
          <div className="gold-card p-4 text-center">
            <div className="text-amber-800 font-extrabold text-xl">99.99%</div>
            <div className="text-stone-500 text-[11px] font-medium mt-1">SaaS Uptime SLA</div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-950">Architected for Every Retail Stakeholder</h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">7 completely isolated security boundaries ensuring zero-trust data separation with role-tailored dashboards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gold-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Platform Super Admin</h3>
            <p className="text-xs text-stone-600 leading-relaxed">SaaS control center tracking platform MRR/ARR, tenant directory, subscription tiers, and system health without viewing tenant private transaction data.</p>
          </div>

          <div className="gold-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Tenant HQ Admin</h3>
            <p className="text-xs text-stone-600 leading-relaxed">Aggregated performance across physical supermarket locations, outlet revenue analytics, user provisioning, global catalog, and GST compliance.</p>
          </div>

          <div className="gold-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Customer-First POS Cashier</h3>
            <p className="text-xs text-stone-600 leading-relaxed">Real-life cashier workflow: mobile lookup first, instant customer registration, history logging, discount engine, and digital thermal receipt printing.</p>
          </div>
        </div>
      </section>

      {/* Interactive Live Product Tour & Role Simulator Sandbox */}
      <InteractiveProductDemo />

      {/* Subscription Plans Section */}
      <section className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <span className="gold-badge">SaaS Subscriptions</span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-950">Transparent Pricing for Supermarket Chains</h2>
          
          <div className="flex items-center justify-center gap-3 pt-3">
            <span className={`text-xs font-semibold ${!isAnnual ? 'text-amber-950' : 'text-stone-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-amber-200 p-1 flex items-center transition-colors cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-full bg-amber-700 transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-xs font-semibold ${isAnnual ? 'text-amber-950' : 'text-stone-500'}`}>Annual (Save 20%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="gold-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900 text-base">Single Store Starter</h3>
                <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-700 px-2 py-0.5 rounded">1 Store</span>
              </div>
              <div className="text-3xl font-black text-amber-950">
                ₹{isAnnual ? '7,999' : '9,999'} <span className="text-xs font-normal text-stone-500">/ mo</span>
              </div>
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Up to 5 Cashier Registers</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Customer CRM & Loyalty</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Basic FEFO Inventory</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> GST Tax Filing Reports</li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenSubscribe(3, 'Single Store Starter', 9999, 7999, 1, 10)}
              className="mt-6 w-full gold-button-primary text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Choose Plan
            </button>
          </div>

          {/* Growth Chain Plan */}
          <div className="gold-card p-6 flex flex-col justify-between border-2 border-amber-500/80 shadow-md relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-extrabold text-[10px] uppercase px-3 py-0.5 rounded-full shadow-xs">Most Popular</div>
            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900 text-base">Growth Chain</h3>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Up to 10 Stores</span>
              </div>
              <div className="text-3xl font-black text-amber-950">
                ₹{isAnnual ? '19,999' : '24,999'} <span className="text-xs font-normal text-stone-500">/ mo</span>
              </div>
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Multi-Store Outlet Manager</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Inter-Store Stock Transfers</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Daily Cash Reconciliation</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Staff Roster & PIN Security</li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenSubscribe(2, 'Growth Chain', 24999, 19999, 10, 50)}
              className="mt-6 w-full gold-button-primary text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Choose Plan
            </button>
          </div>

          {/* Hyper-Scale Enterprise Plan */}
          <div className="gold-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900 text-base">Enterprise Chain</h3>
                <span className="text-[10px] font-bold uppercase bg-amber-900 text-amber-100 px-2 py-0.5 rounded">Unlimited Stores</span>
              </div>
              <div className="text-3xl font-black text-amber-950">
                ₹{isAnnual ? '39,999' : '49,999'} <span className="text-xs font-normal text-stone-500">/ mo</span>
              </div>
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Dedicated SaaS Account Manager</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Custom GST & ERP Integrations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Unlimited Store Registers</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> 99.99% SLA Guarantee</li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenSubscribe(1, 'Enterprise Chain', 49999, 39999, 100, 1000)}
              className="mt-6 w-full gold-button-primary text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Choose Plan
            </button>
          </div>
        </div>
      </section>

      {/* Registration Modal / Inline Form if Plan Selected */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="gold-badge">Step 1 of 2 • Account Registration</span>
              <h3 className="text-lg font-black text-amber-950">Subscribe to {selectedPlan.name}</h3>
              <p className="text-xs text-stone-500">Amount due today: <span className="font-extrabold text-amber-900">₹{(isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly).toLocaleString()}</span></p>
            </div>

            <form onSubmit={handleSubscribeFormSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Company / Mall Chain Name</label>
                <input
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Phoenix Hypermarket Ltd"
                  className="gold-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Admin Full Name</label>
                <input
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="gold-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Work Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@phoenixmall.com"
                  className="gold-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Account Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="gold-input w-full text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full gold-button-primary text-xs py-3 rounded-xl cursor-pointer font-bold flex items-center justify-center gap-2 mt-4"
              >
                <span>Proceed to Payment Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && selectedPlan && (
        <PaymentGatewayModal
          isOpen={true}
          amount={isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly}
          description={`Subscription payment for ${selectedPlan.name}`}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentGateway(false)}
        />
      )}

      {/* Business-Ready Enterprise Compliance Footer */}
      <footer className="mt-auto border-t border-amber-200/80 bg-white text-stone-600 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Company Profile & Trust Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-stone-900 tracking-tight">MEGAMART<span className="text-amber-600">.OS</span></span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Enterprise Multi-Tenant Supermarket & Hypermarket Retail Operating System. Fully integrated with automated GST accounting, barcode scanning & PCI-DSS payment gateways.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3 h-3" /> PCI-DSS Level 1
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded-md">
                <Lock className="w-3 h-3" /> 256-Bit TLS SSL
              </span>
            </div>
          </div>

          {/* Column 2: Platform Capabilities */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Retail Solutions</h4>
            <ul className="space-y-2 text-[11px] text-stone-600">
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-600" /> High-Throughput POS Terminal</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-600" /> Multi-Store Inventory & Transfers</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-600" /> Customer Loyalty & Directory</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-600" /> Automated GST Tax Ledgers</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-amber-600" /> FEFO Expiry Waste Prevention</li>
            </ul>
          </div>

          {/* Column 3: Mandatory Legal & Compliance (Razorpay & Stripe Ready) */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Legal & Compliance</h4>
            <p className="text-[10px] text-amber-800 font-medium">Click any document to inspect official policy:</p>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button 
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'privacy' })}
                  className="text-stone-600 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
                  className="text-stone-600 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Terms & Conditions (ToS)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'refund' })}
                  className="text-stone-600 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer font-semibold text-emerald-800"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cancellation & Refund Policy</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'shipping' })}
                  className="text-stone-600 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Shipping & Delivery Policy</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Merchant Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">Merchant Support</h4>
            <div className="space-y-2 text-[11px] text-stone-600">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>Level 4, High Street Tech Park, Bandra West, Mumbai 400050</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <a href="mailto:support@megamart.com" className="hover:text-amber-900 hover:underline">support@megamart.com</a>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>+91 (022) 8920-4000</span>
              </p>
              <button
                onClick={() => setPolicyModal({ isOpen: true, tab: 'contact' })}
                className="mt-2 w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Contact & Grievance Desk</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-200 py-4 px-6 bg-stone-50/70 text-center text-[11px] text-stone-500 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <p>© 2026 MegaMart Retail Technologies Pvt. Ltd. All rights reserved. GSTIN: 27AAAAA0000A1Z5.</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-stone-400">Accepted Gateways:</span>
            <span className="font-bold text-stone-700">Razorpay (UPI / NetBanking)</span>
            <span>•</span>
            <span className="font-bold text-stone-700">Stripe (Visa / Mastercard)</span>
          </div>
        </div>
      </footer>

      {/* Mandatory Legal Policy Modal */}
      <LegalPoliciesModal
        isOpen={policyModal.isOpen}
        onClose={() => setPolicyModal(prev => ({ ...prev, isOpen: false }))}
        initialTab={policyModal.tab}
      />
    </div>
  );
};
