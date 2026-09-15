import React, { useState, useEffect } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRetailStore } from '../store/useRetailStore';
import { BarChartWidget, DonutChartWidget } from '../components/AnalyticsCharts';
import { productApi } from '../services/api';
import { Product } from '../types';
import { getExpiryInfo, getExpiryStatus } from '../utils/fefo';
import { autoExtractProductFromBarcode, parseGs1BarcodeString, GS1_GLOBAL_BARCODE_REGISTRY } from '../utils/gs1BarcodeParser';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { ProductOnboardingModal } from '../components/ProductOnboardingModal';
import {
  AlertTriangle, Clock, CheckCircle2, Plus, Minus, Search, Camera,
  Printer, Lock, Tag, QrCode, Truck, PackagePlus, Boxes, ClipboardCheck, Download, X, Sparkles, Zap, Layers
} from 'lucide-react';

interface ReceivedPO {
  id: string;
  product: string;
  qty: number;
  batch: string;
  date: string;
  status: string;
}

export const InventoryClerkPage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { user } = useAuthStore();
  const { products: items, updateStockQuantity, addProduct } = useRetailStore();
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  // 0-Manual GS1 Barcode Scanner State
  const [gs1Input, setGs1Input] = useState('');
  const [autoIntakePreview, setAutoIntakePreview] = useState<any | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Goods Receiving
  const [poProductSearch, setPoProductSearch] = useState('Amul Taaza Toned Milk 1L');
  const [showPoSuggestions, setShowPoSuggestions] = useState(false);
  const [selectedPoProductItem, setSelectedPoProductItem] = useState<Product | null>(items[0] || null);

  // Custom Uncataloged SKU Fields
  const [customPrice, setCustomPrice] = useState('150.00');
  const [customCost, setCustomCost] = useState('100.00');
  const [customCategory, setCustomCategory] = useState('Beverages & Pantry');
  const [customUnit, setCustomUnit] = useState('pack');

  const isNewTenant = !!(user?.tenantId && user.tenantId !== 1);

  const [poVerifyBarcode, setPoVerifyBarcode] = useState('');
  const [poBarcodeError, setPoBarcodeError] = useState('');
  const [isPoCameraOpen, setIsPoCameraOpen] = useState(false);
  const [poBatch, setPoBatch] = useState(`BATCH-PO-${Math.floor(100 + Math.random() * 900)}`);
  const [poQty, setPoQty] = useState('50');
  const [poExpiry, setPoExpiry] = useState('2026-10-15');
  const [receivedPOs, setReceivedPOs] = useState<ReceivedPO[]>(() => {
    if (isNewTenant) {
      try {
        const saved = localStorage.getItem(`megamart_tenant_${user?.tenantId}_received_pos`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    }
    return [
      { id: 'PO-4521', product: 'Amul Taaza Milk 1L', qty: 100, batch: 'BATCH-PO-451', date: 'Today, 08:30 AM', status: 'Verified & Intake Completed' },
      { id: 'PO-4520', product: 'Britannia Sourdough Bread 500g', qty: 60, batch: 'BATCH-PO-450', date: 'Yesterday, 04:15 PM', status: 'Verified & Intake Completed' },
    ];
  });

  // Physical Stock Audit state (Tenant scoped)
  const [auditCounts, setAuditCounts] = useState<Record<number, number>>(() => {
    if (isNewTenant) {
      try {
        const saved = localStorage.getItem(`megamart_tenant_${user?.tenantId}_audit_counts`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {};
    }
    return { 6: 12, 2: 38, 1: 85, 4: 15, 5: 65 };
  });

  useEffect(() => {
    if (isNewTenant && user?.tenantId) {
      try {
        localStorage.setItem(`megamart_tenant_${user.tenantId}_received_pos`, JSON.stringify(receivedPOs));
      } catch (e) {}
    }
  }, [receivedPOs, isNewTenant, user?.tenantId]);

  useEffect(() => {
    if (isNewTenant && user?.tenantId) {
      try {
        localStorage.setItem(`megamart_tenant_${user.tenantId}_audit_counts`, JSON.stringify(auditCounts));
      } catch (e) {}
    }
  }, [auditCounts, isNewTenant, user?.tenantId]);

  // Barcode Printer
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [printCopies, setPrintCopies] = useState('12');

  useEffect(() => {
    productApi.getFEFOInventory(user?.storeId || 1).catch(() => {});
  }, [user?.storeId]);

  const handleStockAdjust = (productId: number, delta: number) => {
    const target = items.find(i => i.id === productId);
    if (target) {
      const current = target.stockQuantity ?? target.stock ?? 0;
      updateStockQuantity(productId, Math.max(0, current + delta));
    }
  };

  const handleAuditCountChange = (productId: number, val: number) => {
    setAuditCounts(prev => ({ ...prev, [productId]: Math.max(0, val) }));
  };

  const handleSubmitAudit = () => {
    setMsg('Physical Stock Audit Reconciliation report generated and submitted to Store Manager!');
    setTimeout(() => setMsg(''), 4000);
    window.print();
  };

  const handleReceivePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPoBarcodeError('');

    const cleanSearch = poProductSearch.trim();
    if (!cleanSearch) {
      setPoBarcodeError('❌ Please type or select a product name / barcode.');
      return;
    }

    const qtyNum = parseInt(poQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setPoBarcodeError('❌ Received quantity must be at least 1 unit.');
      return;
    }

    // 1. Resolve Target Item (catalog item OR custom user created item)
    let targetItem = selectedPoProductItem;

    if (!targetItem) {
      targetItem = items.find(it => 
        it.name.toLowerCase() === cleanSearch.toLowerCase() || 
        it.barcode === cleanSearch || 
        (poVerifyBarcode && it.barcode === poVerifyBarcode.trim())
      ) || null;
    }

    if (!targetItem) {
      // 2. Uncataloged Custom Item: Onboard with Custom Title, Price, Category & Barcode
      const parsedVerify = parseGs1BarcodeString(poVerifyBarcode);
      const cleanCode = (parsedVerify.gtin || poVerifyBarcode.trim()) || (isNaN(Number(cleanSearch)) ? `GTIN-${Date.now().toString().slice(-8)}` : cleanSearch);
      const customTitle = isNaN(Number(cleanSearch)) ? cleanSearch : `Custom SKU #${cleanSearch.slice(-6)}`;
      const sellingPriceNum = parseFloat(customPrice) || 150;
      const costPriceNum = parseFloat(customCost) || 100;

      targetItem = {
        id: Date.now(),
        tenantId: user?.tenantId || 1,
        barcode: cleanCode,
        sku: `SKU-${cleanCode.slice(-6)}`,
        name: customTitle,
        category: customCategory,
        globalPrice: sellingPriceNum,
        price: sellingPriceNum,
        costPrice: costPriceNum,
        unit: customUnit,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
        stockQuantity: qtyNum,
        stock: qtyNum,
        totalStock: qtyNum,
        reorderLevel: 15,
        gstRate: 18,
        batchNumber: poBatch,
        expiryDate: poExpiry
      };

      addProduct(targetItem);
    } else {
      // Barcode match verification if barcode input was filled
      const parsedScan = parseGs1BarcodeString(poVerifyBarcode);
      const cleanScan = parsedScan.gtin || poVerifyBarcode.trim();
      if (cleanScan && cleanScan !== targetItem.barcode && !cleanScan.includes(targetItem.barcode) && !targetItem.barcode.includes(cleanScan)) {
        setPoBarcodeError(`⛔ BARCODE MISMATCH: Scanned barcode "${cleanScan}" does NOT match expected GTIN "${targetItem.barcode}"! Please verify item.`);
        return;
      }
      // Update stock quantity for existing item
      const current = targetItem.stockQuantity ?? targetItem.stock ?? 0;
      updateStockQuantity(targetItem.id, current + qtyNum);
    }

    setReceivedPOs(prev => [{
      id: `PO-${Math.floor(4500 + Math.random() * 100)}`,
      product: targetItem!.name,
      qty: qtyNum,
      batch: poBatch,
      date: 'Just now',
      status: 'VERIFIED & INTAKE COMPLETED'
    }, ...prev]);

    setMsg(`✅ INWARD STOCK RECEIVED: Added ${qtyNum} units of "${targetItem!.name}" (Barcode: ${targetItem!.barcode}, Batch #${poBatch}).`);
    setPoVerifyBarcode('');
    setPoBarcodeError('');
    setPoBatch(`BATCH-PO-${Math.floor(100 + Math.random() * 900)}`);
    setShowPoSuggestions(false);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleExportCsv = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MegaMart_${title}_${Date.now()}.csv`; a.click();
    setMsg(`${title} report exported!`); setTimeout(() => setMsg(''), 3500);
  };

  // Render SVG EAN-13 Barcode Lines
  const renderBarcodeSvg = (code: string) => (
    <svg className="w-full h-10 my-1" viewBox="0 0 200 40">
      <rect width="200" height="40" fill="#ffffff" />
      {/* Dynamic bar pattern simulation based on digits */}
      {code.split('').map((char, i) => {
        const digit = parseInt(char) || 1;
        const x = 10 + i * 14;
        const width = (digit % 3) + 2;
        return (
          <g key={i}>
            <rect x={x} y="4" width={width} height="28" fill="#000000" />
            <rect x={x + width + 2} y="4" width="2" height="28" fill="#000000" />
          </g>
        );
      })}
      <text x="100" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#000000">{code}</text>
    </svg>
  );

  // ─── SUB-VIEW 1: FEFO AUDITOR ───
  const renderFefo = () => {
    const filteredItems = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.batchNumber || '').toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-amber-200/80">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">FEFO Stock Expiry Auditor</h2>
            <p className="text-xs text-stone-500">First-Expired-First-Out batch tracking across cold storage, bakery, and grocery shelves.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-56 relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter batch or item..." className="gold-input w-full pl-9 text-xs font-mono" />
            </div>
            <button
              onClick={() => handleExportCsv('FEFO_Expiry_Report', items.map(p => `${p.batchNumber},${p.name},${p.category},${p.expiryDate},${p.stockQuantity}`).join('\n'))}
              className="gold-button-primary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1 shrink-0 shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Export Expiry Report
            </button>
          </div>
        </div>

        {/* FEFO & Expiration Risk Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <BarChartWidget
              title="Stock Expiration Risk Timeline"
              subtitle="FEFO priority batch expiration forecast"
              data={[
                { label: 'High Priority (< 3 Days)', value: 12, subValue: 'Epigamia Yogurt' },
                { label: 'Medium (< 7 Days)', value: 40, subValue: 'Britannia Bread' },
                { label: 'Regular (< 14 Days)', value: 85, subValue: 'Amul Milk' },
                { label: 'Safe Stock (30+ Days)', value: 80, subValue: 'Olive Oil / Water' },
              ]}
              valuePrefix=""
            />
          </div>
          <div className="lg:col-span-5">
            <DonutChartWidget
              title="Cold Storage vs Shelf Inventory"
              subtitle="Stock distribution across storage zones"
              centerLabel="TOTAL ITEMS"
              centerValue="217"
              segments={[
                { label: 'Dairy & Cold', value: 97, color: '#78350F' },
                { label: 'Pantry & Oil', value: 80, color: '#D97706' },
                { label: 'Bakery', value: 40, color: '#F59E0B' },
              ]}
            />
          </div>
        </div>

        <div className="gold-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
              <tr>
                <th className="p-3">Batch No</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-center">Expiry Risk</th>
                <th className="p-3 text-right">Shelf Stock</th>
                <th className="p-3 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {filteredItems.map(p => {
                const exp = getExpiryInfo(p.expiryDate);
                const stockQty = p.stockQuantity ?? p.stock ?? 0;

                return (
                  <tr key={p.id} className="hover:bg-amber-50/40">
                    <td className="p-3 font-mono font-bold text-amber-900">{p.batchNumber || 'BATCH-M24'}</td>
                    <td className="p-3 font-bold text-stone-900">{p.name}</td>
                    <td className="p-3 text-stone-600">{p.category}</td>
                    <td className="p-3 font-mono text-amber-950 font-bold">{p.expiryDate || '2026-09-14'}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${exp.badgeClass}`}>
                        {exp.badgeLabel}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-amber-950">{stockQty} {p.unit || 'pcs'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleStockAdjust(p.id, -1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-xs cursor-pointer">-</button>
                        <button onClick={() => handleStockAdjust(p.id, 1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-xs cursor-pointer">+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  const handleGs1AutoScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gs1Input.trim()) return;

    const autoResult = autoExtractProductFromBarcode(gs1Input);
    setAutoIntakePreview(autoResult.product);
    setMsg(autoResult.message);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleConfirmAutoIntake = () => {
    if (!autoIntakePreview) return;
    addProduct(autoIntakePreview);
    setReceivedPOs(prev => [{
      id: `PO-${Math.floor(4500 + Math.random() * 100)}`,
      product: autoIntakePreview.name,
      qty: autoIntakePreview.stockQuantity || 50,
      batch: autoIntakePreview.batchNumber || 'BATCH-01',
      date: 'Just now',
      status: 'Verified & Intake Completed'
    }, ...prev]);

    setMsg(`✅ ZERO-MANUAL INTAKE COMPLETED: Added ${autoIntakePreview.stockQuantity || 50} units of "${autoIntakePreview.name}" to Master Inventory!`);
    setAutoIntakePreview(null);
    setGs1Input('');
    setTimeout(() => setMsg(''), 4500);
  };

  // ─── SUB-VIEW 2: GOODS RECEIVING ───
  const renderReceiving = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Goods Receiving & Zero-Manual Inward Intake</h2>
          <p className="text-xs text-stone-500">Scan GS1-128 barcodes or GTIN codes to auto-catalog products and auto-parse expiry dates with 0 typing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <PackagePlus className="w-4 h-4" /> + Onboard Barcode SKU
          </button>
          <button
            onClick={() => handleExportCsv('Inward_Receiving_Log', receivedPOs.map(r => `${r.id},${r.product},${r.qty},${r.batch},${r.date}`).join('\n'))}
            className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Inward Log CSV
          </button>
        </div>
      </div>

      {/* Product Onboarding & Enrichment Modal */}
      <ProductOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onSaveProduct={(newProd) => {
          addProduct(newProd);
          setMsg(`✅ Onboarded SKU "${newProd.name}" into Mall Product Catalog!`);
          setTimeout(() => setMsg(''), 4000);
        }}
        existingProducts={items}
      />

      {/* ZERO-MANUAL GS1 AUTOMATED INTAKE WIDGET */}
      <div className="gold-card p-6 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-amber-500/10 border-2 border-amber-400 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-950 text-sm">⚡ Zero-Manual GS1 Barcode Auto-Intake Scanner</h3>
              <p className="text-[11px] text-stone-600">Scan any GS1 barcode or standard GTIN (e.g. 8901234567890 or GS1-128 string) to auto-extract product title, price, batch, and expiry date.</p>
            </div>
          </div>
          <span className="bg-amber-900 text-amber-100 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">0 Manual Typing</span>
        </div>

        <form onSubmit={handleGs1AutoScan} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              value={gs1Input}
              onChange={e => setGs1Input(e.target.value)}
              placeholder="Scan or paste GS1 barcode string e.g. (01)8901234567891(17)260914(10)BATCH-B11 or EAN 8901234567890..."
              className="gold-input w-full pl-9 font-mono text-xs py-2.5 font-bold"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-100 text-xs rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border border-amber-700/60 transition-all hover:scale-105"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Scan with Camera</span>
          </button>
          <button type="submit" className="gold-button-primary text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>Auto-Parse GS1</span>
          </button>
        </form>

        {/* Live Camera Scanner Modal */}
        <CameraBarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScanSuccess={(scannedBarcode) => {
            const parsed = parseGs1BarcodeString(scannedBarcode);
            const actualCode = parsed.gtin || scannedBarcode.trim();
            setGs1Input(actualCode);
            const autoResult = autoExtractProductFromBarcode(scannedBarcode, user?.tenantId || 1);
            setAutoIntakePreview(autoResult.product);
            setMsg(autoResult.message);
            setTimeout(() => setMsg(''), 5000);
          }}
          title="Inward Inventory Camera Scanner"
        />

        {/* Auto-Intake Preview Box */}
        {autoIntakePreview && (
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-500 shadow-md space-y-3 font-mono text-xs animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="gold-badge text-[9px]">AUTO-EXTRACTED GS1 DATA</span>
                <h4 className="font-extrabold text-amber-950 text-sm mt-1">{autoIntakePreview.name}</h4>
                <div className="text-stone-500 text-[11px]">Category: {autoIntakePreview.category} • Barcode: {autoIntakePreview.barcode}</div>
              </div>
              <span className="font-black text-amber-950 text-base">₹{autoIntakePreview.globalPrice.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Parsed Batch ID</span>
                <strong className="text-amber-900 font-bold text-xs">{autoIntakePreview.batchNumber}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Auto Expiration Date</span>
                <strong className="text-rose-700 font-bold text-xs">{autoIntakePreview.expiryDate}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Intake Units</span>
                <strong className="text-emerald-700 font-bold text-xs">{autoIntakePreview.stockQuantity} {autoIntakePreview.unit}s</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmAutoIntake}
                className="gold-button-primary flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Add to System Inventory (0 Typing)</span>
              </button>
              <button
                onClick={() => setAutoIntakePreview(null)}
                className="gold-btn-secondary px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="gold-card p-6 max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-amber-950 text-sm">Verify & Receive Inward Supplier PO</h3>
            <p className="text-[11px] text-stone-500">Scan or type physical barcode to verify item match before updating store inventory balance.</p>
          </div>
          <span className="gold-badge text-[9px]">BARCODE VERIFICATION ENFORCED</span>
        </div>

        <form onSubmit={handleReceivePoSubmit} className="space-y-3.5 text-xs">
          
          {/* SMART PRODUCT SEARCH & AUTO-SUGGEST INPUT */}
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Search & Type Product Name or Barcode (Manual Typing Supported)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                value={poProductSearch}
                onChange={e => {
                  const val = e.target.value;
                  setPoProductSearch(val);
                  setShowPoSuggestions(true);
                  setPoBarcodeError('');

                  // Try auto-matching catalog item as user types
                  const match = items.find(it => it.name.toLowerCase() === val.toLowerCase() || it.barcode === val.trim());
                  if (match) {
                    setSelectedPoProductItem(match);
                    setPoVerifyBarcode(match.barcode);
                  } else {
                    setSelectedPoProductItem(null);
                  }
                }}
                onFocus={() => setShowPoSuggestions(true)}
                placeholder="Type any product title, brand, or barcode (e.g. Milk, Amul, Bread, 9788...)..."
                className="gold-input w-full pl-9 pr-8 font-bold py-2.5 text-xs border-amber-400 focus:ring-amber-500"
              />
              {poProductSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPoProductSearch('');
                    setPoVerifyBarcode('');
                    setSelectedPoProductItem(null);
                  }}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 font-bold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* LIVE AUTO-SUGGESTIONS DROPDOWN */}
            {showPoSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-amber-400 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-stone-100 animate-slide-up">
                {items
                  .filter(it => 
                    it.name.toLowerCase().includes(poProductSearch.toLowerCase()) || 
                    it.barcode.includes(poProductSearch.trim()) ||
                    (it.category && it.category.toLowerCase().includes(poProductSearch.toLowerCase()))
                  )
                  .map(it => (
                    <div
                      key={it.id}
                      onClick={() => {
                        setPoProductSearch(it.name);
                        setSelectedPoProductItem(it);
                        setPoVerifyBarcode(it.barcode);
                        setShowPoSuggestions(false);
                        setPoBarcodeError('');
                      }}
                      className="p-3 hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-amber-950 text-xs">{it.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">GTIN: {it.barcode} • Category: {it.category}</div>
                      </div>
                      <span className="gold-badge text-[9px]">Stock: {it.stockQuantity ?? it.stock ?? 0}</span>
                    </div>
                  ))}

                {items.filter(it => it.name.toLowerCase().includes(poProductSearch.toLowerCase()) || it.barcode.includes(poProductSearch.trim())).length === 0 && (
                  <div className="p-3 text-[11px] text-stone-500 font-medium text-center bg-stone-50">
                    ⚡ Custom / Uncataloged Item: <strong className="text-amber-900 font-bold">"{poProductSearch}"</strong> will be auto-cataloged upon inward receiving!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PHYSICAL BARCODE SCAN VERIFICATION INPUT */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-amber-950">
              <span>Physical Barcode Scan Verification</span>
              <span className="text-amber-700">Verified GTIN Match</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  value={poVerifyBarcode}
                  onChange={e => {
                    const rawVal = e.target.value;
                    const parsed = parseGs1BarcodeString(rawVal);
                    const actualCode = parsed.gtin || rawVal.trim();
                    setPoVerifyBarcode(actualCode);
                    setPoBarcodeError('');
                    if (parsed.batchNumber) setPoBatch(parsed.batchNumber);
                    if (parsed.expiryDate) setPoExpiry(parsed.expiryDate);

                    // Auto-sync search box if scanned barcode matches an existing catalog item
                    const match = items.find(it => it.barcode === actualCode || (it.barcode && actualCode.includes(it.barcode)));
                    if (match) {
                      setPoProductSearch(match.name);
                      setSelectedPoProductItem(match);
                    } else {
                      const master = GS1_GLOBAL_BARCODE_REGISTRY[actualCode];
                      if (master) {
                        setPoProductSearch(master.name);
                        setCustomPrice(master.globalPrice.toString());
                        setCustomCost(master.costPrice.toString());
                        setCustomCategory(master.category);
                        setCustomUnit(master.unit);
                      }
                    }
                  }}
                  placeholder="Scan or type barcode to verify physical item (e.g. 8901234567890 or 9788...)..."
                  className="gold-input w-full pl-9 font-mono text-xs py-2 font-bold bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsPoCameraOpen(true)}
                className="px-3.5 py-2 bg-amber-900 hover:bg-amber-800 text-amber-100 font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-amber-700 shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Scan</span>
              </button>
            </div>

            {/* Live Verification Status Indicator */}
            {poVerifyBarcode.trim() ? (
              (() => {
                const parsed = parseGs1BarcodeString(poVerifyBarcode);
                const actualBarcode = parsed.gtin || poVerifyBarcode.trim();
                const target = selectedPoProductItem || items.find(it => it.name.toLowerCase() === poProductSearch.toLowerCase() || it.barcode === actualBarcode || (it.barcode && actualBarcode.includes(it.barcode)));
                if (target && (actualBarcode === target.barcode || actualBarcode.includes(target.barcode) || target.barcode.includes(actualBarcode))) {
                  return (
                    <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold rounded-lg text-[11px] flex items-center gap-1.5 animate-slide-up">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>MATCH VERIFIED: Physical Barcode #{actualBarcode} matches product GTIN ({target.name})!</span>
                    </div>
                  );
                } else if (!target) {
                  return (
                    <div className="p-2 bg-amber-100 border border-amber-400 text-amber-950 font-bold rounded-lg text-[11px] flex items-center gap-1.5 animate-slide-up">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>AUTO-INTAKE: Uncataloged GTIN #{actualBarcode} will be auto-cataloged and stock received!</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2 bg-rose-100 border border-rose-400 text-rose-900 font-bold rounded-lg text-[11px] flex items-center gap-1.5 animate-slide-up">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>MISMATCH: Scanned #{actualBarcode} does NOT match selected catalog GTIN ({target.barcode})!</span>
                    </div>
                  );
                }
              })()
            ) : null}
          </div>

          {poBarcodeError && (
            <div className="p-2.5 bg-amber-100 border border-amber-400 text-amber-950 font-bold rounded-xl text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{poBarcodeError}</span>
            </div>
          )}

          {/* UNCATALOGED CUSTOM PRODUCT ONBOARDING FIELDS */}
          {!selectedPoProductItem && (
            <div className="p-3.5 bg-amber-500/10 border-2 border-amber-400 rounded-xl space-y-3 animate-slide-up">
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Custom Uncataloged SKU Configuration</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    className="gold-input w-full font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customCost}
                    onChange={e => setCustomCost(e.target.value)}
                    className="gold-input w-full font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="gold-input w-full font-bold bg-white text-[11px]"
                  >
                    <option value="Dairy & Cold Storage">Dairy & Cold Storage</option>
                    <option value="Bakery & Breads">Bakery & Breads</option>
                    <option value="Beverages & Pantry">Beverages & Pantry</option>
                    <option value="Fresh Produce & Fruits">Fresh Produce & Fruits</option>
                    <option value="Snacks & Confectionery">Snacks & Confectionery</option>
                    <option value="Personal & Home Care">Personal & Home Care</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">Package Unit</label>
                  <select
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    className="gold-input w-full font-bold bg-white text-[11px]"
                  >
                    <option value="pack">pack</option>
                    <option value="pcs">pcs</option>
                    <option value="bottle">bottle</option>
                    <option value="carton">carton</option>
                    <option value="kg">kg</option>
                    <option value="loaf">loaf</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Batch Number</label>
              <input value={poBatch} onChange={e => setPoBatch(e.target.value)} className="gold-input w-full font-mono" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Received Units</label>
              <input value={poQty} onChange={e => setPoQty(e.target.value)} type="number" className="gold-input w-full font-mono font-bold" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Expiry Date</label>
              <input value={poExpiry} onChange={e => setPoExpiry(e.target.value)} type="date" className="gold-input w-full font-mono" required />
            </div>
          </div>

          <button type="submit" className="w-full gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
            <Truck className="w-4 h-4" />
            <span>Verify & Intake Inward Stock</span>
          </button>
        </form>

        {/* PO Barcode Verification Camera Modal */}
        <CameraBarcodeScannerModal
          isOpen={isPoCameraOpen}
          onClose={() => setIsPoCameraOpen(false)}
          onScanSuccess={(scannedText) => {
            const parsed = parseGs1BarcodeString(scannedText);
            const actualCode = parsed.gtin || scannedText.trim();
            setPoVerifyBarcode(actualCode);
            setPoBarcodeError('');

            // Auto-fill batch if extracted from GS1
            if (parsed.batchNumber) {
              setPoBatch(parsed.batchNumber);
            }
            // Auto-fill expiry if extracted from GS1
            if (parsed.expiryDate) {
              setPoExpiry(parsed.expiryDate);
            }

            // Auto-match against existing catalog items
            const matchedItem = items.find(it => it.barcode === actualCode || (it.barcode && actualCode.includes(it.barcode)) || (it.barcode && it.barcode.includes(actualCode)));
            if (matchedItem) {
              setPoProductSearch(matchedItem.name);
              setSelectedPoProductItem(matchedItem);
            } else {
              // Also check global GS1 registry
              const master = GS1_GLOBAL_BARCODE_REGISTRY[actualCode];
              if (master) {
                setPoProductSearch(master.name);
                setCustomPrice(master.globalPrice.toString());
                setCustomCost(master.costPrice.toString());
                setCustomCategory(master.category);
                setCustomUnit(master.unit);
                if (!parsed.expiryDate) {
                  const d = new Date();
                  d.setDate(d.getDate() + master.defaultShelfLifeDays);
                  setPoExpiry(d.toISOString().split('T')[0]);
                }
              }
            }
          }}
          title="Verify Physical Barcode for Inward PO"
          continuousMode={false}
        />
      </div>

      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">PO Reference</th>
              <th className="p-3">Product Description</th>
              <th className="p-3">Batch No</th>
              <th className="p-3 text-right">Received Qty</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {receivedPOs.map(r => (
              <tr key={r.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-mono font-bold text-amber-900">{r.id}</td>
                <td className="p-3 font-bold text-stone-900">{r.product}</td>
                <td className="p-3 font-mono text-stone-600">{r.batch}</td>
                <td className="p-3 text-right font-mono font-black text-amber-950">{r.qty} units</td>
                <td className="p-3 text-stone-500 text-[11px] font-mono">{r.date}</td>
                <td className="p-3 text-center"><span className="badge-emerald">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 3: BARCODE PRINTER ───
  const renderBarcode = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Barcode Price Tag & Shelf Label Printer</h2>
          <p className="text-xs text-stone-500">Generate and print EAN-13 thermal barcode price tags for product cartons and shelf displays.</p>
        </div>
        <button
          onClick={() => handleExportCsv('Barcode_Master_Directory', items.map(p => `${p.barcode},${p.name},${p.category},MRP:${p.globalPrice}`).join('\n'))}
          className="gold-btn-secondary text-xs px-3 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Export Barcode Master CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(p => (
          <div key={p.id} className="gold-card p-4 space-y-3 font-mono text-xs hover:border-amber-400 transition-all">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <span className="font-bold text-stone-900 line-clamp-1">{p.name}</span>
              <span className="font-black text-amber-950 text-sm">₹{p.globalPrice.toFixed(2)}</span>
            </div>

            {/* Simulated Clean Barcode Display */}
            <div className="bg-white border-2 border-stone-800 p-2.5 rounded-lg text-center space-y-1 shadow-2xs">
              <div className="text-[10px] font-extrabold text-stone-900 uppercase">MEGAMART RETAIL • {p.category}</div>
              {renderBarcodeSvg(p.barcode)}
              <div className="text-[9px] text-stone-500 font-bold">Batch: {p.batchNumber} | Exp: {p.expiryDate}</div>
            </div>

            <button
              onClick={() => { setPrintProduct(p); setIsPrintModalOpen(true); }}
              className="w-full gold-button-primary py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" /> Print Barcode Label Sheet
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── SUB-VIEW 4: PHYSICAL STOCK AUDIT ───
  const renderReconciliation = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Physical Stock Audit vs System Inventory</h2>
          <p className="text-xs text-stone-500">Perform blind physical stock count and reconcile inventory variance before month-end audit.</p>
        </div>
        <button onClick={handleSubmitAudit} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
          <ClipboardCheck className="w-4 h-4" />
          <span>Submit & Print Audit Report</span>
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Barcode</th>
              <th className="p-3">Product Name</th>
              <th className="p-3 text-right">System Balance</th>
              <th className="p-3 text-center">Physical Counted</th>
              <th className="p-3 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {items.map(p => {
              const stock = p.stockQuantity || 0;
              const counted = auditCounts[p.id] ?? stock;
              const diff = counted - stock;
              return (
                <tr key={p.id} className="hover:bg-amber-50/40">
                  <td className="p-3 font-mono text-stone-600">{p.barcode}</td>
                  <td className="p-3 font-bold text-amber-950">{p.name}</td>
                  <td className="p-3 text-right font-mono font-bold">{p.stockQuantity} {p.unit}s</td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={counted}
                      onChange={e => handleAuditCountChange(p.id, parseInt(e.target.value) || 0)}
                      className="gold-input text-xs w-20 text-center font-mono font-bold py-1"
                    />
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    <span className={diff === 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 select-none">
      {msg && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs font-bold animate-slide-up">
          {msg}
        </div>
      )}

      {/* Conditional Sub-View Router for Inventory Clerk Views */}
      {activeNavItem === 'fefo' && renderFefo()}
      {activeNavItem === 'receiving' && renderReceiving()}
      {activeNavItem === 'barcode' && renderBarcode()}
      {activeNavItem === 'reconciliation' && renderReconciliation()}
      {(!['fefo', 'receiving', 'barcode', 'reconciliation'].includes(activeNavItem)) && renderFefo()}

      {/* ─── MODAL: PRINTABLE BARCODE LABEL PREVIEW MODAL ─── */}
      {isPrintModalOpen && printProduct && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 receipt-modal-backdrop animate-slide-up">
          <div className="gold-card max-w-md w-full p-4 sm:p-6 space-y-4 bg-white text-stone-900 font-mono text-xs border-2 border-amber-300 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="no-print absolute top-3 right-3 p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="no-print border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm">Thermal Barcode Tag Print Sheet</h3>
              <p className="text-[11px] text-stone-500 font-sans">Generating barcode labels for shelf and carton tags.</p>
            </div>

            <div className="no-print flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-stone-700">Copies to Print:</span>
              <input
                type="number"
                value={printCopies}
                onChange={e => setPrintCopies(e.target.value)}
                className="gold-input w-20 text-center font-mono font-bold py-1"
              />
            </div>

            {/* Printable Label Area */}
            <div className="print-area space-y-3">
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {Array.from({ length: Math.min(Number(printCopies) || 1, 12) }).map((_, idx) => (
                  <div key={idx} className="border-2 border-black p-2 rounded text-center space-y-0.5 bg-white">
                    <div className="text-[8px] font-black tracking-tighter uppercase text-black">MEGAMART RETAIL</div>
                    <div className="text-[9px] font-bold text-black truncate">{printProduct.name}</div>
                    {renderBarcodeSvg(printProduct.barcode)}
                    <div className="text-[10px] font-black text-black">MRP: ₹{printProduct.globalPrice.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="no-print pt-2 flex gap-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => { window.print(); setIsPrintModalOpen(false); }}
                className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryClerkPage;
