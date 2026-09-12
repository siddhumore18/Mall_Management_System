import React, { useState } from 'react';
import { useNavStore } from '../store/useNavStore';
import { useRetailStore } from '../store/useRetailStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { AreaLineChartWidget, BarChartWidget } from '../components/AnalyticsCharts';
import { CustomerDirectoryView } from '../components/CustomerDirectoryView';
import {
  Plus, Users, Boxes, AlertTriangle, ArrowUpRight, Clock, Key,
  TrendingUp, ShoppingBag, Send, Activity, UserCheck, DollarSign,
  CheckCircle2, Eye, BarChart3, ShieldAlert, Shield, Lock, RefreshCw, FileText, Printer, Search, Trash2, X
} from 'lucide-react';

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  pin: string;
  status: 'ON POS' | 'AT DESK' | 'AUDITING' | 'OFF DUTY' | 'ON BREAK';
  shift: 'Morning' | 'Evening' | 'Night';
}

export const StoreManagerPage: React.FC = () => {
  const { activeNavItem } = useNavStore();
  const { products, updateStockQuantity, outlets } = useRetailStore();
  const { addNotification } = useNotificationStore();
  const [msg, setMsg] = useState('');

  // Staff Roster State
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: 1, name: 'Priya Patel', role: 'CASHIER', email: 'cashier@megamart.com', pin: '1234', status: 'ON POS', shift: 'Morning' },
    { id: 2, name: 'Neha Gupta', role: 'CUSTOMER_SERVICE', email: 'cs@megamart.com', pin: '5678', status: 'AT DESK', shift: 'Morning' },
    { id: 3, name: 'Suresh Kumar', role: 'INVENTORY_CLERK', email: 'clerk@megamart.com', pin: '9012', status: 'AUDITING', shift: 'Morning' },
    { id: 4, name: 'Rahul Mehta', role: 'CASHIER', email: 'cashier2@megamart.com', pin: '3456', status: 'OFF DUTY', shift: 'Evening' },
  ]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [generatedPin, setGeneratedPin] = useState('');

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CASHIER');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffShift, setNewStaffShift] = useState<'Morning' | 'Evening' | 'Night'>('Morning');

  // Emergency PO State
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poItemName, setPoItemName] = useState('Britannia Sourdough Bread 500g');
  const [poQtyCartons, setPoQtyCartons] = useState('10');

  const [inventorySearch, setInventorySearch] = useState('');

  // Loss Prevention Incidents
  const [incidents, setIncidents] = useState([
    { id: 'INC-401', register: 'Register #1', cashier: 'Priya Patel', type: 'HIGH_VALUE_REFUND', amount: 850, time: '14:20 PM', status: 'APPROVED' },
    { id: 'INC-402', register: 'Register #2', cashier: 'Rahul Mehta', type: 'VOIDED_CART_ITEM', amount: 110, time: '11:15 AM', status: 'AUDITED' },
  ]);

  const handleResetPin = (staff: StaffMember) => {
    setSelectedStaff(staff);
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(newPin);
    setIsPinModalOpen(true);
  };

  const handleSavePin = () => {
    if (selectedStaff) {
      setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, pin: generatedPin } : s));
      setIsPinModalOpen(false);
      addNotification({
        type: 'PIN_OVERRIDE',
        title: 'Security PIN Override Alert',
        message: `Store Manager reset security PIN for ${selectedStaff.name} (${selectedStaff.role}) to ${generatedPin}`,
        sender: 'Store Manager',
        targetRole: 'TENANT_ADMIN',
      });
      setMsg(`New PIN assigned to ${selectedStaff.name} & audit notification dispatched!`);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    const newStaff: StaffMember = {
      id: Date.now(),
      name: newStaffName.trim(),
      role: newStaffRole,
      email: newStaffEmail.trim(),
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'OFF DUTY',
      shift: newStaffShift
    };
    setStaffList(prev => [...prev, newStaff]);
    setIsAddStaffOpen(false);
    setNewStaffName(''); setNewStaffEmail('');
    setMsg(`Staff member ${newStaff.name} added to ${newStaff.shift} shift!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleSendPo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPoModalOpen(false);
    addNotification({
      type: 'SYSTEM_ALERT',
      title: 'Emergency PO Dispatch',
      message: `Emergency Purchase Order for ${poQtyCartons} cartons of ${poItemName} transmitted to Warehouse.`,
      sender: 'Store Manager',
      targetRole: 'INVENTORY_CLERK',
    });
    setMsg(`Emergency PO transmitted to Warehouse for ${poQtyCartons} cartons of ${poItemName}!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleStockUpdate = (id: number, delta: number) => {
    const currentProd = products.find(p => p.id === id);
    if (currentProd) {
      const curQty = currentProd.stockQuantity ?? currentProd.stock ?? 0;
      updateStockQuantity(id, Math.max(0, curQty + delta));
    }
  };

  const handleExportReport = (title: string) => {
    const csvContent = "Item,Stock,Price,ReorderThreshold\nAmul Milk,85,68.00,30\nBritannia Bread,12,110.00,25";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MegaMart_${title}_${Date.now()}.csv`; a.click();
    setMsg(`${title} report exported!`); setTimeout(() => setMsg(''), 3500);
  };

  // ─── SUB-VIEW 1: STORE HEALTH ───
  const renderHealth = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Today's Store Sales</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-950 font-mono">₹3,12,450.00</div>
          <div className="text-[11px] text-emerald-700 font-bold">100% Register Capacity</div>
        </div>
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Active Shift Staff</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-950 font-mono">3 / 4 On Duty</div>
          <div className="text-[11px] text-stone-500">Morning Shift Roster</div>
        </div>
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">POS Register Uptime</span>
          <div className="font-tabular-nums text-3xl font-black text-amber-950 font-mono">4 Registers</div>
          <div className="text-[11px] text-emerald-700 font-bold">Zero Gateway Latency</div>
        </div>
        <div className="gold-card p-5 space-y-1">
          <span className="text-xs font-semibold uppercase text-stone-500">Low Stock Reorders</span>
          <div className="font-tabular-nums text-3xl font-black text-rose-700 font-mono">1 SKU Alert</div>
          <div className="text-[11px] text-rose-600 font-bold">Britannia Bread &lt; 15 units</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AreaLineChartWidget
            title="Hourly Outlet Sales Velocity (Branch #ST-101)"
            subtitle="Real-time checkout register throughput"
            points={[12000, 24500, 48100, 72400, 98100, 142000]}
            labels={['09 AM', '11 AM', '01 PM', '03 PM', '05 PM', '07 PM']}
            valuePrefix="₹"
          />
        </div>
        <div className="lg:col-span-4">
          <div className="gold-card p-5 space-y-3">
            <h3 className="font-extrabold text-amber-950 text-sm">Active Checkout Registers</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900">Register #1 (Express)</div>
                  <div className="text-[10px] text-stone-500">Cashier: Priya Patel</div>
                </div>
                <span className="badge-emerald">ACTIVE</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900">Register #2 (Hyper)</div>
                  <div className="text-[10px] text-stone-500">Cashier: Self-Checkout</div>
                </div>
                <span className="badge-emerald">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 2: STAFF ROSTER ───
  const renderStaff = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Branch Staff Roster & Security PINs</h2>
          <p className="text-xs text-stone-500">Manage store employees, shift assignments, and PIN security credentials.</p>
        </div>
        <button onClick={() => setIsAddStaffOpen(true)} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Staff Name</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">Shift</th>
              <th className="p-3">Security PIN</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {staffList.map(s => (
              <tr key={s.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-bold text-amber-950">{s.name}</td>
                <td className="p-3"><span className="gold-badge">{s.role}</span></td>
                <td className="p-3 font-semibold text-stone-700">{s.shift} Shift</td>
                <td className="p-3 font-mono font-bold text-amber-900">•••• ({s.pin})</td>
                <td className="p-3 text-center"><span className="badge-emerald">{s.status}</span></td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleResetPin(s)}
                    className="gold-btn-secondary text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Reset Security PIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── SUB-VIEW 3: LOCAL INVENTORY ───
  const renderInventory = () => {
    const filteredInv = products.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (i.sku || '').toLowerCase().includes(inventorySearch.toLowerCase()));

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-extrabold text-amber-950 text-base">Local Store Inventory & Stock Balances</h2>
            <p className="text-xs text-stone-500">Monitor local shelf stock quantities and trigger emergency reorders.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExportReport('Local_Inventory')} className="gold-btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Export Stock Report
            </button>
            <button onClick={() => setIsPoModalOpen(true)} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
              <Send className="w-3.5 h-3.5" />
              <span>Emergency PO Reorder</span>
            </button>
          </div>
        </div>

        <div className="gold-card p-3 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-stone-400 ml-2" />
          <input
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            placeholder="Search stock item by name or SKU..."
            className="gold-input flex-1 py-1.5 text-xs font-mono"
          />
        </div>

        <div className="gold-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Item Name</th>
                <th className="p-3 text-right">Retail Price (₹)</th>
                <th className="p-3 text-right">Shelf Stock</th>
                <th className="p-3 text-center">Alert Status</th>
                <th className="p-3 text-center">Quick Stock Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {filteredInv.map(item => {
                const itemStock = item.stockQuantity ?? item.stock ?? 0;
                const itemPrice = item.price ?? item.globalPrice ?? 0;
                return (
                  <tr key={item.id} className="hover:bg-amber-50/40">
                    <td className="p-3 font-mono font-bold text-amber-900">{item.sku || `SKU-${item.id}`}</td>
                    <td className="p-3 font-bold text-stone-900">{item.name}</td>
                    <td className="p-3 text-right font-mono font-black text-amber-950">₹{itemPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold">{itemStock} {item.unit || 'pcs'}</td>
                    <td className="p-3 text-center">
                      {itemStock <= (item.reorderLevel || 20) ? (
                        <span className="badge-rose flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> LOW STOCK</span>
                      ) : (
                        <span className="badge-emerald">HEALTHY</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleStockUpdate(item.id, -1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold flex items-center justify-center cursor-pointer">-</button>
                        <button onClick={() => handleStockUpdate(item.id, 1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold flex items-center justify-center cursor-pointer">+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── SUB-VIEW 4: SHIFT BALANCING ───
  const renderShifts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Shift Cash Drawer Balancing</h2>
          <p className="text-xs text-stone-500">Cross-verify cashier shift open/close cash counts before drawer handovers.</p>
        </div>
      </div>

      <div className="gold-card p-6 max-w-xl space-y-4 font-mono text-xs">
        <div className="flex justify-between border-b border-amber-200 pb-2.5 font-bold text-amber-950 text-sm">
          <span>Morning Shift Cash Drawer #1</span>
          <span className="gold-badge">OPEN</span>
        </div>
        <div className="space-y-2 text-stone-700">
          <div className="flex justify-between"><span>Opening Float:</span> <span>₹2,000.00</span></div>
          <div className="flex justify-between"><span>System Cash Sales:</span> <span>₹18,400.50</span></div>
          <div className="flex justify-between font-black text-amber-950 pt-2 border-t border-amber-100">
            <span>EXPECTED DRAWER CASH:</span> <span>₹20,400.50</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── SUB-VIEW 5: LOSS PREVENTION AUDIT ───
  const renderLossPrevention = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-amber-950 text-base">Loss Prevention Audit Log</h2>
          <p className="text-xs text-stone-500">Audit high-value refunds, cart item cancellations, and register overrides.</p>
        </div>
        <button onClick={() => handleExportReport('Loss_Prevention')} className="gold-button-primary text-xs px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md">
          <Printer className="w-3.5 h-3.5" /> Print Loss Prevention Audit
        </button>
      </div>

      <div className="gold-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50/80 text-amber-950 uppercase font-extrabold text-[10px] border-b border-amber-200">
            <tr>
              <th className="p-3">Incident ID</th>
              <th className="p-3">Register</th>
              <th className="p-3">Cashier</th>
              <th className="p-3">Incident Type</th>
              <th className="p-3 text-right">Amount (₹)</th>
              <th className="p-3">Time</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
            {incidents.map(inc => (
              <tr key={inc.id} className="hover:bg-amber-50/40">
                <td className="p-3 font-mono font-bold text-amber-900">{inc.id}</td>
                <td className="p-3 font-bold">{inc.register}</td>
                <td className="p-3 font-semibold">{inc.cashier}</td>
                <td className="p-3"><span className="gold-badge">{inc.type}</span></td>
                <td className="p-3 text-right font-mono font-black text-amber-950">₹{inc.amount.toFixed(2)}</td>
                <td className="p-3 text-stone-500 text-[11px] font-mono">{inc.time}</td>
                <td className="p-3 text-center"><span className="badge-emerald">{inc.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Conditional Sub-View Router for Store Manager Views */}
      {activeNavItem === 'health' && renderHealth()}
      {activeNavItem === 'staff' && renderStaff()}
      {activeNavItem === 'customers' && <CustomerDirectoryView />}
      {activeNavItem === 'inventory' && renderInventory()}
      {activeNavItem === 'shifts' && renderShifts()}
      {activeNavItem === 'loss_prevention' && renderLossPrevention()}
      {(!['health', 'staff', 'customers', 'inventory', 'shifts', 'loss_prevention'].includes(activeNavItem)) && renderHealth()}

      {/* ─── MODAL 1: RESET SECURITY PIN MODAL ─── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-xs w-full p-5 space-y-3 text-center bg-white border-2 border-amber-300 shadow-2xl">
            <h3 className="font-extrabold text-amber-950 text-sm">Security PIN Generated</h3>
            <p className="text-xs text-stone-500">New PIN assigned for <strong className="text-stone-900">{selectedStaff?.name}</strong>:</p>
            <div className="bg-amber-100 border border-amber-300 py-3 rounded-xl font-mono text-3xl font-black text-amber-950 tracking-widest">
              {generatedPin}
            </div>
            <button onClick={handleSavePin} className="w-full gold-button-primary py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md">
              Assign & Save PIN
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD STAFF MEMBER MODAL ─── */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-md w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-700" />
                <span>Add Branch Staff Member</span>
              </h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Staff Member Name</label>
                <input
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                  className="gold-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. r.mehta@megamart.com"
                  className="gold-input w-full font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Role</label>
                  <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className="gold-input w-full font-bold cursor-pointer">
                    <option value="CASHIER">CASHIER</option>
                    <option value="CUSTOMER_SERVICE">CUSTOMER SERVICE</option>
                    <option value="INVENTORY_CLERK">INVENTORY CLERK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-500 mb-1">Shift Assignment</label>
                  <select value={newStaffShift} onChange={e => setNewStaffShift(e.target.value as any)} className="gold-input w-full font-bold cursor-pointer">
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-amber-100">
                <button type="button" onClick={() => setIsAddStaffOpen(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
                  <Plus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EMERGENCY PO MODAL ─── */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="gold-card max-w-sm w-full p-6 space-y-4 bg-white border-2 border-amber-300 shadow-2xl">
            <h3 className="font-extrabold text-amber-950 text-sm">Transmit Emergency Purchase Order</h3>
            <form onSubmit={handleSendPo} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Item to Reorder</label>
                <select value={poItemName} onChange={e => setPoItemName(e.target.value)} className="gold-input w-full">
                  <option>Britannia Sourdough Bread 500g</option>
                  <option>Epigamia Greek Yogurt 500g</option>
                  <option>Amul Taaza Milk 1L</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Cartons Quantity</label>
                <input value={poQtyCartons} onChange={e => setPoQtyCartons(e.target.value)} type="number" className="gold-input w-full font-mono font-bold" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPoModalOpen(false)} className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 gold-button-primary py-2.5 rounded-xl font-bold cursor-pointer">Send PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagerPage;
