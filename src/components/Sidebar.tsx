import React from 'react';
import {
  LayoutDashboard,
  Egg,
  Layers,
  HeartPulse,
  Wheat,
  Boxes,
  DollarSign,
  Users,
  FileBarChart2,
  Server,
  Database,
  CloudCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'egg-production'
  | 'flocks'
  | 'bird-health'
  | 'daily-consumption'
  | 'stocks'
  | 'finance'
  | 'salaries'
  | 'reports'
  | 'database-backup'
  | 'vps-sync';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen }) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'egg-production', label: 'Egg Production', icon: Egg, badge: 'Daily' },
    { id: 'flocks', label: 'Flocks & Sheds', icon: Layers },
    { id: 'bird-health', label: 'Health & Mortality', icon: HeartPulse },
    { id: 'daily-consumption', label: 'Feed & Water Intake', icon: Wheat },
    { id: 'stocks', label: 'Inventory & Store', icon: Boxes },
    { id: 'finance', label: 'Sales & Expenses', icon: DollarSign },
    { id: 'salaries', label: 'Staff & Salaries', icon: Users },
    { id: 'reports', label: 'Analytics & Reports', icon: FileBarChart2 },
    { id: 'database-backup', label: 'Database & Backup', icon: Database, badge: 'SQL' },
    { id: 'vps-sync', label: 'VPS Live Sync & Vercel', icon: Server, badge: 'Live' },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 w-64 flex-shrink-0 flex flex-col justify-between transition-all duration-200 shadow-sm ${
        isOpen ? 'block' : 'hidden md:flex'
      }`}
    >
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Farm Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'Live'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Production Staging Info Box */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Staging: Vercel</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Staging URL connected to live API at <code className="text-emerald-700 font-mono">greenovapk.com/api</code> without touching live server files.
        </p>
      </div>
    </aside>
  );
};
