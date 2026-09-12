import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRetailStore } from '../store/useRetailStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Bell, MapPin, Clock, LogOut, Shield, User, Check, X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Platform Super Admin',
  TENANT_ADMIN: 'Executive HQ Admin',
  ACCOUNTANT: 'Financial Accountant',
  STORE_MANAGER: 'Store Manager',
  CASHIER: 'POS Cashier',
  CUSTOMER_SERVICE: 'Service Desk Agent',
  INVENTORY_CLERK: 'Warehouse Clerk',
};

export const ShadcnHeader: React.FC = () => {
  const { user, tenantDetails, activeRole, logout } = useAuthStore();
  const { outlets } = useRetailStore();
  const { notifications, updateNotificationStatus, markAllAsRead } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const activeOutlet = outlets[0]?.name || 'Flagship Store Outlet';
  const tenantCompany = tenantDetails?.companyName || (user?.tenantId === 1 ? 'MegaMart Retail India Ltd' : `Tenant HQ #${user?.tenantId || 1}`);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter notifications for active user's role
  const myNotifs = notifications.filter(n => n.targetRole === activeRole || n.targetRole === 'ALL' || (activeRole === 'SUPER_ADMIN' && n.type === 'UPGRADE_REQUEST'));
  const unreadCount = myNotifs.filter(n => n.status === 'PENDING').length;

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-amber-200/60 px-6 flex items-center justify-between select-none shadow-[0_2px_15px_-3px_rgba(217,119,6,0.06)] z-30 sticky top-0">
      {/* Left Store Location Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold text-amber-950 shadow-2xs">
          <StatusBadge label="LIVE" variant="emerald" pulse />
          <MapPin className="w-3.5 h-3.5 text-amber-600 ml-1" />
          <span>{activeOutlet}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-stone-600 bg-white border border-amber-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Tenant: <strong className="text-stone-900 font-bold">{tenantCompany}</strong></span>
        </div>
      </div>

      {/* Right User Role, Clock & Quick Lock */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-stone-900 border border-amber-500/30 text-amber-200 px-3 py-1 rounded-xl text-xs font-bold shadow-xs">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>{user?.name || 'User'}</span>
          <span className="text-amber-400/60">|</span>
          <span className="text-amber-400 text-[10px]">{roleLabels[activeRole] || activeRole}</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-stone-600 bg-amber-50/60 border border-amber-200/80 px-3 py-1 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{time}</span>
        </div>

        {/* ProERP Interactive Notification Hub Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="relative p-2 text-stone-600 hover:text-amber-950 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-200 cursor-pointer"
            title="ProERP Notifications & Upgrade Requests"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4 bg-amber-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 gold-card p-4 shadow-2xl z-50 bg-white border-2 border-amber-300 space-y-3 animate-slide-up text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ProERP Notification Center</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead(activeRole)}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button onClick={() => setIsNotifOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 space-y-2 pr-1">
                {myNotifs.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 font-semibold">No notifications for your role.</div>
                ) : (
                  myNotifs.map((n) => (
                    <div key={n.id} className={`pt-2 space-y-1 ${n.status === 'PENDING' ? 'bg-amber-50/50 p-2 rounded-xl border border-amber-200/60' : 'p-2'}`}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`gold-badge ${n.type === 'UPGRADE_REQUEST' ? 'bg-amber-500 text-white' : ''}`}>{n.type.replace(/_/g, ' ')}</span>
                        <span className="text-stone-400 font-mono">{n.timestamp}</span>
                      </div>
                      <div className="font-extrabold text-stone-900 leading-tight">{n.title}</div>
                      <p className="text-[11px] text-stone-600 font-medium leading-normal">{n.message}</p>
                      
                      {/* Action buttons if Super Admin upgrade request */}
                      {activeRole === 'SUPER_ADMIN' && n.type === 'UPGRADE_REQUEST' && n.status === 'PENDING' && (
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => {
                              updateNotificationStatus(n.id, 'APPROVED');
                              setIsNotifOpen(false);
                            }}
                            className="w-1/2 gold-button-primary py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve Upgrade
                          </button>
                          <button
                            onClick={() => updateNotificationStatus(n.id, 'REJECTED')}
                            className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
