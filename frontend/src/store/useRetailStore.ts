import { create } from 'zustand';
import { Product, Store } from '../types';
import { productApi, storeApi } from '../services/api';

export interface StoreOutlet {
  id: number;
  name: string;
  city: string;
  code: string;
  staff: number;
  revenue: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const loadSavedProducts = (tenantId: number = 1): Product[] => {
  try {
    const key = `megamart_tenant_${tenantId}_products`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => ({
          ...p,
          sku: p.sku || `SKU-${p.id}`,
          price: p.price ?? p.globalPrice ?? 0,
          stock: p.stock ?? p.stockQuantity ?? 0,
          totalStock: p.totalStock ?? p.stockQuantity ?? 0,
          reorderLevel: p.reorderLevel ?? 20,
          gstRate: p.gstRate ?? 18,
        }));
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedOutlets = (tenantId: number = 1, companyName?: string): StoreOutlet[] => {
  try {
    const key = `megamart_tenant_${tenantId}_outlets`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  
  if (companyName) {
    const initialOutlet: StoreOutlet = {
      id: 1,
      name: `${companyName} Flagship`,
      city: 'Main Center',
      code: 'ST-101',
      staff: 1,
      revenue: 0,
      status: 'ACTIVE'
    };
    return [initialOutlet];
  }
  return [];
};

interface RetailStoreState {
  currentTenantId: number;
  products: Product[];
  outlets: StoreOutlet[];
  isLoading: boolean;
  
  loadTenantData: (tenantId: number, companyName?: string) => Promise<void>;
  fetchBackendData: (tenantId: number, storeId?: number) => Promise<void>;
  setProducts: (products: Product[]) => void;
  addProduct: (product: any, storeId?: number) => Promise<Product>;
  deductStock: (productId: number, quantity: number) => void;
  updateStockQuantity: (productId: number, quantity: number, storeId?: number) => Promise<void>;
  
  setOutlets: (outlets: StoreOutlet[]) => void;
  addOutlet: (outlet: { name: string; city: string; code?: string }) => Promise<StoreOutlet>;
  toggleOutletStatus: (id: number) => void;
}

const savedUser = (() => {
  try {
    const u = localStorage.getItem('megamart_user');
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
})();
const initialTenantId = savedUser?.tenantId || 1;

export const useRetailStore = create<RetailStoreState>((set, get) => ({
  currentTenantId: initialTenantId,
  products: loadSavedProducts(initialTenantId),
  outlets: loadSavedOutlets(initialTenantId, savedUser?.companyName),
  isLoading: false,

  loadTenantData: async (tenantId, companyName) => {
    set({ currentTenantId: tenantId, isLoading: true });
    
    // First load from local storage cache for immediate response
    const cachedProds = loadSavedProducts(tenantId);
    const cachedOuts = loadSavedOutlets(tenantId, companyName);
    set({ products: cachedProds, outlets: cachedOuts });

    // Then fetch fresh, real data from PostgreSQL Backend
    await get().fetchBackendData(tenantId);
    set({ isLoading: false });
  },

  fetchBackendData: async (tenantId, storeId) => {
    try {
      // 1. Fetch Real Stores from Backend
      const realStores = await storeApi.getStores();
      if (realStores && realStores.length > 0) {
        const mappedOutlets: StoreOutlet[] = realStores.map((s: Store) => ({
          id: s.id,
          name: s.name,
          city: s.location,
          code: s.code,
          staff: 1,
          revenue: 0,
          status: 'ACTIVE'
        }));
        set({ outlets: mappedOutlets });
        try { localStorage.setItem(`megamart_tenant_${tenantId}_outlets`, JSON.stringify(mappedOutlets)); } catch (e) {}
      }

      // 2. Fetch Real Products from Backend
      const targetStoreId = storeId || (get().outlets[0]?.id || 1);
      let realProducts: Product[] = [];
      try {
        realProducts = await productApi.getStoreInventory(targetStoreId);
      } catch (e) {
        realProducts = await productApi.getAll();
      }

      if (realProducts && realProducts.length > 0) {
        const enriched = realProducts.map(p => ({
          ...p,
          sku: p.sku || `SKU-${p.id}`,
          price: p.price ?? p.globalPrice ?? 0,
          stock: p.stockQuantity ?? p.stock ?? 0,
          totalStock: p.stockQuantity ?? p.stock ?? 0,
          reorderLevel: p.reorderLevel ?? 20,
          gstRate: p.gstRate ?? 18,
        }));
        set({ products: enriched });
        try { localStorage.setItem(`megamart_tenant_${tenantId}_products`, JSON.stringify(enriched)); } catch (e) {}
      }
    } catch (err) {
      console.warn('Backend data sync notice: Running with local tenant data');
    }
  },

  setProducts: (products) => {
    const tenantId = get().currentTenantId;
    try { localStorage.setItem(`megamart_tenant_${tenantId}_products`, JSON.stringify(products)); } catch (e) {}
    set({ products });
  },

  addProduct: async (newProd, storeId) => {
    const tenantId = get().currentTenantId;
    const targetStore = storeId || get().outlets[0]?.id || 1;

    let savedBackendProd: Product | null = null;
    try {
      savedBackendProd = await productApi.create({
        barcode: newProd.barcode,
        name: newProd.name,
        globalPrice: newProd.globalPrice || newProd.price || 0,
        costPrice: newProd.costPrice,
        category: newProd.category,
        unit: newProd.unit || 'piece',
        imageUrl: newProd.imageUrl,
        storeId: targetStore,
        initialStock: newProd.stockQuantity || newProd.stock || 10,
        batchNumber: newProd.batchNumber || `BATCH-${Date.now() % 10000}`,
        expiryDate: newProd.expiryDate
      });
    } catch (e) {
      console.warn('Backend product creation warning:', e);
    }

    const finalProd: Product = savedBackendProd ? {
      ...savedBackendProd,
      sku: savedBackendProd.sku || `SKU-${savedBackendProd.id}`,
      price: savedBackendProd.globalPrice,
      stock: savedBackendProd.stockQuantity || newProd.stockQuantity || 0,
      totalStock: savedBackendProd.stockQuantity || newProd.stockQuantity || 0,
      reorderLevel: 20,
      gstRate: newProd.gstRate || 18,
    } : {
      ...newProd,
      id: Date.now(),
      tenantId: tenantId,
      sku: newProd.sku || `SKU-${Date.now()}`,
      price: newProd.price ?? newProd.globalPrice ?? 0,
      stock: newProd.stock ?? newProd.stockQuantity ?? 0,
      totalStock: newProd.totalStock ?? newProd.stockQuantity ?? 0,
      reorderLevel: newProd.reorderLevel ?? 20,
      gstRate: newProd.gstRate ?? 18,
    };

    const updated = [finalProd, ...get().products.filter(p => p.id !== finalProd.id)];
    try { localStorage.setItem(`megamart_tenant_${tenantId}_products`, JSON.stringify(updated)); } catch (e) {}
    set({ products: updated });
    return finalProd;
  },

  deductStock: (productId, quantity) => {
    const tenantId = get().currentTenantId;
    const updated = get().products.map(p => {
      if (p.id === productId) {
        const current = p.stockQuantity ?? p.stock ?? 0;
        const newQty = Math.max(0, current - quantity);
        return { ...p, stockQuantity: newQty, stock: newQty, totalStock: newQty };
      }
      return p;
    });
    try { localStorage.setItem(`megamart_tenant_${tenantId}_products`, JSON.stringify(updated)); } catch (e) {}
    set({ products: updated });
  },

  updateStockQuantity: async (productId, newQty, storeId) => {
    const tenantId = get().currentTenantId;
    const targetStore = storeId || get().outlets[0]?.id || 1;

    try {
      await productApi.updateStock(targetStore, productId, newQty);
    } catch (e) {
      console.warn('Backend stock update note:', e);
    }

    const updated = get().products.map(p => p.id === productId ? { 
      ...p, 
      stockQuantity: Math.max(0, newQty), 
      stock: Math.max(0, newQty), 
      totalStock: Math.max(0, newQty) 
    } : p);
    
    try { localStorage.setItem(`megamart_tenant_${tenantId}_products`, JSON.stringify(updated)); } catch (e) {}
    set({ products: updated });
  },

  setOutlets: (outlets) => {
    const tenantId = get().currentTenantId;
    try { localStorage.setItem(`megamart_tenant_${tenantId}_outlets`, JSON.stringify(outlets)); } catch (e) {}
    set({ outlets });
  },

  addOutlet: async (outletData) => {
    const tenantId = get().currentTenantId;
    let savedStore: Store | null = null;
    
    try {
      savedStore = await storeApi.create({
        name: outletData.name,
        location: outletData.city,
        code: outletData.code
      });
    } catch (e) {
      console.warn('Backend store creation note:', e);
    }

    const newOutlet: StoreOutlet = {
      id: savedStore ? savedStore.id : Date.now(),
      name: outletData.name,
      city: outletData.city,
      code: outletData.code || (savedStore ? savedStore.code : `ST-${get().outlets.length + 101}`),
      staff: 1,
      revenue: 0,
      status: 'ACTIVE'
    };

    const updated = [...get().outlets, newOutlet];
    try { localStorage.setItem(`megamart_tenant_${tenantId}_outlets`, JSON.stringify(updated)); } catch (e) {}
    set({ outlets: updated });
    return newOutlet;
  },

  toggleOutletStatus: (id) => {
    const tenantId = get().currentTenantId;
    const updated = get().outlets.map(o => o.id === id ? { ...o, status: (o.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as any } : o);
    try { localStorage.setItem(`megamart_tenant_${tenantId}_outlets`, JSON.stringify(updated)); } catch (e) {}
    set({ outlets: updated });
  }
}));
