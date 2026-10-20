import React, { useState, useMemo } from 'react';
import { Users, Phone, DollarSign, CheckCircle2, ShieldCheck, RotateCcw } from 'lucide-react';
import { Worker } from '../types/farm';
import { FilterBar } from './FilterBar';

interface StaffViewProps {
  workers: Worker[];
}

export const StaffView: React.FC<StaffViewProps> = ({ workers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');

  const unitCategories = [
    { label: 'All Units & Sheds', value: 'all' },
    { label: 'Shed 01-02 (Layers)', value: 'Shed 01-02 (Layers)' },
    { label: 'Shed 03-04 (Broilers)', value: 'Shed 03-04 (Broilers)' },
    { label: 'Feed Mill & Storage', value: 'Feed Mill & Storage' },
    { label: 'Central Complex', value: 'Central Complex' },
  ];

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchUnit = selectedUnit === 'all' || w.farmAssigned.includes(selectedUnit);
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.phone.includes(q) ||
        w.farmAssigned.toLowerCase().includes(q);
      return matchUnit && matchSearch;
    });
  }, [workers, selectedUnit, searchTerm]);

  const totalPayroll = filtered.reduce((acc, curr) => acc + curr.monthlySalary, 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnit('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Farm Staff & Payroll</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage flock supervisors, farm veterinarians, feeding staff, and salary disbursement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Farm Personnel</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{filtered.length} Members</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">100% On-duty today</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Monthly Payroll</div>
          <div className="text-2xl font-black text-teal-700 mt-1">Rs. {totalPayroll.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Salaries processed via bank/cash</div>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search staff name, role, phone, assigned unit..."
        categories={unitCategories}
        selectedCategory={selectedUnit}
        onSelectCategory={setSelectedUnit}
        categoryLabel="Assigned Unit"
        showDatePickers={false}
        totalCount={workers.length}
        filteredCount={filtered.length}
        itemTypeLabel="personnel"
        onResetFilters={handleResetFilters}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Assigned Farm Unit</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Monthly Salary</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{w.name}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{w.role}</td>
                    <td className="py-3 px-4 text-slate-600">{w.farmAssigned}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{w.phone}</span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800">
                      Rs. {w.monthlySalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No employees match the filter criteria.
            <div className="mt-2">
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
