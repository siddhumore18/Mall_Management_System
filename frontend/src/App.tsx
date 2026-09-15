import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { RoleSidebar } from './components/RoleSidebar';
import { ShadcnHeader } from './components/ShadcnHeader';
import { QuickPinModal } from './components/QuickPinModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CashierPosPage } from './pages/CashierPosPage';
import { InventoryClerkPage } from './pages/InventoryClerkPage';
import { TenantAdminDashboardPage } from './pages/TenantAdminDashboardPage';
import { StoreManagerPage } from './pages/StoreManagerPage';
import { AccountantPage } from './pages/AccountantPage';
import { CustomerServicePage } from './pages/CustomerServicePage';
import { SuperAdminPage } from './pages/SuperAdminPage';

import { ProErpChatbot } from './components/ProErpChatbot';

import { useRetailStore } from './store/useRetailStore';
import { usePosStore } from './store/usePosStore';

export const App: React.FC = () => {
  const { user, activeRole, viewMode, setViewMode } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync tenant-isolated data state on mount or user switch
  React.useEffect(() => {
    if (user?.tenantId) {
      useRetailStore.getState().loadTenantData(user.tenantId, (user as any).companyName);
      usePosStore.getState().loadTenantCustomers(user.tenantId);
    }
  }, [user?.tenantId]);

  // View Routing: LANDING -> LOGIN -> DASHBOARD
  if (viewMode === 'LANDING' && !user) {
    return <LandingPage onNavigateLogin={() => setViewMode('LOGIN')} />;
  }

  if (viewMode === 'LOGIN' && !user) {
    return <LoginPage />;
  }

  if (!user) {
    return <LandingPage onNavigateLogin={() => setViewMode('LOGIN')} />;
  }

  // Role-based page rendering — each user can ONLY see their own dashboard
  const renderRolePage = () => {
    switch (activeRole) {
      case 'CASHIER':
        return <CashierPosPage />;
      case 'INVENTORY_CLERK':
        return <InventoryClerkPage />;
      case 'TENANT_ADMIN':
        return <TenantAdminDashboardPage />;
      case 'STORE_MANAGER':
        return <StoreManagerPage />;
      case 'ACCOUNTANT':
        return <AccountantPage />;
      case 'CUSTOMER_SERVICE':
        return <CustomerServicePage />;
      case 'SUPER_ADMIN':
        return <SuperAdminPage />;
      default:
        return <TenantAdminDashboardPage />;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#FAF8F5] text-stone-900 overflow-hidden select-none">
      {/* Role-Isolated Navigation Sidebar */}
      <RoleSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Right Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ShadcnHeader />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF9] p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
          {renderRolePage()}
        </main>
      </div>

      {/* Quick PIN Lock Modal */}
      <QuickPinModal />

      {/* Intelligent ProERP AI System Assistant Chatbot */}
      <ProErpChatbot />
    </div>
  );
};

export default App;
