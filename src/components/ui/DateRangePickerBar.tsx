import React from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';

export type DatePreset = 'today' | '30d' | 'all' | 'custom';

export interface DateRangePickerBarProps {
  // Flock filtering
  selectedFlock?: string;
  onSelectFlock?: (flockId: string) => void;
  flocks?: { id: string; name: string }[];
  showFlockSelector?: boolean;

  // Date range filtering
  fromDate: string;
  toDate: string;
  onDateChange: (from: string, to: string) => void;

  // Quick presets
  activePreset?: DatePreset;
  onPresetChange?: (preset: DatePreset) => void;

  // Reset
  onReset?: () => void;

  className?: string;
}

export const DateRangePickerBar: React.FC<DateRangePickerBarProps> = ({
  selectedFlock = 'all',
  onSelectFlock,
  flocks = [],
  showFlockSelector = true,
  fromDate,
  toDate,
  onDateChange,
  activePreset = 'all',
  onPresetChange,
  onReset,
  className = '',
}) => {
  const handlePresetClick = (preset: 'today' | '30d' | 'all') => {
    if (onPresetChange) {
      onPresetChange(preset);
    }
  };

  const handleResetClick = () => {
    if (onReset) {
      onReset();
    } else {
      if (onSelectFlock) onSelectFlock('all');
      handlePresetClick('all');
    }
  };

  return (
    <div
      className={`rounded-2xl border border-emerald-500/25 bg-white p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}
    >
      {/* 1. Flock Selector matching screenshot: 🐔 All Flocks Combined ▼ */}
      {showFlockSelector && (
        <div className="relative flex items-center">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
            <span className="text-base select-none leading-none">🐔</span>
            <select
              value={selectedFlock}
              onChange={(e) => onSelectFlock?.(e.target.value)}
              aria-label="Filter by Flock"
              className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Flocks Combined</option>
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      )}

      {/* 2. Unified Date Range Box matching screenshot: 📅 FROM mm/dd/yyyy 📅 → TO mm/dd/yyyy 📅 */}
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs flex-wrap sm:flex-nowrap">
        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />

        {/* FROM Date */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FROM</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              onDateChange(e.target.value, toDate);
              onPresetChange?.('custom');
            }}
            placeholder="mm/dd/yyyy"
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer w-28 sm:w-32"
          />
        </div>

        {/* Arrow Separator */}
        <span className="text-slate-400 font-bold text-xs select-none">→</span>

        {/* TO Date */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TO</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              onDateChange(fromDate, e.target.value);
              onPresetChange?.('custom');
            }}
            placeholder="mm/dd/yyyy"
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer w-28 sm:w-32"
          />
        </div>
      </div>

      {/* 3. Preset Buttons: Today, 30D, All */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={() => handlePresetClick('today')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            activePreset === 'today'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => handlePresetClick('30d')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            activePreset === '30d'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          30D
        </button>

        <button
          type="button"
          onClick={() => handlePresetClick('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            activePreset === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          All
        </button>

        {/* 4. Reset Button matching screenshot circular button with refresh icon */}
        <button
          type="button"
          onClick={handleResetClick}
          title="Reset filter to all dates and flocks"
          className="p-1.5 rounded-full border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
