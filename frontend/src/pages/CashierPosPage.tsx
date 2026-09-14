import React, { useState, useEffect, useRef } from 'react';
import { usePosStore, DiscountType } from '../store/usePosStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavStore } from '../store/useNavStore';
import { useRetailStore } from '../store/useRetailStore';
import { BarChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import { productApi, transactionApi, customerApi } from '../services/api';
import { Product, Customer, CartItem } from '../types';
import { getExpiryInfo, getExpiryStatus, getClearancePrice } from '../utils/fefo';
import { CustomerCrmPanel } from '../components/CustomerCrmPanel';
import { CustomerDirectoryView } from '../components/CustomerDirectoryView';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { parseGs1BarcodeString } from '../utils/gs1BarcodeParser';
import { 
  Barcode, Search, Plus, Minus, Trash2, CreditCard, DollarSign, Camera,
  User, CheckCircle2, AlertCircle, ShoppingBag, Percent, Image as ImageIcon, 
  Sparkles, Tag, ShieldCheck, Phone, UserCheck, UserPlus, Gift, RefreshCw,
  Lock, ShieldAlert, QrCode, Printer, History, FileText, ChevronRight, ChevronLeft, Check, Keyboard, Receipt
} from 'lucide-react';

const mockProducts: Product[] = [
  // Dairy & Cold Storage
  { id: 1, tenantId: 1, barcode: '8901234567890', name: 'Amul Taaza Toned Milk 1L', globalPrice: 68.00, costPrice: 55.00, category: 'Dairy & Cold Storage', unit: 'carton', stockQuantity: 85, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80' },
  { id: 6, tenantId: 1, barcode: '8901234567895', name: 'Epigamia Greek Yogurt 500g', globalPrice: 95.00, costPrice: 68.00, category: 'Dairy & Cold Storage', unit: 'tub', stockQuantity: 12, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80' },
  { id: 7, tenantId: 1, barcode: '8901234567896', name: 'Amul Pasteurised Butter 500g', globalPrice: 275.00, costPrice: 220.00, category: 'Dairy & Cold Storage', unit: 'pack', stockQuantity: 50, imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=150&auto=format&fit=crop&q=80' },
  { id: 8, tenantId: 1, barcode: '8901234567897', name: 'Mother Dairy Fresh Paneer 200g', globalPrice: 110.00, costPrice: 85.00, category: 'Dairy & Cold Storage', unit: 'pack', stockQuantity: 40, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=150&auto=format&fit=crop&q=80' },

  // Bakery & Breads
  { id: 2, tenantId: 1, barcode: '8901234567891', name: 'Britannia Sourdough Bread 500g', globalPrice: 110.00, costPrice: 80.00, category: 'Bakery & Breads', unit: 'loaf', stockQuantity: 40, imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=150&auto=format&fit=crop&q=80' },
  { id: 9, tenantId: 1, barcode: '8901234567898', name: 'French Butter Croissants 4 Pack', globalPrice: 240.00, costPrice: 160.00, category: 'Bakery & Breads', unit: 'box', stockQuantity: 25, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=80' },
  { id: 10, tenantId: 1, barcode: '8901234567899', name: 'Choco Chip Artisan Cookies 300g', globalPrice: 195.00, costPrice: 130.00, category: 'Bakery & Breads', unit: 'jar', stockQuantity: 30, imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=150&auto=format&fit=crop&q=80' },

  // Beverages & Pantry
  { id: 3, tenantId: 1, barcode: '8901234567892', name: 'Blue Tokai Coffee Beans 1kg', globalPrice: 850.00, costPrice: 620.00, category: 'Beverages & Pantry', unit: 'bag', stockQuantity: 120, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=150&auto=format&fit=crop&q=80' },
  { id: 4, tenantId: 1, barcode: '8901234567893', name: 'Himalayan Mineral Water 6x500ml', globalPrice: 180.00, costPrice: 120.00, category: 'Beverages & Pantry', unit: 'pack', stockQuantity: 15, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80' },
  { id: 5, tenantId: 1, barcode: '8901234567894', name: 'Figaro Cold Pressed Olive Oil 750ml', globalPrice: 750.00, costPrice: 540.00, category: 'Beverages & Pantry', unit: 'bottle', stockQuantity: 65, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80' },
  { id: 11, tenantId: 1, barcode: '8901234567900', name: 'Organic Royal Basmati Rice 5kg', globalPrice: 620.00, costPrice: 480.00, category: 'Beverages & Pantry', unit: 'bag', stockQuantity: 80, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80' },
  { id: 12, tenantId: 1, barcode: '8901234567901', name: 'Twinings Earl Grey Tea 100 Bags', globalPrice: 490.00, costPrice: 350.00, category: 'Beverages & Pantry', unit: 'box', stockQuantity: 45, imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=150&auto=format&fit=crop&q=80' },

  // Fresh Produce & Fruits
  { id: 13, tenantId: 1, barcode: '8901234567902', name: 'Washington Red Apples 1kg', globalPrice: 220.00, costPrice: 150.00, category: 'Fresh Produce & Fruits', unit: 'kg', stockQuantity: 90, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&auto=format&fit=crop&q=80' },
  { id: 14, tenantId: 1, barcode: '8901234567903', name: 'Hass Avocados 2 Pack', globalPrice: 290.00, costPrice: 190.00, category: 'Fresh Produce & Fruits', unit: 'pack', stockQuantity: 35, imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=150&auto=format&fit=crop&q=80' },
  { id: 15, tenantId: 1, barcode: '8901234567904', name: 'Organic Robusta Bananas 1 Dozen', globalPrice: 75.00, costPrice: 45.00, category: 'Fresh Produce & Fruits', unit: 'dozen', stockQuantity: 110, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=150&auto=format&fit=crop&q=80' },

  // Snacks & Household
  { id: 16, tenantId: 1, barcode: '8901234567905', name: 'Lindt Excellence 85% Cocoa 100g', globalPrice: 320.00, costPrice: 220.00, category: 'Snacks & Confectionery', unit: 'bar', stockQuantity: 70, imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=150&auto=format&fit=crop&q=80' },
  { id: 17, tenantId: 1, barcode: '8901234567906', name: 'Dettol Liquid Handwash 500ml Refill', globalPrice: 145.00, costPrice: 95.00, category: 'Personal & Home Care', unit: 'pouch', stockQuantity: 100, imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=150&auto=format&fit=crop&q=80' },
];

const loadSavedProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem('megamart_products_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return mockProducts;
};

const loadSavedBillsHistory = (tenantId: number = 1): any[] => {
  try {
    const key = tenantId === 1 ? 'megamart_bills_history' : `megamart_tenant_${tenantId}_bills_history`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((b: any) => b.id !== 'INV-891024' && b.id !== 'INV-891023' && b.id !== 'INV-891022');
      }
    }
  } catch (e) {}
  return [];
};

export const CashierPosPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentTenantId = user?.tenantId || 1;
  const { activeNavItem } = useNavStore();
  const { products, deductStock, setProducts } = useRetailStore();
  const { 
    cart, addToCart, removeFromCart, updateQuantity, clearCart, 
    activeCustomer, setActiveCustomer, discountType, discountValue, setDiscount,
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
    customersList, addCustomerToStore, updateCustomerStore, setCustomersList,
    getSubtotal, getDiscountAmount, getTaxAmount, getTotalAmount 
  } = usePosStore();

  const [billsHistory, setBillsHistory] = useState<any[]>(() => loadSavedBillsHistory(currentTenantId));

  const refreshBillsHistory = async () => {
    try {
      const [txns, custs] = await Promise.all([
        transactionApi.getStoreTransactions(user?.storeId || 1).catch(() => []),
        customerApi.getCustomers().catch(() => customersList)
      ]);

      const custById = new Map<number | string, Customer>();
      (custs || []).forEach(c => {
        if (c.id) custById.set(c.id, c);
      });
      customersList.forEach(c => {
        if (c.id && !custById.has(c.id)) custById.set(c.id, c);
      });

      const localBills = loadSavedBillsHistory(currentTenantId);

      if (txns && txns.length > 0) {
        const backendBills = txns.map(t => {
          const rawDate = t.timestamp || t.createdAt;
          const dateObj = rawDate ? new Date(rawDate) : new Date();
          const itemsCount = (t.lineItems || []).reduce((acc, li) => acc + (li.quantity || 1), 0);
          const txnTimestamp = dateObj.getTime();
          const totalAmt = Number(t.totalAmount) || 0;

          // Resolve real customer name & phone
          let custName = t.customerName;
          let custPhone = t.customerPhone;

          if ((!custName || custName === 'Walk-in Guest') && t.customerId && custById.has(t.customerId)) {
            const matched = custById.get(t.customerId)!;
            custName = matched.name;
            custPhone = matched.phoneNumber;
          }

          // Check if any local bill corresponds to this transaction (by time proximity and exact amount)
          const matchedLocal = localBills.find((lb: any) => 
            lb.dbTxnId === t.id ||
            lb.id === t.invoiceNumber ||
            (Math.abs((Number(lb.amount) || 0) - totalAmt) < 0.01 && 
             Math.abs((lb.timestamp || new Date(lb.date).getTime() || 0) - txnTimestamp) < 180000)
          );

          if (matchedLocal) {
            if (!custName || custName === 'Walk-in Guest') {
              custName = matchedLocal.customerName;
            }
            if (!custPhone || custPhone === 'N/A') {
              custPhone = matchedLocal.customerPhone;
            }
          }

          return {
            id: t.invoiceNumber || `INV-${String(t.id).padStart(6, '0')}`,
            customerName: custName || 'Walk-in Guest',
            customerPhone: custPhone || 'N/A',
            amount: totalAmt,
            paymentMode: t.paymentMethod || matchedLocal?.paymentMode || 'UPI',
            date: dateObj.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            timestamp: txnTimestamp,
            itemsCount: itemsCount || (matchedLocal?.itemsCount || 1),
            subtotal: (totalAmt) - (Number(t.taxAmount) || 0) + (Number(t.discountAmount) || 0),
            tax: Number(t.taxAmount) || (matchedLocal?.tax || 0),
            discount: Number(t.discountAmount) || (matchedLocal?.discount || 0),
            dbTxnId: t.id,
            items: (t.lineItems && t.lineItems.length > 0) ? t.lineItems.map(li => ({
              product: li.product || { name: `Item #${li.id}`, globalPrice: Number(li.unitPrice) || 0 },
              quantity: li.quantity || 1,
              name: li.product?.name || `Item #${li.id}`,
              price: Number(li.unitPrice) || 0,
              total: (Number(li.unitPrice) || 0) * (li.quantity || 1)
            })) : (matchedLocal?.items || [])
          };
        });

        // Filter out any local bills that are already represented in backendBills
        const unrepresentedLocalBills = localBills.filter((lb: any) => {
          const lbTime = lb.timestamp || new Date(lb.date).getTime() || 0;
          const lbAmt = Number(lb.amount) || 0;
          return !backendBills.some(bb => 
            bb.id === lb.id || 
            (lb.dbTxnId && bb.dbTxnId === lb.dbTxnId) ||
            (Math.abs(bb.amount - lbAmt) < 0.01 && Math.abs(bb.timestamp - lbTime) < 180000)
          );
        });

        const merged = [...backendBills, ...unrepresentedLocalBills].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setBillsHistory(merged);
        const key = currentTenantId === 1 ? 'megamart_bills_history' : `megamart_tenant_${currentTenantId}_bills_history`;
        try { localStorage.setItem(key, JSON.stringify(merged)); } catch (e) {}
        return;
      }
    } catch (e) {
      console.warn('Could not fetch store transactions from server', e);
    }
    setBillsHistory(loadSavedBillsHistory(currentTenantId));
  };

  useEffect(() => {
    useRetailStore.getState().loadTenantData(currentTenantId);
    usePosStore.getState().loadTenantCustomers(currentTenantId);
    refreshBillsHistory();
  }, [currentTenantId, user?.storeId, activeNavItem]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [phoneSearchInput, setPhoneSearchInput] = useState('');
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  
  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [trxSuccessModal, setTrxSuccessModal] = useState<any | null>(null);
  const [scanError, setScanError] = useState('');
  const [expiredBlockItem, setExpiredBlockItem] = useState<Product | null>(null);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // DOM Input Refs for 100% Keyboard-Driven Auto-Focus
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const processAddToCart = (product: Product) => {
    const status = getExpiryStatus(product.expiryDate);
    if (status === 'EXPIRED') {
      setExpiredBlockItem(product);
      setScanError(`⛔ SALE BLOCKED: Batch ${product.batchNumber || 'M-24'} expired on ${product.expiryDate || 'recently'}. Perishable safety violation.`);
      return false;
    }
    addToCart(product);
    if (status === 'NEAR_EXPIRY') {
      setScanError(`⚡ FEFO Clearance Discount Applied! Product expiring soon (${product.expiryDate}).`);
    } else {
      setScanError('');
    }
    return true;
  };

  const handleProductClick = (product: Product) => {
    if (!activeCustomer) {
      setScanError('⚠️ MANDATORY: Please enter customer mobile number above before adding items.');
      setTimeout(() => phoneInputRef.current?.focus(), 100);
      return;
    }
    processAddToCart(product);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // Pagination state for products grid
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Bills Reprint History state
  const [historySearch, setHistorySearch] = useState('');
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<any | null>(null);

  useEffect(() => {
    productApi.getStoreInventory(user?.storeId || 1)
      .then(data => { if (data.length > 0) setProducts(data); })
      .catch(() => {});
    
    customerApi.getCustomers()
      .then(data => { if (data.length > 0) setCustomersList(data); })
      .catch(() => {});
  }, [user?.storeId]);

  // Auto-focus phone input on mount or when customer is detached
  useEffect(() => {
    if (!activeCustomer && activeNavItem === 'pos') {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [activeCustomer, activeNavItem]);

  // Reset to page 1 whenever category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Parked Bills State for Hold/Recall Workflow
  const [parkedBills, setParkedBills] = useState<{ id: string; customer: Customer; cart: CartItem[]; time: string; total: number }[]>([]);
  const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

  // Global Keyboard Shortcuts for Mouse-Free Cashier Operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Checkout Payment Gateway
      if (e.key === 'F2') {
        e.preventDefault();
        if (activeCustomer && cart.length > 0) {
          setIsPaymentGatewayOpen(true);
        }
      }
      // F4 or ESC: New Customer Session
      if (e.key === 'F4' || (e.key === 'Escape' && !isPaymentGatewayOpen && !trxSuccessModal && !isParkedModalOpen)) {
        e.preventDefault();
        setActiveCustomer(null);
        clearCart();
        setCustomerNotFound(false);
        setPhoneSearchInput('');
        setNewCustomerName('');
        setScanError('');
        setTimeout(() => phoneInputRef.current?.focus(), 100);
      }
      // F8: Hold / Park Bill
      if (e.key === 'F8') {
        e.preventDefault();
        if (activeCustomer && cart.length > 0) {
          const parked = {
            id: `HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
            customer: activeCustomer,
            cart: [...cart],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: getTotalAmount()
          };
          setParkedBills(prev => [parked, ...prev]);
          setActiveCustomer(null);
          clearCart();
          setScanError('📌 Active bill held in parking slot. Ready for next customer!');
          setTimeout(() => phoneInputRef.current?.focus(), 100);
        }
      }
      // F9: Recall Parked Bill Modal
      if (e.key === 'F9') {
        e.preventDefault();
        setIsParkedModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCustomer, cart.length, isPaymentGatewayOpen, trxSuccessModal, isParkedModalOpen]);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Helper function to extract 10 normalized digits from any phone format (+91 98765 43210 -> 9876543210)
  const normalizePhoneDigits = (phone: string) => {
    const clean = (phone || '').replace(/\D/g, '');
    return clean.length >= 10 ? clean.slice(-10) : clean;
  };

  // Master Unified Customer Pool (merging DB customers, state customersList, AND billsHistory)
  const allKnownCustomers = React.useMemo(() => {
    const map = new Map<string, Customer>();

    // 1. Add all from customersList
    customersList.forEach(c => {
      const clean = (c.phoneNumber || '').replace(/\D/g, '');
      const key = clean.length >= 10 ? clean.slice(-10) : clean;
      if (key) {
        map.set(key, {
          ...c,
          totalSpent: c.totalSpent || c.lifetimeValue || 0,
          loyaltyPoints: c.loyaltyPoints || 0,
          tier: c.tier || ((c.totalSpent || c.lifetimeValue || 0) > 20000 ? 'PLATINUM' : (c.totalSpent || c.lifetimeValue || 0) > 10000 ? 'GOLD' : (c.totalSpent || c.lifetimeValue || 0) > 3000 ? 'SILVER' : 'REGULAR')
        });
      }
    });

    // 2. Extract and merge from billsHistory (so even if visited previously in history, they are found!)
    billsHistory.forEach(b => {
      if (b.customerPhone && b.customerPhone !== 'N/A') {
        const clean = b.customerPhone.replace(/\D/g, '');
        const key = clean.length >= 10 ? clean.slice(-10) : clean;
        if (key) {
          const spentFromBills = billsHistory
            .filter(bh => {
              const bhClean = (bh.customerPhone || '').replace(/\D/g, '');
              const bhKey = bhClean.length >= 10 ? bhClean.slice(-10) : bhClean;
              return bhKey === key;
            })
            .reduce((sum, bh) => sum + (Number(bh.amount) || 0), 0);

          const existing = map.get(key);
          if (existing) {
            map.set(key, {
              ...existing,
              name: existing.name && existing.name !== 'Valued Customer' ? existing.name : (b.customerName || existing.name),
              totalSpent: Math.max(existing.totalSpent || 0, spentFromBills),
              loyaltyPoints: Math.max(existing.loyaltyPoints || 0, Math.floor(spentFromBills / 100))
            });
          } else {
            map.set(key, {
              id: Date.now() + Math.floor(Math.random() * 1000),
              name: b.customerName || 'Valued Customer',
              phoneNumber: b.customerPhone,
              loyaltyPoints: Math.floor(spentFromBills / 100),
              totalSpent: spentFromBills,
              tier: spentFromBills > 20000 ? 'PLATINUM' : spentFromBills > 10000 ? 'GOLD' : spentFromBills > 3000 ? 'SILVER' : 'REGULAR'
            });
          }
        }
      }
    });

    return Array.from(map.values());
  }, [customersList, billsHistory]);

  // Live Auto-Complete Suggestions as Cashier Types (searches DB + local store + past bills history!)
  useEffect(() => {
    const query = phoneSearchInput.trim();
    if (query.length >= 2 && !activeCustomer) {
      const cleanQuery = normalizePhoneDigits(query);
      const matches = allKnownCustomers.filter(c => {
        const cClean = normalizePhoneDigits(c.phoneNumber);
        return (cleanQuery.length >= 2 && cClean.includes(cleanQuery)) || 
               c.phoneNumber.includes(query) || 
               c.name.toLowerCase().includes(query.toLowerCase());
      });
      setCustomerSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [phoneSearchInput, activeCustomer, allKnownCustomers]);

  const selectCustomer = (cust: Customer) => {
    setActiveCustomer(cust);
    setCustomerNotFound(false);
    setShowSuggestions(false);
    setScanError('');
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  // Step 1: Customer Phone Lookup on ENTER key (10-Digit Smart Matching across DB + History)
  const handleCustomerPhoneLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = phoneSearchInput.trim();
    if (!query) return;

    const cleanQuery = normalizePhoneDigits(query);

    // 1. Check master allKnownCustomers pool with 10-digit normalized matching
    const foundMaster = allKnownCustomers.find(c => {
      const cClean = normalizePhoneDigits(c.phoneNumber);
      return (cleanQuery.length >= 4 && cClean === cleanQuery) ||
             c.phoneNumber.includes(query) ||
             c.name.toLowerCase().includes(query.toLowerCase());
    });

    if (foundMaster) {
      selectCustomer(foundMaster);
      return;
    }

    // 2. Query Backend Database API via Spring Boot / PostgreSQL
    try {
      const dbCustomer = await customerApi.lookupByPhone(query);
      if (dbCustomer) {
        addCustomerToStore(dbCustomer);
        selectCustomer(dbCustomer);
        return;
      }
    } catch (err) {}

    // If not found in DB or history, prompt for registration
    setCustomerNotFound(true);
    setShowSuggestions(false);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  // Step 2: Auto-Create Customer on ENTER key (Prevents duplicates if phone number exists)
  const handleCreateNewCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCustomerName.trim() || !phoneSearchInput.trim()) return;

    const cleanQuery = normalizePhoneDigits(phoneSearchInput.trim());

    // Check if customer already exists in master pool before creating duplicate!
    const existing = allKnownCustomers.find(c => normalizePhoneDigits(c.phoneNumber) === cleanQuery);
    if (existing) {
      const updatedCust = {
        ...existing,
        name: newCustomerName.trim()
      };
      updateCustomerStore(updatedCust);
      selectCustomer(updatedCust);
      setNewCustomerName('');
      setPhoneSearchInput('');
      return;
    }

    let newCust: Customer = {
      id: Date.now(),
      name: newCustomerName.trim(),
      phoneNumber: phoneSearchInput.trim(),
      loyaltyPoints: 0,
      totalSpent: 0,
      tier: 'REGULAR'
    };

    try {
      const created = await customerApi.createCustomer({ name: newCust.name, phoneNumber: newCust.phoneNumber });
      if (created) {
        newCust = { ...created, totalSpent: 0, loyaltyPoints: 0, tier: 'REGULAR' };
      }
    } catch (err) {}

    addCustomerToStore(newCust);
    selectCustomer(newCust);
    setNewCustomerName('');
    setPhoneSearchInput('');
  };

  // Step 3: Barcode or Product Name Scan on ENTER key (keeps cursor focused on barcode input for rapid scanning)
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) {
      setScanError('⚠️ MANDATORY: Please select or register a customer first.');
      setTimeout(() => phoneInputRef.current?.focus(), 100);
      return;
    }

    const term = barcodeInput.trim();
    if (!term) return;
    setScanError('');
    try {
      const scanned = await productApi.scanBarcode(user?.storeId || 1, term);
      if (scanned) {
        if (processAddToCart(scanned)) {
          setBarcodeInput('');
          setSearchQuery('');
        }
      } else {
        // 1. Exact Barcode Match
        // 2. Name Partial Match (e.g. "milk", "amul", "bread")
        const localMatch = products.find(p => p.barcode === term || p.name.toLowerCase().includes(term.toLowerCase()));
        if (localMatch) {
          if (processAddToCart(localMatch)) {
            setBarcodeInput('');
            setSearchQuery('');
          }
        } else {
          setUnregisteredBarcode(term);
          setScanError(`⚠️ BARCODE NOT REGISTERED: Item #${term} not found in Mall Catalog.`);
        }
      }
    } catch (err) {
      const localMatch = products.find(p => p.barcode === term || p.name.toLowerCase().includes(term.toLowerCase()));
      if (localMatch) {
        if (processAddToCart(localMatch)) {
          setBarcodeInput('');
          setSearchQuery('');
        }
      } else {
        setUnregisteredBarcode(term);
        setScanError(`⚠️ BARCODE NOT REGISTERED: Item #${term} not found in Mall Catalog.`);
      }
    } finally {
      // Keep barcode input focused for next barcode scan!
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    setIsPaymentGatewayOpen(true);
  };

  const handlePaymentSuccess = async (paymentDetails: { method: string; paymentId: string; orderId: string; amount: number }) => {
    setIsPaymentGatewayOpen(false);
    
    // Earned loyalty points: 1 point per 100 spent
    const pointsEarned = Math.floor(getTotalAmount() / 100);

    // 1. Persist Sale Transaction in Backend Database first
    let savedTxn: any = null;
    try {
      savedTxn = await transactionApi.create({
        storeId: user?.storeId || 1,
        customerId: activeCustomer?.id,
        customerPhone: activeCustomer?.phoneNumber,
        customerName: activeCustomer?.name,
        lineItems: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod: paymentDetails.method,
        taxAmount: getTaxAmount(),
        discountAmount: getDiscountAmount()
      });
    } catch (e) {
      console.warn('Backend transaction persistence failed, proceeding with local fallback', e);
    }

    const invoiceId = savedTxn?.invoiceNumber 
      || (savedTxn?.id ? `INV-${String(savedTxn.id).padStart(6, '0')}` : `INV-${Date.now().toString().slice(-6)}`);

    const receiptData = {
      invoiceId,
      customerName: activeCustomer ? activeCustomer.name : 'Walk-in Guest',
      customerPhone: activeCustomer ? activeCustomer.phoneNumber : 'N/A',
      items: [...cart],
      subtotal: getSubtotal(),
      tax: getTaxAmount(),
      discount: getDiscountAmount(),
      total: getTotalAmount(),
      paymentMethod: paymentDetails.method,
      cashierName: user?.name || 'Priya Patel (Lead Cashier)',
      date: new Date().toLocaleString(),
      pointsEarned,
      dbTxnId: savedTxn?.id
    };

    // 2. Persist Store Inventory Stock Deduction in DB & LocalStorage
    cart.forEach(item => {
      const currentStock = item.product.stockQuantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      productApi.updateStock(user?.storeId || 1, item.product.id, newStock).catch(() => {});
      deductStock(item.product.id, item.quantity);
    });

    // 3. Update Customer Loyalty Points & Lifetime Spend in DB/Persistent Store
    if (activeCustomer) {
      const updatedCust = {
        ...activeCustomer,
        totalSpent: (activeCustomer.totalSpent || 0) + getTotalAmount(),
        loyaltyPoints: (activeCustomer.loyaltyPoints || 0) + pointsEarned
      };
      updateCustomerStore(updatedCust);
    }

    // 4. Save completed bill into persistent bills history
    const newBillRecord = {
      id: receiptData.invoiceId,
      customerName: receiptData.customerName,
      customerPhone: receiptData.customerPhone,
      amount: receiptData.total,
      paymentMode: receiptData.paymentMethod,
      date: receiptData.date,
      itemsCount: receiptData.items.length,
      items: receiptData.items.map(it => ({
        product: it.product,
        quantity: it.quantity,
        name: it.product.name,
        price: it.product.globalPrice,
        total: it.product.globalPrice * it.quantity
      })),
      subtotal: receiptData.subtotal,
      tax: receiptData.tax,
      discount: receiptData.discount,
      pointsEarned: receiptData.pointsEarned,
      cashierName: receiptData.cashierName,
      dbTxnId: savedTxn?.id,
      timestamp: Date.now()
    };

    setBillsHistory(prev => {
      const updated = [newBillRecord, ...prev];
      const key = currentTenantId === 1 ? 'megamart_bills_history' : `megamart_tenant_${currentTenantId}_bills_history`;
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setTrxSuccessModal(receiptData);
    clearCart();
  };

  // PDF Tax Invoice Downloader
  const handleDownloadPdfInvoice = (data: any) => {
    const textContent = `
====================================================
          MEGAMART SUPERMARKET RETAIL LTD
        Bandra West, Mumbai - GSTIN: 27AAAAA0000A1Z5
             OFFICIAL GST TAX INVOICE
====================================================
Invoice No : ${data.invoiceId}
Date & Time: ${data.date}
Cashier    : ${data.cashierName} (Terminal #01)
Customer   : ${data.customerName} (${data.customerPhone})
Loyalty Pts: +${data.pointsEarned} Earned
Payment    : ${data.paymentMethod}
----------------------------------------------------
ITEMS PURCHASED:
${data.items.map((it: any, idx: number) => `${idx + 1}. ${it.product.name} (x${it.quantity}) @ ₹${it.product.globalPrice} = ₹${(it.product.globalPrice * it.quantity).toFixed(2)}`).join('\n')}
----------------------------------------------------
Subtotal       : ₹${data.subtotal.toFixed(2)}
Discount       : -₹${data.discount.toFixed(2)}
GST Tax (18%)  : ₹${data.tax.toFixed(2)}
----------------------------------------------------
TOTAL AMOUNT PAID : ₹${data.total.toFixed(2)}
====================================================
         Thank you for shopping at MegaMart!
        For returns, present receipt within 7 days.
====================================================
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${data.invoiceId}_MegaMart_Tax_Invoice.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter products by search and category (Cross-category search enabled)
  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      p.barcode.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'ALL' || q !== '' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = ['ALL', 'Dairy & Cold Storage', 'Bakery & Breads', 'Beverages & Pantry', 'Fresh Produce & Fruits', 'Snacks & Confectionery', 'Personal & Home Care'];

  // ─── SUB-VIEW: BILLING HISTORY & REPRINT ───
  const renderHistoryView = () => {
    const filteredHistory = billsHistory.filter(b => 
      (b.id || '').toLowerCase().includes(historySearch.toLowerCase()) || 
      (b.customerName || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (b.customerPhone || '').includes(historySearch)
    );

    // Compute dynamic real-time shift analytics from actual bills
    const totalShiftSales = billsHistory.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const upiSales = billsHistory.filter(b => (b.paymentMode || '').toUpperCase().includes('UPI')).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const cashSales = billsHistory.filter(b => (b.paymentMode || '').toUpperCase().includes('CASH')).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const cardSales = billsHistory.filter(b => (b.paymentMode || '').toUpperCase().includes('CARD')).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const otherSales = Math.max(0, totalShiftSales - upiSales - cashSales - cardSales);

    const hourBuckets: Record<string, { count: number; total: number }> = {
      '08 AM': { count: 0, total: 0 },
      '10 AM': { count: 0, total: 0 },
      '12 PM': { count: 0, total: 0 },
      '02 PM': { count: 0, total: 0 },
      '04 PM': { count: 0, total: 0 },
      '06 PM': { count: 0, total: 0 },
      '08 PM': { count: 0, total: 0 },
    };

    billsHistory.forEach(b => {
      const d = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
      if (!isNaN(d.getTime())) {
        const hour = d.getHours();
        let bucket = '12 PM';
        if (hour < 9) bucket = '08 AM';
        else if (hour < 11) bucket = '10 AM';
        else if (hour < 13) bucket = '12 PM';
        else if (hour < 15) bucket = '02 PM';
        else if (hour < 17) bucket = '04 PM';
        else if (hour < 19) bucket = '06 PM';
        else bucket = '08 PM';
        hourBuckets[bucket].count += 1;
        hourBuckets[bucket].total += Number(b.amount) || 0;
      }
    });

    const hourlyData = Object.entries(hourBuckets).map(([label, val]) => ({
      label,
      value: val.count,
      subValue: val.total > 0 ? `₹${val.total >= 1000 ? (val.total / 1000).toFixed(1) + 'k' : val.total.toFixed(0)}` : '₹0'
    }));

    const paymentSegments = [
      { label: 'UPI QR', value: upiSales, color: '#D97706' },
      { label: 'Cash', value: cashSales, color: '#78350F' },
      { label: 'Card', value: cardSales, color: '#F59E0B' },
    ];
    if (otherSales > 0) {
      paymentSegments.push({ label: 'Other', value: otherSales, color: '#B45309' });
    }

    const shiftSalesFormatted = totalShiftSales >= 100000 
      ? `₹${(totalShiftSales / 100000).toFixed(2)}L`
      : `₹${totalShiftSales.toLocaleString('en-IN')}`;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">Customer Bills & Thermal Reprint</h2>
            <p className="text-xs text-stone-500">Search customer receipts by Invoice ID or Mobile Number to reprint bill.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshBillsHistory}
              title="Refresh from server"
              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl transition cursor-pointer border border-amber-200 flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <div className="w-72 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search phone / Invoice ID..."
                className="gold-input w-full pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Cashier Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <BarChartWidget
              title="Shift Hourly Transaction Throughput"
              subtitle={`Total ${billsHistory.length} bills processed on Register #1`}
              data={hourlyData}
              valuePrefix=""
            />
          </div>
          <div className="lg:col-span-5">
            <DonutChartWidget
              title="Cashier Payment Mode Split"
              subtitle="Tender distribution for completed bills"
              centerLabel="SHIFT SALES"
              centerValue={shiftSalesFormatted}
              segments={paymentSegments}
            />
          </div>
        </div>

        <div className="gold-card overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600" />
              <p className="font-bold text-stone-600 text-sm">No Customer Bills Found</p>
              <p className="text-xs text-stone-400 mt-1">Complete a checkout transaction to record customer invoices here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
                <tr>
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile No</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredHistory.map(b => (
                  <tr key={b.id} className="hover:bg-amber-50/40">
                    <td className="p-3 font-mono font-bold text-amber-900">{b.id}</td>
                    <td className="p-3 font-bold">{b.customerName}</td>
                    <td className="p-3 font-mono text-stone-600">{b.customerPhone}</td>
                    <td className="p-3 text-stone-500 text-[11px]">{b.date}</td>
                    <td className="p-3"><span className="gold-badge">{b.paymentMode}</span></td>
                    <td className="p-3 text-right font-black text-amber-900">₹{Number(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedBillForPrint(b)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for reprinting history bill */}
        {selectedBillForPrint && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-sm w-full p-6 rounded-2xl border-2 border-stone-800 shadow-2xl font-mono text-xs text-stone-900 space-y-4">
              <div className="text-center border-b border-dashed border-stone-400 pb-3">
                <h3 className="font-extrabold text-sm uppercase">MEGAMART SUPERMARKET</h3>
                <p className="text-[10px] text-stone-500">GSTIN: 27AAAAA0000A1Z5</p>
                <p className="text-[10px] text-amber-800 font-bold">Duplicate Tax Invoice</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Invoice No:</span> <strong>{selectedBillForPrint.id}</strong></div>
                <div className="flex justify-between"><span>Customer:</span> <strong>{selectedBillForPrint.customerName} ({selectedBillForPrint.customerPhone})</strong></div>
                <div className="flex justify-between"><span>Date:</span> <span>{selectedBillForPrint.date}</span></div>
                <div className="flex justify-between"><span>Payment Mode:</span> <span>{selectedBillForPrint.paymentMode}</span></div>
              </div>

              <div className="border-t border-b border-dashed border-stone-400 py-3 space-y-1 text-[11px]">
                {selectedBillForPrint.items && selectedBillForPrint.items.length > 0 ? (
                  <div className="space-y-1 pb-2">
                    <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase pb-1 border-b border-stone-200">
                      <span>Item</span>
                      <span>Qty x Price</span>
                      <span className="text-right">Total</span>
                    </div>
                    {selectedBillForPrint.items.map((it: any, idx: number) => {
                      const itemName = it.product?.name || it.name || `Item #${idx + 1}`;
                      const qty = it.quantity || it.qty || 1;
                      const price = Number(it.product?.globalPrice || it.price) || 0;
                      const lineTotal = Number(it.total) || (qty * price);
                      return (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="truncate max-w-[140px] font-semibold">{itemName}</span>
                          <span className="text-stone-500">{qty} x ₹{price}</span>
                          <span className="font-bold text-right">₹{lineTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(selectedBillForPrint.subtotal || (selectedBillForPrint.amount - (selectedBillForPrint.tax || 0))).toFixed(2)}</span>
                </div>
                {Number(selectedBillForPrint.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedBillForPrint.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST / Tax:</span>
                  <span>₹{Number(selectedBillForPrint.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-stone-300">
                  <span>TOTAL PAID:</span>
                  <span>₹{Number(selectedBillForPrint.amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedBillForPrint(null)}
                  className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => { window.print(); setSelectedBillForPrint(null); }}
                  className="w-1/2 gold-button-primary py-2 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Thermal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (activeNavItem === 'customers') {
    return <CustomerDirectoryView />;
  }

  if (activeNavItem === 'history') {
    return renderHistoryView();
  }

  // ─── MAIN POS TERMINAL (Mouse-Free Keyboard-Driven Flow) ───
  return (
    <div className="space-y-4 select-none">
      
      {/* Keyboard Shortcut Hints Bar */}
      <div className="bg-amber-950 text-amber-100 px-4 py-2 rounded-xl text-[11px] font-mono flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-400">Cashier Shortcuts:</span>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span><strong className="bg-amber-800 px-1.5 py-0.5 rounded text-white">[Enter]</strong> Next/Scan</span>
          <span><strong className="bg-amber-800 px-1.5 py-0.5 rounded text-white">[F2]</strong> Checkout</span>
          <span><strong className="bg-amber-800 px-1.5 py-0.5 rounded text-white">[F8]</strong> Hold Bill ({parkedBills.length})</span>
          <span><strong className="bg-amber-800 px-1.5 py-0.5 rounded text-white">[F9]</strong> Parked Bills</span>
          <span><strong className="bg-amber-800 px-1.5 py-0.5 rounded text-white">[F4]/[Esc]</strong> Reset</span>
        </div>
      </div>

      {/* Real-Life Workflow Step 1: Customer Phone Search Bar */}
      <div className={`p-4 rounded-2xl transition-all ${
        !activeCustomer 
          ? 'bg-amber-100/90 border-2 border-amber-500 shadow-md ring-4 ring-amber-500/10' 
          : 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border border-amber-300 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              !activeCustomer ? 'bg-amber-600 text-white animate-bounce' : 'bg-amber-700 text-white'
            }`}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-amber-950 text-sm">Step 1: Enter Customer Mobile No</h3>
                <span className="gold-badge text-[9px] font-black">Press Enter To Proceed</span>
              </div>
              <p className="text-xs text-stone-600 font-semibold">
                {!activeCustomer ? 'Type 10-digit mobile number and press ENTER to auto-select customer.' : 'Customer session active.'}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <form onSubmit={handleCustomerPhoneLookup} className="flex items-center gap-2 w-full">
              <input
                ref={phoneInputRef}
                value={phoneSearchInput}
                onChange={e => {
                  setPhoneSearchInput(e.target.value);
                  if (customerNotFound) setCustomerNotFound(false);
                }}
                onFocus={() => {
                  if (customerSuggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Enter Mobile No (e.g. 9876543210)..."
                className="gold-input text-xs w-full font-mono font-bold border-amber-400 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="gold-button-primary px-4 py-2 text-xs rounded-xl shrink-0 cursor-pointer font-bold flex items-center gap-1 shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Enter</span>
              </button>
            </form>

            {/* Live Auto-Complete Suggestions Dropdown */}
            {showSuggestions && !activeCustomer && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-amber-400 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-amber-100 max-h-60 overflow-y-auto animate-slide-up">
                <div className="bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span>✨ Database Customer Matches</span>
                  <span>{customerSuggestions.length} Found</span>
                </div>
                {customerSuggestions.map(cust => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => selectCustomer(cust)}
                    className="w-full text-left p-2.5 hover:bg-amber-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-600 group-hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-stone-900 group-hover:text-amber-950 flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-black">{cust.tier || 'REGULAR'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-stone-500 font-semibold">{cust.phoneNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-amber-900">₹{(cust.totalSpent || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-stone-400">{cust.loyaltyPoints || 0} pts</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Inline Customer Found Card OR Auto-Create Form with Auto-Focus */}
        {activeCustomer ? (
          <div className="mt-3 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-amber-500/10 p-3 rounded-xl border border-amber-400 flex items-center justify-between gap-3 text-xs shadow-xs animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-sm">
                {activeCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-stone-950 text-sm">{activeCustomer.name}</span>
                  <span className="gold-badge font-mono font-bold text-xs">{activeCustomer.phoneNumber}</span>
                  <span className="bg-amber-900 text-amber-100 font-extrabold text-[9px] px-2 py-0.5 rounded-full">{activeCustomer.tier || 'MEMBER'}</span>
                  {(activeCustomer.totalSpent || 0) > 0 && (
                    <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      RETURNING CUSTOMER DETECTED
                    </span>
                  )}
                </div>
                <div className="text-stone-600 text-[11px] flex items-center gap-4 mt-1 font-semibold flex-wrap">
                  <span>Loyalty Balance: <strong className="text-amber-900 font-bold">{activeCustomer.loyaltyPoints || 0} pts</strong></span>
                  <span>Lifetime Spend: <strong className="text-amber-900 font-bold">₹{(activeCustomer.totalSpent || 0).toLocaleString()}</strong></span>
                  <span className="text-emerald-700 font-bold">✓ Account & Billing History Loaded from DB</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setActiveCustomer(null); clearCart(); setTimeout(() => phoneInputRef.current?.focus(), 100); }}
              className="text-stone-500 hover:text-stone-800 text-xs font-extrabold px-3 py-1.5 hover:bg-amber-200/60 rounded-xl cursor-pointer transition-colors border border-amber-300/50 shrink-0"
            >
              Detach Customer (F4)
            </button>
          </div>
        ) : customerNotFound ? (
          <div className="mt-3 bg-amber-50/90 p-3 rounded-xl border border-amber-400 flex flex-col md:flex-row items-center justify-between gap-3 text-xs animate-slide-up">
            <div className="flex items-center gap-2 text-amber-950 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>No customer for {phoneSearchInput}. Type Name and press ENTER to register!</span>
            </div>
            <form onSubmit={handleCreateNewCustomer} className="flex items-center gap-2 w-full md:w-auto">
              <input
                ref={nameInputRef}
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                placeholder="Type Customer Full Name & Press Enter..."
                className="gold-input text-xs py-1.5 w-full md:w-64 font-bold border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register & Enter</span>
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {/* POS Terminal Dual-Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative">
        
        {/* Left Column: Barcode Scanner & Product Grid (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Barcode Fast Input Bar */}
          <div className="gold-card p-3">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={e => {
                    setBarcodeInput(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder={!activeCustomer ? "⚠️ Step 1: Type customer mobile number above..." : "Type product name (e.g. Milk) or scan barcode & press ENTER..."}
                  disabled={!activeCustomer}
                  className={`gold-input w-full pl-9 text-xs font-mono font-bold ${!activeCustomer ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'border-amber-400 focus:ring-amber-500'}`}
                />
              </div>
              <button
                type="button"
                disabled={!activeCustomer}
                onClick={() => setIsCameraModalOpen(true)}
                className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  !activeCustomer ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-amber-900 hover:bg-amber-800 text-amber-100 cursor-pointer border border-amber-700/60'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Camera</span>
              </button>
              <button 
                type="submit" 
                disabled={!activeCustomer}
                className={`text-xs px-4 rounded-xl font-bold transition-all ${
                  !activeCustomer ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'gold-button-primary cursor-pointer'
                }`}
              >
                Add [Enter]
              </button>
            </form>
            {scanError && (
              <div className="text-[11px] text-amber-950 font-bold mt-2 bg-amber-100 p-2.5 rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <span>{scanError}</span>
                {unregisteredBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const existingTickets = JSON.parse(localStorage.getItem('megamart_registration_tickets') || '[]');
                        const newTicket = {
                          id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
                          barcode: unregisteredBarcode,
                          cashier: user?.name || 'Cashier Register #1',
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          status: 'Pending Admin Catalog Onboarding'
                        };
                        localStorage.setItem('megamart_registration_tickets', JSON.stringify([newTicket, ...existingTickets]));
                        setScanError(`✅ REGISTRATION TICKET FLAGGED: Inventory team notified for Barcode #${unregisteredBarcode}!`);
                        setUnregisteredBarcode(null);
                      } catch (e) {}
                    }}
                    className="bg-amber-900 hover:bg-amber-800 text-amber-100 px-3 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer shrink-0 border border-amber-700/60"
                  >
                    + Request Product Registration Ticket
                  </button>
                )}
              </div>
            )}
          </div>

          {/* POS Register Camera Barcode Scanner Modal */}
          <CameraBarcodeScannerModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onScanSuccess={(scannedText) => {
              const parsed = parseGs1BarcodeString(scannedText);
              const cleanCode = parsed.gtin || scannedText.trim();
              setBarcodeInput(cleanCode);
              setSearchQuery(cleanCode);
              // Trigger barcode checkout addition automatically
              const localMatch = products.find(p => p.barcode === cleanCode || (p.barcode && cleanCode.includes(p.barcode)) || p.name.toLowerCase().includes(cleanCode.toLowerCase()));
              if (localMatch) {
                processAddToCart(localMatch);
                setBarcodeInput('');
                setSearchQuery('');
              }
            }}
            title="POS Register Live WebRTC Camera Scanner"
          />

          {/* Category Filter & Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-200/80 text-stone-700 hover:bg-amber-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-48 relative shrink-0">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="gold-input w-full pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            {/* Product Card Grid (With Mandatory Customer Barrier) */}
            <div className="relative">
              {!activeCustomer && (
                <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px] z-20 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-950 text-sm">Customer Session Required</h4>
                    <p className="text-xs text-stone-700 max-w-xs font-medium">Type customer mobile number at the top field and press ENTER to start billing.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paginatedProducts.map(p => {
                  const exp = getExpiryInfo(p.expiryDate);
                  const isExpired = exp.status === 'EXPIRED';
                  const isNear = exp.status === 'NEAR_EXPIRY';
                  const displayPrice = isNear ? getClearancePrice(p.globalPrice, p.expiryDate) : p.globalPrice;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className={`gold-card p-3 transition-all flex flex-col justify-between group relative overflow-hidden ${
                        !activeCustomer || isExpired ? 'opacity-70 border-rose-300 bg-rose-50/20' : 'hover:border-amber-500/80 cursor-pointer active:scale-98'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="relative">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-24 object-cover rounded-xl border border-stone-200/60" />
                          <span className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full border shadow-xs ${exp.badgeClass}`}>
                            {exp.badgeLabel}
                          </span>
                        </div>
                        <div className="font-bold text-stone-900 text-xs line-clamp-2 leading-tight group-hover:text-amber-900">{p.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono flex justify-between">
                          <span>BC: {p.barcode}</span>
                          <span className="font-bold text-amber-900">{p.batchNumber || 'BATCH-01'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                        <div>
                          {isNear ? (
                            <div className="flex items-center gap-1">
                              <span className="font-black text-rose-700 text-sm">₹{displayPrice.toFixed(2)}</span>
                              <span className="line-through text-[10px] text-stone-400">₹{p.globalPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-black text-amber-900 text-sm">₹{p.globalPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <span className="gold-badge text-[9px]">Stock: {p.stockQuantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Product Catalog Pagination Controls */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200/80 text-xs">
                <div className="text-stone-500 font-medium text-[11px]">
                  Showing <strong className="text-amber-950">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-amber-950">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of <strong className="text-amber-950">{filteredProducts.length}</strong> items in Mall
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 ${
                      currentPage === 1 ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-950 cursor-pointer'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1 font-mono font-extrabold">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-amber-100 text-stone-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 ${
                      currentPage === totalPages ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-950 cursor-pointer'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Customer Bill Summary & Cart Items (5 Cols) */}
        <div className="md:col-span-5 gold-card p-4 flex flex-col justify-between h-[640px]">
          
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-stone-900 text-sm">Active Customer Bill</h3>
              </div>
              <button
                onClick={clearCart}
                className="text-[11px] text-stone-500 hover:text-red-600 font-bold cursor-pointer"
              >
                Clear Cart
              </button>
            </div>

            {/* Cart Table */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1">
              {!activeCustomer ? (
                <div className="h-full flex flex-col items-center justify-center text-amber-900 space-y-2 py-12 text-center p-4">
                  <Lock className="w-10 h-10 opacity-60 text-amber-700" />
                  <p className="text-xs font-bold">Billing Session Locked</p>
                  <p className="text-[11px] text-stone-500 font-medium">Type customer mobile number above and press ENTER to unlock checkout.</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2 py-12">
                  <ShoppingBag className="w-10 h-10 opacity-40" />
                  <p className="text-xs font-semibold">Cart is empty. Scan barcode and press ENTER.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-stone-900 text-xs line-clamp-1">{item.product.name}</div>
                      <div className="text-[11px] text-stone-500">₹{item.product.globalPrice} x {item.quantity} = <strong className="text-amber-900">₹{(item.product.globalPrice * item.quantity).toFixed(2)}</strong></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-extrabold text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 text-stone-400 hover:text-red-600 flex items-center justify-center ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Bill Summary Calculation */}
          <div className="border-t border-amber-200 pt-3 space-y-2">
            
            {/* Interactive Bill Discount Selector Control (Before Checkout) */}
            {cart.length > 0 && activeCustomer && (
              <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Apply Bill Discount</span>
                  </div>
                  <div className="flex bg-white rounded-lg p-0.5 border border-amber-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscount('PERCENT', discountValue)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        discountType === 'PERCENT' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-amber-900'
                      }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscount('FLAT', discountValue)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        discountType === 'FLAT' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-amber-900'
                      }`}
                    >
                      ₹ Flat INR
                    </button>
                  </div>
                </div>

                {/* Preset Chips & Custom Input */}
                <div className="flex items-center gap-1.5">
                  {(discountType === 'PERCENT' ? [0, 5, 10, 15] : [0, 50, 100, 200]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscount(discountType, val)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                        discountValue === val 
                          ? 'bg-amber-700 text-white border-amber-800 shadow-xs' 
                          : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                      }`}
                    >
                      {val === 0 ? 'None' : discountType === 'PERCENT' ? `${val}%` : `₹${val}`}
                    </button>
                  ))}
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'PERCENT' ? 100 : getSubtotal()}
                      placeholder="Custom"
                      value={discountValue || ''}
                      onChange={e => setDiscount(discountType, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="gold-input text-[11px] py-1 px-2 text-right w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-600"><span>Subtotal:</span><span>₹{getSubtotal().toFixed(2)}</span></div>
              <div className="flex justify-between text-stone-600"><span>GST Tax (18%):</span><span>₹{getTaxAmount().toFixed(2)}</span></div>
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-amber-900 font-black bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  <span>Discount ({discountType === 'PERCENT' ? `${discountValue}%` : `₹${discountValue}`}):</span>
                  <span>-₹{getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-amber-950 text-base pt-1 border-t border-stone-200">
                <span>TOTAL DUE:</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={!activeCustomer || cart.length === 0}
              className={`w-full text-xs py-3 rounded-xl font-extrabold cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 ${
                !activeCustomer || cart.length === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'gold-button-primary shadow-amber-500/20'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout [F2] (₹{getTotalAmount().toFixed(2)})</span>
            </button>
          </div>

        </div>

      </div>

      {/* Split Payment Modal */}
      {isPaymentGatewayOpen && (
        <PaymentGatewayModal
          isOpen={true}
          amount={getTotalAmount()}
          description="Supermarket Cashier POS Billing Settlement"
          customerName={activeCustomer?.name}
          customerPhone={activeCustomer?.phoneNumber}
          onSuccess={handlePaymentSuccess}
          onClose={() => setIsPaymentGatewayOpen(false)}
        />
      )}

      {/* Thermal Receipt Print Modal on Payment Completion */}
      {trxSuccessModal && (
        <div className="fixed inset-0 bg-stone-900/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-slide-up receipt-modal-backdrop">
          <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-3xl border-2 border-amber-500 shadow-2xl font-mono text-xs text-stone-900 space-y-4 print-area print:rounded-none print:border-none print:shadow-none print:w-full print:max-w-full">
            
            <div className="text-center border-b-2 border-dashed border-stone-400 pb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 font-black shadow-xs no-print">
                <CheckCircle2 className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="font-extrabold text-base uppercase text-stone-950 tracking-wider">MEGAMART SUPERMARKET RETAIL LTD</h2>
              <p className="text-[11px] text-stone-600 font-bold mt-0.5">Bandra West Store, Mumbai • Tel: +91 22 8900 1122</p>
              <p className="text-[10px] text-stone-500 font-mono mt-0.5">GSTIN: 27AAAAA0000A1Z5 | FSSAI Lic No: 11521001000888</p>
              <span className="inline-block mt-2 font-extrabold text-[11px] uppercase bg-amber-100 text-amber-950 border border-amber-300 px-3 py-0.5 rounded-full print:border-stone-800">
                OFFICIAL GST TAX INVOICE RECEIPT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/80 p-3 rounded-xl border border-amber-200 print:bg-stone-50 print:border-stone-300">
              <div><span>Invoice No:</span> <strong className="text-amber-950 font-mono font-bold block">{trxSuccessModal.invoiceId}</strong></div>
              <div><span>Date & Time:</span> <span className="block font-medium">{trxSuccessModal.date}</span></div>
              <div><span>Customer:</span> <strong className="text-stone-900 block">{trxSuccessModal.customerName} ({trxSuccessModal.customerPhone})</strong></div>
              <div><span>Cashier ID:</span> <span className="block font-medium">{trxSuccessModal.cashierName} (POS #01)</span></div>
              <div><span>Payment Mode:</span> <span className="gold-badge font-mono print:border-stone-800">{trxSuccessModal.paymentMethod}</span></div>
              <div className="text-amber-900 font-extrabold"><span>Loyalty Points:</span> <span className="block">+{trxSuccessModal.pointsEarned} pts Earned</span></div>
            </div>

            {/* Line Items Table */}
            <div className="border-t-2 border-b-2 border-dashed border-stone-400 py-3 space-y-2 text-[11px]">
              <div className="grid grid-cols-12 font-extrabold border-b border-stone-200 pb-1 uppercase text-[10px] text-stone-500">
                <span className="col-span-6">Item Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>

              {trxSuccessModal.items.map((it: any) => (
                <div key={it.product.id} className="grid grid-cols-12 font-medium">
                  <span className="col-span-6 font-bold text-stone-900">{it.product.name}</span>
                  <span className="col-span-2 text-center font-bold">x{it.quantity}</span>
                  <span className="col-span-2 text-right">₹{it.product.globalPrice.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-black text-amber-950">₹{(it.product.globalPrice * it.quantity).toFixed(2)}</span>
                </div>
              ))}

              {/* Tax & Breakdown calculation */}
              <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-stone-600"><span>Items Subtotal:</span><span>₹{trxSuccessModal.subtotal.toFixed(2)}</span></div>
                {trxSuccessModal.discount > 0 && (
                  <div className="flex justify-between text-amber-900 font-bold"><span>Total Savings / Discount:</span><span>-₹{trxSuccessModal.discount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-stone-600"><span>CGST (9%):</span><span>₹{(trxSuccessModal.tax / 2).toFixed(2)}</span></div>
                <div className="flex justify-between text-stone-600"><span>SGST (9%):</span><span>₹{(trxSuccessModal.tax / 2).toFixed(2)}</span></div>
                <div className="flex justify-between pt-2 border-t-2 border-dashed border-stone-400 font-black text-sm text-stone-950">
                  <span>NET TOTAL PAID:</span>
                  <span className="text-base text-amber-950">₹{trxSuccessModal.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-1 text-[10px] text-stone-500 pt-1">
              <p className="font-extrabold text-stone-800 text-xs">Thank you for shopping at MegaMart Supermarket!</p>
              <p>For exchanges/returns, please bring this original tax invoice within 7 days.</p>
              <p className="font-mono pt-1 text-[9px]">Invoice Verification Code: MM-{trxSuccessModal.invoiceId}-2026</p>
            </div>

            <div className="flex gap-2 pt-3 no-print">
              <button
                type="button"
                onClick={() => { setTrxSuccessModal(null); setTimeout(() => phoneInputRef.current?.focus(), 100); }}
                className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                Next (F4)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdfInvoice(trxSuccessModal)}
                className="w-1/3 bg-amber-100 hover:bg-amber-200 text-amber-950 py-3 rounded-xl font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 border border-amber-300 transition-all shadow-2xs"
              >
                <FileText className="w-4 h-4 text-amber-800" />
                <span>Invoice File</span>
              </button>
              <button
                type="button"
                onClick={() => { window.print(); setTrxSuccessModal(null); setTimeout(() => phoneInputRef.current?.focus(), 100); }}
                className="w-1/3 gold-button-primary py-3 rounded-xl font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Parked / Held Bills Recall Modal */}
      {isParkedModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="bg-white max-w-md w-full p-5 rounded-2xl border-2 border-amber-400 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm">Parked / Held Customer Bills</h3>
              <button onClick={() => setIsParkedModalOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold">✕</button>
            </div>

            {parkedBills.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs font-semibold">
                No active bills currently parked. Press F8 during checkout to hold a bill.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {parkedBills.map(b => (
                  <div key={b.id} className="p-3 bg-amber-50/80 rounded-xl border border-amber-300 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-extrabold text-amber-950">{b.customer.name} ({b.customer.phoneNumber})</div>
                      <div className="text-[10px] text-stone-500 font-mono">Held at {b.time} • {b.cart.length} items • ₹{b.total.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCustomer(b.customer);
                        clearCart();
                        b.cart.forEach(it => addToCart(it.product, it.quantity));
                        setParkedBills(prev => prev.filter(x => x.id !== b.id));
                        setIsParkedModalOpen(false);
                      }}
                      className="gold-button-primary px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Recall Bill
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Expired Goods Sale Block Warning Modal */}
      {expiredBlockItem && (
        <div className="fixed inset-0 bg-stone-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-rose-600 shadow-2xl space-y-4 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <span className="bg-rose-600 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                ⛔ FSSAI / FDA Expiry Compliance Block
              </span>
              <h3 className="font-black text-amber-950 text-lg mt-2">Perishable Goods Expired</h3>
              <p className="text-xs text-stone-600 font-semibold mt-1">
                This product batch has passed its expiration date and is strictly prohibited from customer checkout.
              </p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-left font-mono text-xs space-y-1.5 text-stone-800">
              <div className="font-bold text-amber-950 text-sm">{expiredBlockItem.name}</div>
              <div className="flex justify-between text-stone-600">
                <span>Barcode / SKU:</span> <strong className="text-amber-900">{expiredBlockItem.barcode}</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Batch Number:</span> <strong className="text-amber-900">{expiredBlockItem.batchNumber || 'BATCH-M24'}</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Expiration Date:</span> <strong className="text-rose-700 font-bold">{expiredBlockItem.expiryDate || 'Expired'}</strong>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setExpiredBlockItem(null)}
                className="gold-button-primary w-full py-3 rounded-2xl font-black text-xs cursor-pointer shadow-md"
              >
                Acknowledge & Dismiss Block
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
