import { Product } from '../types';

export interface Gs1ParseResult {
  gtin: string;
  batchNumber?: string;
  expiryDate?: string;
  rawParsed: boolean;
}

export interface MasterCatalogEntry {
  barcode: string;
  sku: string;
  name: string;
  category: string;
  globalPrice: number;
  costPrice: number;
  unit: string;
  imageUrl: string;
  defaultShelfLifeDays: number;
  gstRate: number;
}

/**
 * Global GS1 Master Barcode Registry
 * Simulates enterprise CPG database (Open Food Facts / GS1 GTIN Cloud)
 */
export const GS1_GLOBAL_BARCODE_REGISTRY: Record<string, MasterCatalogEntry> = {
  '8901234567890': {
    barcode: '8901234567890',
    sku: 'SKU-AMUL-01',
    name: 'Amul Taaza Toned Milk 1L',
    category: 'Dairy & Cold Storage',
    globalPrice: 68.00,
    costPrice: 55.00,
    unit: 'carton',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 5,
    gstRate: 5
  },
  '8901234567891': {
    barcode: '8901234567891',
    sku: 'SKU-BRIT-02',
    name: 'Britannia Sourdough Bread 500g',
    category: 'Bakery & Breads',
    globalPrice: 110.00,
    costPrice: 80.00,
    unit: 'loaf',
    imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 3,
    gstRate: 5
  },
  '8901234567892': {
    barcode: '8901234567892',
    sku: 'SKU-BLUE-03',
    name: 'Blue Tokai Coffee Beans 1kg',
    category: 'Beverages & Pantry',
    globalPrice: 850.00,
    costPrice: 620.00,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 180,
    gstRate: 18
  },
  '8901234567893': {
    barcode: '8901234567893',
    sku: 'SKU-HIMA-04',
    name: 'Himalayan Natural Mineral Water 6x500ml',
    category: 'Beverages & Pantry',
    globalPrice: 180.00,
    costPrice: 120.00,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 365,
    gstRate: 18
  },
  '8901234567894': {
    barcode: '8901234567894',
    sku: 'SKU-FIGA-05',
    name: 'Figaro Cold Pressed Olive Oil 750ml',
    category: 'Beverages & Pantry',
    globalPrice: 750.00,
    costPrice: 540.00,
    unit: 'bottle',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 240,
    gstRate: 12
  },
  '8901234567895': {
    barcode: '8901234567895',
    sku: 'SKU-EPIG-06',
    name: 'Epigamia Greek Yogurt 500g',
    category: 'Dairy & Cold Storage',
    globalPrice: 95.00,
    costPrice: 68.00,
    unit: 'tub',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 2,
    gstRate: 5
  },
  '8901234567896': {
    barcode: '8901234567896',
    sku: 'SKU-AMUL-07',
    name: 'Amul Pasteurised Butter 500g',
    category: 'Dairy & Cold Storage',
    globalPrice: 275.00,
    costPrice: 220.00,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 45,
    gstRate: 12
  },
  '8901234567897': {
    barcode: '8901234567897',
    sku: 'SKU-MOTH-08',
    name: 'Mother Dairy Fresh Paneer 200g',
    category: 'Dairy & Cold Storage',
    globalPrice: 110.00,
    costPrice: 85.00,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=150&auto=format&fit=crop&q=80',
    defaultShelfLifeDays: 7,
    gstRate: 5
  }
};

const gs1ParseCache = new Map<string, Gs1ParseResult>();

/**
 * Parses GS1-128 Application Identifier Barcode String
 * Example GS1 string: "(01)8901234567891(17)260914(10)BATCH-B11"
 * AI (01): GTIN (14 or 13 digits)
 * AI (17): Expiration Date (YYMMDD) -> 260914 = 2026-09-14
 * AI (10): Batch / Lot Number
 */
export const parseGs1BarcodeString = (rawInput: string): Gs1ParseResult => {
  if (!rawInput) {
    return { gtin: '', rawParsed: false };
  }

  // Clean raw string and strip scanner symbology identifier prefixes like ]C1, ]e0, ]d2, and GS (0x1D) separators
  let clean = rawInput.trim().replace(/^\][a-zA-Z0-9]{2}/, '').replace(/[\u001d\x1d]/g, '');

  if (gs1ParseCache.has(clean)) {
    return gs1ParseCache.get(clean)!;
  }

  let gtin = '';
  let batchNumber: string | undefined;
  let expiryDate: string | undefined;
  let rawParsed = false;

  // 1. GS1 Parenthesis Format: (01)8901234567891(17)260914(10)BATCH-B11
  const gtinMatch = clean.match(/\(01\)(\d{8,14})/);
  const expMatch = clean.match(/\(17\)(\d{6})/);
  const batchMatch = clean.match(/\(10\)([A-Za-z0-9\-_]+)/);

  if (gtinMatch) {
    gtin = gtinMatch[1];
    // Strip leading 0 from 14-digit GTIN-14 to get standard 13-digit EAN
    if (gtin.length === 14 && gtin.startsWith('0')) {
      gtin = gtin.substring(1);
    }
    rawParsed = true;
  } else if (/^01\d{8,14}/.test(clean)) {
    // 2. Raw GS1 string without brackets: 01089012345678901726091410BATCH1 or 018901234567890...
    const rawGtinMatch = clean.match(/^01(\d{13,14})/);
    if (rawGtinMatch) {
      const rawGtin = rawGtinMatch[1];
      gtin = (rawGtin.length === 14 && rawGtin.startsWith('0')) ? rawGtin.substring(1) : rawGtin;
      const remainder = clean.substring(2 + rawGtin.length);
      const rawExpMatch = remainder.match(/17(\d{6})/);
      if (rawExpMatch) {
        const yy = rawExpMatch[1].substring(0, 2);
        const mm = rawExpMatch[1].substring(2, 4);
        const dd = rawExpMatch[1].substring(4, 6);
        expiryDate = `20${yy}-${mm}-${dd}`;
      }
      const rawBatchMatch = remainder.match(/10([A-Za-z0-9\-_]+)/);
      if (rawBatchMatch) {
        batchNumber = rawBatchMatch[1];
      }
      rawParsed = true;
    }
  } else {
    // 3. Plain EAN-13, EAN-8, UPC-A, UPC-E or Alphanumeric Barcode
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length === 14 && digitsOnly.startsWith('0')) {
      gtin = digitsOnly.substring(1);
    } else if (digitsOnly.length >= 8 && digitsOnly.length <= 13) {
      gtin = digitsOnly;
    } else {
      gtin = clean;
    }
  }

  // Parse Expiry Date from AI (17) -> YYMMDD if found
  if (expMatch && !expiryDate) {
    const yy = expMatch[1].substring(0, 2);
    const mm = expMatch[1].substring(2, 4);
    const dd = expMatch[1].substring(4, 6);
    expiryDate = `20${yy}-${mm}-${dd}`;
    rawParsed = true;
  }

  // Parse Batch Number from AI (10) if found
  if (batchMatch && !batchNumber) {
    batchNumber = batchMatch[1];
    rawParsed = true;
  }

  const result: Gs1ParseResult = { gtin, batchNumber, expiryDate, rawParsed };
  gs1ParseCache.set(clean, result);
  return result;
};

/**
 * 0-Manual Auto-Intake Engine:
 * Converts raw barcode input into a fully populated Product object with 0 typing required!
 */
export const autoExtractProductFromBarcode = (rawInput: string, tenantId: number = 1): { product: Product; isAutoCataloged: boolean; message: string } => {
  const parsed = parseGs1BarcodeString(rawInput);
  const targetGtin = parsed.gtin || rawInput.trim();

  // 1. Query Master GS1 Registry
  const masterEntry = GS1_GLOBAL_BARCODE_REGISTRY[targetGtin];

  if (masterEntry) {
    let finalExpiry = parsed.expiryDate;
    if (!finalExpiry) {
      const today = new Date();
      today.setDate(today.getDate() + masterEntry.defaultShelfLifeDays);
      finalExpiry = today.toISOString().split('T')[0];
    }

    const finalBatch = parsed.batchNumber || `BATCH-${Math.floor(100 + Math.random() * 900)}`;

    const autoProduct: Product = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tenantId: tenantId,
      barcode: targetGtin,
      sku: masterEntry.sku,
      name: masterEntry.name,
      category: masterEntry.category,
      globalPrice: masterEntry.globalPrice,
      price: masterEntry.globalPrice,
      costPrice: masterEntry.costPrice,
      unit: masterEntry.unit,
      imageUrl: masterEntry.imageUrl,
      stockQuantity: 50,
      stock: 50,
      totalStock: 50,
      reorderLevel: 20,
      gstRate: masterEntry.gstRate,
      batchNumber: finalBatch,
      expiryDate: finalExpiry
    };

    return {
      product: autoProduct,
      isAutoCataloged: true,
      message: `✨ ZERO-MANUAL AUTO INTAKE SUCCESS: Auto-cataloged "${masterEntry.name}" (Barcode #${targetGtin}, Batch ${finalBatch}, Expiry: ${finalExpiry}) from GS1 Master Registry!`
    };
  }

  // 2. Generic Auto-Generation for Unrecognized Barcodes
  const today = new Date();
  today.setDate(today.getDate() + 30); // 30-day default shelf life
  const genericExpiry = parsed.expiryDate || today.toISOString().split('T')[0];
  const genericBatch = parsed.batchNumber || `BATCH-INWARD-${Math.floor(100 + Math.random() * 900)}`;

  const genericProduct: Product = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    tenantId: tenantId,
    barcode: targetGtin,
    sku: `SKU-${targetGtin.slice(-6)}`,
    name: `Inward Product SKU #${targetGtin}`,
    category: 'Beverages & Pantry',
    globalPrice: 150.00,
    price: 150.00,
    costPrice: 100.00,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80',
    stockQuantity: 50,
    stock: 50,
    totalStock: 50,
    reorderLevel: 15,
    gstRate: 18,
    batchNumber: genericBatch,
    expiryDate: genericExpiry
  };

  return {
    product: genericProduct,
    isAutoCataloged: true,
    message: `⚡ GS1 AUTO-GENERATED: Inward SKU #${targetGtin} with Batch ${genericBatch} and Expiry ${genericExpiry}!`
  };
};
