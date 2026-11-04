import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  Menu,
  X,
  Bell,
  Syringe,
  Pill,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface HealthNotification {
  id: string;
  title: string;
  message?: string;
  date: string;
  flockName?: string;
  status: 'Scheduled' | 'Completed' | 'Overdue';
  method?: string;
  dosage?: string;
  type?: 'vaccine' | 'medicine';
  isNew?: boolean;
}

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
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateHome?: () => void;
  notifications?: HealthNotification[];
  latestPrompt?: HealthNotification | null;
  onClearPrompt?: () => void;
  onNavigateTab?: (tab: string) => void;
  onToggleVaccineStatus?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSignOut,
  onOpenLogin,
  isSidebarOpen = false,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleCollapse,
  onNavigateHome,
  notifications = [],
  latestPrompt = null,
  onClearPrompt,
  onNavigateTab,
  onToggleVaccineStatus,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPromptToast, setShowPromptToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // When a new vaccine/medication is scheduled, trigger the floating prompt toast
  useEffect(() => {
    if (latestPrompt) {
      setShowPromptToast(true);
      const timer = setTimeout(() => {
        setShowPromptToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [latestPrompt]);

  // Click outside listener for the notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const scheduledNotifications = notifications.filter((n) => n.status === 'Scheduled');
  const scheduledCount = scheduledNotifications.length;

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-800/60 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title & Menu Toggle Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Drawer Button */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                className="md:hidden p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Desktop Menu Collapse/Expand Button (Closing right-to-left to icon-only) */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={isSidebarCollapsed ? 'Expand sidebar menu' : 'Collapse sidebar to icons'}
                title={isSidebarCollapsed ? 'Expand menu (left to right)' : 'Collapse menu (right to left, only icons display)'}
                className="hidden md:flex p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 transition-all cursor-pointer items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:scale-105 active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div
              onClick={onNavigateHome}
              className={`flex items-center space-x-2 sm:space-x-3 ${onNavigateHome ? 'cursor-pointer group' : ''}`}
              title="Return to Dashboard"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-600/30 border border-emerald-500/40 p-1 flex-shrink-0 group-hover:scale-105 transition-transform">
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
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap group-hover:text-emerald-300 transition-colors">
                    GreenOva Poultry
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-300/80 hidden sm:block">
                  Smarter Poultry. Stronger Profits.
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Bell Notification Prompt & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Bell Icon Notification Button & Popover */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen((prev) => !prev);
                  setShowPromptToast(false);
                  if (onClearPrompt) onClearPrompt();
                }}
                aria-label="View scheduled health and vaccine notifications"
                className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                  isDropdownOpen
                    ? 'bg-emerald-800 text-white border-emerald-500 ring-2 ring-emerald-400/30'
                    : latestPrompt || scheduledCount > 0
                    ? 'bg-emerald-900/90 text-amber-300 hover:text-white border-emerald-700/80 hover:bg-emerald-800 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-300 hover:text-white border-emerald-800 hover:bg-emerald-800'
                }`}
                title={`${scheduledCount} scheduled vaccine/medication reminders`}
              >
                <Bell className={`w-5 h-5 ${latestPrompt ? 'animate-bounce text-amber-300' : ''}`} />

                {/* Live Pulse Dot / Counter Badge */}
                {scheduledCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 shadow-sm border border-emerald-950">
                    {scheduledCount}
                  </span>
                )}

                {/* Animated Ring when latest prompt is active */}
                {latestPrompt && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  </span>
                )}
              </button>

              {/* Floating Immediate Prompt Toast on scheduling */}
              {showPromptToast && latestPrompt && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/40 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          <span>Prompt: Vaccine/Medication Scheduled!</span>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">Added to Header Reminders</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPromptToast(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs space-y-1">
                    <div className="font-bold text-white truncate">{latestPrompt.title}</div>
                    <div className="text-[11px] text-emerald-300 flex items-center gap-2">
                      <span>📅 {latestPrompt.date}</span>
                      <span>•</span>
                      <span>🐔 {latestPrompt.flockName || 'All Units'}</span>
                    </div>
                    {latestPrompt.dosage && (
                      <div className="text-[10px] text-slate-400">
                        {latestPrompt.dosage} ({latestPrompt.method || 'Drinking Water'})
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptToast(false);
                        setIsDropdownOpen(true);
                      }}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1"
                    >
                      <span>View in Reminders</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPromptToast(false);
                          onNavigateTab('bird-health');
                        }}
                        className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Open Bird Health
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Full Scheduled Reminders Dropdown Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-900">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                          Vaccine &amp; Medication Reminders
                        </h4>
                        <p className="text-[10px] text-slate-300">
                          {scheduledCount} active preventative dose{scheduledCount === 1 ? '' : 's'} scheduled
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                      {scheduledCount} Due
                    </span>
                  </div>

                  {/* Dropdown Notification List - ONLY SCHEDULED VACCINES */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                    {scheduledNotifications.length === 0 ? (
                      <div className="py-8 text-center px-4 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-xs font-bold text-slate-700">No Scheduled Vaccines</div>
                        <p className="text-[11px] text-slate-500">
                          All preventative doses have been administered or no upcoming schedules are pending.
                        </p>
                      </div>
                    ) : (
                      scheduledNotifications.map((item) => {
                        const isMed = item.type === 'medicine';
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-2.5">
                                <div
                                  className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                                    item.status === 'Completed'
                                      ? 'bg-slate-100 text-slate-500'
                                      : isMed
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.status === 'Completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : isMed ? (
                                    <Pill className="w-4 h-4" />
                                  ) : (
                                    <Syringe className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="flex items-center gap-1 font-medium text-slate-700">
                                      <Building2 className="w-3 h-3 text-slate-400" />
                                      {item.flockName || 'Unit 1'}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-amber-700 font-semibold">
                                      <Calendar className="w-3 h-3 text-amber-600" />
                                      {item.date}
                                    </span>
                                  </div>
                                  {(item.dosage || item.method) && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                      {item.dosage} • {item.method}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status / Quick Action */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                                  Scheduled
                                </span>
                                {onToggleVaccineStatus && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleVaccineStatus(item.id);
                                    }}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Mark Done</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer Action */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    {onNavigateTab ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigateTab('bird-health');
                        }}
                        className="w-full text-center py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Open Bird Health &amp; Vaccine Calendar</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Auth */}
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
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
