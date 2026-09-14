import React, { useState, useEffect, useMemo } from 'react';
import { customerApi, transactionApi } from '../services/api';
import { usePosStore } from '../store/usePosStore';
import { useAuthStore } from '../store/useAuthStore';
import { Customer, Transaction } from '../types';
import {
  Users, Search, Phone, Award, History, Clock, X, Filter,
  ArrowUpRight, Receipt, Printer, ChevronRight, DollarSign,
  Crown, Star, ShoppingBag, Sparkles, TrendingUp, Calendar,
  CreditCard, CheckCircle2, User, ExternalLink, RefreshCw
} from 'lucide-react';

// Helper for local bills history (matching CashierPosPage)
const loadSavedBillsHistory = (tenantId: number = 1): any[] => {
  try {
    const key = tenantId === 1 ? 'megamart_bills_history' : `megamart_tenant_${tenantId}_bills_history`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((b: any) => b.id !== 'INV-891024' && b.id !== 'INV-891023' && b.id !== 'INV-891022');
      }
    }
  } catch (e) {}
  return [];
};

export interface CustomerHistoryItem {
  id: string;
  date: string;
  timestamp: number;
  paymentMethod: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  storeName?: string;
  items: {
    name: string;
    qty: number;
    price: number;
    total: number;
  }[];
}

export interface DetailedCustomer {
  id: string | number;
  name: string;
  phoneNumber: string;
  normalizedPhone: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'REGULAR';
  lastVisit: string;
  firstVisit: string;
  history: CustomerHistoryItem[];
}

export const CustomerDirectoryView: React.FC = () => {
  const { user } = useAuthStore();
  const { customersList } = usePosStore();
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [dbTransactions, setDbTransactions] = useState<Transaction[]>([]);
  const [billsHistory, setBillsHistory] = useState<any[]>(() => loadSavedBillsHistory(user?.tenantId || 1));
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'SPEND' | 'VISITS' | 'NAME' | 'RECENT'>('SPEND');

  // Selected customer for history view modal
  const [selectedCustomer, setSelectedCustomer] = useState<DetailedCustomer | null>(null);

  // Receipt Modal state
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<CustomerHistoryItem | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Fetch DB data on mount
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [custs, txns] = await Promise.all([
        customerApi.getCustomers().catch(() => []),
        transactionApi.getTenantTransactions().catch(() => [])
      ]);
      setDbCustomers(custs);
      setDbTransactions(txns);
    } catch (e) {
      console.error('Failed to fetch backend data for customer directory', e);
    } finally {
      setLoading(false);
    }
  };

  const currentTenantId = user?.tenantId || 1;
  const isDemoTenant = currentTenantId === 1;

  useEffect(() => {
    usePosStore.getState().loadTenantCustomers(currentTenantId);
    setBillsHistory(loadSavedBillsHistory(currentTenantId));
    fetchAllData();
  }, [currentTenantId]);

  // Helper function to extract 10 normalized digits (+91 9876543210 -> 9876543210)
  const normalizePhoneDigits = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 ? clean.slice(-10) : clean;
  };

  // Master Deduplicated Customers & Complete History Aggregator
  const aggregatedCustomers = useMemo<DetailedCustomer[]>(() => {
    const customerMap = new Map<string, {
      id: string | number;
      name: string;
      phoneNumber: string;
      normalizedPhone: string;
      loyaltyPoints: number;
      historyMap: Map<string, CustomerHistoryItem>;
    }>();

    const getOrCreateEntry = (phone: string, rawName?: string, rawId?: string | number) => {
      const normPhone = normalizePhoneDigits(phone);
      const key = normPhone || (rawId ? `id_${rawId}` : `name_${rawName || 'unknown'}`);

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: rawId || Date.now() + Math.floor(Math.random() * 10000),
          name: rawName && rawName !== 'Valued Customer' && rawName !== 'Walk-in Customer' && rawName !== 'Walk-in Guest' ? rawName : 'Valued Customer',
          phoneNumber: phone || 'N/A',
          normalizedPhone: normPhone,
          loyaltyPoints: 0,
          historyMap: new Map()
        });
      }

      const existing = customerMap.get(key)!;
      if (rawName && rawName !== 'Valued Customer' && rawName !== 'Walk-in Customer' && rawName !== 'Walk-in Guest' && (existing.name === 'Valued Customer' || !existing.name)) {
        existing.name = rawName;
      }
      if (phone && (!existing.phoneNumber || existing.phoneNumber === 'N/A')) {
        existing.phoneNumber = phone;
      }
      if (rawId && (!existing.id || typeof existing.id !== 'number')) {
        existing.id = rawId;
      }
      return existing;
    };

    // Filter DB entities by tenant boundary for non-demo users
    const filteredDbCustomers = isDemoTenant ? dbCustomers : dbCustomers.filter(c => c.tenantId === currentTenantId);
    const filteredDbTxns = isDemoTenant ? dbTransactions : dbTransactions.filter(t => t.tenantId === currentTenantId);

    // Build lookup maps for fast ID & phone resolution
    const customerById = new Map<number | string, Customer>();
    const customerByPhone = new Map<string, Customer>();

    // 1. Process DB Customers
    filteredDbCustomers.forEach(c => {
      if (c.id) customerById.set(c.id, c);
      const norm = normalizePhoneDigits(c.phoneNumber);
      if (norm) customerByPhone.set(norm, c);
      const entry = getOrCreateEntry(c.phoneNumber, c.name, c.id);
      entry.loyaltyPoints = Math.max(entry.loyaltyPoints, c.loyaltyPoints || 0);
    });

    // 2. Process POS Store Customers
    customersList.forEach(c => {
      if (!isDemoTenant && c.tenantId && c.tenantId !== currentTenantId) return;
      if (c.id && !customerById.has(c.id)) customerById.set(c.id, c);
      const norm = normalizePhoneDigits(c.phoneNumber);
      if (norm && !customerByPhone.has(norm)) customerByPhone.set(norm, c);
      const entry = getOrCreateEntry(c.phoneNumber, c.name, c.id);
      entry.loyaltyPoints = Math.max(entry.loyaltyPoints, c.loyaltyPoints || 0);
    });

    // 3. Process DB Transactions & Attach to Customer History
    filteredDbTxns.forEach(t => {
      let phone = t.customerPhone || '';
      let name = t.customerName || '';
      let custId = t.customerId;

      // Look up customer by ID or Phone to avoid creating dummy duplicate customer records
      if (!phone && custId && customerById.has(custId)) {
        const matched = customerById.get(custId)!;
        phone = matched.phoneNumber || '';
        if (!name) name = matched.name;
      }
      if (!name && phone) {
        const norm = normalizePhoneDigits(phone);
        if (norm && customerByPhone.has(norm)) {
          const matched = customerByPhone.get(norm)!;
          name = matched.name;
          if (!custId) custId = matched.id;
        }
      }

      // Anonymous walk-ins with no phone and no customer ID are not loyalty directory members
      const normPhone = normalizePhoneDigits(phone);
      if (!normPhone && !custId) {
        return;
      }

      const entry = getOrCreateEntry(phone, name, custId);

      const txnId = t.invoiceNumber || `INV-${String(t.id).padStart(6, '0')}`;
      if (!entry.historyMap.has(txnId)) {
        const rawDate = t.timestamp || t.createdAt;
        const dateObj = rawDate ? new Date(rawDate) : new Date();
        entry.historyMap.set(txnId, {
          id: txnId,
          date: dateObj.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          timestamp: dateObj.getTime(),
          paymentMethod: t.paymentMethod || 'UPI',
          totalAmount: Number(t.totalAmount) || 0,
          taxAmount: Number(t.taxAmount) || 0,
          discountAmount: Number(t.discountAmount) || 0,
          storeName: `Store #${t.storeId || 1}`,
          items: (t.lineItems || []).map(li => ({
            name: li.product?.name || `Product #${li.id}`,
            qty: li.quantity || 1,
            price: Number(li.unitPrice) || 0,
            total: (Number(li.unitPrice) || 0) * (li.quantity || 1)
          }))
        });
      }
    });

    // 4. Process Local Bills History & Attach to Customer History (with deduplication)
    billsHistory.forEach(b => {
      // Ignore dummy mock seed bills
      if (b.id === 'INV-891024' || b.id === 'INV-891023' || b.id === 'INV-891022') return;

      const phone = b.customerPhone || '';
      const name = b.customerName || '';
      const normPhone = normalizePhoneDigits(phone);
      if (!normPhone) return;

      const entry = getOrCreateEntry(phone, name);

      const billId = b.id || `INV-${b.dbTxnId || 'LOCAL'}`;
      // Check if bill is already present in history to prevent double counting
      const alreadyExists = Array.from(entry.historyMap.values()).some(h =>
        h.id === billId ||
        (b.dbTxnId && (h.id === `INV-${String(b.dbTxnId).padStart(6, '0')}` || h.id === `TXN-${b.dbTxnId}`)) ||
        (Math.abs(h.totalAmount - (Number(b.amount || b.total) || 0)) < 0.01 &&
         Math.abs(h.timestamp - (b.timestamp || 0)) < 180000)
      );

      if (!alreadyExists) {
        const dateStr = b.date || new Date().toLocaleString();
        const dateObj = new Date(dateStr);
        const timestamp = b.timestamp || (isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime());

        entry.historyMap.set(billId, {
          id: billId,
          date: dateStr,
          timestamp,
          paymentMethod: b.paymentMethod || b.paymentMode || 'UPI QR',
          totalAmount: Number(b.amount || b.total) || 0,
          taxAmount: Number(b.tax) || 0,
          discountAmount: Number(b.discount) || 0,
          storeName: 'MegaMart Flagship',
          items: (b.items || []).map((it: any) => ({
            name: it.product?.name || it.name || 'Store Item',
            qty: it.quantity || it.qty || 1,
            price: Number(it.product?.globalPrice || it.price) || 0,
            total: (Number(it.product?.globalPrice || it.price) || 0) * (it.quantity || it.qty || 1)
          }))
        });
      }
    });

    // Add Default Mock Demonstration Customers if pool is small
    if (customerMap.size === 0) {
      const mockList = [
        { name: 'Rahul Sharma', phone: '9876543210', points: 450 },
        { name: 'Priya Patel', phone: '9812345678', points: 120 },
        { name: 'Suresh Kumar', phone: '9765432109', points: 850 },
        { name: 'Ananya Roy', phone: '9988776655', points: 210 },
      ];
      mockList.forEach(m => {
        const entry = getOrCreateEntry(m.phone, m.name);
        entry.loyaltyPoints = m.points;
      });
    }

    // Convert Map to final DetailedCustomer list
    return Array.from(customerMap.values()).map(c => {
      const historyList = Array.from(c.historyMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      const totalSpent = historyList.reduce((sum, h) => sum + h.totalAmount, 0);
      const visitCount = historyList.length;

      // Tier Calculation
      let tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'REGULAR' = 'REGULAR';
      if (totalSpent >= 20000) tier = 'PLATINUM';
      else if (totalSpent >= 10000) tier = 'GOLD';
      else if (totalSpent >= 3000) tier = 'SILVER';

      // Calculated Points fallback
      const calculatedPts = Math.max(c.loyaltyPoints, Math.floor(totalSpent / 100));

      const lastVisit = historyList.length > 0 ? historyList[0].date : 'Recently Visited';
      const firstVisit = historyList.length > 0 ? historyList[historyList.length - 1].date : 'N/A';

      return {
        id: c.id,
        name: c.name,
        phoneNumber: c.phoneNumber,
        normalizedPhone: c.normalizedPhone,
        loyaltyPoints: calculatedPts,
        totalSpent,
        visitCount,
        tier,
        lastVisit,
        firstVisit,
        history: historyList
      };
    });
  }, [dbCustomers, dbTransactions, billsHistory, customersList]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return aggregatedCustomers
      .filter(c => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q) || c.normalizedPhone.includes(q);
        const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;
        return matchesQuery && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'SPEND') return b.totalSpent - a.totalSpent;
        if (sortBy === 'VISITS') return b.visitCount - a.visitCount;
        if (sortBy === 'NAME') return a.name.localeCompare(b.name);
        if (sortBy === 'RECENT') return (b.history[0]?.timestamp || 0) - (a.history[0]?.timestamp || 0);
        return 0;
      });
  }, [aggregatedCustomers, searchQuery, selectedTier, sortBy]);

  // Total Metrics Overview
  const totalCustomerCount = aggregatedCustomers.length;
  const totalRevenue = aggregatedCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalVisits = aggregatedCustomers.reduce((acc, c) => acc + c.visitCount, 0);
  const averageSpend = totalCustomerCount > 0 ? totalRevenue / totalCustomerCount : 0;

  const tierCounts = useMemo(() => {
    const counts = { PLATINUM: 0, GOLD: 0, SILVER: 0, REGULAR: 0 };
    aggregatedCustomers.forEach(c => counts[c.tier]++);
    return counts;
  }, [aggregatedCustomers]);

  // Tier Color Helpers
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 text-amber-950 border border-amber-400 shadow-xs"><Crown className="w-3 h-3 text-amber-700" /> PLATINUM VIP</span>;
      case 'GOLD':
        return <span className="gold-badge"><Star className="w-3 h-3 text-amber-600" /> GOLD MEMBER</span>;
      case 'SILVER':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-300"><Sparkles className="w-3 h-3 text-stone-500" /> SILVER</span>;
      default:
        return <span className="badge-stone">REGULAR</span>;
    }
  };

  const getAvatarBg = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white border-2 border-amber-300 shadow-md';
      case 'GOLD': return 'bg-gradient-to-br from-amber-400 to-amber-500 text-white border border-amber-300 shadow-xs';
      case 'SILVER': return 'bg-gradient-to-br from-stone-300 to-stone-400 text-stone-900 border border-stone-300';
      default: return 'bg-amber-100 text-amber-900 border border-amber-300';
    }
  };

  return (
    <div className="space-y-6 select-none animate-slide-up">
      {/* ─── PAGE HEADER & METRICS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-amber-950 text-lg tracking-tight leading-tight">Unique Customers & Purchase History</h1>
              <p className="text-xs text-stone-500 font-medium">Browse deduplicated customer directory, loyalty tier standings, and click to view full history.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gold-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 block">Total Unique Customers</span>
            <span className="text-2xl font-black text-amber-950 font-tabular-nums">{totalCustomerCount}</span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">100% Deduplicated</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="gold-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 block">Total Customer Spend</span>
            <span className="text-2xl font-black text-amber-950 font-tabular-nums">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-amber-700 font-bold block mt-0.5">Across {totalVisits} Bills</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="gold-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 block">Avg Lifetime Value</span>
            <span className="text-2xl font-black text-amber-950 font-tabular-nums">₹{averageSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-stone-500 font-bold block mt-0.5">Per Customer</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="gold-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 block">VIP Tier Breakdown</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
              <span className="text-amber-800">{tierCounts.PLATINUM} VIP</span>
              <span className="text-stone-300">•</span>
              <span className="text-amber-600">{tierCounts.GOLD} Gold</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-600">{tierCounts.SILVER} Slv</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ─── */}
      <div className="gold-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customer name or mobile number (e.g. 9876543210 or Rahul)..."
              className="gold-input w-full pl-10 py-2.5 text-xs font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="gold-input text-xs font-bold py-2 cursor-pointer"
            >
              <option value="SPEND">Highest Lifetime Spend</option>
              <option value="VISITS">Most Purchases / Visits</option>
              <option value="RECENT">Most Recently Visited</option>
              <option value="NAME">Name (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Tier Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-100">
          <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter VIP Tier:
          </span>
          {['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'REGULAR'].map(tier => {
            const isActive = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-amber-100/70 hover:text-amber-950'
                }`}
              >
                {tier === 'ALL' ? 'ALL CUSTOMERS' : tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── UNIQUE CUSTOMERS DATA TABLE ─── */}
      <div className="gold-card overflow-hidden">
        <div className="px-5 py-3.5 bg-amber-50/60 border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-800" />
            <h3 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
              Customer Directory ({filteredCustomers.length} Unique Records)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-stone-500">💡 Click any row to view complete transaction history</span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-amber-300" />
            <p className="text-sm font-bold text-stone-700">No matching customers found</p>
            <p className="text-xs text-stone-500">Try adjusting your search query or tier filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-100/40 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
                <tr>
                  <th className="p-3.5 pl-5">Customer Profile</th>
                  <th className="p-3.5">Mobile Number</th>
                  <th className="p-3.5">VIP Tier</th>
                  <th className="p-3.5 text-center">Total Visits</th>
                  <th className="p-3.5 text-right">Loyalty Points</th>
                  <th className="p-3.5 text-right">Total Lifetime Spend (₹)</th>
                  <th className="p-3.5">Last Purchased</th>
                  <th className="p-3.5 text-center pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 font-medium text-stone-800">
                {filteredCustomers.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-amber-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Name & Avatar */}
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${getAvatarBg(c.tier)}`}>
                          {c.name ? c.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-extrabold text-stone-900 group-hover:text-amber-900 flex items-center gap-1.5 text-xs">
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 block font-mono">ID: #{c.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-3.5 font-mono font-bold text-stone-700">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-700/60" />
                        <span>{c.phoneNumber}</span>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="p-3.5">
                      {getTierBadge(c.tier)}
                    </td>

                    {/* Visit Count */}
                    <td className="p-3.5 text-center font-mono font-bold text-stone-900">
                      <span className="bg-amber-100/80 text-amber-950 px-2.5 py-1 rounded-lg text-xs">
                        {c.visitCount} {c.visitCount === 1 ? 'bill' : 'bills'}
                      </span>
                    </td>

                    {/* Loyalty Points */}
                    <td className="p-3.5 text-right font-mono font-extrabold text-amber-800">
                      <div className="flex items-center justify-end gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>{c.loyaltyPoints} pts</span>
                      </div>
                    </td>

                    {/* Total Lifetime Spend */}
                    <td className="p-3.5 text-right font-mono font-black text-amber-950 text-sm">
                      ₹{c.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Last Visit */}
                    <td className="p-3.5 text-stone-500 text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{c.lastVisit}</span>
                      </div>
                    </td>

                    {/* View History Button */}
                    <td className="p-3.5 text-center pr-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="gold-button-primary text-[11px] px-3 py-1.5 rounded-xl font-bold group-hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span>View History</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CUSTOMER HISTORY DETAIL MODAL / DRAWER ─── */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex justify-end z-50 animate-slide-in select-none">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-amber-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${getAvatarBg(selectedCustomer.tier)}`}>
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-white text-base tracking-tight">{selectedCustomer.name}</h2>
                    {getTierBadge(selectedCustomer.tier)}
                  </div>
                  <div className="flex items-center gap-3 text-amber-200/90 text-xs font-mono mt-0.5">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedCustomer.phoneNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> {selectedCustomer.loyaltyPoints} Loyalty Points</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setHistorySearchQuery('');
                }}
                className="p-2 text-amber-200 hover:text-white hover:bg-amber-800/60 rounded-xl transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Summary Statistics Header */}
            <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Total Lifetime Spend</span>
                <span className="text-lg font-black text-amber-950 font-tabular-nums">
                  ₹{selectedCustomer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Total Visited Bills</span>
                <span className="text-lg font-black text-amber-950 font-tabular-nums">
                  {selectedCustomer.visitCount} {selectedCustomer.visitCount === 1 ? 'Transaction' : 'Transactions'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Avg Order Value (AOV)</span>
                <span className="text-lg font-black text-amber-950 font-tabular-nums">
                  ₹{selectedCustomer.visitCount > 0 ? (selectedCustomer.totalSpent / selectedCustomer.visitCount).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* History Filter & Search Bar */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                  Transaction Timeline ({selectedCustomer.history.length})
                </h3>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  placeholder="Filter invoice or item..."
                  className="gold-input w-full pl-8 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* History Timeline List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
              {selectedCustomer.history.length === 0 ? (
                <div className="p-12 text-center text-stone-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-amber-300" />
                  <p className="text-sm font-bold text-stone-700">No purchase records registered</p>
                  <p className="text-xs text-stone-500">This customer hasn't completed any store transactions yet.</p>
                </div>
              ) : (
                selectedCustomer.history
                  .filter(h => {
                    const q = historySearchQuery.toLowerCase();
                    if (!q) return true;
                    return h.id.toLowerCase().includes(q) || h.items.some(i => i.name.toLowerCase().includes(q));
                  })
                  .map(bill => (
                    <div key={bill.id} className="gold-card p-4 space-y-3 hover:border-amber-400 transition-all">
                      {/* Bill Header */}
                      <div className="flex justify-between items-start border-b border-amber-200/60 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-950 text-sm">{bill.id}</span>
                            <span className="gold-badge text-[9px]">{bill.paymentMethod}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium mt-0.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{bill.date}</span>
                            <span>•</span>
                            <span>{bill.storeName || 'Store #1'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-extrabold text-stone-400 block uppercase">Total Amount</span>
                          <span className="font-mono font-black text-amber-950 text-base">₹{bill.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Items Purchased Breakdown */}
                      <div className="space-y-1.5 text-xs font-medium text-stone-800">
                        {bill.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-amber-50/40 px-2.5 py-1.5 rounded-lg text-xs">
                            <span className="font-semibold text-stone-900">{it.name} <span className="text-amber-800 font-bold">x{it.qty}</span></span>
                            <span className="font-mono font-bold text-amber-950">₹{it.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bill Footer Actions */}
                      <div className="pt-2 border-t border-amber-100 flex justify-between items-center">
                        <span className="text-[10px] text-stone-500 font-medium">
                          {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'} in bill
                        </span>

                        <button
                          onClick={() => setSelectedBillForReceipt(bill)}
                          className="gold-btn-secondary text-[11px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-amber-100"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-800" />
                          <span>Thermal Receipt / Print</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── THERMAL RECEIPT PREVIEW MODAL ─── */}
      {selectedBillForReceipt && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none receipt-modal-backdrop animate-slide-up">
          <div className="gold-card max-w-sm w-full p-5 space-y-4 bg-white text-stone-900 font-mono text-xs border-2 border-amber-300 shadow-2xl relative">
            <button
              onClick={() => setSelectedBillForReceipt(null)}
              className="no-print absolute top-3 right-3 p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="print-area space-y-3">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-stone-300">
                <div className="font-black text-base text-stone-900 tracking-tight">MEGAMART RETAIL</div>
                <div className="text-[10px] text-stone-500">Flagship Hypermarket #101</div>
                <div className="text-[10px] text-stone-500">GSTIN: 27AAAAA0000A1Z5</div>
                <div className="text-[11px] font-extrabold text-amber-900 mt-1">TAX INVOICE</div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span className="text-stone-500">Invoice:</span>
                  <span className="font-bold">{selectedBillForReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Date:</span>
                  <span>{selectedBillForReceipt.date}</span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Customer:</span>
                    <span className="font-bold">{selectedCustomer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-bold">{selectedBillForReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase pb-1 border-b border-stone-200">
                  <span>Item</span>
                  <span>Qty x Price</span>
                  <span className="text-right">Amt</span>
                </div>
                {selectedBillForReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[140px] font-semibold">{it.name}</span>
                    <span className="text-stone-500">{it.qty} x ₹{it.price}</span>
                    <span className="font-bold text-right">₹{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-dashed border-stone-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedBillForReceipt.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-amber-950 pt-1 border-t border-stone-300">
                  <span>TOTAL BILLED:</span>
                  <span>₹{selectedBillForReceipt.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[10px] text-stone-500 border-t border-dashed border-stone-300 space-y-0.5">
                <p className="font-bold text-stone-700">Thank you for shopping at MegaMart!</p>
                <p>Have a wonderful day ahead.</p>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="no-print pt-2 flex gap-2">
              <button
                onClick={() => setSelectedBillForReceipt(null)}
                className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 gold-button-primary py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectoryView;
