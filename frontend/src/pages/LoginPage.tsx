import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRetailStore } from '../store/useRetailStore';
import { authApi, tenantApi } from '../services/api';
import { 
  Building2, ArrowRight, ArrowLeft, ShieldCheck, 
  Lock, AlertCircle, Sparkles, UserPlus, CheckCircle2, Shield
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setAuth, setViewMode } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register form state
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [planId, setPlanId] = useState(3);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid enterprise email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authApi.login(email.trim(), password);
      
      // Load real tenant data from PostgreSQL
      if (res.user.tenantId) {
        await useRetailStore.getState().loadTenantData(res.user.tenantId);
      }
      
      let tenantInfo = null;
      try {
        tenantInfo = await tenantApi.getMe();
      } catch (e) {}

      setAuth(res.user, res.token, tenantInfo);
    } catch (err: any) {
      const errMsg = err?.message || 'Authentication failed. Please check your credentials.';
      setError(errMsg.includes('401') || errMsg.includes('Invalid') ? 'Invalid email or password.' : errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please provide your Supermarket or Mall Company name.');
      return;
    }
    if (!adminName.trim()) {
      setError('Please provide the Tenant Administrator full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please provide a valid company email address.');
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setError('Password must be at least 8 characters long for data security compliance.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.registerTenant({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        planId
      });

      await useRetailStore.getState().loadTenantData(res.user.tenantId, companyName.trim());

      let tenantInfo = null;
      try {
        tenantInfo = await tenantApi.getMe();
      } catch (e) {}

      setSuccessMsg('Account registered securely! Redirecting to your workspace...');
      setTimeout(() => {
        setAuth(res.user, res.token, tenantInfo);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Tenant registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const setTestAccount = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-900 flex items-center justify-center p-4 py-8 select-none relative overflow-y-auto animate-slide-up">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-amber-400/15 blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side: Enterprise Security & Brand Highlights */}
        <div className="md:col-span-5 gold-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="gold-badge text-[9px] font-black uppercase">Enterprise Security</span>
              <button
                onClick={() => setViewMode('LANDING')}
                className="text-xs text-stone-500 hover:text-amber-950 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-amber-950">MegaMart Cloud ERP</h2>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Zero-trust multi-tenant retail management platform with hardware POS sync, FEFO inventory, and automated payment gateways.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-xl border border-amber-200/80">
                <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <div className="font-bold text-amber-950 leading-none">JWT 256-Bit Protection</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Stateless cryptographic session tokens</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-xl border border-amber-200/80">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-bold text-amber-950 leading-none">Multi-Tenant Boundary</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Physical & query-level tenant isolation</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-xl border border-amber-200/80">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <div className="font-bold text-amber-950 leading-none">Rate Limiter Active</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Sliding window brute-force defense</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick-Fill for Local Bootstrap */}
          <div className="pt-3 border-t border-amber-200/60 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Master Account:</span>
            <button
              type="button"
              onClick={() => setTestAccount('superadmin@megamart.com', 'SuperAdmin@2026!')}
              className="w-full text-left p-2 rounded-xl bg-amber-100/70 hover:bg-amber-100 text-amber-950 text-xs font-bold border border-amber-300 flex items-center justify-between cursor-pointer transition-all"
            >
              <span>Super Admin (SaaS Master)</span>
              <span className="text-[10px] text-amber-700 font-mono">Fill</span>
            </button>
          </div>
        </div>

        {/* Right Side: Auth Tabs (Login / Register) */}
        <div className="md:col-span-7 gold-card p-6 flex flex-col justify-between">
          <div className="space-y-5">
            
            {/* Header with Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-black shadow-md shadow-amber-500/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-amber-950 leading-none">MEGAMART<span className="text-amber-600">.OS</span></h1>
                  <span className="text-[10px] font-semibold text-stone-500">Retail SaaS Gateway</span>
                </div>
              </div>

              <div className="flex bg-amber-100/80 p-1 rounded-xl border border-amber-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('LOGIN'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'LOGIN' ? 'gold-button-primary shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('REGISTER'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'REGISTER' ? 'gold-button-primary shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  New Tenant
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Registered Enterprise Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="gold-input w-full text-xs font-semibold"
                    placeholder="admin@yourcompany.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-extrabold text-stone-600">Account Password</label>
                    <span className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer">Forgot?</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="gold-input w-full text-xs"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gold-button-primary text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-extrabold"
                >
                  {loading ? (
                    <span>Authenticating against PostgreSQL...</span>
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER TENANT */}
            {activeTab === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Company / Mall Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); setError(''); }}
                    className="gold-input w-full text-xs"
                    placeholder="e.g. Apex Hypermarkets Ltd"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Admin Full Name</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => { setAdminName(e.target.value); setError(''); }}
                      className="gold-input w-full text-xs"
                      placeholder="e.g. Rajesh Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Subscription Tier</label>
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(Number(e.target.value))}
                      className="gold-input w-full text-xs font-bold"
                    >
                      <option value={3}>Starter (2 Stores)</option>
                      <option value={2}>Standard (10 Stores)</option>
                      <option value={1}>Enterprise (50 Stores)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Admin Work Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                    className="gold-input w-full text-xs"
                    placeholder="admin@yourchain.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-stone-600 mb-1">Secure Password (Min 8 Chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                    className="gold-input w-full text-xs"
                    placeholder="At least 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gold-button-primary text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-extrabold mt-2"
                >
                  {loading ? (
                    <span>Provisioning Tenant Database Schema...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Start Workspace</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          <div className="pt-4 text-center text-[10px] text-stone-500 font-medium">
            Protected by PostgreSQL 256-Bit SSL • ProERP Multi-Tenant Isolation
          </div>
        </div>

      </div>
    </div>
  );
};
