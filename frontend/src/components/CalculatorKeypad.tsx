import React from 'react';
import { Delete, Check } from 'lucide-react';

interface Props {
  tendered: string;
  setTendered: (val: string | ((prev: string) => string)) => void;
  totalAmount: number;
  onConfirm: () => void;
}

export const CalculatorKeypad: React.FC<Props> = ({ tendered, setTendered, totalAmount, onConfirm }) => {
  const numTendered = parseFloat(tendered) || 0;
  const changeDue = numTendered - totalAmount;

  const handleNumClick = (val: string) => {
    if (val === '.' && tendered.includes('.')) return;
    setTendered(prev => prev === '0' ? val : prev + val);
  };

  const handleClear = () => {
    setTendered('');
  };

  const handleDelete = () => {
    setTendered(prev => prev.slice(0, -1));
  };

  const handleQuickPreset = (amount: number) => {
    setTendered(amount.toString());
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 select-none shadow-sm animate-fade-in">
      {/* Tendered & Change Display (INR ₹) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Cash Tendered</div>
          <div className="font-tabular-nums text-lg font-bold text-slate-900 mt-0.5">
            ₹{numTendered.toFixed(2)}
          </div>
        </div>

        <div className={`border p-2.5 rounded-lg ${
          changeDue >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Change Due</div>
          <div className={`font-tabular-nums text-lg font-bold mt-0.5 ${
            changeDue >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}>
            ₹{changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Quick Indian Currency Presets (₹100, ₹200, ₹500, ₹2000) */}
      <div className="flex gap-1.5 mb-2">
        {[100, 200, 500, 2000].map((bill) => (
          <button
            key={bill}
            type="button"
            onClick={() => handleQuickPreset(bill)}
            className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg text-xs font-mono text-emerald-700 font-bold transition-all active:scale-95 shadow-2xs"
          >
            ₹{bill}
          </button>
        ))}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'CLR'].map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => {
              if (btn === 'CLR') handleClear();
              else handleNumClick(btn);
            }}
            className="h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-sm text-slate-800 active:scale-95 transition-all shadow-2xs"
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleDelete}
          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={numTendered < totalAmount}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Complete Sale (₹{totalAmount.toFixed(2)})</span>
        </button>
      </div>
    </div>
  );
};
