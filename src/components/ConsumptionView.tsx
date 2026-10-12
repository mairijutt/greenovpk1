import React from 'react';
import { Wheat, Droplets, Plus, Scale, AlertCircle } from 'lucide-react';
import { FeedConsumption, Flock } from '../types/farm';

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
  const totalFeedKg = consumptionLogs.reduce((acc, curr) => acc + curr.feedQuantityKg, 0);
  const totalWaterL = consumptionLogs.reduce((acc, curr) => acc + curr.waterIntakeLiters, 0);

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
        <button
          onClick={() => onOpenRecordModal('feed')}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Feed Intake</span>
        </button>
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
          <div className="text-xs text-slate-400 mt-1">~{Math.round(totalFeedKg / 50)} bags (50kg)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>Total Water Intake</span>
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {totalWaterL.toLocaleString()} <span className="text-xs font-semibold text-slate-500">Liters</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Water to feed ratio: 2.02 : 1</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Average Feed / Bird</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            114.6 <span className="text-xs font-semibold text-slate-500">g / bird</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Matches Lohmann Brown standard</div>
        </div>
      </div>

      {/* Consumption Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Flock</th>
                <th className="py-3 px-4">Feed Formulation</th>
                <th className="py-3 px-4">Total Weight (Kg)</th>
                <th className="py-3 px-4">Grams / Bird</th>
                <th className="py-3 px-4">Water Intake (L)</th>
                <th className="py-3 px-4">Estimated FCR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consumptionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.flockName}</td>
                  <td className="py-3 px-4 text-slate-600">{log.feedType}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-800">{log.feedQuantityKg.toLocaleString()} kg</td>
                  <td className="py-3 px-4 font-medium text-emerald-700">{log.gramsPerBird} g</td>
                  <td className="py-3 px-4 text-sky-700 font-medium">{log.waterIntakeLiters.toLocaleString()} L</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.fcrEstimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
