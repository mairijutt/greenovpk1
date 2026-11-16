import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  X,
  Landmark,
  FileText,
  Trash2,
  UploadCloud,
  CheckCircle,
  Package,
  AlertCircle,
} from 'lucide-react';
import { BankAccount, FinancialRecord, InventoryItem } from '../types/farm.ts';
import { EXPENSE_HEADS_21 } from '../data/liveExpenses.ts';
import { liveStockRecords, StockRecord } from '../data/liveStocks.ts';
import { BankFormModal } from './BankFormModal.tsx';
import { UIButton, UIInput, UISelect, UITextarea } from './ui';
import { apiFetch } from '../services/api.ts';

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface DashboardTransactionModalProps {
  isOpen: boolean;
  initialType: 'Income' | 'Expense';
  bankAccounts: BankAccount[];
  onClose: () => void;
  onAddTransaction: (record: FinancialRecord) => Promise<void> | void;
  onAddBank?: (bank: BankAccount) => void;
  onSuccessToast?: (message: string) => void;
}

export const DashboardTransactionModal: React.FC<DashboardTransactionModalProps> = ({
  isOpen,
  initialType,
  bankAccounts,
  onClose,
  onAddTransaction,
  onAddBank,
  onSuccessToast,
}) => {
  const isSale = initialType === 'Income';
  const [showQuickBankModal, setShowQuickBankModal] = useState(false);
  const [date, setDate] = useState(getTodayDateStr);
  const [head, setHead] = useState<string>(isSale ? 'EGG' : '');
  const [flockName, setFlockName] = useState<string>('');

  // Egg counter fields (shown when Sale Category === 'EGG')
  const [cartons, setCartons] = useState<number | ''>(0);
  const [trays, setTrays] = useState<number | ''>(0);
  const [looseEggs, setLooseEggs] = useState<number | ''>(0);
  const [otherQty, setOtherQty] = useState<number | ''>(0);
  const [unitPrice, setUnitPrice] = useState<number | ''>(0);
  const [amount, setAmount] = useState<number | ''>(0);
  const [pricingDriver, setPricingDriver] = useState<'amount' | 'price'>('amount');

  // Party & Dispatch Logistics
  const [partyName, setPartyName] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  // Payment fields
  const [paymentMode, setPaymentMode] = useState<'Split' | 'Online' | 'Cash'>('Split');
  const [onlineAmount, setOnlineAmount] = useState<number | ''>(0);
  const [cashAmount, setCashAmount] = useState<number | ''>(0);
  const [bankId, setBankId] = useState<string>('');

  // Reference & attachments
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [challanNo, setChallanNo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totalEggs = Math.max(
    0,
    (Number(cartons) || 0) * 360 + (Number(trays) || 0) * 30 + (Number(looseEggs) || 0)
  );

  const syncPaymentFromTotal = (
    nextAmt: number,
    mode: 'Split' | 'Online' | 'Cash' = paymentMode
  ) => {
    if (!isSale) return;
    if (mode === 'Online') {
      setOnlineAmount(nextAmt);
      setCashAmount(0);
    } else if (mode === 'Cash') {
      setOnlineAmount(0);
      setCashAmount(nextAmt);
    } else {
      const online = Math.round(nextAmt * 0.8);
      setOnlineAmount(online);
      setCashAmount(Math.max(0, nextAmt - online));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateStr());
      setHead(initialType === 'Income' ? 'EGG' : '');
      setFlockName('');
      setCartons(0);
      setTrays(0);
      setLooseEggs(0);
      setOtherQty(0);
      setUnitPrice(0);
      setAmount(0);
      setPricingDriver('amount');
      setPartyName('');
      setVehicleNumber('');
      setPaymentMode('Split');
      setOnlineAmount(0);
      setCashAmount(0);
      setBankId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
      setReferenceNo(`INV-${Date.now().toString().slice(-4)}`);
      setChallanNo('');
      setDescription('');
      setAttachmentData(null);
      setAttachmentName('');
      setFormError(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleEggCounterChange = (
    nextCartons: number | '',
    nextTrays: number | '',
    nextLoose: number | ''
  ) => {
    setCartons(nextCartons);
    setTrays(nextTrays);
    setLooseEggs(nextLoose);
    const eggsSum =
      (Number(nextCartons) || 0) * 360 +
      (Number(nextTrays) || 0) * 30 +
      (Number(nextLoose) || 0);
    const currentRate = Number(unitPrice) || 0;
    const currentAmt = Number(amount) || 0;

    if (pricingDriver === 'price' && currentRate > 0) {
      const calcAmt = Math.round(eggsSum * currentRate);
      setAmount(calcAmt);
      syncPaymentFromTotal(calcAmt);
    } else if (eggsSum > 0 && currentAmt > 0) {
      setUnitPrice(Number((currentAmt / eggsSum).toFixed(2)));
    } else if (eggsSum === 0 && pricingDriver === 'amount') {
      setUnitPrice(0);
    }
  };

  const handlePriceChange = (rawPrice: string) => {
    setPricingDriver('price');
    const cleanPrice: number | '' = rawPrice === '' ? '' : Math.max(0, Number(rawPrice) || 0);
    setUnitPrice(cleanPrice);
    if (isSale) {
      const qty = head === 'EGG' ? totalEggs : Number(otherQty) || 0;
      const calcAmt = Math.round(qty * (Number(cleanPrice) || 0));
      setAmount(calcAmt);
      syncPaymentFromTotal(calcAmt);
    }
  };

  const handleOtherQtyChange = (nextQty: number) => {
    const cleanQty = Math.max(0, nextQty);
    setOtherQty(cleanQty);
    if (isSale) {
      const currentRate = Number(unitPrice) || 0;
      const currentAmt = Number(amount) || 0;
      if (pricingDriver === 'price' && currentRate > 0) {
        const calcAmt = Math.round(cleanQty * currentRate);
        setAmount(calcAmt);
        syncPaymentFromTotal(calcAmt);
      } else if (cleanQty > 0 && currentAmt > 0) {
        setUnitPrice(Number((currentAmt / cleanQty).toFixed(2)));
      }
    }
  };

  const handleCategoryChange = (nextHead: string) => {
    setHead(nextHead);
    const amtNum = Number(amount) || 0;
    const qty = nextHead === 'EGG' ? totalEggs : Number(otherQty) || 0;
    setUnitPrice(qty > 0 && amtNum > 0 ? Number((amtNum / qty).toFixed(2)) : 0);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError('File size exceeds 3MB limit.');
      return;
    }
    setFormError(null);
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError('Please select a date.');
      return;
    }
    if (!flockName) {
      setFormError('Please select a flock / unit.');
      return;
    }
    if (!head) {
      setFormError(isSale ? 'Please select a sales category.' : 'Please select an expense head.');
      return;
    }
    if (isSale) {
      if (head === 'EGG' && totalEggs <= 0) {
        setFormError('Please enter egg dispatch volume (at least 1 carton, tray, or egg).');
        return;
      }
      if (head !== 'EGG' && (!otherQty || Number(otherQty) <= 0)) {
        setFormError('Please enter a valid quantity greater than 0.');
        return;
      }
      if (!unitPrice || Number(unitPrice) <= 0) {
        setFormError('Please enter a valid unit price greater than 0.');
        return;
      }
      if (!amount || Number(amount) <= 0) {
        setFormError('Please enter a valid Total Sale Amount (PKR) greater than 0.');
        return;
      }
      if (!partyName.trim()) {
        setFormError('Please enter the Party / Buyer Name.');
        return;
      }
      if (
        paymentMode === 'Split' &&
        Math.abs((Number(onlineAmount) || 0) + (Number(cashAmount) || 0) - Number(amount)) > 1
      ) {
        setFormError('Online Bank Amount + Cash Counter Amount must equal Total Sale Amount.');
        return;
      }
      if (!challanNo.trim()) {
        setFormError('Please enter the Challan / Voucher No.');
        return;
      }
    } else {
      if (!amount || Number(amount) <= 0) {
        setFormError('Please enter a valid Expense Amount (PKR) greater than 0.');
        return;
      }
      if (!challanNo.trim()) {
        setFormError('Please enter the Challan / Voucher No.');
        return;
      }
      if (!description.trim()) {
        setFormError('Please enter a Description & Notes for this expense voucher.');
        return;
      }
    }
    setIsSaving(true);

    const fid = flockName === 'Unit 1' ? 8 : flockName === 'Unit 2' ? 9 : 10;
    const trackingId = Date.now().toString().slice(-4);

    let onlinePayment = 0;
    let cashPayment = 0;
    if (isSale) {
      if (paymentMode === 'Online') {
        onlinePayment = Number(amount);
        cashPayment = 0;
      } else if (paymentMode === 'Cash') {
        onlinePayment = 0;
        cashPayment = Number(amount);
      } else {
        onlinePayment = Number(onlineAmount) || 0;
        cashPayment = Number(cashAmount) || Math.max(0, Number(amount) - onlinePayment);
      }
    }

    const effectiveBankId =
      isSale && paymentMode !== 'Cash'
        ? bankId || (bankAccounts.length > 0 ? bankAccounts[0].id : '')
        : '';
    const matchedBank = bankAccounts.find((b) => String(b.id) === String(effectiveBankId));

    const finalQty = isSale
      ? head === 'EGG'
        ? totalEggs
        : Number(otherQty) || 1
      : undefined;

    const numAmt = Number(amount) || 0;
    const computedUnitPrice =
      isSale && finalQty && finalQty > 0
        ? Number(unitPrice) > 0
          ? Number(unitPrice)
          : Number((numAmt / finalQty).toFixed(2))
        : undefined;

    const record: FinancialRecord = {
      id: `${isSale ? 'inc' : 'exp'}-${Date.now()}`,
      trackingId: Number(trackingId),
      type: initialType,
      category: head,
      head,
      amount: numAmt,
      totalAmount: numAmt,
      date: date || getTodayDateStr(),
      referenceNo,
      challanNo,
      flockId: fid,
      flockName,
      partyName: partyName.trim() || undefined,
      vehicleNumber: vehicleNumber.trim() || undefined,
      description:
        description ||
        (partyName.trim() ? `${head} Sale — ${partyName.trim()}` : `${head}: Manual entry`),
      notes: description,
      status: 'Paid',
      paymentMethod: isSale
        ? paymentMode === 'Online'
          ? 'Online / Bank'
          : paymentMode === 'Cash'
          ? 'Cash Counter'
          : 'Split (Online/Cash)'
        : 'Bank Transfer',
      onlinePayment,
      cashPayment,
      bankId: matchedBank?.id || undefined,
      bankName: matchedBank?.bankName || undefined,
      quantity: finalQty,
      unitPrice: computedUnitPrice,
      cartons: isSale && head === 'EGG' ? Number(cartons) || 0 : undefined,
      trays: isSale && head === 'EGG' ? Number(trays) || 0 : undefined,
      looseEggs: isSale && head === 'EGG' ? Number(looseEggs) || 0 : undefined,
      attachment: attachmentData || null,
      attachmentName: attachmentName || null,
    };

    try {
      await onAddTransaction(record);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save record to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
        <div
          className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto ${
            isSale ? 'max-w-3xl p-6 sm:p-8' : 'max-w-xl p-6 sm:p-7'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isSale ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {isSale ? 'Record Sales & Receipt' : 'Record Voucher / Expense (21 Heads)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSale
                    ? 'Commercial sales invoice, egg cartons/trays volume, party details & payment channel'
                    : 'Log operational expense voucher across 21 audited expense heads'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Primary Details */}
            <div className={`grid grid-cols-1 ${isSale ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 sm:gap-5`}>
              <UIInput
                label="Date"
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFormError(null);
                }}
              />

              <UISelect
                label="Unit / Flock"
                required
                value={flockName}
                onChange={(e) => {
                  setFlockName(e.target.value);
                  setFormError(null);
                }}
              >
                <option value="" disabled>
                  Select flock
                </option>
                <option value="Unit 1">Unit 1 (Flock 8)</option>
                <option value="Unit 2">Unit 2 (Flock 9)</option>
                <option value="Unit 3">Unit 3 (Flock 10)</option>
              </UISelect>

              {isSale && (
                <UISelect
                  label="Sales Category / Head"
                  required
                  value={head}
                  onChange={(e) => {
                    handleCategoryChange(e.target.value);
                    setFormError(null);
                  }}
                >
                  {['EGG', 'Manure', 'Feed BAGS', 'Cull Birds', 'OTHER'].map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </UISelect>
              )}
            </div>

            {/* Dynamic Egg Volume Counter (appears whenever EGG is selected on Sales form) */}
            {isSale && head === 'EGG' && (
              <div className="p-4 sm:p-5 bg-sky-50/50 rounded-2xl border border-sky-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-900">
                    Egg Dispatch Counter
                  </span>
                  <span className="text-[11px] font-semibold text-sky-700">
                    1 Carton = 360 Eggs • 1 Tray = 30 Eggs
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      Cartons (360)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cartons}
                      onFocus={() => {
                        if (Number(cartons) === 0) setCartons('');
                      }}
                      onBlur={() => {
                        if (cartons === '') setCartons(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const cVal: number | '' =
                          raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0);
                        handleEggCounterChange(cVal, trays, looseEggs);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block text-center font-mono">
                      ={((Number(cartons) || 0) * 360).toLocaleString()} eggs
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      Trays (30)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={trays}
                      onFocus={() => {
                        if (Number(trays) === 0) setTrays('');
                      }}
                      onBlur={() => {
                        if (trays === '') setTrays(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const tVal: number | '' =
                          raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0);
                        handleEggCounterChange(cartons, tVal, looseEggs);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block text-center font-mono">
                      ={((Number(trays) || 0) * 30).toLocaleString()} eggs
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      Eggs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={looseEggs}
                      onFocus={() => {
                        if (Number(looseEggs) === 0) setLooseEggs('');
                      }}
                      onBlur={() => {
                        if (looseEggs === '') setLooseEggs(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const lVal: number | '' =
                          raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0);
                        handleEggCounterChange(cartons, trays, lVal);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block text-center font-mono">
                      ={(Number(looseEggs) || 0).toLocaleString()} eggs
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-blue-700 mb-1.5">
                      Total Eggs
                    </label>
                    <div className="w-full px-3 py-2.5 bg-sky-100/80 border border-sky-300 rounded-xl font-mono text-base font-black text-sky-950 text-center flex items-center justify-center shadow-2xs">
                      {totalEggs.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold mt-1 block text-center font-mono">
                      {(totalEggs / 360).toFixed(1)} Cartons
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Amount */}
            {isSale ? (
              <div className={`grid grid-cols-1 ${head !== 'EGG' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 sm:gap-5`}>
                {head !== 'EGG' && (
                  <UIInput
                    label="Quantity (Bags / Birds / Units)"
                    type="number"
                    min="1"
                    required
                    value={otherQty}
                    onFocus={() => {
                      if (Number(otherQty) === 0) setOtherQty('');
                    }}
                    onBlur={() => {
                      if (otherQty === '') setOtherQty(0);
                    }}
                    onChange={(e) => {
                      handleOtherQtyChange(Number(e.target.value) || 0);
                      setFormError(null);
                    }}
                  />
                )}

                <div>
                  <UIInput
                    label={head === 'EGG' ? 'Price / Egg (PKR)' : 'Unit Price (PKR)'}
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitPrice}
                    onFocus={() => {
                      if (Number(unitPrice) === 0) setUnitPrice('');
                    }}
                    onBlur={() => {
                      if (unitPrice === '') setUnitPrice(0);
                    }}
                    onChange={(e) => {
                      handlePriceChange(e.target.value);
                      setFormError(null);
                    }}
                  />
                  {head === 'EGG' && (
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block font-mono">
                      = Rs. {Math.round((Number(unitPrice) || 0) * 360).toLocaleString()} / carton
                    </span>
                  )}
                </div>

                <div>
                  <UIInput
                    label="Total Sale Amount (PKR)"
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onFocus={() => {
                      if (Number(amount) === 0) setAmount('');
                    }}
                    onBlur={() => {
                      if (amount === '') setAmount(0);
                    }}
                    onChange={(e) => {
                      setPricingDriver('amount');
                      const raw = e.target.value;
                      const amtVal: number | '' = raw === '' ? '' : Math.max(0, Number(raw) || 0);
                      const amtNum = Number(amtVal) || 0;
                      setAmount(amtVal);
                      const qty = head === 'EGG' ? totalEggs : Number(otherQty) || 0;
                      setUnitPrice(qty > 0 && amtNum > 0 ? Number((amtNum / qty).toFixed(2)) : 0);
                      syncPaymentFromTotal(amtNum);
                      setFormError(null);
                    }}
                  />
                  {head === 'EGG' && totalEggs > 0 && Number(amount) > 0 && (
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                      Auto Price: Rs. {(Number(amount) / totalEggs).toFixed(2)}/egg
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <UISelect
                  label="Expense Head (21 Heads)"
                  required
                  value={head}
                  onChange={(e) => {
                    setHead(e.target.value);
                    setFormError(null);
                  }}
                >
                  <option value="" disabled>
                    Select expense head
                  </option>
                  {EXPENSE_HEADS_21.map((h) => (
                    <option key={h} value={h}>
                      {h.replace('_', ' ')}
                    </option>
                  ))}
                </UISelect>

                <UIInput
                  label="Amount (PKR)"
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onFocus={() => {
                    if (Number(amount) === 0) setAmount('');
                  }}
                  onBlur={() => {
                    if (amount === '') setAmount(0);
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAmount(raw === '' ? '' : Math.max(0, Number(raw) || 0));
                    setFormError(null);
                  }}
                />
              </div>
            )}

            {/* Party Name & Vehicle Number (Sales) */}
            {isSale && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <UIInput
                  label="Party / Buyer Name"
                  type="text"
                  required
                  placeholder="e.g. Ahmed Traders / Bismillah Eggs"
                  value={partyName}
                  onChange={(e) => {
                    setPartyName(e.target.value);
                    setFormError(null);
                  }}
                />

                <UIInput
                  label="Vehicle Number (Optional)"
                  type="text"
                  placeholder="e.g. MN-1234 or ABC"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
            )}

            {/* Payment Channel & Deposit Bank */}
            {isSale && (
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
                <UISelect
                  label="Payment Channel / Receipt Method"
                  value={paymentMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'Split' | 'Online' | 'Cash';
                    setPaymentMode(mode);
                    syncPaymentFromTotal(Number(amount) || 0, mode);
                  }}
                >
                  <option value="Split">Split Payment (Online Bank + Cash Counter)</option>
                  <option value="Online">Online / Direct Bank Transfer (100% Online)</option>
                  <option value="Cash">Cash Counter / Direct Cash (100% Cash)</option>
                </UISelect>

                {paymentMode === 'Split' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <UIInput
                      label="Online Bank Amount (PKR)"
                      type="number"
                      min="0"
                      value={onlineAmount}
                      onFocus={() => {
                        if (Number(onlineAmount) === 0) setOnlineAmount('');
                      }}
                      onBlur={() => {
                        if (onlineAmount === '') setOnlineAmount(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const onlineVal: number | '' =
                          raw === '' ? '' : Math.max(0, Number(raw) || 0);
                        setOnlineAmount(onlineVal);
                        setCashAmount(Math.max(0, (Number(amount) || 0) - (Number(onlineVal) || 0)));
                      }}
                    />
                    <UIInput
                      label="Cash Counter Amount (PKR)"
                      type="number"
                      min="0"
                      value={cashAmount}
                      onFocus={() => {
                        if (Number(cashAmount) === 0) setCashAmount('');
                      }}
                      onBlur={() => {
                        if (cashAmount === '') setCashAmount(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const cashVal: number | '' =
                          raw === '' ? '' : Math.max(0, Number(raw) || 0);
                        setCashAmount(cashVal);
                        setOnlineAmount(Math.max(0, (Number(amount) || 0) - (Number(cashVal) || 0)));
                      }}
                    />
                  </div>
                )}

                {paymentMode !== 'Cash' && (
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deposit Bank Account (Auto-updates Bank Balance)</span>
                      </label>
                      {onAddBank && (
                        <button
                          type="button"
                          onClick={() => setShowQuickBankModal(true)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          + Add Bank
                        </button>
                      )}
                    </div>
                    <select
                      value={bankId || (bankAccounts.length > 0 ? bankAccounts[0].id : '')}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      {bankAccounts.length === 0 ? (
                        <option value="">No Bank Accounts Added Yet (Click + Add Bank)</option>
                      ) : (
                        <>
                          <option value="">Unassigned / General Online Pool</option>
                          {bankAccounts.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} — {b.accountTitle}
                              {b.accountNumber ? ` (${b.accountNumber})` : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Challan & Ref Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <UIInput
                label="Challan / Voucher No"
                required
                placeholder="Enter Challan / Voucher No"
                value={challanNo}
                onChange={(e) => {
                  setChallanNo(e.target.value);
                  setFormError(null);
                }}
              />
              <UIInput
                label="Invoice / Ref No (Auto-generated)"
                value={referenceNo}
                readOnly
                tabIndex={-1}
                className="bg-slate-100 focus:bg-slate-100 text-slate-600 font-mono cursor-not-allowed select-none"
              />
            </div>

            <UITextarea
              label={isSale ? 'Description & Notes (Optional)' : 'Description & Notes'}
              required={!isSale}
              placeholder={
                isSale
                  ? 'e.g. Grade A commercial eggs dispatched via refrigerated van'
                  : 'e.g. Cardboard 16 number 30 bundle, feed bags, generator fuel etc.'
              }
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFormError(null);
              }}
            />

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Attach Voucher / Receipt / Slip (Image or PDF)
              </label>
              {attachmentName ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-2.5 truncate">
                    {attachmentData?.startsWith('data:image') ? (
                      <img
                        src={attachmentData}
                        alt="Slip Preview"
                        className="w-9 h-9 rounded object-cover border border-emerald-200"
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
                    onClick={() => {
                      setAttachmentData(null);
                      setAttachmentName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer bg-slate-50/70 hover:bg-emerald-50/20 transition-all">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Upload Challan / Invoice / Bank Slip
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <UIButton type="button" variant="secondary" onClick={onClose}>
                Cancel
              </UIButton>
              <UIButton type="submit" variant={isSale ? 'primary' : 'danger'} disabled={isSaving}>
                {isSaving
                  ? 'Saving...'
                  : isSale
                  ? 'Save Sale Record'
                  : 'Save Expense Voucher'}
              </UIButton>
            </div>
          </form>
        </div>
      </div>

      {showQuickBankModal && onAddBank && (
        <BankFormModal
          onClose={() => setShowQuickBankModal(false)}
          onSave={(newBank) => {
            onAddBank(newBank);
            setBankId(newBank.id);
            setShowQuickBankModal(false);
          }}
        />
      )}
    </>
  );
};

interface DashboardStockModalProps {
  isOpen: boolean;
  inventory: InventoryItem[];
  onClose: () => void;
  onRestock?: (id: string, amount: number) => void;
  onAddTransaction?: (record: FinancialRecord) => Promise<void> | void;
  onStockSaved?: () => void;
  onSuccessToast?: (message: string) => void;
}

export const DashboardStockModal: React.FC<DashboardStockModalProps> = ({
  isOpen,
  inventory,
  onClose,
  onRestock,
  onAddTransaction,
  onStockSaved,
  onSuccessToast,
}) => {
  const [formDate, setFormDate] = useState(getTodayDateStr);
  const [formHead, setFormHead] = useState('FEED');
  const [formStockType, setFormStockType] = useState('11');
  const [formFlock, setFormFlock] = useState('');
  const [formQuantity, setFormQuantity] = useState<number | string>(0);
  const [formAmount, setFormAmount] = useState<number | string>(0);
  const [formPaymentType, setFormPaymentType] = useState('');
  const [formChallan, setFormChallan] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormDate(getTodayDateStr());
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setFormError('File size exceeds 3MB limit.');
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
    setIsSaving(true);

    let existingStocks: StockRecord[] = liveStockRecords;
    try {
      const saved = localStorage.getItem('greenova_stocks_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) existingStocks = parsed;
      }
    } catch {}

    const qty = Number(formQuantity) || 0;
    const amt = Number(formAmount) || 0;
    const costBag = qty > 0 ? Math.round(amt / qty) : 0;
    const maxTracking = existingStocks.reduce((max, r) => Math.max(max, r.trackingId || 0), 0);
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

      const updated = [newRecord, ...existingStocks];
      try {
        localStorage.setItem('greenova_stocks_v2', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      if (onAddTransaction) {
        const expenseRecord: FinancialRecord = {
          id: `exp-stk-${Date.now()}`,
          trackingId: newRecord.trackingId,
          type: 'Expense',
          category:
            formHead === 'FEED'
              ? 'FEED'
              : formHead === 'MEDICINE'
              ? 'MEDICINE'
              : formHead === 'VACCINE'
              ? 'VACCINE'
              : formHead,
          head:
            formHead === 'FEED'
              ? 'FEED'
              : formHead === 'MEDICINE'
              ? 'MEDICINE'
              : formHead === 'VACCINE'
              ? 'VACCINE'
              : formHead,
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

      onStockSaved?.();
      onSuccessToast?.(`Stock record #${newRecord.trackingId} saved successfully.`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save stock record to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Stock Details</h2>
              <p className="text-xs text-slate-500">
                Enter the stock purchase or payment details below
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveStockRecord} noValidate className="mt-4 space-y-4">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

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
                    <option value="Multivitamins & Electrolytes">Multivitamins &amp; Electrolytes</option>
                    <option value="Calcium & D3 Booster">Calcium &amp; D3 Booster</option>
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
                    <option value="Drinker Nipples & Pipes">Drinker Nipples &amp; Pipes</option>
                    <option value="Manure Removal Belt">Manure Removal Belt</option>
                    <option value="Cooling Pads & Belts">Cooling Pads &amp; Belts</option>
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
                onChange={(e) => {
                  setFormChallan(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. 1445 or CH-8902"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attachment (Optional PDF/Image)
            </label>
            <input
              type="file"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Description (optional)
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="240 bags of 13-C1 feed received..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <UIButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </UIButton>
            <UIButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Stock Record'}
            </UIButton>
          </div>
        </form>
      </div>
    </div>
  );
};
