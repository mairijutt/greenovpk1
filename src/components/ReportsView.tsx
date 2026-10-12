import React from 'react';
import { FileBarChart2, Printer, Download, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { Flock, EggProduction, MortalityLog, FeedConsumption } from '../types/farm';

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
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Date,Flock,Total Eggs,Damaged,Trays,Laying Rate\n'];
    const rows = eggProductions.map(
      (e) => `${e.date},${e.flockName},${e.totalEggs},${e.damagedEggs},${e.cleanTrays},${e.layingRatePercent}%\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenOva_Production_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Flock Comparison Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Active Flock Performance Benchmark (Lohmann vs Hy-Line)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flocks.map((flock) => (
            <div key={flock.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-900">{flock.name}</span>
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
    </div>
  );
};
