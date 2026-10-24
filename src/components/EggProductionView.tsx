import React, { useState } from 'react';
import { Egg, Plus, Calendar, Download, Filter, Search } from 'lucide-react';
import { EggProduction, Flock } from '../types/farm';

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

  const filtered = eggProductions.filter((item) => {
    const matchesSearch =
      item.flockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);
    const matchesFlock = selectedFlock === 'all' || item.flockId === selectedFlock;
    return matchesSearch && matchesFlock;
  });

  const totalEggs = filtered.reduce((acc, curr) => acc + curr.totalEggs, 0);
  const totalTrays = filtered.reduce((acc, curr) => acc + curr.cleanTrays, 0);
  const totalDamaged = filtered.reduce((acc, curr) => acc + curr.damagedEggs, 0);

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
            onClick={() => onOpenRecordModal('egg')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Egg Collection</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Collected Eggs</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalEggs.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">High grade collection</div>
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search flock or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={selectedFlock}
            onChange={(e) => setSelectedFlock(e.target.value)}
            aria-label="Filter by Flock"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Layer Flocks</option>
            {flocks.filter(f => f.purpose === 'Layers').map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Production Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Flock ID / Name</th>
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
      </div>
    </div>
  );
};
