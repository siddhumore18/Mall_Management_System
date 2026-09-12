export type ExpiryStatus = 'EXPIRED' | 'NEAR_EXPIRY' | 'ROTATION_WARNING' | 'HEALTHY';

export interface ExpiryInfo {
  daysRemaining: number;
  status: ExpiryStatus;
  discountPercentage: number;
  badgeLabel: string;
  badgeClass: string;
}

const SYSTEM_TODAY_TIME = new Date('2026-09-11').getTime();
const fefoCache = new Map<string, ExpiryInfo>();

/**
 * Calculates exact days remaining until expiry from an ISO or date string (YYYY-MM-DD)
 */
export const getDaysUntilExpiry = (expiryDateStr?: string): number => {
  if (!expiryDateStr) return 999;
  try {
    const expiryTime = new Date(expiryDateStr).getTime();
    const diffTime = expiryTime - SYSTEM_TODAY_TIME;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 999;
  }
};

/**
 * Determines FEFO Status classification
 */
export const getExpiryStatus = (expiryDateStr?: string): ExpiryStatus => {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days <= 0) return 'EXPIRED';
  if (days <= 7) return 'NEAR_EXPIRY';
  if (days <= 30) return 'ROTATION_WARNING';
  return 'HEALTHY';
};

/**
 * Calculates FEFO Clearance discount percentage
 */
export const getClearanceDiscount = (expiryDateStr?: string): number => {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days <= 0) return 0; // Expired items are blocked from sale
  if (days <= 3) return 50; // 50% OFF for 1-3 days left
  if (days <= 7) return 30; // 30% OFF for 4-7 days left
  if (days <= 14) return 15; // 15% OFF for 8-14 days left
  return 0;
};

/**
 * Computes clearance price after discount
 */
export const getClearancePrice = (originalPrice: number, expiryDateStr?: string): number => {
  const discount = getClearanceDiscount(expiryDateStr);
  if (discount === 0) return originalPrice;
  return Number((originalPrice * (1 - discount / 100)).toFixed(2));
};

/**
 * Generates full FEFO Expiry metadata with memoization cache
 */
export const getExpiryInfo = (expiryDateStr?: string): ExpiryInfo => {
  const key = expiryDateStr || 'DEFAULT_HEALTHY';
  if (fefoCache.has(key)) {
    return fefoCache.get(key)!;
  }

  const days = getDaysUntilExpiry(expiryDateStr);
  const status = getExpiryStatus(expiryDateStr);
  const discount = getClearanceDiscount(expiryDateStr);

  let result: ExpiryInfo;

  if (status === 'EXPIRED') {
    result = {
      daysRemaining: days,
      status,
      discountPercentage: 0,
      badgeLabel: `EXPIRED (${Math.abs(days)}d ago)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black'
    };
  } else if (status === 'NEAR_EXPIRY') {
    result = {
      daysRemaining: days,
      status,
      discountPercentage: discount,
      badgeLabel: `FEFO ${discount}% OFF (${days}d left)`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse'
    };
  } else if (status === 'ROTATION_WARNING') {
    result = {
      daysRemaining: days,
      status,
      discountPercentage: discount,
      badgeLabel: `FEFO Rotation (${days}d left)`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
    };
  } else {
    result = {
      daysRemaining: days,
      status,
      discountPercentage: 0,
      badgeLabel: `Healthy (${days}d)`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };
  }

  fefoCache.set(key, result);
  return result;
};
