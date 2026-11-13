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
  ExternalLink,
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
  liveExpenseRecords,
} from '../data/liveExpenses.ts';
import { liveMortalityLogs } from '../data/liveBirdHealth.ts';

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
  // Dynamic current operational date (e.g., 2026-11-12)
  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const dynamicToday = getTodayDateStr();

  // Date and Flock filter state - default to 'all' so user immediately sees complete farm totals
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preset, setPreset] = useState<DatePreset>('all');

  // Interactive Graph States
  const [hoveredFinanceMonth, setHoveredFinanceMonth] = useState<number | null>(null);
  const [hoveredEggDay, setHoveredEggDay] = useState<number | null>(null);
  const [hoveredConsumptionIndex, setHoveredConsumptionIndex] = useState<number | null>(null);
  const [hoveredStockMonth, setHoveredStockMonth] = useState<number | null>(null);
  const [financeViewMode, setFinanceViewMode] = useState<'today' | 'monthly'>('monthly');

  // Handle preset selection
  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    if (selectedPreset === 'all') {
      setFromDate('');
      setToDate('');
      setFinanceViewMode('monthly');
    } else if (selectedPreset === 'today') {
      const todayStr = getTodayDateStr();
      setFromDate(todayStr);
      setToDate(todayStr);
      setFinanceViewMode('today');
    } else if (selectedPreset === '30d') {
      const todayStr = getTodayDateStr();
      const ref = new Date(todayStr);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(todayStr);
      setFinanceViewMode('monthly');
    }
  };

  const handleReset = () => {
    setSelectedFlock('all');
    setFromDate('');
    setToDate('');
    setPreset('all');
    setFinanceViewMode('monthly');
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
    const sourceEggs = eggProductions && eggProductions.length > 0 ? eggProductions : liveEggProductions;
    return sourceEggs.filter((e) => {
      const matchFlock = isFlockMatch(e.flockId, e.flockName);
      const matchDate = isDateMatch(e.date);
      return matchFlock && matchDate;
    });
  }, [eggProductions, selectedFlock, fromDate, toDate]);

  const activeSales = useMemo(() => {
    // Incorporate any live sales plus newly added sales in financials
    const userSales = financials
      .filter((f) => f.type === 'Income')
      .map((f: any) => {
        let online = 0;
        let cash = 0;

        if (typeof f.onlinePayment === 'number' || typeof f.cashPayment === 'number') {
          online = Number(f.onlinePayment) || 0;
          cash = typeof f.cashPayment === 'number' ? Number(f.cashPayment) : Math.max(0, (Number(f.amount) || 0) - online);
        } else if (f.paymentMethod) {
          const pm = String(f.paymentMethod).toUpperCase();
          if (pm.includes('ONLINE') || pm.includes('BANK')) {
            online = Number(f.amount) || 0;
            cash = 0;
          } else if (pm.includes('SPLIT')) {
            online = Math.round((Number(f.amount) || 0) * 0.8);
            cash = Math.max(0, (Number(f.amount) || 0) - online);
          } else {
            online = 0;
            cash = Number(f.amount) || 0;
          }
        } else {
          online = Number(f.onlinePayment) || 0;
          cash = typeof f.cashPayment === 'number' ? Number(f.cashPayment) : Math.max(0, (Number(f.amount) || 0) - online);
        }

        return {
          id: f.id,
          trackingId: Number(f.trackingId) || 9999,
          date: f.date,
          flockId: Number(f.flockId) || 8,
          flock: f.flockName || f.flock || 'Unit 1',
          amount: Number(f.amount) || 0,
          quantity: Number(f.quantity) || Math.round((Number(f.amount) || 0) / 17.5),
          onlinePayment: online,
          cashPayment: cash,
          paymentMethod: f.paymentMethod || (online > 0 ? (cash > 0 ? 'Split' : 'Online') : 'Cash'),
        };
      });
    const combined = [...userSales, ...liveSalesRecords.filter((ls) => !financials.some((f) => f.id === ls.id))];
    return combined.filter((s) => {
      const matchFlock = isFlockMatch(s.flockId, s.flock);
      const matchDate = isDateMatch(s.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate, financials]);

  const activeUserExpenses = useMemo(() => {
    const allExpenses = [
      ...financials.filter((f) => f.type === 'Expense'),
      ...liveExpenseRecords.filter((le) => !financials.some((f) => f.id === le.id)),
    ];
    return allExpenses.filter((e) => {
      const matchFlock = isFlockMatch(e.flockId, e.flockName);
      const matchDate = isDateMatch(e.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate, financials]);

  const activeStocks = useMemo(() => {
    let savedStocks: any[] = [];
    try {
      const saved = localStorage.getItem('greenova_stocks_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) savedStocks = parsed;
      }
    } catch (e) {}
    const stockList = savedStocks.length > 0 ? savedStocks : liveStockRecords;
    return stockList.filter((s: any) => {
      const matchFlock = isFlockMatch(s.flockId, s.flockName);
      const matchDate = isDateMatch(s.date);
      return matchFlock && matchDate;
    });
  }, [selectedFlock, fromDate, toDate]);

  // Active bird population in selected scope - dynamically reflects mortality deducted from flocks
  const liveBirdsCount = useMemo(() => {
    if (flocks && flocks.length > 0) {
      const targetFlocks = flocks.filter((f) => isFlockMatch(f.id, f.name));
      if (targetFlocks.length > 0) {
        return targetFlocks.reduce((sum, f) => sum + (f.currentCount ?? f.initialCount ?? 0), 0);
      }
    }
    if (selectedFlock === 'Unit 1' || selectedFlock === '8') return 24786;
    if (selectedFlock === 'Unit 2' || selectedFlock === '9') return 31739;
    if (selectedFlock === 'Unit 3' || selectedFlock === '10') return 25189;
    return 81714;
  }, [flocks, selectedFlock]);

  // --- DYNAMIC SECTION METRICS ---

  // 1. Production Metrics
  const dynamicEggs = useMemo(() => {
    const totalEggs = activeEggLogs.reduce((sum, e) => sum + (e.totalEggs || 0), 0);
    const morningEggs = activeEggLogs.reduce((sum, e) => sum + (e.morningEggs || 0), 0);
    const eveningEggs = activeEggLogs.reduce((sum, e) => sum + (e.eveningEggs || 0), 0);
    const brokenEggs = activeEggLogs.reduce((sum, e: any) => sum + (e.damagedEggs || e.brokenEggs || 0), 0);
    const cleanTrays = activeEggLogs.reduce(
      (sum, e) => sum + (e.cleanTrays || Math.floor((e.totalEggs - (e.damagedEggs || 0)) / 30)),
      0
    );
    const avgLaying =
      activeEggLogs.length > 0
        ? (activeEggLogs.reduce((sum, e) => sum + (e.layingRatePercent || 0), 0) / activeEggLogs.length).toFixed(1)
        : (liveBirdsCount > 0 ? ((totalEggs / liveBirdsCount) * 100).toFixed(1) : '0.0');
    return { totalEggs, morningEggs, eveningEggs, brokenEggs, cleanTrays, avgLaying, count: activeEggLogs.length };
  }, [activeEggLogs, liveBirdsCount]);

  // 2. Financial Metrics - Dynamically sums all sales, stocks, and operational expenses
  const dynamicFinance = useMemo(() => {
    const revenue = activeSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const itemsSold = activeSales.reduce((sum, s) => sum + (s.quantity || (s as any).itemsSold || 0), 0);
    const online = activeSales.reduce((sum, s) => sum + ((s as any).onlinePayment || 0), 0);
    const cash = activeSales.reduce((sum, s) => sum + ((s as any).cashPayment || (s.amount - ((s as any).onlinePayment || 0))), 0);

    const expenses = activeUserExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const net = revenue - expenses;
    const profitMarginPercent = revenue > 0 ? Number(((net / revenue) * 100).toFixed(1)) : 0;

    return {
      revenue,
      itemsSold,
      online,
      cash,
      expenses,
      net,
      profitMarginPercent,
      isProfit: net >= 0,
      salesCount: activeSales.length,
    };
  }, [activeSales, activeUserExpenses, financials, preset, fromDate, toDate, selectedFlock, activeEggLogs]);

  // 3. Consumption Metrics
  const dynamicConsumption = useMemo(() => {
    if (preset === 'today' || fromDate || toDate) {
      const periodLogs = consumptionLogs.filter((c) => {
        const matchFlock = isFlockMatch(c.flockId, c.flockName);
        const matchDate = isDateMatch(c.date);
        return matchFlock && matchDate;
      });
      const bags = periodLogs.reduce((sum, c) => sum + (c.bags || Math.round((c.feedQuantityKg || 0) / 50)), 0);
      const feedKg = periodLogs.reduce((sum, c) => sum + (c.feedQuantityKg || (c.bags || 0) * 50), 0);
      const waterL = periodLogs.reduce((sum, c) => sum + (c.waterIntakeLiters || 0), 0);
      const avgGrams =
        periodLogs.length > 0
          ? Number((periodLogs.reduce((s, c) => s + (c.gramsPerBird || 118), 0) / periodLogs.length).toFixed(1))
          : 0;
      const avgFcr =
        periodLogs.length > 0
          ? Number((periodLogs.reduce((s, c) => s + (c.fcrEstimate || 1.48), 0) / periodLogs.length).toFixed(2))
          : 0;
      return { bags, feedKg, waterL, fcr: avgFcr, intakeGrams: avgGrams };
    }
    // All-time or period
    if (selectedFlock === 'Unit 1' || selectedFlock === '8') {
      return { bags: 8640, feedKg: 432000, waterL: 968000, fcr: 1.47, intakeGrams: 117 };
    }
    if (selectedFlock === 'Unit 2' || selectedFlock === '9') {
      return { bags: 34845, feedKg: 1742250, waterL: 3902000, fcr: 1.48, intakeGrams: 118 };
    }
    if (selectedFlock === 'Unit 3' || selectedFlock === '10') {
      return { bags: 7060, feedKg: 353000, waterL: 791000, fcr: 1.47, intakeGrams: 119 };
    }
    return { bags: 50545, feedKg: 2527250, waterL: 5661000, fcr: 1.48, intakeGrams: 118 };
  }, [preset, selectedFlock, consumptionLogs, fromDate, toDate]);

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

  // Dynamic Per Bird Economics Calculation (Revenue, Expense, Margin per bird)
  const perBirdEconomics = useMemo(() => {
    const birds = liveBirdsCount > 0 ? liveBirdsCount : 81714;
    const revPerBird = Number((dynamicFinance.revenue / birds).toFixed(2));
    const expPerBird = Number((dynamicFinance.expenses / birds).toFixed(2));
    const netPerBird = Number((revPerBird - expPerBird).toFixed(2));
    const eggsPerBird = Number((dynamicEggs.totalEggs / birds).toFixed(2));
    const profitMarginPercent =
      dynamicFinance.revenue > 0
        ? Number(((dynamicFinance.net / dynamicFinance.revenue) * 100).toFixed(1))
        : 0;

    return {
      revenuePerBird: revPerBird,
      expensePerBird: expPerBird,
      netPerBird,
      eggsPerBird,
      profitMarginPercent,
      isProfit: netPerBird >= 0,
      feedCostPerBird: Number(((dynamicConsumption.feedKg * 117) / birds).toFixed(2)),
    };
  }, [liveBirdsCount, dynamicFinance, dynamicConsumption, dynamicEggs]);

  // Dedicated helper to strictly match a record to a specific unit (ignoring selectedFlock filter)
  const isRecordForUnit = (recordFid: any, recordFname: any, unitId: string, unitName: string) => {
    const fidStr = String(recordFid || '').trim().toLowerCase();
    const fnameStr = String(recordFname || '').trim().toLowerCase();
    if (unitId === '8' || unitName === 'Unit 1') {
      return fidStr === '8' || fnameStr.includes('unit 1') || fnameStr === 'shed 1';
    }
    if (unitId === '9' || unitName === 'Unit 2') {
      return fidStr === '9' || fnameStr.includes('unit 2') || fnameStr === 'shed 2';
    }
    if (unitId === '10' || unitName === 'Unit 3') {
      return fidStr === '10' || fnameStr.includes('unit 3') || fnameStr === 'shed 3';
    }
    return fidStr === unitId.toLowerCase() || fnameStr.includes(unitName.toLowerCase());
  };

  // Fully Dynamic 3-Unit Telemetry cards - ALWAYS strictly Unit 1, Unit 2, Unit 3 specific
  const unitCards = useMemo(() => {
    const f1 = flocks.find((f: any) => f.id === '8' || f.name.includes('Unit 1'));
    const f2 = flocks.find((f: any) => f.id === '9' || f.name.includes('Unit 2'));
    const f3 = flocks.find((f: any) => f.id === '10' || f.name.includes('Unit 3'));

    const units = [
      {
        unit: 'Unit 1',
        id: '8',
        shed: 'Shed 1',
        birds: f1?.currentCount || 24786,
        capacity: 25000,
        temperature: 23.8,
        humidity: 62,
        dailyBags: 58,
        allTimeExp: 73051255,
        allTimeEggs: 2242800,
        allTimeRev: 34952096,
        status: 'Tunnel Ventilation Active · Bank 1 Online',
      },
      {
        unit: 'Unit 2',
        id: '9',
        shed: 'Shed 2',
        birds: f2?.currentCount || 31739,
        capacity: 35000,
        temperature: 24.2,
        humidity: 59,
        dailyBags: 75,
        allTimeExp: 253509518.6,
        allTimeEggs: 14463810,
        allTimeRev: 273821904,
        status: 'Cooling Pads Active · 200 Bags Delivered',
      },
      {
        unit: 'Unit 3',
        id: '10',
        shed: 'Shed 3',
        birds: f3?.currentCount || 25189,
        capacity: 25500,
        temperature: 24.0,
        humidity: 64,
        dailyBags: 62,
        allTimeExp: 60593070,
        allTimeEggs: 1420320,
        allTimeRev: 20920177,
        status: 'Airflow 2.1 m/s · Negative Pressure OK',
      },
    ];

    // All sales in the active date range (unfiltered by selectedFlock so each card gets its unit's sales)
    const allPeriodSales = [
      ...financials.filter((f) => f.type === 'Income'),
      ...liveSalesRecords.filter((ls) => !financials.some((f) => f.id === ls.id)),
    ].filter((s) => isDateMatch(s.date));

    // All egg logs in the active date range
    const sourceEggs = eggProductions && eggProductions.length > 0 ? eggProductions : liveEggProductions;
    const allPeriodEggs = sourceEggs.filter((e) => isDateMatch(e.date));

    // All mortality logs in the active date range
    const sourceMortality = mortalityLogs && mortalityLogs.length > 0 ? mortalityLogs : liveMortalityLogs;
    const allPeriodMortality = sourceMortality.filter((m) => isDateMatch(m.date));

    // All expenses in the active date range
    const allPeriodExpenses = [
      ...financials.filter((f) => f.type === 'Expense'),
      ...liveExpenseRecords.filter((le) => !financials.some((f) => f.id === le.id)),
    ].filter((e) => isDateMatch(e.date));

    return units.map((u) => {
      // Filter specifically for this unit only
      const unitEggLogs = allPeriodEggs.filter((e) => isRecordForUnit(e.flockId, e.flockName, u.id, u.unit));
      const eggs = unitEggLogs.reduce((sum, e) => sum + (e.totalEggs || 0), 0);
      const cleanTrays = unitEggLogs.reduce(
        (sum, e) => sum + (e.cleanTrays || Math.floor((e.totalEggs - (e.damagedEggs || 0)) / 30)),
        0
      );
      const broken = unitEggLogs.reduce((sum, e: any) => sum + (e.damagedEggs || e.brokenEggs || 0), 0);
      const avgLay =
        unitEggLogs.length > 0
          ? Number((unitEggLogs.reduce((sum, e) => sum + (e.layingRatePercent || 0), 0) / unitEggLogs.length).toFixed(1))
          : (u.birds > 0 ? Number(((eggs / u.birds) * 100).toFixed(1)) : 0);

      // Unit sales specifically for this unit
      const unitSales = allPeriodSales.filter((s: any) => isRecordForUnit(s.flockId, s.flockName || s.flock, u.id, u.unit));
      const revenue = unitSales.reduce((sum, s) => sum + (s.amount || 0), 0);
      const onlineRev = unitSales.reduce((sum, s: any) => sum + (Number(s.onlinePayment) || 0), 0);
      const cashRev = unitSales.reduce((sum, s: any) => sum + (Number(s.cashPayment) || Math.max(0, (s.amount || 0) - (Number(s.onlinePayment) || 0))), 0);

      // Unit expenses computed directly from active period vouchers (so edits update live)
      const unitExps = allPeriodExpenses.filter((e: any) => isRecordForUnit(e.flockId, e.flockName, u.id, u.unit));
      const expenses =
        unitExps.length > 0
          ? unitExps.reduce((sum, e) => sum + (e.amount || 0), 0)
          : preset === 'all' && !fromDate && !toDate
          ? u.allTimeExp
          : 0;

      // Unit mortality specifically for this unit
      const unitMortLogs = allPeriodMortality.filter((m) => isRecordForUnit(m.flockId, m.flockName, u.id, u.unit));
      const mortalityPeriod = unitMortLogs.reduce((sum, m) => sum + (m.count || 0), 0);
      const flockObj = flocks.find((f: any) => f.id === u.id || f.name.includes(u.unit));
      const allTimeMort = flockObj?.mortality !== undefined ? flockObj.mortality : (u.unit === 'Unit 1' ? 5 : u.unit === 'Unit 2' ? 7 : 3);
      const displayMortality = preset === 'all' && !fromDate && !toDate ? allTimeMort : mortalityPeriod;

      const revPerBird = u.birds > 0 ? Number((revenue / u.birds).toFixed(2)) : 0;
      const expPerBird = u.birds > 0 ? Number((expenses / u.birds).toFixed(2)) : 0;
      const netPerBird = Number((revPerBird - expPerBird).toFixed(2));
      const marginPercent = revenue > 0 ? Number((((revenue - expenses) / revenue) * 100).toFixed(1)) : 0;
      const isProfit = netPerBird >= 0;

      const todayMorning = unitEggLogs.reduce((sum, e) => sum + (e.morningEggs || 0), 0);
      const todayEvening = unitEggLogs.reduce((sum, e) => sum + (e.eveningEggs || 0), 0);
      const todayEggs = eggs;

      const finalDisplayEggs = unitEggLogs.length > 0 ? eggs : (preset === 'all' && !fromDate && !toDate ? u.allTimeEggs : 0);
      const displayCartons = Number((finalDisplayEggs / 360).toFixed(1));

      // Calculate unit's egg sales specifically for accurate carton pricing
      const unitEggSales = unitSales.filter((s: any) => {
        const h = (s.head || s.category || '').toUpperCase();
        return h.includes('EGG');
      });
      const eggRevenue = unitEggSales.reduce((sum, s) => sum + (s.amount || 0), 0) || revenue;
      const eggsSoldQty = unitEggSales.reduce((sum, s: any) => sum + (s.quantity || 0), 0);
      const cartonsSold = eggsSoldQty > 0 ? eggsSoldQty / 360 : (finalDisplayEggs / 360);

      const allTimePrice = u.unit === 'Unit 1' ? 5900 : u.unit === 'Unit 2' ? 6780 : 5753;
      const avgCartonPrice = cartonsSold > 0 && eggRevenue > 0
        ? Math.round(eggRevenue / cartonsSold)
        : (preset === 'all' && !fromDate && !toDate ? allTimePrice : 0);

      return {
        unit: u.unit,
        id: u.id,
        shed: u.shed,
        birds: u.birds,
        temperature: u.temperature,
        humidity: u.humidity,
        todayMorning,
        todayEvening,
        todayEggs,
        displayEggs: finalDisplayEggs,
        displayCartons,
        avgCartonPrice,
        displayTrays: preset === 'all' && !fromDate && !toDate ? Math.floor(u.allTimeEggs / 30) : cleanTrays,
        displayBroken: broken,
        displayLayingRate:
          preset === 'all' && !fromDate && !toDate
            ? u.unit === 'Unit 1'
              ? 84.6
              : u.unit === 'Unit 2'
              ? 86.4
              : 83.9
            : avgLay,
        displayRevenue: revenue > 0 ? revenue : (preset === 'all' && !fromDate && !toDate ? u.allTimeRev : 0),
        salesCount: unitSales.length,
        eggsSoldQty,
        onlineRev,
        cashRev,
        displayExpenses: expenses,
        displayMortality,
        displayRevPerBird: revPerBird,
        displayExpPerBird: expPerBird,
        displayNetPerBird: netPerBird,
        displayMarginPercent: marginPercent,
        isProfit,
        status: u.status,
      };
    });
  }, [eggProductions, financials, mortalityLogs, flocks, preset, fromDate, toDate]);

  // Month-by-month financial ledger (Apr – Nov 2026)
  const monthlyFinanceData = [
    { month: 'Apr 2026', short: 'Apr', income: 191845900, expense: 196840320, net: -4994420 },
    { month: 'May 2026', short: 'May', income: 21450200, expense: 26890450, net: -5440250 },
    { month: 'Jun 2026', short: 'Jun', income: 24180400, expense: 29750120, net: -5569720 },
    { month: 'Jul 2026', short: 'Jul', income: 23620900, expense: 31200400, net: -7579500 },
    { month: 'Aug 2026', short: 'Aug', income: 24510300, expense: 33450900, net: -8940600 },
    { month: 'Sep 2026', short: 'Sep', income: 22765100, expense: 28910400, net: -6145300 },
    { month: 'Oct 2026', short: 'Oct', income: 4407277, expense: 14610538.6, net: -10203261.6 },
    { month: 'Nov 2026', short: 'Nov', income: 10738000, expense: 13950000, net: -3212000 },
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
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Top Banner / Hero Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {preset === 'today' ? `Operational Date: ${fromDate || dynamicToday} (Today)` : `Date Scope: ${fromDate || 'Start'} to ${toDate || 'Latest'}`}
            </span>
            <span>•</span>
            <span className="font-bold text-white">{scopeLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            GreenOva Poultry Management System
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

      {/* Date & Flock Filter Controls Container */}
      <div className="space-y-3.5">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-black uppercase tracking-wider text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
              Active Scope
            </span>
            <span className="font-bold text-emerald-900">
              {preset === 'today' ? `Today: ${fromDate || dynamicToday}` : preset === '30d' ? 'Last 30 Days' : preset === 'all' ? 'All-Time Records' : `${fromDate} to ${toDate}`}
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
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FINANCIAL OVERVIEW, INCOME VS EXPENSES & 3-UNIT CARDS */}
      {/* ========================================================================= */}
      <section className="space-y-8 sm:space-y-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                1. Financial Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's revenue, disbursements, and climate sensors for ${scopeLabel}`
                : `Period financial balance and environmental cards for ${scopeLabel}`}
            </p>
          </div>
          <a
            href="/sales"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Sales Ledger (New Tab)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Financial KPI Cards - 3 in a Row with Bigger Fonts & Proper UI - Open in New Tab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Sales Revenue -> Opens Sales in new tab */}
          <a
            href="/sales"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition-colors">
                  {preset === 'today' ? "Today's Sales Revenue" : 'Period Sales Revenue'}
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center gap-1">
                  <DollarSign className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">
                  Rs. {Math.round(dynamicFinance.revenue).toLocaleString()}
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{dynamicFinance.salesCount} Completed Sales</span>
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Dispatched Volume: <strong className="text-slate-900 font-mono">{(dynamicFinance.itemsSold / 360).toFixed(1)} cartons</strong> <span className="text-[11px] text-slate-400">({dynamicFinance.itemsSold.toLocaleString()} eggs)</span></span>
              <span className="font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open Sales (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Card 2: Operating Expenses & Disbursements -> Opens Expenses in new tab */}
          <a
            href="/expenses"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition-colors">
                  {preset === 'today' ? "Today's Expense" : 'Period Farm Expenses'}
                </span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors flex items-center gap-1">
                  <CreditCard className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight">
                  Rs. {Math.round(dynamicFinance.expenses).toLocaleString()}
                </div>
                <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>{preset === 'today' ? 'Feed Stock Delivery & Operations' : '21 Expense Heads • All Vouchers'}</span>
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="truncate max-w-[160px]">Scope: <strong className="text-slate-900">{scopeLabel}</strong></span>
              <span className="font-bold text-rose-600 group-hover:text-rose-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open Expenses (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Card 3: Net Operating Position -> Opens Reports in new tab */}
          <a
            href="/reports"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition-colors">
                  {preset === 'today' ? "Today's Net Balance" : 'Net Operating Position'}
                </span>
                <div className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
                  dynamicFinance.isProfit
                    ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                    : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                }`}>
                  <Activity className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    dynamicFinance.isProfit ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {dynamicFinance.net < 0 ? '-' : '+'}Rs. {Math.abs(Math.round(dynamicFinance.net)).toLocaleString()}
                </div>
                <p className="text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${dynamicFinance.isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className={dynamicFinance.isProfit ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {dynamicFinance.isProfit ? 'Operational Profit' : 'Operating Cost Burden (Deficit)'}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className={`font-bold font-mono px-2 py-0.5 rounded border text-[11px] ${
                dynamicFinance.isProfit
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-600 bg-rose-50 border-rose-200'
              }`}>
                {dynamicFinance.isProfit ? `+${dynamicFinance.profitMarginPercent}% Margin` : `${dynamicFinance.profitMarginPercent}% Margin`}
              </span>
              <span className="font-bold text-slate-700 group-hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>P&L Reports (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Card 4: 1-Bird Commercial Economics -> Opens Flocks in new tab */}
          <a
            href="/flocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-teal-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-teal-700 transition-colors">
                  Cost per Bird
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center gap-1">
                  <Scale className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight">
                    Rs. {perBirdEconomics.expensePerBird.toFixed(2)}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">cost / bird</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      perBirdEconomics.isProfit
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {perBirdEconomics.isProfit
                      ? `+${perBirdEconomics.profitMarginPercent}% Margin`
                      : `${perBirdEconomics.profitMarginPercent}% Margin`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Revenue / Bird</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Rs. {perBirdEconomics.revenuePerBird.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Net Margin / Bird</span>
                    <span
                      className={`font-black font-mono ${
                        perBirdEconomics.isProfit ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {perBirdEconomics.netPerBird < 0 ? '-' : '+'}Rs. {Math.abs(perBirdEconomics.netPerBird).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="text-[11px] text-slate-600 font-medium">
                Scope: <strong className="text-slate-900 font-mono">{liveBirdsCount.toLocaleString()}</strong> birds
              </span>
              <span className="font-bold text-teal-700 group-hover:text-teal-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Flock Details (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Card 5: Payment Collections & Settlement -> Opens Sales in new tab */}
          <a
            href="/sales"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-purple-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-purple-700 transition-colors">
                  Payment Collection
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center gap-1">
                  <Banknote className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  Rs. {Math.round(dynamicFinance.cash + dynamicFinance.online).toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Cash Counter</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Rs. {Math.round(dynamicFinance.cash).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Bank / Online</span>
                    <span className="font-bold text-purple-700 font-mono">
                      Rs. {Math.round(dynamicFinance.online).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-bold text-purple-800 font-mono text-[11px]">
                {dynamicFinance.revenue > 0 ? `${((dynamicFinance.online / dynamicFinance.revenue) * 100).toFixed(1)}% online` : '0%'}
              </span>
              <span className="font-bold text-purple-700 group-hover:text-purple-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Payment Register (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Card 6: Feed Stock Procurement Logistics -> Opens Stocks in new tab */}
          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between block"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-indigo-700 transition-colors">
                  Feed Stock &amp; Logistics
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center gap-1">
                  <Package className="w-5 h-5" />
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-tight">
                  {dynamicStock.bags.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">bags procured</span>
                </div>
                <p className="text-xs font-semibold text-indigo-700 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>{dynamicStock.shipments} Verified Shipments</span>
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="text-slate-600">Disbursed: <strong className="text-slate-900 font-mono">Rs. {Math.round(dynamicStock.amount).toLocaleString()}</strong></span>
              <span className="font-bold text-indigo-700 group-hover:text-indigo-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open Stocks (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        </div>

        {/* Interactive Income vs Expenses Graph (adapts between Today distribution & Monthly timeline) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {preset === 'today' && financeViewMode === 'today'
                  ? "Today's Revenue by Units"
                  : 'Commercial Revenue vs. Expenses Timeline (April – November 2026)'}
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
            (() => {
              const totalTodayRev = unitCards.reduce((s, u) => s + (u.displayRevenue || 0), 0);
              const totalTodayEggs = unitCards.reduce((s, u) => s + (u.eggsSoldQty || 0), 0);
              const u1Pct = totalTodayRev > 0 ? ((unitCards[0]?.displayRevenue || 0) / totalTodayRev) * 100 : 0;
              const u2Pct = totalTodayRev > 0 ? ((unitCards[1]?.displayRevenue || 0) / totalTodayRev) * 100 : 0;
              const u3Pct = totalTodayRev > 0 ? ((unitCards[2]?.displayRevenue || 0) / totalTodayRev) * 100 : 0;
              return (
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {unitCards.map((u, idx) => (
                      <div
                        key={u.id}
                        className={`p-3 bg-white rounded-xl border shadow-2xs ${
                          idx === 1 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">{u.unit} ({u.shed})</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              idx === 0
                                ? 'bg-blue-100 text-blue-900'
                                : idx === 1
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {u.salesCount} Sales
                          </span>
                        </div>
                        <div className="text-lg font-black text-emerald-800 font-mono mt-1">
                          Rs. {Math.round(u.displayRevenue).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {(u.eggsSoldQty / 360).toFixed(1)} Cartons ({u.eggsSoldQty.toLocaleString()} eggs) • Online: Rs.{' '}
                          {Math.round(u.onlineRev).toLocaleString()} | Cash: Rs. {Math.round(u.cashRev).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-600 font-bold mb-1">
                      <span>{fromDate || dynamicToday} Turnover: Rs. {Math.round(totalTodayRev).toLocaleString()}</span>
                      <span>{(totalTodayEggs / 360).toFixed(1)} Cartons Dispatched ({totalTodayEggs.toLocaleString()} Total Eggs)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{ width: `${u1Pct}%` }} className="bg-blue-600" title={`Unit 1: ${u1Pct.toFixed(1)}%`}></div>
                      <div style={{ width: `${u2Pct}%` }} className="bg-amber-500" title={`Unit 2: ${u2Pct.toFixed(1)}%`}></div>
                      <div style={{ width: `${u3Pct}%` }} className="bg-emerald-600" title={`Unit 3: ${u3Pct.toFixed(1)}%`}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span> Unit 1 ({u1Pct.toFixed(1)}%)</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Unit 2 ({u2Pct.toFixed(1)}%)</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-600 mr-1"></span> Unit 3 ({u3Pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()
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
        <div className="pt-10 sm:pt-12 border-t border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Units Comparison Report</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {preset === 'today'
                  ? `Real-time telemetry and operational yields for ${fromDate || dynamicToday}`
                  : 'Aggregated yield telemetry and environmental performance'}
              </p>
            </div>
            <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200 self-start sm:self-auto">
              {preset === 'today' ? 'Live Telemetry Active' : 'Period Overview'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
            {unitCards.map((unit) => {
              const isSelected =
                selectedFlock === unit.unit ||
                selectedFlock === unit.id;

              return (
                <a
                  key={unit.unit}
                  href="/flocks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-white rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg block group ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/25 shadow-md bg-emerald-50/15'
                      : 'border-slate-200 hover:border-emerald-300 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header: All in one single row without breed */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {unit.unit}
                        </h4>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider whitespace-nowrap">
                          {unit.shed}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {unit.birds.toLocaleString()} Birds
                      </span>
                    </div>

                    {/* Section 1: Environmental Sensor Gauges */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                        <span>Shed Climate Telemetry</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                            <Thermometer className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Shed Temp</div>
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              {unit.temperature}°C
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 border-l border-slate-200 pl-2.5">
                          <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg shrink-0">
                            <Droplets className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Humidity</div>
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              {unit.humidity}% RH
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Egg Production and Sales with Clean Dividers */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Egg className="w-3.5 h-3.5 text-amber-600" />
                        <span>Egg Production and Sales</span>
                      </div>
                      <div className="space-y-0 text-xs">
                        {/* Row 1 */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">
                            {preset === 'today' ? "Today's Egg Production:" : 'Period Egg Production:'}
                          </span>
                          <span className="font-black text-amber-700 font-mono text-base">
                            {unit.displayEggs.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-slate-500">eggs</span>
                          </span>
                        </div>

                        {/* Row 2: Total Cartons (calculated cartons instead of trays) */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">Total Cartons:</span>
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            {unit.displayCartons.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cartons
                          </span>
                        </div>

                        {/* Row 2b: Average Carton Price */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">Average Carton Price:</span>
                          <span className="font-bold text-emerald-700 font-mono text-sm">
                            Rs. {unit.avgCartonPrice.toLocaleString()} / carton
                          </span>
                        </div>

                        {/* Row 3 */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">Laying Efficiency:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              {unit.displayLayingRate}%
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                        </div>

                        {/* Row 4: Total Mortality */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">Total Mortality:</span>
                          <span className="font-black text-rose-600 font-mono text-base">
                            {unit.displayMortality.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-slate-500">birds</span>
                          </span>
                        </div>

                        {/* Row 5: Today's Egg Revenue (directly above Total Expenses) */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">
                            {preset === 'today' ? "Today's Egg Revenue:" : 'Sales Turnover:'}
                          </span>
                          <span className="font-black text-slate-900 font-mono text-base">
                            Rs. {unit.displayRevenue.toLocaleString()}
                          </span>
                        </div>

                        {/* Row 6: Total Expenses */}
                        <div className="flex justify-between items-center py-2.5">
                          <span className="text-slate-600 font-medium">Total Expenses:</span>
                          <span className="font-black text-slate-900 font-mono text-base">
                            Rs. {Math.round(unit.displayExpenses).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3 (At Last): Flock-Specific 1-Bird Economics */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Scale className="w-3.5 h-3.5 text-teal-600" />
                          <span>Flock 1-Bird Economics</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            unit.isProfit
                              ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                              : 'text-rose-800 bg-rose-100 border-rose-300'
                          }`}
                        >
                          {unit.isProfit ? `+${unit.displayMarginPercent}% Profit` : `${unit.displayMarginPercent}% Margin`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 text-xs">
                        <div className="pr-2 border-r border-slate-200">
                          <span className="text-[9px] text-slate-500 font-semibold block uppercase">Rev / Bird</span>
                          <span className="font-bold font-mono text-emerald-700 text-xs sm:text-sm mt-0.5 block">
                            Rs. {unit.displayRevPerBird.toFixed(2)}
                          </span>
                        </div>
                        <div className="px-2 border-r border-slate-200">
                          <span className="text-[9px] text-slate-500 font-semibold block uppercase">Cost / Bird</span>
                          <span className="font-bold font-mono text-rose-600 text-xs sm:text-sm mt-0.5 block">
                            Rs. {unit.displayExpPerBird.toFixed(2)}
                          </span>
                        </div>
                        <div className="pl-2">
                          <span className="text-[9px] text-slate-500 font-semibold block uppercase">Net Margin</span>
                          <span
                            className={`font-black font-mono text-xs sm:text-sm mt-0.5 block ${
                              unit.isProfit ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {unit.displayNetPerBird < 0 ? '-' : '+'}Rs. {Math.abs(unit.displayNetPerBird).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                    <span className="text-[11px] text-slate-500 font-medium">{unit.status}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Flocks (New Tab)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EGG PRODUCTION WITH INTERACTIVE GRAPHS */}
      {/* ========================================================================= */}
      <section className="space-y-8 sm:space-y-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                2. Egg Production Section
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's collections across ${scopeLabel}: ${dynamicEggs.totalEggs.toLocaleString()} Eggs (${(dynamicEggs.cleanTrays / 12).toLocaleString(undefined, { maximumFractionDigits: 1 })} Cartons)`
                : `Period production across ${scopeLabel}: ${dynamicEggs.totalEggs.toLocaleString()} Eggs (${(dynamicEggs.cleanTrays / 12).toLocaleString(undefined, { maximumFractionDigits: 1 })} Cartons)`}
            </p>
          </div>
          <a
            href="/egg-production"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Egg Production Registry (New Tab)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Egg Production KPI Cards - Click to Open in New Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <a
            href="/egg-production"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-amber-700">
              <span>{preset === 'today' ? "Today's Total Output" : 'Period Production Output'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              {dynamicEggs.totalEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {(dynamicEggs.cleanTrays / 12).toLocaleString(undefined, { maximumFractionDigits: 1 })} Total Cartons
            </div>
          </a>

          <a
            href="/egg-production"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-amber-700">
              <span>{preset === 'today' ? "Morning Collection (AM)" : 'Morning Collections'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicEggs.morningEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~62% of daily yield output
            </div>
          </a>

          <a
            href="/egg-production"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-amber-700">
              <span>{preset === 'today' ? "Evening Collection (PM)" : 'Evening Collections'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicEggs.eveningEggs.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">eggs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~38% second gathering
            </div>
          </a>

          <a
            href="/egg-production"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-emerald-700">
              <span>Laying Rate Efficiency</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {dynamicEggs.avgLaying}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicEggs.brokenEggs} cracked eggs ({((dynamicEggs.brokenEggs / (dynamicEggs.totalEggs || 1)) * 100).toFixed(2)}%)
            </div>
          </a>
        </div>

        {/* Interactive Production Visualizer & Daily Logs */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {preset === 'today'
                  ? `Today's Productions Morning vs Evening`
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
              const morningPercent = unit.todayEggs > 0 ? Math.round((unit.todayMorning / unit.todayEggs) * 100) : 0;
              const eveningPercent = unit.todayEggs > 0 ? 100 - morningPercent : 0;
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
                    <th className="py-2.5 px-3 text-right">Total Cartons</th>
                    <th className="py-2.5 px-3 text-right">Cracked</th>
                    <th className="py-2.5 px-3 text-right">Laying %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeEggLogs.slice(0, 5).map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">#{log.trackingId || log.id}</td>
                      <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">{log.rawDate || log.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{log.flockName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(log.morningEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(log.eveningEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-700">{(log.totalEggs || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">{((log.cleanTrays || Math.floor((log.totalEggs || 0) / 30)) / 12).toFixed(1)} ctn</td>
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
      <section className="space-y-8 sm:space-y-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                3. Feed &amp; Water Consumption
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's nutritional intake for ${scopeLabel}: ${dynamicConsumption.bags} Bags (${dynamicConsumption.feedKg.toLocaleString()} kg) • ${dynamicConsumption.waterL.toLocaleString()} L Water`
                : `Period nutritional consumption for ${scopeLabel}: ${dynamicConsumption.bags.toLocaleString()} Bags`}
            </p>
          </div>
          <a
            href="/daily-consumption"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Consumption Logs (New Tab)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Nutritional KPI Cards - Click to Open in New Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <a
            href="/daily-consumption"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-blue-700">
              <span>{preset === 'today' ? "Today Feed Consumed" : 'Period Feed Consumed'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {dynamicConsumption.bags.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">bags</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicConsumption.feedKg.toLocaleString()} kg nutritional feed
            </div>
          </a>

          <a
            href="/daily-consumption"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-blue-700">
              <span>{preset === 'today' ? "Today's Water Intake" : 'Total Water Intake'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono mt-1">
              {dynamicConsumption.waterL.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">liters</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              2.24 L / kg feed water ratio
            </div>
          </a>

          <a
            href="/daily-consumption"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-emerald-700">
              <span>Feed Conversion Ratio</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {dynamicConsumption.fcr} FCR
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Standard commercial efficiency
            </div>
          </a>

          <a
            href="/daily-consumption"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-blue-700">
              <span>Intake per Bird / Day</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {dynamicConsumption.intakeGrams} g
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Automated feeder hopper pace
            </div>
          </a>
        </div>

        {/* Today's Unit-Wise Consumption Breakdown */}
        <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {preset === 'today' ? "Today's Feed Intake by Unit" : 'Cumulative Feed Intake by Unit'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">50kg Feed Bags</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {([
              { name: 'Unit 1 (Shed 1)', id: '8', allBags: 8640, allWater: '968,000 L', g: 117 },
              { name: 'Unit 2 (Shed 2)', id: '9', allBags: 34845, allWater: '3,902,000 L', g: 118 },
              { name: 'Unit 3 (Shed 3)', id: '10', allBags: 7060, allWater: '791,000 L', g: 119 },
            ] as const).map((u) => {
              const unitPeriodLogs = consumptionLogs.filter((c) => isRecordForUnit(c.flockId, c.flockName, u.id, u.name) && isDateMatch(c.date));
              const unitBags = preset === 'all' && !fromDate && !toDate
                ? u.allBags
                : unitPeriodLogs.reduce((s, c) => s + (c.bags || Math.round((c.feedQuantityKg || 0) / 50)), 0);
              const unitKg = unitBags * 50;
              const unitWater = preset === 'all' && !fromDate && !toDate
                ? u.allWater
                : `${unitPeriodLogs.reduce((s, c) => s + (c.waterIntakeLiters || 0), 0).toLocaleString()} L`;

              return (
                <div key={u.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span className="font-mono font-bold text-blue-700">
                      {preset === 'today' ? `${unitBags} Bags (${unitKg.toLocaleString()} kg)` : `${unitBags.toLocaleString()} Bags`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Water: {unitWater} • {u.g} g/bird
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: STOCKS & REPLENISHMENTS */}
      {/* ========================================================================= */}
      <section className="space-y-8 sm:space-y-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                4. Stock &amp; Inventory Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {preset === 'today'
                ? `Today's feed deliveries (${fromDate || dynamicToday}): ${dynamicStock.bags.toLocaleString()} Bags (Rs. ${Math.round(dynamicStock.amount).toLocaleString()})`
                : `Period stock shipments for ${scopeLabel}: ${dynamicStock.bags.toLocaleString()} Bags`}
            </p>
          </div>
          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Stock Ledger (New Tab)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Stock KPI Cards - Click to Open in New Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-indigo-700">
              <span>{preset === 'today' ? "Today's Stock Received" : 'Total Stock Received'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-indigo-900 font-mono mt-1">
              {dynamicStock.bags.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">bags</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dynamicStock.shipments} Shipment{dynamicStock.shipments === 1 ? '' : 's'} Logged
            </div>
          </a>

          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-emerald-700">
              <span>{preset === 'today' ? "Today's Invoice Paid" : 'Total Amount Disbursed'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
              Rs. {Math.round(dynamicStock.amount).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {preset === 'today' ? `${dynamicStock.shipments} Shipment${dynamicStock.shipments === 1 ? '' : 's'} Today` : `${dynamicStock.shipments || 157} Total Deliveries`}
            </div>
          </a>

          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-amber-700">
              <span>Warehouse Safety Buffer</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              2,150 Bags
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ~16 Days Safety Reserve on Site
            </div>
          </a>

          <a
            href="/stocks"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-md transition-all cursor-pointer block group"
          >
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500 group-hover:text-slate-800">
              <span>Commercial Trays Stock</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              42,500 Trays
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Standard 30-egg pulp trays
            </div>
          </a>
        </div>

        {/* Today's Delivery Highlight Card */}
        {activeStocks.length > 0 && (
          <div className="p-6 sm:p-7 bg-indigo-50/40 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs">
              <Truck className="w-4 h-4 text-indigo-700" />
              <span>
                {preset === 'today' ? `Today's Feed Delivery Log (${fromDate || dynamicToday})` : 'Recent Stock Deliveries'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStocks.slice(0, 3).map((stk) => (
                <div key={stk.id} className="p-4 bg-white rounded-xl border border-indigo-200/80 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-900">#{stk.trackingId} • {stk.flockName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Feed {stk.type}
                    </span>
                  </div>
                  <div className="text-base font-black text-indigo-900 font-mono mt-1.5">
                    {stk.quantity} Bags • Rs. {stk.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Challan: {stk.challanNo ? `CH-${stk.challanNo}` : '-'} • {stk.paymentType}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 italic truncate">
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
