import React, { useState, useEffect } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useRetailStore, StoreOutlet } from '../store/useRetailStore';
import { useAuthStore } from '../store/useAuthStore';
import { BarChartWidget, AreaLineChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import { CustomerDirectoryView } from '../components/CustomerDirectoryView';
import { analyticsApi, transactionApi, tenantApi, planApi } from '../services/api';
import { AnalyticsData, Transaction, Product, Role, SubscriptionPlan } from '../types';
import {
  TrendingUp, ShoppingBag, Store, Users, AlertTriangle,
  Download, ArrowUpRight, ArrowDownRight, CreditCard,
  DollarSign, Activity, CheckCircle2, RefreshCw,
  Receipt, FileText, Plus, MapPin, X,
  UserPlus, Package, Barcode, Tag, Lock, ClipboardList,
  Eye, Calendar, Clock, Shield, ArrowLeftRight, Gift, Percent, UserCog,
  Printer, Trash2, Edit, Search, Check, Filter, AlertCircle, Sparkles, ChevronRight, Crown, Key
} from 'lucide-react';

const initialAnalytics: AnalyticsData = {
  totalSales: 0,
  todaySales: 0,
  yesterdaySales: 0,
  growthRate: 0,
  averageOrderValue: 0,
  totalTransactions: 0,
  totalStores: 1,
  totalCustomers: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
  salesByStore: {},
  salesByPaymentMethod: { UPI: 0, CARD: 0, RAZORPAY: 0, STRIPE: 0, CASH: 0, GIFT: 0 },
  topProducts: []
};

interface EnterpriseUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  storeName: string;
  storeId?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  pinCode?: string;
}

interface CatalogSKU {
  id: number;
  barcode: string;
  name: string;
  category: string;
  globalPrice: number;
  costPrice: number;
  gstRate: number;
  unit: string;
  totalStock: number;
}

interface StockTransferItem {
  id: string;
  fromStore: string;
  toStore: string;
  item: string;
  qty: number;
  status: string;
  date: string;
}

interface PromoCampaign {
  id: number;
  title: string;
  code: string;
  discount: string;
  validTill: string;
  status: string;
}

export const TenantAdminDashboardPage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { addNotification } = useNotificationStore();
  const { outlets, addOutlet, products: catalogSkus, addProduct: addCatalogSku, setProducts } = useRetailStore();
  const { user, tenantDetails, setTenantDetails } = useAuthStore();

  const [data, setData] = useState<AnalyticsData>(initialAnalytics);
  const [msg, setMsg] = useState('');

  // ─── SUBSCRIPTION PLAN & QUOTA BOUNDARIES ───
  // ─── SUBSCRIPTION PLAN & QUOTA BOUNDARIES ───
  const [currentPlan, setCurrentPlan] = useState<string>(tenantDetails?.planName || 'Starter Boutique');
  const [maxStoresQuota, setMaxStoresQuota] = useState<number>(tenantDetails?.maxStores || 2);
  const [maxUsersQuota, setMaxUsersQuota] = useState<number>(tenantDetails?.maxUsers || 10);
  const [isQuotaExceededModalOpen, setIsQuotaExceededModalOpen] = useState(false);
  const [quotaExceededReason, setQuotaExceededReason] = useState<{ title: string; current: number; max: number; type: 'STORES' | 'USERS' }>({
    title: '', current: 0, max: 0, type: 'STORES'
  });

  // Subscription Plans & Upgrade Modal
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([
    { id: 1, name: 'Starter Boutique', maxStores: 2, maxUsers: 10, price: 4999 },
    { id: 2, name: 'Standard Chain', maxStores: 10, maxUsers: 50, price: 14999 },
    { id: 3, name: 'Enterprise Hyper-Scale', maxStores: 50, maxUsers: 500, price: 39999 }
  ]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradePlanId, setUpgradePlanId] = useState<number>(tenantDetails?.planId || 1);
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Fetch real tenant subscription data & analytics from API
  const refreshAnalytics = async () => {
    try {
      const info = await tenantApi.getMe();
      if (info) {
        setCurrentPlan(info.planName);
        setMaxStoresQuota(info.maxStores);
        setMaxUsersQuota(info.maxUsers);
        setTenantDetails(info);
      }
    } catch (e) {
      if (tenantDetails) {
        setCurrentPlan(tenantDetails.planName);
        setMaxStoresQuota(tenantDetails.maxStores);
        setMaxUsersQuota(tenantDetails.maxUsers);
      }
    }

    try {
      const analytics = await analyticsApi.getTenantAnalytics();
      if (analytics) {
        setData(analytics);
      }
    } catch (e) {
      console.warn('Real analytics fetch warning:', e);
    }
  };

  const loadUsersFromApi = async () => {
    try {
      const apiUsers = await tenantApi.getUsers();
      if (apiUsers && apiUsers.length > 0) {
        setUsers(apiUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          storeName: outlets.find(o => o.id === u.storeId)?.name || 'Flagship Store',
          storeId: u.storeId,
          status: (u.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
          pinCode: u.pinCode || '1234'
        })));
      }
    } catch (e) {
      console.warn('Failed to load users from backend:', e);
    }
  };

  useEffect(() => {
    planApi.getPlans().then(plans => {
      if (plans && plans.length > 0) {
        setAvailablePlans(plans);
        if (tenantDetails?.planId) {
          setUpgradePlanId(tenantDetails.planId);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshAnalytics();
    loadUsersFromApi();
  }, [user?.tenantId]);

  // Store Outlets State managed by useRetailStore
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');

  // Users & Employee Provisioning (Real state from PostgreSQL, tenant admin sets credentials)
  const [users, setUsers] = useState<EnterpriseUser[]>([]);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<Role>('CASHIER');
  const [newUserStore, setNewUserStore] = useState(outlets[0]?.name || 'Flagship Store');
  const [newUserPin, setNewUserPin] = useState('1234');

  // Edit Employee & Reset Password Modal State
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EnterpriseUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('CASHIER');
  const [editUserStoreId, setEditUserStoreId] = useState<number | undefined>(undefined);
  const [editUserPin, setEditUserPin] = useState('1234');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserStatus, setEditUserStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [isAddSkuOpen, setIsAddSkuOpen] = useState(false);
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuBarcode, setNewSkuBarcode] = useState('');
  const [newSkuCategory, setNewSkuCategory] = useState('Dairy & Cold Storage');
  const [newSkuPrice, setNewSkuPrice] = useState('100.00');
  const [newSkuCost, setNewSkuCost] = useState('75.00');
  const [newSkuGst, setNewSkuGst] = useState('18');

  // Stock Transfers state (Clean state, no dummy transfers)
  const [transfers, setTransfers] = useState<StockTransferItem[]>(() => {
    try {
      const tenantKey = user?.tenantId ? `megamart_tenant_${user.tenantId}_transfers` : 'megamart_transfers';
      const saved = localStorage.getItem(tenantKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [fromStoreSelect, setFromStoreSelect] = useState(outlets[0]?.name || 'Store #1');
  const [toStoreSelect, setToStoreSelect] = useState(outlets[1]?.name || outlets[0]?.name || 'Store #1');
  const [transferItem, setTransferItem] = useState('');
  const [transferQty, setTransferQty] = useState('100');

  // Campaigns & Discounts state
  const [promos, setPromos] = useState<PromoCampaign[]>(() => {
    if (!user || user.tenantId === 1) {
      return [
        { id: 1, title: 'Festival Grocery Bonanza', code: 'DIWALI20', discount: '20% OFF', validTill: '2026-11-15', status: 'ACTIVE' },
        { id: 2, title: 'Weekend Dairy Combo', code: 'DAIRYBOGO', discount: 'Buy 1 Get 1', validTill: '2026-09-30', status: 'ACTIVE' },
      ];
    }
    try {
      const saved = localStorage.getItem(`megamart_tenant_${user.tenantId}_promos`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [promoTitle, setPromoTitle] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');

  // Persist tenant users, transfers, promos for non-demo tenants
  useEffect(() => {
    if (user?.tenantId && user.tenantId !== 1) {
      try { localStorage.setItem(`megamart_tenant_${user.tenantId}_users`, JSON.stringify(users)); } catch (e) {}
    }
  }, [users, user?.tenantId]);

  useEffect(() => {
    if (user?.tenantId && user.tenantId !== 1) {
      try { localStorage.setItem(`megamart_tenant_${user.tenantId}_transfers`, JSON.stringify(transfers)); } catch (e) {}
    }
  }, [transfers, user?.tenantId]);

  useEffect(() => {
    if (user?.tenantId && user.tenantId !== 1) {
      try { localStorage.setItem(`megamart_tenant_${user.tenantId}_promos`, JSON.stringify(promos)); } catch (e) {}
    }
  }, [promos, user?.tenantId]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([
    { id: 'AUD-8801', timestamp: '2026-09-10 08:45 AM', user: 'Vikram Malhotra', role: 'STORE_MANAGER', action: 'MANAGER_OVERRIDE', details: 'Approved ₹850 refund on Receipt #INV-891024', ip: '192.168.1.45' },
    { id: 'AUD-8800', timestamp: '2026-09-10 08:15 AM', user: 'Ananya Deshmukh', role: 'ACCOUNTANT', action: 'PAYOUT_RELEASE', details: 'Released ₹1,45,000 to Amul Dairy India Ltd', ip: '192.168.1.12' },
    { id: 'AUD-8799', timestamp: '2026-09-10 07:30 AM', user: 'Priya Patel', role: 'CASHIER', action: 'USER_LOGIN', details: 'Shift Login on POS Register #1', ip: '192.168.1.101' },
    { id: 'AUD-8798', timestamp: '2026-09-09 06:20 PM', user: 'Rajesh Sharma', role: 'TENANT_ADMIN', action: 'EMPLOYEE_PROVISION', details: 'Provisioned Neha Gupta as Customer Service Representative', ip: '192.168.1.5' },
  ]);

  // ─── STRICT QUOTA CHECK 1: REGISTER OUTLET STORE ───
  const handleOpenAddStore = () => {
    if (outlets.length >= maxStoresQuota) {
      setQuotaExceededReason({
        title: 'Supermarket Outlet Quota Exceeded',
        current: outlets.length,
        max: maxStoresQuota,
        type: 'STORES'
      });
      setIsQuotaExceededModalOpen(true);
      return;
    }
    setIsAddStoreOpen(true);
  };

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    // Strict Enforcement Check
    if (outlets.length >= maxStoresQuota) {
      setIsAddStoreOpen(false);
      setQuotaExceededReason({
        title: 'Supermarket Outlet Quota Exceeded',
        current: outlets.length,
        max: maxStoresQuota,
        type: 'STORES'
      });
      setIsQuotaExceededModalOpen(true);
      return;
    }

    const newStore: StoreOutlet = {
      id: Date.now(),
      name: newStoreName.trim(),
      city: newStoreCity.trim() || 'Mumbai',
      code: `ST-${Math.floor(100 + Math.random() * 900)}`,
      staff: 5,
      revenue: 0,
      status: 'ACTIVE'
    };
    addOutlet(newStore);
    setIsAddStoreOpen(false);
    setNewStoreName(''); setNewStoreCity('');
    setMsg(`New Outlet "${newStore.name}" registered successfully! (${outlets.length}/${maxStoresQuota} Stores)`);
    setTimeout(() => setMsg(''), 4000);
  };

  // ─── STRICT QUOTA CHECK 2: PROVISION EMPLOYEE USER ───
  const handleOpenAddUser = () => {
    if (users.length >= maxUsersQuota) {
      setQuotaExceededReason({
        title: 'Employee User Seats Quota Exceeded',
        current: users.length,
        max: maxUsersQuota,
        type: 'USERS'
      });
      setIsQuotaExceededModalOpen(true);
      return;
    }
    setIsAddUserOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    // Strict Enforcement Check
    if (users.length >= maxUsersQuota) {
      setIsAddUserOpen(false);
      setQuotaExceededReason({
        title: 'Employee User Seats Quota Exceeded',
        current: users.length,
        max: maxUsersQuota,
        type: 'USERS'
      });
      setIsQuotaExceededModalOpen(true);
      return;
    }

    const matchedStore = outlets.find(o => o.name === newUserStore);

    try {
      const saved = await tenantApi.createTenantUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        pinCode: newUserPin,
        role: newUserRole,
        storeId: matchedStore?.id
      });

      const newUser: EnterpriseUser = {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        role: saved.role,
        storeName: newUserStore,
        storeId: matchedStore?.id,
        status: (saved.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
        pinCode: saved.pinCode || newUserPin
      };

      setUsers(prev => [...prev, newUser]);
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('password123');
      setNewUserPin('1234');
      setMsg(`Employee "${newUser.name}" provisioned with role ${newUser.role}! (${users.length + 1}/${maxUsersQuota} Seats)`);
      setTimeout(() => setMsg(''), 4000);
      refreshAnalytics();
    } catch (err: any) {
      setMsg(err?.message || 'Failed to provision employee.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleOpenEditUser = (u: EnterpriseUser) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserRole(u.role);
    setEditUserPin(u.pinCode || '1234');
    setEditUserStoreId(u.storeId || outlets[0]?.id);
    setEditUserPassword('');
    setEditUserStatus(u.status);
    setIsEditUserOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await tenantApi.updateTenantUser(editingUser.id, {
        name: editUserName.trim(),
        role: editUserRole,
        storeId: editUserStoreId,
        pinCode: editUserPin,
        password: editUserPassword.trim() ? editUserPassword.trim() : undefined,
        status: editUserStatus
      });

      const updatedStoreName = outlets.find(o => o.id === editUserStoreId)?.name || editingUser.storeName;

      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: editUserName.trim(),
        role: editUserRole,
        pinCode: editUserPin,
        storeName: updatedStoreName,
        storeId: editUserStoreId,
        status: editUserStatus
      } : u));

      setIsEditUserOpen(false);
      setMsg(`Credentials & role updated for "${editUserName.trim()}".`);
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setMsg(err?.message || 'Failed to update user credentials.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleToggleUserStatus = async (id: number) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const nextStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await tenantApi.updateTenantUser(id, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
      setMsg(`Employee status set to ${nextStatus}.`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.message || 'Failed to toggle status');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const target = users.find(u => u.id === id);
    if (!window.confirm(`Are you sure you want to de-provision employee "${target?.name || ''}"?`)) return;
    try {
      await tenantApi.deleteTenantUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setMsg('Employee account de-provisioned.');
      setTimeout(() => setMsg(''), 3000);
      refreshAnalytics();
    } catch (e: any) {
      setMsg(e?.message || 'Failed to de-provision employee.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleUpgradePlan = async () => {
    setIsUpgrading(true);
    try {
      const updated = await tenantApi.upgradeSubscription(upgradePlanId, upgradeBillingCycle);
      setCurrentPlan(updated.planName);
      setMaxStoresQuota(updated.maxStores);
      setMaxUsersQuota(updated.maxUsers);
      setTenantDetails(updated);
      setIsUpgradeModalOpen(false);
      setMsg(`🎉 Plan successfully upgraded to ${updated.planName}! Active until ${updated.subscriptionEndDate || 'next cycle'}.`);
      setTimeout(() => setMsg(''), 6000);
    } catch (err: any) {
      setMsg(err?.message || 'Plan upgrade failed.');
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddSku = (e: React.FormEvent) => {
    e.preventDefault();
    const newSku: Product = {
      id: Date.now(),
      tenantId: 1,
      barcode: newSkuBarcode.trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: newSkuName.trim(),
      category: newSkuCategory,
      globalPrice: parseFloat(newSkuPrice) || 0,
      costPrice: parseFloat(newSkuCost) || 0,
      gstRate: parseInt(newSkuGst) || 18,
      unit: 'pack',
      stockQuantity: 50,
      batchNumber: `BATCH-${Math.floor(100 + Math.random() * 900)}`
    };
    addCatalogSku(newSku);
    setIsAddSkuOpen(false);
    setNewSkuName(''); setNewSkuBarcode('');
    setMsg(`Global Catalog SKU "${newSku.name}" created!`);
    setTimeout(() => setMsg(''), 4000);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleDeleteSku = (id: number) => {
    setProducts(catalogSkus.filter(s => s.id !== id));
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromStoreSelect === toStoreSelect) {
      alert('Source branch and destination branch must be different!');
      return;
    }
    const newTrf = {
      id: `TRF-${Math.floor(900 + Math.random() * 99)}`,
      fromStore: fromStoreSelect,
      toStore: toStoreSelect,
      item: transferItem,
      qty: parseInt(transferQty) || 50,
      status: 'IN_TRANSIT',
      date: new Date().toISOString().split('T')[0]
    };
    setTransfers(prev => [newTrf, ...prev]);
    setMsg(`Stock transfer ${newTrf.id} (${newTrf.qty} x ${newTrf.item}) dispatched from ${fromStoreSelect} to ${toStoreSelect}!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleCompleteTransfer = (trfId: string) => {
    setTransfers(prev => prev.map(t => t.id === trfId ? { ...t, status: 'COMPLETED' } : t));
    setMsg(`Transfer ${trfId} verified & received into store inventory!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoCode.trim()) return;
    const newPr = {
      id: Date.now(),
      title: promoTitle,
      code: promoCode.toUpperCase(),
      discount: promoDiscount || '10% OFF',
      validTill: '2026-11-30',
      status: 'ACTIVE'
    };
    setPromos(prev => [...prev, newPr]);
    setPromoTitle(''); setPromoCode(''); setPromoDiscount('');
    setMsg(`Campaign Promo "${newPr.title}" created & activated!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleTogglePromoStatus = (id: number) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE' } : p));
  };

  const handleExportCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}_${Date.now()}.csv`; a.click();
    setMsg(`${filename} report exported!`); setTimeout(() => setMsg(''), 3000);
  };

  // Reusable Subscription & Quota Usage Banner
  const renderQuotaBanner = () => {
    const storesPercent = Math.min(100, Math.round((outlets.length / (maxStoresQuota || 1)) * 100));
    const usersPercent = Math.min(100, Math.round((users.length / (maxUsersQuota || 1)) * 100));
    const companyDisplay = tenantDetails?.companyName || user?.name || 'Tenant HQ';
    const isExpired = tenantDetails?.isSubscriptionActive === false || (tenantDetails?.subscriptionStatus === 'EXPIRED');
    const daysLeft = tenantDetails?.daysRemaining ?? 30;

    return (
      <div className="space-y-3">
        {/* Expired Subscription Alert if applicable */}
        {isExpired && (
          <div className="bg-rose-600 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
              <span>Subscription Expired! Access to employee provisioning and branch expansion is paused. Please renew to keep your mall operating.</span>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-white text-rose-700 hover:bg-amber-100 text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer shadow-md shrink-0"
            >
              Renew Immediately
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 text-white p-4 rounded-2xl shadow-md border border-amber-300/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isExpired ? 'bg-rose-600' : 'bg-amber-500'} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md`}>
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">{currentPlan}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {isExpired ? 'EXPIRED' : 'ACTIVE SUBSCRIPTION'}
                </span>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-400/30">
                  {tenantDetails?.billingCycle || 'MONTHLY'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-amber-200/90 font-medium mt-0.5">
                <span>{companyDisplay} (ID #{user?.tenantId || 1})</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" />
                  {isExpired ? 'Expired on' : 'Renews on'}: <strong className="text-white font-mono">{tenantDetails?.subscriptionEndDate || '2026-10-12'}</strong>
                </span>
                <span>•</span>
                <span className={`font-black font-mono ${daysLeft <= 3 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {daysLeft} Days Remaining
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono w-full md:w-auto">
            {/* Outlets Progress */}
            <div className="bg-stone-800/80 p-2.5 rounded-xl border border-amber-300/30 flex-1 md:flex-initial min-w-[140px]">
              <div className="flex justify-between text-[10px] text-amber-200 font-bold mb-1">
                <span>OUTLETS:</span>
                <span className={outlets.length >= maxStoresQuota ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                  {outlets.length} / {maxStoresQuota >= 999 ? '∞' : maxStoresQuota}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${outlets.length >= maxStoresQuota ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${storesPercent}%` }}></div>
              </div>
            </div>

            {/* Users Progress */}
            <div className="bg-stone-800/80 p-2.5 rounded-xl border border-amber-300/30 flex-1 md:flex-initial min-w-[140px]">
              <div className="flex justify-between text-[10px] text-amber-200 font-bold mb-1">
                <span>USER SEATS:</span>
                <span className={users.length >= maxUsersQuota ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                  {users.length} / {maxUsersQuota >= 999 ? '∞' : maxUsersQuota}
                </span>
              </div>
              <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${users.length >= maxUsersQuota ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${usersPercent}%` }}></div>
              </div>
            </div>

            {/* Plan Governance Info */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Manage Plan & Timeline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── SUB-VIEW 1: EXECUTIVE DASHBOARD ───
  const renderDashboard = () => (
    <div className="space-y-6">
      {renderQuotaBanner()}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><TrendingUp className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 font-semibold">
            <span>Avg Basket:</span>
            <strong className="text-amber-900 font-mono">₹{((data.averageOrderValue || (data.totalTransactions > 0 ? data.totalSales / data.totalTransactions : 0)) || 0).toFixed(2)}</strong>
          </div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black"><Clock className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-950 font-mono">₹{(data.todaySales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 font-semibold">
            <span className={`${(data.growthRate || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-extrabold flex items-center`}>
              {(data.growthRate || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {(data.growthRate || 0) > 0 ? `+${data.growthRate?.toFixed(1)}%` : `${data.growthRate?.toFixed(1) || 0}%`}
            </span>
            <span>vs yesterday</span>
          </div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><Receipt className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">{data.totalTransactions.toLocaleString()} Invoices</div>
          <div className="text-[11px] text-stone-500 font-semibold">{data.totalCustomers} Loyalty Members</div>
        </div>

        <div className="gold-card p-5 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wide">
            <span>Inventory Health</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black"><AlertTriangle className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">{data.lowStockCount || 0} Low Stock</div>
          <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
            <span className="text-rose-600 font-bold">{data.expiringSoonCount || 0} Batches</span>
            <span>expiring within 7 days (FEFO)</span>
          </div>
        </div>
      </div>

      {/* Payment Gateway Distribution & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 gold-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-950 tracking-wider">Payment Gateway Distribution</h3>
              <p className="text-[11px] text-stone-500">Live revenue breakdown by payment rails</p>
            </div>
            <span className="gold-badge text-[9px]">Razorpay & Stripe</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(data.salesByPaymentMethod || {
              UPI: 0, CARD: 0, RAZORPAY: 0, STRIPE: 0, CASH: 0, GIFT: 0
            }).map(([method, val]) => (
              <div key={method} className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase block">{method}</span>
                <div className="text-base font-black text-amber-950 font-mono">₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-stone-500 font-medium">
                  {data.totalSales > 0 ? `${((Number(val) / data.totalSales) * 100).toFixed(1)}%` : '0%'} of sales
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 gold-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-950 tracking-wider">Top Selling Catalog Products</h3>
              <p className="text-[11px] text-stone-500">Ranked by unit sales volume</p>
            </div>
            <Package className="w-4 h-4 text-amber-700" />
          </div>

          {data.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-2">
              {data.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-200 text-amber-900 font-black text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-amber-950">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-amber-950">{p.quantitySold} units</span>
                    <span className="text-[10px] text-stone-500 block font-mono">₹{Number(p.revenue).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-500 font-medium bg-amber-50/30 rounded-xl border border-dashed border-amber-200">
              No sales recorded yet. Process transactions on Cashier POS to generate product velocity intelligence.
            </div>
          )}
        </div>
      </div>

      {/* Visual Velocity & Category Distribution Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AreaLineChartWidget
            title="Sales Velocity (Today)"
            points={(data.todaySales || 0) > 0 ? [(data.todaySales || 0) * 0.1, (data.todaySales || 0) * 0.25, (data.todaySales || 0) * 0.55, (data.todaySales || 0) * 0.85, data.todaySales || 0] : [0, 0, 0, 0, 0]}
            labels={['09 AM', '12 PM', '03 PM', '06 PM', '09 PM']}
            valuePrefix="₹"
          />
        </div>

        <div className="lg:col-span-4">
          <DonutChartWidget
            title="Sales by Store Outlet"
            subtitle="Branch revenue distribution"
            centerLabel="TOTAL REVENUE"
            centerValue={`₹${(data.totalSales / 100000).toFixed(2)}L`}
            segments={Object.entries(data.salesByStore || {}).map(([name, val], idx) => ({
              label: name,
              value: Number(val),
              color: ['#78350F', '#D97706', '#F59E0B', '#FCD34D'][idx % 4]
            }))}
          />
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 2: OUTLET MANAGER ───
  const renderOutlets = () => (
    <div className="space-y-4">
      {renderQuotaBanner()}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Supermarket Outlet Directory</h2>
          <p className="text-xs text-stone-500">
            Manage store branches ({outlets.length} / {maxStoresQuota === 999 ? '∞' : maxStoresQuota} Outlets Used)
          </p>
        </div>
        <button
          onClick={handleOpenAddStore}
          className={`text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md ${
            outlets.length >= maxStoresQuota
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'gold-button-primary'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Store {outlets.length >= maxStoresQuota ? '(Quota Full)' : ''}</span>
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Store Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">City</th>
              <th className="p-3">Staff</th>
              <th className="p-3 text-right">Daily Revenue (₹)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {outlets.map(s => (
              <tr key={s.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-bold text-amber-950">{s.name}</td>
                <td className="p-3 font-mono text-stone-600">{s.code}</td>
                <td className="p-3">{s.city}</td>
                <td className="p-3 font-mono">{s.staff} Staff</td>
                <td className="p-3 text-right font-black text-amber-900">₹{s.revenue.toLocaleString()}</td>
                <td className="p-3 text-center"><span className="gold-badge">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 3: REVENUE ANALYTICS ───
  const renderRevenue = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Revenue Analytics & Profit Margins</h2>
          <p className="text-xs text-stone-500">Gross sales performance across all chain branches.</p>
        </div>
      </div>
      <AreaLineChartWidget
        title="Monthly Gross Sales Trend (2026)"
        subtitle="Consolidated revenue analytics across 3 supermarket locations"
        points={[240000, 310000, 380000, 420000, 485290]}
        labels={['May', 'Jun', 'Jul', 'Aug', 'Sep']}
        valuePrefix="₹"
      />
    </div>
  );

  // ─── SUB-VIEW 4: USER PROVISIONING (EMPLOYEE MANAGEMENT) ───
  const renderUsers = () => (
    <div className="space-y-4">
      {renderQuotaBanner()}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Employee Role Provisioning</h2>
          <p className="text-xs text-stone-500">
            Provision store managers, cashiers, accountants ({users.length} / {maxUsersQuota === 999 ? '∞' : maxUsersQuota} Seats Used)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv('Employee_Roster', users.map(u => `${u.name},${u.email},${u.role},${u.storeName},${u.status}`).join('\n'))}
            className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Roster CSV
          </button>
          <button
            onClick={handleOpenAddUser}
            className={`text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md ${
              users.length >= maxUsersQuota
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'gold-button-primary'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision New Employee {users.length >= maxUsersQuota ? '(Seats Full)' : ''}</span>
          </button>
        </div>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3.5">Employee Name</th>
              <th className="p-3.5">Work Email</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Branch Location</th>
              <th className="p-3.5">Security PIN</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-amber-50/40">
                <td className="p-3.5 font-bold text-amber-950">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                      {u.name[0]}
                    </div>
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="p-3.5 font-mono text-stone-600">{u.email}</td>
                <td className="p-3.5"><span className="gold-badge">{u.role}</span></td>
                <td className="p-3.5 text-stone-700">{u.storeName}</td>
                <td className="p-3.5 font-mono font-bold text-amber-900">{u.pinCode || '1234'}</td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => handleToggleUserStatus(u.id)}
                    className={`cursor-pointer ${u.status === 'ACTIVE' ? 'badge-emerald' : 'badge-stone'}`}
                  >
                    {u.status}
                  </button>
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Credentials & Reset Password"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="De-provision Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 5: GLOBAL PRODUCT CATALOG ───
  const renderCatalog = () => {
    const filteredSkus = catalogSkus.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(catalogSearch.toLowerCase()) || s.barcode.includes(catalogSearch);
      const matchCat = catalogCategory === 'ALL' || s.category === catalogCategory;
      return matchSearch && matchCat;
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">Global Chain Product Catalog Master</h2>
            <p className="text-xs text-stone-500">Master product database & global pricing rules synchronized across all branch locations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCsv('Master_Catalog', catalogSkus.map(s => `${s.barcode},${s.name},${s.category},${s.globalPrice},${s.costPrice},${s.gstRate}%`).join('\n'))}
              className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Export Catalog Report
            </button>
            <button
              onClick={() => setIsAddSkuOpen(true)}
              className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Global SKU Master</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="gold-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Filter by barcode or product name..."
              className="gold-input w-full pl-9 text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-stone-500">Category:</span>
            <select
              value={catalogCategory}
              onChange={e => setCatalogCategory(e.target.value)}
              className="gold-input text-xs font-bold py-2 cursor-pointer"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="Dairy & Cold Storage">Dairy & Cold Storage</option>
              <option value="Bakery & Breads">Bakery & Breads</option>
              <option value="Beverages & Pantry">Beverages & Pantry</option>
            </select>
          </div>
        </div>

        <div className="gold-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
              <tr>
                <th className="p-3">Barcode</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Cost Price (₹)</th>
                <th className="p-3 text-right">Global Sale Price (₹)</th>
                <th className="p-3 text-center">GST Tax</th>
                <th className="p-3 text-right">Chain Stock</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {filteredSkus.map(s => (
                <tr key={s.id} className="hover:bg-amber-50/40">
                  <td className="p-3 font-mono font-bold text-amber-900">{s.barcode}</td>
                  <td className="p-3 font-bold text-stone-900">{s.name}</td>
                  <td className="p-3 text-stone-600">{s.category}</td>
                  <td className="p-3 text-right font-mono text-stone-600">₹{s.costPrice.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-black text-amber-950">₹{s.globalPrice.toFixed(2)}</td>
                  <td className="p-3 text-center"><span className="gold-badge">{s.gstRate}% GST</span></td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{s.totalStock} {s.unit}s</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDeleteSku(s.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer" title="Delete SKU">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── SUB-VIEW 6: GST TAX LEDGER ───
  const renderGst = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">GST Tax Ledger & Compliance</h2>
          <p className="text-xs text-stone-500">Consolidated CGST, SGST, IGST tax liability breakdown for filing GSTR-1 and GSTR-3B.</p>
        </div>
        <button
          onClick={() => handleExportCsv('GSTR1_Filing_Report', 'GST_Slab,Taxable_Value,CGST,SGST,IGST,Net_Tax\n18%,269444.00,24250.00,24250.00,0.00,48500.00\n12%,201666.00,12100.00,12100.00,0.00,24200.00\n5%,292000.00,7300.00,7300.00,0.00,14600.00')}
          className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Download GSTR-1 Tax Return CSV
        </button>
      </div>

      <DonutChartWidget
        title="Chain Tax Liability Distribution"
        subtitle="Consolidated tax inputs"
        centerLabel="TOTAL GST"
        centerValue="₹87.3k"
        segments={[
          { label: '18% GST (Groceries)', value: 48500, color: '#78350F' },
          { label: '12% GST (Dairy)', value: 24200, color: '#D97706' },
          { label: '5% GST (Essentials)', value: 14600, color: '#F59E0B' },
        ]}
      />

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">GST Tax Slab</th>
              <th className="p-3 text-right">Taxable Turnover (₹)</th>
              <th className="p-3 text-right">CGST @ 50% (₹)</th>
              <th className="p-3 text-right">SGST @ 50% (₹)</th>
              <th className="p-3 text-right font-black">Total Tax Liability (₹)</th>
              <th className="p-3 text-center">Filing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {[
              { slab: '18% GST (Packaged Foods)', taxable: 269444.00, cgst: 24250.00, sgst: 24250.00, total: 48500.00, status: 'READY_FOR_GSTR1' },
              { slab: '12% GST (Dairy & Cold)', taxable: 201666.00, cgst: 12100.00, sgst: 12100.00, total: 24200.00, status: 'READY_FOR_GSTR1' },
              { slab: '5% GST (Staples & Breads)', taxable: 292000.00, cgst: 7300.00, sgst: 7300.00, total: 14600.00, status: 'READY_FOR_GSTR1' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-amber-50/40">
                <td className="p-3 font-bold text-amber-950">{row.slab}</td>
                <td className="p-3 text-right font-mono">₹{row.taxable.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">₹{row.cgst.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">₹{row.sgst.toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-black text-amber-900">₹{row.total.toLocaleString()}</td>
                <td className="p-3 text-center"><span className="badge-emerald">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 7: AUDIT LOGS ───
  const renderAudit = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Enterprise System Security Audit Trail</h2>
          <p className="text-xs text-stone-500">Security audit log of logins, price changes, refund overrides, and provisioning events.</p>
        </div>
        <button
          onClick={() => handleExportCsv('Security_Audit_Trail', auditLogs.map(l => `${l.id},${l.timestamp},${l.user},${l.role},${l.action},${l.details}`).join('\n'))}
          className="gold-btn-secondary text-xs px-3 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> Export Audit Log
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Log ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User & Role</th>
              <th className="p-3">Action Type</th>
              <th className="p-3">Details</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-mono font-bold text-amber-900">{log.id}</td>
                <td className="p-3 text-stone-500 text-[11px] font-mono">{log.timestamp}</td>
                <td className="p-3">
                  <div className="font-bold text-stone-900">{log.user}</div>
                  <span className="text-[10px] text-amber-700 font-semibold">{log.role}</span>
                </td>
                <td className="p-3"><span className="gold-badge">{log.action}</span></td>
                <td className="p-3 text-stone-700 font-medium">{log.details}</td>
                <td className="p-3 font-mono text-stone-500 text-[11px]">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 8: INTER-STORE TRANSFERS ───
  const renderTransfers = () => (
    <div className="space-y-6">
      <div className="gold-card p-6 max-w-2xl space-y-4">
        <h3 className="font-extrabold text-amber-950 text-sm">Initiate Inter-Store Stock Dispatch</h3>
        <p className="text-xs text-stone-500">Dispatch stock inventory between supermarket branches (Mumbai, Bengaluru, Delhi).</p>

        <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-amber-950 mb-1">From Source Branch</label>
              <select value={fromStoreSelect} onChange={e => setFromStoreSelect(e.target.value)} className="gold-input w-full font-bold">
                {outlets.map(o => (
                  <option key={o.id} value={o.name}>{o.name} ({o.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-extrabold text-amber-950 mb-1">To Destination Branch</label>
              <select value={toStoreSelect} onChange={e => setToStoreSelect(e.target.value)} className="gold-input w-full font-bold">
                {outlets.map(o => (
                  <option key={o.id} value={o.name}>{o.name} ({o.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Select Product SKU</label>
              <select value={transferItem} onChange={e => setTransferItem(e.target.value)} className="gold-input w-full">
                {catalogSkus.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.barcode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Transfer Quantity (Units)</label>
              <input type="number" value={transferQty} onChange={e => setTransferQty(e.target.value)} className="gold-input w-full font-mono font-bold" />
            </div>
          </div>

          <button type="submit" className="w-full gold-button-primary py-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Dispatch Stock Transfer</span>
          </button>
        </form>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Transfer ID</th>
              <th className="p-3">From Branch</th>
              <th className="p-3">To Branch</th>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {transfers.map(t => (
              <tr key={t.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-mono font-bold text-amber-900">{t.id}</td>
                <td className="p-3 font-semibold text-stone-900">{t.fromStore}</td>
                <td className="p-3 font-semibold text-stone-900">{t.toStore}</td>
                <td className="p-3 font-bold text-amber-950">{t.item}</td>
                <td className="p-3 text-right font-mono font-bold">{t.qty} units</td>
                <td className="p-3 text-center"><span className="gold-badge">{t.status}</span></td>
                <td className="p-3 text-center">
                  {t.status === 'IN_TRANSIT' ? (
                    <button
                      onClick={() => handleCompleteTransfer(t.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Approve & Receive
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Received
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 9: CAMPAIGNS & DISCOUNTS ───
  const renderPromos = () => (
    <div className="space-y-6">
      <div className="gold-card p-6 max-w-xl space-y-4">
        <h3 className="font-extrabold text-amber-950 text-sm">Create New Marketing Campaign & Discount Code</h3>
        <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Campaign Title</label>
            <input value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="e.g. Festival Grocery Bonanza" className="gold-input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Promo Code</label>
              <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g. FESTIVAL20" className="gold-input w-full uppercase font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Discount Rule</label>
              <input value={promoDiscount} onChange={e => setPromoDiscount(e.target.value)} placeholder="e.g. 20% OFF or Buy 1 Get 1" className="gold-input w-full" />
            </div>
          </div>
          <button type="submit" className="w-full gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5">
            <Gift className="w-4 h-4" />
            <span>Launch Campaign</span>
          </button>
        </form>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Campaign Title</th>
              <th className="p-3">Promo Code</th>
              <th className="p-3">Discount Rule</th>
              <th className="p-3">Valid Till</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-bold text-amber-950">{p.title}</td>
                <td className="p-3 font-mono font-bold text-amber-900">{p.code}</td>
                <td className="p-3 font-semibold">{p.discount}</td>
                <td className="p-3 text-stone-500 text-[11px]">{p.validTill}</td>
                <td className="p-3 text-center"><span className="gold-badge">{p.status}</span></td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleTogglePromoStatus(p.id)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Toggle Status
                  </button>
                </td>
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

      {/* Conditional Sub-View Router for Tenant Admin Views */}
      {activeNavItem === 'dashboard' && renderDashboard()}
      {activeNavItem === 'outlets' && renderOutlets()}
      {activeNavItem === 'revenue' && renderRevenue()}
      {activeNavItem === 'users' && renderUsers()}
      {activeNavItem === 'customers' && <CustomerDirectoryView />}
      {activeNavItem === 'catalog' && renderCatalog()}
      {activeNavItem === 'transfers' && renderTransfers()}
      {activeNavItem === 'promos' && renderPromos()}
      {activeNavItem === 'gst' && renderGst()}
      {activeNavItem === 'audit' && renderAudit()}
      {(!['dashboard', 'outlets', 'revenue', 'users', 'customers', 'catalog', 'transfers', 'promos', 'gst', 'audit'].includes(activeNavItem)) && renderDashboard()}

      {/* ─── MODAL 1: PROVISION NEW EMPLOYEE MODAL ─── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-amber-700" />
                <span>Provision New Employee Account</span>
              </h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Full Employee Name</label>
                <input
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Siddhesh More"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Corporate Work Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. s.more@megamart.com"
                  className="gold-input w-full font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Role Assignment</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="gold-input w-full font-bold cursor-pointer">
                    <option value="CASHIER">CASHIER</option>
                    <option value="STORE_MANAGER">STORE MANAGER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="CUSTOMER_SERVICE">CUSTOMER SERVICE</option>
                    <option value="INVENTORY_CLERK">INVENTORY CLERK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Branch Store</label>
                  <select value={newUserStore} onChange={e => setNewUserStore(e.target.value)} className="gold-input w-full font-bold cursor-pointer">
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                    <option value="Corporate HQ">Corporate HQ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Set employee password"
                    className="gold-input w-full font-mono"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Security PIN (4 Digits)</label>
                  <input
                    type="password"
                    value={newUserPin}
                    onChange={e => setNewUserPin(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="gold-input w-full font-mono text-center tracking-widest font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 1B: EDIT EMPLOYEE CREDENTIALS & RESET PASSWORD ─── */}
      {isEditUserOpen && editingUser && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-400 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-700" />
                <span>Edit Credentials & Permissions: {editingUser.name}</span>
              </h3>
              <button onClick={() => setIsEditUserOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Employee Name</label>
                <input
                  value={editUserName}
                  onChange={e => setEditUserName(e.target.value)}
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Role Assignment</label>
                  <select value={editUserRole} onChange={e => setEditUserRole(e.target.value as Role)} className="gold-input w-full font-bold cursor-pointer">
                    <option value="CASHIER">CASHIER</option>
                    <option value="STORE_MANAGER">STORE MANAGER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="CUSTOMER_SERVICE">CUSTOMER SERVICE</option>
                    <option value="INVENTORY_CLERK">INVENTORY CLERK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Assigned Store</label>
                  <select
                    value={editUserStoreId || outlets[0]?.id}
                    onChange={e => setEditUserStoreId(Number(e.target.value))}
                    className="gold-input w-full font-bold cursor-pointer"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Security PIN</label>
                  <input
                    type="password"
                    value={editUserPin}
                    onChange={e => setEditUserPin(e.target.value)}
                    maxLength={4}
                    className="gold-input w-full font-mono text-center tracking-widest font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Status</label>
                  <select
                    value={editUserStatus}
                    onChange={e => setEditUserStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="gold-input w-full font-bold cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE (DISABLED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">
                  Reset Password <span className="text-stone-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={e => setEditUserPassword(e.target.value)}
                  placeholder="Enter new password to reset"
                  className="gold-input w-full font-mono"
                  minLength={6}
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 1C: SUBSCRIPTION TIMELINE & PLAN UPGRADE / RENEWAL ─── */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-lg w-full p-6 space-y-4 bg-white border-2 border-amber-400 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Manage Subscription & Billing Timeline</span>
                </h3>
                <p className="text-[11px] text-stone-500">Scale store quota and employee seats across your retail network</p>
              </div>
              <button onClick={() => setIsUpgradeModalOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            {/* Current Timeline Card */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Current Active Plan</span>
                <span className="font-black text-amber-950 text-sm">{currentPlan}</span>
                <span className="text-[10px] text-stone-600 block mt-0.5">
                  Renews: <strong className="text-amber-900 font-mono">{tenantDetails?.subscriptionEndDate || '2026-10-12'}</strong> ({tenantDetails?.daysRemaining ?? 30} days left)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Billing Cycle</span>
                <span className="gold-badge text-[10px]">{tenantDetails?.billingCycle || 'MONTHLY'}</span>
              </div>
            </div>

            {/* Billing Cycle Switcher */}
            <div className="flex items-center justify-between bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setUpgradeBillingCycle('MONTHLY')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  upgradeBillingCycle === 'MONTHLY' ? 'bg-amber-900 text-white shadow-sm' : 'text-stone-600'
                }`}
              >
                Monthly Plan (30 Days)
              </button>
              <button
                type="button"
                onClick={() => setUpgradeBillingCycle('ANNUAL')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  upgradeBillingCycle === 'ANNUAL' ? 'bg-amber-900 text-white shadow-sm' : 'text-stone-600'
                }`}
              >
                Annual Plan (12 Months • 15% Off)
              </button>
            </div>

            {/* Plans List */}
            <div className="space-y-2.5">
              {availablePlans.map(plan => {
                const isSelected = upgradePlanId === plan.id;
                const displayPrice = upgradeBillingCycle === 'ANNUAL'
                  ? Number(plan.price) * 10
                  : Number(plan.price);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setUpgradePlanId(plan.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 shadow-md'
                        : 'border-stone-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-950 text-xs">{plan.name}</span>
                        {isSelected && <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full">SELECTED</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-600 mt-1 font-medium">
                        <span>🏬 Up to <strong>{plan.maxStores} Stores</strong></span>
                        <span>•</span>
                        <span>👥 Up to <strong>{plan.maxUsers} Staff Seats</strong></span>
                        <span>•</span>
                        <span>⏳ <strong>{upgradeBillingCycle === 'ANNUAL' ? '365 Days' : '30 Days'}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-amber-950 text-sm">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        /{upgradeBillingCycle === 'ANNUAL' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-3 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpgradePlan}
                disabled={isUpgrading}
                className="w-2/3 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md text-xs"
              >
                {isUpgrading ? (
                  <span>Processing Real-Time Upgrade...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Confirm & Activate Subscription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD NEW SKU MASTER MODAL ─── */}
      {isAddSkuOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-700" />
                <span>Create Global Product Master SKU</span>
              </h3>
              <button onClick={() => setIsAddSkuOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddSku} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Product Title</label>
                <input
                  value={newSkuName}
                  onChange={e => setNewSkuName(e.target.value)}
                  placeholder="e.g. Organic Almond Milk 1L"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">EAN-13 Barcode</label>
                  <input
                    value={newSkuBarcode}
                    onChange={e => setNewSkuBarcode(e.target.value)}
                    placeholder="8901234567899"
                    className="gold-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Department Category</label>
                  <select value={newSkuCategory} onChange={e => setNewSkuCategory(e.target.value)} className="gold-input w-full cursor-pointer">
                    <option value="Dairy & Cold Storage">Dairy & Cold Storage</option>
                    <option value="Bakery & Breads">Bakery & Breads</option>
                    <option value="Beverages & Pantry">Beverages & Pantry</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Cost (₹)</label>
                  <input type="number" value={newSkuCost} onChange={e => setNewSkuCost(e.target.value)} className="gold-input w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Global Price (₹)</label>
                  <input type="number" value={newSkuPrice} onChange={e => setNewSkuPrice(e.target.value)} className="gold-input w-full font-mono font-bold text-amber-950" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">GST Slab %</label>
                  <select value={newSkuGst} onChange={e => setNewSkuGst(e.target.value)} className="gold-input w-full font-bold cursor-pointer">
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button type="button" onClick={() => setIsAddSkuOpen(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
                  <Plus className="w-4 h-4" />
                  <span>Save Master SKU</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: REGISTER NEW OUTLET STORE MODAL ─── */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-700" />
                <span>Register New Supermarket Outlet Store</span>
              </h3>
              <button onClick={() => setIsAddStoreOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddStore} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Store Branch Name</label>
                <input
                  value={newStoreName}
                  onChange={e => setNewStoreName(e.target.value)}
                  placeholder="e.g. MegaMart Fresh Pune Outlet"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">City / Location</label>
                <input
                  value={newStoreCity}
                  onChange={e => setNewStoreCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium flex justify-between items-center">
                <span>Quota Allocation Status:</span>
                <span className="font-mono font-bold text-emerald-700">{outlets.length + 1} / {maxStoresQuota === 999 ? '∞' : maxStoresQuota} Outlets Allowed</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsAddStoreOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Outlet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: STRICT PLAN QUOTA LIMIT EXCEEDED WARNING MODAL ─── */}
      {isQuotaExceededModalOpen && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up select-none">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-rose-500 shadow-2xl relative">
            <button
              onClick={() => setIsQuotaExceededModalOpen(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 font-bold"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-rose-950 text-base">{quotaExceededReason.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  Creation blocked by Super Admin boundary policy! Your active plan (<strong className="text-stone-900">{currentPlan}</strong>) permits a maximum limit of{' '}
                  <strong className="text-rose-700 font-bold font-mono">
                    {quotaExceededReason.max === 999 ? 'Unlimited' : quotaExceededReason.max}{' '}
                    {quotaExceededReason.type === 'STORES' ? 'Store Outlets' : 'Employee User Seats'}
                  </strong>. Only Super Admin can adjust subscription quotas.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1.5 font-mono text-xs text-rose-950">
              <div className="flex justify-between">
                <span>Current Utilization:</span>
                <span className="font-black text-rose-700">{quotaExceededReason.current} Units</span>
              </div>
              <div className="flex justify-between">
                <span>Maximum Allowed Limit:</span>
                <span className="font-black text-stone-800">{quotaExceededReason.max} Units</span>
              </div>
              <div className="pt-1 border-t border-rose-200 flex justify-between text-[11px] font-sans font-bold text-rose-900">
                <span>Status:</span>
                <span>⛔ BLOCKED (SUPER ADMIN GOVERNED)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] text-stone-500 font-bold uppercase">Super Admin Approval Needed:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsQuotaExceededModalOpen(false)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    setIsQuotaExceededModalOpen(false);
                    addNotification({
                      senderRole: 'TENANT_ADMIN',
                      senderName: 'Rajesh Sharma (Tenant HQ)',
                      senderTenant: 'MegaMart Retail India Ltd',
                      targetRole: 'SUPER_ADMIN',
                      type: 'UPGRADE_REQUEST',
                      title: `SaaS ${quotaExceededReason.type === 'STORES' ? 'Outlet Store' : 'User Seat'} Quota Upgrade Request`,
                      message: `MegaMart Retail India Ltd requested immediate quota expansion for ${quotaExceededReason.type === 'STORES' ? 'Store Outlets' : 'User Seats'}.`,
                      metadata: {
                        tenantId: 1,
                        tenantName: 'MegaMart Retail India Ltd',
                        requestedPlan: 'Enterprise Plan',
                        requestedStores: 10,
                        requestedUsers: 50
                      }
                    });
                    setMsg('Upgrade request submitted to Super Admin Notification Hub!');
                    setTimeout(() => setMsg(''), 5000);
                  }}
                  className="w-1/2 gold-button-primary py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 shadow-md"
                >
                  <span>Request Upgrade</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantAdminDashboardPage;
