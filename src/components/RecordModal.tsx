import React, { useState } from 'react';
import { Egg, Wheat, HeartPulse, X } from 'lucide-react';
import { Flock, EggProduction, FeedConsumption, MortalityLog } from '../types/farm';

interface RecordModalProps {
  type: 'egg' | 'mortality' | 'feed' | null;
  flocks: Flock[];
  isOpen: boolean;
  onClose: () => void;
  onAddEgg: (egg: EggProduction) => void;
  onAddFeed: (feed: FeedConsumption) => void;
  onAddMortality: (mortality: MortalityLog) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  type,
  flocks,
  isOpen,
  onClose,
  onAddEgg,
  onAddFeed,
  onAddMortality,
}) => {
  if (!isOpen || !type) return null;

  const defaultFlock = flocks[0]?.id || '';
  const [flockId, setFlockId] = useState(defaultFlock);

  // Egg fields
  const [morning, setMorning] = useState(7500);
  const [evening, setEvening] = useState(4500);
  const [damaged, setDamaged] = useState(120);

  // Feed fields
  const [feedType, setFeedType] = useState('Layer Phase-2 Mash');
  const [feedQuantity, setFeedQuantity] = useState(1500);
  const [waterLiters, setWaterLiters] = useState(3000);

  // Mortality fields
  const [deaths, setDeaths] = useState(4);
  const [cause, setCause] = useState('Heat stress tolerance / natural');
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFlock = flocks.find((f) => f.id === flockId) || flocks[0];
    const today = new Date().toISOString().split('T')[0];

    if (type === 'egg') {
      const total = morning + evening;
      const clean = total - damaged;
      const trays = Math.floor(clean / 30);
      const layingRate = ((total / (selectedFlock.currentCount || 1)) * 100).toFixed(1);

      onAddEgg({
        id: `egg-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        morningEggs: morning,
        eveningEggs: evening,
        totalEggs: total,
        damagedEggs: damaged,
        cleanTrays: trays,
        layingRatePercent: Number(layingRate),
      });
    } else if (type === 'feed') {
      const gramsPerBird = ((feedQuantity * 1000) / (selectedFlock.currentCount || 1)).toFixed(1);
      onAddFeed({
        id: `feed-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        feedType,
        feedQuantityKg: feedQuantity,
        gramsPerBird: Number(gramsPerBird),
        waterIntakeLiters: waterLiters,
        fcrEstimate: 2.1,
      });
    } else if (type === 'mortality') {
      onAddMortality({
        id: `mort-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        count: deaths,
        cause,
        symptoms,
        recordedBy: 'Shift Supervisor',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            {type === 'egg' && <Egg className="w-5 h-5 text-amber-500" />}
            {type === 'feed' && <Wheat className="w-5 h-5 text-amber-600" />}
            {type === 'mortality' && <HeartPulse className="w-5 h-5 text-rose-600" />}
            <h2 className="text-base font-bold text-slate-900 capitalize">Record Daily {type}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Select Flock</label>
            <select
              value={flockId}
              onChange={(e) => setFlockId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-medium"
            >
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.currentCount.toLocaleString()} birds)
                </option>
              ))}
            </select>
          </div>

          {type === 'egg' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Morning Collection</label>
                  <input
                    type="number"
                    min="0"
                    value={morning}
                    onChange={(e) => setMorning(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Evening Collection</label>
                  <input
                    type="number"
                    min="0"
                    value={evening}
                    onChange={(e) => setEvening(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Damaged / Cracked Eggs</label>
                <input
                  type="number"
                  min="0"
                  value={damaged}
                  onChange={(e) => setDamaged(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </>
          )}

          {type === 'feed' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Feed Type / Brand</label>
                <input
                  type="text"
                  value={feedType}
                  onChange={(e) => setFeedType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Feed Quantity (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={feedQuantity}
                    onChange={(e) => setFeedQuantity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Water Intake (Liters)</label>
                  <input
                    type="number"
                    min="0"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'mortality' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Number of Deaths</label>
                <input
                  type="number"
                  min="1"
                  value={deaths}
                  onChange={(e) => setDeaths(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cause of Death</label>
                <input
                  type="text"
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Symptoms / Notes</label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Swollen wattles, dehydration"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
