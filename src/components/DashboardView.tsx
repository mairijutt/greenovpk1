import React, { useState, useMemo } from 'react';
import {
  Egg,
  Layers,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Thermometer,
  Droplets,
  DollarSign,
  Plus,
  Boxes,
  Truck,
  Scale,
  Package,
  CreditCard,
  Banknote,
  CheckCircle,
  Building2,
  Activity,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { Farm, Flock, EggProduction, MortalityLog, FeedConsumption, FinancialRecord } from '../types/farm.ts';
import { DateRangePickerBar, DatePreset } from './ui';
import {
  SALES_SUMMARY,
  unitWiseSalesSummary,
  liveSalesRecords,
} from '../data/liveSales.ts';
import {
  EGG_PRODUCTION_SUMMARY,
  unitWiseEggSummary,
  liveEggProductions,
} from '../data/liveEggProductions.ts';
import {
  STOCK_SUMMARY,
  unitWiseStockSummary,
  liveStockRecords,
} from '../data/liveStocks.ts';
import {
  EXPENSE_HEADS_21,
  unitWiseExpenseSummary,
  liveExpenseBreakdown,
} from '../data/liveExpenses.ts';

interface DashboardViewProps {
  farms: Farm[];
  flocks: Flock[];
  eggProductions: EggProduction[];
  mortalityLogs: MortalityLog[];
  consumptionLogs: FeedConsumption[];
  financials: FinancialRecord[];
  onOpenRecordModal: (type: 'egg' | 'mortality' | 'feed') => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  farms,
  flocks,
  eggProductions,
  mortalityLogs,
  consumptionLogs,
  financials,
  onOpenRecordModal,
  onNavigateTab,
}) => {
  // Official latest operational date in the farm ledger
  const latestDate = '2026-10-24';

  // Date and Flock filter state - default to 'today' so user immediately sees today's live data
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [fromDate, setFromDate] = useState(latestDate);
  const [toDate, setToDate] = useState(latestDate);
  const [preset, setPreset] = useState<DatePreset>('today');

  // Interactive Graph States
  const [hoveredFinanceMonth, setHoveredFinanceMonth] = useState<number | null>(null);
  const [hoveredEggDay, setHoveredEggDay] = useState<number | null>(null);
  const [hoveredConsumptionIndex, setHoveredConsumptionIndex] = useState<number | null>(null);
  const [hoveredStockMonth, setHoveredStockMonth] = useState<number | null>(null);
  const [financeViewMode, setFinanceViewMode] = useState<'today' | 'monthly'>(preset === 'today' ? 'today' : 'monthly');

  // Handle preset selection
  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    if (selectedPreset === 'all') {
      setFromDate('');
      setToDate('');
      setFinanceViewMode('monthly');
    } else if (selectedPreset === 'today') {
      setFromDate(latestDate);
      setToDate(latestDate);
      setFinanceViewMode('today');
    } else if (selectedPreset === '30d') {
      const ref = new Date(latestDate);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(latestDate);
      setFinanceViewMode('monthly');
    }
  };

  const handleReset = () => {
    setSelectedFlock('all');
    setFromDate(latestDate);
    setToDate(latestDate);
    setPreset('today');
    setFinanceViewMode('today');
  };

  // Helper to match flock selection against any record's ID or name
  const isFlockMatch = (itemFlockId: string | number | undefined, itemFlockName: string | undefined) => {
    if (selectedFlock === 'all') return true;
    const target = selectedFlock.toLowerCase();
    const fidStr = String(itemFlockId || '').toLowerCase();
    const fNameStr = String(itemFlockName || '').toLowerCase();
    if (target === '8' || target === 'unit 1') return fidStr === '8' || fNameStr.includes('unit 1');
    if (target === '9' || target === 'unit 2') return fidStr === '9' || fNameStr.includes('unit 2');
    if (target === '10' || target === 'unit 3') return fidStr === '10' || fNameStr.includes('unit 3');
    return fidStr === target || fNameStr.includes(target);
  };

  // Helper to match date range
  const isDateMatch = (dateStr: string | undefined) => {
    if (!dateStr) return true;
    const d = dateStr.split('T')[0];
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  // --- DYNAMICALLY FILTERED DATASETS BASED ON DATE RANGE & FLOCK ---
  const activeEggLogs = useMemo(() => {
    return liveEggProductions.filter((e) => {
      const matchFlock = isFlockMatch(e.flockId, e.flockName);
      const matchDate = isDateMatch(e.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate]);

  const activeSales = useMemo(() => {
    return liveSalesRecords.filter((s) => {
      const matchFlock = isFlockMatch(s.flockId, s.flock);
      const matchDate = isDateMatch(s.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate]);

  const activeStocks = useMemo(() => {
    return liveStockRecords.filter((s) => {
      const matchFlock = isFlockMatch(s.flockId, s.flockName);
      const matchDate = isDateMatch(s.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate]);

  // --- DYNAMIC SECTION METRICS ---

  // 1. Production Metrics
  const dynamicEggs = useMemo(() => {
    const totalEggs = activeEggLogs.reduce((sum, e) => sum + (e.totalEggs || 0), 0);
    const morningEggs = activeEggLogs.reduce((sum, e) => sum + (e.morningEggs || 0), 0);
    const eveningEggs = activeEggLogs.reduce((sum, e) => sum + (e.eveningEggs || 0), 0);
    const brokenEggs = activeEggLogs.reduce((sum, e) => sum + (e.damagedEggs || e.brokenEggs || 0), 0);
    const cleanTrays = activeEggLogs.reduce(
      (sum, e) => sum + (e.cleanTrays || Math.floor((e.totalEggs - (e.damagedEggs || 0)) / 30)),
      0
    );
    const avgLaying =
      activeEggLogs.length > 0
        ? (activeEggLogs.reduce((sum, e) => sum + (e.layingRatePercent || 0), 0) / activeEggLogs.length).toFixed(1)
        : '0.0';
    return { totalEggs, morningEggs, eveningEggs, brokenEggs, cleanTrays, avgLaying, count: activeEggLogs.length };
  }, [activeEggLogs]);

  // 2. Financial Metrics
  const dynamicFinance = useMemo(() => {
    const revenue = activeSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const itemsSold = activeSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const online = activeSales.reduce((sum, s) => sum + (s.onlinePayment || 0), 0);
    const cash = activeSales.reduce((sum, s) => sum + (s.cashPayment || 0), 0);

    // Expense: if 'all', Rs. 361.65M; if 'today', stock delivery or estimated daily expense
    let expenses = 0;
    if (preset === 'all') {
      if (selectedFlock === 'all') {
        expenses = 361653128.6;
      } else if (selectedFlock === 'Unit 1' || selectedFlock === '8') {
        expenses = unitWiseExpenseSummary['Unit 1']?.amount || 66172253;
      } else if (selectedFlock === 'Unit 2' || selectedFlock === '9') {
        expenses = unitWiseExpenseSummary['Unit 2']?.amount || 243997005.6;
      } else {
        expenses = unitWiseExpenseSummary['Unit 3']?.amount || 51483870;
      }
    } else {
      // For today/filtered range: sum stock amounts in period + operational running costs
      const stockExpense = activeStocks.reduce((sum, s) => sum + (s.amount || 0), 0);
      expenses = stockExpense > 0 ? stockExpense : activeEggLogs.length * 3500;
    }

    const net = revenue - expenses;
    return { revenue, itemsSold, online, cash, expenses, net, salesCount: activeSales.length };
  }, [activeSales, activeStocks, activeEggLogs, preset, selectedFlock]);

  // 3. Consumption Metrics
  const dynamicConsumption = useMemo(() => {
    if (preset === 'today') {
      if (selectedFlock === 'Unit 1' || selectedFlock === '8') {
        return { bags: 58, feedKg: 2900, waterL: 6400, fcr: 1.46, intakeGrams: 117 };
      }
      if (selectedFlock === 'Unit 2' || selectedFlock === '9') {
        return { bags: 75, feedKg: 3750, waterL: 8500, fcr: 1.48, intakeGrams: 118 };
      }
      if (selectedFlock === 'Unit 3' || selectedFlock === '10') {
        return { bags: 62, feedKg: 3100, waterL: 6900, fcr: 1.47, intakeGrams: 119 };
      }
      return { bags: 195, feedKg: 9750, waterL: 21800, fcr: 1.47, intakeGrams: 118 };
    }
    // All-time or period
    if (selectedFlock === 'Unit 1' || selectedFlock === '8') {
      return { bags: 7840, feedKg: 392000, waterL: 878000, fcr: 1.47, intakeGrams: 117 };
    }
    if (selectedFlock === 'Unit 2' || selectedFlock === '9') {
      return { bags: 34245, feedKg: 1712250, waterL: 3835000, fcr: 1.48, intakeGrams: 118 };
    }
    if (selectedFlock === 'Unit 3' || selectedFlock === '10') {
      return { bags: 6310, feedKg: 315500, waterL: 707000, fcr: 1.47, intakeGrams: 119 };
    }
    return { bags: 48395, feedKg: 2419750, waterL: 5420000, fcr: 1.48, intakeGrams: 118 };
  }, [preset, selectedFlock]);

  // 4. Stock Metrics
  const dynamicStock = useMemo(() => {
    const totalBags = activeStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalAmount = activeStocks.reduce((sum, s) => sum + (s.amount || 0), 0);
    return {
      bags: totalBags,
      amount: totalAmount,
      shipments: activeStocks.length,
      warehouseBuffer: 2150,
      traysBuffer: 42500,
    };
  }, [activeStocks]);

  // Active bird population in selected scope
  const liveBirdsCount = useMemo(() => {
    if (selectedFlock === 'Unit 1' || selectedFlock === '8') return 24786;
    if (selectedFlock === 'Unit 2' || selectedFlock === '9') return 31739;
    if (selectedFlock === 'Unit 3' || selectedFlock === '10') return 25189;
    return 81714;
  }, [selectedFlock]);

  // Dynamic Per Bird Economics Calculation (Revenue, Expense, Margin per bird)
  const perBirdEconomics = useMemo(() => {
    const birds = liveBirdsCount > 0 ? liveBirdsCount : 81714;
    if (preset === 'today') {
      const revPerBird = Number((dynamicFinance.revenue / birds).toFixed(2));
      // daily feed intake cost: ~118g @ ~Rs. 117/kg -> ~Rs. 13.80 / bird / day
      const expPerBird = Number(((dynamicConsumption.feedKg * 117) / birds).toFixed(2));
      const netPerBird = Number((revPerBird - expPerBird).toFixed(2));
      const eggsPerBird = Number((dynamicEggs.totalEggs / birds).toFixed(2));
      return {
        revenuePerBird: revPerBird,
        expensePerBird: expPerBird,
        netPerBird,
        eggsPerBird,
        feedKgPerBird: Number((dynamicConsumption.feedKg / birds).toFixed(3)),
      };
    }
    const revPerBird = Math.round(dynamicFinance.revenue / birds);
    const expPerBird = Math.round(dynamicFinance.expenses / birds);
    const netPerBird = revPerBird - expPerBird;
    const eggsPerBird = Math.round(dynamicEggs.totalEggs / birds);
    return {
      revenuePerBird: revPerBird,
      expensePerBird: expPerBird,
      netPerBird,
      eggsPerBird,
      feedCostPerBird: Math.round(276471321 / birds),
    };
  }, [liveBirdsCount, dynamicFinance, dynamicConsumption, dynamicEggs, preset]);

  // 3-Unit Telemetry cards with exact TODAY output vs ALL-TIME output
  const unitCards = [
    {
      unit: 'Unit 1',
      id: '8',
      shed: 'Shed 1',
      breed: 'Lohmann Brown (LSL)',
      birds: 24786,
      capacity: 25000,
      temperature: 23.8,
      humidity: 62,
      todayEggs: 22260,
      todayMorning: 13832,
      todayEvening: 8428,
      todayTrays: 742,
      todayDamaged: 0,
      todayLayingRate: 89.8,
      todayRevenue: 95500,
      todaySalesCount: 4,
      todayRevPerBird: '3.85',
      todayExpPerBird: '13.92',
      allTimeProduction: 1931280,
      allTimeTrays: 64237,
      allTimeLayingRate: 84.6,
      allTimeFeedBags: 7840,
      allTimeRevenue: 29798926,
      allTimeRevPerBird: '1,202',
      allTimeExpPerBird: '1,871',
      status: 'Tunnel Ventilation Active · Bank 1 Online',
      statusColor: 'emerald',
    },
    {
      unit: 'Unit 2',
      id: '9',
      shed: 'Shed 2',
      breed: 'Lohmann Brown (Primary)',
      birds: 31739,
      capacity: 35000,
      temperature: 24.2,
      humidity: 59,
      todayEggs: 25860,
      todayMorning: 16066,
      todayEvening: 9794,
      todayTrays: 861,
      todayDamaged: 30,
      todayLayingRate: 81.5,
      todayRevenue: 64150,
      todaySalesCount: 5,
      todayRevPerBird: '2.02',
      todayExpPerBird: '14.01',
      allTimeProduction: 14103090,
      allTimeTrays: 468504,
      allTimeLayingRate: 86.4,
      allTimeFeedBags: 34245,
      allTimeRevenue: 266379294,
      allTimeRevPerBird: '8,393',
      allTimeExpPerBird: '6,290',
      status: 'Cooling Pads Active · 200 Bags Delivered',
      statusColor: 'emerald',
    },
    {
      unit: 'Unit 3',
      id: '10',
      shed: 'Shed 3',
      breed: 'Hy-Line W-36 Batch',
      birds: 25189,
      capacity: 25500,
      temperature: 24.0,
      humidity: 64,
      todayEggs: 20550,
      todayMorning: 12741,
      todayEvening: 7809,
      todayTrays: 685,
      todayDamaged: 0,
      todayLayingRate: 81.6,
      todayRevenue: 346000,
      todaySalesCount: 2,
      todayRevPerBird: '13.74',
      todayExpPerBird: '13.93',
      allTimeProduction: 1133820,
      allTimeTrays: 37683,
      allTimeLayingRate: 83.9,
      allTimeFeedBags: 6310,
      allTimeRevenue: 16601857,
      allTimeRevPerBird: '659',
      allTimeExpPerBird: '2,073',
      status: 'Airflow 2.1 m/s · Negative Pressure OK',
      statusColor: 'emerald',
    },
  ];

  // Month-by-month financial ledger (Apr – Oct 2026)
  const monthlyFinanceData = [
    { month: 'Apr 2026', short: 'Apr', income: 191845900, expense: 196840320, net: -4994420 },
    { month: 'May 2026', short: 'May', income: 21450200, expense: 26890450, net: -5440250 },
    { month: 'Jun 2026', short: 'Jun', income: 24180400, expense: 29750120, net: -5569720 },
    { month: 'Jul 2026', short: 'Jul', income: 23620900, expense: 31200400, net: -7579500 },
    { month: 'Aug 2026', short: 'Aug', income: 24510300, expense: 33450900, net: -8940600 },
    { month: 'Sep 2026', short: 'Sep', income: 22765100, expense: 28910400, net: -6145300 },
    { month: 'Oct 2026', short: 'Oct', income: 4407277, expense: 14610538.6, net: -10203261.6 },
  ];

  // Selected flock label for titles
  const scopeLabel = useMemo(() => {
    if (selectedFlock === 'all') return 'All Flocks Combined';
    if (selectedFlock === 'Unit 1' || selectedFlock === '8') return 'Unit 1 (Shed 1)';
    if (selectedFlock === 'Unit 2' || selectedFlock === '9') return 'Unit 2 (Shed 2)';
    if (selectedFlock === 'Unit 3' || selectedFlock === '10') return 'Unit 3 (Shed 3)';
    return selectedFlock;
  }, [selectedFlock]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {preset === 'today' ? `Operational Date: 24 Oct 2026 (Today)` : `Date Scope: ${fromDate || 'Start'} to ${toDate || 'Latest'}`}
            </span>
            <span>•</span>
            <span className="font-bold text-white">{scopeLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Intelligence Poultry Management System
          </h1>
          <p className="mt-1 text-sm sm:text-base font-bold text-emerald-400 tracking-wide">
            Smarter Poultry. Stronger Profits.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            A modern, AI-ready brand for a platform that helps poultry businesses monitor performance, control costs, and make data-driven decisions.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onOpenRecordModal('egg')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Daily Eggs</span>
            </button>
            <button
              onClick={() => onOpenRecordModal('feed')}
              className="bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              + Log Feed &amp; Water
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-600/40 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>View Audit Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Date & Flock Filter Bar */}
      <DateRangePickerBar
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flocks={flocks.map((f) => ({ id: f.id, name: f.name }))}
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

      {/* Active Filter Period Context Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="font-black uppercase tracking-wider text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
            Active Scope
          </span>
          <span className="font-bold text-emerald-900">
            {preset === 'today' ? 'Today: 24 Oct 2026' : preset === '30d' ? 'Last 30 Days' : preset === 'all' ? 'All-Time Records' : `${fromDate} to ${toDate}`}
          </span>
          <span className="text-emerald-400">•</span>
          <span className="font-semibold text-slate-800">Flock: {scopeLabel}</span>
          <span className="text-emerald-400">•</span>
          <span className="text-slate-600 font-medium">Population: {liveBirdsCount.toLocaleString()} birds</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {preset !== 'today' && (
            <button
              onClick={() => handlePresetChange('today')}
              className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Switch to Today
            </button>
          )}
          {preset !== 'all' && (
            <button
              onClick={() => handlePresetChange('all')}
              className="font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              View All-Time
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FINANCIAL OVERVIEW, INCOME VS EXPENSES & 3-UNIT CARDS */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                1. Financial Section &amp; 3-Unit Environmental Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's revenue, disbursements, and climate sensors for ${scopeLabel}`
                : `Period financial balance and environmental cards for ${scopeLabel}`}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Sales Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Financial KPI Cards - Dynamically reflects Today vs Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {preset === 'today' ? "Today's Sales Revenue" : 'Period Sales Revenue'}
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-700 font-mono">
              Rs. {Math.round(dynamicFinance.revenue).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span className="font-semibold text-emerald-700 mr-1">
                {dynamicFinance.salesCount} Sales
              </span>
              <span>• {dynamicFinance.itemsSold.toLocaleString()} Items Sold</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {preset === 'today' ? "Today's Disbursements" : 'Period Farm Expenses'}
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              Rs. {Math.round(dynamicFinance.expenses).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span className="font-semibold text-rose-600 mr-1">
                {preset === 'today' ? 'Feed Stock / Operational' : '1,241 Vouchers'}
              </span>
              <span>• {scopeLabel}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {preset === 'today' ? "Today's Net Balance" : 'Net Operating Position'}
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-black font-mono ${
                dynamicFinance.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {dynamicFinance.net < 0 ? '-' : ''}Rs. {Math.abs(Math.round(dynamicFinance.net)).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span>{dynamicFinance.net >= 0 ? 'Operational Surplus' : 'Gross Procurement Adjusted'}</span>
            </div>
          </div>

          {/* Dedicated One Bird Expense & Revenue Details Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-teal-400 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {preset === 'today' ? "1 Bird Today Economics" : "1 Bird Economics"}
              </span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-800 font-mono">
              Rs. {perBirdEconomics.revenuePerBird.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">rev/bird</span>
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Expense / Bird:</span>
                <span className="font-mono font-bold text-rose-600">
                  Rs. {perBirdEconomics.expensePerBird.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Net Margin / Bird:</span>
                <span
                  className={`font-mono font-bold ${
                    perBirdEconomics.netPerBird >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {perBirdEconomics.netPerBird < 0 ? '-' : ''}Rs. {Math.abs(perBirdEconomics.netPerBird).toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                <span>Egg Output:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {perBirdEconomics.eggsPerBird} eggs/bird
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Payment Channels</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-bold text-slate-800 font-mono">
              Cash: Rs. {Math.round(dynamicFinance.cash).toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-purple-700 font-mono font-semibold">
              Online: Rs. {Math.round(dynamicFinance.online).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Interactive Income vs Expenses Graph (adapts between Today distribution & Monthly timeline) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {preset === 'today' && financeViewMode === 'today'
                  ? "Today's Commercial Revenue Distribution by Unit (24 Oct 2026)"
                  : 'Commercial Revenue vs. Expenses Timeline (April – October 2026)'}
              </h3>
              <p className="text-xs text-slate-500">
                {preset === 'today' && financeViewMode === 'today'
                  ? 'Breakdown of sales revenue and payment modes collected today'
                  : 'Hover columns to inspect monthly cash flow, disbursements, and net operating delta'}
              </p>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFinanceViewMode('today')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    financeViewMode === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Today's Split
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceViewMode('monthly')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    financeViewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Monthly Timeline
                </button>
              </div>
            </div>
          </div>

          {financeViewMode === 'today' ? (
            /* TODAY'S REVENUE DISTRIBUTION BARS ACROSS UNITS */
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Unit 1 (Shed 1)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                      4 Sales
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-800 font-mono mt-1">
                    Rs. 95,500
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    5,520 Eggs sold • Online: Rs. 31.5k | Cash: Rs. 64k
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-2xs bg-amber-50/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">Unit 2 (Shed 2)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      5 Sales
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-800 font-mono mt-1">
                    Rs. 64,150
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    3,840 Eggs sold • Online: Rs. 29.4k | Cash: Rs. 34.75k
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Unit 3 (Shed 3)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      2 Sales
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-800 font-mono mt-1">
                    Rs. 346,000
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    21,660 Eggs sold • 100% Cash Counter
                  </div>
                </div>
              </div>

              {/* Progress visualizer of Today's total Rs. 505,650 */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Today's Total Egg Turnover: Rs. 505,650</span>
                  <span>31,020 Total Eggs Dispatched</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  <div style={{ width: '18.9%' }} className="bg-blue-600" title="Unit 1: 18.9%"></div>
                  <div style={{ width: '12.7%' }} className="bg-amber-500" title="Unit 2: 12.7%"></div>
                  <div style={{ width: '68.4%' }} className="bg-emerald-600" title="Unit 3: 68.4%"></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span> Unit 1 (18.9%)</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Unit 2 (12.7%)</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-600 mr-1"></span> Unit 3 (68.4%)</span>
                </div>
              </div>
            </div>
          ) : (
            /* MONTHLY INCOME VS EXPENSE TIMELINE SVG CHART */
            <div className="relative w-full h-64 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
              <svg className="w-full h-full" viewBox="0 0 700 220" preserveAspectRatio="none">
                <line x1="40" y1="20" x2="680" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="680" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="680" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="170" x2="680" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                <text x="35" y="24" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">Rs.200M</text>
                <text x="35" y="74" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">Rs.100M</text>
                <text x="35" y="124" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">Rs.50M</text>
                <text x="35" y="174" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">0</text>

                {monthlyFinanceData.map((item, idx) => {
                  const maxVal = 210000000;
                  const colWidth = 70;
                  const startX = 65 + idx * 88;
                  const incHeight = Math.max(4, (item.income / maxVal) * 150);
                  const expHeight = Math.max(4, (item.expense / maxVal) * 150);
                  const incY = 170 - incHeight;
                  const expY = 170 - expHeight;
                  const isHovered = hoveredFinanceMonth === idx;

                  return (
                    <g
                      key={item.month}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredFinanceMonth(idx)}
                      onMouseLeave={() => setHoveredFinanceMonth(null)}
                    >
                      {isHovered && (
                        <rect
                          x={startX - 10}
                          y="15"
                          width={colWidth + 20}
                          height="160"
                          fill="#059669"
                          opacity="0.08"
                          rx="8"
                        />
                      )}
                      <rect
                        x={startX}
                        y={incY}
                        width="26"
                        height={incHeight}
                        fill="#059669"
                        rx="3"
                        className="transition-all hover:opacity-90"
                      />
                      <rect
                        x={startX + 30}
                        y={expY}
                        width="26"
                        height={expHeight}
                        fill="#f43f5e"
                        rx="3"
                        className="transition-all hover:opacity-90"
                      />
                      <text
                        x={startX + 28}
                        y="192"
                        fontSize="11"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                        fill={isHovered ? '#0f172a' : '#64748b'}
                        textAnchor="middle"
                      >
                        {item.short}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {hoveredFinanceMonth !== null && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]"
                  style={{
                    left: `${Math.min(75, 12 + hoveredFinanceMonth * 12)}%`,
                    top: '10px',
                  }}
                >
                  <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                    {monthlyFinanceData[hoveredFinanceMonth].month} Ledger Summary
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>Income:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Rs. {monthlyFinanceData[hoveredFinanceMonth].income.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>Expense:</span>
                    <span className="font-mono font-bold text-rose-400">
                      Rs. {monthlyFinanceData[hoveredFinanceMonth].expense.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-700 text-slate-300">
                    <span>Net Difference:</span>
                    <span className="font-mono font-bold text-amber-400">
                      Rs. {monthlyFinanceData[hoveredFinanceMonth].net.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3 UNITS PRODUCTION & TEMPERATURE CARDS - REACTIVE TO TODAY */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Unit Environmental &amp; Production Telemetry (Unit 1, Unit 2, Unit 3)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {preset === 'today' ? 'Displaying output for 24 Oct 2026' : 'Displaying period totals'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unitCards.map((unit) => {
              const isSelected =
                selectedFlock === unit.unit ||
                selectedFlock === unit.id ||
                selectedFlock === 'all';

              const displayEggs =
                preset === 'today' ? unit.todayEggs : unit.allTimeProduction;
              const displayTrays =
                preset === 'today' ? unit.todayTrays : unit.allTimeTrays;
              const displayLayRate =
                preset === 'today' ? unit.todayLayingRate : unit.allTimeLayingRate;
              const displayRevenue =
                preset === 'today' ? unit.todayRevenue : unit.allTimeRevenue;

              return (
                <div
                  key={unit.unit}
                  onClick={() => setSelectedFlock(selectedFlock === unit.unit ? 'all' : unit.unit)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedFlock === unit.unit || selectedFlock === unit.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/10'
                      : 'border-slate-200 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black text-slate-900">{unit.unit}</span>
                          <span className="text-xs text-slate-500">({unit.shed})</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{unit.breed}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedFlock === unit.unit || selectedFlock === unit.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedFlock === unit.unit ? 'Selected Focus' : `${unit.birds.toLocaleString()} Birds`}
                      </span>
                    </div>

                    {/* Live Temperature & Humidity Sensor Gauges */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Shed Temp</div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {unit.temperature}°C
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Humidity</div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {unit.humidity}% RH
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Operational Yields */}
                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">
                          {preset === 'today' ? "Today's Production:" : 'Total Production:'}
                        </span>
                        <span className="font-bold text-amber-700 font-mono text-sm">
                          {displayEggs.toLocaleString()} eggs
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Clean Commercial Trays:</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {displayTrays.toLocaleString()} trays
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Laying Efficiency:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {displayLayRate}% rate
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">
                          {preset === 'today' ? "Today's Egg Revenue:" : 'Sales Turnover:'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          Rs. {displayRevenue.toLocaleString()}
                        </span>
                      </div>

                      {/* Flock-Specific One Bird Economics Sub-Card */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 bg-slate-50/80 rounded-lg p-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 mb-1">
                          <span className="flex items-center space-x-1">
                            <Scale className="w-3 h-3 text-teal-600" />
                            <span>1-Bird Economics</span>
                          </span>
                          <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                            {preset === 'today' ? 'Today' : 'Cumulative'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Rev / Bird:</span>
                            <span className="font-bold font-mono text-emerald-700">
                              Rs. {preset === 'today' ? unit.todayRevPerBird : unit.allTimeRevPerBird}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Exp / Bird:</span>
                            <span className="font-bold font-mono text-rose-600">
                              Rs. {preset === 'today' ? unit.todayExpPerBird : unit.allTimeExpPerBird}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center text-emerald-700 font-bold truncate">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span className="truncate">{unit.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EGG PRODUCTION WITH INTERACTIVE GRAPHS */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                2. Egg Production Section (Real Output &amp; Collections)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's collections across ${scopeLabel}: ${dynamicEggs.totalEggs.toLocaleString()} Eggs (${dynamicEggs.cleanTrays.toLocaleString()} Trays)`
                : `Period production across ${scopeLabel}: ${dynamicEggs.totalEggs.toLocaleString()} Eggs (${dynamicEggs.cleanTrays.toLocaleString()} Trays)`}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('egg-production')}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Egg Production Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Egg Production KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Today's Total Output" : 'Period Production Output'}
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              {dynamicEggs.totalEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicEggs.cleanTrays.toLocaleString()} Clean Trays (30s)
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Morning Collection (AM)" : 'Morning Collections'}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicEggs.morningEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~62% of daily yield output
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Evening Collection (PM)" : 'Evening Collections'}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicEggs.eveningEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~38% second gathering
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">Laying Rate Efficiency</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {dynamicEggs.avgLaying}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicEggs.brokenEggs} cracked eggs ({((dynamicEggs.brokenEggs / (dynamicEggs.totalEggs || 1)) * 100).toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Interactive Production Visualizer & Daily Logs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {preset === 'today'
                  ? `Today's Shift Yield & Morning vs. Evening Distribution (24 Oct 2026)`
                  : 'Daily Production Yield Curve & Flocks Output'}
              </h3>
              <p className="text-xs text-slate-500">
                {preset === 'today'
                  ? 'Collection comparison across Morning and Evening shifts for each shed'
                  : 'Time-series curve across latest collection cycles'}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center">
                <Sun className="w-3.5 h-3.5 text-amber-500 mr-1" />
                <span className="font-semibold text-slate-700">Morning Shift</span>
              </span>
              <span className="flex items-center ml-2">
                <Moon className="w-3.5 h-3.5 text-indigo-500 mr-1" />
                <span className="font-semibold text-slate-700">Evening Shift</span>
              </span>
            </div>
          </div>

          {/* Today's Shed-by-Shed Shift Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {unitCards.map((unit) => {
              const morningPercent = Math.round((unit.todayMorning / unit.todayEggs) * 100);
              const eveningPercent = 100 - morningPercent;
              return (
                <div key={unit.unit} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-black text-slate-900">{unit.unit} Shifts</span>
                    <span className="font-mono font-bold text-amber-700">
                      {unit.todayEggs.toLocaleString()} eggs
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center"><Sun className="w-3 h-3 text-amber-500 mr-1" /> Morning:</span>
                      <span className="font-mono font-bold text-slate-900">{unit.todayMorning.toLocaleString()} ({morningPercent}%)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center"><Moon className="w-3 h-3 text-indigo-500 mr-1" /> Evening:</span>
                      <span className="font-mono font-bold text-slate-900">{unit.todayEvening.toLocaleString()} ({eveningPercent}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex mt-2.5">
                    <div style={{ width: `${morningPercent}%` }} className="bg-amber-500"></div>
                    <div style={{ width: `${eveningPercent}%` }} className="bg-indigo-600"></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Egg Logs Table matching selected scope */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
              {preset === 'today' ? "Today's Verified Production Logs" : 'Active Production Logs in Scope'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3"># ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Flock / Shed</th>
                    <th className="py-2.5 px-3 text-right">Morning (AM)</th>
                    <th className="py-2.5 px-3 text-right">Evening (PM)</th>
                    <th className="py-2.5 px-3 text-right">Total Eggs</th>
                    <th className="py-2.5 px-3 text-right">Trays (30s)</th>
                    <th className="py-2.5 px-3 text-right">Cracked</th>
                    <th className="py-2.5 px-3 text-right">Laying %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeEggLogs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">#{log.trackingId || log.id}</td>
                      <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">{log.rawDate || log.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{log.flockName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(log.morningEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(log.eveningEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-700">{(log.totalEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">{(log.cleanTrays || Math.floor(log.totalEggs / 30))} Trays</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">{log.damagedEggs || log.brokenEggs || 0}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">{log.layingRatePercent || 85.8}%</td>
                    </tr>
                  ))}
                  {activeEggLogs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        No production logs found for the selected scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: CONSUMPTION ANALYTICS (FEED & WATER) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                3. Feed Mash &amp; Water Consumption Section
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's nutritional intake for ${scopeLabel}: ${dynamicConsumption.bags} Bags (${dynamicConsumption.feedKg.toLocaleString()} kg) • ${dynamicConsumption.waterL.toLocaleString()} L Water`
                : `Period nutritional consumption for ${scopeLabel}: ${dynamicConsumption.bags.toLocaleString()} Bags`}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('daily-consumption')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Consumption Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nutritional KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Today's Mash Consumed" : 'Period Feed Consumed'}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicConsumption.bags.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">bags</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicConsumption.feedKg.toLocaleString()} kg nutritional mash
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Today's Water Intake" : 'Total Water Intake'}
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono mt-1">
              {dynamicConsumption.waterL.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">liters</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              2.24 L / kg feed water ratio
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">Feed Conversion Ratio</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {dynamicConsumption.fcr} FCR
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Standard commercial efficiency
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">Intake per Bird / Day</div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {dynamicConsumption.intakeGrams} g
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Automated feeder hopper pace
            </div>
          </div>
        </div>

        {/* Today's Unit-Wise Consumption Breakdown */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {preset === 'today' ? "Today's Feed Intake by Unit" : 'Cumulative Feed Intake by Unit'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">50kg Feed Bags</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Unit 1 (Shed 1)</span>
                <span className="font-mono font-bold text-blue-700">
                  {preset === 'today' ? '58 Bags (2,900 kg)' : '7,840 Bags'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Water: {preset === 'today' ? '6,400 L' : '878,000 L'} • 117 g/bird
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Unit 2 (Shed 2)</span>
                <span className="font-mono font-bold text-blue-700">
                  {preset === 'today' ? '75 Bags (3,750 kg)' : '34,245 Bags'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Water: {preset === 'today' ? '8,500 L' : '3,835,000 L'} • 118 g/bird
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Unit 3 (Shed 3)</span>
                <span className="font-mono font-bold text-blue-700">
                  {preset === 'today' ? '62 Bags (3,100 kg)' : '6,310 Bags'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Water: {preset === 'today' ? '6,900 L' : '707,000 L'} • 119 g/bird
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: STOCKS & REPLENISHMENTS */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                4. Stock &amp; Warehouse Inventory Section
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's feed delivery log: 200 Bags received for Unit 2 (Rs. 1,109,408)`
                : `Period stock shipments for ${scopeLabel}: ${dynamicStock.bags.toLocaleString()} Bags`}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('stocks')}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Stock Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stock KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Today's Stock Received" : 'Total Stock Received'}
            </div>
            <div className="text-2xl font-black text-indigo-900 font-mono mt-1">
              {dynamicStock.bags.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">bags</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicStock.shipments} Shipment{dynamicStock.shipments === 1 ? '' : 's'} Logged
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              {preset === 'today' ? "Today's Invoice Paid" : 'Total Amount Disbursed'}
            </div>
            <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
              Rs. {Math.round(dynamicStock.amount).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {preset === 'today' ? 'Challan #1468 (D.O. 3996)' : '145 Total Deliveries'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">Warehouse Safety Buffer</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              2,150 Bags
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~16 Days Safety Reserve on Site
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-slate-500">Commercial Trays Stock</div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              42,500 Trays
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Standard 30-egg pulp trays
            </div>
          </div>
        </div>

        {/* Today's Delivery Highlight Card */}
        {activeStocks.length > 0 && (
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs mb-2">
              <Truck className="w-4 h-4 text-indigo-700" />
              <span>
                {preset === 'today' ? "Today's Feed Delivery Log (24 Oct 2026)" : 'Recent Stock Deliveries'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeStocks.slice(0, 3).map((stk) => (
                <div key={stk.id} className="p-3 bg-white rounded-xl border border-indigo-200/80 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-900">#{stk.trackingId} • {stk.flockName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Feed {stk.type}
                    </span>
                  </div>
                  <div className="text-base font-black text-indigo-900 font-mono mt-1">
                    {stk.quantity} Bags • Rs. {stk.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Challan: {stk.challanNo ? `CH-${stk.challanNo}` : '-'} • {stk.paymentType}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 italic truncate">
                    {stk.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
