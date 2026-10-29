import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { UIInput, UIButton } from './ui';

interface LoginViewProps {
  onLoginSuccess: (user: { email: string; name: string; token?: string }) => void;
  onCancel?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('aaglobal500@gmail.com');
  const [password, setPassword] = useState('GreenovaAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulated authentic authentication flow
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        email: email,
        name: email.includes('aaglobal') ? 'Ahsan Nawaz' : 'Farm Supervisor',
        token: 'auth-token-prod-' + Date.now(),
      });
    }, 450);
  };

  const handleQuickLogin = (role: 'Admin' | 'Supervisor') => {
    if (role === 'Admin') {
      setEmail('aaglobal500@gmail.com');
      setPassword('GreenovaAdmin@2026');
      onLoginSuccess({
        email: 'aaglobal500@gmail.com',
        name: 'Ahsan Nawaz',
        token: 'auth-super-admin',
      });
    } else {
      setEmail('supervisor@greenovapk.com');
      setPassword('Supervisor@2026');
      onLoginSuccess({
        email: 'supervisor@greenovapk.com',
        name: 'Shed Supervisor',
        token: 'auth-supervisor',
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Background Graphic & Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/src/assets/images/poultry_login_bg_1793271065125.jpg"
          alt="Intelligence Poultry Facility"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105 filter brightness-80 contrast-105"
        />
        {/* Subtle dark gradient overlay to ensure perfect card contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50 backdrop-blur-[1px]" />

        {/* Ambient high-tech glowing accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl" />
      </div>

      {/* Top Brand Pill */}
      <div className="relative z-10 mb-4 sm:mb-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md shadow-lg text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white">Intelligence Poultry OS</span>
          <span className="text-emerald-400">•</span>
          <span className="text-emerald-300">Enterprise Cloud</span>
        </div>
      </div>

      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/40 ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Logo */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-7 text-center text-white relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 text-emerald-200 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}

          <div className="w-14 h-14 mx-auto mb-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2.5 flex items-center justify-center shadow-md">
            <img
              src="/assets/greenova-logo-CHK5q5vz.png"
              alt="GreenOva"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-xl font-black tracking-tight">Intelligence Poultry Management System</h1>
          <p className="text-xs text-emerald-200/90 mt-1">
            Smarter Poultry. Stronger Profits.
          </p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Production Operations Portal</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. aaglobal500@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <UIButton
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-2.5"
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to Dashboard
              </UIButton>
            </div>
          </form>

          {/* Quick 1-Click Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Fast Access Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Admin')}
                className="py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200/60 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ahsan Nawaz (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Supervisor')}
                className="py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200/60 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shed Supervisor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50/90 backdrop-blur-xs p-3.5 text-center border-t border-slate-100 flex flex-col items-center gap-1 text-[11px] text-slate-500">
          <div className="font-semibold text-slate-700">
            Intelligence Poultry Management System
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>256-bit Encrypted Session • Production Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};
