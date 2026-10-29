import React from 'react';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    emailVerified?: boolean;
    initials?: string;
  } | null;
  onSignOut: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSignOut,
  onOpenLogin,
}) => {
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
                <span className="font-bold text-lg tracking-tight text-white">Intelligence Poultry</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Smart OS
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 hidden sm:block">
                Smarter Poultry. Stronger Profits.
              </p>
            </div>
          </div>

          {/* User Profile & Auth on the right */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-xs border border-emerald-500/40 shadow-xs">
                  {currentUser.initials || 'CN'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-300 font-mono truncate max-w-[140px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of session"
                  className="px-2.5 py-1.5 bg-emerald-900/80 hover:bg-rose-900/70 hover:text-rose-200 text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-700/60 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
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
