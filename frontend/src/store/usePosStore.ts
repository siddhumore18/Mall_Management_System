import { create } from 'zustand';
import { CartItem, Product, Customer } from '../types';

export type DiscountType = 'FLAT' | 'PERCENT';

const defaultCustomers: Customer[] = [
  { id: 101, name: 'Rahul Sharma', phoneNumber: '9876543210', loyaltyPoints: 450, totalSpent: 14200.00, tier: 'GOLD' },
  { id: 102, name: 'Priya Patel', phoneNumber: '9812345678', loyaltyPoints: 120, totalSpent: 3500.00, tier: 'SILVER' },
  { id: 103, name: 'Suresh Kumar', phoneNumber: '9765432109', loyaltyPoints: 850, totalSpent: 28900.00, tier: 'PLATINUM' }
];

const loadSavedCustomers = (tenantId: number = 1): Customer[] => {
  try {
    const key = tenantId === 1 ? 'megamart_customers' : `megamart_tenant_${tenantId}_customers`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return tenantId === 1 ? defaultCustomers : [];
};

interface PosState {
  currentTenantId: number;
  cart: CartItem[];
  activeCustomer: Customer | null;
  customersList: Customer[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  searchQuery: string;
  selectedCategory: string;
  
  loadTenantCustomers: (tenantId: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setActiveCustomer: (customer: Customer | null) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addCustomerToStore: (customer: Customer) => void;
  updateCustomerStore: (customer: Customer) => void;
  setCustomersList: (list: Customer[]) => void;
  
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotalAmount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  currentTenantId: 1,
  cart: [],
  activeCustomer: null,
  customersList: loadSavedCustomers(1),
  discountType: 'PERCENT',
  discountValue: 0,
  taxRate: 0.18, // 18% GST (9% CGST + 9% SGST)
  searchQuery: '',
  selectedCategory: 'ALL',

  loadTenantCustomers: (tenantId) => {
    const loaded = loadSavedCustomers(tenantId);
    set({ currentTenantId: tenantId, customersList: loaded, activeCustomer: null, cart: [] });
  },

  addToCart: (product, quantity = 1) => set((state) => {
    const existingIndex = state.cart.findIndex(i => i.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...state.cart];
      updated[existingIndex].quantity += quantity;
      return { cart: updated };
    }
    return { cart: [...state.cart, { product, quantity }] };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(i => i.product.id !== productId)
  })),

  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter(i => i.product.id !== productId) };
    }
    return {
      cart: state.cart.map(i => i.product.id === productId ? { ...i, quantity } : i)
    };
  }),

  clearCart: () => set({ cart: [], discountValue: 0, searchQuery: '' }),

  setActiveCustomer: (customer) => set({ activeCustomer: customer }),

  setDiscount: (discountType, discountValue) => set({ discountType, discountValue }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  setCustomersList: (list) => {
    // Deduplicate by 10-digit normalized phone number
    const map = new Map<string, Customer>();
    list.forEach(c => {
      const clean = (c.phoneNumber || '').replace(/\D/g, '');
      const key = clean.length >= 10 ? clean.slice(-10) : clean;
      if (key) {
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            ...existing,
            ...c,
            totalSpent: Math.max(existing.totalSpent || 0, c.totalSpent || c.lifetimeValue || 0),
            loyaltyPoints: Math.max(existing.loyaltyPoints || 0, c.loyaltyPoints || 0)
          });
        } else {
          map.set(key, c);
        }
      }
    });
    const deduplicated = Array.from(map.values());
    set({ customersList: deduplicated });
    try { localStorage.setItem('megamart_customers', JSON.stringify(deduplicated)); } catch (e) {}
  },

  addCustomerToStore: (customer) => set((state) => {
    const cleanNew = (customer.phoneNumber || '').replace(/\D/g, '');
    const keyNew = cleanNew.length >= 10 ? cleanNew.slice(-10) : cleanNew;

    const existingIndex = state.customersList.findIndex(c => {
      const clean = (c.phoneNumber || '').replace(/\D/g, '');
      const key = clean.length >= 10 ? clean.slice(-10) : clean;
      return keyNew && key === keyNew;
    });

    const tenantId = state.currentTenantId;

    if (existingIndex > -1) {
      const updatedList = [...state.customersList];
      const existing = updatedList[existingIndex];
      const merged = {
        ...existing,
        tenantId: existing.tenantId || tenantId,
        name: customer.name && customer.name !== 'Valued Customer' ? customer.name : existing.name,
        phoneNumber: customer.phoneNumber || existing.phoneNumber,
        totalSpent: (existing.totalSpent || 0) + (customer.totalSpent || 0),
        loyaltyPoints: (existing.loyaltyPoints || 0) + (customer.loyaltyPoints || 0)
      };
      updatedList[existingIndex] = merged;
      const key = tenantId === 1 ? 'megamart_customers' : `megamart_tenant_${tenantId}_customers`;
      try { localStorage.setItem(key, JSON.stringify(updatedList)); } catch (e) {}
      return { customersList: updatedList, activeCustomer: merged };
    }

    const customerWithTenant = { ...customer, tenantId: customer.tenantId || tenantId };
    const updated = [customerWithTenant, ...state.customersList];
    const key = tenantId === 1 ? 'megamart_customers' : `megamart_tenant_${tenantId}_customers`;
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch (e) {}
    return { customersList: updated, activeCustomer: customerWithTenant };
  }),

  updateCustomerStore: (customer) => set((state) => {
    const cleanTarget = (customer.phoneNumber || '').replace(/\D/g, '');
    const keyTarget = cleanTarget.length >= 10 ? cleanTarget.slice(-10) : cleanTarget;

    const updated = state.customersList.map(c => {
      const clean = (c.phoneNumber || '').replace(/\D/g, '');
      const key = clean.length >= 10 ? clean.slice(-10) : clean;
      if (c.id === customer.id || (keyTarget && key === keyTarget)) {
        return customer;
      }
      return c;
    });

    const tenantId = state.currentTenantId;
    const key = tenantId === 1 ? 'megamart_customers' : `megamart_tenant_${tenantId}_customers`;
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch (e) {}
    return { customersList: updated, activeCustomer: customer };
  }),

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + (item.product.globalPrice * item.quantity), 0);
  },

  getDiscountAmount: () => {
    const { getSubtotal, discountType, discountValue } = get();
    const subtotal = getSubtotal();
    if (discountType === 'PERCENT') {
      return (subtotal * (discountValue || 0)) / 100;
    }
    return Math.min(subtotal, discountValue || 0);
  },

  getTaxAmount: () => {
    const { getSubtotal, getDiscountAmount, taxRate } = get();
    const taxable = getSubtotal() - getDiscountAmount();
    return (taxable > 0 ? taxable : 0) * taxRate;
  },

  getTotalAmount: () => {
    const { getSubtotal, getDiscountAmount, getTaxAmount } = get();
    const total = getSubtotal() - getDiscountAmount() + getTaxAmount();
    return total > 0 ? total : 0;
  }
}));
