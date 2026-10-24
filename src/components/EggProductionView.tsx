import React, { useState, useMemo } from 'react';
import { Egg, Plus, Download, AlertCircle, RotateCcw } from 'lucide-react';
import { EggProduction, Flock } from '../types/farm';
import { FilterBar } from './FilterBar';

interface EggProductionViewProps {
  eggProductions: EggProduction[];
  flocks: Flock[];
  onOpenRecordModal: (type: 'egg') => void;
}

export const EggProductionView: React.FC<EggProductionViewProps> = ({
  eggProductions,
  flocks,
  onOpenRecordModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return eggProductions.filter((item) => {
      // Flock match
      const matchesFlock = selectedFlock === 'all' || item.flockId === selectedFlock;

      // Date match (item.date is 'YYYY-MM-DD')
      let matchesDate = true;
      if (startDate && item.date < startDate) matchesDate = false;
      if (endDate && item.date > endDate) matchesDate = false;

      // Search match
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        item.flockName.toLowerCase().includes(query) ||
        item.date.includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query));

      return matchesFlock && matchesDate && matchesSearch;
    });
  }, [eggProductions, selectedFlock, startDate, endDate, searchTerm]);

  const totalEggs = filtered.reduce((acc, curr) => acc + curr.totalEggs, 0);
  const totalTrays = filtered.reduce((acc, curr) => acc + curr.cleanTrays, 0);
  const totalDamaged = filtered.reduce((acc, curr) => acc + curr.damagedEggs, 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFlock('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['Date,Flock,Morning,Evening,Total Eggs,Damaged,Trays,Laying Rate,Notes\n'];
    const rows = filtered.map(
      (e) =>
        `${e.date},"${e.flockName}",${e.morningEggs},${e.eveningEggs},${e.totalEggs},${e.damagedEggs},${e.cleanTrays},${e.layingRatePercent}%,"${e.notes || ''}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Egg_Production_${startDate || 'all'}_to_${endDate || 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Egg className="w-5 h-5 text-emerald-600" />
            <span>Egg Production Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track daily layer output, morning/evening collections, trays packaged (30s), and rejection rates.
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
            onClick={() => onOpenRecordModal('egg')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Collection</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Filtered Total Eggs</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalEggs.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">High grade production</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Packaged Trays (30 Eggs)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalTrays.toLocaleString()} Trays</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Ready for wholesale dispatch</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Rejection / Cracked</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{totalDamaged.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {((totalDamaged / (totalEggs || 1)) * 100).toFixed(2)}% breakage rate
          </div>
        </div>
      </div>

      {/* Flock & Date Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search flock, shed, date or notes..."
        flocks={flocks}
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flockLabel="Select Flock"
        allFlocksLabel="All Layer Flocks (All Sheds)"
        filterLayersOnly={true}
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        totalCount={eggProductions.length}
        filteredCount={filtered.length}
        itemTypeLabel="production logs"
        onResetFilters={handleResetFilters}
      />

      {/* Production Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flock / Shed</th>
                  <th className="py-3 px-4">Morning (A.M.)</th>
                  <th className="py-3 px-4">Evening (P.M.)</th>
                  <th className="py-3 px-4">Total Production</th>
                  <th className="py-3 px-4">Commercial Trays</th>
                  <th className="py-3 px-4">Cracked / Reject</th>
                  <th className="py-3 px-4">Laying %</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{entry.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{entry.flockName}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.morningEggs.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.eveningEggs.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-800">{entry.totalEggs.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{entry.cleanTrays} Trays</td>
                    <td className="py-3 px-4 font-medium text-rose-600">{entry.damagedEggs}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {entry.layingRatePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No egg production records match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting the flock selector or expanding the date range.</p>
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
    </div>
  );
};
