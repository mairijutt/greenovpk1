import React, { useState } from 'react';
import { Layers, Plus, Calendar, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Flock, Farm } from '../types/farm';

interface FlocksViewProps {
  flocks: Flock[];
  farms: Farm[];
  onAddFlock: (flock: Flock) => void;
}

export const FlocksView: React.FC<FlocksViewProps> = ({ flocks, farms, onAddFlock }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFlock, setNewFlock] = useState({
    name: '',
    farmId: 'farm-1',
    shedNumber: 'Shed 03',
    breed: 'Lohmann Brown-Classic',
    purpose: 'Layers' as const,
    initialCount: 10000,
    ageWeeks: 1,
    targetFCR: 2.1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlock.name) return;
    const flock: Flock = {
      id: `flock-${Date.now()}`,
      name: newFlock.name,
      farmId: newFlock.farmId,
      shedNumber: newFlock.shedNumber,
      breed: newFlock.breed,
      purpose: newFlock.purpose,
      initialCount: Number(newFlock.initialCount),
      currentCount: Number(newFlock.initialCount),
      ageWeeks: Number(newFlock.ageWeeks),
      startDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      targetFCR: Number(newFlock.targetFCR),
    };
    onAddFlock(flock);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Flocks & Shed Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Monitor active layer and broiler batches, age in weeks, shed capacity, and bird retention rates.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Flock Batch</span>
        </button>
      </div>

      {/* Flocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {flocks.map((flock) => {
          const retentionRate = ((flock.currentCount / flock.initialCount) * 100).toFixed(1);
          const farm = farms.find((f) => f.id === flock.farmId);

          return (
            <div key={flock.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {flock.purpose}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                    {flock.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">{flock.name}</h3>
                <p className="text-xs text-slate-500">
                  {flock.shedNumber} • {farm?.name || 'Main Unit'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Breed:</span>
                    <span className="font-semibold text-slate-900">{flock.breed}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Age:</span>
                    <span className="font-semibold text-slate-900">{flock.ageWeeks} Weeks</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Placement Date:</span>
                    <span className="font-mono text-slate-700">{flock.startDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Target FCR:</span>
                    <span className="font-semibold text-emerald-700">{flock.targetFCR || 2.1}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Bird Count: {flock.currentCount.toLocaleString()}</span>
                    <span>{retentionRate}% alive</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${retentionRate}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    Started with {flock.initialCount.toLocaleString()} chicks
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Flock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-4">Register New Flock Batch</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Flock Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flock L-25C (Spring Layers)"
                  value={newFlock.name}
                  onChange={(e) => setNewFlock({ ...newFlock, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purpose</label>
                  <select
                    value={newFlock.purpose}
                    onChange={(e) => setNewFlock({ ...newFlock, purpose: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  >
                    <option value="Layers">Layers (Eggs)</option>
                    <option value="Broilers">Broilers (Meat)</option>
                    <option value="Breeders">Breeders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Breed</label>
                  <input
                    type="text"
                    value={newFlock.breed}
                    onChange={(e) => setNewFlock({ ...newFlock, breed: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Chicks Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newFlock.initialCount}
                    onChange={(e) => setNewFlock({ ...newFlock, initialCount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    value={newFlock.ageWeeks}
                    onChange={(e) => setNewFlock({ ...newFlock, ageWeeks: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer hover:bg-emerald-500"
                >
                  Save Flock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
