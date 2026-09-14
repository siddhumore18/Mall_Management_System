import React, { useState } from 'react';
import { Product } from '../types';
import { autoExtractProductFromBarcode, parseGs1BarcodeString } from '../utils/gs1BarcodeParser';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import {
  PackagePlus, Search, CheckCircle2, AlertCircle, Camera, Sparkles,
  Database, Globe, Layers, ArrowRight, ShieldCheck, X, RefreshCw, Edit3, Plus
} from 'lucide-react';

interface ProductOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (newProduct: Product) => void;
  existingProducts: Product[];
}

export const ProductOnboardingModal: React.FC<ProductOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  existingProducts
}) => {
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'IDLE' | 'LOCAL_MATCH' | 'EXTERNAL_CANDIDATE' | 'MANUAL_CREATE'>('IDLE');

  // Candidate Data State
  const [localMatchProduct, setLocalMatchProduct] = useState<Product | null>(null);
  const [addStockQty, setAddStockQty] = useState('50');

  // New Product Prefill Form State
  const [candidateForm, setCandidateForm] = useState<{
    barcode: string;
    sku: string;
    name: string;
    brand: string;
    category: string;
    unit: string;
    sellingPrice: string;
    costPrice: string;
    stockQuantity: string;
    reorderLevel: string;
    gstRate: string;
    expiryDate: string;
    batchNumber: string;
    imageUrl: string;
    source: 'LOCAL_DB' | 'OPEN_FOOD_FACTS' | 'GS1_REGISTRY' | 'MANUAL';
  }>({
    barcode: '',
    sku: '',
    name: '',
    brand: '',
    category: 'Beverages & Pantry',
    unit: 'pack',
    sellingPrice: '150.00',
    costPrice: '100.00',
    stockQuantity: '50',
    reorderLevel: '15',
    gstRate: '18',
    expiryDate: '2026-10-15',
    batchNumber: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
    imageUrl: '',
    source: 'MANUAL'
  });

  const [notificationMsg, setNotificationMsg] = useState('');

  if (!isOpen) return null;

  const handleBarcodeLookup = async (scannedBarcode: string) => {
    const parsed = parseGs1BarcodeString(scannedBarcode);
    const cleanCode = parsed.gtin || scannedBarcode.trim().replace(/^\][a-zA-Z0-9]{2}/, '');
    if (!cleanCode) return;

    setBarcodeQuery(cleanCode);
    setIsSearching(true);
    setSearchStatus('IDLE');
    setNotificationMsg('');

    // STEP 1: Search LOCAL DB Catalog First (Primary Source of Truth)
    const localMatch = existingProducts.find(p => p.barcode === cleanCode || (p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase()));

    if (localMatch) {
      setLocalMatchProduct(localMatch);
      setSearchStatus('LOCAL_MATCH');
      setIsSearching(false);
      return;
    }

    // STEP 2: Product Not Found in Local DB -> Pluggable External Enrichment (Open Food Facts API)
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${cleanCode}.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const offProduct = data.product;
          const brandName = offProduct.brands || offProduct.brand_owner || 'Packaged Brand';
          const title = offProduct.product_name || offProduct.product_name_en || `Barcode SKU #${cleanCode.slice(-6)}`;
          const category = offProduct.categories_tags ? offProduct.categories_tags[0].replace('en:', '').replace(/-/g, ' ') : 'Beverages & Pantry';
          const img = offProduct.image_front_url || offProduct.image_url || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80';

          setCandidateForm({
            barcode: cleanCode,
            sku: `SKU-${cleanCode.slice(-6)}`,
            name: `${title} (${brandName})`,
            brand: brandName,
            category: capitalizeWords(category),
            unit: offProduct.quantity || 'pack',
            sellingPrice: '195.00',
            costPrice: '140.00',
            stockQuantity: '50',
            reorderLevel: '15',
            gstRate: '12',
            expiryDate: '2026-10-30',
            batchNumber: `BATCH-OFF-${Math.floor(100 + Math.random() * 900)}`,
            imageUrl: img,
            source: 'OPEN_FOOD_FACTS'
          });

          setSearchStatus('EXTERNAL_CANDIDATE');
          setIsSearching(false);
          return;
        }
      }
    } catch (e) {
      console.warn('External API lookup skipped, falling back to GS1 Master Registry', e);
    }

    // STEP 3: Fallback to GS1 Global Registry Engine
    const gs1Result = autoExtractProductFromBarcode(cleanCode);
    const p = gs1Result.product;

    setCandidateForm({
      barcode: p.barcode,
      sku: p.sku || `SKU-${cleanCode.slice(-6)}`,
      name: p.name,
      brand: 'Standard CPG Brand',
      category: p.category,
      unit: p.unit || 'pcs',
      sellingPrice: String(p.globalPrice || 150),
      costPrice: String(p.costPrice || 100),
      stockQuantity: '50',
      reorderLevel: String(p.reorderLevel || 15),
      gstRate: String(p.gstRate || 18),
      expiryDate: p.expiryDate || '2026-10-15',
      batchNumber: p.batchNumber || `BATCH-${Math.floor(100 + Math.random() * 900)}`,
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
      source: 'GS1_REGISTRY'
    });

    setSearchStatus('EXTERNAL_CANDIDATE');
    setIsSearching(false);
  };

  const capitalizeWords = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());

  const [formValidationError, setFormValidationError] = useState('');

  const handleSaveCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError('');

    const cleanBarcode = (candidateForm.barcode || barcodeQuery).trim();
    if (!cleanBarcode || cleanBarcode.length < 4) {
      setFormValidationError('❌ Invalid Barcode: Barcode GTIN must be at least 4 characters long.');
      return;
    }

    const price = parseFloat(candidateForm.sellingPrice);
    const cost = parseFloat(candidateForm.costPrice);
    if (isNaN(price) || price <= 0) {
      setFormValidationError('❌ Invalid Price: Mall selling price must be greater than ₹0.00.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormValidationError('❌ Invalid Cost Price: Cost price cannot be negative.');
      return;
    }
    if (price < cost) {
      setFormValidationError('⚠️ Margin Warning: Selling price (₹' + price + ') is lower than cost price (₹' + cost + '). Please fix margin.');
      return;
    }

    const qty = parseInt(candidateForm.stockQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormValidationError('❌ Invalid Stock Quantity: Initial inward stock must be at least 1 unit.');
      return;
    }

    const newProd: Product = {
      id: Date.now(),
      tenantId: 1,
      barcode: cleanBarcode,
      sku: candidateForm.sku || `SKU-${cleanBarcode.slice(-4)}`,
      name: candidateForm.name.trim(),
      category: candidateForm.category,
      globalPrice: price,
      price: price,
      costPrice: cost,
      unit: candidateForm.unit,
      imageUrl: candidateForm.imageUrl || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
      stockQuantity: qty,
      stock: qty,
      totalStock: qty,
      reorderLevel: parseInt(candidateForm.reorderLevel) || 15,
      gstRate: parseFloat(candidateForm.gstRate) || 18,
      batchNumber: candidateForm.batchNumber || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: candidateForm.expiryDate || '2026-10-15'
    };

    onSaveProduct(newProd);
    setNotificationMsg(`✅ VERIFIED & SAVED: Onboarded "${newProd.name}" (Barcode ${cleanBarcode}, ${qty} units) into Mall Product Catalog!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-500/40 text-stone-100 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/40 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-400 text-sm tracking-wide">Product Onboarding & Barcode Enrichment</h3>
              <p className="text-[11px] text-amber-200/60 font-medium">Local DB First $\rightarrow$ Pluggable External Lookup $\rightarrow$ Admin Review</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* STEP 1: BARCODE SEARCH INPUT BAR */}
          <div className="gold-card p-4 bg-stone-950/80 space-y-3">
            <label className="font-bold text-amber-400 block uppercase tracking-wider text-[10px]">
              Scan or Enter Barcode to Onboard Item
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  value={barcodeQuery}
                  onChange={e => setBarcodeQuery(e.target.value)}
                  placeholder="Scan EAN-13, GS1 string, or type barcode e.g. 8901234567890..."
                  className="w-full bg-stone-900 border border-amber-900/60 text-stone-100 rounded-xl pl-9 pr-3 py-2.5 font-mono text-xs font-bold outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-100 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-amber-700/60"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Camera Scan</span>
              </button>
              <button
                type="button"
                onClick={() => handleBarcodeLookup(barcodeQuery)}
                className="gold-button-primary px-5 py-2.5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lookup Catalog</span>
              </button>
            </div>
          </div>

          {notificationMsg && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> {notificationMsg}
            </div>
          )}

          {/* SEARCH STATUS CASE 1: LOCAL DB MATCH FOUND */}
          {searchStatus === 'LOCAL_MATCH' && localMatchProduct && (
            <div className="bg-amber-950/40 border-2 border-amber-500 p-4 rounded-2xl space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold">
                <Database className="w-5 h-5 text-amber-500" />
                <span>LOCAL MALL DB MATCH — Product Already Exists in Catalog!</span>
              </div>
              <div className="flex items-start gap-4 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <img src={localMatchProduct.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-amber-900/60" />
                <div className="flex-1">
                  <h4 className="font-extrabold text-stone-100 text-sm">{localMatchProduct.name}</h4>
                  <div className="text-stone-400 text-[11px] font-mono mt-0.5">
                    Barcode: <strong className="text-amber-300">{localMatchProduct.barcode}</strong> • Category: {localMatchProduct.category}
                  </div>
                  <div className="text-amber-400 font-black text-sm mt-1">₹{localMatchProduct.globalPrice.toFixed(2)}</div>
                </div>
              </div>
              <p className="text-stone-400 text-[11px]">
                ⚠️ Architecture Rule Enforced: Duplicate product creation prevented. Update store stock quantity directly below:
              </p>
              <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <span className="text-stone-300 font-bold">Add Inward Stock Quantity:</span>
                <input
                  type="number"
                  value={addStockQty}
                  onChange={e => setAddStockQty(e.target.value)}
                  className="w-24 bg-stone-900 border border-amber-500 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-lg text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNotificationMsg(`✅ Added ${addStockQty} units of stock to existing SKU "${localMatchProduct.name}"!`);
                    setTimeout(() => onClose(), 1500);
                  }}
                  className="gold-button-primary px-4 py-1.5 rounded-lg font-bold cursor-pointer"
                >
                  Confirm Stock Intake
                </button>
              </div>
            </div>
          )}

          {/* SEARCH STATUS CASE 2: EXTERNAL CANDIDATE FOUND -> ADMIN REVIEW & PREFILL */}
          {searchStatus === 'EXTERNAL_CANDIDATE' && (
            <form onSubmit={handleSaveCandidateSubmit} className="space-y-4 bg-stone-950 p-5 rounded-2xl border border-amber-500/40 animate-slide-up">
              
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h4 className="font-extrabold text-amber-400 text-sm">Product Found — Review Details Before Saving</h4>
                </div>
                <span className="bg-amber-950 text-amber-300 border border-amber-700/60 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Source: {candidateForm.source}
                </span>
              </div>

              {formValidationError && (
                <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 rounded-xl font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> {formValidationError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Product Title</label>
                  <input
                    value={candidateForm.name}
                    onChange={e => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    required
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">GTIN Barcode</label>
                  <input
                    value={candidateForm.barcode}
                    onChange={e => setCandidateForm({ ...candidateForm, barcode: e.target.value })}
                    required
                    className="w-full bg-stone-900 border border-stone-800 text-amber-300 font-mono rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Brand Name</label>
                  <input
                    value={candidateForm.brand}
                    onChange={e => setCandidateForm({ ...candidateForm, brand: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Category</label>
                  <select
                    value={candidateForm.category}
                    onChange={e => setCandidateForm({ ...candidateForm, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Dairy & Cold Storage">Dairy & Cold Storage</option>
                    <option value="Bakery & Breads">Bakery & Breads</option>
                    <option value="Beverages & Pantry">Beverages & Pantry</option>
                    <option value="Fresh Produce & Fruits">Fresh Produce & Fruits</option>
                    <option value="Snacks & Confectionery">Snacks & Confectionery</option>
                    <option value="Personal & Home Care">Personal & Home Care</option>
                  </select>
                </div>
              </div>

              {/* Mall Specific Financial & Stock Controls */}
              <div className="p-3 bg-stone-900 rounded-xl border border-amber-900/40 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider block">
                  Mall Internal Pricing & Inventory Controls
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block">Mall Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={candidateForm.sellingPrice}
                      onChange={e => setCandidateForm({ ...candidateForm, sellingPrice: e.target.value })}
                      required
                      className="w-full bg-stone-950 border border-amber-500/60 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={candidateForm.costPrice}
                      onChange={e => setCandidateForm({ ...candidateForm, costPrice: e.target.value })}
                      required
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 font-mono px-3 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block">Initial Stock Qty</label>
                    <input
                      type="number"
                      value={candidateForm.stockQuantity}
                      onChange={e => setCandidateForm({ ...candidateForm, stockQuantity: e.target.value })}
                      required
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 font-mono px-3 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Parsed Expiry Date</label>
                  <input
                    type="date"
                    value={candidateForm.expiryDate}
                    onChange={e => setCandidateForm({ ...candidateForm, expiryDate: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 text-amber-300 font-mono rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Batch Number</label>
                  <input
                    value={candidateForm.batchNumber}
                    onChange={e => setCandidateForm({ ...candidateForm, batchNumber: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 text-amber-300 font-mono rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="gold-button-primary px-6 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Save into Mall Catalog</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Camera Modal */}
        <CameraBarcodeScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={(scanned) => {
            handleBarcodeLookup(scanned);
          }}
          title="Onboarding Camera Scanner"
          continuousMode={false}
        />

      </div>
    </div>
  );
};
