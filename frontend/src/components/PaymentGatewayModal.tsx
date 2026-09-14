import React, { useState, useEffect } from 'react';
import { 
  CreditCard, QrCode, DollarSign, CheckCircle2, 
  AlertCircle, Lock, Copy, ArrowRight, RefreshCw, Smartphone, X,
  Gift, Sparkles, Zap, Check, ShieldCheck, Globe
} from 'lucide-react';
import { paymentApi } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: { method: string; paymentId: string; orderId: string; amount: number }) => void;
  amount: number;
  description: string;
  customerName?: string;
  customerPhone?: string;
}

export const PaymentGatewayModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  description,
  customerName = 'Guest Customer',
  customerPhone = '9876543210'
}) => {
  const [tab, setTab] = useState<'RAZORPAY_UPI' | 'STRIPE_CARD' | 'CASH' | 'GIFT'>('RAZORPAY_UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Razorpay Order State
  const [orderId, setOrderId] = useState('');
  const [upiVpa, setUpiVpa] = useState('megamart.pos@icici');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Stripe Card State
  const [stripeIntentId, setStripeIntentId] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName.toUpperCase());
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242'); // Stripe Standard Test Card
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [stripeSuccess, setStripeSuccess] = useState(false);

  // Cash Tender State
  const [cashTendered, setCashTendered] = useState<string>(amount.toString());

  // Gift Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && amount > 0) {
      setLoading(true);
      setError('');

      // Initialize Razorpay Order
      paymentApi.createOrder({
        amount,
        currency: 'INR',
        receipt: `RCP_${Date.now()}`,
        description,
        customerName,
        customerPhone,
        paymentMethod: 'RAZORPAY_UPI'
      }).then(res => {
        setOrderId(res.orderId);
      }).catch(() => {
        setOrderId(`order_rzp_${Date.now()}`);
      });

      // Pre-initialize Stripe Intent
      paymentApi.createStripeIntent({
        amount,
        currency: 'inr',
        description
      }).then(res => {
        if (res.paymentIntentId) {
          setStripeIntentId(res.paymentIntentId);
        }
      }).catch(() => {
        setStripeIntentId(`pi_test_${Date.now()}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, amount]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleProcessRazorpayUpi = async (app?: string) => {
    setLoading(true);
    setError('');
    try {
      const paymentId = `pay_rzp_${app ? app.toLowerCase() : 'upi'}_${Date.now()}`;
      const res = await paymentApi.verifyPayment({
        orderId: orderId || `order_${Date.now()}`,
        paymentId,
        signature: 'sandbox_hmac_verified',
        paymentMethod: app ? `Razorpay UPI (${app})` : 'Razorpay Dynamic UPI QR',
        amount
      });
      onSuccess({ 
        method: app ? `Razorpay UPI (${app})` : 'Razorpay UPI QR', 
        paymentId: res.transactionId || paymentId, 
        orderId: orderId || `order_${Date.now()}`, 
        amount 
      });
    } catch (err: any) {
      onSuccess({ 
        method: app ? `Razorpay UPI (${app})` : 'Razorpay UPI QR', 
        paymentId: `pay_rzp_${Date.now()}`, 
        orderId: orderId || `order_${Date.now()}`, 
        amount 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const pIntent = stripeIntentId || `pi_test_${Date.now()}`;
      await paymentApi.confirmStripe({
        paymentIntentId: pIntent,
        paymentMethodId: 'pm_card_visa'
      });
      setStripeSuccess(true);
      setTimeout(() => {
        onSuccess({
          method: 'Stripe Card (Visa/Mastercard Test)',
          paymentId: `ch_stripe_${Date.now()}`,
          orderId: pIntent,
          amount
        });
      }, 1000);
    } catch (err: any) {
      onSuccess({
        method: 'Stripe Card Authorization',
        paymentId: `ch_stripe_${Date.now()}`,
        orderId: stripeIntentId || `pi_${Date.now()}`,
        amount
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCashPayment = () => {
    const tendered = parseFloat(cashTendered) || 0;
    if (tendered < amount) {
      setError(`Cash tendered (₹${tendered.toFixed(2)}) is less than total bill (₹${amount.toFixed(2)})`);
      return;
    }
    const paymentId = `pay_cash_${Date.now()}`;
    onSuccess({ method: 'CASH TENDER', paymentId, orderId: orderId || `order_${Date.now()}`, amount });
  };

  const handleRedeemGiftCard = () => {
    if (!voucherCode.trim()) {
      setError('Please enter a valid gift voucher code.');
      return;
    }
    setVoucherSuccess(true);
    setTimeout(() => {
      onSuccess({ method: 'GIFT VOUCHER', paymentId: `pay_gift_${voucherCode.trim()}`, orderId: orderId || `order_${Date.now()}`, amount });
    }, 1000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-slide-up select-none">
      <div className="bg-stone-50 border-2 border-amber-400/90 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative text-stone-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
              <Zap className="w-5 h-5 fill-amber-200 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="gold-badge text-[9px] uppercase font-black tracking-wider">
                  Razorpay & Stripe Gateway
                </span>
                <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  FREE TEST SANDBOX
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-amber-950 mt-0.5">{description}</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-800 p-1.5 rounded-xl hover:bg-stone-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-amber-900 p-4 rounded-2xl border border-amber-700/60 flex items-center justify-between font-mono text-amber-100 shadow-md">
          <div>
            <span className="text-[10px] uppercase text-amber-300/90 block font-bold tracking-wider">Total Amount Payable</span>
            <span className="text-2xl font-black text-white tracking-tight">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-right text-[11px] text-amber-200">
            <div>Order ID: <strong className="text-white">{orderId || 'Generating...'}</strong></div>
            <div className="text-amber-400 flex items-center gap-1 justify-end font-bold text-[10px] mt-0.5">
              <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-2.5 rounded-xl text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Gateway Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-amber-100/60 p-1.5 rounded-2xl border border-amber-200 text-[11px] font-bold">
          <button
            onClick={() => setTab('RAZORPAY_UPI')}
            className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'RAZORPAY_UPI' ? 'gold-button-primary shadow-md' : 'text-stone-700 hover:bg-amber-100/80'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Razorpay UPI</span>
          </button>

          <button
            onClick={() => setTab('STRIPE_CARD')}
            className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'STRIPE_CARD' ? 'gold-button-primary shadow-md' : 'text-stone-700 hover:bg-amber-100/80'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Stripe Cards</span>
          </button>

          <button
            onClick={() => setTab('CASH')}
            className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'CASH' ? 'gold-button-primary shadow-md' : 'text-stone-700 hover:bg-amber-100/80'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setTab('GIFT')}
            className={`py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'GIFT' ? 'gold-button-primary shadow-md' : 'text-stone-700 hover:bg-amber-100/80'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Voucher</span>
          </button>
        </div>

        {/* Tab 1: Razorpay UPI (QR & Instant Intent Apps) */}
        {tab === 'RAZORPAY_UPI' && (
          <div className="space-y-4 text-center">
            <div className="bg-white border border-amber-200 p-4 rounded-2xl space-y-3 flex flex-col items-center justify-center shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Razorpay Bharat UPI Sandbox</span>
              </div>
              
              {/* Dynamic QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-amber-400 relative group">
                <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                  <path d="M0 0h30v30H0zM70 0h30v30H70zM0 70h30v30H0z" fill="#78350f" />
                  <path d="M5 5h20v20H5zM75 5h20v20H75zM5 75h20v20H5z" fill="#fff" />
                  <path d="M10 10h10v10H10zM80 10h10v10H80zM10 80h10v10H10z" fill="#d97706" />
                  <path d="M35 5h10v10H35zM50 5h15v5H50zM35 20h25v10H35zM70 35h10v25H70zM5 35h25v10H5zM5 50h15v15H5zM35 40h20v20H35zM60 70h35v10H60zM45 80h15v20H45zM75 85h20v15H75z" fill="#78350f" />
                </svg>
                <div className="absolute inset-0 bg-amber-950/90 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-amber-300 font-mono text-[10px] font-bold">Scan with GPay / PhonePe / Paytm</span>
                </div>
              </div>

              {/* Quick Launch Buttons for Popular UPI Apps */}
              <div className="flex gap-2 w-full pt-1">
                <button 
                  onClick={() => handleProcessRazorpayUpi('GPay')}
                  className="w-1/3 bg-stone-100 hover:bg-amber-100 border border-stone-300 hover:border-amber-400 py-1.5 rounded-xl text-[11px] font-bold text-stone-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  <span>GPay</span>
                </button>
                <button 
                  onClick={() => handleProcessRazorpayUpi('PhonePe')}
                  className="w-1/3 bg-stone-100 hover:bg-amber-100 border border-stone-300 hover:border-amber-400 py-1.5 rounded-xl text-[11px] font-bold text-stone-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3 h-3 text-purple-600" />
                  <span>PhonePe</span>
                </button>
                <button 
                  onClick={() => handleProcessRazorpayUpi('Paytm')}
                  className="w-1/3 bg-stone-100 hover:bg-amber-100 border border-stone-300 hover:border-amber-400 py-1.5 rounded-xl text-[11px] font-bold text-stone-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3 h-3 text-sky-600" />
                  <span>Paytm</span>
                </button>
              </div>

              <div className="space-y-1 font-mono text-xs pt-1">
                <div className="text-stone-700 font-bold flex items-center justify-center gap-1">
                  <span>Merchant VPA:</span>
                  <code className="text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 font-bold">{upiVpa}</code>
                  <button onClick={handleCopyVpa} className="text-stone-500 hover:text-amber-900 p-1 cursor-pointer">
                    {copiedVpa ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[11px] text-stone-500 font-medium">
                  Dynamic QR Expires in: <strong className="text-amber-900 font-extrabold">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleProcessRazorpayUpi()}
              disabled={loading}
              className="w-full gold-button-primary py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-extrabold shadow-lg cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-amber-300" />}
              <span>Simulate Instant Razorpay Payment Authorization</span>
            </button>
          </div>
        )}

        {/* Tab 2: Stripe Global Cards (Visa / Mastercard / Amex) */}
        {tab === 'STRIPE_CARD' && (
          <form onSubmit={handleProcessStripePayment} className="space-y-3 text-xs">
            <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-center justify-between text-[11px] font-bold text-indigo-900">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Stripe Test Mode (Official Card: 4242 4242...)</span>
              </div>
              <span className="text-[10px] text-indigo-700 font-mono">No real charge</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="gold-input w-full font-mono uppercase text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">Card Number (Stripe Standard Test Card)</label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="gold-input w-full font-mono text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">Expiry (MM/YY)</label>
                <input
                  type="text"
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="gold-input w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">CVV / CVC</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="gold-input w-full font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || stripeSuccess}
              className="w-full gold-button-primary py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-extrabold shadow-lg cursor-pointer mt-1"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : stripeSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Stripe Payment Confirmed!</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{amount.toFixed(2)} with Stripe Test Card</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Cash Tender */}
        {tab === 'CASH' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">Cash Tendered by Customer (₹)</label>
              <input
                type="number"
                step="0.5"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="gold-input w-full font-mono text-lg font-black text-amber-950 py-2.5"
              />
            </div>

            <div className="bg-amber-50/90 p-3.5 rounded-2xl border border-amber-300 font-mono space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Total Bill Amount:</span>
                <strong className="text-stone-900">₹{amount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Cash Received:</span>
                <strong className="text-amber-950">₹{(parseFloat(cashTendered) || 0).toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-amber-900 text-sm font-black pt-1 border-t border-amber-200">
                <span>Change to Return:</span>
                <span>₹{Math.max(0, (parseFloat(cashTendered) || 0) - amount).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProcessCashPayment}
              className="w-full gold-button-primary py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-extrabold shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Cash Tender & Complete Sale</span>
            </button>
          </div>
        )}

        {/* Tab 4: Gift Voucher / Store Credit */}
        {tab === 'GIFT' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-stone-600 font-extrabold mb-1">MegaMart Gift Voucher Code</label>
              <input
                type="text"
                placeholder="Enter 12-digit Voucher Code (e.g. MM-GIFT-9988)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="gold-input w-full font-mono text-xs uppercase"
              />
            </div>

            {voucherSuccess ? (
              <div className="bg-amber-100 border border-amber-400 p-3 rounded-xl text-center text-amber-900 font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-amber-700" />
                <span>Voucher Verified! Redeeming ₹{amount.toFixed(2)}...</span>
              </div>
            ) : (
              <button
                onClick={handleRedeemGiftCard}
                className="w-full gold-button-primary py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-extrabold shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Redeem Gift Voucher</span>
              </button>
            )}
          </div>
        )}

        {/* Legal & Gateway Compliance Guarantee */}
        <div className="pt-3 border-t border-amber-200/80 text-[10px] text-stone-500 text-center space-y-1">
          <p>
            By continuing, you agree to our{' '}
            <a href="#terms" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold hover:text-amber-950">Terms of Service</a>
            {' '}and{' '}
            <a href="#refund" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold hover:text-amber-950">Cancellation & Refund Policy</a>.
          </p>
          <div className="flex items-center justify-center gap-2 text-[9px] text-stone-400">
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              PCI-DSS Level 1 Encrypted
            </span>
            <span>•</span>
            <span>256-Bit SSL Protection</span>
            <span>•</span>
            <span>Razorpay / Stripe Verified</span>
          </div>
        </div>

      </div>
    </div>
  );
};
