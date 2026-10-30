import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { InventoryItem, FinancialRecord } from '../types/farm.ts';
import { StatCard, PageHeader, UIButton, TableCard } from './ui';
import {
  STOCK_SUMMARY,
  unitWiseStockSummary,
  liveStockRecords,
  StockRecord,
} from '../data/liveStocks.ts';

interface StocksViewProps {
  inventory: InventoryItem[];
  onRestock: (id: string, amount: number) => void;
  onAddTransaction?: (record: FinancialRecord) => void;
}

export const StocksView: React.FC<StocksViewProps> = ({ inventory, onRestock, onAddTransaction }) => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'add-stock' | 'warehouse'>('shipments');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedFeedType, setSelectedFeedType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
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

  // Old System Stock Details Form State matching st1_d471a4d4.png & st2/st3
  const [formDate, setFormDate] = useState<string>('2026-10-27');
  const [formHead, setFormHead] = useState<string>('FEED');
  const [formStockType, setFormStockType] = useState<string>('11');
  const [formFlock, setFormFlock] = useState<string>('Unit 2');
  const [formQuantity, setFormQuantity] = useState<number | string>(240);
  const [formAmount, setFormAmount] = useState<number | string>(500000);
  const [formPaymentType, setFormPaymentType] = useState<string>('');
  const [formChallan, setFormChallan] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setFormDate('2026-10-27');
    setFormHead('FEED');
    setFormStockType('11');
    setFormFlock('Unit 2');
    setFormQuantity(240);
    setFormAmount(500000);
    setFormPaymentType('');
    setFormChallan('');
    setFormNotes('');
    setAttachmentName('');
    setAttachmentData(null);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStockRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPaymentType) {
      alert('Please select a payment type.');
      return;
    }
    if (!formChallan.trim()) {
      alert('Please enter a challan number.');
      return;
    }

    const qty = Number(formQuantity) || 0;
    const amt = Number(formAmount) || 0;
    const costBag = qty > 0 ? Math.round(amt / qty) : 0;
    const maxTracking = allStockRecords.reduce((max, r) => Math.max(max, r.trackingId || 0), 0);
    const flockId = formFlock === 'Unit 2' ? '9' : formFlock === 'Unit 3' ? '10' : '8';

    const newRecord: StockRecord = {
      id: `stk-${Date.now()}`,
      trackingId: maxTracking + 1,
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
      paymentType: formPaymentType,
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

    // Call backend API to persist
    fetch('/api/stocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formDate,
        challanNo: formChallan,
        Type: formStockType,
        flockId: Number(flockId),
        head: formHead,
        quantity: qty,
        amount: amt,
        amountPaid: amt,
        paymentType: formPaymentType.toUpperCase(),
        notes: formNotes,
        attachment: attachmentData || attachmentName || null,
      }),
    }).catch((e) => console.warn('Stock backend sync error:', e));

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
      onAddTransaction(expenseRecord);
    }

    // Auto-restock warehouse inventory item if applicable
    if (onRestock && qty > 0) {
      const match = inventory.find(
        (item) =>
          item.category.toLowerCase() === formHead.toLowerCase() ||
          item.name.toLowerCase().includes(formStockType.toLowerCase()) ||
          (formHead === 'FEED' && item.name.toLowerCase().includes('feed'))
      );
      if (match) {
        onRestock(match.id, qty);
      }
    }

    // Show toast and reset form
    setToastMessage(`Stock record #${newRecord.trackingId} saved & automatically logged to Farm Expenses (Rs. ${amt.toLocaleString()})!`);
    setTimeout(() => setToastMessage(null), 4000);
    handleResetForm();
    setActiveTab('shipments');
    setCurrentPage(1);
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

      const q = searchQuery.trim().toLowerCase();
      const searchMatch =
        !q ||
        record.trackingId.toString().includes(q) ||
        record.date.toLowerCase().includes(q) ||
        record.flockName.toLowerCase().includes(q) ||
        record.challanNo.toLowerCase().includes(q) ||
        record.notes.toLowerCase().includes(q) ||
        record.feedType.toLowerCase().includes(q);

      return unitMatch && feedTypeMatch && paymentMatch && searchMatch;
    });
  }, [allStockRecords, selectedUnit, selectedFeedType, selectedPayment, searchQuery]);

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

  const handleResetFilters = () => {
    setSelectedUnit('all');
    setSelectedFeedType('all');
    setSelectedPayment('all');
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

  // Warehouse SKU filters
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseCategory, setWarehouseCategory] = useState('all');

  const filteredWarehouse = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
        item.location.toLowerCase().includes(warehouseSearch.toLowerCase());
      const matchesCat = warehouseCategory === 'all' || item.category === warehouseCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, warehouseSearch, warehouseCategory]);

  const lowStockCount = inventory.filter((item) => item.quantity <= item.minAlertThreshold).length;
  const totalValuation = inventory.reduce((acc, curr) => acc + curr.quantity * curr.costPerUnit, 0);

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
        subtitle="Manage commercial feed replenishment ledger, grain silos, and warehouse cold-chain supplies."
        icon={Boxes}
        iconColor="indigo"
        badge="Live Warehouse Tracking"
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
          <span>Feed Stock Replenishments</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'shipments' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {allStockRecords.length} Shipments
          </span>
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'warehouse'
              ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Warehouse Supplies &amp; Reorder Safety (SKUs)</span>
          <span
            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'warehouse' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {inventory.length} SKUs
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

            <form onSubmit={handleSaveStockRecord} className="space-y-4">
              {/* Row 1: Date & Head */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Head *</label>
                  <select
                    value={formHead}
                    onChange={(e) => handleHeadChange(e.target.value)}
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
                    onChange={(e) => setFormStockType(e.target.value)}
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
                    onChange={(e) => setFormFlock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 3">Unit 3</option>
                    <option value="Warehouse">Warehouse / All Units</option>
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
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="240"
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
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="500000"
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
                    onChange={(e) => setFormPaymentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="">Select payment type</option>
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
                  className="px-6 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Stock Record
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

          {/* Filters Bar */}
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

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
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

      {/* --- TAB 2: WAREHOUSE INVENTORY & REORDER SAFETY (SKUS) --- */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Inventory Items"
              value={inventory.length}
              unit="SKUs"
              icon={Boxes}
              color="indigo"
              badge={{ text: 'Catalogued', color: 'blue' }}
              subtext="Supplies, vaccines & packaging"
            />

            <StatCard
              title="Low Stock Alerts"
              value={lowStockCount}
              unit="Items"
              icon={AlertTriangle}
              color="amber"
              valueColor={lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}
              badge={{
                text: lowStockCount > 0 ? 'Reorder Needed' : 'All Stocked',
                color: lowStockCount > 0 ? 'amber' : 'emerald',
              }}
              subtext="Items below minimum safety threshold"
            />

            <StatCard
              title="Total Store Valuation"
              value={`Rs. ${totalValuation.toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              valueColor="text-emerald-700"
              badge={{ text: 'Current Asset', color: 'emerald' }}
              subtext="Cumulative warehouse inventory value"
            />

            <StatCard
              title="Warehouse Facility"
              value="2 Units"
              unit="Active"
              icon={Package}
              color="blue"
              badge={{ text: 'Cold Chain OK', color: 'teal' }}
              subtext="Central dry feed & vaccine chilling room"
            />
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, category, location..."
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={warehouseCategory}
                onChange={(e) => setWarehouseCategory(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">All Categories</option>
                <option value="Feed">Feed Formulations</option>
                <option value="Packaging">Packaging &amp; Trays</option>
                <option value="Medication">Medications &amp; Vaccines</option>
                <option value="Sanitation">Sanitation &amp; Disinfectant</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredWarehouse.length}</span> inventory items
            </div>
          </div>

          {/* Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredWarehouse.map((item) => {
              const isLow = item.quantity <= item.minAlertThreshold;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-5 border shadow-xs transition-colors flex flex-col justify-between ${
                    isLow
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                      {isLow ? (
                        <span className="flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Adequate
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.location}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-2xl font-black text-slate-900">
                        {item.quantity.toLocaleString()}{' '}
                        <span className="text-xs font-semibold text-slate-400">{item.unit}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Min Threshold:</span>
                        <span className="font-semibold text-slate-700">
                          {item.minAlertThreshold} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Est. Unit Cost:</span>
                        <span className="font-semibold text-emerald-700">
                          Rs. {item.costPerUnit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <UIButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-bold"
                      icon={Plus}
                      onClick={() => onRestock(item.id, 50)}
                    >
                      Quick Restock (+50 {item.unit})
                    </UIButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
