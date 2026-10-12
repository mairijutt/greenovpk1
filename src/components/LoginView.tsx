import React, { useState } from 'react';
import { Lock, Mail, Server, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { getApiBaseUrl } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: { email: string; name: string; token?: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLiveVpsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const apiBase = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.token || data.success || data.data?.token)) {
        const token = data.token || data.data?.token || 'vps-session-token';
        const userName = data.user?.name || data.data?.name || email.split('@')[0];
        setSuccessMsg('Successfully authenticated against VPS live database!');
        setTimeout(() => {
          onLoginSuccess({ email, name: userName, token });
        }, 800);
      } else {
        // Fallback with clear message if credentials don't match VPS database
        setError(
          data.message ||
            'Invalid credentials on live VPS database. You can use Quick Staging Login below to access all features.'
        );
      }
    } catch (err: any) {
      setError('Could not connect to live VPS API: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'Admin' | 'Supervisor') => {
    onLoginSuccess({
      email: role === 'Admin' ? 'admin@greenovapk.com' : 'supervisor@greenovapk.com',
      name: role === 'Admin' ? 'Farm Director (Admin)' : 'Shed Supervisor',
      token: 'demo-local-token',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header with Logo */}
        <div className="bg-emerald-950 p-6 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-3 bg-emerald-600/30 rounded-2xl border border-emerald-500/40 p-2 flex items-center justify-center">
            <img
              src="/assets/greenova-logo-CHK5q5vz.png"
              alt="GreenOva"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-black tracking-tight">GreenOva Farm Management</h1>
          <p className="text-xs text-emerald-300 mt-1">Live Database & Operations Authentication</p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-[11px] text-emerald-200">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: greenovapk.com/api/login</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLiveVpsLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email or Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@greenovapk.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating with VPS...</span>
              ) : (
                <>
                  <span>Sign In with Live VPS Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access for Staging */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Staging & Development Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDemoLogin('Admin')}
                className="py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Login</span>
              </button>
              <button
                onClick={() => handleQuickDemoLogin('Supervisor')}
                className="py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supervisor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[11px] text-slate-400">
          GreenOva Cloud System • Live VPS Safe Sync
        </div>
      </div>
    </div>
  );
};
