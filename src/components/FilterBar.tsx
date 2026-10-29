import React from 'react';
import { Search, Calendar, ChevronDown, RotateCcw, Filter, Layers, X } from 'lucide-react';
import { Flock } from '../types/farm';

export interface FilterBarProps {
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;

  // Flock Picker
  flocks?: Flock[];
  selectedFlock?: string;
  onSelectFlock?: (flockId: string) => void;
  flockLabel?: string;
  allFlocksLabel?: string;
  filterLayersOnly?: boolean;

  // Date Pickers
  startDate?: string;
  onSelectStartDate?: (date: string) => void;
  endDate?: string;
  onSelectEndDate?: (date: string) => void;
  showDatePickers?: boolean;

  // Custom Category Picker (optional, e.g. for Finance or Stocks)
  categories?: { label: string; value: string }[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  categoryLabel?: string;

  // Status & Counts
  totalCount?: number;
  filteredCount?: number;
  itemTypeLabel?: string;
  onResetFilters?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  flocks,
  selectedFlock,
  onSelectFlock,
  flockLabel = 'Filter Flock',
  allFlocksLabel = 'All Flocks (All Sheds)',
  filterLayersOnly = false,
  startDate = '',
  onSelectStartDate,
  endDate = '',
  onSelectEndDate,
  showDatePickers = true,
  categories,
  selectedCategory,
  onSelectCategory,
  categoryLabel = 'Category',
  totalCount,
  filteredCount,
  itemTypeLabel = 'records',
  onResetFilters,
}) => {
  const isFiltered = Boolean(
    (searchTerm && searchTerm.trim() !== '') ||
    (selectedFlock && selectedFlock !== 'all') ||
    (startDate && startDate !== '') ||
    (endDate && endDate !== '') ||
    (selectedCategory && selectedCategory !== 'all')
  );

  // Quick Date Presets calculation
  const setDatePreset = (preset: 'all' | 'today' | 'last7' | 'last30' | 'thisMonth') => {
    if (!onSelectStartDate || !onSelectEndDate) return;

    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      onSelectStartDate('');
      onSelectEndDate('');
    } else if (preset === 'today') {
      const today = formatDate(now);
      onSelectStartDate(today);
      onSelectEndDate(today);
    } else if (preset === 'last7') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      onSelectStartDate(formatDate(past7));
      onSelectEndDate(formatDate(now));
    } else if (preset === 'last30') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      onSelectStartDate(formatDate(past30));
      onSelectEndDate(formatDate(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      onSelectStartDate(formatDate(firstDay));
      onSelectEndDate(formatDate(now));
    }
  };

  const activeFlocks = flocks
    ? filterLayersOnly
      ? flocks.filter((f) => f.purpose === 'Layers')
      : flocks
    : [];

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
      {/* Primary Filter Controls Row */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap items-end gap-3 flex-1 min-w-[280px]">
          {/* Keyword Search */}
          {onSearchChange && (
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Quick Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-emerald-500 rounded-lg pl-8 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Flock Selector */}
          {flocks && onSelectFlock && (
            <div className="min-w-[190px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                <Layers className="w-3 h-3 text-emerald-600" />
                <span>{flockLabel}</span>
              </label>
              <div className="relative">
                <select
                  value={selectedFlock || 'all'}
                  onChange={(e) => onSelectFlock(e.target.value)}
                  aria-label={flockLabel}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-3 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none transition-colors"
                >
                  <option value="all">{allFlocksLabel}</option>
                  {activeFlocks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.shedNumber} • {f.currentCount.toLocaleString()} birds)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Optional Category Selector */}
          {categories && onSelectCategory && (
            <div className="min-w-[150px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {categoryLabel}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory || 'all'}
                  onChange={(e) => onSelectCategory(e.target.value)}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-3 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none transition-colors"
                >
                  <option value="all">All {categoryLabel}s</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Date Pickers: From & To */}
          {showDatePickers && onSelectStartDate && onSelectEndDate && (
            <div className="flex items-end space-x-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>From Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onSelectStartDate(e.target.value)}
                  className="h-9 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>To Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onSelectEndDate(e.target.value)}
                  className="h-9 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="h-9 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer self-end"
            title="Clear all active filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Quick Presets & Status Counter Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Quick Date Range Preset Buttons */}
        {showDatePickers && onSelectStartDate && onSelectEndDate && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => setDatePreset('all')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                !startDate && !endDate
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('today')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                startDate && startDate === endDate
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('last7')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('last30')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('thisMonth')}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              This Month
            </button>
          </div>
        )}

        {/* Counter Info */}
        <div className="text-slate-500 text-[11px] font-medium flex items-center space-x-1.5 ml-auto">
          {isFiltered && (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
          <span>
            {filteredCount !== undefined && totalCount !== undefined ? (
              <>
                Showing <strong className="text-slate-800">{filteredCount}</strong> of{' '}
                <strong className="text-slate-800">{totalCount}</strong> {itemTypeLabel}
              </>
            ) : filteredCount !== undefined ? (
              <>
                <strong className="text-slate-800">{filteredCount}</strong> {itemTypeLabel} found
              </>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
};
