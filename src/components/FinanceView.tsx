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

    return {
      all: {
        count: salesOnly.length,
        revenue: salesOnly.reduce((s, r) => s + r.amount, 0),
        items: salesOnly.reduce((s, r: any) => s + (r.quantity || 0), 0),
      },
      unit1: {
        count: su1.length,
        revenue: su1.reduce((s, r) => s + r.amount, 0),
        items: su1.reduce((s, r: any) => s + (r.quantity || 0), 0),
      },
      unit2: {
        count: su2.length,
        revenue: su2.reduce((s, r) => s + r.amount, 0),
        items: su2.reduce((s, r: any) => s + (r.quantity || 0), 0),
      },
      unit3: {
        count: su3.length,
        revenue: su3.reduce((s, r) => s + r.amount, 0),
        items: su3.reduce((s, r: any) => s + (r.quantity || 0), 0),
      },
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
    const record: FinancialRecord = {
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
      attachment: attachmentData || null,
      attachmentName: attachmentName || null,
    };
    onAddTransaction(record);
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
                ? `${salesStats.all.items.toLocaleString()} units sold`
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
                ? `${salesStats.unit1.items.toLocaleString()} units sold`
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
                ? `${salesStats.unit2.items.toLocaleString()} units sold`
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
                ? `${salesStats.unit3.items.toLocaleString()} units sold`
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              subtext="Verified commercial sales"
            />
            <StatCard
              title="Total Items Sold"
              value={`${totalItemsSold.toLocaleString()} Units`}
              icon={TrendingUp}
              color="blue"
              badge={{ text: `Avg Rs. ${(totalIncome / (totalItemsSold || 1)).toFixed(2)}/unit`, color: 'blue' }}
              subtext="Eggs, manure & feed bags sold"
            />
            <StatCard
              title="Online Banking Payments"
              value={`Rs. ${totalOnline.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={CreditCard}
              color="teal"
              valueColor="text-teal-700"
              badge={{ text: `${((totalOnline / (totalIncome || 1)) * 100).toFixed(1)}% Online`, color: 'teal' }}
              subtext="Direct bank transfers received"
            />
            <StatCard
              title="Direct Cash Collections"
              value={`Rs. ${totalCash.toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
              icon={ArrowUpRight}
              color="emerald"
              valueColor="text-emerald-800"
              badge={{ text: `${((totalCash / (totalIncome || 1)) * 100).toFixed(1)}% Cash`, color: 'emerald' }}
              subtext="Cash in hand receipts"
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
                    {b.items.toLocaleString()} units sold
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
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
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
                          {(s.quantity !== undefined ? s.quantity : 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {s.unitPrice !== undefined && s.unitPrice > 0 ? `Rs. ${s.unitPrice.toFixed(3)}` : 'Rs. 0'}
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
                  onChange={(e) => setNewRecord({ ...newRecord, amount: Number(e.target.value) })}
                />
              </div>

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
