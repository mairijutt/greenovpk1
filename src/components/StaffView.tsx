import React, { useState } from 'react';
import { Users, Phone, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Worker } from '../types/farm';
import { StatCard, PageHeader, UISearchInput, UIFilterBar, TableCard } from './ui';

interface StaffViewProps {
  workers: Worker[];
}

export const StaffView: React.FC<StaffViewProps> = ({ workers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const totalPayroll = workers.reduce((acc, curr) => acc + curr.monthlySalary, 0);

  const filtered = workers.filter((w) => {
    return (
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.farmAssigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Farm Staff & Payroll"
        subtitle="Manage flock supervisors, farm veterinarians, feeding staff, and salary disbursement."
        icon={Users}
        iconColor="teal"
        badge="Staff Roster Verified"
      />

      {/* Standardized KPI Stats Grid matching DashboardView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Farm Personnel"
          value={workers.length}
          unit="Members"
          icon={Users}
          color="teal"
          badge={{ text: '100% Active', color: 'teal' }}
          subtext="Supervisors, vet & shed crew"
        />

        <StatCard
          title="Monthly Payroll"
          value={`Rs. ${totalPayroll.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          valueColor="text-emerald-700"
          badge={{ text: 'Disbursed', color: 'emerald' }}
          subtext="Processed via verified salary sheet"
        />

        <StatCard
          title="Attendance Roster"
          value="100%"
          unit="Present"
          icon={CheckCircle2}
          color="blue"
          badge={{ text: 'Nominal', color: 'blue' }}
          subtext="Full coverage across both shifts"
        />

        <StatCard
          title="Supervision Ratio"
          value="1 : 1"
          unit="Ratio"
          icon={ShieldCheck}
          color="amber"
          badge={{ text: 'Dedicated', color: 'amber' }}
          subtext="Dedicated supervisor per shed"
        />
      </div>

      {/* Standardized Filters Bar */}
      <UIFilterBar>
        <UISearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search staff name, role, farm unit, or phone..."
          containerClassName="w-full sm:w-80"
        />

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> staff members
        </div>
      </UIFilterBar>

      {/* Standardized Staff Table Card */}
      <TableCard
        title="Active Personnel Roster & Salary Schedule"
        subtitle="Assigned shed responsibilities, direct contact details, and monthly wages"
        badge={
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200/60">
            Payroll Active
          </span>
        }
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Employee Name</th>
              <th className="py-3 px-4">Role / Designation</th>
              <th className="py-3 px-4">Assigned Farm Unit</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Monthly Salary</th>
              <th className="py-3 px-4">Duty Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No staff members match your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{w.name}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{w.role}</td>
                  <td className="py-3 px-4 text-slate-600">{w.farmAssigned}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{w.phone}</span>
                  </td>
                  <td className="py-3 px-4 font-black text-slate-900">
                    Rs. {w.monthlySalary.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
};
