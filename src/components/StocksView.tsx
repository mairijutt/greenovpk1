import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  CheckCircle,
  Package,
  DollarSign,
  Truck,
  Building2,
  Search,
  Download,
  Printer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CreditCard,
  Banknote,
  Layers,
  Eye,
  Edit,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { InventoryItem, FinancialRecord } from '../types/farm.ts';
import { StatCard, PageHeader, UIButton, TableCard, DateRangePickerBar, DatePreset, RecordDetailModal } from './ui';
import {
  STOCK_SUMMARY,
  unitWiseStockSummary,
  liveStockRecords,
  StockRecord,
} from '../data/liveStocks.ts';
import { getInitialUrlFilters } from '../utils/urlFilters.ts';
import { apiFetch } from '../services/api.ts';

interface StocksViewProps {
  inventory?: InventoryItem[];
  onRestock?: (id: string, amount: number) => void;
  onAddTransaction?: (record: FinancialRecord) => Promise<void> | void;
}

export const StocksView: React.FC<StocksViewProps> = ({ onAddTransaction }) => {
  const initialUrlFilters = useMemo(() => getInitialUrlFilters(), []);
  const [activeTab, setActiveTab] = useState<'shipments' | 'add-stock'>('shipments');
  const [selectedUnit, setSelectedUnit] = useState<string>(() => initialUrlFilters.unit);
  const [selectedFeedType, setSelectedFeedType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>(() => initialUrlFilters.from);
  const [toDate, setToDate] = useState<string>(() => initialUrlFilters.to);
  const [preset, setPreset] = useState<DatePreset>(() => (initialUrlFilters.hasDateRange ? 'custom' : 'all'));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const recordsPerPage = 10;

  // Persistent Stock Records Ledger (starts with 145 authentic records, accepts new entries)
  const [allStockRecords, setAllStockRecords] = useState<StockRecord[]>(() => {
    const saved = localStorage.getItem('greenova_stocks_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return liveStockRecords;
  });

  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Old System Stock Details Form State matching st1_d471a4d4.png & st2/st3
  const [formDate, setFormDate] = useState<string>(getLocalToday);
  const [formHead, setFormHead] = useState<string>('FEED');
  const [formStockType, setFormStockType] = useState<string>('11');
  const [formFlock, setFormFlock] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number | string>(0);
  const [formAmount, setFormAmount] = useState<number | string>(0);
  const [formPaymentType, setFormPaymentType] = useState<string>('');
  const [formChallan, setFormChallan] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDeleteStockId, setConfirmDeleteStockId] = useState<string | null>(null);
  const [viewingStock, setViewingStock] = useState<StockRecord | null>(null);
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Hydrate live Stock records from PostgreSQL on mount
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
        setAllStockRecords(mapped);
        try {
          localStorage.setItem('greenova_stocks_v2', JSON.stringify(mapped));
        } catch {}
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Edit Stock Record Modal State
  const [editingStock, setEditingStock] = useState<StockRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editHead, setEditHead] = useState('FEED');
  const [editType, setEditType] = useState('13');
  const [editFlock, setEditFlock] = useState('Unit 1');
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPaymentType, setEditPaymentType] = useState('CASH');
  const [editChallan, setEditChallan] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const openEditStockModal = (record: StockRecord) => {
    setEditingStock(record);
    setEditError(null);
    setEditDate((record.rawDate || record.date || getLocalToday()).split('T')[0]);
    setEditHead(record.head || 'FEED');
    setEditType(record.type || '13');
    setEditFlock(record.flockName || 'Unit 1');
    setEditQuantity(Number(record.quantity) || 0);
    setEditAmount(Number(record.amount) || 0);
    setEditPaymentType(record.paymentType || 'CASH');
    setEditChallan(record.challanNo || '');
    setEditNotes(record.notes || '');
  };

  const handleSaveEditedStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;
    setEditError(null);
    if (!editDate) {
      setEditError('Please select a date.');
      return;
    }
    if (!editFlock) {
      setEditError('Please select a unit / flock.');
      return;
    }
    if (!editType.trim()) {
      setEditError('Please enter a stock type.');
      return;
    }
    const qty = Math.max(0, Number(editQuantity) || 0);
    const amt = Math.max(0, Number(editAmount) || 0);
    if (qty <= 0) {
      setEditError('Quantity must be greater than 0.');
      return;
    }
    if (amt <= 0) {
      setEditError('Amount (PKR) must be greater than 0.');
      return;
    }
    if (!editChallan.trim()) {
      setEditError('Please enter a challan number.');
      return;
    }
    setIsSavingStock(true);
    const costBag = qty > 0 ? Math.round(amt / qty) : 0;
    const flockId = editFlock === 'Unit 2' ? '9' : editFlock === 'Unit 3' ? '10' : '8';

    const updatedRecord: StockRecord = {
      ...editingStock,
      date: editDate,
      rawDate: editDate,
      head: editHead,
      category: editHead,
      type: editType,
      feedType: editHead === 'FEED' ? `Layer Feed ${editType}` : editType,
      flockName: editFlock,
      flockId,
      quantity: qty,
      bags: qty,
      amount: amt,
      costPerBag: costBag,
      paymentType: editPaymentType,
      challanNo: editChallan.trim(),
      notes: editNotes.trim(),
    };

    const resolvedId = updatedRecord.trackingId || updatedRecord.id;
    try {
      await apiFetch(`/api/stocks/${resolvedId}`, {
        method: 'PUT',
        body: JSON.stringify({
          clientId: updatedRecord.id,
          date: editDate,
          challanNo: updatedRecord.challanNo,
          Type: editType,
          flockId: Number(flockId),
          flockName: editFlock,
          head: editHead,
          quantity: qty,
          amount: amt,
          amountPaid: amt,
          paymentType: editPaymentType,
          notes: updatedRecord.notes,
        }),
      });

      const nextList = allStockRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
      setAllStockRecords(nextList);
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(nextList));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      setEditingStock(null);
      setToastMessage(`Stock record #${updatedRecord.trackingId} updated successfully.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update stock record.');
    } finally {
      setIsSavingStock(false);
    }
  };

  const handleDeleteStock = async (record: StockRecord) => {
    const resolvedId = record.trackingId || record.id;
    try {
      await apiFetch(`/api/stocks/${resolvedId}`, { method: 'DELETE' });
      const nextList = allStockRecords.filter((r) => String(r.id) !== String(record.id));
      setAllStockRecords(nextList);
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(nextList));
      } catch {}
      setConfirmDeleteStockId(null);
      setToastMessage(`Stock record #${record.trackingId} deleted from database.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to delete stock record.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleHeadChange = (newHead: string) => {
    setFormHead(newHead);
    if (newHead === 'FEED') {
      setFormStockType('11');
    } else if (newHead === 'MEDICINE') {
      setFormStockType('Antibiotic (Enrofloxacin)');
    } else if (newHead === 'VACCINE') {
      setFormStockType('ND + IB Lasota');
    } else if (newHead === 'EQUIPMENT') {
      setFormStockType('Plastic Egg Trays (30ct)');
    } else {
      setFormStockType('Packaging Materials');
    }
  };

  const handleResetForm = () => {
    setFormDate(getLocalToday());
    setFormHead('FEED');
    setFormStockType('11');
    setFormFlock('');
    setFormQuantity(0);
    setFormAmount(0);
    setFormPaymentType('');
    setFormChallan('');
    setFormNotes('');
    setAttachmentName('');
    setAttachmentData(null);
    setFormError(null);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setFormError('Attachment exceeds 3MB size limit.');
        return;
      }
      setFormError(null);
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStockRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formDate) {
      setFormError('Please select a stock intake date.');
      return;
    }
    if (!formHead) {
      setFormError('Please select a stock head.');
      return;
    }
    if (!formStockType) {
      setFormError('Please select a stock type.');
      return;
    }
    if (!formFlock) {
      setFormError('Please select a flock / unit.');
      return;
    }
    if (!formQuantity || Number(formQuantity) <= 0) {
      setFormError('Please enter a valid Quantity greater than 0.');
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      setFormError('Please enter a valid Amount (PKR) greater than 0.');
      return;
    }
    if (!formPaymentType) {
      setFormError('Please select a payment type.');
      return;
    }
    if (!formChallan.trim()) {
      setFormError('Please enter a challan number.');
      return;
    }
    setIsSavingStock(true);

    const qty = Number(formQuantity) || 0;
    const amt = Number(formAmount) || 0;
    const costBag = qty > 0 ? Math.round(amt / qty) : 0;
    const maxTracking = allStockRecords.reduce((max, r) => Math.max(max, r.trackingId || 0), 0);
    const flockId = formFlock === 'Unit 2' ? '9' : formFlock === 'Unit 3' ? '10' : '8';
    const clientId = `stk-${Date.now()}`;

    try {
      const res = await apiFetch('/api/stocks', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          date: formDate,
          challanNo: formChallan.trim(),
          Type: formStockType,
          flockId: Number(flockId),
          flockName: formFlock,
          head: formHead,
          quantity: qty,
          amount: amt,
          amountPaid: amt,
          paymentType: formPaymentType.toUpperCase(),
          notes: formNotes,
          attachment: attachmentData || attachmentName || null,
        }),
      });

      const canonicalId = Number(res?.data?.id) || maxTracking + 1;

      const newRecord: StockRecord = {
        id: String(canonicalId),
        trackingId: canonicalId,
        date: formDate,
        rawDate: formDate,
        type: formStockType,
        feedType: formHead === 'FEED' ? `Layer Feed ${formStockType}` : formStockType,
        flockName: formFlock,
        flockId,
        head: formHead,
        category: formHead,
        quantity: qty,
        bags: qty,
        amount: amt,
        costPerBag: costBag,
        paymentType: formPaymentType.toUpperCase(),
        challanNo: formChallan.trim(),
        notes: formNotes || `${qty} bags of ${formStockType} received...`,
      };

      const updated = [newRecord, ...allStockRecords];
      setAllStockRecords(updated);
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // Automatically create corresponding Farm Expense transaction so cost reflects dynamically everywhere
      if (onAddTransaction) {
        const expenseRecord: FinancialRecord = {
          id: `exp-stk-${Date.now()}`,
          trackingId: newRecord.trackingId,
          type: 'Expense',
          category: formHead === 'FEED' ? 'FEED' : formHead === 'MEDICINE' ? 'MEDICINE' : formHead === 'VACCINE' ? 'VACCINE' : formHead,
          head: formHead === 'FEED' ? 'FEED' : formHead === 'MEDICINE' ? 'MEDICINE' : formHead === 'VACCINE' ? 'VACCINE' : formHead,
          amount: amt,
          date: formDate,
          referenceNo: `STK-${newRecord.trackingId}`,
          challanNo: formChallan.trim(),
          flockId: Number(flockId),
          flockName: formFlock,
          description: `Stock Intake: ${qty} ${formHead === 'FEED' ? 'bags' : 'units'} of ${formStockType} (${formHead}) via ${formPaymentType}`,
          notes: formNotes || `Stock record #${newRecord.trackingId} auto-synced to Farm Expenses ledger.`,
          status: 'Paid',
          attachment: attachmentData || null,
          attachmentName: attachmentName || null,
        };
        await onAddTransaction(expenseRecord);
      }

      handleResetForm();
      setActiveTab('shipments');
      setCurrentPage(1);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save stock record to database.');
    } finally {
      setIsSavingStock(false);
    }
  };

  // Filtered stock shipments from authentic records
  const filteredShipments = useMemo(() => {
    return allStockRecords.filter((record) => {
      const unitMatch =
        selectedUnit === 'all' ||
        record.flockName.toLowerCase() === selectedUnit.toLowerCase() ||
        (selectedUnit === 'Unit 1' && record.flockId === '8') ||
        (selectedUnit === 'Unit 2' && record.flockId === '9') ||
        (selectedUnit === 'Unit 3' && record.flockId === '10');

      const feedTypeMatch =
        selectedFeedType === 'all' || record.type === selectedFeedType;

      const paymentMatch =
        selectedPayment === 'all' || record.paymentType === selectedPayment;

      const recDate = (record.date || '').slice(0, 10);
      const dateMatch = (!fromDate || recDate >= fromDate) && (!toDate || recDate <= toDate);

      const q = searchQuery.trim().toLowerCase();
      const searchMatch =
        !q ||
        record.trackingId.toString().includes(q) ||
        record.date.toLowerCase().includes(q) ||
        record.flockName.toLowerCase().includes(q) ||
        record.challanNo.toLowerCase().includes(q) ||
        record.notes.toLowerCase().includes(q) ||
        record.feedType.toLowerCase().includes(q);

      return unitMatch && feedTypeMatch && paymentMatch && dateMatch && searchMatch;
    });
  }, [allStockRecords, selectedUnit, selectedFeedType, selectedPayment, fromDate, toDate, searchQuery]);

  // Aggregated stats of filtered shipments
  const filteredStats = useMemo(() => {
    const totalBags = filteredShipments.reduce((sum, r) => sum + r.quantity, 0);
    const totalAmount = filteredShipments.reduce((sum, r) => sum + r.amount, 0);
    const avgCost = totalBags > 0 ? Math.round(totalAmount / totalBags) : 0;
    return { totalBags, totalAmount, avgCost, count: filteredShipments.length };
  }, [filteredShipments]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / recordsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * recordsPerPage;
  const paginatedShipments = useMemo(() => {
    return filteredShipments.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredShipments, startIndex, recordsPerPage]);

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

  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    setCurrentPage(1);
    if (selectedPreset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (selectedPreset === 'today') {
      const todayStr = getLocalToday();
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (selectedPreset === '30d') {
      const todayStr = getLocalToday();
      const ref = new Date(todayStr);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSelectedUnit('all');
    setSelectedFeedType('all');
    setSelectedPayment('all');
    setFromDate('');
    setToDate('');
    setPreset('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers =
      'Tracking ID,Date,Type,Flock Name,Head,Quantity (Bags),Amount (PKR),Avg Rate/Bag,Payment Type,Challan No,Notes\n';
    const rows = filteredShipments
      .map(
        (r) =>
          `${r.trackingId},"${r.date}","${r.feedType}","${r.flockName}",${r.head},${r.quantity},${r.amount},${r.costPerBag},${r.paymentType},"${r.challanNo}","${(r.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Stock_Inventory_Report_${selectedUnit}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Store"
        subtitle="Manage unit-assigned commercial feed replenishments, medicine, vaccines, and farm supplies."
        icon={Boxes}
        iconColor="indigo"
        badge="Unit-Direct Stock Ledger"
        actions={
          <>
            <UIButton
              variant="primary"
              icon={Plus}
              onClick={() => setActiveTab('add-stock')}
            >
              + Add Stock Record
            </UIButton>
            <UIButton
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV ({filteredShipments.length})
            </UIButton>
            <UIButton
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
            >
              Print Ledger
            </UIButton>
          </>
        }
      />

      {/* Main Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('add-stock')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'add-stock'
              ? 'bg-[#3b8754] text-white shadow-sm ring-2 ring-[#3b8754]/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Stock Record (Form)</span>
        </button>

        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'shipments'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Unit Stock Replenishments</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'shipments' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {allStockRecords.length} Shipments
          </span>
        </button>
      </div>

      {/* --- TAB 0: OLD SYSTEM STOCK DETAILS FORM MATCHING st1_d471a4d4.png & st2/st3 --- */}
      {activeTab === 'add-stock' && (
        <div className="max-w-2xl mx-auto py-2">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Stock Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the stock purchase or payment details below
              </p>
            </div>

            <form onSubmit={handleSaveStockRecord} noValidate className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {/* Row 1: Date & Head */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Head *</label>
                  <select
                    value={formHead}
                    onChange={(e) => {
                      handleHeadChange(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="FEED">FEED</option>
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="VACCINE">VACCINE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Stock Type & Flock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Type *</label>
                  <select
                    value={formStockType}
                    onChange={(e) => {
                      setFormStockType(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    {formHead === 'FEED' ? (
                      <>
                        <option value="11">11</option>
                        <option value="12">12</option>
                        <option value="13">13</option>
                        <option value="14">14</option>
                      </>
                    ) : formHead === 'MEDICINE' ? (
                      <>
                        <option value="Antibiotic (Enrofloxacin)">Antibiotic (Enrofloxacin)</option>
                        <option value="Multivitamins & Electrolytes">Multivitamins & Electrolytes</option>
                        <option value="Calcium & D3 Booster">Calcium & D3 Booster</option>
                        <option value="Dewormer Solution">Dewormer Solution</option>
                        <option value="Disinfectant Bio-Shield">Disinfectant Bio-Shield</option>
                        <option value="Other Medicine">Other Medicine</option>
                      </>
                    ) : formHead === 'VACCINE' ? (
                      <>
                        <option value="ND + IB Lasota">ND + IB Lasota</option>
                        <option value="Coryza 3-Way">Coryza 3-Way</option>
                        <option value="Salmonella Enteritidis">Salmonella Enteritidis</option>
                        <option value="Avian Influenza H9N2">Avian Influenza H9N2</option>
                        <option value="Gumboro IBD">Gumboro IBD</option>
                        <option value="Fowl Pox + AE">Fowl Pox + AE</option>
                        <option value="Other Vaccine">Other Vaccine</option>
                      </>
                    ) : formHead === 'EQUIPMENT' ? (
                      <>
                        <option value="Plastic Egg Trays (30ct)">Plastic Egg Trays (30ct)</option>
                        <option value="Drinker Nipples & Pipes">Drinker Nipples & Pipes</option>
                        <option value="Manure Removal Belt">Manure Removal Belt</option>
                        <option value="Cooling Pads & Belts">Cooling Pads & Belts</option>
                        <option value="Other Equipment">Other Equipment</option>
                      </>
                    ) : (
                      <>
                        <option value="Packaging Materials">Packaging Materials</option>
                        <option value="Diesel Fuel">Diesel Fuel</option>
                        <option value="General Store Supplies">General Store Supplies</option>
                      </>
                    )}
                  </select>
                  {formHead === 'FEED' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Feed types are fixed so stock balances stay correct.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flock *</label>
                  <select
                    value={formFlock}
                    onChange={(e) => {
                      setFormFlock(e.target.value);
                      setFormError(null);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer ${
                      !formFlock ? 'text-slate-500' : 'text-slate-800'
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select flock
                    </option>
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 3">Unit 3</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Quantity & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onFocus={() => {
                      if (Number(formQuantity) === 0) setFormQuantity('');
                    }}
                    onBlur={() => {
                      if (formQuantity === '') setFormQuantity(0);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFormQuantity(raw === '' ? '' : Math.max(0, Number(raw) || 0));
                      setFormError(null);
                    }}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formAmount}
                    onFocus={() => {
                      if (Number(formAmount) === 0) setFormAmount('');
                    }}
                    onBlur={() => {
                      if (formAmount === '') setFormAmount(0);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFormAmount(raw === '' ? '' : Math.max(0, Number(raw) || 0));
                      setFormError(null);
                    }}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Payment Type & Challan Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Type *</label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => {
                      setFormPaymentType(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Select payment type
                    </option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Challan Number *</label>
                  <input
                    type="text"
                    value={formChallan}
                    onChange={(e) => setFormChallan(e.target.value)}
                    placeholder="e.g. 1445 or CH-8902"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Row 5: Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attachment (Optional PDF/Image)
                </label>
                <input
                  type="file"
                  id="stock-attachment"
                  accept="image/*,.pdf"
                  onChange={handleAttachmentChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {attachmentName && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Attached: {attachmentName}</span>
                  </p>
                )}
              </div>

              {/* Row 6: Notes / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Description (optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="240 bags of 13-C1 feed received..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons matching st1_d471a4d4.png */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-6 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSavingStock ? 'Saving...' : 'Save Stock Record'}
                </button>
              </div>

              {/* View All Stock Records button matching st1_d471a4d4.png */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('shipments')}
                  className="w-full py-3 rounded-xl bg-[#3b8754] hover:bg-[#327347] text-white text-xs font-black tracking-wide transition-colors cursor-pointer shadow-sm text-center"
                >
                  View All Stock Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 1: FEED STOCK REPLENISHMENTS --- */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bags Received"
              value={filteredStats.totalBags}
              unit="Bags"
              icon={Package}
              color="indigo"
              badge={{ text: `${filteredStats.count} Shipments`, color: 'indigo' }}
              subtext="Layer Feed Formulations (50kg bags)"
            />

            <StatCard
              title="Total Stock Amount Paid"
              value={`Rs. ${Math.round(filteredStats.totalAmount).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: 'Disbursed', color: 'emerald' }}
              subtext="Total feed invoice disbursements"
            />

            <StatCard
              title="Average Cost per Bag"
              value={`Rs. ${filteredStats.avgCost.toLocaleString()}`}
              icon={Layers}
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
              subtext="Unit 2 consumed 70.8% of bags"
            />
          </div>

          {/* Unit-Wise Quick Filter Cards with authentic figures */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">Unit-Wise Stock Receipts:</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Click any unit to focus feed intake and delivery challans
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('all');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>All Units Combined</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedUnit === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    145 Shipments
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  48,395 <span className="text-[10px] font-normal">Bags</span>
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    selectedUnit === 'all' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  Rs. 282,566,219
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 1');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 1'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 1</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedUnit === 'Unit 1' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    49 Shipments
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  7,840 <span className="text-[10px] font-normal">Bags (16.2%)</span>
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    selectedUnit === 'Unit 1' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  Rs. 46,373,074
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 2');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 2'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 2 (Primary)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedUnit === 'Unit 2' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    67 Shipments
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  34,245 <span className="text-[10px] font-normal">Bags (70.8%)</span>
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    selectedUnit === 'Unit 2' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  Rs. 199,645,042
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUnit('Unit 3');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedUnit === 'Unit 3'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span>Unit 3</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedUnit === 'Unit 3' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    29 Shipments
                  </span>
                </div>
                <div className="text-xs font-black mt-1">
                  6,310 <span className="text-[10px] font-normal">Bags (13.0%)</span>
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    selectedUnit === 'Unit 3' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  Rs. 36,548,103
                </div>
              </button>
            </div>
          </div>

          {/* Unified Date & Month/Year Range Picker Bar */}
          <DateRangePickerBar
            showFarmSelector={false}
            showFlockSelector={false}
            fromDate={fromDate}
            toDate={toDate}
            onDateChange={(from, to) => {
              setFromDate(from);
              setToDate(to);
              setCurrentPage(1);
            }}
            activePreset={preset}
            onPresetChange={handlePresetChange}
            onReset={handleResetFilters}
          />

          {/* Search, Feed Type & Payment Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tracking ID, challan, D.O. #, notes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Feed Type Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeedType('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedFeedType === 'all'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Feeds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeedType('13');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedFeedType === '13'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Feed 13 (Layer)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeedType('11');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedFeedType === '11'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Feed 11 (Grower)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeedType('12');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedFeedType === '12'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Feed 12 (Pre-Lay)
                </button>
              </div>

              {/* Payment Type Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                    selectedPayment === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Payments
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment('CASH');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                    selectedPayment === 'CASH'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment('BANK_TRANSFER');
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                    selectedPayment === 'BANK_TRANSFER'
                      ? 'bg-white text-purple-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>
          </div>

          {/* Table Card for Feed Stock with 10 records per page */}
          <TableCard
            title="Feed Stock & Replenishment Registry"
            subtitle={`Showing shipments ${startIndex + 1} to ${Math.min(startIndex + recordsPerPage, filteredShipments.length)} of ${filteredShipments.length} records (10 per page)`}
            badge={
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('add-stock')}
                  className="px-2.5 py-1 rounded-lg bg-[#3b8754] hover:bg-[#327347] text-white text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Stock</span>
                </button>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                  {filteredShipments.length} Filtered Shipments
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3"># ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Flock / Unit</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Quantity (Bags)</th>
                    <th className="py-3 px-3 text-right">Amount (PKR)</th>
                    <th className="py-3 px-3 text-right">Avg Rate/Bag</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Challan #</th>
                    <th className="py-3 px-3">D.O. / Dispatch Notes</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No feed stock records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedShipments.map((record) => (
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
                            {record.head === 'FEED' ? `Feed ${record.type}` : record.type}
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
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStock(record)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title={`View Stock Record #${record.trackingId}`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditStockModal(record)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title={`Edit Stock Record #${record.trackingId}`}
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {confirmDeleteStockId !== record.id && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStockId(record.id)}
                                className="inline-flex items-center p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                                title={`Delete Stock Record #${record.trackingId}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {confirmDeleteStockId === record.id && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px]">
                              <span className="font-bold text-rose-900">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(record)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStockId(null)}
                                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          )}
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
                <span className="font-bold">{Math.min(startIndex + recordsPerPage, filteredShipments.length)}</span> of{' '}
                <span className="font-bold">{filteredShipments.length}</span> shipments
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

                {/* Jump to Page Form */}
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

      {/* Edit Stock Record Modal */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Edit Stock Record #{editingStock.trackingId}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update shipment date, unit, stock category, quantity, amount, or challan reference
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStock(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStock} noValidate className="mt-4 space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit / Flock</label>
                  <select
                    value={editFlock}
                    onChange={(e) => setEditFlock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold bg-white"
                  >
                    <option value="Unit 1">Unit 1 (Shed 1)</option>
                    <option value="Unit 2">Unit 2 (Shed 2)</option>
                    <option value="Unit 3">Unit 3 (Shed 3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head / Category</label>
                  <select
                    value={editHead}
                    onChange={(e) => setEditHead(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold bg-white"
                  >
                    <option value="FEED">FEED</option>
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="VACCINE">VACCINE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Type</label>
                  <input
                    type="text"
                    required
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    placeholder="e.g. 13, 11, 12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Bags / Units)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={editPaymentType}
                    onChange={(e) => setEditPaymentType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold bg-white"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Challan No</label>
                  <input
                    type="text"
                    value={editChallan}
                    onChange={(e) => setEditChallan(e.target.value)}
                    placeholder="e.g. 1445"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">D.O. / Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-sm cursor-pointer"
                >
                  {isSavingStock ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Stock Record Popup Modal */}
      {viewingStock && (
        <RecordDetailModal
          isOpen={Boolean(viewingStock)}
          onClose={() => setViewingStock(null)}
          title={`Stock Intake Record #${viewingStock.trackingId || viewingStock.id}`}
          subtitle={`${viewingStock.flockName} • ${viewingStock.date}`}
          badge={{ text: `${viewingStock.head} — ${viewingStock.paymentType}`, color: 'indigo' }}
          fields={[
            { label: 'Tracking ID', value: `#${viewingStock.trackingId || viewingStock.id}`, mono: true },
            { label: 'Intake Date', value: viewingStock.date, mono: true },
            { label: 'Unit / Flock', value: viewingStock.flockName },
            { label: 'Head / Category', value: viewingStock.head },
            { label: 'Stock / Feed Type', value: viewingStock.feedType || viewingStock.type },
            { label: 'Challan No', value: viewingStock.challanNo ? `CH-${viewingStock.challanNo}` : '—', mono: true },
            {
              label: 'Quantity Received',
              value: `${viewingStock.quantity.toLocaleString()} ${
                viewingStock.head === 'FEED' ? 'bags' : 'units'
              }`,
              mono: true,
            },
            {
              label: 'Rate Per Bag / Unit',
              value: `Rs. ${(viewingStock.costPerBag || 0).toLocaleString()}`,
              mono: true,
            },
            {
              label: 'Total Amount Paid',
              value: `Rs. ${viewingStock.amount.toLocaleString()}`,
              mono: true,
              highlight: true,
            },
            { label: 'Payment Method', value: viewingStock.paymentType },
          ]}
          notes={viewingStock.notes}
          onEdit={() => openEditStockModal(viewingStock)}
          onDelete={() => handleDeleteStock(viewingStock)}
        />
      )}
    </div>
  );
};
