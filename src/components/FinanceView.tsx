import React, { useState, useMemo } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, CheckCircle, Download, RotateCcw, AlertCircle } from 'lucide-react';
import { FinancialRecord } from '../types/farm';
import { FilterBar } from './FilterBar';

interface FinanceViewProps {
  financials: FinancialRecord[];
  onAddTransaction: (record: FinancialRecord) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ financials, onAddTransaction }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [newRecord, setNewRecord] = useState({
    type: 'Income' as const,
    category: 'Egg Sales' as const,
    amount: 150000,
    referenceNo: `INV-${Date.now().toString().slice(-4)}`,
    description: '',
  });

  const categories = [
    { label: 'All Income (Sales)', value: 'Income' },
    { label: 'All Expenses (Costs)', value: 'Expense' },
    { label: 'Egg Sales', value: 'Egg Sales' },
    { label: 'Bird Sales (Culls)', value: 'Bird Sales' },
    { label: 'Feed Purchase', value: 'Feed Purchase' },
    { label: 'Electricity / Power', value: 'Electricity' },
    { label: 'Medicine & Vaccines', value: 'Medicine' },
  ];

  const filtered = useMemo(() => {
    return financials.filter((f) => {
      // Type/Category match
      let matchesCat = true;
      if (selectedType !== 'all') {
        if (selectedType === 'Income' || selectedType === 'Expense') {
          matchesCat = f.type === selectedType;
        } else {
          matchesCat = f.category === selectedType;
        }
      }

      // Date match
      let matchesDate = true;
      if (startDate && f.date < startDate) matchesDate = false;
      if (endDate && f.date > endDate) matchesDate = false;

      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        f.referenceNo.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.date.includes(q);

      return matchesCat && matchesDate && matchesSearch;
    });
  }, [financials, selectedType, startDate, endDate, searchTerm]);

  const totalIncome = filtered
    .filter((f) => f.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filtered
    .filter((f) => f.type === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const netMargin = totalIncome - totalExpense;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['Date,Ref No,Type,Category,Description,Amount (PKR),Status\n'];
    const rows = filtered.map(
      (f) =>
        `${f.date},"${f.referenceNo}","${f.type}","${f.category}","${f.description.replace(/"/g, '""')}",${f.amount},"${f.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Financial_Ledger_${startDate || 'all'}_to_${endDate || 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: FinancialRecord = {
      id: `fin-${Date.now()}`,
      type: newRecord.type,
      category: newRecord.category as any,
      amount: Number(newRecord.amount),
      date: new Date().toISOString().split('T')[0],
      referenceNo: newRecord.referenceNo,
      description: newRecord.description || 'Manual entry',
      status: 'Paid',
    };
    onAddTransaction(record);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Farm Financials, Sales & Expenses</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track commercial egg sales, cull bird revenue, feed costs, electricity, and operating profit.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Period Sales Revenue</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            Rs. {totalIncome.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Egg & bird wholesale revenue</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Period Operating Expenses</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            Rs. {totalExpense.toLocaleString()}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1 flex items-center">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Feed, power, staff & medicine</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Net Operating Profit / (Loss)</div>
          <div className={`text-2xl font-black mt-1 ${netMargin >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            Rs. {netMargin.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {totalIncome > 0 ? ((netMargin / totalIncome) * 100).toFixed(1) : '0.0'}% Gross Margin
          </div>
        </div>
      </div>

      {/* Date & Category Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoice #, category, description..."
        categories={categories}
        selectedCategory={selectedType}
        onSelectCategory={setSelectedType}
        categoryLabel="Type"
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        totalCount={financials.length}
        filteredCount={filtered.length}
        itemTypeLabel="transactions"
        onResetFilters={handleResetFilters}
      />

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount (PKR)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((fin) => (
                  <tr key={fin.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{fin.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{fin.referenceNo}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fin.type === 'Income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fin.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{fin.category}</td>
                    <td className="py-3 px-4 text-slate-600">{fin.description}</td>
                    <td
                      className={`py-3 px-4 font-black ${
                        fin.type === 'Income' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      Rs. {fin.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center text-emerald-700 text-[11px] font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {fin.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No transactions match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try expanding the date range or selecting all categories.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-4">Record Financial Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-medium"
                  >
                    <option value="Income">Income (Sales)</option>
                    <option value="Expense">Expense (Cost)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newRecord.category}
                    onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-medium"
                  >
                    <option value="Egg Sales">Egg Sales</option>
                    <option value="Bird Sales">Bird Sales (Culls)</option>
                    <option value="Manure">Organic Manure</option>
                    <option value="Feed Purchase">Feed Purchase</option>
                    <option value="Electricity">Electricity / WAPDA</option>
                    <option value="Medicine">Medicine & Vaccines</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({ ...newRecord, amount: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice / Ref #</label>
                <input
                  type="text"
                  value={newRecord.referenceNo}
                  onChange={(e) => setNewRecord({ ...newRecord, referenceNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 500 trays to wholesale customer"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
