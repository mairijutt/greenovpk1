import React, { useState, useMemo } from 'react';
import { Wheat, Droplets, Plus, Scale, Download, AlertCircle, RotateCcw } from 'lucide-react';
import { FeedConsumption, Flock } from '../types/farm';
import { FilterBar } from './FilterBar';

interface ConsumptionViewProps {
  consumptionLogs: FeedConsumption[];
  flocks: Flock[];
  onOpenRecordModal: (type: 'feed') => void;
}

export const ConsumptionView: React.FC<ConsumptionViewProps> = ({
  consumptionLogs,
  flocks,
  onOpenRecordModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return consumptionLogs.filter((log) => {
      const matchesFlock = selectedFlock === 'all' || log.flockId === selectedFlock;
      let matchesDate = true;
      if (startDate && log.date < startDate) matchesDate = false;
      if (endDate && log.date > endDate) matchesDate = false;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        log.flockName.toLowerCase().includes(q) ||
        log.feedType.toLowerCase().includes(q) ||
        log.date.includes(q);

      return matchesFlock && matchesDate && matchesSearch;
    });
  }, [consumptionLogs, selectedFlock, startDate, endDate, searchTerm]);

  const totalFeedKg = filtered.reduce((acc, curr) => acc + curr.feedQuantityKg, 0);
  const totalWaterL = filtered.reduce((acc, curr) => acc + curr.waterIntakeLiters, 0);
  const avgGramsPerBird =
    filtered.length > 0
      ? (filtered.reduce((acc, curr) => acc + curr.gramsPerBird, 0) / filtered.length).toFixed(1)
      : '0.0';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFlock('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['Date,Flock,Feed Formulation,Quantity (Kg),Grams/Bird,Water (L),FCR\n'];
    const rows = filtered.map(
      (c) =>
        `${c.date},"${c.flockName}","${c.feedType}",${c.feedQuantityKg},${c.gramsPerBird},${c.waterIntakeLiters},${c.fcrEstimate}\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Feed_Water_Consumption_${startDate || 'all'}_to_${endDate || 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Wheat className="w-5 h-5 text-amber-600" />
            <span>Daily Feed & Water Intake</span>
          </h1>
          <p className="text-xs text-slate-500">
            Monitor nutritional intake per bird, feed conversion ratio (FCR), and water intake balance.
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
            onClick={() => onOpenRecordModal('feed')}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Feed Intake</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
            <Wheat className="w-4 h-4 text-amber-600" />
            <span>Total Feed Consumed</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalFeedKg.toLocaleString()} <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">~{Math.round(totalFeedKg / 50)} bags (50kg each)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>Total Water Intake</span>
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {totalWaterL.toLocaleString()} <span className="text-xs font-semibold text-slate-500">Liters</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Ratio:{' '}
            {totalFeedKg > 0 ? (totalWaterL / totalFeedKg).toFixed(2) : '2.0'} : 1 (Water : Feed)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Average Feed / Bird</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {avgGramsPerBird} <span className="text-xs font-semibold text-slate-500">g / bird</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Optimal Lohmann/Hy-Line target</div>
        </div>
      </div>

      {/* Flock & Date Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search flock, feed formulation, date..."
        flocks={flocks}
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flockLabel="Select Flock"
        allFlocksLabel="All Flocks (All Sheds)"
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        totalCount={consumptionLogs.length}
        filteredCount={filtered.length}
        itemTypeLabel="feed logs"
        onResetFilters={handleResetFilters}
      />

      {/* Consumption Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flock / Shed</th>
                  <th className="py-3 px-4">Feed Formulation</th>
                  <th className="py-3 px-4">Total Weight (Kg)</th>
                  <th className="py-3 px-4">Grams / Bird</th>
                  <th className="py-3 px-4">Water Intake (L)</th>
                  <th className="py-3 px-4">Estimated FCR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.flockName}</td>
                    <td className="py-3 px-4 text-slate-600">{log.feedType}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-800">
                      {log.feedQuantityKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{log.gramsPerBird} g</td>
                    <td className="py-3 px-4 text-sky-700 font-medium">
                      {log.waterIntakeLiters.toLocaleString()} L
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.fcrEstimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No consumption records match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust flock selection or date range.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
