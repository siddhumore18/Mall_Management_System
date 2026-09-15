import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { aiApi } from '../services/api';
import {
  MessageSquare, Sparkles, Send, X, Bot, User, ChevronRight,
  ShieldCheck, HelpCircle, Building2, Store, CreditCard, Boxes,
  Receipt, RotateCcw, AlertTriangle, ArrowLeftRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  topicPills?: string[];
}

const quickPrompts = [
  'How do subscription plan quotas work?',
  'How to process customer refunds & returns?',
  'How does FEFO expiry tracking operate?',
  'How to dispatch inter-store stock transfers?',
  'How to lookup repeat customer history?'
];

export const ProErpChatbot: React.FC = () => {
  const { user, activeRole } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: `Hello ${user?.name || 'Partner'}! I am your MegaMart ProERP Intelligent Assistant. How can I assist you with system operations, subscription quotas, POS checkout, FEFO inventory, or accounting today?`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      topicPills: quickPrompts
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateBotResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Subscription Plans & Quota Boundaries
    if (q.includes('quota') || q.includes('plan') || q.includes('upgrade') || q.includes('starter') || q.includes('super admin')) {
      return `🛡️ **Subscription Plan & Boundary Governance**:
- **Starter Plan**: Max 1 Physical Store Outlet, 5 User Seats (₹4,999/mo).
- **Standard Plan**: Max 5 Physical Store Outlets, 25 User Seats (₹14,999/mo).
- **Enterprise Plan**: Unlimited Outlets & Seats (₹39,999/mo).
- **Super Admin Governance**: Subscription plans and quota allocations are governed exclusively by the Super Admin in the Governance Center.
- **Request Upgrade**: If your quota is reached, click "Request Upgrade" on your dashboard. This dispatches an Upgrade Request directly to the Super Admin's Inbox for approval.`;
    }

    // 2. Customer Refunds & Returns
    if (q.includes('refund') || q.includes('return') || q.includes('exchange') || q.includes('customer service')) {
      return `🔄 **Customer Refunds & Exchange Standard Operating Procedure**:
1. Open **Customer Service Desk** workspace (or POS Terminal).
2. Enter invoice ID (e.g. \`INV-891024\`) or customer mobile number.
3. Select return line items and specify return reason (e.g. *Damaged Packaging*, *Quality Discrepancy*).
4. **Manager Override**: For refunds > ₹500, enter 4-digit Manager PIN (\`1234\`).
5. Refund payout is logged in audit trails and inventory restock is updated.`;
    }

    // 3. FEFO Expiry Tracking
    if (q.includes('fefo') || q.includes('expiry') || q.includes('expire') || q.includes('batch')) {
      return `📦 **FEFO (First-Expired, First-Out) Inventory Management**:
- **Batch Date Auditing**: Tracks manufacturing dates, expiration dates, and shelf locations.
- **Clearance Discounting**: Stock expiring within 15 days automatically triggers clearance discount alerts (e.g. 30% OFF) to prevent inventory wastage.
- **Audit Reports**: Inventory Clerks and Store Managers can access the FEFO Auditor tab for rotation alerts.`;
    }

    // 4. Inter-Store Stock Transfers
    if (q.includes('transfer') || q.includes('dispatch') || q.includes('inter-store') || q.includes('branch')) {
      return `🏬 **Inter-Store Stock Transfers Workflow**:
1. Go to **Executive HQ -> Inter-Store Transfers**.
2. Select source store (e.g. *Flagship Mumbai*) and destination store (e.g. *Express Delhi*).
3. Select product SKU and transfer quantity.
4. Click **Dispatch Transfer**. The status sets to \`IN_TRANSIT\` until physical GRN verification at the destination branch changes it to \`COMPLETED\`.`;
    }

    // 5. Customer History & Repeat Customer POS Lookup
    if (q.includes('customer') || q.includes('repeat') || q.includes('history') || q.includes('loyalty')) {
      return `👤 **Customer CRM & POS Repeat Customer Auto-Linking**:
- **POS Lookup**: Type customer mobile number or name on the POS Checkout screen.
- **Auto-Sync**: If customer previously visited any store branch, their lifetime spend, visit count, loyalty tier (Gold/Silver/Bronze), and past bills load automatically.
- **Loyalty Points**: Customers earn 1 point per ₹100 spent, redeemable at checkout.`;
    }

    // 6. GST Tax Filing & IRN
    if (q.includes('gst') || q.includes('tax') || q.includes('irn') || q.includes('pnl') || q.includes('accountant')) {
      return `💼 **Financial Accounting & GST Tax Compliance**:
- **IRN E-Invoicing**: Every POS transaction auto-calculates SGST/CGST/IGST slabs (5%, 12%, 18%) and generates IRN references.
- **Daily Reconciliation**: Accountants balance cash drawer collections against UPI & card settlements.
- **Accounts Payable (AP)**: Supplier payouts and disbursement releases are tracked in the Finance Desk.`;
    }

    // 7. General Fallback Response
    return `💡 **ProERP Enterprise System Guide**:
I can assist you with:
1. **Subscription Quotas & Super Admin Upgrades** (Starter, Standard, Enterprise).
2. **POS Checkout, Barcode Scanning & Thermal Receipts**.
3. **FEFO Stock Expiry Rotation & Clearance Discounts**.
4. **Inter-Store Stock Transfer Dispatches**.
5. **Customer History, CRM & Loyalty Point Redemption**.
6. **GST Tax Ledgers & Daily Sales Reconciliation**.

Feel free to ask any specific question or click a quick prompt below!`;
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await aiApi.askCopilot(query, activeRole, 'MegaMart Flagship Mumbai');
      const responseText = aiResponse?.answer || generateBotResponse(query);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        topicPills: quickPrompts.filter(p => !p.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: generateBotResponse(query),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        topicPills: quickPrompts.slice(0, 3)
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="gold-button-primary p-3 sm:p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-white font-bold cursor-pointer group hover:scale-105 transition-all ring-4 ring-amber-500/20"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse"></span>
          </div>
          <span className="text-xs hidden sm:inline-block font-extrabold pr-1">ProERP Assistant</span>
        </button>
      )}

      {/* Expandable AI Chat Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] sm:w-[400px] max-w-[400px] h-[75vh] sm:h-[520px] max-h-[560px] gold-card bg-white border-2 border-amber-400 shadow-2xl rounded-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 text-white p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-amber-200 leading-tight">MegaMart ProERP AI Copilot</h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live Enterprise Assistant
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-200/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-stone-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-1.5 p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-xs'
                }`}>
                  <div className="whitespace-pre-line leading-relaxed text-[11px] font-sans">
                    {m.text}
                  </div>
                  <div className={`text-[9px] text-right font-mono ${m.sender === 'user' ? 'text-amber-200' : 'text-stone-400'}`}>
                    {m.timestamp}
                  </div>

                  {/* Topic Suggestion Pills */}
                  {m.topicPills && m.topicPills.length > 0 && (
                    <div className="pt-2 border-t border-amber-100/80 space-y-1.5">
                      <span className="text-[9px] uppercase font-extrabold text-amber-800 tracking-wider block">Suggested Questions:</span>
                      <div className="flex flex-wrap gap-1">
                        {m.topicPills.map((pill, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSend(pill)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded-lg text-left transition-colors cursor-pointer"
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start items-center text-stone-500 text-[11px]">
                <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <span className="font-semibold italic">Analyzing system knowledge base...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-amber-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ProERP Assistant..."
                className="gold-input flex-1 text-xs py-2 px-3 font-semibold"
              />
              <button
                type="submit"
                className="gold-button-primary p-2 rounded-xl text-white cursor-pointer shadow-md"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};
