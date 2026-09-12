export type Role = 
  | 'SUPER_ADMIN' 
  | 'TENANT_ADMIN' 
  | 'ACCOUNTANT' 
  | 'STORE_MANAGER' 
  | 'CASHIER' 
  | 'CUSTOMER_SERVICE' 
  | 'INVENTORY_CLERK';

export interface User {
  id: number;
  tenantId: number | null;
  storeId: number | null;
  name: string;
  email: string;
  role: Role;
  pinCode?: string;
}

export interface Store {
  id: number;
  tenantId: number;
  name: string;
  location: string;
  code: string;
}

export interface Customer {
  id: number;
  tenantId?: number;
  phoneNumber: string;
  name: string;
  loyaltyPoints: number;
  lifetimeValue?: number;
  totalSpent?: number;
  tier?: string;
}

export interface Product {
  id: number;
  tenantId: number;
  barcode: string;
  sku?: string;
  name: string;
  globalPrice: number;
  price?: number;
  costPrice: number;
  category: string;
  unit: string;
  imageUrl?: string;
  stockQuantity?: number;
  stock?: number;
  totalStock?: number;
  reorderLevel?: number;
  gstRate?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionLineItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Transaction {
  id: number;
  tenantId: number;
  storeId: number;
  customerPhone?: string;
  customerName?: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  lineItems: TransactionLineItem[];
}

export interface AnalyticsData {
  totalSales: number;
  todaySales?: number;
  yesterdaySales?: number;
  growthRate?: number;
  averageOrderValue?: number;
  totalTransactions: number;
  totalStores: number;
  totalCustomers: number;
  lowStockCount: number;
  expiringSoonCount?: number;
  salesByStore: Record<string, number>;
  salesByPaymentMethod?: Record<string, number>;
  topProducts?: Array<{ name: string; quantitySold: number; revenue: number }>;
}
