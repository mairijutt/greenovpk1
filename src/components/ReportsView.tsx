import React, { useState, useMemo, useEffect } from 'react';
import {
  FileBarChart2,
  FileText,
  Download,
  TrendingUp,
  Award,
  Egg,
  Scale,
  ShieldCheck,
  HeartPulse,
  DollarSign,
  CreditCard,
  Banknote,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Truck,
  Boxes,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Flock,
  EggProduction,
  MortalityLog,
  FeedConsumption,
  FinancialRecord,
  InventoryItem,
  BankAccount,
} from '../types/farm.ts';
import { StatCard, PageHeader, UIButton, TableCard, DateRangePickerBar, DatePreset } from './ui';
import { initialInventory } from '../data/mockData.ts';
import { liveExpenseRecords, liveConsumptionRecords } from '../data/productionData.ts';
import { CeoIncomeExpenseReport } from './CeoIncomeExpenseReport.tsx';
import { apiFetch } from '../services/api.ts';
import {
  downloadRecordsCSV,
  downloadRecordsPDF,
  downloadStructuredCSV,
  downloadIncomeStatementPDF,
  PdfKpiCard,
  PdfIncomeStatementLine,
} from '../utils/exportRecords.ts';
import {
  MONTH_OPTIONS,
  getMonthDateBounds,
  getAdjacentMonthLabel,
  computeCeoSummary,
  computeMonthlyBreakdown,
  computeBankBalances,
  normalizeDateStr,
} from '../utils/ceoReportCalculations.ts';
import {
  SALES_SUMMARY,
  liveSalesBreakdown,
  unitWiseSalesSummary,
  liveSalesRecords,
  SaleRecord,
} from '../data/liveSales.ts';
import {
  EGG_PRODUCTION_SUMMARY,
  unitWiseEggSummary,
  liveEggProductions,
  DetailedEggProduction,
} from '../data/liveEggProductions.ts';
import {
  STOCK_SUMMARY,
  unitWiseStockSummary,
  liveStockRecords,
  StockRecord,
} from '../data/liveStocks.ts';

interface ReportsViewProps {
  flocks: Flock[];
  eggProductions: EggProduction[];
  mortalityLogs: MortalityLog[];
  consumptionLogs: FeedConsumption[];
  financials?: FinancialRecord[];
  inventory?: InventoryItem[];
  bankAccounts?: BankAccount[];
  onAddBank?: (bank: BankAccount) => void;
  onEditBank?: (bank: BankAccount) => void;
  onDeleteBank?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type ReportType =
  | 'income-vs-expense'
  | 'egg-production'
  | 'sales-revenue'
  | 'stock-inventory'
  | 'flock-health';

export const ReportsView: React.FC<ReportsViewProps> = ({
  flocks,
  eggProductions,
  mortalityLogs,
  consumptionLogs,
  financials = [],
  inventory = [],
  bankAccounts = [],
  onAddBank = () => {},
  onEditBank = () => {},
  onDeleteBank = () => {},
  onNavigateTab,
}) => {
  const defaultYear = String(new Date().getFullYear());
  const defaultMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const initialBounds = getMonthDateBounds(defaultYear, defaultMonth);

  const [activeReport, setActiveReport] = useState<ReportType>('income-vs-expense');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [fromDate, setFromDate] = useState<string>(initialBounds.from);
  const [toDate, setToDate] = useState<string>(initialBounds.to);
  const [preset, setPreset] = useState<DatePreset | 'month' | 'year'>('month');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const recordsPerPage = 10;

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Find latest reference date
  const latestDate = useMemo(() => {
    return eggProductions[0]?.date || getTodayDateStr();
  }, [eggProductions]);

  // Handle Month / Year dropdown changes
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setCurrentPage(1);
    if (newMonth === 'all') {
      const targetYear = selectedYear === 'all' ? defaultYear : selectedYear;
      if (selectedYear === 'all') setSelectedYear(targetYear);
      const bounds = getMonthDateBounds(targetYear, 'all');
      setFromDate(bounds.from);
      setToDate(bounds.to);
      setPreset('year');
    } else {
      const targetYear = selectedYear === 'all' ? defaultYear : selectedYear;
      if (selectedYear === 'all') setSelectedYear(targetYear);
      const bounds = getMonthDateBounds(targetYear, newMonth);
      setFromDate(bounds.from);
      setToDate(bounds.to);
      setPreset('month');
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    setCurrentPage(1);
    if (newYear === 'all') {
      setSelectedMonth('all');
      setFromDate('');
      setToDate('');
      setPreset('all');
    } else {
      const effMonth = selectedMonth === 'custom' ? 'all' : selectedMonth;
      if (selectedMonth === 'custom') setSelectedMonth('all');
      const bounds = getMonthDateBounds(newYear, effMonth);
      setFromDate(bounds.from);
      setToDate(bounds.to);
      setPreset(effMonth === 'all' ? 'year' : 'month');
    }
  };

  // Handle Preset selection
  const handlePresetChange = (selectedPreset: DatePreset | 'month' | 'year') => {
    setPreset(selectedPreset);
    setCurrentPage(1);
    if (selectedPreset === 'all') {
      setSelectedYear('all');
      setSelectedMonth('all');
      setFromDate('');
      setToDate('');
    } else if (selectedPreset === 'month') {
      setSelectedYear(defaultYear);
      setSelectedMonth(defaultMonth);
      const bounds = getMonthDateBounds(defaultYear, defaultMonth);
      setFromDate(bounds.from);
      setToDate(bounds.to);
    } else if (selectedPreset === 'year') {
      const targetYear = selectedYear === 'all' ? defaultYear : selectedYear;
      setSelectedYear(targetYear);
      setSelectedMonth('all');
      const bounds = getMonthDateBounds(targetYear, 'all');
      setFromDate(bounds.from);
      setToDate(bounds.to);
    } else if (selectedPreset === 'today') {
      const todayStr = getTodayDateStr();
      setSelectedMonth('custom');
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (selectedPreset === '30d') {
      const todayStr = getTodayDateStr();
      const ref = new Date(todayStr);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setSelectedMonth('custom');
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSelectedUnit('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setCurrentPage(1);
    if (activeReport === 'income-vs-expense') {
      setSelectedYear(defaultYear);
      setSelectedMonth(defaultMonth);
      const bounds = getMonthDateBounds(defaultYear, defaultMonth);
      setFromDate(bounds.from);
      setToDate(bounds.to);
      setPreset('month');
    } else {
      setSelectedYear('all');
      setSelectedMonth('all');
      setFromDate('');
      setToDate('');
      setPreset('all');
    }
  };

  // Egg Production dataset: use live synced productions whenever loaded
  const eggDataset: DetailedEggProduction[] = useMemo(() => {
    if (eggProductions.length > 0) {
      return eggProductions as DetailedEggProduction[];
    }
    return liveEggProductions;
  }, [eggProductions]);

  // Sales dataset: use live synced sales whenever loaded
  const salesDataset: SaleRecord[] = useMemo(() => {
    const incomeFromFinancials = financials.filter((f) => f.type === 'Income') as SaleRecord[];
    if (incomeFromFinancials.length > 0) {
      return incomeFromFinancials;
    }
    return liveSalesRecords;
  }, [financials]);

  // Expense dataset: use live synced expenses whenever loaded
  const expenseDataset: FinancialRecord[] = useMemo(() => {
    const expenseFromFinancials = financials.filter((f) => f.type === 'Expense');
    if (expenseFromFinancials.length > 0) {
      return expenseFromFinancials;
    }
    return liveExpenseRecords;
  }, [financials]);

  // Feed consumption dataset: live consumptionLogs including Unit 3 Mar-Oct records
  const consumptionDataset: FeedConsumption[] = useMemo(() => {
    if (consumptionLogs.length > 0) {
      return consumptionLogs;
    }
    return liveConsumptionRecords;
  }, [consumptionLogs]);

  // Stock dataset: hydrated from live PostgreSQL /api/stocks with local fallback
  const [stockDataset, setStockDataset] = useState<StockRecord[]>(() => {
    try {
      const saved = localStorage.getItem('greenova_stocks_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return liveStockRecords;
  });

  useEffect(() => {
    let active = true;
    apiFetch('/api/stocks?limit=2000')
      .then((res) => {
        const items = res?.data?.items;
        if (!active || !Array.isArray(items) || items.length === 0) return;
        const mapped: StockRecord[] = items.map((r: any) => {
          const fid = String(r.flockId || 8);
          const fname =
            r.flock?.flockName || (fid === '9' ? 'Unit 2' : fid === '10' ? 'Unit 3' : 'Unit 1');
          const dateStr = r.rawDate || (r.date ? String(r.date).slice(0, 10) : '');
          return {
            id: String(r.id),
            trackingId: Number(r.trackingId || r.id) || 0,
            date: dateStr,
            rawDate: dateStr,
            type: String(r.Type || r.type || '13'),
            feedType:
              r.feedType ||
              (r.head === 'FEED'
                ? `Layer Feed ${r.Type || '13'}`
                : String(r.Type || r.head || 'Stock')),
            flockName: fname,
            flockId: fid,
            head: String(r.head || 'FEED'),
            category: String(r.head || 'FEED'),
            quantity: Number(r.quantity || 0),
            bags: Number(r.bags ?? r.quantity ?? 0),
            amount: Number(r.amountPaid ?? r.amount ?? 0),
            costPerBag: Number(r.costPerBag || 0),
            paymentType: String(r.paymentType || 'CASH'),
            challanNo: String(r.challanNo || ''),
            notes: String(r.notes || ''),
          };
        });
        setStockDataset(mapped);
        try {
          localStorage.setItem('greenova_stocks_v2', JSON.stringify(mapped));
        } catch {}
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Unit supply inventory dataset
  const inventoryDataset: InventoryItem[] = useMemo(() => {
    if (inventory && inventory.length > 0) return inventory;
    try {
      const saved = localStorage.getItem('greenova_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialInventory;
  }, [inventory]);

  // Available years discovered from records + defaultYear
  const availableYears: string[] = useMemo(() => {
    const years = new Set<string>([defaultYear]);
    [...eggDataset, ...salesDataset, ...expenseDataset].forEach((r) => {
      const d = normalizeDateStr(r.date);
      if (d.length >= 4 && /^\d{4}/.test(d)) years.add(d.slice(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [defaultYear, eggDataset, salesDataset, expenseDataset]);

  // --- FILTERED EGG PRODUCTIONS ---
  const filteredEggs = useMemo(() => {
    return eggDataset.filter((e) => {
      const unitMatch =
        selectedUnit === 'all' ||
        (e.flockName && e.flockName.toLowerCase().includes(selectedUnit.toLowerCase())) ||
        (selectedUnit === 'Unit 1' && (e.flockId === '8' || e.flockName === 'Unit 1')) ||
        (selectedUnit === 'Unit 2' && (e.flockId === '9' || e.flockName === 'Unit 2')) ||
        (selectedUnit === 'Unit 3' && (e.flockId === '10' || e.flockName === 'Unit 3'));

      const matchesFrom = !fromDate || e.date >= fromDate;
      const matchesTo = !toDate || e.date <= toDate;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (e.flockName && e.flockName.toLowerCase().includes(q)) ||
        (e.date && e.date.toLowerCase().includes(q)) ||
        (e.trackingId && e.trackingId.toString().includes(q)) ||
        (e.id && e.id.toLowerCase().includes(q));

      return unitMatch && matchesFrom && matchesTo && matchesQuery;
    });
  }, [eggDataset, selectedUnit, fromDate, toDate, searchQuery]);

  // --- FILTERED SALES ---
  const filteredSales = useMemo(() => {
    return salesDataset.filter((s) => {
      const flockStr = String(s.flockName || s.flock || s.flockId || '');
      const unitMatch =
        selectedUnit === 'all' ||
        flockStr.toLowerCase().includes(selectedUnit.toLowerCase());

      const categoryMatch =
        selectedCategory === 'all' ||
        s.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesFrom = !fromDate || s.date >= fromDate;
      const matchesTo = !toDate || s.date <= toDate;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        flockStr.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(q)) ||
        (s.referenceNo && s.referenceNo.toLowerCase().includes(q)) ||
        (s.challanNo && s.challanNo.toLowerCase().includes(q)) ||
        (s.trackingId && s.trackingId.toString().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.date && s.date.toLowerCase().includes(q));

      return unitMatch && categoryMatch && matchesFrom && matchesTo && matchesQuery;
    });
  }, [salesDataset, selectedUnit, selectedCategory, fromDate, toDate, searchQuery]);

  // --- FILTERED STOCKS ---
  const filteredStocks = useMemo(() => {
    return stockDataset.filter((stk) => {
      const unitMatch =
        selectedUnit === 'all' ||
        stk.flockName.toLowerCase() === selectedUnit.toLowerCase() ||
        (selectedUnit === 'Unit 1' && stk.flockId === '8') ||
        (selectedUnit === 'Unit 2' && stk.flockId === '9') ||
        (selectedUnit === 'Unit 3' && stk.flockId === '10');

      const matchesFrom = !fromDate || stk.date >= fromDate;
      const matchesTo = !toDate || stk.date <= toDate;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        stk.trackingId.toString().includes(q) ||
        stk.flockName.toLowerCase().includes(q) ||
        stk.type.toLowerCase().includes(q) ||
        stk.challanNo.toLowerCase().includes(q) ||
        stk.notes.toLowerCase().includes(q) ||
        stk.date.toLowerCase().includes(q);

      return unitMatch && matchesFrom && matchesTo && matchesQuery;
    });
  }, [stockDataset, selectedUnit, fromDate, toDate, searchQuery]);

  // --- FILTERED HEALTH & FLOCK ---
  const filteredMortality = useMemo(() => {
    return mortalityLogs.filter((m) => {
      const unitMatch =
        selectedUnit === 'all' ||
        (m.flockName && m.flockName.toLowerCase().includes(selectedUnit.toLowerCase())) ||
        (m.flockId === '8' && selectedUnit === 'Unit 1') ||
        (m.flockId === '9' && selectedUnit === 'Unit 2') ||
        (m.flockId === '10' && selectedUnit === 'Unit 3');
      const matchesFrom = !fromDate || m.date >= fromDate;
      const matchesTo = !toDate || m.date <= toDate;
      return unitMatch && matchesFrom && matchesTo;
    });
  }, [mortalityLogs, selectedUnit, fromDate, toDate]);

  const filteredConsumption = useMemo(() => {
    return consumptionLogs.filter((c) => {
      const unitMatch =
        selectedUnit === 'all' ||
        (c.flockName && c.flockName.toLowerCase().includes(selectedUnit.toLowerCase())) ||
        (c.flockId === '8' && selectedUnit === 'Unit 1') ||
        (c.flockId === '9' && selectedUnit === 'Unit 2') ||
        (c.flockId === '10' && selectedUnit === 'Unit 3');
      const matchesFrom = !fromDate || c.date >= fromDate;
      const matchesTo = !toDate || c.date <= toDate;
      return unitMatch && matchesFrom && matchesTo;
    });
  }, [consumptionLogs, selectedUnit, fromDate, toDate]);

  // Aggregated Stats
  const eggTotals = useMemo(() => {
    const totalEggs = filteredEggs.reduce((acc, curr) => acc + (curr.totalEggs || 0), 0);
    const brokenEggs = filteredEggs.reduce((acc, curr) => acc + (curr.damagedEggs || curr.brokenEggs || 0), 0);
    const cleanTrays = filteredEggs.reduce(
      (acc, curr) => acc + (curr.cleanTrays || Math.floor((curr.totalEggs - (curr.damagedEggs || 0)) / 30)),
      0
    );
    const avgLaying =
      filteredEggs.length > 0
        ? (filteredEggs.reduce((acc, curr) => acc + (curr.layingRatePercent || 0), 0) / filteredEggs.length).toFixed(1)
        : '0.0';
    return { totalEggs, brokenEggs, cleanTrays, avgLaying, count: filteredEggs.length };
  }, [filteredEggs]);

  const salesTotals = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalItems = filteredSales.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalOnline = filteredSales.reduce(
      (acc, curr) => acc + (curr.onlinePayment || (curr.paymentMethod === 'Bank Transfer' ? curr.amount : 0)),
      0
    );
    const totalCash = filteredSales.reduce(
      (acc, curr) => acc + (curr.cashPayment || (curr.paymentMethod === 'Cash' ? curr.amount : 0)),
      0
    );
    return { totalRevenue, totalItems, totalOnline, totalCash, count: filteredSales.length };
  }, [filteredSales]);

  const stockTotals = useMemo(() => {
    const totalBags = filteredStocks.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalAmount = filteredStocks.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const avgCost = totalBags > 0 ? Math.round(totalAmount / totalBags) : 0;
    return { totalBags, totalAmount, avgCost, count: filteredStocks.length };
  }, [filteredStocks]);

  // --- CEO INCOME VS EXPENSES ANALYTICS CALCULATIONS ---
  const ceoPeriodLabels = useMemo(() => {
    if (selectedMonth === 'custom') {
      return {
        periodLabel: `${fromDate || 'Start'} to ${toDate || 'Latest'}`,
        prevPeriodLabel: fromDate ? `Before ${fromDate}` : 'Prior Periods',
        nextPeriodLabel: toDate ? `After ${toDate}` : 'Subsequent Periods',
      };
    }
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return {
        periodLabel: 'All Recorded Periods (Cumulative Audit)',
        prevPeriodLabel: 'Opening Balance',
        nextPeriodLabel: 'Next Operating Cycle',
      };
    }
    if (selectedMonth === 'all') {
      return {
        periodLabel: `Full Year ${selectedYear}`,
        prevPeriodLabel: `Prior to ${selectedYear}`,
        nextPeriodLabel: `Opening ${Number(selectedYear) + 1}`,
      };
    }
    const mName = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    return {
      periodLabel: `${mName} ${selectedYear}`,
      prevPeriodLabel: getAdjacentMonthLabel(selectedYear, selectedMonth, -1),
      nextPeriodLabel: getAdjacentMonthLabel(selectedYear, selectedMonth, 1),
    };
  }, [selectedYear, selectedMonth, fromDate, toDate]);

  const computeUnitCeo = (unitKey: string) =>
    computeCeoSummary({
      flocks,
      eggProductions: eggDataset,
      salesRecords: salesDataset,
      expenseRecords: expenseDataset,
      consumptionLogs: consumptionDataset,
      stockRecords: stockDataset,
      inventory: inventoryDataset,
      selectedUnit: unitKey,
      fromDate,
      toDate,
      periodLabel: ceoPeriodLabels.periodLabel,
      prevPeriodLabel: ceoPeriodLabels.prevPeriodLabel,
      nextPeriodLabel: ceoPeriodLabels.nextPeriodLabel,
    });

  const ceoAllMetrics = useMemo(
    () => computeUnitCeo('all'),
    [flocks, eggDataset, salesDataset, expenseDataset, consumptionDataset, stockDataset, inventoryDataset, fromDate, toDate, ceoPeriodLabels]
  );

  const ceoUnit1Metrics = useMemo(
    () => computeUnitCeo('Unit 1'),
    [flocks, eggDataset, salesDataset, expenseDataset, consumptionDataset, stockDataset, inventoryDataset, fromDate, toDate, ceoPeriodLabels]
  );

  const ceoUnit2Metrics = useMemo(
    () => computeUnitCeo('Unit 2'),
    [flocks, eggDataset, salesDataset, expenseDataset, consumptionDataset, stockDataset, inventoryDataset, fromDate, toDate, ceoPeriodLabels]
  );

  const ceoUnit3Metrics = useMemo(
    () => computeUnitCeo('Unit 3'),
    [flocks, eggDataset, salesDataset, expenseDataset, consumptionDataset, stockDataset, inventoryDataset, fromDate, toDate, ceoPeriodLabels]
  );

  const activeCeoMetrics =
    selectedUnit === 'Unit 1'
      ? ceoUnit1Metrics
      : selectedUnit === 'Unit 2'
      ? ceoUnit2Metrics
      : selectedUnit === 'Unit 3'
      ? ceoUnit3Metrics
      : ceoAllMetrics;

  const ceoMonthlyRows = useMemo(
    () =>
      computeMonthlyBreakdown({
        flocks,
        eggProductions: eggDataset,
        salesRecords: salesDataset,
        expenseRecords: expenseDataset,
        consumptionLogs: consumptionDataset,
        stockRecords: stockDataset,
        inventory: inventoryDataset,
        selectedUnit,
        selectedYear,
      }),
    [flocks, eggDataset, salesDataset, expenseDataset, consumptionDataset, stockDataset, inventoryDataset, selectedUnit, selectedYear]
  );

  const bankSummary = useMemo(
    () =>
      computeBankBalances({
        bankAccounts,
        salesRecords: salesDataset,
        fromDate,
        toDate,
      }),
    [bankAccounts, salesDataset, fromDate, toDate]
  );

  // Pagination calculation
  const currentDatasetLength =
    activeReport === 'income-vs-expense'
      ? activeCeoMetrics.salesCount + activeCeoMetrics.expenseCount + activeCeoMetrics.eggLogCount
      : activeReport === 'egg-production'
      ? filteredEggs.length
      : activeReport === 'sales-revenue'
      ? filteredSales.length
      : activeReport === 'stock-inventory'
      ? filteredStocks.length
      : filteredMortality.length;

  const totalPages = Math.max(1, Math.ceil(currentDatasetLength / recordsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * recordsPerPage;

  const paginatedEggs = useMemo(() => {
    return filteredEggs.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredEggs, startIndex, recordsPerPage]);

  const paginatedSales = useMemo(() => {
    return filteredSales.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredSales, startIndex, recordsPerPage]);

  const paginatedStocks = useMemo(() => {
    return filteredStocks.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredStocks, startIndex, recordsPerPage]);

  const paginatedMortality = useMemo(() => {
    return filteredMortality.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredMortality, startIndex, recordsPerPage]);

  const unitMatchHelper = (rec: any, unitKey: string): boolean => {
    if (unitKey === 'all') return true;
    const fname = String(rec?.flockName || rec?.flock || '').toLowerCase();
    const fid = String(rec?.flockId ?? '');
    if (unitKey === 'Unit 1') return fname.includes('unit 1') || fid === '8';
    if (unitKey === 'Unit 2') return fname.includes('unit 2') || fid === '9';
    if (unitKey === 'Unit 3') return fname.includes('unit 3') || fid === '10';
    return false;
  };

  const eggUnitCards = useMemo(() => {
    const allEggs = eggDataset.reduce((s, e) => s + (e.totalEggs || 0), 0);
    return ['all', 'Unit 1', 'Unit 2', 'Unit 3'].map((key) => {
      const subset = eggDataset.filter((e) => unitMatchHelper(e, key));
      const eggs = subset.reduce((s, e) => s + (e.totalEggs || 0), 0);
      const cartons = Math.round(eggs / 360);
      const share = allEggs > 0 ? ((eggs / allEggs) * 100).toFixed(1) : '0.0';
      return {
        key,
        label: key === 'all' ? 'All Units Combined' : key,
        count: subset.length,
        cartons,
        eggs,
        share,
      };
    });
  }, [eggDataset]);

  const salesUnitCards = useMemo(() => {
    const allAmt = salesDataset.reduce((s, x) => s + (x.amount || 0), 0);
    return ['all', 'Unit 1', 'Unit 2', 'Unit 3'].map((key) => {
      const subset = salesDataset.filter((x) => unitMatchHelper(x, key));
      const amount = subset.reduce((s, x) => s + (x.amount || 0), 0);
      const cartons = Math.round(
        subset.reduce((s, x) => s + (x.quantity || 0), 0) / 360
      );
      const share = allAmt > 0 ? ((amount / allAmt) * 100).toFixed(1) : '0.0';
      return {
        key,
        label: key === 'all' ? 'All Units Combined' : key,
        count: subset.length,
        amount,
        cartons,
        share,
      };
    });
  }, [salesDataset]);

  const stockUnitCards = useMemo(() => {
    const allBags = stockDataset.reduce((s, x) => s + (x.quantity || 0), 0);
    return ['all', 'Unit 1', 'Unit 2', 'Unit 3'].map((key) => {
      const subset = stockDataset.filter((x) => unitMatchHelper(x, key));
      const bags = subset.reduce((s, x) => s + (x.quantity || 0), 0);
      const amount = subset.reduce((s, x) => s + (x.amount || 0), 0);
      const share = allBags > 0 ? ((bags / allBags) * 100).toFixed(1) : '0.0';
      return {
        key,
        label: key === 'all' ? 'All Units Combined' : key,
        count: subset.length,
        bags,
        amount,
        share,
      };
    });
  }, [stockDataset]);

  const healthUnitCards = useMemo(() => {
    return ['all', 'Unit 1', 'Unit 2', 'Unit 3'].map((key) => {
      const unitFlocks = flocks.filter((f) => {
        if (key === 'all') return true;
        if (key === 'Unit 1') return f.name === 'Unit 1' || String(f.id) === '8';
        if (key === 'Unit 2') return f.name === 'Unit 2' || String(f.id) === '9';
        if (key === 'Unit 3') return f.name === 'Unit 3' || String(f.id) === '10';
        return false;
      });
      const activeBirds = unitFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const initialBirds = unitFlocks.reduce((s, f) => s + (f.initialCount || f.currentCount || 0), 0);
      const unitMortLogs = mortalityLogs.filter((m) => unitMatchHelper(m, key));
      const mortality = unitFlocks.reduce((s, f) => s + (f.mortality || 0), 0) ||
        unitMortLogs.reduce((s, m) => s + (m.count || 0), 0);
      const livability = initialBirds > 0 ? ((activeBirds / initialBirds) * 100).toFixed(1) : '100.0';
      return {
        key,
        label: key === 'all' ? 'All Units Combined' : key,
        activeBirds,
        mortality,
        livability,
        incidents: unitMortLogs.length,
      };
    });
  }, [flocks, mortalityLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setJumpPageInput('');
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
      setJumpPageInput('');
    }
  };

  const fmtReportPkr = (val: number) => {
    const sign = val < 0 ? '-' : '';
    return `${sign}Rs. ${Math.round(Math.abs(val)).toLocaleString()}`;
  };

  const fmtCompactReportPkr = (val: number) => {
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${sign}Rs. ${(abs / 1_000_000).toFixed(2)}M`;
    return `${sign}Rs. ${Math.round(abs).toLocaleString()}`;
  };

  const buildIncomeVsExpenseExports = () => {
    const m = activeCeoMetrics;
    const rev = m.totalSalesRevenue || 0;
    const pctStr = (v: number) => (rev > 0 ? `${((v / rev) * 100).toFixed(1)}%` : '0.0%');
    const grossProfit = rev - m.cogsExpenses;
    const otherOpEx = Math.max(0, m.operatingExpenses - m.salariesExpenses - m.utilitiesPolExpenses);
    const opProfitExclCapex = rev - (m.totalExpenses - m.chickenCapexExpenses);
    const unitLabel = selectedUnit === 'all' ? 'All Units Combined' : selectedUnit;
    const isSurplus = m.netIncome >= 0;

    const topCards: PdfKpiCard[] = [
      {
        label: 'Total Revenue',
        value: fmtCompactReportPkr(rev),
        subtext: `${m.salesCount.toLocaleString()} Bills | ${rev > 0 ? ((m.eggSalesRevenue / rev) * 100).toFixed(1) : '0.0'}% Eggs`,
        tone: 'emerald',
      },
      {
        label: 'Total Expenses',
        value: fmtCompactReportPkr(m.totalExpenses),
        subtext: `${m.expenseCount.toLocaleString()} Vouchers | Consumed Feed`,
        tone: 'rose',
      },
      {
        label: isSurplus ? 'Net Income' : 'Net Deficit',
        value: fmtCompactReportPkr(m.netIncome),
        subtext: `Net Margin: ${m.netMarginPercent.toFixed(1)}% | Excl. CAPEX: ${m.operatingMarginPercent.toFixed(1)}%`,
        tone: isSurplus ? 'emerald' : 'rose',
      },
      {
        label: 'Unit Economics',
        value: `Rs. ${Math.round(m.avgCartonPrice).toLocaleString()}/ctn`,
        subtext: `Cost/Bird: Rs. ${Math.round(m.avgPerBirdCost).toLocaleString()} | OpEx: ${fmtCompactReportPkr(m.operatingExpenses)}`,
        tone: 'indigo',
      },
      {
        label: 'Egg Production',
        value: `${Math.round(m.totalCartonsProduced).toLocaleString()} Ctns`,
        subtext: `${m.totalEggsProduced.toLocaleString()} Eggs | ${m.avgLayingRate.toFixed(1)}% Lay`,
        tone: 'amber',
      },
      {
        label: 'Cartons Sold',
        value: `${Math.round(m.cartonsSold).toLocaleString()} Ctns`,
        subtext: `${m.eggsSold.toLocaleString()} Eggs | ${m.eggSalesCount.toLocaleString()} Bills`,
        tone: 'indigo',
      },
      {
        label: 'Closing Egg Stock',
        value: `${Math.round(m.carriedNextCartons).toLocaleString()} Ctns`,
        subtext: `Open ${Math.round(m.carriedPrevCartons).toLocaleString()} -> Close ${Math.round(m.carriedNextCartons).toLocaleString()}`,
        tone: 'slate',
      },
      {
        label: 'Feed Consumed & Rem.',
        value: `${m.feedConsumedBags.toLocaleString()} Bags`,
        subtext: `Cost: ${fmtCompactReportPkr(m.feedExpenses)} | Rem: ${m.remainingFeedBags.toLocaleString()} Bags`,
        tone: 'slate',
      },
    ];

    const incomeStatementLines: PdfIncomeStatementLine[] = [
      { kind: 'section', particulars: 'A. REVENUE (INCOME)', basis: '', amount: '', percentRevenue: '' },
      {
        kind: 'item',
        particulars: 'Egg Sales Revenue',
        basis: `${Math.round(m.cartonsSold).toLocaleString()} ctns @ Rs. ${Math.round(m.avgCartonPrice).toLocaleString()}/ctn`,
        amount: fmtReportPkr(m.eggSalesRevenue),
        percentRevenue: pctStr(m.eggSalesRevenue),
      },
      {
        kind: 'item',
        particulars: 'Other Farm Sales',
        basis: 'Manure, Bags, Birds & Misc.',
        amount: fmtReportPkr(m.otherSalesRevenue),
        percentRevenue: pctStr(m.otherSalesRevenue),
      },
      {
        kind: 'subtotal',
        particulars: 'Total Revenue (A)',
        basis: `${m.salesCount.toLocaleString()} Sales Bills`,
        amount: fmtReportPkr(rev),
        percentRevenue: rev > 0 ? '100.0%' : '0.0%',
      },
      {
        kind: 'section',
        particulars: 'B. COST OF GOODS SOLD (DIRECT BIRD & PRODUCTION COSTS)',
        basis: '',
        amount: '',
        percentRevenue: '',
      },
      {
        kind: 'item',
        particulars: 'Feed Consumed Expenses',
        basis: `${m.feedConsumedBags.toLocaleString()} bags consumed (${m.feedStockReceivedBags.toLocaleString()} purch.)`,
        amount: fmtReportPkr(m.feedExpenses),
        percentRevenue: pctStr(m.feedExpenses),
      },
      {
        kind: 'item',
        particulars: 'Chicken / Flock Purchases (CAPEX)',
        basis: 'Flock Placement / Acquisition',
        amount: fmtReportPkr(m.chickenCapexExpenses),
        percentRevenue: pctStr(m.chickenCapexExpenses),
      },
      {
        kind: 'item',
        particulars: 'Medicine & Vaccines',
        basis: 'Health & Biosecurity',
        amount: fmtReportPkr(m.medicineVaccineExpenses),
        percentRevenue: pctStr(m.medicineVaccineExpenses),
      },
      {
        kind: 'subtotal',
        particulars: 'Total Cost of Goods Sold (B)',
        basis: 'Direct Bird & Feed Cost',
        amount: `(${fmtReportPkr(m.cogsExpenses)})`,
        percentRevenue: pctStr(m.cogsExpenses),
      },
      {
        kind: 'gross',
        particulars: 'Gross Profit / (Loss) (A - B)',
        basis: '',
        amount: fmtReportPkr(grossProfit),
        percentRevenue: pctStr(grossProfit),
      },
      {
        kind: 'section',
        particulars: 'C. OPERATING EXPENSES (UNIT OVERHEADS)',
        basis: '',
        amount: '',
        percentRevenue: '',
      },
      {
        kind: 'item',
        particulars: 'Staff Salaries & Labor Payments',
        basis: 'Farm Crew & Management',
        amount: fmtReportPkr(m.salariesExpenses),
        percentRevenue: pctStr(m.salariesExpenses),
      },
      {
        kind: 'item',
        particulars: 'Utilities, Electricity & Fuel (POL)',
        basis: 'Power, Generator & Transport',
        amount: fmtReportPkr(m.utilitiesPolExpenses),
        percentRevenue: pctStr(m.utilitiesPolExpenses),
      },
      {
        kind: 'item',
        particulars: 'Other Farm Overheads',
        basis: 'Repairs, Packing, Rent & Admin',
        amount: fmtReportPkr(otherOpEx),
        percentRevenue: pctStr(otherOpEx),
      },
      {
        kind: 'subtotal',
        particulars: 'Total Operating Expenses (C)',
        basis: 'Unit Operating Cost (Excl. Bird Cost)',
        amount: `(${fmtReportPkr(m.operatingExpenses)})`,
        percentRevenue: pctStr(m.operatingExpenses),
      },
      {
        kind: 'subtotal',
        particulars: 'Total Expenses (B + C)',
        basis: `${m.expenseCount.toLocaleString()} Vouchers (Consumed Feed)`,
        amount: `(${fmtReportPkr(m.totalExpenses)})`,
        percentRevenue: pctStr(m.totalExpenses),
      },
      {
        kind: 'net',
        particulars: isSurplus ? 'Net Income (A - Total Expenses)' : 'Net Loss (A - Total Expenses)',
        basis: `Op. Profit excl. CAPEX: ${fmtReportPkr(opProfitExclCapex)}`,
        amount: fmtReportPkr(m.netIncome),
        percentRevenue: `${m.netMarginPercent.toFixed(1)}%`,
        isPositive: isSurplus,
      },
    ];

    const unitMatrixList = [
      { name: 'Unit 1', u: ceoUnit1Metrics },
      { name: 'Unit 2', u: ceoUnit2Metrics },
      { name: 'Unit 3', u: ceoUnit3Metrics },
      { name: 'All Units', u: ceoAllMetrics },
    ];

    return {
      title: 'Income Statement & Executive Summary',
      subtitle: `Period: ${m.periodLabel}  |  Unit: ${unitLabel}  |  Active Flock: ${m.activeBirds.toLocaleString()} Birds`,
      filenameBase: `GreenOva_Income_Statement_${unitLabel}_${selectedYear}_${selectedMonth}`,
      cards: topCards,
      incomeStatementLines,
      unitSummaryColumns: [
        { header: 'Unit', align: 'left' as const, width: 19 },
        { header: 'Birds', align: 'right' as const, width: 16 },
        { header: 'Prod (Ctns)', align: 'right' as const, width: 19 },
        { header: 'Sold (Ctns)', align: 'right' as const, width: 19 },
        { header: 'Revenue (PKR)', align: 'right' as const, width: 28 },
        { header: 'Expense (PKR)', align: 'right' as const, width: 28 },
        { header: 'Net P&L (PKR)', align: 'right' as const, width: 28 },
        { header: 'Feed (Bags)', align: 'right' as const, width: 17 },
        { header: 'Cost/Bird', align: 'right' as const, width: 16 },
      ],
      unitSummaryRows: unitMatrixList.map(({ name, u }) => [
        name,
        u.activeBirds.toLocaleString(),
        Math.round(u.totalCartonsProduced).toLocaleString(),
        Math.round(u.cartonsSold).toLocaleString(),
        Math.round(u.totalSalesRevenue).toLocaleString(),
        Math.round(u.totalExpenses).toLocaleString(),
        Math.round(u.netIncome).toLocaleString(),
        u.feedConsumedBags.toLocaleString(),
        `Rs. ${Math.round(u.avgPerBirdCost).toLocaleString()}`,
      ]),
      monthlyColumns: [
        { header: 'Month', align: 'left' as const, width: 22 },
        { header: 'Prod (Ctns)', align: 'right' as const, width: 20 },
        { header: 'Sold (Ctns)', align: 'right' as const, width: 20 },
        { header: 'Rem Prod', align: 'right' as const, width: 20 },
        { header: 'Revenue (PKR)', align: 'right' as const, width: 27 },
        { header: 'Expense (PKR)', align: 'right' as const, width: 27 },
        { header: 'Net P&L (PKR)', align: 'right' as const, width: 26 },
        { header: 'Feed (Bags)', align: 'right' as const, width: 14 },
        { header: 'Rem Feed', align: 'right' as const, width: 14 },
      ],
      monthlyRows: ceoMonthlyRows.map((r) => [
        r.monthLabel,
        Math.round(r.totalCartonsProduced).toLocaleString(),
        Math.round(r.cartonsSold).toLocaleString(),
        Math.round(r.carriedNextCartons).toLocaleString(),
        Math.round(r.totalSales).toLocaleString(),
        Math.round(r.totalExpenses).toLocaleString(),
        Math.round(r.netIncome).toLocaleString(),
        r.feedConsumedBags.toLocaleString(),
        r.remainingFeedBags.toLocaleString(),
      ]),
      csvSections: [
        {
          title: `TOP SUMMARY CARDS (${m.periodLabel} - ${unitLabel})`,
          columns: ['Metric', 'Value', 'Details'],
          rows: topCards.map((c) => [c.label, c.value, c.subtext || '']),
        },
        {
          title: 'INCOME STATEMENT (PROFIT & LOSS)',
          columns: ['Particulars', 'Basis / Details', 'Amount (PKR)', '% of Revenue'],
          rows: [
            ['Egg Sales Revenue', `${Math.round(m.cartonsSold)} ctns @ Rs. ${Math.round(m.avgCartonPrice)}/ctn`, Math.round(m.eggSalesRevenue), pctStr(m.eggSalesRevenue)],
            ['Other Farm Sales', 'Manure, Feed Bags, Cull Birds & Misc.', Math.round(m.otherSalesRevenue), pctStr(m.otherSalesRevenue)],
            ['Total Revenue (A)', `${m.salesCount} Bills`, Math.round(rev), rev > 0 ? '100.0%' : '0.0%'],
            ['Feed Consumed Expenses', `${m.feedConsumedBags} bags consumed (${m.feedStockReceivedBags} purchased)`, Math.round(m.feedExpenses), pctStr(m.feedExpenses)],
            ['Chicken / Flock Purchases (CAPEX)', 'Flock Placement / Acquisition', Math.round(m.chickenCapexExpenses), pctStr(m.chickenCapexExpenses)],
            ['Medicine & Vaccines', 'Health & Biosecurity', Math.round(m.medicineVaccineExpenses), pctStr(m.medicineVaccineExpenses)],
            ['Total Cost of Goods Sold (B)', 'Direct Bird & Feed Cost', Math.round(m.cogsExpenses), pctStr(m.cogsExpenses)],
            ['Gross Profit / (Loss) (A - B)', '', Math.round(grossProfit), pctStr(grossProfit)],
            ['Staff Salaries & Labor', 'Farm Crew & Management', Math.round(m.salariesExpenses), pctStr(m.salariesExpenses)],
            ['Utilities, Electricity & Fuel (POL)', 'Power, Generator & Transport', Math.round(m.utilitiesPolExpenses), pctStr(m.utilitiesPolExpenses)],
            ['Other Farm Overheads', 'Repairs, Packing, Rent & Admin', Math.round(otherOpEx), pctStr(otherOpEx)],
            ['Total Operating Expenses (C)', 'Unit Operating Cost (Excl. Bird Cost)', Math.round(m.operatingExpenses), pctStr(m.operatingExpenses)],
            ['Total Expenses (B + C)', `${m.expenseCount} Vouchers`, Math.round(m.totalExpenses), pctStr(m.totalExpenses)],
            ['Net Income / (Net Loss)', `Operating Profit excl. CAPEX: ${Math.round(opProfitExclCapex)}`, Math.round(m.netIncome), `${m.netMarginPercent.toFixed(1)}%`],
          ],
        },
        {
          title: 'UNIT-WISE COMPARATIVE SUMMARY',
          columns: [
            'Unit',
            'Active Birds',
            'Production (Ctns)',
            'Cartons Sold',
            'Total Sale (PKR)',
            'Total Expense (PKR)',
            'Net Income (PKR)',
            'Feed Consumed (Bags)',
            'Rem. Production (Ctns)',
            'Rem. Feed (Bags)',
            'Avg Carton Price (PKR)',
            'Cost / Bird (PKR)',
          ],
          rows: unitMatrixList.map(({ name, u }) => [
            name,
            u.activeBirds,
            Math.round(u.totalCartonsProduced),
            Math.round(u.cartonsSold),
            Math.round(u.totalSalesRevenue),
            Math.round(u.totalExpenses),
            Math.round(u.netIncome),
            u.feedConsumedBags,
            Math.round(u.carriedNextCartons),
            u.remainingFeedBags,
            Math.round(u.avgCartonPrice),
            Math.round(u.avgPerBirdCost),
          ]),
        },
        ...(ceoMonthlyRows.length > 0
          ? [
              {
                title: 'MONTHLY ROLLOVER SCHEDULE',
                columns: [
                  'Month',
                  'C/F Prev (Ctns)',
                  'Produced (Ctns)',
                  'Sold (Ctns)',
                  'Rem. Prod (Ctns)',
                  'Total Sale (PKR)',
                  'Total Expense (PKR)',
                  'Net Income (PKR)',
                  'Feed Consumed (Bags)',
                  'Rem. Feed (Bags)',
                  'Avg Carton Price (PKR)',
                  'Cost / Bird (PKR)',
                ],
                rows: ceoMonthlyRows.map((r) => [
                  r.monthLabel,
                  Math.round(r.carriedPrevCartons),
                  Math.round(r.totalCartonsProduced),
                  Math.round(r.cartonsSold),
                  Math.round(r.carriedNextCartons),
                  Math.round(r.totalSales),
                  Math.round(r.totalExpenses),
                  Math.round(r.netIncome),
                  r.feedConsumedBags,
                  r.remainingFeedBags,
                  Math.round(r.avgCartonPrice),
                  Math.round(r.avgPerBirdCost),
                ]),
              },
            ]
          : []),
        ...(bankSummary.banks.length > 0
          ? [
              {
                title: 'BANK BALANCES LEDGER',
                columns: [
                  'Bank Name',
                  'Account Title',
                  'Account No',
                  'Opening Date',
                  'Opening Balance (PKR)',
                  'Period Sales Added (PKR)',
                  'Total Sales Added (PKR)',
                  'Current Balance (PKR)',
                ],
                rows: bankSummary.banks.map((b) => [
                  b.bank.bankName,
                  b.bank.accountTitle,
                  b.bank.accountNumber || '',
                  b.bank.openingDate,
                  Math.round(b.openingBalance),
                  Math.round(b.salesInPeriod),
                  Math.round(b.totalSalesAdded),
                  Math.round(b.currentBalance),
                ]),
              },
            ]
          : []),
      ],
    };
  };

  const getActiveRecordsExportPayload = () => {
    const unitLabel = selectedUnit === 'all' ? 'All_Units' : selectedUnit.replace(/\s+/g, '_');
    const rangeLabel = fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || 'Latest'}` : 'All Dates';
    const stamp = new Date().toISOString().slice(0, 10);

    if (activeReport === 'egg-production') {
      let sumMorning = 0;
      let sumEvening = 0;
      let sumTotal = 0;
      let sumBroken = 0;
      let sumRate = 0;
      const pdfRows = filteredEggs.map((e) => {
        const m = Number(e.morningEggs || 0);
        const ev = Number(e.eveningEggs || 0);
        const tot = Number(e.totalEggs || 0);
        const brk = Number(e.damagedEggs || e.brokenEggs || 0);
        sumMorning += m;
        sumEvening += ev;
        sumTotal += tot;
        sumBroken += brk;
        sumRate += Number(e.layingRatePercent || 0);
        return [
          `#${e.trackingId || e.id}`,
          e.date,
          e.flockName || 'Unit',
          m.toLocaleString(),
          ev.toLocaleString(),
          tot.toLocaleString(),
          (tot / 360).toFixed(1),
          brk.toLocaleString(),
          `${e.averageWeight || 60} g`,
          `${e.layingRatePercent || 0}%`,
        ];
      });
      const csvRows = filteredEggs.map((e) => [
        e.trackingId || e.id,
        e.date,
        e.flockName || 'Unit',
        Number(e.morningEggs || 0),
        Number(e.eveningEggs || 0),
        Number(e.totalEggs || 0),
        Number(((e.totalEggs || 0) / 360).toFixed(2)),
        Number(e.damagedEggs || e.brokenEggs || 0),
        Number(e.averageWeight || 60),
        `${e.layingRatePercent || 0}%`,
      ]);
      const avgRate = filteredEggs.length > 0 ? `${(sumRate / filteredEggs.length).toFixed(1)}%` : '0%';
      return {
        title: 'Egg Production Audit Records',
        subtitle: `Unit: ${selectedUnit === 'all' ? 'All Units' : selectedUnit}  |  Range: ${rangeLabel}`,
        filenameBase: `GreenOva_Egg_Production_Audit_${unitLabel}_${stamp}`,
        columns: [
          { header: 'ID', width: 16 },
          { header: 'Date', width: 22 },
          { header: 'Unit / Flock', width: 24 },
          { header: 'Morning', align: 'right' as const, width: 24 },
          { header: 'Evening', align: 'right' as const, width: 24 },
          { header: 'Total Eggs', align: 'right' as const, width: 26 },
          { header: 'Cartons', align: 'right' as const, width: 22 },
          { header: 'Broken', align: 'right' as const, width: 20 },
          { header: 'Avg Wt', align: 'right' as const, width: 20 },
          { header: 'Laying %', align: 'right' as const, width: 22 },
        ],
        rows: pdfRows,
        csvRows,
        totalsRow: [
          'TOTAL',
          '',
          '',
          sumMorning.toLocaleString(),
          sumEvening.toLocaleString(),
          sumTotal.toLocaleString(),
          (sumTotal / 360).toFixed(1),
          sumBroken.toLocaleString(),
          '',
          avgRate,
        ],
      };
    }

    if (activeReport === 'sales-revenue') {
      let sumQty = 0;
      let sumOnline = 0;
      let sumCash = 0;
      let sumAmt = 0;
      const pdfRows = filteredSales.map((s) => {
        const qty = Number(s.quantity || 0);
        const amt = Number(s.amount || 0);
        const onl = Number(s.onlinePayment || (s.paymentMethod === 'Bank Transfer' ? amt : 0));
        const csh = Number(s.cashPayment || (s.paymentMethod === 'Cash' ? amt : 0));
        sumQty += qty;
        sumOnline += onl;
        sumCash += csh;
        sumAmt += amt;
        return [
          `#${s.trackingId || s.id}`,
          s.date,
          s.flockName || s.flock || 'Unit',
          s.category,
          (qty / 360).toFixed(1),
          Math.round((s.unitPrice || 0) * 360).toLocaleString(),
          onl > 0 ? onl.toLocaleString() : '-',
          csh > 0 ? csh.toLocaleString() : '-',
          amt.toLocaleString(),
          [s.vehicleNumber, s.challanNo ? `CH-${s.challanNo}` : ''].filter(Boolean).join(' • ') || '-',
          s.notes || '-',
        ];
      });
      const csvRows = filteredSales.map((s) => {
        const qty = Number(s.quantity || 0);
        const amt = Number(s.amount || 0);
        const onl = Number(s.onlinePayment || (s.paymentMethod === 'Bank Transfer' ? amt : 0));
        const csh = Number(s.cashPayment || (s.paymentMethod === 'Cash' ? amt : 0));
        return [
          s.trackingId || s.id,
          s.date,
          s.flockName || s.flock || 'Unit',
          s.category,
          Number((qty / 360).toFixed(2)),
          Math.round((s.unitPrice || 0) * 360),
          onl,
          csh,
          amt,
          [s.vehicleNumber, s.challanNo].filter(Boolean).join('-'),
          s.notes || '',
        ];
      });
      return {
        title: 'Sales & Revenue Audit Records',
        subtitle: `Unit: ${selectedUnit === 'all' ? 'All Units' : selectedUnit}  |  Range: ${rangeLabel}`,
        filenameBase: `GreenOva_Sales_Revenue_Audit_${unitLabel}_${stamp}`,
        columns: [
          { header: 'ID', width: 15 },
          { header: 'Date', width: 20 },
          { header: 'Unit / Flock', width: 20 },
          { header: 'Category', width: 22 },
          { header: 'Cartons', align: 'right' as const, width: 18 },
          { header: 'Rate/Ctn', align: 'right' as const, width: 20 },
          { header: 'Online (PKR)', align: 'right' as const, width: 24 },
          { header: 'Cash (PKR)', align: 'right' as const, width: 24 },
          { header: 'Total (PKR)', align: 'right' as const, width: 26 },
          { header: 'Vehicle / Challan', width: 26 },
          { header: 'Notes' },
        ],
        rows: pdfRows,
        csvRows,
        totalsRow: [
          'TOTAL',
          '',
          '',
          '',
          (sumQty / 360).toFixed(1),
          '',
          sumOnline.toLocaleString(),
          sumCash.toLocaleString(),
          sumAmt.toLocaleString(),
          '',
          '',
        ],
      };
    }

    if (activeReport === 'stock-inventory') {
      let sumBags = 0;
      let sumAmt = 0;
      const pdfRows = filteredStocks.map((r) => {
        const bags = Number(r.quantity || 0);
        const amt = Number(r.amount || 0);
        sumBags += bags;
        sumAmt += amt;
        return [
          `#${r.trackingId || r.id}`,
          r.rawDate || r.date,
          r.flockName,
          r.head,
          `Feed ${r.type}`,
          bags.toLocaleString(),
          (r.costPerBag || 0).toLocaleString(),
          amt.toLocaleString(),
          r.paymentType,
          r.challanNo ? `CH-${r.challanNo}` : '-',
          r.notes || '-',
        ];
      });
      const csvRows = filteredStocks.map((r) => [
        r.trackingId || r.id,
        r.rawDate || r.date,
        r.flockName,
        r.head,
        r.feedType,
        Number(r.quantity || 0),
        Number(r.costPerBag || 0),
        Number(r.amount || 0),
        r.paymentType,
        r.challanNo || '',
        r.notes || '',
      ]);
      const avgRate = sumBags > 0 ? Math.round(sumAmt / sumBags) : 0;
      return {
        title: 'Stock & Inventory Audit Records',
        subtitle: `Unit: ${selectedUnit === 'all' ? 'All Units' : selectedUnit}  |  Range: ${rangeLabel}`,
        filenameBase: `GreenOva_Stock_Inventory_Audit_${unitLabel}_${stamp}`,
        columns: [
          { header: 'ID', width: 15 },
          { header: 'Date', width: 20 },
          { header: 'Unit / Flock', width: 20 },
          { header: 'Head', width: 18 },
          { header: 'Feed Type', width: 22 },
          { header: 'Qty (Bags)', align: 'right' as const, width: 20 },
          { header: 'Rate/Bag', align: 'right' as const, width: 20 },
          { header: 'Amount (PKR)', align: 'right' as const, width: 26 },
          { header: 'Payment', width: 20 },
          { header: 'Challan #', width: 22 },
          { header: 'Notes' },
        ],
        rows: pdfRows,
        csvRows,
        totalsRow: [
          'TOTAL',
          '',
          '',
          '',
          '',
          sumBags.toLocaleString(),
          avgRate.toLocaleString(),
          sumAmt.toLocaleString(),
          '',
          '',
          '',
        ],
      };
    }

    // flock-health mortality & health audit records
    let sumCasualties = 0;
    const pdfRows = filteredMortality.map((m) => {
      const cnt = Number(m.count || 0);
      sumCasualties += cnt;
      return [
        `#${m.id}`,
        m.date,
        m.flockName || 'Unit',
        cnt.toLocaleString(),
        m.cause || 'Natural / Routine',
        m.symptoms || '-',
        m.recordedBy || '-',
      ];
    });
    const csvRows = filteredMortality.map((m) => [
      m.id,
      m.date,
      m.flockName || 'Unit',
      Number(m.count || 0),
      m.cause || 'Natural / Routine',
      m.symptoms || '',
      m.recordedBy || '',
    ]);
    return {
      title: 'Flock & Bird Health Audit Records',
      subtitle: `Unit: ${selectedUnit === 'all' ? 'All Units' : selectedUnit}  |  Range: ${rangeLabel}`,
      filenameBase: `GreenOva_Flock_Health_Audit_${unitLabel}_${stamp}`,
      columns: [
        { header: 'ID', width: 22 },
        { header: 'Date', width: 24 },
        { header: 'Unit / Flock', width: 28 },
        { header: 'Mortality (Birds)', align: 'right' as const, width: 28 },
        { header: 'Cause', width: 50 },
        { header: 'Symptoms', width: 55 },
        { header: 'Recorded By' },
      ],
      rows: pdfRows,
      csvRows,
      totalsRow: ['TOTAL', '', '', sumCasualties.toLocaleString(), '', '', ''],
    };
  };

  const handleExportCSV = () => {
    if (activeReport === 'income-vs-expense') {
      const payload = buildIncomeVsExpenseExports();
      downloadStructuredCSV(payload.filenameBase, payload.csvSections);
      return;
    }
    const payload = getActiveRecordsExportPayload();
    if (payload.rows.length === 0) return;
    downloadRecordsCSV(payload);
  };

  const handleExportPDF = () => {
    if (activeReport === 'income-vs-expense') {
      const payload = buildIncomeVsExpenseExports();
      downloadIncomeStatementPDF(payload);
      return;
    }
    const payload = getActiveRecordsExportPayload();
    if (payload.rows.length === 0) return;
    downloadRecordsPDF({ ...payload, orientation: 'landscape' });
  };

  const isRecordsTab = activeReport !== 'income-vs-expense';
  const disableRecordsExport = isRecordsTab && currentDatasetLength === 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Farm Analytics & Audit Reports"
        subtitle="Executive income statement, KPI summary cards, and precise audit registries."
        icon={FileBarChart2}
        iconColor="emerald"
        badge="Analytics Engine"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <UIButton
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
              disabled={disableRecordsExport}
            >
              {isRecordsTab
                ? `Export CSV (${currentDatasetLength.toLocaleString()})`
                : 'Export CSV'}
            </UIButton>
            <UIButton
              variant="primary"
              icon={FileText}
              onClick={handleExportPDF}
              disabled={disableRecordsExport}
            >
              {isRecordsTab
                ? `Download PDF (${currentDatasetLength.toLocaleString()})`
                : 'Download PDF'}
            </UIButton>
          </div>
        }
      />

      {/* Main Report Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveReport('income-vs-expense');
            setCurrentPage(1);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeReport === 'income-vs-expense'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Income vs Expenses Summary</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeReport === 'income-vs-expense'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            Income Statement
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('egg-production');
            setCurrentPage(1);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeReport === 'egg-production'
              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Egg className="w-4 h-4" />
          <span>Egg Production Audit Report</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeReport === 'egg-production'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {eggDataset.length.toLocaleString()} Logs
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('sales-revenue');
            setCurrentPage(1);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeReport === 'sales-revenue'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Sales &amp; Revenue Audit Report</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeReport === 'sales-revenue'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {salesDataset.length.toLocaleString()} Sales
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('stock-inventory');
            setCurrentPage(1);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeReport === 'stock-inventory'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Stock &amp; Inventory Audit Report</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeReport === 'stock-inventory'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {stockDataset.length.toLocaleString()} Logs
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('flock-health');
            setCurrentPage(1);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeReport === 'flock-health'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Flock &amp; Bird Health Audit</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeReport === 'flock-health'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {mortalityLogs.length.toLocaleString()} Logs
          </span>
        </button>
      </div>

      {/* Quick Unit Filters with Live Dynamic Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800">Unit-Wise Segmentation:</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any unit to focus report metrics and audit rows
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {activeReport === 'income-vs-expense' ? (
            <>
              {[
                { key: 'all', label: 'All Units Combined', data: ceoAllMetrics },
                { key: 'Unit 1', label: 'Unit 1', data: ceoUnit1Metrics },
                { key: 'Unit 2', label: 'Unit 2', data: ceoUnit2Metrics },
                { key: 'Unit 3', label: 'Unit 3', data: ceoUnit3Metrics },
              ].map(({ key, label, data }) => {
                const isSelected = selectedUnit === key;
                const isProfit = data.netIncome >= 0;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(key);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? isProfit
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                            : isProfit
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {data.netMarginPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1">
                      Net: {fmtCompactReportPkr(data.netIncome)}
                    </div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Sale: {fmtCompactReportPkr(data.totalSalesRevenue)} • Exp: {fmtCompactReportPkr(data.totalExpenses)}
                    </div>
                  </button>
                );
              })}
            </>
          ) : activeReport === 'egg-production' ? (
            <>
              {eggUnitCards.map((u) => {
                const isSelected = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(u.key);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{u.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {u.count.toLocaleString()} Logs
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1">
                      {u.cartons.toLocaleString()} Cartons{' '}
                      <span className="text-[10px] font-normal">
                        ({(u.eggs / 1_000_000).toFixed(2)}M Eggs{u.key !== 'all' ? ` • ${u.share}%` : ''})
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          ) : activeReport === 'sales-revenue' ? (
            <>
              {salesUnitCards.map((u) => {
                const isSelected = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(u.key);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{u.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {u.count.toLocaleString()} Sales
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1">
                      {fmtCompactReportPkr(u.amount)}{' '}
                      <span className="text-[10px] font-normal">
                        ({u.cartons.toLocaleString()} Ctns{u.key !== 'all' ? ` • ${u.share}%` : ''})
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          ) : activeReport === 'stock-inventory' ? (
            <>
              {stockUnitCards.map((u) => {
                const isSelected = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(u.key);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{u.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {u.count.toLocaleString()} Logs
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1">
                      {u.bags.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal">
                        Bags{u.key !== 'all' ? ` (${u.share}%)` : ''}
                      </span>
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {fmtCompactReportPkr(u.amount)}
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {healthUnitCards.map((u) => {
                const isSelected = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(u.key);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{u.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {u.livability}% Live
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1">
                      {u.activeBirds.toLocaleString()} <span className="text-[10px] font-normal">Birds</span>
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      Mortality: {u.mortality.toLocaleString()} ({u.incidents} logs)
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Unified Date, Month/Year & Filter Bar */}
      <DateRangePickerBar
        showFarmSelector={false}
        showFlockSelector={false}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
        onYearChange={handleYearChange}
        availableYears={availableYears}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={(from, to) => {
          setFromDate(from);
          setToDate(to);
          setSelectedMonth('custom');
          setPreset('custom');
          setCurrentPage(1);
        }}
        activePreset={preset}
        onPresetChange={handlePresetChange}
        onReset={handleResetFilters}
        leftSlot={
          <>
            {/* Search Input (shown for detailed audit registries) */}
            {activeReport !== 'income-vs-expense' && (
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeReport === 'egg-production'
                      ? 'Search by ID, date, flock...'
                      : activeReport === 'sales-revenue'
                      ? 'Search by ID, vehicle, category...'
                      : 'Search by ID, challan, D.O. #, notes...'
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            )}

            {/* Sales Category filter (if Sales Report is active) */}
            {activeReport === 'sales-revenue' && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('EGG');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'EGG'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eggs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Manure');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'Manure'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Feed BAGS');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'Feed BAGS'
                      ? 'bg-white text-blue-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Feed Bags
                </button>
              </div>
            )}
          </>
        }
      />

      {/* --- REPORT VIEW 0: INCOME VS EXPENSES SUMMARY --- */}
      {activeReport === 'income-vs-expense' && (
        <CeoIncomeExpenseReport
          metrics={activeCeoMetrics}
          monthlyRows={ceoMonthlyRows}
          unitMatrix={[
            { unitName: 'Unit 1', metrics: ceoUnit1Metrics },
            { unitName: 'Unit 2', metrics: ceoUnit2Metrics },
            { unitName: 'Unit 3', metrics: ceoUnit3Metrics },
            { unitName: 'All Units', metrics: ceoAllMetrics },
          ]}
          bankSummary={bankSummary}
          bankAccounts={bankAccounts}
          selectedUnit={selectedUnit}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          fromDate={fromDate}
          toDate={toDate}
          onSelectMonth={(m) => handleMonthChange(m)}
          onSelectUnit={(u) => {
            setSelectedUnit(u);
            setCurrentPage(1);
          }}
          onAddBank={onAddBank}
          onEditBank={onEditBank}
          onDeleteBank={onDeleteBank}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* --- REPORT VIEW 1: EGG PRODUCTION AUDIT REPORT --- */}
      {activeReport === 'egg-production' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Audited Production"
              value={eggTotals.totalEggs}
              unit="Eggs"
              icon={Egg}
              color="amber"
              badge={{ text: `${Math.round(eggTotals.totalEggs / 360).toLocaleString()} Cartons`, color: 'amber' }}
              subtext={`${Math.round(eggTotals.totalEggs / 360).toLocaleString()} standard cartons (360 eggs/ctn)`}
            />

            <StatCard
              title="Damaged / Broken Eggs"
              value={eggTotals.brokenEggs}
              unit="Eggs"
              icon={HeartPulse}
              color="rose"
              valueColor="text-rose-600"
              badge={{
                text: `${((eggTotals.brokenEggs / (eggTotals.totalEggs || 1)) * 100).toFixed(2)}% loss`,
                color: 'rose',
              }}
              subtext="Total cracked/broken eggs reported"
            />

            <StatCard
              title="Clean Trays / Cartons"
              value={`${Math.round(eggTotals.cleanTrays / 12).toLocaleString()}`}
              unit="Cartons"
              icon={Package}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: `${eggTotals.cleanTrays.toLocaleString()} Trays`, color: 'emerald' }}
              subtext="Clean packable cartons (12 trays / ctn)"
            />

            <StatCard
              title="Average Laying Rate"
              value={`${eggTotals.avgLaying}%`}
              icon={TrendingUp}
              color="blue"
              badge={{ text: Number(eggTotals.avgLaying) >= 80 ? 'Optimal' : 'Standard', color: 'blue' }}
              trend={{ value: `${eggTotals.avgLaying}% rate`, isUp: Number(eggTotals.avgLaying) >= 80 }}
              subtext="Mean operational laying efficiency"
            />
          </div>

          <TableCard
            title="Egg Production Audit Registry"
            subtitle={`Showing logs ${startIndex + 1} to ${Math.min(startIndex + recordsPerPage, currentDatasetLength)} of ${currentDatasetLength} records (10 per page)`}
            badge={
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {currentDatasetLength} Filtered Logs
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3"># ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Flock / Unit</th>
                    <th className="py-3 px-3 text-right">Morning Eggs</th>
                    <th className="py-3 px-3 text-right">Evening Eggs</th>
                    <th className="py-3 px-3 text-right">Total Production (Cartons)</th>
                    <th className="py-3 px-3 text-right">Total Cartons</th>
                    <th className="py-3 px-3 text-right">Broken Eggs</th>
                    <th className="py-3 px-3 text-right">Avg Weight</th>
                    <th className="py-3 px-3 text-right">Laying Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEggs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No egg production records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedEggs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          #{log.trackingId || log.id}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              log.flockName?.includes('Unit 2')
                                ? 'bg-amber-100 text-amber-900'
                                : log.flockName?.includes('Unit 1')
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {log.flockName || 'Unit'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {(log.morningEggs || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {(log.eveningEggs || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-amber-700">
                          <div>
                            <span className="font-bold text-slate-900">{((log.totalEggs || 0) / 360).toFixed(1)}</span> <span className="text-[10px] text-slate-500 font-normal">ctn</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">({(log.totalEggs || 0).toLocaleString()} eggs)</div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold font-mono text-slate-800">
                          <div>{((log.cleanTrays || 0) / 12).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">ctn</span></div>
                          <div className="text-[10px] text-slate-500 font-normal">360 eggs/ctn</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          {(log.damagedEggs || log.brokenEggs || 0) > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {(log.damagedEggs || log.brokenEggs || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {log.averageWeight ? `${log.averageWeight} g` : '60.0 g'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            {log.layingRatePercent || 85.8}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                <span className="font-bold">{Math.min(startIndex + recordsPerPage, currentDatasetLength)}</span> of{' '}
                <span className="font-bold">{currentDatasetLength}</span> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold bg-white border border-slate-200 rounded-lg">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                <form onSubmit={handleJumpSubmit} className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-slate-500 text-[11px]">Go:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder="#"
                    className="w-12 py-1 px-1.5 text-center text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs font-bold bg-amber-500 text-white rounded-md hover:bg-amber-600"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </TableCard>
        </div>
      )}

      {/* --- REPORT VIEW 2: SALES & REVENUE AUDIT REPORT --- */}
      {activeReport === 'sales-revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Audited Sales"
              value={`Rs. ${Math.round(salesTotals.totalRevenue).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: `${salesTotals.count} Sales`, color: 'emerald' }}
              subtext="Reconciled commercial sales"
            />

            <StatCard
              title="Total Cartons Sold"
              value={Math.round(salesTotals.totalItems / 360)}
              unit="Cartons"
              icon={Package}
              color="blue"
              badge={{ text: '360 Eggs / Carton', color: 'blue' }}
              subtext={`${salesTotals.totalItems.toLocaleString()} total eggs shipped`}
            />

            <StatCard
              title="Online Settlements"
              value={`Rs. ${Math.round(salesTotals.totalOnline).toLocaleString()}`}
              icon={CreditCard}
              color="purple"
              valueColor="text-purple-700"
              badge={{
                text: `${((salesTotals.totalOnline / (salesTotals.totalRevenue || 1)) * 100).toFixed(1)}%`,
                color: 'purple',
              }}
              subtext="Direct bank transfers & digital challans"
            />

            <StatCard
              title="Cash Collections"
              value={`Rs. ${Math.round(salesTotals.totalCash).toLocaleString()}`}
              icon={Banknote}
              color="amber"
              valueColor="text-amber-700"
              badge={{
                text: `${((salesTotals.totalCash / (salesTotals.totalRevenue || 1)) * 100).toFixed(1)}%`,
                color: 'amber',
              }}
              subtext="Counter receipts & vehicle driver cash"
            />
          </div>

          <TableCard
            title="Commercial Sales & Revenue Registry"
            subtitle={`Showing sales ${startIndex + 1} to ${Math.min(startIndex + recordsPerPage, currentDatasetLength)} of ${currentDatasetLength} records (10 per page)`}
            badge={
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                {currentDatasetLength} Filtered Sales
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3"># ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Flock / Unit</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Cartons Sold (Eggs)</th>
                    <th className="py-3 px-3 text-right">Rate / Carton</th>
                    <th className="py-3 px-3 text-right">Online Pay</th>
                    <th className="py-3 px-3 text-right">Cash Pay</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3">Vehicle / Challan</th>
                    <th className="py-3 px-3">Buyer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No sales records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          #{sale.trackingId || sale.id}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {sale.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              (sale.flockName || sale.flock || '').includes('Unit 2')
                                ? 'bg-amber-100 text-amber-900'
                                : (sale.flockName || sale.flock || '').includes('Unit 1')
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {sale.flockName || sale.flock || 'Unit'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              sale.category === 'EGG' || sale.category === 'Egg Sales'
                                ? 'bg-amber-100 text-amber-900'
                                : sale.category === 'Manure' || sale.category === 'Manure Sales'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {sale.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900">{(sale.quantity / 360).toFixed(1)}</span> <span className="text-[10px] text-slate-500">ctn</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">({(sale.quantity || 0).toLocaleString()} eggs)</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          <div className="font-semibold text-emerald-800">Rs. {Math.round((sale.unitPrice || 0) * 360).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Rs. {(sale.unitPrice || 0).toFixed(2)}/egg</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-purple-700 font-medium">
                          {(sale.onlinePayment || 0) > 0 ? `Rs. ${sale.onlinePayment.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-700 font-medium">
                          {(sale.cashPayment || 0) > 0 ? `Rs. ${sale.cashPayment.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-emerald-800">
                          Rs. {(sale.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {sale.vehicleNumber || 'ABC'} {sale.challanNo ? `• CH-${sale.challanNo}` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[180px] truncate" title={sale.notes}>
                          {sale.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                <span className="font-bold">{Math.min(startIndex + recordsPerPage, currentDatasetLength)}</span> of{' '}
                <span className="font-bold">{currentDatasetLength}</span> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold bg-white border border-slate-200 rounded-lg">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                <form onSubmit={handleJumpSubmit} className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-slate-500 text-[11px]">Go:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder="#"
                    className="w-12 py-1 px-1.5 text-center text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </TableCard>
        </div>
      )}

      {/* --- REPORT VIEW 3: STOCK & INVENTORY AUDIT REPORT --- */}
      {activeReport === 'stock-inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bags Received"
              value={stockTotals.totalBags}
              unit="Bags"
              icon={Package}
              color="indigo"
              badge={{ text: `${stockTotals.count} Shipments`, color: 'indigo' }}
              subtext="Layer Feed Formulations (50kg bags)"
            />

            <StatCard
              title="Total Stock Amount Paid"
              value={`Rs. ${Math.round(stockTotals.totalAmount).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: '100% Reconciled', color: 'emerald' }}
              subtext="Total feed invoice disbursements"
            />

            <StatCard
              title="Average Rate / Bag"
              value={`Rs. ${stockTotals.avgCost.toLocaleString()}`}
              icon={Scale}
              color="blue"
              badge={{ text: '~Rs. 117 / kg', color: 'blue' }}
              subtext="Weighted average procurement cost"
            />

            <StatCard
              title="Active Feed Units"
              value={`${flocks.length} Sheds`}
              icon={Building2}
              color="amber"
              badge={{ text: selectedUnit === 'all' ? 'Units 1, 2, 3' : selectedUnit, color: 'amber' }}
              subtext={
                stockTotals.totalBags > 0
                  ? `${stockTotals.count} deliveries • ${(stockTotals.totalBags * 50).toLocaleString()} kg`
                  : 'No shipments in filtered range'
              }
            />
          </div>

          <TableCard
            title="Feed Stock & Replenishment Registry"
            subtitle={`Showing shipments ${startIndex + 1} to ${Math.min(startIndex + recordsPerPage, currentDatasetLength)} of ${currentDatasetLength} records (10 per page)`}
            badge={
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                {currentDatasetLength} Filtered Shipments
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3"># ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Feed Type</th>
                    <th className="py-3 px-3">Flock / Unit</th>
                    <th className="py-3 px-3">Head</th>
                    <th className="py-3 px-3 text-right">Quantity (Bags)</th>
                    <th className="py-3 px-3 text-right">Amount (PKR)</th>
                    <th className="py-3 px-3 text-right">Avg Rate/Bag</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Challan #</th>
                    <th className="py-3 px-3">D.O. / Dispatch Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStocks.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No stock records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStocks.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          #{record.trackingId}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {record.rawDate || record.date}
                        </td>
                        <td className="py-3 px-3 font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              record.type === '13'
                                ? 'bg-indigo-100 text-indigo-900'
                                : record.type === '11'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-teal-100 text-teal-900'
                            }`}
                          >
                            Feed {record.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              record.flockName.includes('Unit 2')
                                ? 'bg-amber-100 text-amber-900'
                                : record.flockName.includes('Unit 1')
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {record.flockName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">
                          {record.head}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-indigo-900">
                          {record.quantity.toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">bags</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-emerald-800">
                          Rs. {record.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          Rs. {record.costPerBag ? record.costPerBag.toLocaleString() : '0'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              record.paymentType === 'CASH'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {record.paymentType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">
                          {record.challanNo ? `CH-${record.challanNo}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[200px] truncate" title={record.notes}>
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                <span className="font-bold">{Math.min(startIndex + recordsPerPage, currentDatasetLength)}</span> of{' '}
                <span className="font-bold">{currentDatasetLength}</span> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold bg-white border border-slate-200 rounded-lg">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                <form onSubmit={handleJumpSubmit} className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-slate-500 text-[11px]">Go:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder="#"
                    className="w-12 py-1 px-1.5 text-center text-xs bg-white border border-slate-200 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </TableCard>
        </div>
      )}

      {/* --- REPORT VIEW 4: FLOCK & BIRD HEALTH AUDIT --- */}
      {activeReport === 'flock-health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Period Mortality"
              value={
                !fromDate && !toDate
                  ? flocks
                      .filter(
                        (f) =>
                          selectedUnit === 'all' ||
                          f.name.toLowerCase().includes(selectedUnit.toLowerCase()) ||
                          (selectedUnit === 'Unit 1' && String(f.id) === '8') ||
                          (selectedUnit === 'Unit 2' && String(f.id) === '9') ||
                          (selectedUnit === 'Unit 3' && String(f.id) === '10')
                      )
                      .reduce((acc, f) => acc + (f.mortality || 0), 0)
                  : filteredMortality.reduce((acc, curr) => acc + curr.count, 0)
              }
              unit="Birds"
              icon={HeartPulse}
              color="rose"
              valueColor="text-rose-600"
              badge={{ text: `${filteredMortality.length} Incidents`, color: 'rose' }}
              subtext="Total casualties in filtered period"
            />

            <StatCard
              title="Feed Consumed"
              value={filteredConsumption.reduce((acc, curr) => acc + curr.feedQuantityKg, 0)}
              unit="kg"
              icon={Scale}
              color="blue"
              badge={{
                text: `~${Math.round(filteredConsumption.reduce((acc, curr) => acc + curr.feedQuantityKg, 0) / 50)} Bags`,
                color: 'blue',
              }}
              subtext="Nutritional mash consumed"
            />

            <StatCard
              title="Active Flocks"
              value={flocks.length}
              unit="Sheds"
              icon={Award}
              color="emerald"
              badge={{ text: 'Sheds 1, 2, 3', color: 'emerald' }}
              subtext="Lohmann Brown & Hy-Line W-36"
            />

            <StatCard
              title="Average Laying Rate"
              value={`${eggTotals.avgLaying}%`}
              icon={TrendingUp}
              color="amber"
              badge={{ text: 'Efficiency', color: 'amber' }}
              subtext="Combined period lay rate"
            />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Active Flock Performance Benchmarks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparative telemetry of live layer sheds
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {flocks.map((flock) => {
                const flockEggs = filteredEggs.filter(
                  (e) => e.flockId === flock.id || e.flockName === flock.name
                );
                const flockEggsCount = flockEggs.reduce((acc, curr) => acc + curr.totalEggs, 0);
                const livability = flock.initialCount > 0 ? ((flock.currentCount / flock.initialCount) * 100).toFixed(1) : '100.0';
                const logMort = filteredMortality
                  .filter((m) => String(m.flockId) === String(flock.id) || m.flockName === flock.name)
                  .reduce((s, m) => s + (m.count || 0), 0);
                const flockMort =
                  !fromDate && !toDate && flock.mortality !== undefined ? flock.mortality : logMort;

                return (
                  <div
                    key={flock.id}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{flock.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {flock.shedNumber} • {flock.breed}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {flock.purpose}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-200/60 pt-3">
                      <div className="flex justify-between">
                        <span>Period Production:</span>
                        <span className="font-bold text-emerald-700">
                          {flockEggsCount.toLocaleString()} eggs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Population:</span>
                        <span className="font-bold text-slate-900">
                          {flock.currentCount.toLocaleString()} birds
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Mortality:</span>
                        <span className="font-bold text-rose-600">
                          {flockMort.toLocaleString()} birds
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Livability:</span>
                        <span className="font-bold text-emerald-700">{livability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target FCR:</span>
                        <span className="font-semibold text-slate-800">{flock.targetFCR || 2.1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TableCard
            title="Mortality &amp; Bird Health Log Registry"
            subtitle={`Showing logs ${filteredMortality.length === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + recordsPerPage, currentDatasetLength)} of ${currentDatasetLength} records (10 per page)`}
            badge={
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
                {currentDatasetLength} Filtered Logs
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3"># ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Flock / Unit</th>
                    <th className="py-3 px-3 text-right">Casualties</th>
                    <th className="py-3 px-3">Cause</th>
                    <th className="py-3 px-3">Symptoms</th>
                    <th className="py-3 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMortality.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No bird health / mortality records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedMortality.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">#{m.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {m.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {m.flockName || 'Unit'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {(m.count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{m.cause || 'Natural / Routine'}</td>
                        <td className="py-3 px-3 text-slate-600">{m.symptoms || '-'}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                          {m.recordedBy || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {currentDatasetLength > recordsPerPage && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-600">
                  Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                  <span className="font-bold">{Math.min(startIndex + recordsPerPage, currentDatasetLength)}</span> of{' '}
                  <span className="font-bold">{currentDatasetLength}</span> records
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold bg-white border border-slate-200 rounded-lg">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </TableCard>
        </div>
      )}
    </div>
  );
};
