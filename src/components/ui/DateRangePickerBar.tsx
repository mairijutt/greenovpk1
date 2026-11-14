import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, RefreshCw, Building2 } from 'lucide-react';
import { MONTH_OPTIONS, getMonthDateBounds } from '../../utils/ceoReportCalculations';

export type DatePreset = 'today' | '30d' | 'all' | 'custom' | 'month' | 'year';

export interface DateRangePickerBarProps {
  // Farm filtering
  selectedFarm?: string;
  onSelectFarm?: (farmId: string) => void;
  farms?: { id: string; name: string; code?: string }[];
  showFarmSelector?: boolean;

  // Flock filtering
  selectedFlock?: string;
  onSelectFlock?: (flockId: string) => void;
  flocks?: { id: string; name: string }[];
  showFlockSelector?: boolean;

  // Date range filtering
  fromDate: string;
  toDate: string;
  onDateChange: (from: string, to: string) => void;

  // Optional controlled Month / Year selectors (auto-derived from fromDate/toDate if omitted)
  selectedMonth?: string;
  selectedYear?: string;
  onMonthChange?: (month: string) => void;
  onYearChange?: (year: string) => void;
  availableYears?: string[];

  // Optional extra controls (e.g. search or category pills inside the bar)
  leftSlot?: React.ReactNode;

  // Quick presets
  activePreset?: DatePreset;
  onPresetChange?: (preset: DatePreset) => void;
  showMonthYearPresets?: boolean;

  // Reset
  onReset?: () => void;

  className?: string;
}

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DateRangePickerBar: React.FC<DateRangePickerBarProps> = ({
  selectedFarm = 'all',
  onSelectFarm,
  farms = [],
  showFarmSelector = true,
  selectedFlock = 'all',
  onSelectFlock,
  flocks = [],
  showFlockSelector = true,
  fromDate,
  toDate,
  onDateChange,
  selectedMonth: controlledMonth,
  selectedYear: controlledYear,
  onMonthChange,
  onYearChange,
  availableYears,
  leftSlot,
  activePreset = 'all',
  onPresetChange,
  onReset,
  className = '',
}) => {
  const todayStr = getTodayStr();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);
  const [fallbackYear, setFallbackYear] = useState<string>(currentYear);

  // Derive Month & Year automatically from fromDate/toDate when not explicitly controlled
  const { derivedMonth, derivedYear } = useMemo(() => {
    if (!fromDate && !toDate) {
      return { derivedMonth: 'all', derivedYear: 'all' };
    }

    if (fromDate && toDate && fromDate.length >= 10 && toDate.length >= 10) {
      const fYear = fromDate.slice(0, 4);
      const tYear = toDate.slice(0, 4);
      if (fYear === tYear) {
        if (fromDate === `${fYear}-01-01` && toDate === `${fYear}-12-31`) {
          return { derivedMonth: 'all', derivedYear: fYear };
        }
        const fMonth = fromDate.slice(5, 7);
        const bounds = getMonthDateBounds(fYear, fMonth);
        if (fromDate === bounds.from && toDate === bounds.to) {
          return { derivedMonth: fMonth, derivedYear: fYear };
        }
        return { derivedMonth: 'custom', derivedYear: fYear };
      }
    }

    const refYear = (fromDate || toDate || '').slice(0, 4);
    return {
      derivedMonth: 'custom',
      derivedYear: /^\d{4}$/.test(refYear) ? refYear : currentYear,
    };
  }, [fromDate, toDate, currentYear]);

  const effectiveMonth = controlledMonth !== undefined ? controlledMonth : derivedMonth;
  const effectiveYear = controlledYear !== undefined ? controlledYear : derivedYear;

  const yearOptions = useMemo(() => {
    const base = new Set<string>(availableYears && availableYears.length > 0 ? availableYears : [currentYear, '2025']);
    base.add(currentYear);
    if (effectiveYear && effectiveYear !== 'all' && /^\d{4}$/.test(effectiveYear)) {
      base.add(effectiveYear);
    }
    return Array.from(base).sort().reverse();
  }, [availableYears, currentYear, effectiveYear]);

  const currentMonthBounds = useMemo(
    () => getMonthDateBounds(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const activeFullYearTarget =
    effectiveYear && effectiveYear !== 'all' ? effectiveYear : currentYear;

  const isCurrentMonthActive =
    Boolean(fromDate && toDate) &&
    fromDate === currentMonthBounds.from &&
    toDate === currentMonthBounds.to;
  const isFullYearActive =
    Boolean(fromDate && toDate) &&
    fromDate === `${activeFullYearTarget}-01-01` &&
    toDate === `${activeFullYearTarget}-12-31`;
  const isAllTimeActive = !fromDate && !toDate;
  const is30dActive = activePreset === '30d';
  const isTodayActive =
    Boolean(fromDate && toDate) &&
    fromDate === todayStr &&
    toDate === todayStr;

  const handleMonthSelect = (newMonth: string) => {
    if (onMonthChange) {
      onMonthChange(newMonth);
      return;
    }
    if (newMonth === 'custom') return;
    const targetYear = effectiveYear !== 'all' ? effectiveYear : fallbackYear || currentYear;
    setFallbackYear(targetYear);
    const bounds = getMonthDateBounds(targetYear, newMonth);
    onDateChange(bounds.from, bounds.to);
    onPresetChange?.('custom');
  };

  const handleYearSelect = (newYear: string) => {
    if (onYearChange) {
      onYearChange(newYear);
      return;
    }
    if (newYear === 'all') {
      onDateChange('', '');
      onPresetChange?.('all');
      return;
    }
    setFallbackYear(newYear);
    const targetMonth = effectiveMonth === 'custom' ? 'all' : effectiveMonth;
    const bounds = getMonthDateBounds(newYear, targetMonth);
    onDateChange(bounds.from, bounds.to);
    onPresetChange?.('custom');
  };

  const handlePresetButton = (presetKey: 'month' | 'year' | 'all' | '30d' | 'today') => {
    if (onMonthChange && onPresetChange) {
      // Controlled mode (e.g. ReportsView) manages its own selectedMonth/Year + dates
      onPresetChange(presetKey);
      return;
    }

    if (presetKey === 'all') {
      onDateChange('', '');
      onPresetChange?.('all');
    } else if (presetKey === 'today') {
      if (onPresetChange) {
        onPresetChange('today');
      } else {
        onDateChange(todayStr, todayStr);
      }
    } else if (presetKey === '30d') {
      if (onPresetChange) {
        onPresetChange('30d');
      } else {
        const ref = new Date(todayStr);
        const prior = new Date(ref);
        prior.setDate(prior.getDate() - 30);
        onDateChange(prior.toISOString().split('T')[0], todayStr);
      }
    } else if (presetKey === 'month') {
      setFallbackYear(currentYear);
      onDateChange(currentMonthBounds.from, currentMonthBounds.to);
      onPresetChange?.('custom');
    } else if (presetKey === 'year') {
      const targetYear = effectiveYear !== 'all' ? effectiveYear : currentYear;
      setFallbackYear(targetYear);
      const bounds = getMonthDateBounds(targetYear, 'all');
      onDateChange(bounds.from, bounds.to);
      onPresetChange?.('custom');
    }
  };

  const handleResetClick = () => {
    if (onReset) {
      onReset();
    } else {
      if (onSelectFarm && farms && farms.length > 0) onSelectFarm(farms[0].id);
      if (onSelectFlock) onSelectFlock('all');
      onDateChange('', '');
      onPresetChange?.('all');
    }
  };

  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {/* Left Controls: Farm, Flock, Month & Year, optional LeftSlot, From & To Dates */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* 0. Farm Selector */}
        {showFarmSelector && farms && farms.length > 0 && (
          <div className="relative flex items-center">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-emerald-300 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <select
                value={selectedFarm && selectedFarm !== 'all' ? selectedFarm : farms[0]?.id || 'farm-1'}
                onChange={(e) => {
                  onSelectFarm?.(e.target.value);
                  if (onSelectFlock) onSelectFlock('all');
                }}
                aria-label="Filter by Farm"
                className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.code ? `(${f.code})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 1. Flock / Unit Selector */}
        {showFlockSelector && (
          <div className="relative flex items-center">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-emerald-300 transition-colors">
              <span className="text-sm select-none leading-none">🐔</span>
              <select
                value={selectedFlock}
                onChange={(e) => onSelectFlock?.(e.target.value)}
                aria-label="Filter by Flock"
                className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[145px] sm:max-w-[175px] truncate"
              >
                <option value="all">All Flocks Combined</option>
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 2. Unified Report-Style Month & Year Selectors */}
        <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-slate-500 font-semibold">Month:</span>
          <select
            value={effectiveMonth}
            onChange={(e) => handleMonthSelect(e.target.value)}
            aria-label="Select Month"
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer py-0.5"
          >
            {effectiveMonth === 'custom' && <option value="custom">Custom Range</option>}
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-semibold">Year:</span>
          <select
            value={effectiveYear}
            onChange={(e) => handleYearSelect(e.target.value)}
            aria-label="Select Year"
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer py-0.5"
          >
            <option value="all">All Years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Optional contextual controls (e.g. Reports search / category tabs) */}
        {leftSlot}

        {/* 3. From & To Date Inputs */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              onDateChange(e.target.value, toDate);
              onPresetChange?.('custom');
            }}
            aria-label="From Date"
            className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <span className="text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              onDateChange(fromDate, e.target.value);
              onPresetChange?.('custom');
            }}
            aria-label="To Date"
            className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Presets: Current Month, Full Year, All Time, Last 30 Days, Today, Reset */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => handlePresetButton('month')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
            isCurrentMonthActive
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Current Month
        </button>

        <button
          type="button"
          onClick={() => handlePresetButton('year')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
            isFullYearActive
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Full Year
        </button>

        <button
          type="button"
          onClick={() => handlePresetButton('all')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
            isAllTimeActive
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Time
        </button>

        <button
          type="button"
          onClick={() => handlePresetButton('30d')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
            is30dActive
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Last 30 Days
        </button>

        <button
          type="button"
          onClick={() => handlePresetButton('today')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
            isTodayActive
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={handleResetClick}
          title="Reset filters"
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer ml-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
