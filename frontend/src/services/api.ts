import { User, Store, Product, Customer, Transaction, AnalyticsData } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : '') + '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('megamart_jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid email or password');
    return res.json();
  },

  pinLogin: async (tenantId: number, pinCode: string) => {
    const res = await fetch(`${API_BASE}/auth/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, pinCode })
    });
    if (!res.ok) throw new Error('Invalid PIN code');
    return res.json();
  },

  registerTenant: async (data: {
    companyName: string;
    adminName: string;
    email: string;
    password: string;
    planId: number;
    billingCycle?: string;
    paymentMethod?: string;
    paymentId?: string;
    amountPaid?: number;
  }) => {
    const res = await fetch(`${API_BASE}/auth/register-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) return null;
    return res.json();
  }
};

export const storeApi = {
  getStores: async (): Promise<Store[]> => {
    const res = await fetch(`${API_BASE}/stores`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  create: async (data: { name: string; location: string; code?: string }): Promise<Store> => {
    const res = await fetch(`${API_BASE}/stores`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create store outlet');
    }
    return res.json();
  },

  getStaff: async (storeId: number) => {
    const res = await fetch(`${API_BASE}/stores/${storeId}/staff`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }
};

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  create: async (data: {
    barcode: string;
    name: string;
    globalPrice: number;
    costPrice?: number;
    category: string;
    unit?: string;
    imageUrl?: string;
    storeId?: number;
    initialStock?: number;
    batchNumber?: string;
    expiryDate?: string;
  }): Promise<Product> => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to onboard product');
    }
    return res.json();
  },

  update: async (id: number, data: any): Promise<Product> => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  getStoreInventory: async (storeId: number): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products/store/${storeId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  getFEFOInventory: async (storeId: number): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products/fefo/${storeId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch FEFO inventory');
    return res.json();
  },

  scanBarcode: async (storeId: number, barcode: string): Promise<Product | null> => {
    const res = await fetch(`${API_BASE}/products/scan?storeId=${storeId}&barcode=${barcode}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Scan failed');
    return res.json();
  },

  updateStock: async (storeId: number, productId: number, stockQuantity: number) => {
    const res = await fetch(`${API_BASE}/products/inventory/${productId}?storeId=${storeId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ stockQuantity })
    });
    if (!res.ok) throw new Error('Failed to update stock');
    return res.json();
  }
};

export const customerApi = {
  lookupByPhone: async (phone: string): Promise<Customer | null> => {
    const res = await fetch(`${API_BASE}/customers/lookup?phone=${encodeURIComponent(phone)}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Lookup failed');
    return res.json();
  },

  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE}/customers`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getCustomerHistory: async (customerId: number): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/history`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createCustomer: async (data: { name: string; phoneNumber: string }): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create customer');
    return res.json();
  }
};

export const transactionApi = {
  create: async (data: {
    storeId: number;
    customerId?: number;
    customerPhone?: string;
    customerName?: string;
    lineItems: { productId: number; quantity: number }[];
    paymentMethod: string;
    taxAmount: number;
    discountAmount: number;
    invoiceNumber?: string;
  }): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Transaction submission failed');
    return res.json();
  },

  getTenantTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/transactions`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getStoreTransactions: async (storeId: number): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/transactions/store/${storeId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }
};

export const analyticsApi = {
  getTenantAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch(`${API_BASE}/analytics/tenant`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
};

export const paymentApi = {
  createOrder: async (data: {
    amount: number;
    currency?: string;
    receipt?: string;
    description?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: string;
  }) => {
    const res = await fetch(`/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Payment order creation failed');
    return res.json();
  },

  verifyPayment: async (data: {
    orderId: string;
    paymentId: string;
    signature: string;
    paymentMethod: string;
    amount: number;
  }) => {
    const res = await fetch(`/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Payment verification failed');
    return res.json();
  },

  getUpiQr: async (orderId: string, amount: number, payeeName?: string) => {
    const res = await fetch(`/api/payments/upi-qr?orderId=${encodeURIComponent(orderId)}&amount=${amount}&payeeName=${encodeURIComponent(payeeName || 'MegaMart Retail')}`);
    if (!res.ok) throw new Error('UPI QR generation failed');
    return res.json();
  },

  processCard: async (data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;
    amount: number;
    orderId: string;
  }) => {
    const res = await fetch(`/api/payments/process-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Card authorization failed');
    return res.json();
  },

  createStripeIntent: async (data: {
    amount: number;
    currency?: string;
    receiptEmail?: string;
    description?: string;
  }) => {
    const res = await fetch(`/api/payments/stripe/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Stripe intent creation failed');
    return res.json();
  },

  confirmStripe: async (data: {
    paymentIntentId: string;
    paymentMethodId?: string;
  }) => {
    const res = await fetch(`/api/payments/stripe/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Stripe confirmation failed');
    return res.json();
  }
};

export const aiApi = {
  askCopilot: async (query: string, role?: string, storeName?: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai/copilot`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query, role, storeName })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  getDemandForecast: async (storeName: string, lowStockItems?: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/ai/demand-forecast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storeName, lowStockItems })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  getAuditRisk: async (incidents?: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/ai/audit-risk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ incidents })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  getCustomerInsights: async (customerName: string, totalSpent: number, tier: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai/customer-insights`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ customerName, totalSpent, tier })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  getExpiryRisk: async (storeName: string, expiryItems?: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/ai/expiry-risk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storeName, expiryItems })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  parseGs1Barcode: async (barcode: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai/parse-gs1-barcode`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ barcode })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }
};

export const planApi = {
  getPlans: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/plans`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch subscription plans:', e);
    }
    return [
      { id: 1, name: 'Starter Boutique', maxStores: 2, maxUsers: 10, price: 4999 },
      { id: 2, name: 'Standard Chain', maxStores: 10, maxUsers: 50, price: 14999 },
      { id: 3, name: 'Enterprise Hyper-Scale', maxStores: 50, maxUsers: 500, price: 39999 }
    ];
  }
};

export const tenantApi = {
  getMe: async () => {
    const res = await fetch(`${API_BASE}/tenant/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tenant info');
    return res.json();
  },

  upgradeSubscription: async (planId: number, billingCycle?: string) => {
    const res = await fetch(`${API_BASE}/tenant/upgrade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ planId, billingCycle: billingCycle || 'MONTHLY' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Subscription upgrade failed');
    }
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/tenant/users`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createTenantUser: async (userData: {
    name: string;
    email: string;
    password?: string;
    pinCode?: string;
    role: string;
    storeId?: number;
  }): Promise<User> => {
    const res = await fetch(`${API_BASE}/tenant/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'User creation failed');
    }
    return res.json();
  },

  updateTenantUser: async (id: number, userData: {
    name?: string;
    password?: string;
    pinCode?: string;
    role?: string;
    storeId?: number;
    status?: string;
  }): Promise<User> => {
    const res = await fetch(`${API_BASE}/tenant/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'User update failed');
    }
    return res.json();
  },

  deleteTenantUser: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/tenant/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to de-provision user');
    }
    return res.json();
  }
};

export const superAdminApi = {
  getTenants: async (): Promise<any[]> => {
    let backendTenants: any[] = [];
    try {
      const res = await fetch(`${API_BASE}/superadmin/tenants`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) backendTenants = data;
      }
    } catch (e) {
      console.warn('Backend superadmin/tenants fetch failed, checking local registry:', e);
    }

    // Read local registered users
    let localRegistered: any[] = [];
    try {
      localRegistered = JSON.parse(localStorage.getItem('megamart_registered_users') || '[]');
    } catch (e) {}

    // Read current logged in tenant details if available
    let activeTenantDetails: any = null;
    try {
      activeTenantDetails = JSON.parse(localStorage.getItem('megamart_tenant_details') || 'null');
    } catch (e) {}

    // Read manually onboarded tenants
    let extraTenants: any[] = [];
    try {
      extraTenants = JSON.parse(localStorage.getItem('megamart_tenants_store') || '[]');
    } catch (e) {}

    const localMapped = localRegistered.map((u: any, idx: number) => {
      const tInfo = u.tenantInfo || {};
      const planName = tInfo.planName || (tInfo.planId === 3 ? 'Enterprise Plan' : tInfo.planId === 1 ? 'Starter Plan' : 'Standard Plan');
      const companyName = u.companyName || tInfo.companyName || u.name || 'Registered Client Tenant';
      const adminName = u.name || tInfo.adminName || (companyName + ' Admin');
      const adminEmail = u.email || tInfo.adminEmail || ('admin@' + companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const paymentMethod = tInfo.paymentMethod || 'Razorpay UPI';
      const paymentId = tInfo.paymentId || ('pay_rzp_' + (u.tenantId || (100 + idx)));
      const amountPaid = tInfo.amountPaid || tInfo.planPrice || 14999;
      const invoiceNumber = tInfo.invoiceNumber || ('MM-SAAS-' + String(1000 + (u.tenantId || idx)));
      const gstin = tInfo.gstin || '27AAAAA0000A1Z5';
      const billingCycle = tInfo.billingCycle || 'MONTHLY';
      const maxStores = tInfo.maxStores || (planName.toLowerCase().includes('enterprise') ? 50 : planName.toLowerCase().includes('starter') ? 1 : 5);
      const maxUsers = tInfo.maxUsers || (planName.toLowerCase().includes('enterprise') ? 500 : planName.toLowerCase().includes('starter') ? 5 : 25);

      return {
        id: u.tenantId || (100 + idx),
        name: companyName,
        plan: planName,
        status: tInfo.status || 'ACTIVE',
        storesCount: tInfo.activeStoresCount || 1,
        usersCount: tInfo.activeUsersCount || 1,
        monthlyFee: amountPaid,
        amountPaid: amountPaid,
        renewalDate: tInfo.renewalDate || (billingCycle === 'ANNUAL' ? '2027-09-14' : '2026-10-14'),
        startDate: tInfo.startDate || new Date().toISOString().split('T')[0],
        city: tInfo.city || 'Mumbai',
        adminName: adminName,
        adminEmail: adminEmail,
        paymentMethod: paymentMethod,
        paymentId: paymentId,
        invoiceNumber: invoiceNumber,
        gstin: gstin,
        maxStores: maxStores,
        maxUsers: maxUsers,
        billingCycle: billingCycle
      };
    });

    // If active tenant is not yet in localRegistered, map it too
    if (activeTenantDetails && activeTenantDetails.companyName) {
      localMapped.push({
        id: activeTenantDetails.id || 999,
        name: activeTenantDetails.companyName,
        plan: activeTenantDetails.planName || 'Standard Plan',
        status: activeTenantDetails.status || 'ACTIVE',
        storesCount: activeTenantDetails.activeStoresCount || 1,
        usersCount: activeTenantDetails.activeUsersCount || 1,
        monthlyFee: activeTenantDetails.planPrice || 14999,
        amountPaid: activeTenantDetails.planPrice || 14999,
        renewalDate: activeTenantDetails.subscriptionEndDate || '2027-09-14',
        startDate: activeTenantDetails.subscriptionStartDate || new Date().toISOString().split('T')[0],
        city: 'Mumbai',
        adminName: activeTenantDetails.adminName || (activeTenantDetails.companyName + ' Admin'),
        adminEmail: activeTenantDetails.adminEmail || ('admin@' + activeTenantDetails.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'),
        paymentMethod: 'Razorpay UPI',
        paymentId: 'pay_active_' + activeTenantDetails.id,
        invoiceNumber: 'MM-SAAS-' + String(1000 + (activeTenantDetails.id || 1)),
        gstin: '27AAAAA0000A1Z5',
        maxStores: activeTenantDetails.maxStores || 5,
        maxUsers: activeTenantDetails.maxUsers || 25,
        billingCycle: activeTenantDetails.billingCycle || 'MONTHLY'
      });
    }

    const defaults = [
      { 
        id: 1, 
        name: 'MegaMart Retail India Ltd', 
        plan: 'Enterprise Hyper-Scale', 
        status: 'ACTIVE', 
        storesCount: 2, 
        monthlyFee: 39999, 
        amountPaid: 39999,
        renewalDate: '2026-10-01', 
        startDate: '2025-10-01',
        usersCount: 14, 
        city: 'Mumbai', 
        adminName: 'Vikramaditya Singhania',
        adminEmail: 'v.singhania@megamart.com',
        paymentMethod: 'Corporate Wire (HDFC)',
        paymentId: 'HDFC_CORP_998124',
        invoiceNumber: 'MM-SAAS-00101',
        gstin: '27AABCM9876Q1Z0',
        maxStores: 50, 
        maxUsers: 500, 
        billingCycle: 'ANNUAL' 
      },
      { 
        id: 2, 
        name: 'Apex Superstores Bharat', 
        plan: 'Standard Chain', 
        status: 'ACTIVE', 
        storesCount: 1, 
        monthlyFee: 14999, 
        amountPaid: 14999,
        renewalDate: '2026-09-28', 
        startDate: '2026-08-28',
        usersCount: 6, 
        city: 'Bengaluru', 
        adminName: 'Rajesh Nambiar',
        adminEmail: 'rajesh@apexsuperstores.in',
        paymentMethod: 'Razorpay UPI',
        paymentId: 'pay_rzp_apex_77812',
        invoiceNumber: 'MM-SAAS-00102',
        gstin: '29ABCDE1234F1Z5',
        maxStores: 10, 
        maxUsers: 50, 
        billingCycle: 'MONTHLY' 
      }
    ];

    // Combine backendTenants, localMapped, extraTenants, and defaults uniquely by name
    const combined: any[] = [];
    const seenNames = new Set<string>();

    const addTenant = (t: any) => {
      if (!t || !t.name) return;
      const key = t.name.trim().toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);

      combined.push({
        id: t.id || (Date.now() + Math.floor(Math.random() * 1000)),
        name: t.name,
        plan: t.plan || 'Standard Chain',
        status: t.status || 'ACTIVE',
        storesCount: t.storesCount || 1,
        usersCount: t.usersCount || 1,
        monthlyFee: t.monthlyFee || t.amountPaid || 14999,
        amountPaid: t.amountPaid || t.monthlyFee || 14999,
        renewalDate: t.renewalDate || '2027-09-14',
        startDate: t.startDate || new Date().toISOString().split('T')[0],
        city: t.city || 'Mumbai',
        adminName: t.adminName || (t.name + ' Admin'),
        adminEmail: t.adminEmail || ('admin@' + t.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'),
        paymentMethod: t.paymentMethod || 'Razorpay UPI',
        paymentId: t.paymentId || ('pay_rzp_' + t.id),
        invoiceNumber: t.invoiceNumber || ('MM-SAAS-' + String(1000 + (t.id || 1))),
        gstin: t.gstin || '27AAAAA0000A1Z5',
        maxStores: t.maxStores || 10,
        maxUsers: t.maxUsers || 50,
        billingCycle: t.billingCycle || 'MONTHLY'
      });
    };

    // User's newly registered clients come first!
    localMapped.forEach(addTenant);
    extraTenants.forEach(addTenant);
    backendTenants.forEach(addTenant);
    defaults.forEach(addTenant);

    return combined;
  },

  createTenant: async (data: { name: string; city: string; planId?: number; plan?: string; fee?: number; adminName?: string; adminEmail?: string }) => {
    let created: any = null;
    try {
      const res = await fetch(`${API_BASE}/superadmin/tenants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) created = await res.json();
    } catch (e) {}

    if (!created) {
      created = {
        id: Date.now(),
        name: data.name,
        city: data.city || 'Mumbai',
        plan: data.plan || 'Standard Chain',
        status: 'ACTIVE',
        storesCount: 1,
        usersCount: 1,
        monthlyFee: data.fee || 14999,
        amountPaid: data.fee || 14999,
        renewalDate: '2027-09-14',
        startDate: new Date().toISOString().split('T')[0],
        adminName: data.adminName || (data.name + ' Owner'),
        adminEmail: data.adminEmail || ('admin@' + data.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'),
        invoiceNumber: `MM-SAAS-${Date.now().toString().slice(-5)}`,
        paymentMethod: 'Direct SaaS Onboarding',
        paymentId: `ONBOARD_${Date.now()}`,
        gstin: '27AAAAA0000A1Z5',
        billingCycle: 'MONTHLY'
      };
    }

    try {
      const existing = JSON.parse(localStorage.getItem('megamart_tenants_store') || '[]');
      localStorage.setItem('megamart_tenants_store', JSON.stringify([created, ...existing.filter((x: any) => x.id !== created.id)]));
    } catch (e) {}

    return created;
  },

  updateTenantStatus: async (id: number, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/tenants/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, id, status };
  },

  getMetrics: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/metrics`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  getPlans: async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/plans`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  updatePlan: async (id: number, data: any) => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/plans/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  updateTenantPlan: async (id: number, data: { planId?: number; planName?: string; billingCycle?: string; status?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/tenants/${id}/plan`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          const localUsers = JSON.parse(localStorage.getItem('megamart_registered_users') || '[]');
          const updatedUsers = localUsers.map((u: any) => {
            if (u.tenantId === id || u.companyName === updated.name) {
              return {
                ...u,
                tenantInfo: {
                  ...u.tenantInfo,
                  planName: updated.plan,
                  planPrice: updated.monthlyFee,
                  maxStores: updated.maxStores,
                  maxUsers: updated.maxUsers,
                  status: updated.status
                }
              };
            }
            return u;
          });
          localStorage.setItem('megamart_registered_users', JSON.stringify(updatedUsers));
        } catch (e) {}
        return updated;
      }
    } catch (e) {
      console.warn('Backend updateTenantPlan failed:', e);
    }
    return null;
  }
};


