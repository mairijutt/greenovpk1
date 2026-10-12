import React from 'react';
import { Boxes, AlertTriangle, Plus, CheckCircle, Package } from 'lucide-react';
import { InventoryItem } from '../types/farm';

interface StocksViewProps {
  inventory: InventoryItem[];
  onRestock: (id: string, amount: number) => void;
}

export const StocksView: React.FC<StocksViewProps> = ({ inventory, onRestock }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <span>Inventory & Stock Store</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track feed reserves, vaccine cold chain items, empty egg trays, and automatic reorder thresholds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.map((item) => {
          const isLow = item.quantity <= item.minAlertThreshold;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-5 border shadow-xs flex flex-col justify-between ${
                isLow ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  {isLow ? (
                    <span className="flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Adequate
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{item.location}</p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-2xl font-black text-slate-900">
                    {item.quantity.toLocaleString()}{' '}
                    <span className="text-xs font-semibold text-slate-400">{item.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Threshold: {item.minAlertThreshold} {item.unit}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Est. Unit Cost: Rs. {item.costPerUnit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onRestock(item.id, 50)}
                  className="w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add Stock (+50 {item.unit})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
