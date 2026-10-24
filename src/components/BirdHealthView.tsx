import React, { useState, useMemo } from 'react';
import { HeartPulse, ShieldAlert, Plus, CheckCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { MortalityLog, VaccineLog, Flock } from '../types/farm';
import { FilterBar } from './FilterBar';

interface BirdHealthViewProps {
  mortalityLogs: MortalityLog[];
  vaccines: VaccineLog[];
  flocks: Flock[];
  onOpenRecordModal: (type: 'mortality') => void;
  onToggleVaccine: (id: string) => void;
}

export const BirdHealthView: React.FC<BirdHealthViewProps> = ({
  mortalityLogs,
  vaccines,
  flocks,
  onOpenRecordModal,
  onToggleVaccine,
}) => {
  const [activeTab, setActiveTab] = useState<'mortality' | 'vaccines'>('mortality');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter mortality logs
  const filteredMortality = useMemo(() => {
    return mortalityLogs.filter((log) => {
      const matchesFlock = selectedFlock === 'all' || log.flockId === selectedFlock;
      let matchesDate = true;
      if (startDate && log.date < startDate) matchesDate = false;
      if (endDate && log.date > endDate) matchesDate = false;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        log.flockName.toLowerCase().includes(q) ||
        log.cause.toLowerCase().includes(q) ||
        (log.symptoms && log.symptoms.toLowerCase().includes(q)) ||
        log.recordedBy.toLowerCase().includes(q) ||
        log.date.includes(q);

      return matchesFlock && matchesDate && matchesSearch;
    });
  }, [mortalityLogs, selectedFlock, startDate, endDate, searchTerm]);

  // Filter vaccine logs
  const filteredVaccines = useMemo(() => {
    return vaccines.filter((v) => {
      const matchesFlock = selectedFlock === 'all' || v.flockId === selectedFlock;
      let matchesDate = true;
      if (v.administeredDate) {
        if (startDate && v.administeredDate < startDate) matchesDate = false;
        if (endDate && v.administeredDate > endDate) matchesDate = false;
      }

      const flockObj = flocks.find((f) => f.id === v.flockId);
      const flockName = flockObj ? flockObj.name : '';

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        v.vaccineName.toLowerCase().includes(q) ||
        flockName.toLowerCase().includes(q) ||
        v.method.toLowerCase().includes(q) ||
        (v.vetNotes && v.vetNotes.toLowerCase().includes(q));

      return matchesFlock && matchesDate && matchesSearch;
    });
  }, [vaccines, flocks, selectedFlock, startDate, endDate, searchTerm]);

  const totalDeaths = filteredMortality.reduce((acc, curr) => acc + curr.count, 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFlock('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <span>Health & Bio-Security Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Log daily mortality causes, vet autopsies, and manage scheduled vaccination programs per flock.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenRecordModal('mortality')}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Mortality</span>
          </button>
        </div>
      </div>

      {/* Flock & Date Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={
          activeTab === 'mortality'
            ? 'Search causes, symptoms, supervisors...'
            : 'Search vaccines, methods, notes...'
        }
        flocks={flocks}
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flockLabel="Select Flock"
        allFlocksLabel="All Flocks (All Sheds)"
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        totalCount={activeTab === 'mortality' ? mortalityLogs.length : vaccines.length}
        filteredCount={activeTab === 'mortality' ? filteredMortality.length : filteredVaccines.length}
        itemTypeLabel={activeTab === 'mortality' ? 'mortality records' : 'vaccine programs'}
        onResetFilters={handleResetFilters}
      />

      {/* Tabs Switcher */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('mortality')}
          className={`pb-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'mortality'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Mortality Records ({filteredMortality.length})
        </button>
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`pb-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'vaccines'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vaccination & Preventive Care ({filteredVaccines.length})
        </button>
      </div>

      {activeTab === 'mortality' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">Recent Post-Mortem & Death Logs</span>
            <span className="text-xs font-bold text-rose-600">Total Recorded in Period: {totalDeaths} birds</span>
          </div>
          {filteredMortality.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Flock / Shed</th>
                    <th className="py-3 px-4">Deaths</th>
                    <th className="py-3 px-4">Identified Cause</th>
                    <th className="py-3 px-4">Clinical Symptoms / Autopsy</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMortality.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.flockName}</td>
                      <td className="py-3 px-4 font-extrabold text-rose-600">{log.count}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.cause}</td>
                      <td className="py-3 px-4 text-slate-500 italic">{log.symptoms || 'None reported'}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{log.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No mortality logs found for this filter</h3>
              <p className="text-xs text-slate-500 mt-1">Zero mortality reported within selected flock and dates.</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredVaccines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaccines.map((v) => {
                const flockName = flocks.find((f) => f.id === v.flockId)?.name || 'Batch';
                return (
                  <div key={v.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Week {v.scheduledWeek} • {flockName}
                      </span>
                      <button
                        onClick={() => onToggleVaccine(v.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 cursor-pointer transition-colors ${
                          v.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {v.status === 'Completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Administered</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pending Due</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{v.vaccineName}</h3>
                    <p className="text-xs text-slate-500 mt-1">Method: {v.method}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      {v.administeredDate ? (
                        <span className="text-emerald-700 font-medium">Done on {v.administeredDate}</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Scheduled for Week {v.scheduledWeek}</span>
                      )}
                      {v.vetNotes && <p className="text-[11px] text-slate-400 mt-1 italic">{v.vetNotes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No vaccination schedule for this filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting the flock selector or dates.</p>
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
      )}
    </div>
  );
};
