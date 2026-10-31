import React, { useState, useEffect } from 'react';
import { Egg, Wheat, HeartPulse, X, Calendar, CheckCircle2, Layers, AlertTriangle, TrendingUp } from 'lucide-react';
import { Flock, EggProduction, FeedConsumption, MortalityLog } from '../types/farm';
import { UIInput, UISelect, UITextarea, UIButton } from './ui';

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
  const [flockId, setFlockId] = useState('');
  const [recordDate, setRecordDate] = useState('2026-10-24');

  // Egg fields
  const [morning, setMorning] = useState(12000);
  const [evening, setEvening] = useState(8500);
  const [damaged, setDamaged] = useState(25);
  const [eggNotes, setEggNotes] = useState('');

  // Feed fields
  const [feedType, setFeedType] = useState('Layer Phase-2 Mash (Feed 13)');
  const [feedQuantity, setFeedQuantity] = useState(2500);
  const [waterLiters, setWaterLiters] = useState(0);

  // Mortality fields
  const [deaths, setDeaths] = useState(4);
  const [cause, setCause] = useState('Heat stress tolerance / natural');
  const [symptoms, setSymptoms] = useState('');

  // Submission feedback
  const [isSaved, setIsSaved] = useState(false);

  // Ensure valid flock selected when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
      if (flocks.length > 0) {
        if (!flockId || !flocks.some((f) => f.id === flockId)) {
          setFlockId(flocks[0].id);
        }
      }
      // Default to 24 Oct 2026 or today's date
      const todayIso = new Date().toISOString().split('T')[0];
      setRecordDate(todayIso >= '2026-10-24' ? todayIso : '2026-10-24');
    }
  }, [isOpen, flocks]);

  if (!isOpen || !type) return null;

  const selectedFlock = flocks.find((f) => f.id === flockId) || flocks[0] || {
    id: '8',
    name: 'Unit 1',
    currentCount: 24786,
    shedNumber: 'Shed 1',
  };

  // Egg live calculations
  const totalEggs = Math.max(0, (Number(morning) || 0) + (Number(evening) || 0));
  const cleanEggs = Math.max(0, totalEggs - (Number(damaged) || 0));
  const cleanTrays = Math.floor(cleanEggs / 30);
  const birdCount = selectedFlock.currentCount || 25000;
  const layingRate = birdCount > 0 ? ((totalEggs / birdCount) * 100).toFixed(1) : '0.0';
  const brokenRate = totalEggs > 0 ? (((Number(damaged) || 0) / totalEggs) * 100).toFixed(2) : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = recordDate || '2026-10-24';

    if (type === 'egg') {
      const newEggRecord: EggProduction = {
        id: `egg-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        morningEggs: Number(morning) || 0,
        eveningEggs: Number(evening) || 0,
        totalEggs,
        damagedEggs: Number(damaged) || 0,
        cleanTrays,
        layingRatePercent: Number(layingRate),
        notes: eggNotes.trim() || undefined,
      };

      onAddEgg(newEggRecord);
    } else if (type === 'feed') {
      const birdCount = selectedFlock.currentCount || 25000;
      const gramsPerBird = Number(((Number(feedQuantity) * 1000) / birdCount).toFixed(1));
      const bags = Math.round((Number(feedQuantity) || 0) / 50);
      onAddFeed({
        id: `feed-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        feedType,
        feedQuantityKg: Number(feedQuantity) || 0,
        bags,
        gramsPerBird: isNaN(gramsPerBird) ? 118 : gramsPerBird,
        waterIntakeLiters: Number(waterLiters) || 0,
        fcrEstimate: 1.95,
      });
    } else if (type === 'mortality') {
      onAddMortality({
        id: `mort-${Date.now()}`,
        flockId: selectedFlock.id,
        flockName: selectedFlock.name,
        date: today,
        count: Number(deaths) || 0,
        cause,
        symptoms,
        recordedBy: 'Shift Supervisor',
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            {type === 'egg' && (
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Egg className="w-5 h-5" />
              </div>
            )}
            {type === 'feed' && (
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Wheat className="w-5 h-5" />
              </div>
            )}
            {type === 'mortality' && (
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <HeartPulse className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-black text-slate-900 capitalize">
                {type === 'egg' ? 'Record Daily Egg Collection' : type === 'feed' ? 'Record Daily Feed & Water' : 'Record Flock Mortality'}
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'egg'
                  ? 'Add shift collection to the egg production ledger'
                  : 'Enter daily record for flock monitoring'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Record Saved Successfully!
            </h3>
            <p className="text-xs text-slate-500">
              {type === 'egg'
                ? `${totalEggs.toLocaleString()} eggs (${cleanTrays.toLocaleString()} trays) logged for ${selectedFlock.name}.`
                : 'Log recorded and synced to farm ledger.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <UISelect
                label="Target Unit / Shed"
                value={flockId}
                onChange={(e) => setFlockId(e.target.value)}
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.shedNumber || `Shed ${f.id}`}) — {(f.currentCount || f.initialCount || 25000).toLocaleString()} Birds
                  </option>
                ))}
              </UISelect>

              <UIInput
                label="Collection Date"
                type="date"
                required
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>

            {type === 'egg' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <UIInput
                      label="Morning Shift (A.M. Eggs)"
                      type="number"
                      min="0"
                      required
                      value={morning}
                      onChange={(e) => setMorning(Number(e.target.value))}
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ≈ {Math.floor(morning / 30)} trays
                    </span>
                  </div>
                  <div>
                    <UIInput
                      label="Evening Shift (P.M. Eggs)"
                      type="number"
                      min="0"
                      required
                      value={evening}
                      onChange={(e) => setEvening(Number(e.target.value))}
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ≈ {Math.floor(evening / 30)} trays
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <UIInput
                    label="Broken / Cracked Eggs"
                    type="number"
                    min="0"
                    value={damaged}
                    onChange={(e) => setDamaged(Number(e.target.value))}
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Packaging Standard
                    </label>
                    <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs font-semibold">
                      30 Eggs/Tray • 1 Carton = 360 Eggs
                    </div>
                  </div>
                </div>

                {/* Live Real-Time Production Calculation Box */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-amber-200/60 pb-1.5">
                    <span className="flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                      <span>Live Production Calculation Preview</span>
                    </span>
                    <span className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">
                      {layingRate}% Lay Rate
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">Total Eggs</span>
                      <span className="font-mono font-black text-amber-900 text-sm">
                        {totalEggs.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">Market Ready</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        {(cleanTrays / 12).toFixed(1)} <span className="text-xs font-bold text-slate-500">Ctn</span>
                      </span>
                      <span className="text-[9px] text-slate-400 block">({cleanTrays.toLocaleString()} trays)</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">Breakage</span>
                      <span className="font-mono font-bold text-rose-600 text-xs">
                        {damaged} ({brokenRate}%)
                      </span>
                    </div>
                  </div>
                </div>

                <UIInput
                  label="Notes / Supervisor Remarks (Optional)"
                  type="text"
                  placeholder="e.g. Standard grade, Lohmann layer shift A, no anomalies"
                  value={eggNotes}
                  onChange={(e) => setEggNotes(e.target.value)}
                />
              </>
            )}

            {type === 'feed' && (
              <>
                <UIInput
                  label="Feed Formulation / Brand"
                  type="text"
                  value={feedType}
                  onChange={(e) => setFeedType(e.target.value)}
                  placeholder="e.g. Layer Phase-2 Mash"
                />
                <div className="grid grid-cols-2 gap-3">
                  <UIInput
                    label="Feed Weight (Kg)"
                    type="number"
                    min="0"
                    required
                    value={feedQuantity}
                    onChange={(e) => setFeedQuantity(Number(e.target.value))}
                  />
                  <UIInput
                    label="Water Intake (Liters)"
                    type="number"
                    min="0"
                    required
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(Number(e.target.value))}
                  />
                </div>
              </>
            )}

            {type === 'mortality' && (
              <>
                <UIInput
                  label="Number of Deaths"
                  type="number"
                  min="1"
                  required
                  value={deaths}
                  onChange={(e) => setDeaths(Number(e.target.value))}
                />
                <UIInput
                  label="Cause of Death / Finding"
                  type="text"
                  required
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  placeholder="e.g. Heat stress tolerance / natural"
                />
                <UITextarea
                  label="Clinical Symptoms / Notes"
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Swollen wattles, dehydration"
                />
              </>
            )}

            <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
              <UIButton
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </UIButton>
              <UIButton
                type="submit"
                variant={type === 'mortality' ? 'danger' : type === 'feed' ? 'amber' : 'primary'}
                icon={Egg}
              >
                Save Record to Ledger
              </UIButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
