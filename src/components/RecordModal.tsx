import React, { useState, useEffect } from 'react';
import { Egg, Wheat, HeartPulse, X, AlertCircle } from 'lucide-react';
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
  onNavigateTab?: (tab: string) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  type,
  flocks,
  isOpen,
  onClose,
  onAddEgg,
  onAddFeed,
  onAddMortality,
  onNavigateTab,
}) => {
  const [flockId, setFlockId] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Egg fields matching user screenshot & comprehensive poultry options
  const [cartons, setCartons] = useState<number | ''>(0);
  const [trays, setTrays] = useState<number | ''>(0);
  const [looseEggs, setLooseEggs] = useState<number | ''>(0);
  const [damaged, setDamaged] = useState<number | ''>(0);
  const [avgWeightGrams, setAvgWeightGrams] = useState<number | ''>(0);
  const [eggGrade, setEggGrade] = useState<string>('');
  const [collectionShift, setCollectionShift] = useState<'All-Day' | 'Morning' | 'Evening'>('All-Day');
  const [morning, setMorning] = useState<number>(0);
  const [evening, setEvening] = useState<number>(0);
  const [eggNotes, setEggNotes] = useState<string>('');

  // Feed fields
  const [feedType, setFeedType] = useState('');
  const [feedQuantity, setFeedQuantity] = useState<number | ''>(0);
  const [waterLiters, setWaterLiters] = useState<number | ''>(0);

  // Mortality fields
  const [deaths, setDeaths] = useState<number | ''>(0);
  const [cause, setCause] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Ensure flock resets to placeholder and form fields reset cleanly when modal opens
  useEffect(() => {
    if (isOpen) {
      setFlockId('');
      setFormError(null);
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setRecordDate(todayIso);
      if (type === 'egg') {
        setCartons(0);
        setTrays(0);
        setLooseEggs(0);
        setDamaged(0);
        setAvgWeightGrams(0);
        setEggGrade('');
        setCollectionShift('All-Day');
        setMorning(0);
        setEvening(0);
        setEggNotes('');
      } else if (type === 'feed') {
        setFeedType('');
        setFeedQuantity(0);
        setWaterLiters(0);
      } else if (type === 'mortality') {
        setDeaths(0);
        setCause('');
        setSymptoms('');
      }
    }
  }, [isOpen, type]);

  // Egg live calculations
  const totalEggs = Math.max(
    0,
    (Number(cartons) || 0) * 360 + (Number(trays) || 0) * 30 + (Number(looseEggs) || 0)
  );

  // Keep morning/evening shifts synchronized with total produced
  useEffect(() => {
    if (collectionShift === 'All-Day') {
      const am = Math.round(totalEggs * 0.62);
      const pm = Math.max(0, totalEggs - am);
      setMorning(am);
      setEvening(pm);
    } else if (collectionShift === 'Morning') {
      setMorning(totalEggs);
      setEvening(0);
    } else if (collectionShift === 'Evening') {
      setMorning(0);
      setEvening(totalEggs);
    }
  }, [cartons, trays, looseEggs, collectionShift, totalEggs]);

  if (!isOpen || !type) return null;

  const matchedFlock = flocks.find((f) => String(f.id) === String(flockId));
  const selectedFlock = matchedFlock || flocks[0] || {
    id: '8',
    name: 'Unit 1',
    currentCount: 24786,
    shedNumber: 'Shed 1',
  };

  const cleanEggs = Math.max(0, totalEggs - (Number(damaged) || 0));
  const cleanTrays = Math.floor(cleanEggs / 30);
  const cleanCartons = (cleanTrays / 12).toFixed(1);
  const birdCount = matchedFlock ? matchedFlock.currentCount || 25000 : selectedFlock.currentCount || 25000;
  const layingRate = matchedFlock && birdCount > 0 ? ((totalEggs / birdCount) * 100).toFixed(1) : '0.0';
  const brokenRate = totalEggs > 0 ? (((Number(damaged) || 0) / totalEggs) * 100).toFixed(2) : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recordDate) {
      setFormError('Please select a record date.');
      return;
    }
    if (!flockId || !matchedFlock) {
      setFormError('Please select a flock before saving.');
      return;
    }

    if (type === 'egg') {
      if (totalEggs <= 0) {
        setFormError('Please enter egg production (at least 1 carton, tray, or egg). Zero production cannot be saved.');
        return;
      }
      if (damaged === '' || Number(damaged) < 0) {
        setFormError('Please enter Broken/Damaged Eggs count (enter 0 if none).');
        return;
      }
      if (Number(damaged) > totalEggs) {
        setFormError('Broken/Damaged Eggs cannot exceed Total Produced eggs.');
        return;
      }
      if (!avgWeightGrams || Number(avgWeightGrams) <= 0) {
        setFormError('Please enter Avg. Egg Weight (g) greater than 0.');
        return;
      }
      if (!eggGrade) {
        setFormError('Please select an Egg Grade.');
        return;
      }

      const newEggRecord: EggProduction = {
        id: `egg-${Date.now()}`,
        flockId: matchedFlock.id,
        flockName: matchedFlock.name,
        date: recordDate,
        morningEggs: morning,
        eveningEggs: evening,
        totalEggs,
        damagedEggs: Number(damaged) || 0,
        cleanTrays,
        layingRatePercent: Number(layingRate),
        cartons: Number(cartons) || Math.floor(totalEggs / 360),
        looseEggs: Number(looseEggs) || 0,
        eggGrade,
        avgWeightGrams: Number(avgWeightGrams),
        notes: eggNotes.trim() || undefined,
      };

      onAddEgg(newEggRecord);
    } else if (type === 'feed') {
      if (!feedType.trim()) {
        setFormError('Please enter the Feed Formulation / Brand.');
        return;
      }
      if (!feedQuantity || Number(feedQuantity) <= 0) {
        setFormError('Please enter Feed Weight (Kg) greater than 0.');
        return;
      }
      if (waterLiters === '' || Number(waterLiters) <= 0) {
        setFormError('Please enter Water Intake (Liters) greater than 0.');
        return;
      }

      const fBirdCount = matchedFlock.currentCount || 25000;
      const qtyKg = Number(feedQuantity);
      const gramsPerBird = Number(((qtyKg * 1000) / fBirdCount).toFixed(1));
      const bags = Math.round(qtyKg / 50);
      onAddFeed({
        id: `feed-${Date.now()}`,
        flockId: matchedFlock.id,
        flockName: matchedFlock.name,
        date: recordDate,
        feedType: feedType.trim(),
        feedQuantityKg: qtyKg,
        bags,
        gramsPerBird: isNaN(gramsPerBird) ? 118 : gramsPerBird,
        waterIntakeLiters: Number(waterLiters),
        fcrEstimate: 1.95,
      });
    } else if (type === 'mortality') {
      if (!deaths || Number(deaths) < 1) {
        setFormError('Please enter Number of Deaths (at least 1).');
        return;
      }
      if (!cause.trim()) {
        setFormError('Please enter the Cause of Death / Finding.');
        return;
      }

      onAddMortality({
        id: `mort-${Date.now()}`,
        flockId: matchedFlock.id,
        flockName: matchedFlock.name,
        date: recordDate,
        count: Number(deaths),
        cause: cause.trim(),
        symptoms: symptoms.trim(),
        recordedBy: 'Shift Supervisor',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150 overflow-hidden my-auto ${
          type === 'egg' ? 'max-w-3xl sm:max-w-4xl w-full p-6 sm:p-8' : 'max-w-lg w-full p-6'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {type === 'egg'
                ? 'Production Details'
                : type === 'feed'
                ? 'Record Daily Feed & Water'
                : 'Record Flock Mortality'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {type === 'egg'
                ? 'Enter the number of eggs produced today'
                : type === 'feed'
                ? 'Nutritional intake, ration bags and water meter log'
                : 'Flock loss count and clinical cause investigation'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* EGG PRODUCTION DETAILS FORM (WIDER & ALL OPTIONS) */}
            {type === 'egg' && (
              <>
                {/* Row 1: Production Date & Select Flock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Production Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={recordDate}
                      onChange={(e) => {
                        setRecordDate(e.target.value);
                        setFormError(null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Select Flock <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={flockId}
                      onChange={(e) => {
                        setFlockId(e.target.value);
                        setFormError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                        !flockId
                          ? 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-500'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900'
                      }`}
                    >
                      <option value="" disabled>
                        Select flock
                      </option>
                      {flocks.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farmName ? `${f.farmName} — ` : ''}{f.name} ({f.shedNumber || `Shed ${f.id}`}) — {(f.currentCount || f.initialCount || 25000).toLocaleString()} Birds
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Live Cartons, Trays, Eggs and Total Produced Box */}
                <div className="p-4 sm:p-5 bg-sky-50/40 rounded-2xl border border-sky-200/80 shadow-2xs space-y-3.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        CARTONS (360)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cartons}
                        onFocus={() => {
                          if (Number(cartons) === 0) setCartons('');
                        }}
                        onBlur={() => {
                          if (cartons === '') setCartons(0);
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setCartons(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                          setFormError(null);
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block text-center font-mono">
                        ={((Number(cartons) || 0) * 360).toLocaleString()} eggs
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        TRAYS (30)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={trays}
                        onFocus={() => {
                          if (Number(trays) === 0) setTrays('');
                        }}
                        onBlur={() => {
                          if (trays === '') setTrays(0);
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setTrays(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                          setFormError(null);
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block text-center font-mono">
                        ={((Number(trays) || 0) * 30).toLocaleString()} eggs
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        EGGS
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={looseEggs}
                        onFocus={() => {
                          if (Number(looseEggs) === 0) setLooseEggs('');
                        }}
                        onBlur={() => {
                          if (looseEggs === '') setLooseEggs(0);
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setLooseEggs(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                          setFormError(null);
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block text-center font-mono">
                        ={(Number(looseEggs) || 0).toLocaleString()} eggs
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-blue-700 mb-1">
                        TOTAL PRODUCED
                      </label>
                      <div className="w-full px-3 py-2.5 bg-sky-100/70 border border-sky-300 rounded-xl font-mono text-base sm:text-lg font-black text-sky-950 text-center flex items-center justify-center shadow-2xs">
                        {totalEggs.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-blue-700 font-bold mt-1 block text-center font-mono">
                        {(totalEggs / 360).toFixed(1)} Cartons
                      </span>
                    </div>
                  </div>

                  {/* Shift Allocation Bar */}
                  <div className="pt-2.5 border-t border-sky-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Shift Allocation:
                      </span>
                      <div className="flex bg-white rounded-lg p-0.5 border border-sky-200 text-[11px] font-semibold">
                        {(['All-Day', 'Morning', 'Evening'] as const).map((shift) => (
                          <button
                            key={shift}
                            type="button"
                            onClick={() => setCollectionShift(shift)}
                            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              collectionShift === shift
                                ? 'bg-sky-600 text-white shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {shift}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 font-medium">
                      Morning (AM): <strong className="text-amber-700">{morning.toLocaleString()}</strong> • Evening (PM): <strong className="text-sky-700">{evening.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Row 3: Broken/Damaged Eggs & Avg. Egg Weight (g) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Broken/Damaged Eggs <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={damaged}
                      onFocus={() => {
                        if (Number(damaged) === 0) setDamaged('');
                      }}
                      onBlur={() => {
                        if (damaged === '') setDamaged(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDamaged(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                        setFormError(null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {brokenRate}% breakage / rejection rate
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Avg. Egg Weight (g) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={avgWeightGrams}
                      onFocus={() => {
                        if (Number(avgWeightGrams) === 0) setAvgWeightGrams('');
                      }}
                      onBlur={() => {
                        if (avgWeightGrams === '') setAvgWeightGrams(0);
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setAvgWeightGrams(raw === '' ? '' : Math.max(0, parseFloat(raw) || 0));
                        setFormError(null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Standard commercial layer weight: 58g – 65g
                    </span>
                  </div>
                </div>

                {/* Row 4: Egg Grade (Starter, Medium, Standard, Jumbo) & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Egg Grade <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={eggGrade}
                      onChange={(e) => {
                        setEggGrade(e.target.value);
                        setFormError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        !eggGrade
                          ? 'border-slate-300 text-slate-500 focus:ring-emerald-500/20 focus:border-emerald-600'
                          : 'border-slate-200 text-slate-900 focus:ring-emerald-500/20 focus:border-emerald-600'
                      }`}
                    >
                      <option value="" disabled>
                        Select egg grade
                      </option>
                      <option value="Starter">Starter</option>
                      <option value="Medium">Medium</option>
                      <option value="Standard">Standard</option>
                      <option value="Jumbo">Jumbo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Notes / Supervisor Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Standard grade, Lohmann layer shift A, clean shell"
                      value={eggNotes}
                      onChange={(e) => setEggNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                {/* Row 6: Live Calculation Performance Summary */}
                <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Market Cartons</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {cleanCartons} <span className="text-xs font-normal text-slate-500">ctn</span>
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Clean Trays (30s)</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {cleanTrays.toLocaleString()} <span className="text-xs font-normal text-slate-500">trays</span>
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Breakage Rate</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      {Number(damaged) || 0} ({brokenRate}%)
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Laying Rate</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {layingRate}%
                    </span>
                  </div>
                </div>

                {/* Row 7: Action Buttons matching user screenshot */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-2.5 bg-[#8fad8e] hover:bg-[#7ba07a] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      Save Production
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab?.('egg-production');
                    }}
                    className="w-full py-3 bg-[#4c8452] hover:bg-[#3e6f43] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-colors text-center cursor-pointer"
                  >
                    View All Production Records
                  </button>
                </div>
              </>
            )}

            {/* FEED CONSUMPTION FORM */}
            {type === 'feed' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <UISelect
                    label="Target Unit / Shed"
                    required
                    value={flockId}
                    onChange={(e) => {
                      setFlockId(e.target.value);
                      setFormError(null);
                    }}
                  >
                    <option value="" disabled>
                      Select flock
                    </option>
                    {flocks.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.farmName ? `${f.farmName} — ` : ''}{f.name} ({f.shedNumber || `Shed ${f.id}`}) — {(f.currentCount || f.initialCount || 25000).toLocaleString()} Birds
                      </option>
                    ))}
                  </UISelect>

                  <UIInput
                    label="Consumption Date"
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => {
                      setRecordDate(e.target.value);
                      setFormError(null);
                    }}
                  />
                </div>

                <UIInput
                  label="Feed Formulation / Brand"
                  type="text"
                  required
                  value={feedType}
                  onChange={(e) => {
                    setFeedType(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Layer Phase-2 Mash (Feed 13)"
                />

                <div className="grid grid-cols-2 gap-3">
                  <UIInput
                    label="Feed Weight (Kg)"
                    type="number"
                    min="0"
                    required
                    value={feedQuantity}
                    onFocus={() => {
                      if (Number(feedQuantity) === 0) setFeedQuantity('');
                    }}
                    onBlur={() => {
                      if (feedQuantity === '') setFeedQuantity(0);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setFeedQuantity(raw === '' ? '' : Math.max(0, Number(raw) || 0));
                      setFormError(null);
                    }}
                  />
                  <UIInput
                    label="Water Intake (Liters)"
                    type="number"
                    min="0"
                    required
                    value={waterLiters}
                    onFocus={() => {
                      if (Number(waterLiters) === 0) setWaterLiters('');
                    }}
                    onBlur={() => {
                      if (waterLiters === '') setWaterLiters(0);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setWaterLiters(raw === '' ? '' : Math.max(0, Number(raw) || 0));
                      setFormError(null);
                    }}
                  />
                </div>

                <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
                  <UIButton type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </UIButton>
                  <UIButton type="submit" variant="amber" icon={Wheat}>
                    Save Feed Record
                  </UIButton>
                </div>
              </>
            )}

            {/* MORTALITY LOG FORM */}
            {type === 'mortality' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <UISelect
                    label="Target Unit / Shed"
                    required
                    value={flockId}
                    onChange={(e) => {
                      setFlockId(e.target.value);
                      setFormError(null);
                    }}
                  >
                    <option value="" disabled>
                      Select flock
                    </option>
                    {flocks.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.farmName ? `${f.farmName} — ` : ''}{f.name} ({f.shedNumber || `Shed ${f.id}`}) — {(f.currentCount || f.initialCount || 25000).toLocaleString()} Birds
                      </option>
                    ))}
                  </UISelect>

                  <UIInput
                    label="Incident Date"
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => {
                      setRecordDate(e.target.value);
                      setFormError(null);
                    }}
                  />
                </div>

                <UIInput
                  label="Number of Deaths"
                  type="number"
                  min="1"
                  required
                  value={deaths}
                  onFocus={() => {
                    if (Number(deaths) === 0) setDeaths('');
                  }}
                  onBlur={() => {
                    if (deaths === '') setDeaths(0);
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDeaths(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                    setFormError(null);
                  }}
                />

                <UIInput
                  label="Cause of Death / Finding"
                  type="text"
                  required
                  value={cause}
                  onChange={(e) => {
                    setCause(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Heat stress tolerance / natural"
                />

                <UITextarea
                  label="Clinical Symptoms / Notes (Optional)"
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Swollen wattles, dehydration"
                />

                <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
                  <UIButton type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </UIButton>
                  <UIButton type="submit" variant="danger" icon={HeartPulse}>
                    Save Mortality Log
                  </UIButton>
                </div>
              </>
            )}
          </form>
      </div>
    </div>
  );
};
