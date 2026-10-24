import React, { useState, useMemo } from 'react';
import { FileBarChart2, Printer, Download, CheckCircle, TrendingUp, Award, Egg, Wheat, HeartPulse, RotateCcw } from 'lucide-react';
import { Flock, EggProduction, MortalityLog, FeedConsumption } from '../types/farm';
import { FilterBar } from './FilterBar';

interface ReportsViewProps {
  flocks: Flock[];
  eggProductions: EggProduction[];
  mortalityLogs: MortalityLog[];
  consumptionLogs: FeedConsumption[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  flocks,
  eggProductions,
  mortalityLogs,
  consumptionLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter eggs
  const filteredEggs = useMemo(() => {
    return eggProductions.filter((e) => {
      const matchFlock = selectedFlock === 'all' || e.flockId === selectedFlock;
      let matchDate = true;
      if (startDate && e.date < startDate) matchDate = false;
      if (endDate && e.date > endDate) matchDate = false;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' || e.flockName.toLowerCase().includes(q) || e.date.includes(q);
      return matchFlock && matchDate && matchSearch;
    });
  }, [eggProductions, selectedFlock, startDate, endDate, searchTerm]);

  // Filter mortality
  const filteredMortality = useMemo(() => {
    return mortalityLogs.filter((m) => {
      const matchFlock = selectedFlock === 'all' || m.flockId === selectedFlock;
      let matchDate = true;
      if (startDate && m.date < startDate) matchDate = false;
      if (endDate && m.date > endDate) matchDate = false;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' || m.flockName.toLowerCase().includes(q) || m.cause.toLowerCase().includes(q);
      return matchFlock && matchDate && matchSearch;
    });
  }, [mortalityLogs, selectedFlock, startDate, endDate, searchTerm]);

  // Filter feed
  const filteredFeed = useMemo(() => {
    return consumptionLogs.filter((c) => {
      const matchFlock = selectedFlock === 'all' || c.flockId === selectedFlock;
      let matchDate = true;
      if (startDate && c.date < startDate) matchDate = false;
      if (endDate && c.date > endDate) matchDate = false;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' || c.flockName.toLowerCase().includes(q) || c.feedType.toLowerCase().includes(q);
      return matchFlock && matchDate && matchSearch;
    });
  }, [consumptionLogs, selectedFlock, startDate, endDate, searchTerm]);

  // Aggregates
  const totalEggs = filteredEggs.reduce((acc, curr) => acc + curr.totalEggs, 0);
  const totalTrays = filteredEggs.reduce((acc, curr) => acc + curr.cleanTrays, 0);
  const totalDamaged = filteredEggs.reduce((acc, curr) => acc + curr.damagedEggs, 0);
  const avgLayingRate =
    filteredEggs.length > 0
      ? (filteredEggs.reduce((acc, curr) => acc + curr.layingRatePercent, 0) / filteredEggs.length).toFixed(1)
      : '0.0';

  const totalDeaths = filteredMortality.reduce((acc, curr) => acc + curr.count, 0);
  const totalFeedKg = filteredFeed.reduce((acc, curr) => acc + curr.feedQuantityKg, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Date,Flock,Total Eggs,Damaged,Trays,Laying Rate\n'];
    const rows = filteredEggs.map(
      (e) => `${e.date},"${e.flockName}",${e.totalEggs},${e.damagedEggs},${e.cleanTrays},${e.layingRatePercent}%\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Audit_Report_${startDate || 'all'}_to_${endDate || 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFlock('all');
    setStartDate('');
    setEndDate('');
  };

  const filteredFlocks = flocks.filter(
    (f) => selectedFlock === 'all' || f.id === selectedFlock
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileBarChart2 className="w-5 h-5 text-emerald-600" />
            <span>Farm Analytics & Audit Reports</span>
          </h1>
          <p className="text-xs text-slate-500">
            Generate weekly production reports, layer performance curves, and feed efficiency benchmarks.
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
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Flock & Date Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search audit records or flock..."
        flocks={flocks}
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flockLabel="Select Flock"
        allFlocksLabel="All Flocks (All Sheds)"
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        totalCount={eggProductions.length}
        filteredCount={filteredEggs.length}
        itemTypeLabel="audit records"
        onResetFilters={handleResetFilters}
      />

      {/* Filtered Period KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reported Eggs</span>
            <Egg className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalEggs.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{totalTrays.toLocaleString()} Commercial Trays</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Laying Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{avgLayingRate}%</div>
          <div className="text-xs text-slate-500 mt-1">{totalDamaged} rejection / cracked</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Feed Consumed</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalFeedKg.toLocaleString()} kg</div>
          <div className="text-xs text-slate-500 mt-1">~{Math.round(totalFeedKg / 50)} bags total</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Mortality</span>
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{totalDeaths} birds</div>
          <div className="text-xs text-slate-500 mt-1">
            Across {filteredFlocks.length} flock{filteredFlocks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Flock Comparison Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Active Flock Performance Benchmark (Lohmann vs Hy-Line)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredFlocks.map((flock) => (
            <div key={flock.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-900">{flock.name}</span>
                  <p className="text-[11px] text-slate-500">{flock.shedNumber}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {flock.purpose}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Current Population:</span>
                  <span className="font-bold text-slate-900">{flock.currentCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flock Age:</span>
                  <span className="font-bold text-slate-900">{flock.ageWeeks} Wks</span>
                </div>
                <div className="flex justify-between">
                  <span>Breed Standard:</span>
                  <span className="font-semibold text-slate-800">{flock.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Livability:</span>
                  <span className="font-bold text-emerald-700">
                    {((flock.currentCount / flock.initialCount) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Period Audit Log Breakdown</h3>
            <p className="text-xs text-slate-500">Production and efficiency metrics for selected range</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {filteredEggs.length} logs
          </span>
        </div>
        {filteredEggs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flock</th>
                  <th className="py-3 px-4">Total Production</th>
                  <th className="py-3 px-4">Clean Trays</th>
                  <th className="py-3 px-4">Damaged</th>
                  <th className="py-3 px-4">Laying %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEggs.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{e.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{e.flockName}</td>
                    <td className="py-3 px-4 font-bold text-emerald-800">{e.totalEggs.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{e.cleanTrays} Trays</td>
                    <td className="py-3 px-4 text-rose-600 font-medium">{e.damagedEggs}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{e.layingRatePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No audit records found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
