import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Printer,
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
} from 'lucide-react';
import { Flock, EggProduction, MortalityLog, FeedConsumption, FinancialRecord } from '../types/farm.ts';
import { StatCard, PageHeader, UIButton, TableCard, DatePreset } from './ui';
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
}

type ReportType = 'egg-production' | 'sales-revenue' | 'stock-inventory' | 'flock-health';

export const ReportsView: React.FC<ReportsViewProps> = ({
  flocks,
  eggProductions,
  mortalityLogs,
  consumptionLogs,
  financials = [],
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('egg-production');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const recordsPerPage = 10;

  // Find latest reference date
  const latestDate = useMemo(() => {
    return eggProductions[0]?.date || '2026-10-25';
  }, [eggProductions]);

  // Handle Preset selection
  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    setCurrentPage(1);
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

  const handleResetFilters = () => {
    setSelectedUnit('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setPreset('all');
    setCurrentPage(1);
  };

  // Egg Production dataset: prefer full liveEggProductions (371 records)
  const eggDataset: DetailedEggProduction[] = useMemo(() => {
    if (eggProductions.length >= 371) {
      return eggProductions as DetailedEggProduction[];
    }
    return liveEggProductions;
  }, [eggProductions]);

  // Sales dataset: prefer full liveSalesRecords (808 records)
  const salesDataset: SaleRecord[] = useMemo(() => {
    const incomeFromFinancials = financials.filter((f) => f.type === 'Income') as SaleRecord[];
    if (incomeFromFinancials.length >= 808) {
      return incomeFromFinancials;
    }
    return liveSalesRecords;
  }, [financials]);

  // Stock dataset: 145 authentic records
  const stockDataset: StockRecord[] = useMemo(() => {
    return liveStockRecords;
  }, []);

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

  // Pagination calculation
  const currentDatasetLength =
    activeReport === 'egg-production'
      ? filteredEggs.length
      : activeReport === 'sales-revenue'
      ? filteredSales.length
      : activeReport === 'stock-inventory'
      ? filteredStocks.length
      : filteredEggs.length;

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (activeReport === 'egg-production') {
      const headers =
        'Tracking ID,Date,Flock/Unit,Morning Eggs,Evening Eggs,Total Eggs,Damaged/Broken,Clean Trays (30s),Avg Weight (g),Laying Rate %\n';
      const rows = filteredEggs
        .map(
          (e) =>
            `${e.trackingId || e.id},"${e.date}","${e.flockName || 'Unit'}",${e.morningEggs || 0},${e.eveningEggs || 0},${e.totalEggs || 0},${e.damagedEggs || e.brokenEggs || 0},${e.cleanTrays || 0},${e.averageWeight || 60},${e.layingRatePercent || 0}%`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GreenOva_Egg_Production_Report_${selectedUnit}_${fromDate || 'all'}_to_${toDate || 'latest'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (activeReport === 'sales-revenue') {
      const headers =
        'Tracking ID,Date,Flock/Unit,Category,Quantity,Unit Price (PKR),Online Payment (PKR),Cash Payment (PKR),Total Amount (PKR),Vehicle/Challan,Buyer Notes\n';
      const rows = filteredSales
        .map(
          (s) =>
            `${s.trackingId || s.id},"${s.date}","${s.flockName || s.flock || 'Unit'}",${s.category},${s.quantity || 0},${s.unitPrice || 0},${s.onlinePayment || 0},${s.cashPayment || 0},${s.amount || 0},"${s.vehicleNumber || '-'}-${s.challanNo || ''}","${(s.notes || '').replace(/"/g, '""')}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GreenOva_Sales_Revenue_Report_${selectedUnit}_${fromDate || 'all'}_to_${toDate || 'latest'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (activeReport === 'stock-inventory') {
      const headers =
        'Tracking ID,Date,Type,Flock Name,Head,Quantity (Bags),Amount (PKR),Avg Rate/Bag,Payment Type,Challan No,Notes\n';
      const rows = filteredStocks
        .map(
          (r) =>
            `${r.trackingId},"${r.date}","${r.feedType}","${r.flockName}",${r.head},${r.quantity},${r.amount},${r.costPerBag},${r.paymentType},"${r.challanNo}","${(r.notes || '').replace(/"/g, '""')}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GreenOva_Stock_Inventory_Report_${selectedUnit}_${fromDate || 'all'}_to_${toDate || 'latest'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = 'Date,Flock,Total Eggs,Damaged,Trays,Laying Rate\n';
      const rows = filteredEggs
        .map((e) => `"${e.date}","${e.flockName}",${e.totalEggs},${e.damagedEggs},${e.cleanTrays},${e.layingRatePercent}%`)
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GreenOva_Flock_Audit_${fromDate || 'Start'}_to_${toDate || 'Latest'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Farm Analytics & Audit Reports"
        subtitle="Comprehensive production yield registries, commercial sales ledger, and feed stock replenishment logs."
        icon={FileBarChart2}
        iconColor="emerald"
        badge="Analytics Engine"
        actions={
          <>
            <UIButton
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV ({currentDatasetLength.toLocaleString()})
            </UIButton>
            <UIButton
              variant="primary"
              icon={Printer}
              onClick={handlePrint}
            >
              Print Report
            </UIButton>
          </>
        }
      />

      {/* Main Report Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
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
            371 Logs
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
            808 Sales
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
            145 Logs
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
        </button>
      </div>

      {/* Quick Unit Filters with Real PDF Stats */}
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
          {activeReport === 'egg-production' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('all');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>All Units Combined</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    371 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  17,168,190 <span className="text-[10px] font-normal">Eggs</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 1');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 1'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 1</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 1' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    87 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  1,931,280 <span className="text-[10px] font-normal">Eggs (11.3%)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 2');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 2'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 2</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 2' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    229 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  14,103,090 <span className="text-[10px] font-normal">Eggs (82.2%)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 3');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 3'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 3</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 3' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    55 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  1,133,820 <span className="text-[10px] font-normal">Eggs (6.6%)</span>
                </div>
              </button>
            </>
          ) : activeReport === 'sales-revenue' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('all');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>All Units Combined</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    808 Sales
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  Rs. 312.78M <span className="text-[10px] font-normal">(47,226 Cartons / 17.00M Eggs)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 1');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 1'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 1</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 1' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    182 Sales
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  Rs. 29.80M <span className="text-[10px] font-normal">(4,514 Cartons / 9.5%)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 2');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 2'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 2</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 2' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    489 Sales
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  Rs. 266.38M <span className="text-[10px] font-normal">(40,238 Cartons / 85.2%)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 3');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 3'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 3</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 3' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    137 Sales
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  Rs. 16.60M <span className="text-[10px] font-normal">(2,474 Cartons / 5.3%)</span>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('all');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>All Units Combined</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    145 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  48,395 <span className="text-[10px] font-normal">Bags</span>
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${selectedUnit === 'all' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Rs. 282.57M
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 1');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 1'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 1</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 1' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    49 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  7,840 <span className="text-[10px] font-normal">Bags (16.2%)</span>
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${selectedUnit === 'Unit 1' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Rs. 46.37M
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 2');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 2'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 2</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 2' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    67 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  34,245 <span className="text-[10px] font-normal">Bags (70.8%)</span>
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${selectedUnit === 'Unit 2' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Rs. 199.65M
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 3');
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 3'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 3</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedUnit === 'Unit 3' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    29 Logs
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  6,310 <span className="text-[10px] font-normal">Bags (13.0%)</span>
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${selectedUnit === 'Unit 3' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Rs. 36.55M
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date & Search Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
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
                Eggs (Rs. 311.9M)
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

          {/* Date Range Inputs */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPreset('all');
                setCurrentPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPreset('all');
                setCurrentPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Date Presets */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handlePresetChange('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
              preset === 'all' && !fromDate && !toDate
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('30d')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
              preset === '30d'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1 text-xs rounded-lg font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer ml-1"
          >
            Reset
          </button>
        </div>
      </div>

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
              badge={{ text: `${eggTotals.count} Logs`, color: 'amber' }}
              subtext={`${eggTotals.cleanTrays.toLocaleString()} clean trays (30 eggs/tray)`}
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
              title="Commercial Clean Trays"
              value={eggTotals.cleanTrays}
              unit="Trays"
              icon={Package}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: '30 Eggs/Tray', color: 'emerald' }}
              subtext={`${(eggTotals.totalEggs - eggTotals.brokenEggs).toLocaleString()} marketable clean eggs`}
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
                    <th className="py-3 px-3 text-right">Total Production</th>
                    <th className="py-3 px-3 text-right">Clean Trays</th>
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
                          {(log.totalEggs || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold font-mono text-slate-800">
                          {(log.cleanTrays || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Trays</span>
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
              value="3 Sheds"
              icon={Building2}
              color="amber"
              badge={{ text: 'Units 1, 2, 3', color: 'amber' }}
              subtext="Unit 2 received 70.8% of stock"
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
                          Rs. {record.costPerBag.toLocaleString()}
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
              value={filteredMortality.reduce((acc, curr) => acc + curr.count, 0)}
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
                const livability = ((flock.currentCount / flock.initialCount) * 100).toFixed(1);

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
        </div>
      )}
    </div>
  );
};
