import React from 'react';
import { Users, Phone, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Worker } from '../types/farm';

interface StaffViewProps {
  workers: Worker[];
}

export const StaffView: React.FC<StaffViewProps> = ({ workers }) => {
  const totalPayroll = workers.reduce((acc, curr) => acc + curr.monthlySalary, 0);

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
          <div className="text-2xl font-black text-slate-900 mt-1">{workers.length} Members</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">100% On-duty today</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Monthly Payroll</div>
          <div className="text-2xl font-black text-teal-700 mt-1">Rs. {totalPayroll.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Salaries processed via bank/cash</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{w.name}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{w.role}</td>
                  <td className="py-3 px-4 text-slate-600">{w.farmAssigned}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{w.phone}</span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-800">Rs. {w.monthlySalary.toLocaleString()}</td>
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
      </div>
    </div>
  );
};
