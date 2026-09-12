import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Delete, AlertCircle } from 'lucide-react';

export const QuickPinModal: React.FC = () => {
  const { isPinLocked, setPinLocked, user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isPinLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (inputPin: string) => {
    const validPin = user?.pinCode || '1234';
    if (inputPin === validPin || inputPin === '1234') {
      setPinLocked(false);
      setPin('');
      setError('');
    } else {
      setError('Invalid station PIN code. Default: 1234.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm text-center shadow-2xl">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock className="w-6 h-6" />
        </div>
        
        <h2 className="text-base font-bold text-slate-900">Cashier Terminal Locked</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Assigned to <span className="text-slate-900 font-semibold">{user?.name || 'Priya Patel'}</span>. Enter 4-digit PIN:
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-10 h-12 rounded-lg border flex items-center justify-center text-xl font-mono font-bold transition-all ${
                pin.length > idx
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs scale-105'
                  : 'bg-slate-50 border-slate-200 text-transparent'
              }`}
            >
              •
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs mb-4 bg-rose-50 py-1.5 rounded-lg border border-rose-200 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n)}
              className="h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-lg font-bold font-mono text-slate-800 active:scale-95 transition-all shadow-2xs"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-500 active:scale-95 transition-all"
          >
            CLR
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-lg font-bold font-mono text-slate-800 active:scale-95 transition-all shadow-2xs"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 active:scale-95 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          Default Demo PIN: <span className="text-emerald-700 font-bold">1234</span>
        </div>
      </div>
    </div>
  );
};
