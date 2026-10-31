import React, { useState, useMemo, useEffect } from 'react';
import {
  Egg,
  Plus,
  Layers,
  AlertTriangle,
  TrendingUp,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  BarChart2,
  LineChart,
  Percent,
  Info,
  Calendar,
} from 'lucide-react';
import { EggProduction, Flock } from '../types/farm';
import {
  StatCard,
  PageHeader,
  UIButton,
  UISearchInput,
  UIFilterBar,
  TableCard,
  DateRangePickerBar,
  DatePreset,
} from './ui';

interface EggProductionViewProps {
  eggProductions: EggProduction[];
  flocks: Flock[];
  onOpenRecordModal: (type: 'egg') => void;
}

type ChartViewMode = 'shifts' | 'laying-rate' | 'flocks';
type ChartTimeRange = '7d' | '14d' | '30d' | 'all';

export const EggProductionView: React.FC<EggProductionViewProps> = ({
  eggProductions,
  flocks,
  onOpenRecordModal,
}) => {
  const latestDate = useMemo(() => {
    return eggProductions[0]?.date || '2026-10-24';
  }, [eggProductions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preset, setPreset] = useState<DatePreset>('all');

  // Chart Interactive Controls
  const [chartMode, setChartMode] = useState<ChartViewMode>('shifts');
  const [chartRange, setChartRange] = useState<ChartTimeRange>('14d');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // Pagination State - exactly 10 records per page by default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page when any search or filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFlock, fromDate, toDate, preset]);

  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    if (selectedPreset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (selectedPreset === 'today') {
      setFromDate(latestDate);
      setToDate(latestDate);
    } else if (selectedPreset === '30d') {
      const ref = new Date(latestDate);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(latestDate);
    }
  };

  const handleReset = () => {
    setSelectedFlock('all');
    setFromDate('');
    setToDate('');
    setPreset('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filtered productions based on page-level filters
  const filtered = useMemo(() => {
    return eggProductions.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.flockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.date.includes(searchTerm) ||
        String(item.id).includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFlock =
        selectedFlock === 'all' ||
        item.flockId === selectedFlock ||
        item.flockName === selectedFlock;
      const matchesFrom = !fromDate || item.date >= fromDate;
      const matchesTo = !toDate || item.date <= toDate;
      return matchesSearch && matchesFlock && matchesFrom && matchesTo;
    });
  }, [eggProductions, searchTerm, selectedFlock, fromDate, toDate]);

  // Aggregate stats across the full filtered set
  const totalEggs = filtered.reduce((acc, curr) => acc + curr.totalEggs, 0);
  const totalTrays = filtered.reduce((acc, curr) => acc + curr.cleanTrays, 0);
  const totalDamaged = filtered.reduce((acc, curr) => acc + curr.damagedEggs, 0);
  const avgLayingRate =
    filtered.length > 0
      ? (filtered.reduce((acc, curr) => acc + curr.layingRatePercent, 0) / filtered.length).toFixed(1)
      : '0.0';

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedProductions = filtered.slice(startIdx, endIdx);

  // Generate page numbers with smart ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  // Unit-wise egg production stats across authentic loaded records
  const unitEggStats = useMemo(() => {
    const u1 = eggProductions.filter((e) => e.flockId === '8' || e.flockName === 'Unit 1');
    const u2 = eggProductions.filter((e) => e.flockId === '9' || e.flockName === 'Unit 2');
    const u3 = eggProductions.filter((e) => e.flockId === '10' || e.flockName === 'Unit 3');

    return {
      all: {
        eggs: eggProductions.reduce((s, r) => s + r.totalEggs, 0),
        broken: eggProductions.reduce((s, r) => s + r.damagedEggs, 0),
        count: eggProductions.length,
      },
      unit1: {
        eggs: u1.reduce((s, r) => s + r.totalEggs, 0),
        broken: u1.reduce((s, r) => s + r.damagedEggs, 0),
        count: u1.length,
      },
      unit2: {
        eggs: u2.reduce((s, r) => s + r.totalEggs, 0),
        broken: u2.reduce((s, r) => s + r.damagedEggs, 0),
        count: u2.length,
      },
      unit3: {
        eggs: u3.reduce((s, r) => s + r.totalEggs, 0),
        broken: u3.reduce((s, r) => s + r.damagedEggs, 0),
        count: u3.length,
      },
    };
  }, [eggProductions]);

  // --- INTERACTIVE CHART DATA PROCESSING ---
  // Group records by calendar date for continuous day-by-day telemetry
  const dailyChartData = useMemo(() => {
    // 1. Determine base source dataset according to selected flock filter
    const baseList = eggProductions.filter((e) => {
      if (selectedFlock === 'all') return true;
      return e.flockId === selectedFlock || e.flockName === selectedFlock;
    });

    // 2. Aggregate entries by date
    const dateMap = new Map<
      string,
      {
        date: string;
        formattedDate: string;
        dayOfWeek: string;
        totalEggs: number;
        morningEggs: number;
        eveningEggs: number;
        damagedEggs: number;
        cleanTrays: number;
        layingRates: number[];
        unit1Eggs: number;
        unit2Eggs: number;
        unit3Eggs: number;
        logsCount: number;
      }
    >();

    for (const record of baseList) {
      if (!record.date) continue;
      const d = record.date;
      if (!dateMap.has(d)) {
        const dateObj = new Date(d);
        const dayOfWeek = isNaN(dateObj.getTime())
          ? ''
          : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const formattedDate = isNaN(dateObj.getTime())
          ? d
          : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        dateMap.set(d, {
          date: d,
          formattedDate,
          dayOfWeek,
          totalEggs: 0,
          morningEggs: 0,
          eveningEggs: 0,
          damagedEggs: 0,
          cleanTrays: 0,
          layingRates: [],
          unit1Eggs: 0,
          unit2Eggs: 0,
          unit3Eggs: 0,
          logsCount: 0,
        });
      }

      const entry = dateMap.get(d)!;
      entry.totalEggs += record.totalEggs || 0;
      entry.morningEggs += record.morningEggs || 0;
      entry.eveningEggs += record.eveningEggs || 0;
      entry.damagedEggs += record.damagedEggs || 0;
      entry.cleanTrays +=
        record.cleanTrays || Math.floor(((record.totalEggs || 0) - (record.damagedEggs || 0)) / 30);
      if (record.layingRatePercent) {
        entry.layingRates.push(record.layingRatePercent);
      }
      entry.logsCount += 1;

      if (record.flockId === '8' || record.flockName?.includes('1')) {
        entry.unit1Eggs += record.totalEggs || 0;
      } else if (record.flockId === '9' || record.flockName?.includes('2')) {
        entry.unit2Eggs += record.totalEggs || 0;
      } else if (record.flockId === '10' || record.flockName?.includes('3')) {
        entry.unit3Eggs += record.totalEggs || 0;
      }
    }

    // Sort ascending chronologically (left to right)
    const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Slice based on chartRange
    if (chartRange === '7d') {
      return sorted.slice(-7);
    }
    if (chartRange === '14d') {
      return sorted.slice(-14);
    }
    if (chartRange === '30d') {
      return sorted.slice(-30);
    }
    return sorted.slice(-60); // Max 60 for clean SVG rendering
  }, [eggProductions, selectedFlock, chartRange]);

  // Chart Summary Metrics
  const chartMetrics = useMemo(() => {
    if (dailyChartData.length === 0) {
      return {
        peak: 0,
        average: 0,
        morningShare: 0,
        eveningShare: 0,
        meanLayingRate: 0,
      };
    }
    const peak = Math.max(...dailyChartData.map((d) => d.totalEggs));
    const total = dailyChartData.reduce((acc, d) => acc + d.totalEggs, 0);
    const totalMorning = dailyChartData.reduce((acc, d) => acc + d.morningEggs, 0);
    const totalEvening = dailyChartData.reduce((acc, d) => acc + d.eveningEggs, 0);
    const average = Math.round(total / dailyChartData.length);
    const morningShare = total > 0 ? Math.round((totalMorning / total) * 100) : 0;
    const eveningShare = total > 0 ? 100 - morningShare : 0;

    let allRates: number[] = [];
    dailyChartData.forEach((d) => {
      allRates = allRates.concat(d.layingRates);
    });
    const meanLayingRate =
      allRates.length > 0 ? (allRates.reduce((a, b) => a + b, 0) / allRates.length).toFixed(1) : '85.2';

    return {
      peak,
      average,
      morningShare,
      eveningShare,
      meanLayingRate,
    };
  }, [dailyChartData]);

  // Active hovered point details
  const activeTooltipData =
    hoveredDayIdx !== null && dailyChartData[hoveredDayIdx]
      ? dailyChartData[hoveredDayIdx]
      : null;

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Egg Production Management"
        subtitle="Track daily layer output, morning and evening collections, commercial trays packaged (30s), and rejection rates."
        icon={Egg}
        iconColor="amber"
        badge="Active Layer Operations"
        actions={
          <UIButton
            variant="primary"
            icon={Plus}
            onClick={() => onOpenRecordModal('egg')}
          >
            Record Daily Eggs
          </UIButton>
        }
      />

      {/* Unit-Wise Egg Production Overview matching PDF */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Unit-Wise Egg Production Overview
            </h3>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Unit-wise production overview • Click a unit to filter
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => setSelectedFlock('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFlock === 'all'
                ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>All Units</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 font-semibold text-slate-700">
                {unitEggStats.all.count} logs
              </span>
            </div>
            <div className="mt-1 text-base font-black text-slate-900 font-mono">
              {unitEggStats.all.eggs.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Broken: {unitEggStats.all.broken.toLocaleString()} ({((unitEggStats.all.broken / (unitEggStats.all.eggs || 1)) * 100).toFixed(2)}%)
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFlock('8')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFlock === '8' || selectedFlock === 'Unit 1'
                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Unit 1
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                {unitEggStats.unit1.count} logs
              </span>
            </div>
            <div className="mt-1 text-base font-black text-emerald-700 font-mono">
              {unitEggStats.unit1.eggs.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              11.25% of total • {unitEggStats.unit1.broken.toLocaleString()} broken
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFlock('9')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFlock === '9' || selectedFlock === 'Unit 2'
                ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Unit 2
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                {unitEggStats.unit2.count} logs
              </span>
            </div>
            <div className="mt-1 text-base font-black text-blue-700 font-mono">
              {unitEggStats.unit2.eggs.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              82.15% of total • {unitEggStats.unit2.broken.toLocaleString()} broken
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFlock('10')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFlock === '10' || selectedFlock === 'Unit 3'
                ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Unit 3
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                {unitEggStats.unit3.count} logs
              </span>
            </div>
            <div className="mt-1 text-base font-black text-amber-700 font-mono">
              {unitEggStats.unit3.eggs.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              6.60% of total • {unitEggStats.unit3.broken.toLocaleString()} broken
            </div>
          </button>
        </div>
      </div>

      {/* Date Range Picker Bar (🐔 All Flocks Combined | 📅 FROM ... TO ... | Today | 30D | All | ⟳) */}
      <DateRangePickerBar
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flocks={flocks.filter((f) => f.purpose === 'Layers').map((f) => ({ id: f.id, name: f.name }))}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={(from, to) => {
          setFromDate(from);
          setToDate(to);
        }}
        activePreset={preset}
        onPresetChange={handlePresetChange}
        onReset={handleReset}
      />

      {/* ========================================================================= */}
      {/* BRAND NEW INTERACTIVE EGG PRODUCTION YIELD GRAPH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Graph Header with Controls & Quick Metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Interactive Egg Yield &amp; Shift Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily layer output across {selectedFlock === 'all' ? 'All Units' : selectedFlock === '8' ? 'Unit 1' : selectedFlock === '9' ? 'Unit 2' : 'Unit 3'} • Hover columns for shift breakdown
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMode('shifts')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'shifts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Shift Split (AM/PM)</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('laying-rate')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'laying-rate'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Laying Rate (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('flocks')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'flocks'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Flock Comparison</span>
              </button>
            </div>

            {/* Timeframe Scope Selector */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              {(['7d', '14d', '30d', 'all'] as ChartTimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    chartRange === r
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'All Logs' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Analytical KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
            <span className="text-amber-800 font-medium">Peak Daily Output</span>
            <span className="font-mono font-black text-amber-900 text-sm">
              {chartMetrics.peak.toLocaleString()} eggs
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <span className="text-emerald-800 font-medium">Daily Mean Output</span>
            <span className="font-mono font-black text-emerald-900 text-sm">
              {chartMetrics.average.toLocaleString()} eggs
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
            <span className="text-sky-800 font-medium">A.M. vs P.M. Split</span>
            <span className="font-mono font-black text-sky-900 text-sm">
              {chartMetrics.morningShare}% / {chartMetrics.eveningShare}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
            <span className="text-purple-800 font-medium">Mean Laying Rate</span>
            <span className="font-mono font-black text-purple-900 text-sm">
              {chartMetrics.meanLayingRate}% Target
            </span>
          </div>
        </div>

        {/* Interactive SVG Chart Canvas */}
        <div className="relative pt-2">
          {dailyChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Egg className="w-8 h-8 text-slate-300 mb-2" />
              <span>No egg collection records match this timeframe.</span>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <svg
                viewBox="0 0 940 260"
                className="w-full min-w-[700px] h-[260px] overflow-visible"
              >
                {/* Horizontal Gridlines & Y-Axis Scale */}
                {chartMode === 'laying-rate' ? (
                  <>
                    <line x1="50" y1="30" x2="920" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="80" x2="920" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="130" x2="920" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="180" x2="920" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="215" x2="920" y2="215" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Benchmark 80% Commercial Target Line */}
                    <line
                      x1="50"
                      y1="105"
                      x2="920"
                      y2="105"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text x="915" y="100" fontSize="10" fill="#059669" textAnchor="end" fontWeight="bold">
                      80% Commercial Benchmark
                    </text>

                    <text x="42" y="34" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">95%</text>
                    <text x="42" y="84" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">85%</text>
                    <text x="42" y="134" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">75%</text>
                    <text x="42" y="184" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">65%</text>
                    <text x="42" y="218" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">50%</text>
                  </>
                ) : (
                  <>
                    <line x1="50" y1="25" x2="920" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="75" x2="920" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="125" x2="920" y2="125" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="175" x2="920" y2="175" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="50" y1="215" x2="920" y2="215" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Y-axis Labels for Total Daily Eggs */}
                    <text x="42" y="29" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                      {selectedFlock === 'all' ? '80k' : '30k'}
                    </text>
                    <text x="42" y="79" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                      {selectedFlock === 'all' ? '60k' : '22.5k'}
                    </text>
                    <text x="42" y="129" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                      {selectedFlock === 'all' ? '40k' : '15k'}
                    </text>
                    <text x="42" y="179" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                      {selectedFlock === 'all' ? '20k' : '7.5k'}
                    </text>
                    <text x="42" y="218" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                      0
                    </text>
                  </>
                )}

                {/* Bars & Curves rendering */}
                {dailyChartData.map((d, idx) => {
                  const count = dailyChartData.length;
                  const availableWidth = 860;
                  const step = availableWidth / Math.max(1, count);
                  const barWidth = Math.min(36, Math.max(12, step * 0.65));
                  const centerX = 60 + idx * step + step / 2;
                  const startX = centerX - barWidth / 2;

                  const maxCeiling =
                    selectedFlock === 'all' ? 82000 : 32000;
                  const chartHeight = 185;

                  const isHovered = hoveredDayIdx === idx;

                  if (chartMode === 'shifts') {
                    // Morning vs Evening stacked bars
                    const morningH = Math.max(2, (d.morningEggs / maxCeiling) * chartHeight);
                    const eveningH = Math.max(2, (d.eveningEggs / maxCeiling) * chartHeight);
                    const totalH = Math.min(chartHeight, morningH + eveningH);
                    const morningY = 215 - morningH;
                    const eveningY = morningY - eveningH;

                    return (
                      <g
                        key={d.date}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredDayIdx(idx)}
                        onMouseLeave={() => setHoveredDayIdx(null)}
                      >
                        {/* Hover Column Indicator */}
                        {isHovered && (
                          <rect
                            x={centerX - step / 2 + 2}
                            y="15"
                            width={step - 4}
                            height="205"
                            fill="#f59e0b"
                            opacity="0.08"
                            rx="6"
                          />
                        )}

                        {/* Morning Shift (A.M. - Golden Amber) */}
                        <rect
                          x={startX}
                          y={morningY}
                          width={barWidth}
                          height={morningH}
                          fill="#f59e0b"
                          rx="2"
                          className="transition-all"
                        />

                        {/* Evening Shift (P.M. - Sky/Indigo) */}
                        <rect
                          x={startX}
                          y={eveningY}
                          width={barWidth}
                          height={eveningH}
                          fill="#0284c7"
                          rx="2"
                          className="transition-all"
                        />

                        {/* X-Axis Date Label */}
                        <text
                          x={centerX}
                          y="234"
                          fontSize="10"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          fill={isHovered ? '#0f172a' : '#64748b'}
                          textAnchor="middle"
                        >
                          {d.formattedDate}
                        </text>

                        {/* Day of Week */}
                        <text
                          x={centerX}
                          y="247"
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {d.dayOfWeek}
                        </text>
                      </g>
                    );
                  }

                  if (chartMode === 'flocks') {
                    // Flock comparison stacked: Unit 1 (Emerald), Unit 2 (Blue), Unit 3 (Amber)
                    const u1H = Math.max(1, (d.unit1Eggs / maxCeiling) * chartHeight);
                    const u2H = Math.max(1, (d.unit2Eggs / maxCeiling) * chartHeight);
                    const u3H = Math.max(1, (d.unit3Eggs / maxCeiling) * chartHeight);

                    const u1Y = 215 - u1H;
                    const u2Y = u1Y - u2H;
                    const u3Y = u2Y - u3H;

                    return (
                      <g
                        key={d.date}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredDayIdx(idx)}
                        onMouseLeave={() => setHoveredDayIdx(null)}
                      >
                        {isHovered && (
                          <rect
                            x={centerX - step / 2 + 2}
                            y="15"
                            width={step - 4}
                            height="205"
                            fill="#059669"
                            opacity="0.08"
                            rx="6"
                          />
                        )}

                        {/* Unit 1 */}
                        <rect
                          x={startX}
                          y={u1Y}
                          width={barWidth}
                          height={u1H}
                          fill="#059669"
                          rx="2"
                        />
                        {/* Unit 2 */}
                        <rect
                          x={startX}
                          y={u2Y}
                          width={barWidth}
                          height={u2H}
                          fill="#2563eb"
                          rx="2"
                        />
                        {/* Unit 3 */}
                        <rect
                          x={startX}
                          y={u3Y}
                          width={barWidth}
                          height={u3H}
                          fill="#d97706"
                          rx="2"
                        />

                        <text
                          x={centerX}
                          y="234"
                          fontSize="10"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          fill={isHovered ? '#0f172a' : '#64748b'}
                          textAnchor="middle"
                        >
                          {d.formattedDate}
                        </text>
                        <text
                          x={centerX}
                          y="247"
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {d.dayOfWeek}
                        </text>
                      </g>
                    );
                  }

                  // chartMode === 'laying-rate'
                  const avgRate =
                    d.layingRates.length > 0
                      ? d.layingRates.reduce((a, b) => a + b, 0) / d.layingRates.length
                      : 85;
                  // Scale: 50% = y:215, 95% = y:30
                  const rateY = 215 - ((avgRate - 50) / 45) * 185;

                  return (
                    <g
                      key={d.date}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDayIdx(idx)}
                      onMouseLeave={() => setHoveredDayIdx(null)}
                    >
                      {isHovered && (
                        <line
                          x1={centerX}
                          y1="25"
                          x2={centerX}
                          y2="215"
                          stroke="#059669"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Drop bar */}
                      <rect
                        x={centerX - 3}
                        y={rateY}
                        width="6"
                        height={215 - rateY}
                        fill="#059669"
                        opacity="0.3"
                        rx="3"
                      />

                      {/* Data Point */}
                      <circle
                        cx={centerX}
                        cy={rateY}
                        r={isHovered ? 6 : 4}
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all"
                      />

                      <text
                        x={centerX}
                        y="234"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                        fill={isHovered ? '#0f172a' : '#64748b'}
                        textAnchor="middle"
                      >
                        {d.formattedDate}
                      </text>
                      <text
                        x={centerX}
                        y="247"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                      >
                        {avgRate.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Dynamic Rich Hover Tooltip */}
              {activeTooltipData && (
                <div
                  className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[220px]"
                  style={{
                    left: `${Math.min(76, Math.max(4, ((hoveredDayIdx || 0) / Math.max(1, dailyChartData.length)) * 88))}%`,
                    top: '15px',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-bold text-amber-300">
                      {activeTooltipData.formattedDate} ({activeTooltipData.dayOfWeek})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeTooltipData.logsCount} log entries
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-200">
                    <span className="text-slate-300">Total Output:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {activeTooltipData.totalEggs.toLocaleString()} eggs
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-300 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Morning (A.M.):</span>
                    </span>
                    <span className="font-mono font-semibold text-amber-200">
                      {activeTooltipData.morningEggs.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-sky-400" />
                      <span>Evening (P.M.):</span>
                    </span>
                    <span className="font-mono font-semibold text-sky-200">
                      {activeTooltipData.eveningEggs.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-300">
                    <span>Clean Trays (30s):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {activeTooltipData.cleanTrays.toLocaleString()} trays
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-300">
                    <span>Damaged / Cracked:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {activeTooltipData.damagedEggs.toLocaleString()} eggs
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-700 text-slate-300">
                    <span>Laying Efficiency:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {activeTooltipData.layingRates.length > 0
                        ? (activeTooltipData.layingRates.reduce((a, b) => a + b, 0) / activeTooltipData.layingRates.length).toFixed(1)
                        : '85.0'}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {chartMode === 'shifts' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-slate-600 font-medium">Morning Shift (A.M.)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-sky-600" />
                    <span className="text-slate-600 font-medium">Evening Shift (P.M.)</span>
                  </div>
                </>
              )}

              {chartMode === 'flocks' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-600" />
                    <span className="text-slate-600 font-medium">Unit 1</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-blue-600" />
                    <span className="text-slate-600 font-medium">Unit 2</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-amber-600" />
                    <span className="text-slate-600 font-medium">Unit 3</span>
                  </div>
                </>
              )}

              {chartMode === 'laying-rate' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-slate-600 font-medium">Daily Lay Rate (%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600" />
                    <span className="text-slate-600 font-medium">80% Commercial Target</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Hover any day to inspect exact shift yields &amp; trays</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Eggs Collected"
          value={totalEggs}
          unit="Eggs"
          icon={Egg}
          color="amber"
          badge={{ text: `${filtered.length} Total Logs`, color: 'amber' }}
          subtext="Morning & evening collections in period"
        />

        <StatCard
          title="Commercial Trays & Cartons"
          value={totalTrays}
          unit="Trays"
          icon={Layers}
          color="emerald"
          valueColor="text-emerald-700"
          badge={{ text: `${Math.round(totalTrays / 12).toLocaleString()} Cartons`, color: 'emerald' }}
          subtext={`${Math.round(totalTrays / 12).toLocaleString()} standard cartons (360 eggs/ctn)`}
        />

        <StatCard
          title="Total Rejections / Cracked"
          value={totalDamaged}
          unit="Eggs"
          icon={AlertTriangle}
          color="rose"
          valueColor="text-rose-600"
          badge={{
            text: `${((totalDamaged / (totalEggs || 1)) * 100).toFixed(2)}%`,
            color: 'rose',
          }}
          subtext="Breakage within tolerance"
        />

        <StatCard
          title="Average Laying Rate"
          value={`${avgLayingRate}%`}
          icon={TrendingUp}
          color="blue"
          badge={{ text: 'Target 80%+', color: 'blue' }}
          trend={{ value: `${avgLayingRate}% efficiency`, isUp: Number(avgLayingRate) >= 80 }}
          subtext="Across active layer sheds"
        />
      </div>

      {/* Secondary Search & Count Filter Bar */}
      <UIFilterBar>
        <UISearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by ID (#376), flock, date, or notes..."
          containerClassName="w-full sm:w-80"
        />

        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
          <span>
            Showing <span className="font-bold text-slate-800">{filtered.length}</span> total recorded collections
          </span>
          <div className="flex items-center space-x-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </UIFilterBar>

      {/* Standardized Production Records Table Card with Pagination */}
      <TableCard
        title="Production Records by Flock & Shed"
        subtitle="Individual morning and evening egg count and grade records"
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
            {filtered.length} Total Records
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-20">Tracking ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Flock / Shed</th>
                <th className="py-3 px-4 text-right">Morning (A.M.)</th>
                <th className="py-3 px-4 text-right">Evening (P.M.)</th>
                <th className="py-3 px-4 text-right">Total Eggs</th>
                <th className="py-3 px-4 text-right">Clean Trays</th>
                <th className="py-3 px-4 text-right">Broken</th>
                <th className="py-3 px-4 text-center">Laying %</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProductions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No egg production records match the selected date range and filters.
                  </td>
                </tr>
              ) : (
                paginatedProductions.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                        #{entry.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {entry.flockName}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      {entry.morningEggs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      {entry.eveningEggs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-800 font-mono">
                      {entry.totalEggs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700 font-mono">
                      {entry.cleanTrays.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-rose-600 font-mono">
                      {entry.damagedEggs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        {entry.layingRatePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 gap-3">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">{filtered.length === 0 ? 0 : startIdx + 1}</span>{' '}
              to{' '}
              <span className="font-bold text-slate-800">{Math.min(endIdx, filtered.length)}</span>{' '}
              of <span className="font-bold text-slate-800">{filtered.length}</span> records
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1 px-1">
                {pageNumbers.map((p, i) =>
                  typeof p === 'number' ? (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        validCurrentPage === p
                          ? 'bg-amber-600 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`ellipsis-${i}`} className="px-1 text-slate-400">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </TableCard>
    </div>
  );
};
