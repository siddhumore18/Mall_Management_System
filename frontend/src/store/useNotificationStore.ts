import { create } from 'zustand';
import { Role } from '../types';

export interface ProNotification {
  id: string;
  timestamp: string;
  senderRole?: Role;
  senderName?: string;
  senderTenant?: string;
  sender?: string;
  targetRole: Role | 'ALL';
  type: 'UPGRADE_REQUEST' | 'LOW_STOCK' | 'PIN_OVERRIDE' | 'SYSTEM_ALERT' | 'PAYOUT_APPROVAL' | 'TRANSFER_DISPATCH';
  title: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'READ';
  metadata?: {
    requestedPlan?: string;
    requestedStores?: number;
    requestedUsers?: number;
    tenantId?: number;
    tenantName?: string;
    refundAmount?: number;
    storeName?: string;
  };
}

interface NotificationState {
  notifications: ProNotification[];
  addNotification: (notification: Omit<ProNotification, 'id' | 'timestamp' | 'status'> & { status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'READ' }) => void;
  updateNotificationStatus: (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'READ') => void;
  markAllAsRead: (role: Role) => void;
  clearNotifications: () => void;
}

const initialNotifications: ProNotification[] = [
  {
    id: 'NOTIF-101',
    timestamp: '2026-09-10 10:15 AM',
    senderRole: 'TENANT_ADMIN',
    senderName: 'Rajesh Sharma (MegaMart HQ)',
    senderTenant: 'MegaMart Retail India Ltd',
    targetRole: 'SUPER_ADMIN',
    type: 'UPGRADE_REQUEST',
    title: 'SaaS Plan Upgrade Request',
    message: 'MegaMart Retail India Ltd requests upgrade from Standard Plan to Enterprise Plan to expand store outlets to 10 stores.',
    status: 'PENDING',
    metadata: {
      tenantId: 1,
      tenantName: 'MegaMart Retail India Ltd',
      requestedPlan: 'Enterprise Plan',
      requestedStores: 10,
      requestedUsers: 50
    }
  },
  {
    id: 'NOTIF-102',
    timestamp: '2026-09-10 09:30 AM',
    senderRole: 'STORE_MANAGER',
    senderName: 'Vikram Malhotra',
    senderTenant: 'MegaMart Retail India Ltd',
    targetRole: 'TENANT_ADMIN',
    type: 'PIN_OVERRIDE',
    title: 'High-Value Refund Approved',
    message: 'Manager PIN override executed for ₹850 customer return on Receipt #INV-891024 at Bandra Flagship store.',
    status: 'READ',
    metadata: {
      storeName: 'MegaMart Flagship Mumbai',
      refundAmount: 850
    }
  },
  {
    id: 'NOTIF-103',
    timestamp: '2026-09-10 08:45 AM',
    senderRole: 'INVENTORY_CLERK',
    senderName: 'Suresh Kumar',
    senderTenant: 'MegaMart Retail India Ltd',
    targetRole: 'TENANT_ADMIN',
    type: 'LOW_STOCK',
    title: 'FEFO Expiry Stock Warning',
    message: '35 units of Blue Tokai Coffee Beans 1kg are expiring within 12 days at Bengaluru Hypermarket.',
    status: 'READ',
    metadata: {
      storeName: 'MegaMart Hypermarket Bengaluru'
    }
  }
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,

  addNotification: (notifData) => {
    const newNotif: ProNotification = {
      ...notifData,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
      status: 'PENDING'
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  updateNotificationStatus: (id, status) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, status } : n))
    }));
  },

  markAllAsRead: (role) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.targetRole === role || n.targetRole === 'ALL' ? { ...n, status: n.status === 'PENDING' ? 'READ' : n.status } : n
      )
    }));
  },

  clearNotifications: () => set({ notifications: [] })
}));
