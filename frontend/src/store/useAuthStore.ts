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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('megamart_jwt') || null,
  tenantDetails: null,
  viewMode: 'LANDING',
  isPinLocked: false,
  activeRole: 'TENANT_ADMIN',

  setViewMode: (mode) => set({ viewMode: mode }),

  setAuth: (user, token, tenantDetails = null) => {
    localStorage.setItem('megamart_jwt', token);
    set({ user, token, tenantDetails, activeRole: user.role, isPinLocked: false, viewMode: 'DASHBOARD' });
    if (user && user.tenantId) {
      useRetailStore.getState().loadTenantData(user.tenantId, tenantDetails?.companyName);
      usePosStore.getState().loadTenantCustomers(user.tenantId);
    }
  },

  setTenantDetails: (tenantDetails) => set({ tenantDetails }),

  logout: () => {
    localStorage.removeItem('megamart_jwt');
    set({ user: null, token: null, tenantDetails: null, isPinLocked: false, viewMode: 'LANDING', activeRole: 'TENANT_ADMIN' });
    useRetailStore.getState().loadTenantData(1);
    usePosStore.getState().loadTenantCustomers(1);
  },

  setPinLocked: (locked) => set({ isPinLocked: locked }),
}));

