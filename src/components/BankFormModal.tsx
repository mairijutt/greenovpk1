import React, { useState } from 'react';
import { Landmark, X, Calendar, AlertCircle } from 'lucide-react';
import { BankAccount } from '../types/farm.ts';

interface BankFormModalProps {
  initialBank?: BankAccount | null;
  onClose: () => void;
  onSave: (bank: BankAccount) => void;
}

const POPULAR_BANKS = [
  'Meezan Bank',
  'HBL',
  'UBL',
  'MCB',
  'Bank Alfalah',
  'Faysal Bank',
  'Askari Bank',
  'Allied Bank',
];

export const BankFormModal: React.FC<BankFormModalProps> = ({
  initialBank,
  onClose,
  onSave,
}) => {
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  };

  const getMonthStart = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const [bankName, setBankName] = useState(initialBank?.bankName || '');
  const [accountTitle, setAccountTitle] = useState(
    initialBank?.accountTitle || 'GreenOva Poultry Farm'
  );
  const [accountNumber, setAccountNumber] = useState(initialBank?.accountNumber || '');
  const [openingBalance, setOpeningBalance] = useState<string>(
    initialBank ? String(initialBank.openingBalance) : ''
  );
  const [openingDate, setOpeningDate] = useState(
    initialBank?.openingDate || getToday()
  );
  const [notes, setNotes] = useState(initialBank?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName.trim()) {
      setError('Please enter or select a Bank Name.');
      return;
    }

    const balNum = Number(openingBalance);
    if (isNaN(balNum) || balNum < 0) {
      setError('Please enter a valid Opening Balance (0 or greater).');
      return;
    }

    const nowIso = new Date().toISOString();
    const saved: BankAccount = {
      id: initialBank?.id || `bank-${Date.now()}`,
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim() || 'GreenOva Poultry Farm',
      accountNumber: accountNumber.trim(),
      openingBalance: balNum,
      openingDate: openingDate || getToday(),
      notes: notes.trim(),
      createdAt: initialBank?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 my-auto text-xs">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {initialBank ? `Edit Bank Account` : 'Add Bank & Opening Balance'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure bank opening balance. Online/bank sales assigned to this bank automatically add to its balance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick-Pick Bank Chips */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Meezan Bank, HBL, UBL, MCB..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold text-slate-900"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBankName(b)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    bankName.toLowerCase() === b.toLowerCase()
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Account Title / Branch
              </label>
              <input
                type="text"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="e.g. GreenOva Farms - Multan"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Account No / IBAN
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. PK42 MEZN 0002..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Opening Balance (PKR) *
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="e.g. 2500000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono font-black text-emerald-800 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Opening Date *</span>
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setOpeningDate(getMonthStart())}
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    1st of Month
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setOpeningDate(getToday())}
                    className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Sales added on or after this date auto-credit this bank.
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Main egg collections account"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-700"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
            >
              {initialBank ? 'Save Bank Changes' : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
