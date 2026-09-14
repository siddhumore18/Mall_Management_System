import { create } from 'zustand';
import { User, Role } from '../types';
import { useRetailStore } from './useRetailStore';
import { usePosStore } from './usePosStore';

export type ViewMode = 'LANDING' | 'LOGIN' | 'DASHBOARD';

export interface TenantDetails {
  id: number;
  companyName: string;
  status: string;
  planId: number;
  planName: string;
  planPrice: number;
  maxStores: number;
  maxUsers: number;
  activeStoresCount: number;
  activeUsersCount: number;
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  daysRemaining?: number;
  billingCycle?: string;
  isSubscriptionActive?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tenantDetails: TenantDetails | null;
  viewMode: ViewMode;
  isPinLocked: boolean;
  activeRole: Role;
  
  setViewMode: (mode: ViewMode) => void;
  setAuth: (user: User, token: string, tenantDetails?: TenantDetails | null) => void;
  setTenantDetails: (tenantDetails: TenantDetails) => void;
  logout: () => void;
  setPinLocked: (locked: boolean) => void;
}

const loadSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('megamart_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const loadSavedTenantDetails = (): TenantDetails | null => {
  try {
    const saved = localStorage.getItem('megamart_tenant_details');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const initialSavedUser = loadSavedUser();
const initialSavedToken = localStorage.getItem('megamart_jwt') || null;
const initialSavedTenant = loadSavedTenantDetails();
const initialViewMode: ViewMode = (initialSavedUser && initialSavedToken) ? 'DASHBOARD' : 'LANDING';
const initialRole: Role = initialSavedUser?.role || 'TENANT_ADMIN';

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSavedUser,
  token: initialSavedToken,
  tenantDetails: initialSavedTenant,
  viewMode: initialViewMode,
  isPinLocked: false,
  activeRole: initialRole,

  setViewMode: (mode) => set({ viewMode: mode }),

  setAuth: (user, token, tenantDetails = null) => {
    localStorage.setItem('megamart_jwt', token);
    localStorage.setItem('megamart_user', JSON.stringify(user));
    if (tenantDetails) {
      localStorage.setItem('megamart_tenant_details', JSON.stringify(tenantDetails));
    }
    set({ user, token, tenantDetails, activeRole: user.role, isPinLocked: false, viewMode: 'DASHBOARD' });
    if (user && user.tenantId) {
      useRetailStore.getState().loadTenantData(user.tenantId, tenantDetails?.companyName);
      usePosStore.getState().loadTenantCustomers(user.tenantId);
    }
  },

  setTenantDetails: (tenantDetails) => {
    try {
      localStorage.setItem('megamart_tenant_details', JSON.stringify(tenantDetails));
    } catch (e) {}
    set({ tenantDetails });
  },

  logout: () => {
    localStorage.removeItem('megamart_jwt');
    localStorage.removeItem('megamart_user');
    localStorage.removeItem('megamart_tenant_details');
    set({ user: null, token: null, tenantDetails: null, isPinLocked: false, viewMode: 'LANDING', activeRole: 'TENANT_ADMIN' });
    useRetailStore.getState().loadTenantData(1);
    usePosStore.getState().loadTenantCustomers(1);
  },

  setPinLocked: (locked) => set({ isPinLocked: locked }),
}));

