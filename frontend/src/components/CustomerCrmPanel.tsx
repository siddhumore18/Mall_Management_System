import React, { useState } from 'react';
import { customerApi } from '../services/api';
import { usePosStore } from '../store/usePosStore';
import { Customer } from '../types';
import { Search, UserCheck, UserPlus, Phone, Award, History, Clock, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerCrmPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activeCustomer, setActiveCustomer, customersList, addCustomerToStore } = usePosStore();
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const customer = await customerApi.lookupByPhone(phoneInput);
      if (customer) {
        setActiveCustomer(customer);
        setNotFound(false);
        setLoading(false);
        return;
      }
    } catch (err) {}

    const foundInStore = customersList.find(c => c.phoneNumber.includes(phoneInput) || c.name.toLowerCase().includes(phoneInput.toLowerCase()));
    if (foundInStore) {
      setActiveCustomer(foundInStore);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleCreateCustomer = async () => {
    if (!phoneInput.trim()) return;
    let newCust: Customer = {
      id: Date.now(),
      phoneNumber: phoneInput.trim(),
      name: nameInput.trim() || 'Valued Customer',
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
    setActiveCustomer(newCust);
    setNotFound(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col p-4 select-none animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Omnichannel CRM Lookup</h3>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Phone Lookup Input */}
      <form onSubmit={handleLookup} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Phone (+91 9876543210)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find</span>
        </button>
      </form>

      {/* Customer Profile Card */}
      {activeCustomer ? (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">{activeCustomer.name}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{activeCustomer.phoneNumber}</p>
            </div>
            <button
              onClick={() => setActiveCustomer(null)}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline"
            >
              Detach
            </button>
          </div>

          {/* CRM Key Metrics (INR ₹) */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span>Loyalty Pts</span>
              </div>
              <div className="font-tabular-nums text-sm font-bold text-amber-600 mt-0.5">
                {activeCustomer.loyaltyPoints} <span className="text-[10px] font-normal text-slate-500">pts</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Lifetime Spend</div>
              <div className="font-tabular-nums text-sm font-bold text-emerald-600 mt-0.5">
                ₹{(activeCustomer.lifetimeValue || activeCustomer.totalSpent || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Omnichannel History Timeline */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mb-2">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Purchase Timeline</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                <div className="flex justify-between text-slate-900 font-semibold">
                  <span>Mumbai Flagship (#ST-101)</span>
                  <span className="font-mono text-emerald-600 font-bold">₹986.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Taaza Milk x2, Blue Tokai Coffee 1kg</span>
                  <span>Today 14:20</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                <div className="flex justify-between text-slate-900 font-semibold">
                  <span>Bengaluru Hypermarket (#ST-102)</span>
                  <span className="font-mono text-emerald-600 font-bold">₹750.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Figaro Olive Oil 750ml</span>
                  <span>3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : notFound ? (
        <div className="mt-4 bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
          <div className="text-xs text-amber-800 font-bold flex items-center gap-1 mb-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Profile Not Found</span>
          </div>
          <p className="text-[11px] text-slate-600 mb-3">
            No record for <span className="font-mono text-slate-900 font-semibold">{phoneInput}</span>. Create new customer profile:
          </p>
          <input
            type="text"
            placeholder="Full Name (e.g. Aarav Sharma)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 mb-3 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleCreateCustomer}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-1.5 rounded-lg transition-colors shadow-xs"
          >
            Attach & Save Profile
          </button>
        </div>
      ) : (
        <div className="mt-12 text-center text-xs text-slate-400">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p>Enter phone number to attach purchase history or earn loyalty points on this transaction.</p>
        </div>
      )}
    </div>
  );
};
