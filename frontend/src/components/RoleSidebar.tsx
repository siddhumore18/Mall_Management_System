import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavStore } from '../store/useNavStore';
import { Role } from '../types';
import {
  LayoutDashboard, ShoppingBag, Boxes, Receipt,
  Users, ShieldCheck, Store as StoreIcon, Crown,
  ChevronRight, LogOut, Lock, Building2,
  Package, UserCog, FileText, ClipboardList,
  TrendingUp, Clock, Truck,
  Search, RotateCcw, AlertTriangle, Printer,
  DollarSign, PieChart, UserCheck,
  Activity, CreditCard, Sliders, ArrowLeftRight,
  Gift, Wallet, ShieldAlert, History, ClipboardCheck, X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const roleNavConfig: Record<Role, { title: string; subtitle: string; sections: { label: string; items: NavItem[] }[] }> = {
  SUPER_ADMIN: {
    title: 'Platform Admin',
    subtitle: 'SaaS Control Center',
    sections: [
      {
        label: 'Platform',
        items: [
          { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
          { id: 'tenants', label: 'Tenant Directory', icon: Building2 },
          { id: 'subscriptions', label: 'Subscription Plans', icon: CreditCard },
          { id: 'system', label: 'System Health', icon: Activity },
          { id: 'flags', label: 'Feature Flags & Modules', icon: Sliders },
        ]
      }
    ]
  },
  TENANT_ADMIN: {
    title: 'Executive HQ',
    subtitle: 'Chain Management',
    sections: [
      {
        label: 'Analytics',
        items: [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'outlets', label: 'Outlet Manager', icon: StoreIcon },
          { id: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
        ]
      },
      {
        label: 'Operations & Tax',
        items: [
          { id: 'users', label: 'User Provisioning', icon: UserCog },
          { id: 'customers', label: 'Unique Customers', icon: Users },
          { id: 'catalog', label: 'Product Catalog', icon: Package },
          { id: 'transfers', label: 'Inter-Store Transfers', icon: ArrowLeftRight },
          { id: 'promos', label: 'Campaigns & Offers', icon: Gift },
          { id: 'gst', label: 'GST Tax Ledger', icon: FileText },
          { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
        ]
      }
    ]
  },
  ACCOUNTANT: {
    title: 'Finance Desk',
    subtitle: 'Accounting & Tax',
    sections: [
      {
        label: 'Finance',
        items: [
          { id: 'reconciliation', label: 'Daily Reconciliation', icon: DollarSign },
          { id: 'payouts', label: 'Vendor Payouts & AP', icon: Wallet },
          { id: 'gst', label: 'GST Tax Ledger', icon: FileText },
          { id: 'pnl', label: 'P&L Reports', icon: PieChart },
        ]
      }
    ]
  },
  STORE_MANAGER: {
    title: 'Store Operations',
    subtitle: 'Branch Management',
    sections: [
      {
        label: 'Operations',
        items: [
          { id: 'health', label: 'Store Health', icon: Activity },
          { id: 'staff', label: 'Staff Roster', icon: UserCheck },
          { id: 'customers', label: 'Unique Customers', icon: Users },
          { id: 'inventory', label: 'Local Inventory', icon: Boxes },
          { id: 'shifts', label: 'Shift Balancing', icon: Clock },
          { id: 'loss_prevention', label: 'Loss Prevention Audit', icon: ShieldAlert },
        ]
      }
    ]
  },
  CASHIER: {
    title: 'POS Terminal',
    subtitle: 'Checkout Station',
    sections: [
      {
        label: 'POS Register',
        items: [
          { id: 'checkout', label: 'POS Register (F2)', icon: Receipt },
          { id: 'customers', label: 'Customer CRM', icon: Users },
          { id: 'history', label: 'Customer Bills & Reprint', icon: History },
        ]
      }
    ]
  },
  CUSTOMER_SERVICE: {
    title: 'Support Desk',
    subtitle: 'Client Retention',
    sections: [
      {
        label: 'Care Desk',
        items: [
          { id: 'directory', label: 'Customer Directory', icon: Users },
          { id: 'returns', label: 'Returns & Exchange', icon: RotateCcw },
          { id: 'loyalty', label: 'Loyalty Points Desk', icon: Gift },
        ]
      }
    ]
  },
  INVENTORY_CLERK: {
    title: 'Warehouse & FEFO',
    subtitle: 'Supply Logistics',
    sections: [
      {
        label: 'Inventory',
        items: [
          { id: 'receiving', label: 'Goods Receiving (GRN)', icon: Truck },
          { id: 'barcode', label: 'Barcode Label Printing', icon: Printer },
          { id: 'fefo', label: 'FEFO Expiry Auditor', icon: Boxes },
          { id: 'reconciliation', label: 'Physical Stock Count', icon: ClipboardCheck },
        ]
      }
    ]
  },
};

interface Props {
  collapsed: boolean;
  setCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
}

export const RoleSidebar: React.FC<Props> = ({ collapsed, setCollapsed }) => {
  const { user, activeRole, logout, setPinLocked } = useAuthStore();
  const { activeNavItem, setActiveNavItem, isMobileMenuOpen, setIsMobileMenuOpen } = useNavStore();

  const config = roleNavConfig[activeRole] || roleNavConfig.TENANT_ADMIN;

  // Set first item as active by default when role changes
  useEffect(() => {
    if (config.sections.length > 0 && config.sections[0].items.length > 0) {
      setActiveNavItem(config.sections[0].items[0].id);
    }
  }, [activeRole]);

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`bg-white border-r border-amber-200/80 h-screen flex flex-col transition-all duration-300 select-none shadow-[4px_0_20px_-4px_rgba(217,119,6,0.04)]
        fixed inset-y-0 left-0 z-50 md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : 'md:w-64'}
      `}>
        {/* Branding Header */}
        <div className={`h-14 border-b border-amber-200/80 flex items-center bg-white ${
          collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        }`}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden md:flex w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 items-center justify-center transition-all cursor-pointer border border-amber-200/80 shadow-2xs group"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5 text-amber-800 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-amber-500/20">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="truncate">
                  <span className="font-extrabold text-xs text-stone-900 tracking-tight block leading-none">MEGAMART<span className="text-amber-600">.GOLD</span></span>
                  <span className="text-[10px] text-amber-700/80 font-semibold">{config.subtitle}</span>
                </div>
              </div>
              
              {/* Desktop Collapse Button */}
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:block p-1.5 rounded-lg text-stone-400 hover:text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronRight className="w-4 h-4 rotate-180 transition-transform duration-200" />
              </button>

              {/* Mobile Drawer Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-xl text-stone-500 hover:text-amber-950 hover:bg-amber-100/70 transition-colors cursor-pointer border border-amber-200/80"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-amber-950 block leading-tight">{config.title}</span>
              <span className="text-[10px] text-amber-700 font-semibold">{activeRole.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto py-3 space-y-4 ${collapsed ? 'px-2' : 'px-2.5'}`}>
        {config.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] uppercase tracking-wider text-amber-800/80 font-extrabold mb-1.5">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNavItem(item.id)}
                  className={`transition-all group cursor-pointer relative ${
                    collapsed
                      ? `w-10 h-10 mx-auto flex items-center justify-center rounded-xl ${
                          isActive
                            ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                            : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50/90'
                        }`
                      : `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md shadow-amber-500/25'
                            : 'text-stone-700 hover:text-amber-900 hover:bg-amber-50/80'
                        }`
                  }`}
                  title={item.label}
                >
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"></div>
                  )}
                  <Icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4 shrink-0'} ${
                    isActive ? 'text-white' : 'text-amber-700/70 group-hover:text-amber-800'
                  }`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
            {sIdx < config.sections.length - 1 && (
              <div className={collapsed ? 'w-6 mx-auto my-2 border-b border-amber-200/60' : 'pt-2 border-b border-amber-200/60'}></div>
            )}
          </div>
        ))}
      </div>

      {/* User Footer & Logout */}
      <div className={`border-t border-amber-200/80 bg-amber-50/30 ${
        collapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-2.5 space-y-2'
      }`}>
        {collapsed ? (
          <>
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 font-black text-xs flex items-center justify-center border border-amber-300 shadow-2xs cursor-default"
              title={`${user?.name || 'User'} (${activeRole.replace(/_/g, ' ')})`}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={() => setPinLocked(true)}
              className="w-10 h-10 rounded-xl text-amber-800 hover:bg-amber-100 flex items-center justify-center transition-colors border border-amber-200/80 cursor-pointer"
              title="Lock Terminal"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors border border-rose-200/80 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 p-2 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-stone-900 block leading-tight truncate">{user?.name || 'User'}</span>
                <span className="text-[10px] text-amber-700 font-semibold uppercase">{activeRole.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPinLocked(true)}
                className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/80 cursor-pointer"
                title="Lock Terminal"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/80 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
