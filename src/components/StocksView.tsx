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
  FileText,
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
  Wheat,
  Pill,
  Syringe,
  Wrench,
} from 'lucide-react';
import { InventoryItem, FinancialRecord } from '../types/farm.ts';
import { StatCard, PageHeader, UIButton, TableCard, DateRangePickerBar, DatePreset, RecordDetailModal } from './ui';
import { liveStockRecords, StockRecord } from '../data/liveStocks.ts';
import { getInitialUrlFilters } from '../utils/urlFilters.ts';
import { apiFetch } from '../services/api.ts';
import { downloadRecordsCSV, downloadRecordsPDF } from '../utils/exportRecords.ts';

const STOCK_HEADS = ['FEED', 'MEDICINE', 'VACCINE', 'EQUIPMENT', 'OTHER'] as const;
type StockHead = (typeof STOCK_HEADS)[number];

const STOCK_HEAD_META: Record<
  StockHead,
  { label: string; shortLabel: string; unitLabel: string; icon: typeof Wheat; badgeColor: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' }
> = {
  FEED: { label: 'Feed', shortLabel: 'FEED', unitLabel: 'bags', icon: Wheat, badgeColor: 'indigo' },
  MEDICINE: { label: 'Medicine', shortLabel: 'Medicine', unitLabel: 'units', icon: Pill, badgeColor: 'emerald' },
  VACCINE: { label: 'Vaccine', shortLabel: 'Vaccine', unitLabel: 'units', icon: Syringe, badgeColor: 'blue' },
  EQUIPMENT: { label: 'Equipment', shortLabel: 'Equipment', unitLabel: 'units', icon: Wrench, badgeColor: 'amber' },
  OTHER: { label: 'Others', shortLabel: 'Others', unitLabel: 'units', icon: Package, badgeColor: 'rose' },
};

const normalizeStockHead = (rawHead?: string): StockHead => {
  const h = String(rawHead || 'FEED').trim().toUpperCase();
  if (h.includes('FEED')) return 'FEED';
  if (h.includes('MED')) return 'MEDICINE';
  if (h.includes('VAC')) return 'VACCINE';
  if (h.includes('EQUIP')) return 'EQUIPMENT';
  return 'OTHER';
};

const getStockUnit = (r: Pick<StockRecord, 'flockName' | 'flockId'>): 'Unit 1' | 'Unit 2' | 'Unit 3' => {
  const fname = String(r.flockName || '').toLowerCase();
  const fid = String(r.flockId || '');
  if (fname.includes('unit 2') || fid === '9') return 'Unit 2';
  if (fname.includes('unit 3') || fid === '10') return 'Unit 3';
  return 'Unit 1';
};

interface StocksViewProps {
  inventory?: InventoryItem[];
  onRestock?: (id: string, amount: number) => void;
  onAddTransaction?: (record: FinancialRecord) => Promise<void> | void;
  onStockExpenseSynced?: (
    action: 'create' | 'update' | 'delete',
    syncedExpense?: FinancialRecord,
    deletedExpenseId?: number | string | null,
    deletedExpenseClientId?: string | null
  ) => void;
  initialFocus?: { head?: string; unit?: string } | null;
  onClearInitialFocus?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canViewFinancials?: boolean;
}

export const StocksView: React.FC<StocksViewProps> = ({
  onAddTransaction,
  onStockExpenseSynced,
  initialFocus,
  onClearInitialFocus,
  canEdit = true,
  canDelete = true,
  canViewFinancials = true,
}) => {
  const initialUrlFilters = useMemo(() => getInitialUrlFilters(), []);
  const [activeTab, setActiveTab] = useState<'shipments' | 'add-stock'>('shipments');
  const [selectedUnit, setSelectedUnit] = useState<string>(() => initialUrlFilters.unit);
  const [selectedHead, setSelectedHead] = useState<'all' | StockHead>(() => {
    const raw = (initialUrlFilters.head || '').trim().toUpperCase();
    return STOCK_HEADS.includes(raw as StockHead) ? (raw as StockHead) : 'all';
  });
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
    const stripFin = (list: StockRecord[]) =>
      canViewFinancials
        ? list
        : list.map((r) => ({ ...r, amount: 0, costPerBag: 0, paymentType: 'N/A' }));
    const saved = localStorage.getItem('greenova_stocks_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return stripFin(parsed);
      } catch (e) {}
    }
    return stripFin(liveStockRecords);
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

  // Apply incoming navigation focus (e.g., "Go to Stocks" from Expenses guard popup)
  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus.head) {
      const normalized = normalizeStockHead(initialFocus.head);
      setSelectedHead(normalized);
      setSelectedFeedType('all');
    }
    if (initialFocus.unit) {
      setSelectedUnit(initialFocus.unit);
    }
    setActiveTab('shipments');
    setCurrentPage(1);
    onClearInitialFocus?.();
  }, [initialFocus, onClearInitialFocus]);

  const mapSyncedExpenseToFinancial = (rawExp: any, fallbackStock: StockRecord): FinancialRecord => {
    const fid = Number(rawExp?.flockId ?? fallbackStock.flockId) || 8;
    const rawDate = rawExp?.expenseDate || rawExp?.date || fallbackStock.date;
    const dateStr = String(rawDate || '').slice(0, 10);
    const challan = String(rawExp?.challanNo ?? fallbackStock.challanNo ?? '');
    return {
      id: rawExp?.clientId || `exp-${rawExp?.id}`,
      trackingId: Number(rawExp?.id) || undefined,
      type: 'Expense',
      category: rawExp?.head || fallbackStock.head,
      head: rawExp?.head || fallbackStock.head,
      amount: Number(rawExp?.expenseCost ?? rawExp?.amount ?? fallbackStock.amount ?? 0),
      expenseCost: Number(rawExp?.expenseCost ?? rawExp?.amount ?? fallbackStock.amount ?? 0),
      date: dateStr,
      rawDate: dateStr,
      referenceNo: challan ? `CH-${challan}` : `EXP-${rawExp?.id || fallbackStock.trackingId}`,
      challanNo: challan,
      flockId: fid,
      flockName:
        rawExp?.flock?.flockName ||
        fallbackStock.flockName ||
        (fid === 9 ? 'Unit 2' : fid === 10 ? 'Unit 3' : 'Unit 1'),
      description: rawExp?.notes || rawExp?.description || fallbackStock.notes || fallbackStock.head,
      notes: rawExp?.notes || fallbackStock.notes || '',
      status: 'Paid',
      attachment: rawExp?.attachment ?? fallbackStock.attachment ?? null,
      isStockLinked: true,
      linkedStockId: fallbackStock.trackingId || fallbackStock.id,
      linkedStockHead: fallbackStock.head,
      linkedStockType: fallbackStock.type,
      linkedStockQuantity: fallbackStock.quantity,
    };
  };

  // Hydrate live Stock records from PostgreSQL on mount
  useEffect(() => {
    let active = true;
    apiFetch('/api/stocks?limit=2000')
      .then((res) => {
        const items = res?.data?.items;
        if (!active || !Array.isArray(items)) return;
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
            amount: canViewFinancials ? Number(r.amountPaid ?? r.amount ?? 0) : 0,
            costPerBag: canViewFinancials ? Number(r.costPerBag || 0) : 0,
            paymentType: canViewFinancials ? String(r.paymentType || 'CASH') : 'N/A',
            challanNo: String(r.challanNo || ''),
            notes: String(r.notes || ''),
            expenseId: Number(r.expenseId || 0) || undefined,
            attachment: r.attachment || null,
          };
        });
        setAllStockRecords(mapped);
        if (canViewFinancials) {
          try {
            localStorage.setItem('greenova_stocks_v2', JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canViewFinancials]);

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
      const res = await apiFetch(`/api/stocks/${resolvedId}`, {
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
          expenseId: updatedRecord.expenseId,
          notes: updatedRecord.notes,
        }),
      });

      const finalUpdatedRecord: StockRecord = {
        ...updatedRecord,
        expenseId: Number(res?.data?.expenseId || updatedRecord.expenseId || 0) || undefined,
      };

      const nextList = allStockRecords.map((r) =>
        r.id === finalUpdatedRecord.id ? finalUpdatedRecord : r
      );
      setAllStockRecords(nextList);
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(nextList));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      if (res?.data?.syncedExpense && onStockExpenseSynced) {
        onStockExpenseSynced(
          'update',
          mapSyncedExpenseToFinancial(res.data.syncedExpense, finalUpdatedRecord)
        );
      }

      setEditingStock(null);
      setToastMessage(
        `Stock record #${finalUpdatedRecord.trackingId} & linked expense updated.`
      );
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
      const res = await apiFetch(`/api/stocks/${resolvedId}`, { method: 'DELETE' });
      const nextList = allStockRecords.filter((r) => String(r.id) !== String(record.id));
      setAllStockRecords(nextList);
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(nextList));
      } catch {}
      if (onStockExpenseSynced) {
        onStockExpenseSynced(
          'delete',
          undefined,
          res?.data?.deletedExpenseId ?? record.expenseId ?? null,
          res?.data?.deletedExpenseClientId ?? null
        );
      }
      setConfirmDeleteStockId(null);
      setToastMessage(
        `Stock record #${record.trackingId} & linked expense deleted from database.`
      );
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
    if (canViewFinancials) {
      if (!formAmount || Number(formAmount) <= 0) {
        setFormError('Please enter a valid Amount (PKR) greater than 0.');
        return;
      }
      if (!formPaymentType) {
        setFormError('Please select a payment type.');
        return;
      }
    }
    if (!formChallan.trim()) {
      setFormError('Please enter a challan number.');
      return;
    }
    setIsSavingStock(true);

    const qty = Number(formQuantity) || 0;
    const amt = canViewFinancials ? Number(formAmount) || 0 : 0;
    const costBag = canViewFinancials && qty > 0 ? Math.round(amt / qty) : 0;
    const paymentLabel = canViewFinancials ? formPaymentType.toUpperCase() : 'N/A';
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
          paymentType: paymentLabel,
          notes: formNotes,
          attachment: attachmentData || attachmentName || null,
        }),
      });

      const canonicalId = Number(res?.data?.id) || maxTracking + 1;
      const canonicalExpenseId = Number(res?.data?.expenseId || 0) || undefined;

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
        paymentType: paymentLabel,
        challanNo: formChallan.trim(),
        notes: formNotes || `${qty} ${formHead === 'FEED' ? 'bags' : 'units'} of ${formStockType} received...`,
        expenseId: canonicalExpenseId,
        attachment: attachmentData || null,
      };

      const updated = [newRecord, ...allStockRecords];
      setAllStockRecords(updated);
      if (canViewFinancials) {
        try {
          localStorage.setItem('greenova_stocks_v2', JSON.stringify(updated));
        } catch (err) {
          console.warn('LocalStorage error:', err);
        }
      }

      // Sync corresponding Farm Expense state (already persisted atomically in DB via POST /api/stocks)
      if (canViewFinancials) {
        if (res?.data?.syncedExpense && onStockExpenseSynced) {
          onStockExpenseSynced(
            'create',
            mapSyncedExpenseToFinancial(res.data.syncedExpense, newRecord)
          );
        } else if (onAddTransaction && !onStockExpenseSynced) {
          const expenseRecord: FinancialRecord = {
            id: `exp-stk-${Date.now()}`,
            type: 'Expense',
            category: formHead,
            head: formHead,
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
            isStockLinked: true,
            linkedStockId: newRecord.trackingId,
            linkedStockHead: formHead,
            linkedStockType: formStockType,
            linkedStockQuantity: qty,
          };
          await onAddTransaction(expenseRecord);
        }
      }

      const savedHead = normalizeStockHead(formHead);
      handleResetForm();
      setSelectedHead(savedHead);
      setSelectedFeedType('all');
      setActiveTab('shipments');
      setCurrentPage(1);
      setToastMessage(
        canViewFinancials
          ? `Stock #${newRecord.trackingId} (${STOCK_HEAD_META[savedHead].label}) saved & synchronized with Farm Expenses!`
          : `Stock #${newRecord.trackingId} (${STOCK_HEAD_META[savedHead].label}) saved to database.`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save stock record to database.');
    } finally {
      setIsSavingStock(false);
    }
  };

  // Date-filtered records across all units & heads (base for Head Matrix & Unit-Wise Matrix)
  const dateFilteredRecords = useMemo(() => {
    return allStockRecords.filter((record) => {
      const recDate = (record.date || '').slice(0, 10);
      return (!fromDate || recDate >= fromDate) && (!toDate || recDate <= toDate);
    });
  }, [allStockRecords, fromDate, toDate]);

  // Summary per Stock Head (respecting selectedUnit and date filters)
  const headSummaryStats = useMemo(() => {
    const unitScoped = dateFilteredRecords.filter((record) => {
      const unit = getStockUnit(record);
      return selectedUnit === 'all' || unit.toLowerCase() === selectedUnit.toLowerCase();
    });

    const totalAllAmount = unitScoped.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalAllQty = unitScoped.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

    const byHead = STOCK_HEADS.map((head) => {
      const recs = unitScoped.filter((r) => normalizeStockHead(r.head) === head);
      const count = recs.length;
      const qty = recs.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
      const amount = recs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const unit1 = recs.filter((r) => getStockUnit(r) === 'Unit 1');
      const unit2 = recs.filter((r) => getStockUnit(r) === 'Unit 2');
      const unit3 = recs.filter((r) => getStockUnit(r) === 'Unit 3');
      return {
        head,
        count,
        qty,
        amount,
        sharePct: totalAllAmount > 0 ? Number(((amount / totalAllAmount) * 100).toFixed(1)) : 0,
        units: {
          'Unit 1': {
            count: unit1.length,
            qty: unit1.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
            amount: unit1.reduce((s, r) => s + (Number(r.amount) || 0), 0),
          },
          'Unit 2': {
            count: unit2.length,
            qty: unit2.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
            amount: unit2.reduce((s, r) => s + (Number(r.amount) || 0), 0),
          },
          'Unit 3': {
            count: unit3.length,
            qty: unit3.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
            amount: unit3.reduce((s, r) => s + (Number(r.amount) || 0), 0),
          },
        },
      };
    });

    return {
      all: {
        count: unitScoped.length,
        qty: totalAllQty,
        amount: totalAllAmount,
      },
      byHead,
    };
  }, [dateFilteredRecords, selectedUnit]);

  // Full 5-head x 3-unit Matrix (always shows all 3 units across current date range for comparison)
  const unitWiseHeadMatrix = useMemo(() => {
    const rows = STOCK_HEADS.map((head) => {
      const recs = dateFilteredRecords.filter((r) => normalizeStockHead(r.head) === head);
      const calcUnit = (unitName: 'Unit 1' | 'Unit 2' | 'Unit 3') => {
        const uRecs = recs.filter((r) => getStockUnit(r) === unitName);
        return {
          count: uRecs.length,
          qty: uRecs.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
          amount: uRecs.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        };
      };
      return {
        head,
        unit1: calcUnit('Unit 1'),
        unit2: calcUnit('Unit 2'),
        unit3: calcUnit('Unit 3'),
        total: {
          count: recs.length,
          qty: recs.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
          amount: recs.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        },
      };
    });

    const grandUnit = (unitName: 'Unit 1' | 'Unit 2' | 'Unit 3') => {
      const uRecs = dateFilteredRecords.filter((r) => getStockUnit(r) === unitName);
      return {
        count: uRecs.length,
        qty: uRecs.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
        amount: uRecs.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      };
    };

    return {
      rows,
      totals: {
        unit1: grandUnit('Unit 1'),
        unit2: grandUnit('Unit 2'),
        unit3: grandUnit('Unit 3'),
        all: {
          count: dateFilteredRecords.length,
          qty: dateFilteredRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
          amount: dateFilteredRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        },
      },
    };
  }, [dateFilteredRecords]);

  // Dynamic Unit-Wise cards reactive to selectedHead and date range
  const unitCardsStats = useMemo(() => {
    const headFiltered =
      selectedHead === 'all'
        ? dateFilteredRecords
        : dateFilteredRecords.filter((r) => normalizeStockHead(r.head) === selectedHead);

    const calc = (recs: StockRecord[], totalQtyAll: number) => {
      const qty = recs.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
      const amount = recs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const pct = totalQtyAll > 0 ? ((qty / totalQtyAll) * 100).toFixed(1) : '0.0';
      return { count: recs.length, qty, amount, pct };
    };

    const totalQtyAll = headFiltered.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    const u1 = calc(headFiltered.filter((r) => getStockUnit(r) === 'Unit 1'), totalQtyAll);
    const u2 = calc(headFiltered.filter((r) => getStockUnit(r) === 'Unit 2'), totalQtyAll);
    const u3 = calc(headFiltered.filter((r) => getStockUnit(r) === 'Unit 3'), totalQtyAll);
    const all = calc(headFiltered, totalQtyAll);

    const unitShares = [
      { name: 'Unit 1', qty: u1.qty, pct: u1.pct },
      { name: 'Unit 2', qty: u2.qty, pct: u2.pct },
      { name: 'Unit 3', qty: u3.qty, pct: u3.pct },
    ].sort((a, b) => b.qty - a.qty);

    const activeUnitsCount = [u1, u2, u3].filter((u) => u.count > 0).length;

    return {
      all,
      unit1: u1,
      unit2: u2,
      unit3: u3,
      topUnit: unitShares[0],
      activeUnitsCount,
    };
  }, [dateFilteredRecords, selectedHead]);

  // Sub-type options for active Stock Head
  const availableSubTypes = useMemo(() => {
    if (selectedHead === 'FEED') {
      return [
        { value: '13', label: 'Feed 13 (Layer)' },
        { value: '11', label: 'Feed 11 (Grower)' },
        { value: '12', label: 'Feed 12 (Pre-Lay)' },
        { value: '14', label: 'Feed 14' },
      ];
    }
    if (selectedHead === 'all') {
      return [
        { value: '13', label: 'Feed 13 (Layer)' },
        { value: '11', label: 'Feed 11 (Grower)' },
        { value: '12', label: 'Feed 12 (Pre-Lay)' },
      ];
    }
    const matching = allStockRecords.filter((r) => normalizeStockHead(r.head) === selectedHead);
    const distinct = Array.from(new Set(matching.map((r) => String(r.type || '').trim()).filter(Boolean)));
    return distinct.map((t) => ({ value: t, label: t }));
  }, [allStockRecords, selectedHead]);

  // Filtered stock shipments from authentic records
  const filteredShipments = useMemo(() => {
    return allStockRecords.filter((record) => {
      const unitMatch =
        selectedUnit === 'all' ||
        getStockUnit(record).toLowerCase() === selectedUnit.toLowerCase();

      const headMatch =
        selectedHead === 'all' || normalizeStockHead(record.head) === selectedHead;

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
        record.head.toLowerCase().includes(q) ||
        record.type.toLowerCase().includes(q) ||
        record.challanNo.toLowerCase().includes(q) ||
        record.notes.toLowerCase().includes(q) ||
        record.feedType.toLowerCase().includes(q);

      return unitMatch && headMatch && feedTypeMatch && paymentMatch && dateMatch && searchMatch;
    });
  }, [allStockRecords, selectedUnit, selectedHead, selectedFeedType, selectedPayment, fromDate, toDate, searchQuery]);

  // Aggregated stats of filtered shipments
  const filteredStats = useMemo(() => {
    const totalBags = filteredShipments.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const totalAmount = filteredShipments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
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
    setSelectedHead('all');
    setSelectedFeedType('all');
    setSelectedPayment('all');
    setFromDate('');
    setToDate('');
    setPreset('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const openAddStockTab = (headOverride?: 'all' | StockHead) => {
    const targetHead =
      headOverride && headOverride !== 'all'
        ? headOverride
        : selectedHead !== 'all'
        ? selectedHead
        : undefined;
    if (targetHead) {
      handleHeadChange(targetHead);
    }
    if (selectedUnit !== 'all') {
      setFormFlock(selectedUnit);
    } else {
      setFormFlock('');
    }
    setActiveTab('add-stock');
  };

  const getStockExportPayload = () => {
    const unitLabel = selectedUnit === 'all' ? 'All Units' : selectedUnit;
    const headLabel = selectedHead === 'all' ? 'All Heads' : STOCK_HEAD_META[selectedHead].label;
    const qtyColLabel = selectedHead === 'FEED' ? 'Qty (Bags)' : selectedHead === 'all' ? 'Qty (Bags/Units)' : 'Qty (Units)';
    const rateColLabel = selectedHead === 'FEED' ? 'Rate / Bag' : 'Rate / Unit';
    const rangeLabel =
      fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || 'Latest'}` : 'All Dates';
    const todayStamp = new Date().toISOString().split('T')[0];

    const columns = [
      { header: 'ID', align: 'left' as const },
      { header: 'Date', align: 'left' as const },
      { header: 'Unit / Flock', align: 'left' as const },
      { header: 'Category', align: 'left' as const },
      { header: 'Item / Stock Type', align: 'left' as const },
      { header: qtyColLabel, align: 'right' as const },
      ...(canViewFinancials
        ? [
            { header: rateColLabel, align: 'right' as const },
            { header: 'Amount (PKR)', align: 'right' as const },
            { header: 'Payment', align: 'center' as const },
          ]
        : []),
      { header: 'Challan #', align: 'left' as const },
      { header: 'Notes', align: 'left' as const },
    ];

    let sumQty = 0;
    let sumAmt = 0;

    const pdfRows = filteredShipments.map((r) => {
      const qty = Number(r.quantity || 0);
      const amt = Number(r.amount || 0);
      sumQty += qty;
      sumAmt += amt;
      return [
        `#${r.trackingId}`,
        r.rawDate || r.date,
        r.flockName,
        r.head,
        r.head === 'FEED' ? `Feed ${r.type}` : r.type || r.feedType,
        qty.toLocaleString(),
        ...(canViewFinancials
          ? [
              (r.costPerBag || 0).toLocaleString(),
              amt.toLocaleString(),
              r.paymentType || '-',
            ]
          : []),
        r.challanNo ? `CH-${r.challanNo}` : '-',
        r.notes || '-',
      ];
    });

    const csvRows = filteredShipments.map((r) => [
      r.trackingId,
      r.rawDate || r.date,
      r.flockName,
      r.head,
      r.head === 'FEED' ? `Feed ${r.type}` : r.type || r.feedType,
      Number(r.quantity || 0),
      ...(canViewFinancials
        ? [
            Number(r.costPerBag || 0),
            Number(r.amount || 0),
            r.paymentType || '',
          ]
        : []),
      r.challanNo || '',
      r.notes || '',
    ]);

    const totalsRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      sumQty.toLocaleString(),
      ...(canViewFinancials ? ['', sumAmt.toLocaleString(), ''] : []),
      '',
      '',
    ];

    return {
      title: `Stock Inventory Records (${headLabel})`,
      subtitle: `Head: ${headLabel}  |  Unit: ${unitLabel}  |  Range: ${rangeLabel}`,
      filenameBase: `GreenOva_Stock_${headLabel.replace(/\s+/g, '_')}_${unitLabel}_${todayStamp}`,
      columns,
      rows: pdfRows,
      csvRows,
      totalsRow,
      orientation: 'landscape' as const,
    };
  };

  const handleExportCSV = () => {
    if (filteredShipments.length === 0) return;
    downloadRecordsCSV(getStockExportPayload());
  };

  const handleExportPDF = () => {
    if (filteredShipments.length === 0) return;
    downloadRecordsPDF(getStockExportPayload());
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
          <div className="flex flex-wrap items-center gap-2">
            <UIButton
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
              disabled={filteredShipments.length === 0}
            >
              Export CSV ({filteredShipments.length})
            </UIButton>
            <UIButton
              variant="secondary"
              icon={FileText}
              onClick={handleExportPDF}
              disabled={filteredShipments.length === 0}
            >
              Download PDF ({filteredShipments.length})
            </UIButton>
            <UIButton
              variant="primary"
              icon={Plus}
              onClick={() => openAddStockTab()}
            >
              + Add Stock Record
            </UIButton>
          </div>
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
                {canViewFinancials
                  ? 'Enter the stock purchase or payment details below'
                  : 'Enter the unit stock intake details below'}
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

              {/* Row 3 & 4: Quantity, Challan, and optional Financial Amount & Payment Type */}
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

                {canViewFinancials ? (
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
                ) : (
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
                )}
              </div>

              {canViewFinancials && (
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
              )}

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

      {/* --- TAB 1: UNIT STOCK REPLENISHMENTS ACROSS 5 HEADS --- */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* 5 Stock Heads Selector Cards (All, FEED, MEDICINE, VACCINE, EQUIPMENT, OTHER) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Stock Categories (5 Heads){selectedUnit !== 'all' ? ` — ${selectedUnit}` : ' — All Units'}:
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Select a category to view its unit-wise matrix &amp; stock records
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedHead('all');
                  setSelectedFeedType('all');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedHead === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>All Heads</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedHead === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {headSummaryStats.all.count}
                  </span>
                </div>
                <div className="text-xs font-black mt-1.5 font-mono">
                  {headSummaryStats.all.qty.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal">items</span>
                </div>
                {canViewFinancials && (
                  <div
                    className={`text-[11px] font-semibold mt-0.5 font-mono ${
                      selectedHead === 'all' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Rs. {Math.round(headSummaryStats.all.amount).toLocaleString()}
                  </div>
                )}
              </button>

              {headSummaryStats.byHead.map((item) => {
                const meta = STOCK_HEAD_META[item.head];
                const IconComp = meta.icon;
                const isSelected = selectedHead === item.head;
                return (
                  <button
                    key={item.head}
                    type="button"
                    onClick={() => {
                      setSelectedHead(item.head);
                      setSelectedFeedType('all');
                      setCurrentPage(1);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{meta.shortLabel}</span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1.5 font-mono">
                      {item.qty.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal">{meta.unitLabel}</span>
                    </div>
                    {canViewFinancials && (
                      <div
                        className={`text-[11px] font-semibold mt-0.5 font-mono ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        Rs. {Math.round(item.amount).toLocaleString()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Stat Cards (Adaptive to Selected Head & Unit) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
            <StatCard
              title={
                selectedHead === 'FEED'
                  ? 'Total Bags Received'
                  : selectedHead === 'all'
                  ? 'Total Stock Received'
                  : `${STOCK_HEAD_META[selectedHead].label} Stock Received`
              }
              value={filteredStats.totalBags}
              unit={selectedHead === 'FEED' ? 'Bags' : selectedHead === 'all' ? 'Items' : 'Units'}
              icon={selectedHead === 'all' ? Package : STOCK_HEAD_META[selectedHead].icon}
              color="indigo"
              badge={{ text: `${filteredStats.count} Shipments`, color: 'indigo' }}
              subtext={
                selectedHead === 'FEED'
                  ? 'Layer Feed Formulations (50kg bags)'
                  : selectedHead === 'all'
                  ? 'All 5 stock categories combined'
                  : `${STOCK_HEAD_META[selectedHead].label} stock entries in filter`
              }
            />

            {canViewFinancials && (
              <StatCard
                title="Total Stock Amount Paid"
                value={`Rs. ${Math.round(filteredStats.totalAmount).toLocaleString()}`}
                icon={DollarSign}
                color="emerald"
                valueColor="text-emerald-700"
                badge={{ text: 'Disbursed', color: 'emerald' }}
                subtext={
                  selectedHead === 'all'
                    ? 'All stock invoice disbursements'
                    : `${STOCK_HEAD_META[selectedHead].label} invoice disbursements`
                }
              />
            )}

            {canViewFinancials && (
              <StatCard
                title={selectedHead === 'FEED' ? 'Average Expense per Bag' : 'Average Expense per Unit'}
                value={`Rs. ${filteredStats.avgCost.toLocaleString()}`}
                icon={Layers}
                color="blue"
                badge={{
                  text:
                    selectedHead === 'FEED' && filteredStats.avgCost > 0
                      ? `~Rs. ${Math.round(filteredStats.avgCost / 50)} / kg`
                      : selectedHead === 'all'
                      ? 'All Categories'
                      : STOCK_HEAD_META[selectedHead].shortLabel,
                  color: 'blue',
                }}
                subtext="Weighted average procurement expense"
              />
            )}

            <StatCard
              title="Active Stock Units"
              value={`${unitCardsStats.activeUnitsCount} ${unitCardsStats.activeUnitsCount === 1 ? 'Shed' : 'Sheds'}`}
              icon={Building2}
              color="amber"
              badge={{ text: selectedUnit === 'all' ? 'Units 1, 2, 3' : selectedUnit, color: 'amber' }}
              subtext={
                unitCardsStats.topUnit && unitCardsStats.all.qty > 0
                  ? `${unitCardsStats.topUnit.name} holds ${unitCardsStats.topUnit.pct}% of stock qty`
                  : 'No stock recorded for selected category'
              }
            />
          </div>

          {/* Dynamic Unit-Wise Quick Filter Cards (Reactive to Selected Stock Head & Date Range) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">
                  Unit-Wise Stock Receipts ({selectedHead === 'all' ? 'All 5 Heads' : STOCK_HEAD_META[selectedHead].label}):
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Click any unit to focus{' '}
                {selectedHead === 'all' ? 'stock intake' : STOCK_HEAD_META[selectedHead].label.toLowerCase()} and delivery challans
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  { key: 'all', title: 'All Units Combined', data: unitCardsStats.all, showPct: false },
                  { key: 'Unit 1', title: 'Unit 1', data: unitCardsStats.unit1, showPct: true },
                  { key: 'Unit 2', title: 'Unit 2', data: unitCardsStats.unit2, showPct: true },
                  { key: 'Unit 3', title: 'Unit 3', data: unitCardsStats.unit3, showPct: true },
                ] as const
              ).map((card) => {
                const isSel = selectedUnit === card.key;
                const qtyUnitText =
                  selectedHead === 'FEED'
                    ? 'Bags'
                    : selectedHead === 'all'
                    ? 'Items'
                    : 'Units';
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(card.key);
                      setCurrentPage(1);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span>{card.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSel ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {card.data.count} {card.data.count === 1 ? 'Entry' : 'Entries'}
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1 font-mono">
                      {card.data.qty.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal">
                        {qtyUnitText}
                        {card.showPct ? ` (${card.data.pct}%)` : ''}
                      </span>
                    </div>
                    {canViewFinancials && (
                      <div
                        className={`text-[11px] font-semibold mt-0.5 font-mono ${
                          isSel ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        Rs. {Math.round(card.data.amount).toLocaleString()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit-Wise 5-Head Stock Matrix (FEED, MEDICINE, VACCINE, EQUIPMENT, OTHER across Unit 1, 2, 3) */}
          <TableCard
            title="Unit-Wise Stock Matrix (All 5 Heads)"
            subtitle="Click any category row or unit cell to filter the stock ledger below"
            badge={
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold">
                5 Categories × 3 Units
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Stock Head</th>
                    <th className="py-2.5 px-3 text-right">Unit 1</th>
                    <th className="py-2.5 px-3 text-right">Unit 2</th>
                    <th className="py-2.5 px-3 text-right">Unit 3</th>
                    <th className="py-2.5 px-3.5 text-right bg-slate-100/80">All Units Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitWiseHeadMatrix.rows.map((row) => {
                    const meta = STOCK_HEAD_META[row.head];
                    const IconComp = meta.icon;
                    const isRowSelected = selectedHead === row.head;
                    return (
                      <tr
                        key={row.head}
                        className={`transition-colors ${
                          isRowSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHead(row.head);
                              setSelectedUnit('all');
                              setSelectedFeedType('all');
                              setCurrentPage(1);
                            }}
                            className="flex items-center gap-2 font-bold text-slate-900 hover:text-indigo-700 cursor-pointer"
                          >
                            <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{meta.label}</span>
                            <span className="text-[10px] font-mono text-slate-400">({row.total.count})</span>
                          </button>
                        </td>
                        {(
                          [
                            { name: 'Unit 1', cell: row.unit1 },
                            { name: 'Unit 2', cell: row.unit2 },
                            { name: 'Unit 3', cell: row.unit3 },
                          ] as const
                        ).map((u) => {
                          const isCellSel = selectedHead === row.head && selectedUnit === u.name;
                          return (
                            <td key={u.name} className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedHead(row.head);
                                  setSelectedUnit(u.name);
                                  setSelectedFeedType('all');
                                  setCurrentPage(1);
                                }}
                                className={`inline-block text-right rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                                  isCellSel
                                    ? 'bg-indigo-600 text-white'
                                    : 'hover:bg-indigo-50 text-slate-700'
                                }`}
                              >
                                <div className="font-mono font-bold">
                                  {u.cell.qty.toLocaleString()} {meta.unitLabel}
                                </div>
                                {canViewFinancials && (
                                  <div
                                    className={`text-[10px] font-mono ${
                                      isCellSel ? 'text-indigo-100' : 'text-slate-500'
                                    }`}
                                  >
                                    Rs. {Math.round(u.cell.amount).toLocaleString()}
                                  </div>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3.5 text-right bg-slate-50/70">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHead(row.head);
                              setSelectedUnit('all');
                              setSelectedFeedType('all');
                              setCurrentPage(1);
                            }}
                            className="text-right cursor-pointer hover:text-indigo-700"
                          >
                            <div className="font-mono font-black text-slate-900">
                              {row.total.qty.toLocaleString()} {meta.unitLabel}
                            </div>
                            {canViewFinancials && (
                              <div className="text-[10px] font-mono font-semibold text-emerald-700">
                                Rs. {Math.round(row.total.amount).toLocaleString()}
                              </div>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white text-[11px] font-bold">
                  <tr>
                    <td className="py-2.5 px-3.5">All 5 Heads Total</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {canViewFinancials
                        ? `Rs. ${Math.round(unitWiseHeadMatrix.totals.unit1.amount).toLocaleString()}`
                        : `${unitWiseHeadMatrix.totals.unit1.qty.toLocaleString()} items`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {canViewFinancials
                        ? `Rs. ${Math.round(unitWiseHeadMatrix.totals.unit2.amount).toLocaleString()}`
                        : `${unitWiseHeadMatrix.totals.unit2.qty.toLocaleString()} items`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {canViewFinancials
                        ? `Rs. ${Math.round(unitWiseHeadMatrix.totals.unit3.amount).toLocaleString()}`
                        : `${unitWiseHeadMatrix.totals.unit3.qty.toLocaleString()} items`}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-emerald-300">
                      {canViewFinancials
                        ? `Rs. ${Math.round(unitWiseHeadMatrix.totals.all.amount).toLocaleString()}`
                        : `${unitWiseHeadMatrix.totals.all.qty.toLocaleString()} items`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TableCard>

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

          {/* Search, Sub-Type & Payment Filters Bar */}
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

              {/* Adaptive Item / Feed Type Sub-Filter */}
              {availableSubTypes.length > 0 && (
                <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-xs">
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
                    {selectedHead === 'FEED'
                      ? 'All Feeds'
                      : selectedHead === 'all'
                      ? 'All Types'
                      : `All ${STOCK_HEAD_META[selectedHead].label}`}
                  </button>
                  {availableSubTypes.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedFeedType(opt.value);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        selectedFeedType === opt.value
                          ? 'bg-white text-indigo-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Payment Type Filter */}
              {canViewFinancials && (
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
              )}
            </div>
          </div>

          {/* Table Card for Stock Registry with 10 records per page */}
          <TableCard
            title={`${
              selectedHead === 'all' ? 'All Stock' : STOCK_HEAD_META[selectedHead].label + ' Stock'
            } & Replenishment Registry`}
            subtitle={
              filteredShipments.length === 0
                ? `No ${selectedHead === 'all' ? 'stock' : STOCK_HEAD_META[selectedHead].label.toLowerCase()} records found for ${selectedUnit === 'all' ? 'all units' : selectedUnit}`
                : `Showing shipments ${startIndex + 1} to ${Math.min(startIndex + recordsPerPage, filteredShipments.length)} of ${filteredShipments.length} records (10 per page)`
            }
            badge={
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openAddStockTab()}
                  className="px-2.5 py-1 rounded-lg bg-[#3b8754] hover:bg-[#327347] text-white text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    + Add {selectedHead === 'all' ? 'New' : STOCK_HEAD_META[selectedHead].label} Stock
                  </span>
                </button>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                  {filteredShipments.length} Filtered Entries
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
                    <th className="py-3 px-3 text-right">
                      {selectedHead === 'FEED'
                        ? 'Quantity (Bags)'
                        : selectedHead === 'all'
                        ? 'Quantity'
                        : 'Quantity (Units)'}
                    </th>
                    {canViewFinancials && <th className="py-3 px-3 text-right">Amount (PKR)</th>}
                    {canViewFinancials && (
                      <th className="py-3 px-3 text-right">
                        {selectedHead === 'FEED' ? 'Avg Rate/Bag' : 'Avg Rate/Unit'}
                      </th>
                    )}
                    {canViewFinancials && <th className="py-3 px-3">Payment</th>}
                    <th className="py-3 px-3">Challan #</th>
                    <th className="py-3 px-3">Dispatch / Store Notes</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={canViewFinancials ? 12 : 9} className="py-10 text-center text-slate-500">
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-700">
                            No {selectedHead === 'all' ? '' : STOCK_HEAD_META[selectedHead].label.toLowerCase() + ' '}stock records match the selected filters
                            {selectedUnit !== 'all' ? ` for ${selectedUnit}` : ''}.
                          </p>
                          <button
                            type="button"
                            onClick={() => openAddStockTab()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b8754] hover:bg-[#327347] text-white text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              Add {selectedHead === 'all' ? 'Stock' : STOCK_HEAD_META[selectedHead].label} Record
                              {selectedUnit !== 'all' ? ` for ${selectedUnit}` : ''}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedShipments.map((record) => {
                      const normHead = normalizeStockHead(record.head);
                      return (
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
                            {normHead === 'FEED' ? `Feed ${record.type}` : record.type}
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
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {record.head}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-indigo-900">
                          {record.quantity.toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {normHead === 'FEED' ? 'bags' : 'units'}
                          </span>
                        </td>
                        {canViewFinancials && (
                          <td className="py-3 px-3 text-right font-bold font-mono text-emerald-800">
                            Rs. {record.amount.toLocaleString()}
                          </td>
                        )}
                        {canViewFinancials && (
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            Rs. {record.costPerBag ? record.costPerBag.toLocaleString() : '0'}
                          </td>
                        )}
                        {canViewFinancials && (
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
                        )}
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
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditStockModal(record)}
                                className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                title={`Edit Stock Record #${record.trackingId}`}
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && confirmDeleteStockId !== record.id && (
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
                          {canDelete && confirmDeleteStockId === record.id && (
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
                      );
                    })
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
                    placeholder="e.g. 13, Antibiotic, ND + IB Lasota..."
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
          badge={{
            text: canViewFinancials ? `${viewingStock.head} — ${viewingStock.paymentType}` : viewingStock.head,
            color: 'indigo',
          }}
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
            ...(canViewFinancials
              ? [
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
                ]
              : []),
          ]}
          notes={viewingStock.notes}
          onEdit={canEdit ? () => openEditStockModal(viewingStock) : undefined}
          onDelete={canDelete ? () => handleDeleteStock(viewingStock) : undefined}
        />
      )}
    </div>
  );
};
