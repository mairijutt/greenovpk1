import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  Layers,
  Layers2,
  Filter,
  Paperclip,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  BarChart2,
  Calendar,
  Info,
  Wheat,
} from 'lucide-react';
import { FinancialRecord } from '../types/farm.ts';
import {
  EXPENSE_HEADS_21,
  unitWiseExpenseSummary,
  liveExpenseBreakdown,
} from '../data/liveExpenses.ts';
import {
  SALES_SUMMARY,
  liveSalesBreakdown,
  unitWiseSalesSummary,
} from '../data/liveSales.ts';
import {
  StatCard,
  PageHeader,
  UIButton,
  UIInput,
  UISelect,
  UITextarea,
  UISearchInput,
  UIFilterBar,
  TableCard,
  DateRangePickerBar,
  DatePreset,
} from './ui';

interface FinanceViewProps {
  financials: FinancialRecord[];
  onAddTransaction: (record: FinancialRecord) => void;
  defaultType?: 'all' | 'Income' | 'Expense';
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  financials,
  onAddTransaction,
  defaultType = 'all',
}) => {
  const latestDate = useMemo(() => {
    return financials[0]?.date || '2026-10-25';
  }, [financials]);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Income' | 'Expense'>(defaultType);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedHead, setSelectedHead] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [showAllHeads, setShowAllHeads] = useState(false);

  // Interactive Revenue Graph States (Monthly vs Weekly)
  const [revenueGraphMode, setRevenueGraphMode] = useState<'monthly' | 'weekly'>('monthly');
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null);

  // Interactive Expense Graph States (Monthly vs Weekly)
  const [expenseGraphMode, setExpenseGraphMode] = useState<'monthly' | 'weekly'>('monthly');
  const [hoveredExpenseIndex, setHoveredExpenseIndex] = useState<number | null>(null);

  // Pagination State - 10 records per page as requested
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Synchronize if defaultType changes from navigation
  useEffect(() => {
    setSelectedType(defaultType);
  }, [defaultType]);

  // Reset to first page whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedUnit, selectedHead, fromDate, toDate, preset, pageSize]);

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
    setFromDate('');
    setToDate('');
    setPreset('all');
    setSearchTerm('');
    setSelectedUnit('all');
    setSelectedHead('all');
    setCurrentPage(1);
  };

  const [newRecord, setNewRecord] = useState({
    type: defaultType === 'Expense' ? ('Expense' as const) : ('Income' as const),
    head: defaultType === 'Income' ? 'EGG' : 'FEED',
    flockName: 'Unit 1',
    flockId: 8,
    amount: defaultType === 'Income' ? 250000 : 150000,
    paymentMode: 'Online' as 'Online' | 'Cash' | 'Split',
    onlineAmount: defaultType === 'Income' ? 250000 : 0,
    cashAmount: 0,
    referenceNo: `INV-${Date.now().toString().slice(-4)}`,
    challanNo: `${Math.floor(100 + Math.random() * 900)}`,
    description: '',
  });

  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [previewRecord, setPreviewRecord] = useState<FinancialRecord | null>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentName('');
    setAttachmentData(null);
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    return financials.filter((fin) => {
      // Search match
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (fin.referenceNo && fin.referenceNo.toLowerCase().includes(term)) ||
        (fin.category && fin.category.toLowerCase().includes(term)) ||
        (fin.head && fin.head.toLowerCase().includes(term)) ||
        (fin.description && fin.description.toLowerCase().includes(term)) ||
        (fin.notes && fin.notes.toLowerCase().includes(term)) ||
        (fin.challanNo && fin.challanNo.toLowerCase().includes(term)) ||
        (fin.flockName && fin.flockName.toLowerCase().includes(term)) ||
        (fin.trackingId && String(fin.trackingId).includes(term)) ||
        fin.date.includes(term);

      // Type match
      const matchesType = selectedType === 'all' || fin.type === selectedType;

      // Unit match
      const finUnit = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : undefined);
      const matchesUnit =
        selectedUnit === 'all' ||
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'));

      // Head match
      const finHead = fin.head || fin.category;
      const matchesHead = selectedHead === 'all' || finHead === selectedHead;

      // Date match
      const matchesFrom = !fromDate || fin.date >= fromDate;
      const matchesTo = !toDate || fin.date <= toDate;

      return matchesSearch && matchesType && matchesUnit && matchesHead && matchesFrom && matchesTo;
    });
  }, [financials, searchTerm, selectedType, selectedUnit, selectedHead, fromDate, toDate]);

  // Aggregated totals across full filtered records
  const totalIncome = useMemo(() => {
    return filtered
      .filter((f) => f.type === 'Income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return filtered
      .filter((f) => f.type === 'Expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filtered]);

  const netMargin = totalIncome - totalExpense;
  const marginPercent = (((totalIncome - totalExpense) / (totalIncome || 1)) * 100).toFixed(1);

  // Sales totals across filtered set
  const totalItemsSold = useMemo(() => {
    return filtered
      .filter((f) => f.type === 'Income')
      .reduce((s, r: any) => s + (r.quantity || 0), 0);
  }, [filtered]);

  const totalOnline = useMemo(() => {
    return filtered
      .filter((f) => f.type === 'Income')
      .reduce((s, r: any) => s + (r.onlinePayment || 0), 0);
  }, [filtered]);

  const totalCash = useMemo(() => {
    return filtered
      .filter((f) => f.type === 'Income')
      .reduce((s, r: any) => s + (r.cashPayment || 0), 0);
  }, [filtered]);

  // Split into Eggs Sold vs Other Items Sold (Manure, Bags, Culls, Scrap, etc.)
  const eggSalesData = useMemo(() => {
    const saleRecords = filtered.filter((f) => f.type === 'Income');
    const eggRecords = saleRecords.filter((f) => {
      const head = (f.head || f.category || '').toUpperCase();
      return head.includes('EGG');
    });
    const otherRecords = saleRecords.filter((f) => {
      const head = (f.head || f.category || '').toUpperCase();
      return !head.includes('EGG');
    });

    const totalEggsSold = eggRecords.reduce((acc, curr: any) => {
      if (typeof curr.quantity === 'number' && curr.quantity > 0) return acc + curr.quantity;
      return acc + Math.round((curr.amount || 0) / 18.3);
    }, 0);

    const eggRevenue = eggRecords.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const otherItemsSold = otherRecords.reduce((acc, curr: any) => {
      if (typeof curr.quantity === 'number' && curr.quantity > 0) return acc + curr.quantity;
      return acc + 1;
    }, 0);

    const otherRevenue = otherRecords.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const avgCartonPrice = totalEggsSold > 0 ? Math.round(eggRevenue / (totalEggsSold / 360)) : 0;

    return {
      totalEggsSold,
      eggRevenue,
      eggCartons: Math.round(totalEggsSold / 360),
      avgCartonPrice,
      otherItemsSold,
      otherRevenue,
      otherCount: otherRecords.length,
    };
  }, [filtered]);

  // Dynamic Per Bird Feed Consumption metrics based on selected unit
  const perBirdFeedConsumption = useMemo(() => {
    if (selectedUnit === 'Unit 1') {
      return { intake: '117 g / day', fcr: '1.48 FCR', subtext: '58 bags/day • 27.8 kg/bird (24,786 birds)' };
    }
    if (selectedUnit === 'Unit 2') {
      return { intake: '118 g / day', fcr: '1.49 FCR', subtext: '75 bags/day • 28.5 kg/bird (31,739 birds)' };
    }
    if (selectedUnit === 'Unit 3') {
      return { intake: '123 g / day', fcr: '1.47 FCR', subtext: '62 bags/day • 29.1 kg/bird (25,189 birds)' };
    }
    return { intake: '118 g / day', fcr: '1.48 FCR', subtext: '195 bags/day • 28.3 kg/bird (85,500 birds)' };
  }, [selectedUnit]);

  // Projected Revenue for next 4 weeks on the basis of last 12 weeks
  const projectionRevenue = useMemo(() => {
    const allSales = financials.filter((f) => f.type === 'Income');
    if (allSales.length === 0) return { projectedAmount: 0, weeklyAvg: 0, last12WeeksTotal: 0 };

    // Respect flock/unit selection if filtered
    const relevantSales = allSales.filter((fin) => {
      if (selectedUnit === 'all') return true;
      const finUnit = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : undefined);
      return (
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'))
      );
    });

    if (relevantSales.length === 0) return { projectedAmount: 0, weeklyAvg: 0, last12WeeksTotal: 0 };

    // Sort descending by date
    const sortedSales = [...relevantSales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const refDateStr = toDate || sortedSales[0]?.date || '2026-10-24';
    const refDate = new Date(refDateStr);

    // 12 weeks prior = 12 * 7 = 84 days
    const twelveWeeksAgo = new Date(refDate);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split('T')[0];

    const last12WeeksSales = relevantSales.filter(
      (s) => s.date && s.date <= refDateStr && s.date >= twelveWeeksAgoStr
    );

    const last12WeeksTotal = last12WeeksSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Calculate weekly average over 12 weeks
    let weeklyAvg = 0;
    if (last12WeeksTotal > 0) {
      weeklyAvg = last12WeeksTotal / 12;
    } else {
      // Fallback: total relevant revenue spread over available weeks
      const totalRev = relevantSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      weeklyAvg = totalRev / 16;
    }

    const projectedAmount = weeklyAvg * 4;

    return {
      projectedAmount,
      weeklyAvg,
      last12WeeksTotal,
    };
  }, [financials, selectedUnit, toDate]);

  // Filtered sales records for the interactive revenue graph
  const chartSales = useMemo(() => {
    return financials.filter((fin) => {
      if (fin.type !== 'Income') return false;
      const finUnit = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : undefined);
      const matchesUnit =
        selectedUnit === 'all' ||
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'));
      return matchesUnit;
    });
  }, [financials, selectedUnit]);

  // Monthly Revenue Chart Data (April – October 2026)
  const monthlyRevenueData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        key: string;
        monthName: string;
        short: string;
        totalRevenue: number;
        eggRevenue: number;
        otherRevenue: number;
        onlinePayment: number;
        cashPayment: number;
        salesCount: number;
        eggsCount: number;
      }
    >();

    const seededMonths = [
      { key: '2026-04', name: 'Apr 2026', short: 'Apr' },
      { key: '2026-05', name: 'May 2026', short: 'May' },
      { key: '2026-06', name: 'Jun 2026', short: 'Jun' },
      { key: '2026-07', name: 'Jul 2026', short: 'Jul' },
      { key: '2026-08', name: 'Aug 2026', short: 'Aug' },
      { key: '2026-09', name: 'Sep 2026', short: 'Sep' },
      { key: '2026-10', name: 'Oct 2026', short: 'Oct' },
    ];

    for (const m of seededMonths) {
      monthMap.set(m.key, {
        key: m.key,
        monthName: m.name,
        short: m.short,
        totalRevenue: 0,
        eggRevenue: 0,
        otherRevenue: 0,
        onlinePayment: 0,
        cashPayment: 0,
        salesCount: 0,
        eggsCount: 0,
      });
    }

    for (const sale of chartSales) {
      if (!sale.date) continue;
      const mKey = sale.date.slice(0, 7);
      if (!monthMap.has(mKey)) {
        const dObj = new Date(sale.date);
        const mName = isNaN(dObj.getTime())
          ? mKey
          : dObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const shortName = isNaN(dObj.getTime())
          ? mKey.slice(5)
          : dObj.toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(mKey, {
          key: mKey,
          monthName: mName,
          short: shortName,
          totalRevenue: 0,
          eggRevenue: 0,
          otherRevenue: 0,
          onlinePayment: 0,
          cashPayment: 0,
          salesCount: 0,
          eggsCount: 0,
        });
      }

      const item = monthMap.get(mKey)!;
      const amt = Number(sale.amount) || 0;
      const isEgg = (sale.head || sale.category || '').toUpperCase().includes('EGG');
      const online = Number((sale as any).onlinePayment) || 0;
      const cash = Number((sale as any).cashPayment) || (amt - online > 0 ? amt - online : 0);
      const qty = Number((sale as any).quantity) || 0;

      item.totalRevenue += amt;
      if (isEgg) {
        item.eggRevenue += amt;
        item.eggsCount += qty;
      } else {
        item.otherRevenue += amt;
      }
      item.onlinePayment += online;
      item.cashPayment += cash;
      item.salesCount += 1;
    }

    return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [chartSales]);

  // Weekly Revenue Chart Data (Last 12 consecutive 7-day buckets)
  const weeklyRevenueData = useMemo(() => {
    const sorted = [...chartSales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const refDateStr = toDate || sorted[0]?.date || '2026-10-24';
    const refDate = new Date(refDateStr);

    const weeks: {
      weekIndex: number;
      weekLabel: string;
      short: string;
      dateRange: string;
      startDate: string;
      endDate: string;
      totalRevenue: number;
      eggRevenue: number;
      otherRevenue: number;
      onlinePayment: number;
      cashPayment: number;
      salesCount: number;
      eggsCount: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const endD = new Date(refDate);
      endD.setDate(endD.getDate() - i * 7);
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);

      const startStr = startD.toISOString().split('T')[0];
      const endStr = endD.toISOString().split('T')[0];

      const startFmt = startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFmt = endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      weeks.push({
        weekIndex: 12 - i,
        weekLabel: `Wk ${12 - i} (${startFmt} - ${endFmt})`,
        short: `W${12 - i}`,
        dateRange: `${startFmt} – ${endFmt}`,
        startDate: startStr,
        endDate: endStr,
        totalRevenue: 0,
        eggRevenue: 0,
        otherRevenue: 0,
        onlinePayment: 0,
        cashPayment: 0,
        salesCount: 0,
        eggsCount: 0,
      });
    }

    for (const sale of chartSales) {
      if (!sale.date) continue;
      for (const w of weeks) {
        if (sale.date >= w.startDate && sale.date <= w.endDate) {
          const amt = Number(sale.amount) || 0;
          const isEgg = (sale.head || sale.category || '').toUpperCase().includes('EGG');
          const online = Number((sale as any).onlinePayment) || 0;
          const cash = Number((sale as any).cashPayment) || (amt - online > 0 ? amt - online : 0);
          const qty = Number((sale as any).quantity) || 0;

          w.totalRevenue += amt;
          if (isEgg) {
            w.eggRevenue += amt;
            w.eggsCount += qty;
          } else {
            w.otherRevenue += amt;
          }
          w.onlinePayment += online;
          w.cashPayment += cash;
          w.salesCount += 1;
          break;
        }
      }
    }

    return weeks;
  }, [chartSales, toDate]);

  // Derived metrics for the interactive revenue graph
  const currentChartData = revenueGraphMode === 'monthly' ? monthlyRevenueData : weeklyRevenueData;
  const peakRevenue = Math.max(...currentChartData.map((d) => d.totalRevenue), 1);
  const totalChartRevenue = currentChartData.reduce((acc, d) => acc + d.totalRevenue, 0);
  const avgChartRevenue = Math.round(totalChartRevenue / (currentChartData.length || 1));

  // Filtered expense records for the interactive expense graph
  const chartExpenses = useMemo(() => {
    return financials.filter((fin) => {
      if (fin.type !== 'Expense') return false;
      const finUnit =
        fin.flockName ||
        (fin.flockId === 8 || fin.flockId === '8'
          ? 'Unit 1'
          : fin.flockId === 9 || fin.flockId === '9'
          ? 'Unit 2'
          : fin.flockId === 10 || fin.flockId === '10'
          ? 'Unit 3'
          : undefined);
      const matchesUnit =
        selectedUnit === 'all' ||
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'));
      return matchesUnit;
    });
  }, [financials, selectedUnit]);

  // Monthly Expense Chart Data (April – October 2026)
  const monthlyExpenseData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        key: string;
        monthName: string;
        short: string;
        totalExpense: number;
        feedExpense: number;
        utilitiesExpense: number;
        medicineExpense: number;
        salaryExpense: number;
        otherExpense: number;
        voucherCount: number;
        unit1Expense: number;
        unit2Expense: number;
        unit3Expense: number;
      }
    >();

    const seededMonths = [
      { key: '2026-04', name: 'Apr 2026', short: 'Apr' },
      { key: '2026-05', name: 'May 2026', short: 'May' },
      { key: '2026-06', name: 'Jun 2026', short: 'Jun' },
      { key: '2026-07', name: 'Jul 2026', short: 'Jul' },
      { key: '2026-08', name: 'Aug 2026', short: 'Aug' },
      { key: '2026-09', name: 'Sep 2026', short: 'Sep' },
      { key: '2026-10', name: 'Oct 2026', short: 'Oct' },
    ];

    for (const m of seededMonths) {
      monthMap.set(m.key, {
        key: m.key,
        monthName: m.name,
        short: m.short,
        totalExpense: 0,
        feedExpense: 0,
        utilitiesExpense: 0,
        medicineExpense: 0,
        salaryExpense: 0,
        otherExpense: 0,
        voucherCount: 0,
        unit1Expense: 0,
        unit2Expense: 0,
        unit3Expense: 0,
      });
    }

    for (const exp of chartExpenses) {
      if (!exp.date) continue;
      const mKey = exp.date.slice(0, 7);
      if (!monthMap.has(mKey)) {
        const dObj = new Date(exp.date);
        const mName = isNaN(dObj.getTime())
          ? mKey
          : dObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const shortName = isNaN(dObj.getTime())
          ? mKey.slice(5)
          : dObj.toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(mKey, {
          key: mKey,
          monthName: mName,
          short: shortName,
          totalExpense: 0,
          feedExpense: 0,
          utilitiesExpense: 0,
          medicineExpense: 0,
          salaryExpense: 0,
          otherExpense: 0,
          voucherCount: 0,
          unit1Expense: 0,
          unit2Expense: 0,
          unit3Expense: 0,
        });
      }

      const item = monthMap.get(mKey)!;
      const amt = Number(exp.amount) || 0;
      const head = (exp.head || exp.category || '').toUpperCase();

      item.totalExpense += amt;
      item.voucherCount += 1;

      if (head.includes('FEED')) {
        item.feedExpense += amt;
      } else if (
        head.includes('ELECTRIC') ||
        head.includes('DIESEL') ||
        head.includes('POWER') ||
        head.includes('WAPDA')
      ) {
        item.utilitiesExpense += amt;
      } else if (
        head.includes('MEDIC') ||
        head.includes('VACCIN') ||
        head.includes('DOCTOR') ||
        head.includes('HEALTH')
      ) {
        item.medicineExpense += amt;
      } else if (
        head.includes('SALARY') ||
        head.includes('LABOUR') ||
        head.includes('SECURITY') ||
        head.includes('WAGE')
      ) {
        item.salaryExpense += amt;
      } else {
        item.otherExpense += amt;
      }

      const finUnit =
        exp.flockName ||
        (exp.flockId === 8 || exp.flockId === '8'
          ? 'Unit 1'
          : exp.flockId === 9 || exp.flockId === '9'
          ? 'Unit 2'
          : 'Unit 3');
      if (finUnit === 'Unit 1') item.unit1Expense += amt;
      else if (finUnit === 'Unit 2') item.unit2Expense += amt;
      else item.unit3Expense += amt;
    }

    return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [chartExpenses]);

  // Weekly Expense Chart Data (Last 12 consecutive 7-day buckets)
  const weeklyExpenseData = useMemo(() => {
    const sorted = [...chartExpenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const refDateStr = toDate || sorted[0]?.date || '2026-10-24';
    const refDate = new Date(refDateStr);

    const weeks: {
      weekIndex: number;
      weekLabel: string;
      short: string;
      dateRange: string;
      startDate: string;
      endDate: string;
      totalExpense: number;
      feedExpense: number;
      utilitiesExpense: number;
      medicineExpense: number;
      salaryExpense: number;
      otherExpense: number;
      voucherCount: number;
      unit1Expense: number;
      unit2Expense: number;
      unit3Expense: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const endD = new Date(refDate);
      endD.setDate(endD.getDate() - i * 7);
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);

      const startStr = startD.toISOString().split('T')[0];
      const endStr = endD.toISOString().split('T')[0];

      const startFmt = startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFmt = endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      weeks.push({
        weekIndex: 12 - i,
        weekLabel: `Wk ${12 - i} (${startFmt} - ${endFmt})`,
        short: `W${12 - i}`,
        dateRange: `${startFmt} – ${endFmt}`,
        startDate: startStr,
        endDate: endStr,
        totalExpense: 0,
        feedExpense: 0,
        utilitiesExpense: 0,
        medicineExpense: 0,
        salaryExpense: 0,
        otherExpense: 0,
        voucherCount: 0,
        unit1Expense: 0,
        unit2Expense: 0,
        unit3Expense: 0,
      });
    }

    for (const exp of chartExpenses) {
      if (!exp.date) continue;
      for (const w of weeks) {
        if (exp.date >= w.startDate && exp.date <= w.endDate) {
          const amt = Number(exp.amount) || 0;
          const head = (exp.head || exp.category || '').toUpperCase();

          w.totalExpense += amt;
          w.voucherCount += 1;

          if (head.includes('FEED')) {
            w.feedExpense += amt;
          } else if (
            head.includes('ELECTRIC') ||
            head.includes('DIESEL') ||
            head.includes('POWER') ||
            head.includes('WAPDA')
          ) {
            w.utilitiesExpense += amt;
          } else if (
            head.includes('MEDIC') ||
            head.includes('VACCIN') ||
            head.includes('DOCTOR') ||
            head.includes('HEALTH')
          ) {
            w.medicineExpense += amt;
          } else if (
            head.includes('SALARY') ||
            head.includes('LABOUR') ||
            head.includes('SECURITY') ||
            head.includes('WAGE')
          ) {
            w.salaryExpense += amt;
          } else {
            w.otherExpense += amt;
          }

          const finUnit =
            exp.flockName ||
            (exp.flockId === 8 || exp.flockId === '8'
              ? 'Unit 1'
              : exp.flockId === 9 || exp.flockId === '9'
              ? 'Unit 2'
              : 'Unit 3');
          if (finUnit === 'Unit 1') w.unit1Expense += amt;
          else if (finUnit === 'Unit 2') w.unit2Expense += amt;
          else w.unit3Expense += amt;
          break;
        }
      }
    }

    return weeks;
  }, [chartExpenses, toDate]);

  // Derived metrics for the interactive expense graph
  const currentExpenseChartData =
    expenseGraphMode === 'monthly' ? monthlyExpenseData : weeklyExpenseData;
  const peakExpense = Math.max(...currentExpenseChartData.map((d) => d.totalExpense), 1);
  const totalChartExpense = currentExpenseChartData.reduce((acc, d) => acc + d.totalExpense, 0);
  const avgChartExpense = Math.round(totalChartExpense / (currentExpenseChartData.length || 1));

  // Dynamic Sales Categories breakdown (EGG, Manure, Feed BAGS, OTHER)
  const currentSalesBreakdown = useMemo(() => {
    const saleRecords = financials.filter((fin) => {
      if (fin.type !== 'Income') return false;
      const finUnit = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : undefined);
      const matchesUnit =
        selectedUnit === 'all' ||
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'));
      const matchesFrom = !fromDate || fin.date >= fromDate;
      const matchesTo = !toDate || fin.date <= toDate;
      return matchesUnit && matchesFrom && matchesTo;
    });

    const totalRev = saleRecords.reduce((s, r) => s + r.amount, 0) || 1;
    const cats = ['EGG', 'Manure', 'Feed BAGS', 'OTHER'];

    return cats.map((head) => {
      const records = saleRecords.filter((r) => {
        const h = r.head || r.category;
        if (head === 'Feed BAGS') return h === 'Feed BAGS' || h === 'Feed_BAGS' || h === 'Feed Bags Sales';
        if (head === 'EGG') return h === 'EGG' || h === 'Egg Sales';
        if (head === 'Manure') return h === 'Manure' || h === 'Manure Sales';
        return h === 'OTHER' || h === 'Other Sales';
      });
      const amount = records.reduce((s, r) => s + r.amount, 0);
      const count = records.length;
      const items = records.reduce((s, r: any) => s + (r.quantity || 0), 0);
      const percent = Number(((amount / totalRev) * 100).toFixed(2));
      return { head, amount, count, items, percent };
    }).sort((a, b) => b.amount - a.amount);
  }, [financials, selectedUnit, fromDate, toDate]);

  // Dynamic 21 Heads breakdown computed for current unit / date filters
  const currentExpenseBreakdown = useMemo(() => {
    const expenseRecords = financials.filter((fin) => {
      if (fin.type !== 'Expense') return false;
      const finUnit = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : undefined);
      const matchesUnit =
        selectedUnit === 'all' ||
        finUnit === selectedUnit ||
        (selectedUnit === 'Unit 1' && (fin.flockId === 8 || fin.flockId === '8')) ||
        (selectedUnit === 'Unit 2' && (fin.flockId === 9 || fin.flockId === '9')) ||
        (selectedUnit === 'Unit 3' && (fin.flockId === 10 || fin.flockId === '10'));
      const matchesFrom = !fromDate || fin.date >= fromDate;
      const matchesTo = !toDate || fin.date <= toDate;
      return matchesUnit && matchesFrom && matchesTo;
    });

    const totalExp = expenseRecords.reduce((s, r) => s + r.amount, 0) || 1;

    return EXPENSE_HEADS_21.map((head) => {
      const records = expenseRecords.filter((r) => (r.head || r.category) === head);
      const amount = records.reduce((s, r) => s + r.amount, 0);
      const count = records.length;
      const percent = Number(((amount / totalExp) * 100).toFixed(2));
      return { head, amount, count, percent };
    }).sort((a, b) => b.amount - a.amount);
  }, [financials, selectedUnit, fromDate, toDate]);

  // Unit-wise live stats from currently loaded financials
  const unitStats = useMemo(() => {
    const expOnly = financials.filter((f) => f.type === 'Expense');
    const u1 = expOnly.filter((f) => f.flockName === 'Unit 1' || f.flockId === 8 || f.flockId === '8');
    const u2 = expOnly.filter((f) => f.flockName === 'Unit 2' || f.flockId === 9 || f.flockId === '9');
    const u3 = expOnly.filter((f) => f.flockName === 'Unit 3' || f.flockId === 10 || f.flockId === '10');

    return {
      all: {
        count: expOnly.length,
        amount: expOnly.reduce((s, r) => s + r.amount, 0),
      },
      unit1: {
        count: u1.length,
        amount: u1.reduce((s, r) => s + r.amount, 0),
      },
      unit2: {
        count: u2.length,
        amount: u2.reduce((s, r) => s + r.amount, 0),
      },
      unit3: {
        count: u3.length,
        amount: u3.reduce((s, r) => s + r.amount, 0),
      },
    };
  }, [financials]);

  const salesStats = useMemo(() => {
    const salesOnly = financials.filter((f) => f.type === 'Income');
    const su1 = salesOnly.filter((f) => f.flockName === 'Unit 1' || f.flockId === 8 || f.flockId === '8');
    const su2 = salesOnly.filter((f) => f.flockName === 'Unit 2' || f.flockId === 9 || f.flockId === '9');
    const su3 = salesOnly.filter((f) => f.flockName === 'Unit 3' || f.flockId === 10 || f.flockId === '10');

    const calcStats = (arr: FinancialRecord[]) => {
      const count = arr.length;
      const revenue = arr.reduce((s, r) => s + r.amount, 0);
      const items = arr.reduce((s, r: any) => s + (r.quantity || 0), 0);
      const cartons = items > 0 ? items / 360 : 0;
      const avgCartonPrice = cartons > 0 ? Math.round(revenue / cartons) : 0;
      return { count, revenue, items, cartons, avgCartonPrice };
    };

    return {
      all: calcStats(salesOnly),
      unit1: calcStats(su1),
      unit2: calcStats(su2),
      unit3: calcStats(su3),
    };
  }, [financials]);

  // Pagination calculation
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRecords = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, safePage, pageSize]);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fid = newRecord.flockName === 'Unit 1' ? 8 : newRecord.flockName === 'Unit 2' ? 9 : 10;
    const trackingId = Date.now().toString().slice(-4);

    let onlinePayment = 0;
    let cashPayment = 0;
    if (newRecord.type === 'Income') {
      if (newRecord.paymentMode === 'Online') {
        onlinePayment = Number(newRecord.amount);
        cashPayment = 0;
      } else if (newRecord.paymentMode === 'Cash') {
        onlinePayment = 0;
        cashPayment = Number(newRecord.amount);
      } else {
        onlinePayment = Number(newRecord.onlineAmount) || 0;
        cashPayment = Number(newRecord.cashAmount) || Math.max(0, Number(newRecord.amount) - onlinePayment);
      }
    }

    const record: FinancialRecord & { onlinePayment?: number; cashPayment?: number; quantity?: number; unitPrice?: number } = {
      id: `${newRecord.type === 'Income' ? 'inc' : 'exp'}-${trackingId}`,
      trackingId: Number(trackingId),
      type: newRecord.type,
      category: newRecord.head,
      head: newRecord.head,
      amount: Number(newRecord.amount),
      date: new Date().toISOString().split('T')[0],
      referenceNo: newRecord.referenceNo,
      challanNo: newRecord.challanNo,
      flockId: fid,
      flockName: newRecord.flockName,
      description: newRecord.description || `${newRecord.head}: Manual entry`,
      notes: newRecord.description,
      status: 'Paid',
      paymentMethod: newRecord.type === 'Income'
        ? (newRecord.paymentMode === 'Online' ? 'Online / Bank' : newRecord.paymentMode === 'Cash' ? 'Cash Counter' : 'Split (Online/Cash)')
        : 'Bank Transfer',
      onlinePayment: onlinePayment,
      cashPayment: cashPayment,
      quantity: Math.round(Number(newRecord.amount) / 17.5),
      unitPrice: 17.5,
      attachment: attachmentData || null,
      attachmentName: attachmentName || null,
    };
    onAddTransaction(record as FinancialRecord);
    setShowModal(false);
    handleRemoveAttachment();
  };

  const getFlockBadgeClass = (flockName?: string, flockId?: string | number) => {
    const fname = flockName || (flockId === 8 || flockId === '8' ? 'Unit 1' : flockId === 9 || flockId === '9' ? 'Unit 2' : 'Unit 3');
    if (fname === 'Unit 1') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (fname === 'Unit 2') {
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200/80';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          selectedType === 'Expense'
            ? 'Operational Expenses & Farm Costs (21 Heads)'
            : selectedType === 'Income'
            ? 'Commercial Egg & Farm Sales'
            : 'Farm Financials, 21 Expense Heads & Ledger'
        }
        subtitle={
          selectedType === 'Expense'
            ? 'Audited unit-wise expenses across 21 expense heads for Unit 1, Unit 2, and Unit 3.'
            : selectedType === 'Income'
            ? 'Track wholesale egg crate sales, cull bird revenues, manure dispatches, and customer receipts.'
            : 'Track commercial egg sales, cull bird revenue, feed costs, electricity, and unit-wise operating expenses.'
        }
        icon={selectedType === 'Expense' ? ArrowDownRight : DollarSign}
        iconColor={selectedType === 'Expense' ? 'rose' : 'emerald'}
        badge={
          selectedType === 'Expense'
            ? '21 Expense Heads • 1,241 Vouchers'
            : selectedType === 'Income'
            ? 'Sales Ledger Active'
            : 'Complete Audited Ledger'
        }
        actions={
          <div className="flex items-center gap-2">
            <UIButton
              variant={selectedType === 'Expense' ? 'danger' : 'primary'}
              icon={Plus}
              onClick={() => setShowModal(true)}
            >
              {selectedType === 'Expense' ? 'Record Expense' : 'Record Transaction'}
            </UIButton>
          </div>
        }
      />

      {/* Unit Selector Cards / Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedType === 'Income'
                ? 'Unit-Wise Sales Breakdown'
                : selectedType === 'Expense'
                ? 'Unit-Wise Expense Breakdown & Filter (21 Heads)'
                : 'Unit-Wise Financial Performance & Filter'}
            </h3>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {selectedType === 'Income'
              ? 'Select a unit to filter commercial sales and revenue'
              : 'Select a unit to filter KPIs, 21 Heads breakdown, and vouchers'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => setSelectedUnit('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedUnit === 'all'
                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>All Units</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 font-semibold text-slate-700">
                {selectedType === 'Income'
                  ? `${salesStats.all.count.toLocaleString()} sales`
                  : `${unitStats.all.count.toLocaleString()} vouchers`}
              </span>
            </div>
            <div className="mt-1 text-base font-black text-slate-900 font-mono">
              Rs. {(selectedType === 'Income' ? salesStats.all.revenue : unitStats.all.amount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {selectedType === 'Income'
                ? `${Math.round(salesStats.all.items / 360).toLocaleString()} cartons sold • Avg: Rs. ${salesStats.all.avgCartonPrice.toLocaleString()} / carton`
                : 'Farm GVF2025 Combined'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedUnit('Unit 1')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedUnit === 'Unit 1'
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
                {selectedType === 'Income'
                  ? `${salesStats.unit1.count} sales`
                  : `${unitStats.unit1.count} vouchers`}
              </span>
            </div>
            <div className="mt-1 text-base font-black text-emerald-700 font-mono">
              Rs. {(selectedType === 'Income' ? salesStats.unit1.revenue : unitStats.unit1.amount).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {selectedType === 'Income'
                ? `${Math.round(salesStats.unit1.items / 360).toLocaleString()} cartons sold • Avg: Rs. ${salesStats.unit1.avgCartonPrice.toLocaleString()} / carton`
                : 'Flock ID 8 (25,000 birds)'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedUnit('Unit 2')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedUnit === 'Unit 2'
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
                {selectedType === 'Income'
                  ? `${salesStats.unit2.count} sales`
                  : `${unitStats.unit2.count} vouchers`}
              </span>
            </div>
            <div className="mt-1 text-base font-black text-blue-700 font-mono">
              Rs. {(selectedType === 'Income' ? salesStats.unit2.revenue : unitStats.unit2.amount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {selectedType === 'Income'
                ? `${Math.round(salesStats.unit2.items / 360).toLocaleString()} cartons sold • Avg: Rs. ${salesStats.unit2.avgCartonPrice.toLocaleString()} / carton`
                : 'Flock ID 9 (35,000 birds)'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedUnit('Unit 3')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedUnit === 'Unit 3'
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
                {selectedType === 'Income'
                  ? `${salesStats.unit3.count} sales`
                  : `${unitStats.unit3.count} vouchers`}
              </span>
            </div>
            <div className="mt-1 text-base font-black text-amber-700 font-mono">
              Rs. {(selectedType === 'Income' ? salesStats.unit3.revenue : unitStats.unit3.amount).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {selectedType === 'Income'
                ? `${Math.round(salesStats.unit3.items / 360).toLocaleString()} cartons sold • Avg: Rs. ${salesStats.unit3.avgCartonPrice.toLocaleString()} / carton`
                : 'Flock ID 10 (25,500 birds)'}
            </div>
          </button>
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <DateRangePickerBar
        showFlockSelector={false}
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

      {/* KPI Stats Grid */}
      <div
        className={`grid gap-3.5 sm:gap-4 ${
          selectedType === 'Income'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
            : selectedType === 'Expense'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {selectedType === 'Income' ? (
          <>
            <StatCard
              title="Total Sales Revenue"
              value={`Rs. ${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: `${filtered.length} Sales`, color: 'emerald' }}
              trend={{ value: selectedUnit !== 'all' ? selectedUnit : 'All 3 Units', isUp: true }}
              subtext="Total Egg Sales Revenue"
            />

            <StatCard
              title="Total Egg Sold"
              value={`Rs. ${eggSalesData.eggRevenue.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={Layers}
              color="blue"
              valueColor="text-blue-700"
              badge={{
                text: `${eggSalesData.eggCartons.toLocaleString()} Cartons`,
                color: 'blue',
              }}
              subtext={`Average Carton Price: Rs. ${eggSalesData.avgCartonPrice.toLocaleString()} / carton`}
            />

            <StatCard
              title="Othere Items Sold"
              value={`Rs. ${eggSalesData.otherRevenue.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={Tag}
              color="amber"
              valueColor="text-amber-700"
              badge={{
                text: `${eggSalesData.otherItemsSold.toLocaleString()} Items`,
                color: 'amber',
              }}
              subtext={`${eggSalesData.otherCount} orders (manure, sacks & culls)`}
            />

            <StatCard
              title="Online Banking Payments"
              value={`Rs. ${totalOnline.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={CreditCard}
              color="teal"
              valueColor="text-teal-700"
              badge={{
                text: `${((totalOnline / (totalIncome || 1)) * 100).toFixed(1)}% Online`,
                color: 'teal',
              }}
              subtext="Direct bank transfers received"
            />

            <StatCard
              title="Direct Cash Collections"
              value={`Rs. ${totalCash.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={ArrowUpRight}
              color="emerald"
              valueColor="text-emerald-800"
              badge={{
                text: `${((totalCash / (totalIncome || 1)) * 100).toFixed(1)}% Cash`,
                color: 'emerald',
              }}
              subtext="Direct cash counter collections"
            />

            <StatCard
              title="Projection Revenu"
              value={`Rs. ${projectionRevenue.projectedAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              unit="4 Weeks"
              icon={TrendingUp}
              color="purple"
              valueColor="text-purple-700"
              badge={{
                text: `Rs. ${projectionRevenue.weeklyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}/wk`,
                color: 'purple',
              }}
              trend={{
                value: 'Next 4 Wks',
                isUp: true,
              }}
              subtext="Calculated next 4 wks based on last 12 wks"
            />
          </>
        ) : selectedType === 'Expense' ? (
          <>
            <StatCard
              title="Total Expenses (Period)"
              value={`Rs. ${totalExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={ArrowDownRight}
              color="rose"
              valueColor="text-rose-600"
              badge={{ text: `${filtered.length} Vouchers`, color: 'rose' }}
              trend={{ value: selectedUnit !== 'all' ? selectedUnit : 'All Units', isUp: false }}
              subtext="Audited 21 heads procurement"
            />
            <StatCard
              title="Top Expense Category"
              value="FEED"
              icon={Tag}
              color="teal"
              badge={{ text: '76.45% of Cost', color: 'teal' }}
              subtext="Rs. 276,471,321 (144 vouchers)"
            />
            <StatCard
              title="Per Bird Feed consumption"
              value={perBirdFeedConsumption.intake}
              icon={Wheat}
              color="amber"
              valueColor="text-amber-800"
              badge={{ text: perBirdFeedConsumption.fcr, color: 'amber' }}
              subtext={perBirdFeedConsumption.subtext}
            />
            <StatCard
              title="Average Voucher Amount"
              value={`Rs. ${filtered.length > 0 ? Math.round(totalExpense / filtered.length).toLocaleString() : '0'}`}
              icon={CreditCard}
              color="blue"
              badge={{ text: 'Mean Size', color: 'blue' }}
              subtext="Per recorded voucher in filter"
            />
            <StatCard
              title="Active Birds Managed"
              value="85,500 Birds"
              icon={Building2}
              color="amber"
              badge={{ text: '3 Units', color: 'amber' }}
              subtext="Unit 1, Unit 2, Unit 3"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Sales Revenue"
              value={`Rs. ${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: '808 Sales', color: 'emerald' }}
              trend={{ value: '17.00M Items', isUp: true }}
              subtext="Total revenue generated"
            />
            <StatCard
              title="Operational Expenses"
              value={`Rs. ${totalExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={ArrowDownRight}
              color="rose"
              valueColor="text-rose-600"
              badge={{ text: '21 Heads', color: 'rose' }}
              trend={{ value: 'Feed & Utilities', isUp: false }}
              subtext="Unit 1, 2, & 3 total spend"
            />
            <StatCard
              title="Net Operating Margin"
              value={`Rs. ${netMargin.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={TrendingUp}
              color="blue"
              valueColor="text-slate-900"
              badge={{ text: `${marginPercent}% Margin`, color: 'blue' }}
              subtext="Revenue vs 21 expense heads"
            />
            <StatCard
              title="Average Transaction"
              value={`Rs. ${filtered.length > 0 ? Math.round((totalIncome + totalExpense) / filtered.length).toLocaleString() : '0'}`}
              icon={CreditCard}
              color="teal"
              badge={{ text: `${filtered.length} Total`, color: 'teal' }}
              subtext="Ledger vouchers & sales"
            />
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE REVENUE GRAPHS (MONTHLY & WEEKLY SELECTION) */}
      {/* ========================================================================= */}
      {selectedType === 'Income' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Interactive Revenue &amp; Turnover Analytics
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {revenueGraphMode === 'monthly'
                  ? `Monthly commercial revenue timeline (April – October 2026) across ${selectedUnit !== 'all' ? selectedUnit : 'All Units'}`
                  : `Weekly revenue trends across the last 12 weeks across ${selectedUnit !== 'all' ? selectedUnit : 'All Units'}`}
              </p>
            </div>

            {/* Toggle Monthly vs Weekly */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setRevenueGraphMode('monthly');
                    setHoveredRevenueIndex(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    revenueGraphMode === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Monthly View</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRevenueGraphMode('weekly');
                    setHoveredRevenueIndex(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    revenueGraphMode === 'weekly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Weekly View (Last 12 Wks)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Analytical Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <span className="text-emerald-800 font-medium">
                {revenueGraphMode === 'monthly' ? 'Peak Month Turnover' : 'Peak Week Turnover'}
              </span>
              <span className="font-mono font-black text-emerald-900 text-sm">
                Rs. {peakRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {revenueGraphMode === 'monthly' ? 'Monthly Average' : 'Weekly Average'}
              </span>
              <span className="font-mono font-black text-blue-900 text-sm">
                Rs. {avgChartRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
              <span className="text-teal-800 font-medium">Period Total Revenue</span>
              <span className="font-mono font-black text-teal-900 text-sm">
                Rs. {totalChartRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
              <span className="text-purple-800 font-medium">4-Week Projection</span>
              <span className="font-mono font-black text-purple-900 text-sm">
                Rs. {projectionRevenue.projectedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Interactive SVG Bar Chart Canvas */}
          <div className="relative pt-2">
            <div className="relative overflow-x-auto">
              <svg
                viewBox="0 0 940 240"
                className="w-full min-w-[700px] h-[240px] overflow-visible"
              >
                {/* Horizontal Gridlines */}
                <line x1="60" y1="20" x2="920" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="60" y1="70" x2="920" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="60" y1="120" x2="920" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="60" y1="170" x2="920" y2="170" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="60" y1="200" x2="920" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y-axis Labels */}
                <text x="52" y="24" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  Rs.{(peakRevenue / 1000000).toFixed(0)}M
                </text>
                <text x="52" y="74" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  Rs.{((peakRevenue * 0.75) / 1000000).toFixed(0)}M
                </text>
                <text x="52" y="124" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  Rs.{((peakRevenue * 0.5) / 1000000).toFixed(0)}M
                </text>
                <text x="52" y="174" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  Rs.{((peakRevenue * 0.25) / 1000000).toFixed(0)}M
                </text>
                <text x="52" y="203" fontSize="10" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
                  0
                </text>

                {/* Bars */}
                {currentChartData.map((d: any, idx) => {
                  const count = currentChartData.length;
                  const availableWidth = 840;
                  const step = availableWidth / Math.max(1, count);
                  const barWidth = Math.min(48, Math.max(18, step * 0.6));
                  const centerX = 80 + idx * step + step / 2;
                  const startX = centerX - barWidth / 2;

                  const chartHeight = 180;
                  const ceiling = peakRevenue > 0 ? peakRevenue * 1.08 : 1;
                  const barHeight = Math.max(4, (d.totalRevenue / ceiling) * chartHeight);
                  const barY = 200 - barHeight;

                  const eggRatio = d.totalRevenue > 0 ? d.eggRevenue / d.totalRevenue : 1;
                  const eggBarHeight = barHeight * eggRatio;
                  const otherBarHeight = barHeight - eggBarHeight;
                  const isHovered = hoveredRevenueIndex === idx;

                  return (
                    <g
                      key={d.key || d.weekIndex || idx}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredRevenueIndex(idx)}
                      onMouseLeave={() => setHoveredRevenueIndex(null)}
                    >
                      {isHovered && (
                        <rect
                          x={centerX - step / 2 + 2}
                          y="15"
                          width={step - 4}
                          height="190"
                          fill="#059669"
                          opacity="0.08"
                          rx="6"
                        />
                      )}

                      {/* Main Egg Revenue Bar (Emerald) */}
                      <rect
                        x={startX}
                        y={barY + otherBarHeight}
                        width={barWidth}
                        height={eggBarHeight}
                        fill="#059669"
                        rx="3"
                        className="transition-all hover:opacity-95"
                      />

                      {/* Other Items Revenue Stack (Amber) */}
                      {otherBarHeight > 0 && (
                        <rect
                          x={startX}
                          y={barY}
                          width={barWidth}
                          height={otherBarHeight}
                          fill="#d97706"
                          rx="2"
                          className="transition-all hover:opacity-95"
                        />
                      )}

                      {/* X-axis Label */}
                      <text
                        x={centerX}
                        y="218"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                        fill={isHovered ? '#0f172a' : '#64748b'}
                        textAnchor="middle"
                      >
                        {d.short || d.monthName}
                      </text>
                      <text
                        x={centerX}
                        y="231"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                      >
                        {revenueGraphMode === 'monthly' ? '2026' : (d.dateRange?.split('–')[0]?.trim() || '')}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Hover Tooltip */}
              {hoveredRevenueIndex !== null && currentChartData[hoveredRevenueIndex] && (
                (() => {
                  const item = currentChartData[hoveredRevenueIndex] as any;
                  return (
                    <div
                      className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[240px]"
                      style={{
                        left: `${Math.min(74, Math.max(5, ((hoveredRevenueIndex || 0) / Math.max(1, currentChartData.length)) * 86))}%`,
                        top: '15px',
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className="font-bold text-emerald-300">
                          {item.monthName || item.weekLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.salesCount} Sales
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-300">Total Turnover:</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          Rs. {item.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-300">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-emerald-500" />
                          <span>Egg Sales Revenue:</span>
                        </span>
                        <span className="font-mono font-bold text-white">
                          Rs. {item.eggRevenue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </div>

                      {item.otherRevenue > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-amber-500" />
                            <span>Other Items Sold:</span>
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            Rs. {item.otherRevenue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-700 text-[10px] space-y-0.5 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-teal-400">Online Banking:</span>
                          <span className="font-mono font-medium">Rs. {item.onlinePayment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-400">Cash Collections:</span>
                          <span className="font-mono font-medium">Rs. {item.cashPayment.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Chart Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600" />
                  <span className="text-slate-600 font-medium">Egg Sales Revenue</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-amber-600" />
                  <span className="text-slate-600 font-medium">Other Items (Manure, Bags, Culls)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {revenueGraphMode === 'monthly'
                    ? 'Showing monthly ledger breakdown • Hover columns for receipts & payment split'
                    : 'Showing 12 consecutive 7-day buckets • Hover columns for weekly performance'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE EXPENSE GRAPHS (MONTHLY & WEEKLY SELECTION) */}
      {/* ========================================================================= */}
      {selectedType === 'Expense' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Interactive Operational Expenses &amp; Outflow Analytics
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {expenseGraphMode === 'monthly'
                  ? `Monthly audited operational expenditure timeline (April – October 2026) across ${selectedUnit !== 'all' ? selectedUnit : 'All Units'}`
                  : `Weekly expense trends across the last 12 weeks across ${selectedUnit !== 'all' ? selectedUnit : 'All Units'}`}
              </p>
            </div>

            {/* Toggle Monthly vs Weekly */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseGraphMode('monthly');
                    setHoveredExpenseIndex(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    expenseGraphMode === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>Monthly View</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExpenseGraphMode('weekly');
                    setHoveredExpenseIndex(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    expenseGraphMode === 'weekly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>Weekly View</span>
                </button>
              </div>

              {/* Analytical stats badges */}
              <div className="hidden sm:flex items-center gap-2 text-[11px]">
                <div className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                  Peak: Rs. {peakExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  Avg: Rs. {avgChartExpense.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* SVG Chart Canvas */}
          <div className="relative pt-2">
            <div className="h-64 sm:h-72 w-full relative">
              <svg
                viewBox="0 0 1000 240"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = 20 + (1 - pct) * 185;
                  const val = Math.round(peakExpense * pct);
                  return (
                    <g key={idx}>
                      <line
                        x1="60"
                        y1={y}
                        x2="980"
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray={pct === 0 ? '' : '3 3'}
                      />
                      <text
                        x="52"
                        y={y + 3}
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="end"
                        className="font-mono font-medium select-none"
                      >
                        {val >= 1000000
                          ? `Rs. ${(val / 1000000).toFixed(1)}M`
                          : val >= 1000
                          ? `Rs. ${(val / 1000).toFixed(0)}k`
                          : `Rs. ${val}`}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for current dataset */}
                {currentExpenseChartData.map((d: any, idx) => {
                  const count = currentExpenseChartData.length;
                  const usableWidth = 920;
                  const step = usableWidth / count;
                  const barWidth = Math.min(68, Math.max(22, step * 0.62));
                  const centerX = 60 + idx * step + step / 2;
                  const barX = centerX - barWidth / 2;

                  const chartH = 185;
                  const totalRatio = peakExpense > 0 ? d.totalExpense / peakExpense : 0;
                  const barTotalH = Math.max(3, totalRatio * chartH);
                  const barY = 205 - barTotalH;

                  // Segment heights
                  const feedRatio = d.totalExpense > 0 ? d.feedExpense / d.totalExpense : 0.76;
                  const feedH = barTotalH * feedRatio;
                  const utilitiesRatio = d.totalExpense > 0 ? d.utilitiesExpense / d.totalExpense : 0.12;
                  const utilitiesH = barTotalH * utilitiesRatio;
                  const otherH = Math.max(0, barTotalH - feedH - utilitiesH);

                  const feedY = 205 - feedH;
                  const utilitiesY = feedY - utilitiesH;
                  const otherY = utilitiesY - otherH;

                  const isHovered = hoveredExpenseIndex === idx;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer transition-opacity duration-150"
                      onMouseEnter={() => setHoveredExpenseIndex(idx)}
                      onMouseLeave={() => setHoveredExpenseIndex(null)}
                    >
                      {/* Background hover highlight column */}
                      {isHovered && (
                        <rect
                          x={centerX - step / 2 + 2}
                          y="15"
                          width={step - 4}
                          height="195"
                          fill="#f8fafc"
                          rx="6"
                        />
                      )}

                      {/* Main Bar: Feed Procurements (Red/Rose) */}
                      <rect
                        x={barX}
                        y={feedY}
                        width={barWidth}
                        height={Math.max(2, feedH)}
                        fill={isHovered ? '#be123c' : '#e11d48'}
                        rx={utilitiesH === 0 && otherH === 0 ? 5 : 0}
                      />

                      {/* Utilities & Energy (Amber) */}
                      {utilitiesH > 0 && (
                        <rect
                          x={barX}
                          y={utilitiesY}
                          width={barWidth}
                          height={utilitiesH}
                          fill={isHovered ? '#d97706' : '#f59e0b'}
                          rx={otherH === 0 ? 5 : 0}
                        />
                      )}

                      {/* Other heads & Maintenance (Purple/Slate) */}
                      {otherH > 0 && (
                        <rect
                          x={barX}
                          y={otherY}
                          width={barWidth}
                          height={otherH}
                          fill={isHovered ? '#475569' : '#64748b'}
                          rx="5"
                        />
                      )}

                      {/* Value label on top of peak or hovered bar */}
                      {(isHovered || (idx % (expenseGraphMode === 'monthly' ? 1 : 2) === 0 && d.totalExpense > 0)) && (
                        <text
                          x={centerX}
                          y={barY - 6}
                          fontSize="9.5"
                          fontWeight={isHovered ? 'bold' : '600'}
                          fill={isHovered ? '#e11d48' : '#64748b'}
                          textAnchor="middle"
                          className="font-mono"
                        >
                          {d.totalExpense >= 1000000
                            ? `${(d.totalExpense / 1000000).toFixed(1)}M`
                            : d.totalExpense >= 1000
                            ? `${(d.totalExpense / 1000).toFixed(0)}k`
                            : d.totalExpense}
                        </text>
                      )}

                      {/* X-axis labels */}
                      <text
                        x={centerX}
                        y="220"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#0f172a' : '#475569'}
                        textAnchor="middle"
                      >
                        {d.short || d.monthName}
                      </text>
                      <text
                        x={centerX}
                        y="231"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                      >
                        {expenseGraphMode === 'monthly' ? '2026' : (d.dateRange?.split('–')[0]?.trim() || '')}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Hover Tooltip */}
              {hoveredExpenseIndex !== null && currentExpenseChartData[hoveredExpenseIndex] && (
                (() => {
                  const item = currentExpenseChartData[hoveredExpenseIndex] as any;
                  return (
                    <div
                      className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[240px]"
                      style={{
                        left: `${Math.min(74, Math.max(5, ((hoveredExpenseIndex || 0) / Math.max(1, currentExpenseChartData.length)) * 86))}%`,
                        top: '15px',
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className="font-bold text-rose-300">
                          {item.monthName || item.weekLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.voucherCount} Vouchers
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-300">Total Spend:</span>
                        <span className="font-mono font-black text-rose-400 text-sm">
                          Rs. {item.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-300">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-rose-500" />
                          <span>Feed Outflow:</span>
                        </span>
                        <span className="font-mono font-bold text-white">
                          Rs. {item.feedExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </div>

                      {item.utilitiesExpense > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-amber-500" />
                            <span>Electricity &amp; Fuel:</span>
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            Rs. {item.utilitiesExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      )}

                      {item.otherExpense > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-slate-400" />
                            <span>Other 19 Heads:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-300">
                            Rs. {item.otherExpense.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-700 text-[10px] space-y-0.5 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unit 1 Spend:</span>
                          <span className="font-mono font-medium">Rs. {item.unit1Expense.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unit 2 Spend:</span>
                          <span className="font-mono font-medium">Rs. {item.unit2Expense.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unit 3 Spend:</span>
                          <span className="font-mono font-medium">Rs. {item.unit3Expense.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Chart Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-rose-600" />
                  <span className="text-slate-600 font-medium">Feed Outflow (~76%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-slate-600 font-medium">Utilities &amp; Fuel</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-slate-500" />
                  <span className="text-slate-600 font-medium">Other 19 Expense Heads</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {expenseGraphMode === 'monthly'
                    ? 'Showing monthly audited ledger outflow • Hover columns for cost driver breakdown'
                    : 'Showing 12 consecutive 7-day buckets • Hover columns for weekly performance'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Section: Shows Sales Categories for Income, 21 Heads for Expense */}
      {selectedType === 'Income' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Tag className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Breakdown by Sales Category
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Click any category to filter sales records below{' '}
                {selectedUnit !== 'all' ? `for ${selectedUnit}` : 'across all units'}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedHead !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedHead('all')}
                  className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                  Filtered: {selectedHead}
                  <X className="w-3.5 h-3.5 ml-1" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {currentSalesBreakdown.map((b, idx) => {
              const isSelected = selectedHead === b.head;
              return (
                <div
                  key={b.head}
                  onClick={() => setSelectedHead(isSelected ? 'all' : b.head)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                      {b.head}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {b.count} {b.count === 1 ? 'sale' : 'sales'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-black font-mono text-slate-900">
                      Rs. {b.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 font-mono">
                      {b.percent}%
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {b.head === 'EGG'
                      ? `${(b.items / 360).toLocaleString(undefined, { maximumFractionDigits: 1 })} cartons • Avg Carton Price: Rs. ${Math.round(b.amount / ((b.items || 1) / 360)).toLocaleString()}`
                      : `${b.items.toLocaleString()} ${b.head === 'Feed BAGS' ? 'bags' : 'units'} sold`}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(3, b.percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Tag className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Breakdown by Expense Head (21 Heads)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Click any head to filter vouchers below{' '}
                {selectedUnit !== 'all' ? `for ${selectedUnit}` : 'across all units'}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedHead !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedHead('all')}
                  className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer"
                >
                  Filtered: {selectedHead}
                  <X className="w-3.5 h-3.5 ml-1" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAllHeads(!showAllHeads)}
                className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {showAllHeads ? 'Show Top 8 Only' : 'Show All 21 Heads'}
              </button>
            </div>
          </div>

          {/* 21 Heads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {(showAllHeads ? currentExpenseBreakdown : currentExpenseBreakdown.slice(0, 8)).map(
              (b, idx) => {
                const isSelected = selectedHead === b.head;
                return (
                  <div
                    key={b.head}
                    onClick={() => setSelectedHead(isSelected ? 'all' : b.head)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
                        : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        {b.head.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {b.count} {b.count === 1 ? 'voucher' : 'vouchers'}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm font-black font-mono text-slate-900">
                        Rs. {b.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 font-mono">
                        {b.percent}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(3, b.percent))}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Standardized Filters Bar */}
      <UIFilterBar>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <UISearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search tracking ID, challan, head, or notes..."
            containerClassName="w-full sm:w-80"
          />

          <div className="w-full sm:w-40">
            <UISelect
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              aria-label="Filter by Type"
            >
              <option value="all">All Types (Income & Exp)</option>
              <option value="Expense">Expense (Costs)</option>
              <option value="Income">Income (Sales)</option>
            </UISelect>
          </div>

          <div className="w-full sm:w-36">
            <UISelect
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              aria-label="Filter by Unit"
            >
              <option value="all">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
            </UISelect>
          </div>

          <div className="w-full sm:w-48">
            <UISelect
              value={selectedHead}
              onChange={(e) => setSelectedHead(e.target.value)}
              aria-label="Filter by Category or Head"
            >
              {selectedType === 'Income' ? (
                <>
                  <option value="all">All Sales Categories</option>
                  <option value="EGG">EGG (Egg Sales)</option>
                  <option value="Manure">Manure (Fertilizer)</option>
                  <option value="Feed BAGS">Feed BAGS (Empty Bags)</option>
                  <option value="OTHER">OTHER (Scrap & Misc)</option>
                </>
              ) : selectedType === 'Expense' ? (
                <>
                  <option value="all">All 21 Expense Heads</option>
                  {EXPENSE_HEADS_21.map((h) => (
                    <option key={h} value={h}>
                      {h.replace('_', ' ')}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="all">All Heads & Categories</option>
                  <optgroup label="Sales Categories">
                    <option value="EGG">EGG</option>
                    <option value="Manure">Manure</option>
                    <option value="Feed BAGS">Feed BAGS</option>
                    <option value="OTHER">OTHER</option>
                  </optgroup>
                  <optgroup label="21 Expense Heads">
                    {EXPENSE_HEADS_21.map((h) => (
                      <option key={h} value={h}>
                        {h.replace('_', ' ')}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </UISelect>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Page Size:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-800 text-xs font-bold"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </UIFilterBar>

      {/* Ledger Table Card with 10-per-page Pagination */}
      <TableCard
        title={
          selectedType === 'Expense'
            ? `Operational Expense Vouchers (${filtered.length.toLocaleString()} records)`
            : selectedType === 'Income'
            ? `Commercial Sales & Revenue Ledger (${filtered.length.toLocaleString()} records)`
            : `Farm Financial Ledger (${filtered.length.toLocaleString()} records)`
        }
        subtitle={`Showing records 10 per page • Page ${safePage} of ${totalPages} (${filtered.length.toLocaleString()} records total)`}
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
            {filtered.length.toLocaleString()} {selectedType === 'Income' ? 'Sales' : 'Vouchers'}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              {selectedType === 'Income' ? (
                <tr>
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Flock / Unit</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cartons Sold (Eggs)</th>
                  <th className="py-3 px-3 text-right">Rate / Carton</th>
                  <th className="py-3 px-3 text-right">Online Payment</th>
                  <th className="py-3 px-3 text-right">Cash Payment</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3">Vehicle / Challan</th>
                  <th className="py-3 px-3 text-center">Attachment</th>
                </tr>
              ) : selectedType === 'Expense' ? (
                <tr>
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Unit / Flock</th>
                  <th className="py-3 px-3">Expense Head</th>
                  <th className="py-3 px-3">Challan No</th>
                  <th className="py-3 px-3">Description & Notes</th>
                  <th className="py-3 px-3 text-right">Amount (PKR)</th>
                  <th className="py-3 px-3 text-center">Attachment</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Unit / Flock</th>
                  <th className="py-3 px-3">Head / Category</th>
                  <th className="py-3 px-3">Challan No</th>
                  <th className="py-3 px-3">Description & Notes</th>
                  <th className="py-3 px-3 text-right">Amount (PKR)</th>
                  <th className="py-3 px-3 text-center">Attachment</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No financial records match the selected unit, head, date range, and filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((fin) => {
                  const trackingId = fin.trackingId || (fin.id ? fin.id.replace('exp-', '').replace('fin-', '').replace('sale-', '').replace('inc-', '') : '—');
                  const unitName = fin.flockName || (fin.flockId === 8 || fin.flockId === '8' ? 'Unit 1' : fin.flockId === 9 || fin.flockId === '9' ? 'Unit 2' : fin.flockId === 10 || fin.flockId === '10' ? 'Unit 3' : '—');
                  const headName = fin.head || fin.category;
                  const s = fin as any;

                  if (selectedType === 'Income') {
                    return (
                      <tr key={fin.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          #{trackingId}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {fin.date}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFlockBadgeClass(
                              fin.flockName,
                              fin.flockId
                            )}`}
                          >
                            {unitName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200/60">
                            {headName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {s.quantity !== undefined ? (
                            <div>
                              <div>{(s.quantity / 360).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">ctn</span></div>
                              <div className="text-[10px] font-normal text-slate-400">({s.quantity.toLocaleString()} eggs)</div>
                            </div>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {s.unitPrice !== undefined && s.unitPrice > 0 ? (
                            <div>
                              <div className="font-semibold text-emerald-800">Rs. {Math.round(s.unitPrice * 360).toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400 font-normal">Rs. {s.unitPrice.toFixed(2)}/egg</div>
                            </div>
                          ) : (
                            'Rs. 0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-teal-700 font-semibold">
                          {s.onlinePayment !== undefined && s.onlinePayment > 0 ? `Rs. ${s.onlinePayment.toLocaleString()}` : 'Rs. 0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {s.cashPayment !== undefined && s.cashPayment > 0 ? `Rs. ${s.cashPayment.toLocaleString()}` : 'Rs. 0'}
                        </td>
                        <td className="py-3 px-3 font-black text-right font-mono text-emerald-700">
                          Rs. {fin.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {s.vehicleNumber || 'ABC'} {s.challanNo ? `(#${s.challanNo})` : ''}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {fin.attachment || fin.attachmentName ? (
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(fin)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors shadow-xs"
                              title={fin.attachmentName || 'View Attachment'}
                            >
                              <Paperclip className="w-3 h-3 mr-1" />
                              Slip
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={fin.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{trackingId}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {fin.date}
                      </td>
                      {selectedType === 'all' && (
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              fin.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {fin.type}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFlockBadgeClass(
                            fin.flockName,
                            fin.flockId
                          )}`}
                        >
                          {unitName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {headName}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {fin.challanNo ? `#${fin.challanNo}` : fin.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-sm truncate" title={fin.notes || fin.description}>
                        {fin.notes || fin.description || '—'}
                      </td>
                      <td
                        className={`py-3 px-3 font-black text-right font-mono ${
                          fin.type === 'Income' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        Rs. {fin.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {fin.attachment || fin.attachmentName ? (
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(fin)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300/80 cursor-pointer transition-colors shadow-xs"
                            title={fin.attachmentName || 'View Attachment'}
                          >
                            <Paperclip className="w-3 h-3 mr-1" />
                            Slip
                          </button>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center text-emerald-700 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          {fin.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 10-Records Pagination Controls matching user requirements */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="text-slate-600 font-medium">
            Showing{' '}
            <span className="font-bold text-slate-900">
              {totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900">
              {Math.min(safePage * pageSize, totalRecords)}
            </span>{' '}
            of <span className="font-bold text-slate-900">{totalRecords.toLocaleString()}</span> records
            {' • '}Page <span className="font-bold text-slate-900">{safePage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Smart pagination numbers */}
            {(() => {
              const pages: (number | string)[] = [];
              const maxButtons = 5;
              if (totalPages <= maxButtons) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                let start = Math.max(1, safePage - 2);
                let end = Math.min(totalPages, safePage + 2);
                if (safePage <= 3) {
                  start = 1;
                  end = 5;
                } else if (safePage >= totalPages - 2) {
                  start = totalPages - 4;
                  end = totalPages;
                }
                if (start > 1) {
                  pages.push(1);
                  if (start > 2) pages.push('...');
                }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
              }

              return pages.map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(page);
                const isCurrent = pageNum === safePage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Jump to Page */}
            <form onSubmit={handleJumpPage} className="flex items-center ml-2 space-x-1">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Go"
                className="w-12 h-8 px-1.5 text-xs text-center border border-slate-200 rounded-lg bg-white text-slate-800"
              />
              <button
                type="submit"
                className="h-8 px-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
              >
                Jump
              </button>
            </form>
          </div>
        </div>
      </TableCard>

      {/* Record Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {newRecord.type === 'Income' ? 'Record Sales & Receipt' : 'Record Voucher / Expense (21 Heads)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <UISelect
                  label="Transaction Type"
                  value={newRecord.type}
                  onChange={(e) => {
                    const nextType = e.target.value as 'Expense' | 'Income';
                    setNewRecord({
                      ...newRecord,
                      type: nextType,
                      head: nextType === 'Income' ? 'EGG' : 'FEED',
                    });
                  }}
                >
                  <option value="Expense">Expense (Cost)</option>
                  <option value="Income">Income (Sales)</option>
                </UISelect>

                <UISelect
                  label="Unit / Flock"
                  value={newRecord.flockName}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      flockName: e.target.value,
                      flockId: e.target.value === 'Unit 1' ? 8 : e.target.value === 'Unit 2' ? 9 : 10,
                    })
                  }
                >
                  <option value="Unit 1">Unit 1 (Flock 8)</option>
                  <option value="Unit 2">Unit 2 (Flock 9)</option>
                  <option value="Unit 3">Unit 3 (Flock 10)</option>
                </UISelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <UISelect
                  label={newRecord.type === 'Income' ? 'Sales Category / Head' : 'Expense Head (21 Heads)'}
                  value={newRecord.head}
                  onChange={(e) => setNewRecord({ ...newRecord, head: e.target.value })}
                >
                  {newRecord.type === 'Income' ? (
                    ['EGG', 'Manure', 'Feed BAGS', 'Cull Birds', 'OTHER'].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))
                  ) : (
                    EXPENSE_HEADS_21.map((h) => (
                      <option key={h} value={h}>
                        {h.replace('_', ' ')}
                      </option>
                    ))
                  )}
                </UISelect>

                <UIInput
                  label="Amount (PKR)"
                  type="number"
                  min="1"
                  required
                  value={newRecord.amount}
                  onChange={(e) => {
                    const amt = Number(e.target.value);
                    setNewRecord({
                      ...newRecord,
                      amount: amt,
                      onlineAmount: newRecord.paymentMode === 'Online' ? amt : newRecord.paymentMode === 'Cash' ? 0 : Math.round(amt * 0.8),
                      cashAmount: newRecord.paymentMode === 'Cash' ? amt : newRecord.paymentMode === 'Online' ? 0 : Math.round(amt * 0.2),
                    });
                  }}
                />
              </div>

              {/* Payment Channel Selector for Sales Receipts */}
              {newRecord.type === 'Income' && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                  <UISelect
                    label="Payment Channel / Receipt Method"
                    value={newRecord.paymentMode}
                    onChange={(e) => {
                      const mode = e.target.value as 'Online' | 'Cash' | 'Split';
                      setNewRecord({
                        ...newRecord,
                        paymentMode: mode,
                        onlineAmount: mode === 'Online' ? newRecord.amount : mode === 'Cash' ? 0 : Math.round(newRecord.amount * 0.8),
                        cashAmount: mode === 'Cash' ? newRecord.amount : mode === 'Online' ? 0 : Math.round(newRecord.amount * 0.2),
                      });
                    }}
                  >
                    <option value="Online">Online / Direct Bank Transfer (100% Online)</option>
                    <option value="Cash">Cash Counter / Direct Cash (100% Cash)</option>
                    <option value="Split">Split Payment (Online Bank + Cash Counter)</option>
                  </UISelect>

                  {newRecord.paymentMode === 'Split' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <UIInput
                        label="Online Bank Amount (PKR)"
                        type="number"
                        min="0"
                        value={newRecord.onlineAmount}
                        onChange={(e) => {
                          const online = Number(e.target.value);
                          setNewRecord({
                            ...newRecord,
                            onlineAmount: online,
                            cashAmount: Math.max(0, newRecord.amount - online),
                          });
                        }}
                      />
                      <UIInput
                        label="Cash Counter Amount (PKR)"
                        type="number"
                        min="0"
                        value={newRecord.cashAmount}
                        onChange={(e) => {
                          const cash = Number(e.target.value);
                          setNewRecord({
                            ...newRecord,
                            cashAmount: cash,
                            onlineAmount: Math.max(0, newRecord.amount - cash),
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <UIInput
                  label="Challan / Voucher No"
                  value={newRecord.challanNo}
                  onChange={(e) => setNewRecord({ ...newRecord, challanNo: e.target.value })}
                />

                <UIInput
                  label="Invoice / Ref No"
                  value={newRecord.referenceNo}
                  onChange={(e) => setNewRecord({ ...newRecord, referenceNo: e.target.value })}
                />
              </div>

              <UITextarea
                label="Description & Notes"
                placeholder="e.g. Cardboard 16 number 30 bundle, feed bags, egg sales etc."
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              />

              {/* Attachment / Slip Upload Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Attach Voucher / Receipt / Slip (Image or PDF)
                </label>
                {attachmentName ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2 truncate">
                      {attachmentData?.startsWith('data:image') ? (
                        <img
                          src={attachmentData}
                          alt="Slip Preview"
                          className="w-8 h-8 rounded object-cover border border-emerald-200"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-950 truncate">{attachmentName}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Slip document attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer bg-slate-50/70 hover:bg-emerald-50/20 transition-all">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        Upload Challan / Invoice / Bank Slip
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, WEBP or PDF file format
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleAttachmentChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <UIButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    handleRemoveAttachment();
                  }}
                >
                  Cancel
                </UIButton>
                <UIButton type="submit" variant="primary">
                  {newRecord.type === 'Income' ? 'Save Sale Record' : 'Save Expense Voucher'}
                </UIButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Document Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Document / Slip Attachment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Voucher #{previewRecord.trackingId || previewRecord.id} • {previewRecord.type} • {previewRecord.head || previewRecord.category} • Rs. {previewRecord.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto my-4 bg-slate-50 rounded-xl p-4 flex items-center justify-center border border-slate-200/80 min-h-[300px]">
              {previewRecord.attachment?.startsWith('data:image') ? (
                <img
                  src={previewRecord.attachment}
                  alt={previewRecord.attachmentName || 'Slip'}
                  className="max-h-[58vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200"
                />
              ) : previewRecord.attachment?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewRecord.attachment}
                  title={previewRecord.attachmentName || 'PDF Document'}
                  className="w-full h-[480px] rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">
                    {previewRecord.attachmentName || 'Attached Slip Document'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Challan #{previewRecord.challanNo || 'N/A'} • Reference: {previewRecord.referenceNo || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {previewRecord.description || previewRecord.notes || 'No extra notes provided.'}
                  </p>
                  {previewRecord.attachment && (
                    <a
                      href={previewRecord.attachment}
                      download={previewRecord.attachmentName || 'attachment'}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download Attachment File
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500 truncate max-w-xs">
                File: <span className="font-semibold text-slate-800">{previewRecord.attachmentName || 'Slip Attached'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {previewRecord.attachment && (
                  <a
                    href={previewRecord.attachment}
                    download={previewRecord.attachmentName || 'voucher-slip'}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
