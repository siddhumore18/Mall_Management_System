import React, { useState } from 'react';
import { 
  ShoppingBag, Building2, Boxes, LayoutDashboard, Calculator, 
  Headphones, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, 
  ArrowRight, QrCode, CreditCard, Receipt, BarChart3, AlertTriangle, 
  TrendingUp, Users, Clock, Shield, Search, Plus, Trash2, Printer,
  Eye, Check, Zap, Smartphone, ExternalLink, RefreshCcw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import { useRetailStore } from '../store/useRetailStore';

export const InteractiveProductDemo: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role>('CASHIER');

  // Interactive Cashier POS Simulator State
  const [posCart, setPosCart] = useState<Array<{ id: number; name: string; price: number; qty: number; gst: number }>>([
    { id: 1, name: 'Amul Taaza Milk 1L', price: 68.00, qty: 2, gst: 0 },
    { id: 2, name: 'India Gate Basmati 5kg', price: 425.00, qty: 1, gst: 5 },
    { id: 3, name: 'Tata Tea Gold 500g', price: 290.00, qty: 1, gst: 18 }
  ]);
  const [customerPhone] = useState('9820199882');
  const [customerName] = useState('Ananya Sharma');
  const [loyaltyPoints] = useState(340);
  const [tenderMethod, setTenderMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [printedBill, setPrintedBill] = useState(false);

  // Quick scan items
  const handleAddItem = (item: { name: string; price: number; gst: number }) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: Date.now(), ...item, qty: 1 }];
    });
    setPrintedBill(false);
  };

  const handleRemoveItem = (id: number) => {
    setPosCart(prev => prev.filter(i => i.id !== id));
    setPrintedBill(false);
  };

  const cartSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartTax = posCart.reduce((sum, item) => sum + (item.price * item.qty * (item.gst / 100)), 0);
  const cartTotal = cartSubtotal + cartTax;

  // Launch live session with role
  const handleTestDriveRole = (role: Role) => {
    const roleProfiles: Partial<Record<Role, { name: string; email: string; company: string }>> = {
      CASHIER: { name: 'Demo Cashier', email: 'cashier@megamart.com', company: 'MegaMart Flagship Store' },
      TENANT_ADMIN: { name: 'Vikram Mehta (Director)', email: 'admin@megamart.com', company: 'MegaMart Retail Holdings' },
      INVENTORY_CLERK: { name: 'Suresh Kumar (Logistics)', email: 'clerk@megamart.com', company: 'MegaMart Central Warehouse' },
      STORE_MANAGER: { name: 'Pooja Nair (Floor Lead)', email: 'manager@megamart.com', company: 'MegaMart Bandra Branch' },
      ACCOUNTANT: { name: 'CA Rajesh Singhania', email: 'accountant@megamart.com', company: 'MegaMart Finance Corp' },
      CUSTOMER_SERVICE: { name: 'Neha Deshmukh (Desk)', email: 'support@megamart.com', company: 'MegaMart Customer Care' },
      //SUPER_ADMIN: { name: 'Platform Architect', email: 'superadmin@megamart.com', company: 'MegaMart Cloud Networks' }
    };

    const profile = roleProfiles[role] || roleProfiles.CASHIER!;
    const demoUser = {
      id: 999,
      email: profile.email,
      name: profile.name,
      companyName: profile.company,
      role: role,
      tenantId: 101,
      storeId: 1
    };

    useRetailStore.getState().loadTenantData(101, profile.company);
    setAuth(demoUser, 'demo_live_token', {
      id: 101,
      companyName: profile.company,
      status: 'ACTIVE',
      planId: 1,
      planName: 'Enterprise Hyper-Scale',
      planPrice: 39999,
      maxStores: 50,
      maxUsers: 500,
      activeStoresCount: 4,
      activeUsersCount: 18,
      isSubscriptionActive: true
    });
  };

  // Role Metadata for Marketing Strategy
  const rolesConfig: Array<{
    role: Role;
    label: string;
    icon: any;
    tagline: string;
    stat: string;
    roi: string;
  }> = [
    {
      role: 'CASHIER',
      label: 'Cashier & POS',
      icon: ShoppingBag,
      tagline: 'High-speed checkout with phone-first CRM, split tender, and 0.5s thermal bills.',
      stat: '3.2x Faster Checkout',
      roi: 'Reduces peak-hour queue abandonments by 64%'
    },
    {
      role: 'TENANT_ADMIN',
      label: 'Tenant Executive HQ',
      icon: Building2,
      tagline: 'Multi-outlet revenue intelligence, gross margin velocity, and branch provisioning.',
      stat: '₹4.85L+ Daily Pulse',
      roi: 'Real-time chain visibility across 50+ retail branches'
    },
    {
      role: 'INVENTORY_CLERK',
      label: 'Inventory & FEFO',
      icon: Boxes,
      tagline: 'First-Expiry-First-Out perishable audits, stock replenishment alerts, and aisle logistics.',
      stat: '0% Expiry Shrinkage',
      roi: 'Saves ₹2.4 Lakhs monthly in dairy & produce spoilage'
    },
    {
      role: 'STORE_MANAGER',
      label: 'Store Manager',
      icon: LayoutDashboard,
      tagline: 'Shift register float balancing, hourly footfall heatmaps, and staff roster locks.',
      stat: '₹0 Shift Variance',
      roi: 'Guarantees end-of-day cash drawer balance in under 5 mins'
    },
    {
      role: 'ACCOUNTANT',
      label: 'GST Accountant',
      icon: Calculator,
      tagline: 'Automated GSTR-1 & 3B tax ledger breakdown, credit notes, and tender reconciliations.',
      stat: '1-Click GSTR Filing',
      roi: 'Eliminates manual tally entries and CA filing delays'
    },
    {
      role: 'CUSTOMER_SERVICE',
      label: 'Returns & CRM',
      icon: Headphones,
      tagline: 'Instant bill barcode lookup, verified refund authorization, and store wallet vouchers.',
      stat: '45-Sec Return SLA',
      roi: 'Boosts customer loyalty retention score to 98%'
    },
    // {
    //   role: 'SUPER_ADMIN',
    //   label: 'SaaS Super Admin',
    //   icon: ShieldCheck,
    //   tagline: 'Global platform metrics, tenant provisioning, Stripe/Razorpay billing, and health logs.',
    //   stat: '99.99% Uptime SLA',
    //   roi: 'Enterprise multi-tenant isolation with zero data leaks'
    // }
  ];

  const activeRoleData = rolesConfig.find(r => r.role === selectedRole) || rolesConfig[0];

  return (
    <section className="relative z-10 px-3 sm:px-4 md:px-8 py-8 sm:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8 w-full">
      
      {/* Section Header */}
      <div className="text-center space-y-2.5 sm:space-y-3 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 text-amber-900 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-wide shadow-xs max-w-full">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 animate-spin-slow shrink-0" />
          <span className="truncate">INTERACTIVE PRODUCT TOUR & SANDBOX</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-950 tracking-tight">
          Experience MegaMart OS Before You Subscribe
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Test drive the actual user workflows designed for each retail team member. Click the tabs below to preview the live operational consoles.
        </p>
      </div>

      {/* Role Navigation Badges Bar */}
      <div className="relative">
        <div className="flex items-center justify-start md:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 scrollbar-none snap-x touch-pan-x">
          {rolesConfig.map(r => {
            const Icon = r.icon;
            const isActive = selectedRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer border snap-start ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/25 scale-[1.02]'
                    : 'bg-white text-stone-700 border-amber-200/90 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-amber-700'} shrink-0`} />
                <span className="whitespace-nowrap">{r.label}</span>
              </button>
            );
          })}
        </div>
        {/* Subtle fade hint on mobile scroll */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-stone-50 to-transparent md:hidden"></div>
      </div>

      {/* Interactive Browser Window Simulator */}
      <div className="bg-stone-900 rounded-2xl sm:rounded-3xl border-2 border-amber-300/80 shadow-[0_20px_50px_-15px_rgba(217,119,6,0.2)] overflow-hidden w-full">
        
        {/* macOS Style Window Title Bar */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 text-xs text-stone-400">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <span className="ml-2.5 hidden md:inline-block font-mono text-[11px] text-stone-400">MegaMart Enterprise Retail Cloud • Sandbox Simulator</span>
          </div>

          <div className="bg-stone-900 px-2.5 sm:px-4 py-1 rounded-full border border-stone-800 font-mono text-[9px] sm:text-[10px] text-amber-400 flex items-center gap-1.5 min-w-0 max-w-[170px] sm:max-w-xs truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">app.megamart.com/{selectedRole.toLowerCase()}</span>
          </div>

          <button
            onClick={() => handleTestDriveRole(selectedRole)}
            className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
          >
            <span>Launch<span className="hidden sm:inline"> Live App</span></span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </button>
        </div>

        {/* Dynamic Sandbox Workspace Area */}
        <div className="bg-[#FAF8F5] p-3 sm:p-5 md:p-6 min-h-[420px] text-stone-900">
          
          {/* 1. CASHIER POS SIMULATOR */}
          {selectedRole === 'CASHIER' && (
            <div className="space-y-4">
              {/* POS Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    01
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">Register #01 — Express Checkout</h4>
                    <p className="text-[10px] text-stone-500 truncate">Cashier: Demo Staff • Store: Bandra Flagship</p>
                  </div>
                </div>

                {/* Customer CRM Lookup in POS */}
                <div className="flex items-center gap-2 bg-amber-50/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200 text-xs shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span className="font-bold text-amber-950 truncate">{customerName}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 ml-1.5 shrink-0">({customerPhone}) • <strong>{loyaltyPoints} Pts</strong></span>
                </div>
              </div>

              {/* POS Split Screen: Quick Items + Cart */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Left: Quick Barcode Scan Catalog */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider truncate">Fast-Moving Grocery Quick Scan</span>
                    <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full shrink-0">Click to scan</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: 'Amul Taaza Milk 1L', price: 68.00, gst: 0, tag: 'Dairy' },
                      { name: 'India Gate Basmati 5kg', price: 425.00, gst: 5, tag: 'Grains' },
                      { name: 'Tata Tea Gold 500g', price: 290.00, gst: 18, tag: 'Beverage' },
                      { name: 'Britannia Good Day 600g', price: 120.00, gst: 12, tag: 'Snacks' },
                      { name: 'Aashirvaad Atta 10kg', price: 460.00, gst: 5, tag: 'Pantry' },
                      { name: 'Dettol Soap 3x125g', price: 185.00, gst: 18, tag: 'Hygiene' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddItem(item)}
                        className="p-2.5 bg-white hover:bg-amber-50 border border-amber-200/90 rounded-2xl text-left transition hover:border-amber-400 group cursor-pointer shadow-2xs min-w-0"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">{item.tag}</span>
                          <Plus className="w-3.5 h-3.5 text-amber-700 opacity-60 group-hover:opacity-100 transition shrink-0" />
                        </div>
                        <h5 className="font-bold text-stone-900 text-xs mt-1.5 truncate" title={item.name}>{item.name}</h5>
                        <p className="font-mono text-xs font-extrabold text-amber-950 mt-0.5">₹{item.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>

                  {/* Feature Pill in Demo */}
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 sm:p-3 rounded-2xl text-xs text-emerald-900 flex items-start sm:items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
                    <span className="leading-snug"><strong>Sub-Second POS Speed:</strong> Supports physical USB & Bluetooth barcode scanners with zero keyboard latency.</span>
                  </div>
                </div>

                {/* Right: Cart & Tender Drawer */}
                <div className="md:col-span-5 bg-white rounded-2xl border border-amber-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-amber-100 pb-2 mb-2 text-xs">
                      <span className="font-bold text-stone-800">Scanned Items ({posCart.length})</span>
                      <button 
                        onClick={() => setPosCart([])}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear Cart
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {posCart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-100 gap-2">
                          <div className="truncate min-w-0 flex-1">
                            <div className="font-bold text-stone-900 truncate">{item.name}</div>
                            <div className="text-[10px] text-stone-500">₹{item.price} x {item.qty}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-stone-900">₹{(item.price * item.qty).toFixed(2)}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-stone-400 hover:text-rose-600 cursor-pointer p-0.5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bill Total & Tender */}
                  <div className="pt-3 border-t border-amber-200/80 space-y-2.5">
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between text-stone-500">
                        <span>Items Subtotal:</span>
                        <span>₹{cartSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>GST Tax Breakdown:</span>
                        <span>₹{cartTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-950 font-black text-sm pt-1 border-t border-amber-100">
                        <span>Grand Total:</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Tender Selector */}
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                      <button
                        onClick={() => { setTenderMethod('UPI'); }}
                        className={`py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer border min-w-0 ${
                          tenderMethod === 'UPI' ? 'bg-amber-600 text-white border-amber-700' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <QrCode className="w-3 h-3 shrink-0" />
                        <span className="truncate">UPI QR</span>
                      </button>
                      <button
                        onClick={() => { setTenderMethod('CASH'); }}
                        className={`py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer border min-w-0 ${
                          tenderMethod === 'CASH' ? 'bg-amber-600 text-white border-amber-700' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <Receipt className="w-3 h-3 shrink-0" />
                        <span className="truncate">Cash</span>
                      </button>
                      <button
                        onClick={() => { setTenderMethod('CARD'); }}
                        className={`py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer border min-w-0 ${
                          tenderMethod === 'CARD' ? 'bg-amber-600 text-white border-amber-700' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <CreditCard className="w-3 h-3 shrink-0" />
                        <span className="truncate">Card</span>
                      </button>
                    </div>

                    {/* Action Button */}
                    {printedBill ? (
                      <div className="bg-amber-100 border border-amber-300 p-2.5 rounded-xl text-center text-xs font-black text-amber-900 flex items-center justify-center gap-1.5 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Invoice #INV-00482 Printed • Loyalty +15 Pts!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPrintedBill(true)}
                        className="w-full gold-button-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer font-extrabold"
                      >
                        <Printer className="w-3.5 h-3.5 shrink-0" />
                        <span>Complete Tender & Thermal Print</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TENANT ADMIN SIMULATOR */}
          {selectedRole === 'TENANT_ADMIN' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">MegaMart Retail Group HQ — Executive Console</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Live aggregated metrics across 6 operational supermarket outlets in Mumbai & Pune</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    ALL 18 REGISTERS ONLINE
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200/90">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500">Total Group Gross</span>
                  <div className="text-lg sm:text-xl font-black text-amber-950 font-mono mt-0.5">₹4,85,920</div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                    <TrendingUp className="w-3 h-3 shrink-0" /> +18.4%
                  </span>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200/90">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500">Net Profit Margin</span>
                  <div className="text-lg sm:text-xl font-black text-stone-900 font-mono mt-0.5">31.8%</div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block truncate">Healthy retail benchmark</span>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200/90">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500">Bills Generated</span>
                  <div className="text-lg sm:text-xl font-black text-stone-900 font-mono mt-0.5">1,248</div>
                  <span className="text-[10px] text-stone-500 mt-1 block truncate">Avg. Basket ₹389.30</span>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200/90">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500">Active Tenant Plan</span>
                  <div className="text-sm sm:text-base font-black text-amber-800 mt-0.5 truncate">Enterprise Hyper-Scale</div>
                  <span className="text-[10px] text-stone-500 mt-1 block">50 Stores Capacity</span>
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 space-y-3">
                <span className="text-xs font-bold text-stone-800">Branch Revenue Distribution</span>
                <div className="space-y-2.5">
                  {[
                    { branch: 'Bandra West Flagship', sales: '₹1,94,200', pct: '40%' },
                    { branch: 'Andheri Express Mall', sales: '₹1,42,800', pct: '29%' },
                    { branch: 'Thane Central Supermart', sales: '₹98,500', pct: '20%' },
                    { branch: 'Pune Koregaon Mart', sales: '₹50,420', pct: '11%' }
                  ].map((b, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-stone-700">
                        <span className="truncate pr-2">{b.branch}</span>
                        <span className="font-mono font-bold text-stone-900 shrink-0">{b.sales} ({b.pct})</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full" style={{ width: b.pct }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. INVENTORY CLERK SIMULATOR */}
          {selectedRole === 'INVENTORY_CLERK' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">FEFO Logistics & Smart Replenishment Audit</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Automated First-Expiry First-Out inventory protection engine</p>
                </div>
                <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-1 rounded-full shrink-0">
                  12 SKUs Need Reorder
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-amber-200/90 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Product SKU</th>
                        <th className="p-3">Batch & Expiry</th>
                        <th className="p-3">Shelf Stock</th>
                        <th className="p-3">FEFO Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr className="bg-rose-50/50">
                        <td className="p-3 font-bold text-stone-900">Amul Taaza Milk 1L</td>
                        <td className="p-3 font-mono text-[11px] text-rose-700">Batch #901 • Exp: In 2 Days</td>
                        <td className="p-3 font-bold">24 Units</td>
                        <td className="p-3"><span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Urgent Markdown</span></td>
                        <td className="p-3 text-right"><button className="gold-button-primary text-[10px] py-1 px-2.5 rounded-lg shrink-0">Push to POS</button></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-stone-900">Mother Dairy Paneer 200g</td>
                        <td className="p-3 font-mono text-[11px] text-amber-700">Batch #782 • Exp: In 5 Days</td>
                        <td className="p-3 font-bold">48 Units</td>
                        <td className="p-3"><span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Front-Aisle Move</span></td>
                        <td className="p-3 text-right"><button className="gold-btn-secondary text-[10px] py-1 px-2.5 rounded-lg shrink-0">Transfer</button></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-stone-900">Tata Salt 1kg</td>
                        <td className="p-3 font-mono text-[11px] text-stone-600">Batch #110 • Exp: 18 Months</td>
                        <td className="p-3 font-bold">340 Units</td>
                        <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Optimal Stock</span></td>
                        <td className="p-3 text-right"><span className="text-stone-400 text-[10px]">Verified</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. STORE MANAGER SIMULATOR */}
          {selectedRole === 'STORE_MANAGER' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">Shift Register Balancing & Staff Attendance</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Zero-variance cash drawer reconciliation at shift handover</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-3 py-1 rounded-full shrink-0">
                  SHIFT BALANCED (₹0 VARIANCE)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Opening Register Float</span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">₹5,000.00</div>
                  <span className="text-[10px] text-stone-400">Issued at 08:00 AM</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Cash Sales Collected</span>
                  <div className="text-base sm:text-lg font-black text-amber-950 font-mono mt-1">₹43,250.00</div>
                  <span className="text-[10px] text-emerald-600 font-bold">142 Cash Invoices</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-300 bg-amber-50/50">
                  <span className="text-[10px] text-amber-900 uppercase font-bold">Final Drawer Total</span>
                  <div className="text-base sm:text-lg font-black text-amber-950 font-mono mt-1">₹48,250.00</div>
                  <span className="text-[10px] text-emerald-700 font-bold">Verified by Manager PIN</span>
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold text-stone-900 block">Peak Footfall Rush Alert (06:00 PM – 09:00 PM)</span>
                    <span className="text-[10px] sm:text-[11px] text-stone-500">System recommends keeping all 4 express cashier lanes active</span>
                  </div>
                </div>
                <button className="gold-button-primary text-xs py-2 px-3 rounded-xl cursor-pointer w-full sm:w-auto shrink-0">
                  Assign Staff PIN
                </button>
              </div>
            </div>
          )}

          {/* 5. ACCOUNTANT SIMULATOR */}
          {selectedRole === 'ACCOUNTANT' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">GSTR-1 & Financial Ledger Reconciliation</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Automated Indian GST tax classification by HSN / SAC Code</p>
                </div>
                <button className="gold-button-primary text-[10px] py-1.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download GSTR JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">CGST (Central Tax)</span>
                  <div className="text-base font-black text-stone-900 font-mono mt-1">₹21,840.40</div>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">SGST (State Tax)</span>
                  <div className="text-base font-black text-stone-900 font-mono mt-1">₹21,840.40</div>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Total GST Output</span>
                  <div className="text-base font-black text-amber-950 font-mono mt-1">₹43,680.80</div>
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 text-xs space-y-2">
                <span className="font-bold text-stone-800">Tender Settlement Breakup</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="p-2 bg-stone-50 rounded-xl border border-stone-100 text-center">
                    <span className="text-[10px] text-stone-500 block">UPI / QR (Razorpay)</span>
                    <strong className="text-emerald-700 text-xs sm:text-sm">₹2,82,400 (58%)</strong>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-xl border border-stone-100 text-center">
                    <span className="text-[10px] text-stone-500 block">Cards (Stripe POS)</span>
                    <strong className="text-blue-700 text-xs sm:text-sm">₹1,16,600 (24%)</strong>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-xl border border-stone-100 text-center">
                    <span className="text-[10px] text-stone-500 block">Cash Tender</span>
                    <strong className="text-amber-900 text-xs sm:text-sm">₹86,920 (18%)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. CUSTOMER SERVICE SIMULATOR */}
          {selectedRole === 'CUSTOMER_SERVICE' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">Customer Returns & Instant Bill Reprint</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Barcode validation for seamless returns without retail friction</p>
                </div>
                <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-1 rounded-full shrink-0">
                  Customer Desk
                </span>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    defaultValue="INV-000003"
                    className="gold-input flex-1 font-mono text-xs"
                    placeholder="Enter Invoice Number or Customer Mobile..."
                  />
                  <button className="gold-button-primary text-xs px-4 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 shrink-0">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Bill</span>
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-stone-900 gap-1">
                    <span className="truncate">Invoice #INV-000003 • Customer: Siddheshwar More</span>
                    <span className="text-emerald-700 shrink-0">Bill Total: ₹783.00</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Date: 14 Sep 2026, 12:45 PM • Cashier Register #02 • Payment: Razorpay UPI</p>
                  <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-[11px] text-stone-600">Eligible for 7-day return window</span>
                    <button className="gold-button-primary text-[10px] py-1.5 px-3 rounded-lg cursor-pointer w-full sm:w-auto shrink-0">
                      Process Return to Store Credit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. SUPER ADMIN SIMULATOR */}
          {/* {selectedRole === 'SUPER_ADMIN' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">Multi-Tenant SaaS Platform Operations</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">Enterprise health telemetry across all subscribed retail chains</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full shrink-0">
                  PostgreSQL & Cloudflare Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Platform ARR</span>
                  <div className="text-base sm:text-lg font-black text-amber-950 font-mono mt-1">₹1.48 Crore</div>
                  <span className="text-[10px] text-emerald-600 font-bold">+28% MoM Growth</span>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Active Retail Tenants</span>
                  <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">42 Enterprise Chains</div>
                  <span className="text-[10px] text-stone-500">314 Outlets Connected</span>
                </div>
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Database Multi-Tenancy</span>
                  <div className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-1">100% Isolated</div>
                  <span className="text-[10px] text-stone-500">Zero Cross-Tenant Access</span>
                </div>
              </div>
            </div>
          )} */}

        </div>

        {/* Marketing Strategy Callout Bar at Bottom of Window */}
        <div className="bg-amber-950 text-amber-100 px-3.5 sm:px-6 py-3.5 sm:py-4 border-t border-amber-800/80 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 text-center md:text-left w-full md:w-auto">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
              <span className="bg-amber-400 text-amber-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
                {activeRoleData.stat}
              </span>
              <span className="text-xs font-bold text-white leading-tight">{activeRoleData.tagline}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-300/80">{activeRoleData.roi}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleTestDriveRole(selectedRole)}
              className="w-full sm:w-auto gold-button-primary text-xs px-5 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>Instant Test Drive (1-Click)</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};
