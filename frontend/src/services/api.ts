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


