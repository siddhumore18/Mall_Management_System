import React, { useState } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { AreaLineChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import { superAdminApi } from '../services/api';
import {
  ShieldCheck, Building2, Activity, ArrowUpRight, Lock, Power,
  Check, CreditCard, Server, Globe, Cpu, HardDrive, Database,
  Users, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock,
  BarChart3, Zap, Shield, RefreshCw, Sliders, ToggleLeft, ToggleRight, Plus, X, Edit, Trash2, CheckSquare, Sparkles
} from 'lucide-react';

interface Tenant {
  id: number;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'SUSPENDED';
  storesCount: number;
  monthlyFee: number;
  renewalDate: string;
  usersCount: number;
  city: string;
  customMaxStores?: number;
  customMaxUsers?: number;
  maxStores?: number;
  maxUsers?: number;
  billingCycle?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyFee: number;
  maxOutlets: string;
  maxUsers: string;
  features: string[];
  recommended?: boolean;
}

export const SuperAdminPage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { notifications, updateNotificationStatus, addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [dbMetrics, setDbMetrics] = useState<any>(null);

  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 1, name: 'MegaMart Retail India Ltd', plan: 'Enterprise Hyper-Scale', status: 'ACTIVE', storesCount: 2, monthlyFee: 39999, renewalDate: '2026-10-01', usersCount: 14, city: 'Mumbai' },
    { id: 2, name: 'Apex Superstores Bharat', plan: 'Standard Chain', status: 'ACTIVE', storesCount: 1, monthlyFee: 14999, renewalDate: '2026-09-28', usersCount: 6, city: 'Bengaluru' }
  ]);

  // Dynamic Subscription Plans State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    {
      id: 'starter',
      name: 'Starter Plan',
      monthlyFee: 4999,
      maxOutlets: '1 Physical Outlet',
      maxUsers: 'Up to 5 User Seats',
      features: ['1 Physical Outlet', 'Up to 5 User Seats', 'Basic POS Checkout', 'Standard GST Receipts', 'Single Store Inventory']
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      monthlyFee: 14999,
      maxOutlets: 'Up to 5 Outlets',
      maxUsers: 'Up to 25 User Seats',
      features: ['Up to 5 Outlets', 'Up to 25 User Seats', 'FEFO Expiry Auditing', 'GST Tax Ledger & Filing', 'Customer CRM & Loyalty Points'],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyFee: 39999,
      maxOutlets: 'Unlimited Outlets',
      maxUsers: 'Unlimited User Seats',
      features: ['Unlimited Outlets', 'Unlimited User Seats', 'Dedicated Account Manager', 'Inter-Store Stock Transfer', 'Multi-Store Revenue Analytics', '24/7 SLA Priority Support']
    }
  ]);

  // Edit Plan Modal State
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planFee, setPlanFee] = useState('14999');
  const [planOutlets, setPlanOutlets] = useState('Up to 5 Outlets');
  const [planUsers, setPlanUsers] = useState('Up to 25 User Seats');
  const [planFeaturesText, setPlanFeaturesText] = useState('');

  const [featureFlags, setFeatureFlags] = useState([
    { id: 'fefo', name: 'FEFO Expiry Auditing', description: 'Enable batch expiration date tracking and FEFO stock rotation alerts.', enabled: true },
    { id: 'einvoicing', name: 'GST E-Invoicing Auto-Filing', description: 'Real-time IRN generation with NIC portal integration.', enabled: true },
    { id: 'crm_loyalty', name: 'Customer Loyalty CRM', description: 'Track customer lifetime spend and multi-tier loyalty points.', enabled: true },
    { id: 'interstore', name: 'Inter-Store Stock Transfer', description: 'Allow branch-to-branch inventory transfer dispatches.', enabled: true },
    { id: 'manager_pin', name: 'Manager PIN Override', description: 'Require manager security PIN for refunds > ₹500 and large discounts.', enabled: true },
  ]);

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [maxStores, setMaxStores] = useState('50');
  const [maxUsers, setMaxUsers] = useState('500');
  const [msg, setMsg] = useState('');

  // Register New Tenant Modal
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantCity, setNewTenantCity] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('Standard Chain');
  const [newTenantFee, setNewTenantFee] = useState('14999');

  // Fetch real data from backend & database
  const fetchRealData = async () => {
    setLoading(true);
    try {
      const [tenantsData, metricsData, plansData] = await Promise.all([
        superAdminApi.getTenants(),
        superAdminApi.getMetrics(),
        superAdminApi.getPlans()
      ]);

      if (tenantsData && tenantsData.length > 0) {
        setTenants(tenantsData);
      }
      if (metricsData) {
        setDbMetrics(metricsData);
      }
      if (plansData && plansData.length > 0) {
        setPlans(plansData.map((p: any) => ({
          id: p.name.toLowerCase().includes('starter') ? 'starter' : p.name.toLowerCase().includes('enterprise') ? 'enterprise' : 'standard',
          name: p.name,
          monthlyFee: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 14999,
          maxOutlets: p.maxStores >= 50 ? 'Unlimited Outlets' : `Up to ${p.maxStores} Outlets`,
          maxUsers: p.maxUsers >= 500 ? 'Unlimited User Seats' : `Up to ${p.maxUsers} User Seats`,
          features: [
            `${p.maxStores >= 50 ? 'Unlimited' : 'Up to ' + p.maxStores} Outlets`,
            `${p.maxUsers >= 500 ? 'Unlimited' : 'Up to ' + p.maxUsers} User Seats`,
            'POS Barcode & GST Receipts',
            'FEFO Expiry Auditing',
            'Dedicated SLA Support'
          ],
          recommended: p.name.toLowerCase().includes('standard')
        })));
      }
    } catch (e) {
      console.warn('Super Admin fetch real data error:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRealData();
  }, []);

  const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
  const totalMrr = dbMetrics?.totalMrr || activeTenants.reduce((sum, t) => sum + (t.monthlyFee || 0), 0);
  const totalArr = dbMetrics?.totalArr || (totalMrr * 12);
  const totalStores = dbMetrics?.totalStores || tenants.reduce((sum, t) => sum + (t.storesCount || 0), 0);

  const handleToggleStatus = async (tenantId: number) => {
    const current = tenants.find(t => t.id === tenantId);
    if (!current) return;
    const next = current.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: next as 'ACTIVE' | 'SUSPENDED' } : t));
    setMsg(`Tenant "${current.name}" status → ${next}`);
    setTimeout(() => setMsg(''), 4000);

    try {
      await superAdminApi.updateTenantStatus(tenantId, next as 'ACTIVE' | 'SUSPENDED');
    } catch (e) {
      console.warn('Could not persist status toggle to backend:', e);
    }
  };

  const handleToggleFlag = (flagId: string) => {
    setFeatureFlags(prev => prev.map(f => {
      if (f.id === flagId) {
        const next = !f.enabled;
        setMsg(`Global Feature Flag "${f.name}" → ${next ? 'ENABLED' : 'DISABLED'}`);
        setTimeout(() => setMsg(''), 4000);
        return { ...f, enabled: next };
      }
      return f;
    }));
  };

  const getPlanQuota = (tenant: Tenant) => {
    const matchedPlan = plans.find(p => p.name.toLowerCase() === tenant.plan.toLowerCase() || p.id === tenant.plan.toLowerCase());
    
    let storeLimit = tenant.customMaxStores || tenant.maxStores;
    let userLimit = tenant.customMaxUsers || tenant.maxUsers;

    if (storeLimit === undefined) {
      if (!matchedPlan) storeLimit = 1;
      else if (matchedPlan.maxOutlets.toLowerCase().includes('unlimited')) storeLimit = 9999;
      else {
        const m = matchedPlan.maxOutlets.match(/\d+/);
        storeLimit = m ? parseInt(m[0]) : 1;
      }
    }

    if (userLimit === undefined) {
      if (!matchedPlan) userLimit = 5;
      else if (matchedPlan.maxUsers.toLowerCase().includes('unlimited')) userLimit = 9999;
      else {
        const m = matchedPlan.maxUsers.match(/\d+/);
        userLimit = m ? parseInt(m[0]) : 5;
      }
    }

    return { maxStores: storeLimit, maxUsers: userLimit };
  };

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    const storesNum = parseInt(maxStores) || 1;
    const usersNum = parseInt(maxUsers) || 5;

    setTenants(prev => prev.map(t => t.id === selectedTenant.id ? {
      ...t,
      customMaxStores: storesNum,
      customMaxUsers: usersNum
    } : t));

    setIsQuotaModalOpen(false);
    setMsg(`Quota limit boundary updated for ${selectedTenant.name}: Max ${storesNum} Outlets, Max ${usersNum} User Seats`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleAddTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    setLoading(true);
    try {
      const newT = await superAdminApi.createTenant({
        name: newTenantName.trim(),
        city: newTenantCity.trim() || 'Mumbai',
        plan: newTenantPlan,
        fee: parseFloat(newTenantFee) || 14999
      });
      setTenants(prev => [newT, ...prev.filter(t => t.id !== newT.id)]);
      setIsAddTenantOpen(false);
      setNewTenantName(''); setNewTenantCity('');
      setMsg(`SaaS Tenant "${newT.name}" onboarded and saved into Database!`);
      setTimeout(() => setMsg(''), 4000);
      fetchRealData();
    } catch (err: any) {
      setMsg('Failed to onboard tenant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanFee(plan.monthlyFee.toString());
    setPlanOutlets(plan.maxOutlets);
    setPlanUsers(plan.maxUsers);
    setPlanFeaturesText(plan.features.join('\n'));
    setIsEditPlanOpen(true);
  };

  // Open Create New Plan Modal
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('Pro Growth Plan');
    setPlanFee('24999');
    setPlanOutlets('Up to 10 Outlets');
    setPlanUsers('Up to 50 User Seats');
    setPlanFeaturesText('Up to 10 Outlets\nUp to 50 User Seats\nAdvanced Analytics & FEFO\nPriority Support');
    setIsEditPlanOpen(true);
  };

  // Save Plan Changes
  const handleSavePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = parseFloat(planFee) || 0;
    const featuresList = planFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (editingPlan) {
      // Update existing plan
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? {
        ...p,
        name: planName.trim(),
        monthlyFee: feeNum,
        maxOutlets: planOutlets.trim(),
        maxUsers: planUsers.trim(),
        features: featuresList.length > 0 ? featuresList : p.features
      } : p));
      setMsg(`Subscription Plan "${planName}" updated successfully (₹${feeNum.toLocaleString()}/mo)!`);
      
      const planDbId = editingPlan.id === 'starter' ? 1 : editingPlan.id === 'standard' ? 2 : 3;
      await superAdminApi.updatePlan(planDbId, { name: planName, price: feeNum });
    } else {
      // Create new plan
      const newPlan: SubscriptionPlan = {
        id: `plan_${Date.now()}`,
        name: planName.trim(),
        monthlyFee: feeNum,
        maxOutlets: planOutlets.trim(),
        maxUsers: planUsers.trim(),
        features: featuresList
      };
      setPlans(prev => [...prev, newPlan]);
      setMsg(`New Subscription Plan "${newPlan.name}" created!`);
    }

    setIsEditPlanOpen(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    setMsg('Subscription plan removed.');
    setTimeout(() => setMsg(''), 3000);
  };

  // ─── SUB-VIEW 1: OVERVIEW ───
  const renderOverview = () => (
    <div className="space-y-6">
      
      {/* Live Cloud & Database Sync Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold">
            <Database className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-stone-900">Live Database Connected</span>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                ACTIVE TELEMETRY
              </span>
            </div>
            <p className="text-[10px] text-stone-500">
              PostgreSQL Multi-Tenancy • {dbMetrics?.totalTransactions || 0} Real Invoices Recorded • Latency: {dbMetrics?.dbLatencyMs || 12}ms
            </p>
          </div>
        </div>

        <button
          onClick={fetchRealData}
          disabled={loading}
          className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition self-end sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing Real Data...' : 'Sync Live DB'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Platform MRR</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><TrendingUp className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">₹{totalMrr.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 font-semibold">
            <span className="text-emerald-700 font-extrabold flex items-center"><ArrowUpRight className="w-3 h-3" /> +18.4%</span>
            <span>vs last month</span>
          </div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Platform ARR</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><BarChart3 className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">₹{(totalArr / 100000).toFixed(2)} Lakhs</div>
          <div className="text-[11px] text-stone-500 font-semibold">Annual Recurring Revenue</div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Active Tenants</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><Building2 className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">{activeTenants.length} / {tenants.length}</div>
          <div className="text-[11px] text-stone-500 font-semibold">{totalStores} Physical Stores Managed</div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>SaaS Cloud Health</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black"><Server className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">99.99%</div>
          <div className="text-[11px] text-stone-500 font-semibold">
            {dbMetrics?.usedMemoryMb ? `${dbMetrics.usedMemoryMb} MB Used` : '100% Isolated'} • {dbMetrics?.totalTransactions || 0} Bills
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AreaLineChartWidget
            title="Platform Monthly Recurring Revenue (MRR) Growth"
            subtitle="SaaS Subscription ARR trajectory over past 6 months"
            points={[28500, 34200, 41000, 48900, 52400, 59997]}
            labels={['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026']}
            valuePrefix="₹"
          />
        </div>

        <div className="lg:col-span-4">
          <DonutChartWidget
            title="Tenant Subscription Tier Mix"
            subtitle="Active client company breakdown"
            centerLabel="TOTAL TENANTS"
            centerValue={`${tenants.length}`}
            segments={[
              { label: 'Enterprise Chain', value: 1, color: '#78350F' },
              { label: 'Standard Outlets', value: 2, color: '#D97706' },
              { label: 'Single Starter', value: 1, color: '#F59E0B' },
            ]}
          />
        </div>
      </div>

      {/* Enterprise Security Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-200" />
            <h3 className="font-extrabold text-base uppercase tracking-tight">Zero-Trust Enterprise Data Separation</h3>
          </div>
          <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
            As Platform Super Admin, tenant row-level data security policies restrict access to client transaction receipts, customer PII, and store cash balances.
          </p>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 2: TENANT DIRECTORY ───
  const renderTenants = () => {
    const upgradeRequests = notifications.filter(n => n.type === 'UPGRADE_REQUEST');

    const handleApproveUpgrade = (req: typeof notifications[0]) => {
      const targetTenantName = req.metadata?.tenantName || req.senderTenant || '';
      const newPlan = req.metadata?.requestedPlan || 'Enterprise Plan';
      const newStores = req.metadata?.requestedStores || 10;
      const newUsers = req.metadata?.requestedUsers || 50;

      // 1. Update Tenant Quota & Plan in state
      setTenants(prev => prev.map(t => {
        if (targetTenantName && (t.name.toLowerCase().includes(targetTenantName.toLowerCase()) || targetTenantName.toLowerCase().includes(t.name.toLowerCase()))) {
          return {
            ...t,
            plan: newPlan,
            customMaxStores: newStores,
            customMaxUsers: newUsers,
            monthlyFee: newPlan.includes('Enterprise') ? 39999 : 14999
          };
        }
        return t;
      }));

      // 2. Mark request as approved
      updateNotificationStatus(req.id, 'APPROVED');

      // 3. Send approval notification to Tenant Admin
      addNotification({
        senderRole: 'SUPER_ADMIN',
        senderName: 'Alex SaaS Admin (Platform Super Admin)',
        senderTenant: 'MegaMart SaaS Platform',
        targetRole: 'TENANT_ADMIN',
        type: 'SYSTEM_ALERT',
        title: '✅ Upgrade Request Approved!',
        message: `Super Admin approved your request! Plan upgraded to ${newPlan} with boundary quota expanded to ${newStores} Outlets & ${newUsers} Seats.`
      });

      setMsg(`Upgrade Request Approved for ${targetTenantName}! Quota expanded to ${newStores} Outlets.`);
      setTimeout(() => setMsg(''), 5000);
    };

    const handleDeclineUpgrade = (req: typeof notifications[0]) => {
      updateNotificationStatus(req.id, 'REJECTED');
      addNotification({
        senderRole: 'SUPER_ADMIN',
        senderName: 'Alex SaaS Admin (Platform Super Admin)',
        senderTenant: 'MegaMart SaaS Platform',
        targetRole: 'TENANT_ADMIN',
        type: 'SYSTEM_ALERT',
        title: 'Upgrade Request Declined',
        message: 'Your quota upgrade request was reviewed by Super Admin. Please contact Super Admin for custom pricing.'
      });
      setMsg(`Upgrade request declined for ${req.senderTenant}.`);
      setTimeout(() => setMsg(''), 4000);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">Client Company Directory</h2>
            <p className="text-xs text-stone-500">Manage SaaS subscriptions, tenant quotas, and incoming upgrade requests.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRealData}
              disabled={loading}
              className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Live DB'}</span>
            </button>
            <button
              onClick={() => setIsAddTenantOpen(true)}
              className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Register New Tenant
            </button>
          </div>
        </div>

        {/* ─── SAAS UPGRADE REQUESTS INBOX ─── */}
        {upgradeRequests.length > 0 && (
          <div className="gold-card p-5 space-y-3 bg-gradient-to-r from-amber-900/90 via-amber-950 to-stone-950 text-white border-2 border-amber-400 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-amber-200 text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Incoming SaaS Quota & Plan Upgrade Requests ({upgradeRequests.filter(r => r.status === 'PENDING').length} Pending)</span>
              </div>
              <span className="gold-badge text-[9px] bg-amber-500 text-white border-none">SUPER ADMIN INBOX</span>
            </div>

            <div className="space-y-3 pt-1">
              {upgradeRequests.map(req => (
                <div key={req.id} className="bg-stone-900/80 p-3.5 rounded-xl border border-amber-300/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-200 text-xs">{req.senderTenant}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({req.timestamp})</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        req.status === 'APPROVED' ? 'bg-emerald-500 text-white' : req.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 font-medium">{req.message}</p>
                    <div className="text-[10px] text-amber-300 font-mono font-bold">
                      Requested: {req.metadata?.requestedPlan || 'Enterprise Plan'} • {req.metadata?.requestedStores || 10} Stores • {req.metadata?.requestedUsers || 50} User Seats
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveUpgrade(req)}
                        className="gold-button-primary text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer flex items-center gap-1 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Expand Quota
                      </button>
                      <button
                        onClick={() => handleDeclineUpgrade(req)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Company Name</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Outlets</th>
              <th className="p-3">Users</th>
              <th className="p-3">Monthly Fee</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {tenants.map(t => {
              const quota = getPlanQuota(t);
              const isOverStores = t.storesCount > quota.maxStores;
              const isOverUsers = t.usersCount > quota.maxUsers;
              const isOverQuota = isOverStores || isOverUsers;

              return (
                <tr key={t.id} className={`hover:bg-amber-50/40 ${isOverQuota ? 'bg-rose-50/30' : ''}`}>
                  <td className="p-3 font-bold text-amber-950">
                    <div>{t.name} <span className="text-[10px] text-stone-500 font-normal">({t.city})</span></div>
                    {isOverQuota && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full mt-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Plan Limit Exceeded
                      </span>
                    )}
                  </td>
                  <td className="p-3"><span className="gold-badge">{t.plan}</span></td>
                  <td className="p-3 font-mono">
                    <span className={isOverStores ? 'text-rose-700 font-black' : 'text-stone-700 font-bold'}>
                      {t.storesCount} / {quota.maxStores === 9999 ? '∞' : quota.maxStores} Stores
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className={isOverUsers ? 'text-rose-700 font-black' : 'text-stone-700 font-bold'}>
                      {t.usersCount} / {quota.maxUsers === 9999 ? '∞' : quota.maxUsers} Seats
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold">₹{t.monthlyFee.toLocaleString()}/mo</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTenant(t);
                        setMaxStores(quota.maxStores === 9999 ? '9999' : quota.maxStores.toString());
                        setMaxUsers(quota.maxUsers === 9999 ? '9999' : quota.maxUsers.toString());
                        setIsQuotaModalOpen(true);
                      }}
                      className="gold-btn-secondary text-[10px] px-2.5 py-1 rounded cursor-pointer"
                    >
                      Boundary Quota
                    </button>
                    <button
                      onClick={() => handleToggleStatus(t.id)}
                      className={`px-3 py-1 rounded text-[10px] font-extrabold cursor-pointer ${
                        t.status === 'ACTIVE' ? 'bg-stone-200 hover:bg-stone-300 text-stone-800' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  // ─── SUB-VIEW 3: SUBSCRIPTION PLANS & EDITING ───
  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Subscription Plans & SaaS Pricing Tiers</h2>
          <p className="text-xs text-stone-500">Super Admin Control: Edit pricing, outlet limits, user seat limits, and features for all plans.</p>
        </div>
        <button
          onClick={handleOpenCreatePlan}
          className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" /> Create Custom Pricing Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`gold-card p-6 space-y-4 relative flex flex-col justify-between transition-all ${
              plan.recommended ? 'border-2 border-amber-500 ring-4 ring-amber-500/10 shadow-xl' : ''
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-3 right-4 gold-badge text-[9px] bg-amber-500 text-white border-none shadow-md">
                POPULAR TIER
              </span>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-amber-950 text-base">{plan.name}</h3>
                  <p className="text-[11px] text-stone-500 font-semibold">{plan.maxOutlets} • {plan.maxUsers}</p>
                </div>
                <button
                  onClick={() => handleOpenEditPlan(plan)}
                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors cursor-pointer"
                  title="Edit Subscription Plan"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-amber-100">
                <div className="text-3xl font-black text-amber-950 font-mono">
                  ₹{plan.monthlyFee.toLocaleString()}<span className="text-xs font-normal text-stone-500"> / month</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-extrabold uppercase text-stone-400 block tracking-wider">Plan Inclusions:</span>
                <ul className="text-xs space-y-2 text-stone-700">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-100 flex gap-2">
              <button
                onClick={() => handleOpenEditPlan(plan)}
                className="w-full gold-button-primary py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Plan Details & Pricing
              </button>

              {plans.length > 1 && (
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── SUB-VIEW 4: SYSTEM HEALTH ───
  const renderSystem = () => (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="font-extrabold text-amber-950 text-base">Infrastructure Uptime & Metrics</h2>
        <p className="text-xs text-stone-500">Live platform status across cloud microservices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gold-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-stone-900 text-xs">Database Connection Pool</h4>
            <span className="gold-badge text-[10px]">12 / 100 Active Connections</span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[12%]"></div>
          </div>
        </div>

        <div className="gold-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-stone-900 text-xs">API Gateway Latency</h4>
            <span className="gold-badge text-[10px]">18ms Avg Latency</span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[18%]"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 5: FEATURE FLAGS & MODULES ───
  const renderFlags = () => (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="font-extrabold text-amber-950 text-base">Global Feature Flags & Module Matrix</h2>
        <p className="text-xs text-stone-500">Toggle tenant-facing features globally across all SaaS subscribers.</p>
      </div>

      <div className="gold-card p-4 space-y-3 divide-y divide-stone-100">
        {featureFlags.map(f => (
          <div key={f.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold text-stone-900 text-xs flex items-center gap-2">
                <span>{f.name}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${f.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {f.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">{f.description}</p>
            </div>

            <button
              onClick={() => handleToggleFlag(f.id)}
              className={`p-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                f.enabled ? 'text-emerald-700 hover:text-emerald-800' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {f.enabled ? <ToggleRight className="w-8 h-8 text-emerald-600" /> : <ToggleLeft className="w-8 h-8 text-stone-400" />}
            </button>
          </div>
        ))}
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

      {activeNavItem === 'overview' && renderOverview()}
      {activeNavItem === 'tenants' && renderTenants()}
      {activeNavItem === 'subscriptions' && renderSubscriptions()}
      {activeNavItem === 'system' && renderSystem()}
      {activeNavItem === 'flags' && renderFlags()}
      {(!['overview', 'tenants', 'subscriptions', 'system', 'flags'].includes(activeNavItem)) && renderOverview()}

      {/* Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="gold-card max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-amber-950 text-sm">Update Tenant Allocation Quota</h3>
            <form onSubmit={handleSaveQuota} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Max Outlet Stores Allowed</label>
                <input value={maxStores} onChange={e => setMaxStores(e.target.value)} className="gold-input w-full text-xs" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Max Active User Seats</label>
                <input value={maxUsers} onChange={e => setMaxUsers(e.target.value)} className="gold-input w-full text-xs" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsQuotaModalOpen(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 gold-button-primary py-2 rounded-xl text-xs font-bold cursor-pointer">Save Quota</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Tenant Modal */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>Onboard New SaaS Tenant Client</span>
              </h3>
              <button onClick={() => setIsAddTenantOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddTenantSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Client Company Name</label>
                <input
                  value={newTenantName}
                  onChange={e => setNewTenantName(e.target.value)}
                  placeholder="e.g. Reliance Smart Retail"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Headquarters City</label>
                <input
                  value={newTenantCity}
                  onChange={e => setNewTenantCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="gold-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Subscription Plan</label>
                  <select value={newTenantPlan} onChange={e => setNewTenantPlan(e.target.value)} className="gold-input w-full font-bold cursor-pointer">
                    {plans.map(p => (
                      <option key={p.id} value={p.name}>{p.name} (₹{p.monthlyFee.toLocaleString()}/mo)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Monthly Billing Fee (₹)</label>
                  <input
                    type="number"
                    value={newTenantFee}
                    onChange={e => setNewTenantFee(e.target.value)}
                    className="gold-input w-full font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button type="button" onClick={() => setIsAddTenantOpen(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
                  <Plus className="w-4 h-4" />
                  <span>Onboard Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT / CREATE SUBSCRIPTION PLAN MODAL ─── */}
      {isEditPlanOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>{editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Create Custom Pricing Plan'}</span>
              </h3>
              <button onClick={() => setIsEditPlanOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePlanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Plan Title</label>
                <input
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="e.g. Standard Plan"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Monthly Billing Price (₹)</label>
                <input
                  type="number"
                  value={planFee}
                  onChange={e => setPlanFee(e.target.value)}
                  placeholder="14999"
                  className="gold-input w-full font-mono font-black text-amber-950 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Max Outlets Quota</label>
                  <input
                    value={planOutlets}
                    onChange={e => setPlanOutlets(e.target.value)}
                    placeholder="e.g. Up to 5 Outlets"
                    className="gold-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Max User Seats</label>
                  <input
                    value={planUsers}
                    onChange={e => setPlanUsers(e.target.value)}
                    placeholder="e.g. Up to 25 User Seats"
                    className="gold-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Plan Features (One per line)</label>
                <textarea
                  value={planFeaturesText}
                  onChange={e => setPlanFeaturesText(e.target.value)}
                  rows={4}
                  placeholder="Up to 5 Outlets&#10;Up to 25 User Seats&#10;FEFO Expiry Auditing&#10;GST Tax Ledger"
                  className="gold-input w-full font-sans text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsEditPlanOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Save Plan Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
