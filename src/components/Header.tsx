import React, { useState, useEffect } from 'react';
import { Activity, Server, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { testVpsConnection, VpsStatus } from '../services/api';

interface HeaderProps {
  activeFarm: string;
  onSelectFarm: (farmId: string) => void;
  onOpenRecordModal: (type: 'egg' | 'mortality' | 'feed') => void;
  onOpenVpsModal: () => void;
  currentUser: { name: string; email: string } | null;
  onSignOut: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeFarm,
  onSelectFarm,
  onOpenRecordModal,
  onOpenVpsModal,
  currentUser,
  onSignOut,
  onOpenLogin,
}) => {
  const [vpsStatus, setVpsStatus] = useState<VpsStatus>({
    endpoint: 'https://greenovapk.com/api',
    isOnline: true,
    lastChecked: null,
    responseTimeMs: 84,
  });
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    const res = await testVpsConnection();
    setVpsStatus(res);
    setChecking(false);
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-800/60 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-600/30 border border-emerald-500/40 p-1">
              <img
                src="/assets/greenova-logo-CHK5q5vz.png"
                alt="GreenOva Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">GreenOva</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Farm OS
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 hidden sm:block">
                Poultry Operations & Resource Planning
              </p>
            </div>
          </div>

          {/* Farm Switcher & Live VPS Status */}
          <div className="flex items-center space-x-3">
            {/* Live VPS Status Badge */}
            <button
              onClick={onOpenVpsModal}
              title="Click to view VPS connection & backup details"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-xs transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline text-emerald-200">Live VPS:</span>
              <span className="font-mono text-emerald-100 hidden sm:inline">greenovapk.com</span>
              {vpsStatus.isOnline ? (
                <span className="flex items-center text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                  Active {vpsStatus.responseTimeMs ? `(${vpsStatus.responseTimeMs}ms)` : ''}
                </span>
              ) : (
                <span className="flex items-center text-amber-300 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Offline Mode
                </span>
              )}
            </button>

            {/* Farm Selector */}
            <div className="relative">
              <select
                value={activeFarm}
                onChange={(e) => onSelectFarm(e.target.value)}
                aria-label="Select Farm"
                className="bg-emerald-900/80 border border-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer appearance-none"
              >
                <option value="all">All Farms (65,050 Birds)</option>
                <option value="farm-1">Main Complex (Sheds 01-04)</option>
                <option value="farm-2">South Unit (Broiler Wing)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Action Button */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => onOpenRecordModal('egg')}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Eggs</span>
              </button>
              <button
                onClick={() => onOpenRecordModal('feed')}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium px-2.5 py-2 rounded-lg border border-emerald-600/40 transition-colors cursor-pointer"
              >
                <span>+ Feed</span>
              </button>
              <button
                onClick={() => onOpenRecordModal('mortality')}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium px-2.5 py-2 rounded-lg border border-emerald-600/40 transition-colors cursor-pointer"
              >
                <span>+ Mortality</span>
              </button>
            </div>

            {/* User Profile & Auth */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-emerald-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-300 font-mono truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of session"
                  className="px-2.5 py-1.5 bg-emerald-900/80 hover:bg-rose-900/60 hover:text-rose-200 text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-700/60 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
