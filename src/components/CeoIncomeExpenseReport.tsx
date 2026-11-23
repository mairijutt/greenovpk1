import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Egg,
  Wheat,
  Package,
  ArrowRightLeft,
  Building2,
  BarChart3,
  CalendarDays,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Bird,
  Landmark,
  Plus,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { BankAccount } from '../types/farm.ts';
import { StatCard, TableCard, RecordDetailModal } from './ui';
import { BankFormModal } from './BankFormModal.tsx';
import {
  CeoSummaryMetrics,
  MonthlyCeoRow,
  BankBalancesReportSummary,
  getMonthDateBounds,
} from '../utils/ceoReportCalculations.ts';

interface CeoIncomeExpenseReportProps {
  metrics: CeoSummaryMetrics;
  monthlyRows: MonthlyCeoRow[];
  unitMatrix: { unitName: string; metrics: CeoSummaryMetrics }[];
  bankSummary: BankBalancesReportSummary;
  bankAccounts: BankAccount[];
  selectedUnit: string;
  selectedMonth: string;
  selectedYear: string;
  fromDate?: string;
  toDate?: string;
  onSelectMonth: (month: string) => void;
  onSelectUnit: (unit: string) => void;
  onAddBank: (bank: BankAccount) => void;
  onEditBank: (bank: BankAccount) => void;
  onDeleteBank: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const formatPkr = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}Rs. ${(abs / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}Rs. ${Math.round(abs).toLocaleString()}`;
};

const formatFullPkr = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rs. ${Math.round(Math.abs(amount)).toLocaleString()}`;
};

const formatSignedPkr = (amount: number): string => {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}Rs. ${Math.round(Math.abs(amount)).toLocaleString()}`;
};

export const CeoIncomeExpenseReport: React.FC<CeoIncomeExpenseReportProps> = ({
  metrics,
  monthlyRows,
  unitMatrix,
  bankSummary,
  selectedUnit,
  selectedMonth,
  selectedYear,
  fromDate = '',
  toDate = '',
  onSelectMonth,
  onSelectUnit,
  onAddBank,
  onEditBank,
  onDeleteBank,
}) => {
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewingBankItem, setViewingBankItem] = useState<(typeof bankSummary.banks)[number] | null>(
    null
  );

  const buildCardHref = (tabPath: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (selectedUnit && selectedUnit !== 'all') {
      params.set('unit', selectedUnit);
    } else {
      params.set('unit', 'all');
    }

    let effFrom = fromDate;
    let effTo = toDate;
    if (!effFrom && !effTo && selectedYear && selectedYear !== 'all' && selectedMonth !== 'custom') {
      const bounds = getMonthDateBounds(selectedYear, selectedMonth);
      effFrom = bounds.from;
      effTo = bounds.to;
    }

    if (effFrom) params.set('from', effFrom);
    if (effTo) params.set('to', effTo);
    if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'custom') {
      params.set('month', selectedMonth);
    }
    if (selectedYear && selectedYear !== 'all') {
      params.set('year', selectedYear);
    }
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }

    const qs = params.toString();
    return qs ? `${tabPath}?${qs}` : tabPath;
  };

  const isSurplus = metrics.netIncome >= 0;
  const eggSharePct =
    metrics.totalSalesRevenue > 0
      ? ((metrics.eggSalesRevenue / metrics.totalSalesRevenue) * 100).toFixed(1)
      : '0.0';
  const onlineSharePct =
    metrics.totalSalesRevenue > 0
      ? ((metrics.onlineCollections / metrics.totalSalesRevenue) * 100).toFixed(1)
      : '0.0';
  const brokenPct =
    metrics.totalEggsProduced > 0
      ? ((metrics.brokenEggs / metrics.totalEggsProduced) * 100).toFixed(2)
      : '0.00';

  const activeMonthKey =
    selectedYear !== 'all' && selectedMonth !== 'all' && selectedMonth !== 'custom'
      ? `${selectedYear}-${selectedMonth}`
      : '';

  return (
    <div className="space-y-6">
      {/* Compact Executive Period Context Strip */}
      <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Income Statement &amp; Executive Summary</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {selectedUnit === 'all' ? 'All Units Combined' : selectedUnit}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black mt-0.5 tracking-tight">
            {metrics.periodLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            Active Flock:{' '}
            <strong className="text-white">{metrics.activeBirds.toLocaleString()} Birds</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            Rollover:{' '}
            <strong className="text-amber-300">{metrics.prevPeriodLabel}</strong>
            {' → '}
            <strong className="text-emerald-300">{metrics.nextPeriodLabel}</strong>
          </span>
        </div>
      </div>

      {/* Top Relevant KPI Cards (Row 1: Financial P&L) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue (Sales)"
          value={formatPkr(metrics.totalSalesRevenue)}
          icon={DollarSign}
          color="emerald"
          valueColor="text-emerald-700"
          badge={{ text: `${metrics.salesCount.toLocaleString()} Bills`, color: 'emerald' }}
          subtext={`${formatFullPkr(metrics.totalSalesRevenue)} • ${eggSharePct}% Eggs • ${onlineSharePct}% Online`}
          href={buildCardHref('/sales')}
          target="_blank"
          linkLabel="Open Sales Ledger"
        />

        <StatCard
          title="Total Expenses (Consumed Basis)"
          value={formatPkr(metrics.totalExpenses)}
          icon={Receipt}
          color="rose"
          valueColor="text-rose-700"
          badge={{ text: `${metrics.expenseCount.toLocaleString()} Vouchers`, color: 'rose' }}
          subtext={`Bird/Feed Expense: ${formatPkr(metrics.cogsExpenses)} • OpEx: ${formatPkr(metrics.operatingExpenses)}`}
          href={buildCardHref('/expenses')}
          target="_blank"
          linkLabel="Open Expenses Ledger"
        />

        <StatCard
          title="Net Income (Profit / Loss)"
          value={formatPkr(metrics.netIncome)}
          icon={isSurplus ? TrendingUp : TrendingDown}
          color={isSurplus ? 'teal' : 'rose'}
          valueColor={isSurplus ? 'text-emerald-700' : 'text-rose-600'}
          trend={{
            value: `${metrics.netMarginPercent.toFixed(1)}% Net Margin`,
            isUp: isSurplus,
          }}
          subtext={`Excl. Flock CAPEX Margin: ${metrics.operatingMarginPercent.toFixed(1)}%`}
          href={buildCardHref('/dashboard')}
          target="_blank"
          linkLabel="Open Financial Dashboard"
        />
      </div>

      {/* Top Relevant KPI Cards (Row 2: Production, Sales & Feed Continuity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Egg Production"
          value={Math.round(metrics.totalCartonsProduced).toLocaleString()}
          unit="Cartons"
          icon={Egg}
          color="amber"
          badge={{ text: `${metrics.avgLayingRate.toFixed(1)}% Laying`, color: 'amber' }}
          subtext={`Net: ${Math.round(metrics.cleanEggsProduced / 360).toLocaleString()} Ctns • ${metrics.brokenEggs.toLocaleString()} Broken (${brokenPct}%)`}
          href={buildCardHref('/egg-production')}
          target="_blank"
          linkLabel="Open Egg Production"
        />

        <StatCard
          title="Total Cartons Sold"
          value={Math.round(metrics.cartonsSold).toLocaleString()}
          unit="Cartons"
          icon={Package}
          color="indigo"
          valueColor="text-indigo-700"
          badge={{
            text: `${metrics.eggSalesCount.toLocaleString()} Egg Sales`,
            color: 'indigo',
          }}
          subtext={`${metrics.eggsSold.toLocaleString()} Eggs • ${formatPkr(metrics.eggSalesRevenue)}`}
          href={buildCardHref('/sales', { head: 'EGG' })}
          target="_blank"
          linkLabel="Open Sales Ledger"
        />

        <StatCard
          title="Closing Egg Stock"
          value={Math.round(metrics.carriedNextCartons).toLocaleString()}
          unit="Cartons"
          icon={ArrowRightLeft}
          color="sky"
          valueColor="text-sky-700"
          badge={{
            text: `C/F: ${Math.round(metrics.carriedPrevCartons).toLocaleString()} → ${Math.round(metrics.carriedNextCartons).toLocaleString()}`,
            color: metrics.periodRemainingCartons >= 0 ? 'emerald' : 'amber',
          }}
          subtext={`Est. Closing Value: ${formatPkr(metrics.carriedNextEggValue)}`}
          href={buildCardHref('/stocks')}
          target="_blank"
          linkLabel="Open Inventory & Stocks"
        />

        <StatCard
          title="Feed Consumed & Balance"
          value={metrics.feedConsumedBags.toLocaleString()}
          unit="Bags Used"
          icon={Wheat}
          color="blue"
          badge={{
            text: `Rem: ${metrics.remainingFeedBags.toLocaleString()} Bags`,
            color: 'blue',
          }}
          subtext={`Expense: ${formatPkr(metrics.feedExpenses)} • Purchased: ${metrics.feedStockReceivedBags.toLocaleString()} Bags`}
          href={buildCardHref('/daily-consumption')}
          target="_blank"
          linkLabel="Open Daily Consumption"
        />
      </div>

      {/* Income Statement (Profit & Loss) — Primary Financial Statement */}
      {(() => {
        const rev = metrics.totalSalesRevenue || 0;
        const pct = (val: number) => (rev > 0 ? `${((val / rev) * 100).toFixed(1)}%` : '0.0%');
        const grossProfit = rev - metrics.cogsExpenses;
        const otherOpEx = Math.max(
          0,
          metrics.operatingExpenses - metrics.salariesExpenses - metrics.utilitiesPolExpenses
        );
        const opProfitExclCapex = rev - (metrics.totalExpenses - metrics.chickenCapexExpenses);

        return (
          <TableCard
            title="Income Statement (Profit & Loss)"
            subtitle={`GreenOva Farms • ${metrics.periodLabel} • ${
              selectedUnit === 'all' ? 'All Units Combined' : selectedUnit
            }`}
            badge={
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isSurplus
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isSurplus ? 'Net Surplus' : 'Net Deficit'} ({metrics.netMarginPercent.toFixed(1)}%)
              </span>
            }
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Statement Line Item / Particulars</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  <th className="py-3 px-4 text-right">% of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Revenue Section */}
                <tr className="bg-emerald-50/40">
                  <td colSpan={3} className="py-2 px-4 font-black text-emerald-900 uppercase text-[10px] tracking-wider">
                    A. Revenue (Income)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Egg Sales Revenue{' '}
                    <span className="text-[11px] text-slate-400">
                      ({Math.round(metrics.cartonsSold).toLocaleString()} ctns @ avg Rs.{' '}
                      {Math.round(metrics.avgCartonPrice).toLocaleString()}/ctn)
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.eggSalesRevenue)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.eggSalesRevenue)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Other Farm Sales (Manure, Feed Bags, Cull Birds &amp; Misc.)
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.otherSalesRevenue)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.otherSalesRevenue)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 border-t border-emerald-200">
                  <td className="py-3 px-4 font-black text-emerald-950">Total Revenue (A)</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">
                    {formatFullPkr(rev)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800">
                    {rev > 0 ? '100.0%' : '0.0%'}
                  </td>
                </tr>

                {/* Direct Farm Cost (COGS) Section */}
                <tr className="bg-amber-50/40">
                  <td colSpan={3} className="py-2 px-4 font-black text-amber-900 uppercase text-[10px] tracking-wider">
                    B. Direct Bird &amp; Production Expenses
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Feed Consumed Expenses{' '}
                    <span className="text-[11px] text-slate-400">
                      ({metrics.feedConsumedBags.toLocaleString()} bags consumed
                      {metrics.feedAvgCostPerBag > 0
                        ? ` @ Rs. ${Math.round(metrics.feedAvgCostPerBag).toLocaleString()}/bag`
                        : ''}
                      {metrics.feedStockReceivedBags > 0 &&
                      metrics.feedStockReceivedBags !== metrics.feedConsumedBags
                        ? ` • ${metrics.feedStockReceivedBags.toLocaleString()} bags purchased`
                        : ''}
                      )
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.feedExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.feedExpenses)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Chicken / Flock Purchases (CAPEX)
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.chickenCapexExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.chickenCapexExpenses)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Medicine &amp; Vaccines
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.medicineVaccineExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.medicineVaccineExpenses)}
                  </td>
                </tr>
                <tr className="bg-amber-50/70 border-t border-amber-200">
                  <td className="py-2.5 px-4 font-bold text-amber-950">
                    Total Direct Expenses (B)
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                    ({formatFullPkr(metrics.cogsExpenses)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-900">
                    {pct(metrics.cogsExpenses)}
                  </td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-slate-100/80 border-t border-slate-200">
                  <td className="py-3 px-4 font-black text-slate-900">
                    Gross Profit / (Loss) (A − B)
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-black ${
                      grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatFullPkr(grossProfit)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-700">
                    {pct(grossProfit)}
                  </td>
                </tr>

                {/* Operating Expenses Section */}
                <tr className="bg-rose-50/40">
                  <td colSpan={3} className="py-2 px-4 font-black text-rose-900 uppercase text-[10px] tracking-wider">
                    C. Operating Expenses (Unit Overheads)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Staff Salaries &amp; Labor Payments
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.salariesExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.salariesExpenses)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Utilities, Electricity &amp; Fuel (POL)
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(metrics.utilitiesPolExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {pct(metrics.utilitiesPolExpenses)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 pl-6 text-slate-700">
                    Other Farm Overheads (Rent, Packing, Repairs, Admin &amp; Misc.)
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatFullPkr(otherOpEx)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">{pct(otherOpEx)}</td>
                </tr>
                <tr className="bg-rose-50/70 border-t border-rose-200">
                  <td className="py-2.5 px-4 font-bold text-rose-950">
                    Total Operating Expenses (C)
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                    ({formatFullPkr(metrics.operatingExpenses)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-800">
                    {pct(metrics.operatingExpenses)}
                  </td>
                </tr>

                {/* Total Expenses & Net Profit Footer */}
                <tr className="bg-slate-100 border-t border-slate-200">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    Total Expenses (B + C)
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700">
                    ({formatFullPkr(metrics.totalExpenses)})
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-700">
                    {pct(metrics.totalExpenses)}
                  </td>
                </tr>
                <tr className="bg-slate-900 text-white">
                  <td className="py-4 px-4">
                    <div className="font-black text-sm">
                      Net Income / (Net Loss) (A − Total Expenses)
                    </div>
                    <div className="text-[11px] text-slate-300 font-normal mt-0.5">
                      Operating Profit excl. Flock CAPEX: {formatFullPkr(opProfitExclCapex)} (
                      {metrics.operatingMarginPercent.toFixed(1)}%) • Net / Bird: Rs.{' '}
                      {Math.round(metrics.avgPerBirdNet).toLocaleString()}
                    </div>
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-black text-base ${
                      isSurplus ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatFullPkr(metrics.netIncome)}
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-black text-sm ${
                      isSurplus ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {metrics.netMarginPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Quick Bottom One-Line Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-t border-slate-200 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Income</div>
                <div className="text-xs font-black text-emerald-700 mt-0.5">
                  {formatFullPkr(rev)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Expenses</div>
                <div className="text-xs font-black text-rose-600 mt-0.5">
                  {formatFullPkr(metrics.totalExpenses)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">
                  {isSurplus ? 'Net Profit' : 'Net Loss'}
                </div>
                <div
                  className={`text-xs font-black mt-0.5 ${
                    isSurplus ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatFullPkr(metrics.netIncome)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">
                  Unit Operating Expense
                </div>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {formatFullPkr(metrics.operatingExpenses)}
                </div>
              </div>
            </div>
          </TableCard>
        );
      })()}

      {/* Unit-Wise Comparative Performance Matrix */}
      <TableCard
        title="Unit-Wise Comparative Matrix"
        subtitle={`Side-by-side P&L, production, feed consumption, remaining stock & unit economics for ${metrics.periodLabel}. Click a unit row to filter.`}
        badge={
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>3 Production Units</span>
          </span>
        }
      >
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-3.5">Unit / Flock</th>
              <th className="py-3 px-3 text-right">Active Birds</th>
              <th className="py-3 px-3 text-right">Total Production</th>
              <th className="py-3 px-3 text-right">Cartons Sold</th>
              <th className="py-3 px-3 text-right">Total Sale</th>
              <th className="py-3 px-3 text-right">Total Expense</th>
              <th className="py-3 px-3 text-right">Net Income</th>
              <th className="py-3 px-3 text-right">Feed Consumed</th>
              <th className="py-3 px-3 text-right">Rem. Production</th>
              <th className="py-3 px-3 text-right">Rem. Feed</th>
              <th className="py-3 px-3 text-right">Avg Carton Price</th>
              <th className="py-3 px-3.5 text-right">Avg Expense / Bird</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unitMatrix.map(({ unitName, metrics: um }) => {
              const isSelected = selectedUnit === unitName || (selectedUnit === 'all' && unitName === 'All Units');
              const isAllRow = unitName === 'All Units';
              const targetUnitKey = isAllRow ? 'all' : unitName;
              const unitPositive = um.netIncome >= 0;

              return (
                <tr
                  key={unitName}
                  onClick={() => onSelectUnit(targetUnitKey)}
                  className={`cursor-pointer transition-colors ${
                    isAllRow
                      ? 'bg-slate-900 text-white font-bold hover:bg-slate-800'
                      : isSelected
                      ? 'bg-emerald-50/70 hover:bg-emerald-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-3.5">
                    <div className="flex items-center space-x-2">
                      <Bird className={`w-3.5 h-3.5 ${isAllRow ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className="font-bold">
                        {isAllRow ? 'Total Combined (All Units)' : unitName}
                      </span>
                      {selectedUnit === unitName && !isAllRow && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-600 text-white font-bold">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">
                    {um.activeBirds.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold">
                      {Math.round(um.totalCartonsProduced).toLocaleString()} ctns
                    </div>
                    <div className={`text-[10px] ${isAllRow ? 'text-slate-300' : 'text-slate-400'}`}>
                      {um.totalEggsProduced.toLocaleString()} eggs
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className={`font-bold ${isAllRow ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {Math.round(um.cartonsSold).toLocaleString()} ctns
                    </div>
                    <div className={`text-[10px] ${isAllRow ? 'text-slate-300' : 'text-slate-400'}`}>
                      {um.eggsSold.toLocaleString()} eggs
                    </div>
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${isAllRow ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {formatPkr(um.totalSalesRevenue)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${isAllRow ? 'text-rose-300' : 'text-rose-600'}`}>
                    {formatPkr(um.totalExpenses)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-black ${
                      isAllRow
                        ? unitPositive
                          ? 'text-emerald-300'
                          : 'text-rose-300'
                        : unitPositive
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatPkr(um.netIncome)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-semibold">{um.feedConsumedBags.toLocaleString()} bags</div>
                    <div className={`text-[10px] ${isAllRow ? 'text-slate-300' : 'text-slate-400'}`}>
                      {um.feedConsumedKg.toLocaleString()} kg
                    </div>
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      isAllRow
                        ? um.carriedNextCartons < 0
                          ? 'text-rose-300'
                          : 'text-white'
                        : um.carriedNextCartons < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {Math.round(um.carriedNextCartons).toLocaleString()} ctns
                  </td>
                  <td className="py-3 px-3 text-right font-bold">
                    {um.remainingFeedBags.toLocaleString()} bags
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${isAllRow ? 'text-amber-300' : 'text-amber-700'}`}>
                    Rs. {Math.round(um.avgCartonPrice).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold">
                    Rs. {Math.round(um.avgPerBirdCost).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {/* Carried Forward & Continuity Waterfall Statement */}
      <TableCard
        title="Monthly Rollover & Continuity Statement"
        subtitle={`Opening balance carried forward from ${metrics.prevPeriodLabel}, period movements for ${metrics.periodLabel}, and closing balance carried forward to ${metrics.nextPeriodLabel}`}
        badge={
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            Audit Reconciled
          </span>
        }
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Operational &amp; Financial Ledger</th>
              <th className="py-3 px-4 text-right bg-amber-50/50 text-amber-900">
                Carried Forward from Previous Month
                <div className="text-[10px] font-normal text-amber-700 normal-case">
                  ({metrics.prevPeriodLabel})
                </div>
              </th>
              <th className="py-3 px-4 text-right text-emerald-800">
                Period Additions / Inflows (+)
              </th>
              <th className="py-3 px-4 text-right text-rose-800">
                Period Outflows / Dispatches (−)
              </th>
              <th className="py-3 px-4 text-right">Period Net Variance</th>
              <th className="py-3 px-4 text-right bg-emerald-50/60 text-emerald-950">
                Carried Forward to Next Month
                <div className="text-[10px] font-normal text-emerald-700 normal-case">
                  ({metrics.nextPeriodLabel})
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Cash Flow Row */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3.5 px-4">
                <div className="font-bold text-slate-900">Cash Flow &amp; Net P&amp;L (PKR)</div>
                <div className="text-[11px] text-slate-500">
                  Total Sales vs Total Operational &amp; CAPEX Expenses
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-semibold bg-amber-50/30 text-slate-800">
                {formatFullPkr(metrics.carriedPrevNetCash)}
              </td>
              <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                +{formatFullPkr(metrics.totalSalesRevenue)}
              </td>
              <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                −{formatFullPkr(metrics.totalExpenses)}
              </td>
              <td
                className={`py-3.5 px-4 text-right font-bold ${
                  metrics.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatSignedPkr(metrics.netIncome)}
              </td>
              <td
                className={`py-3.5 px-4 text-right font-black bg-emerald-50/40 ${
                  metrics.carriedNextNetCash >= 0 ? 'text-emerald-900' : 'text-rose-700'
                }`}
              >
                {formatFullPkr(metrics.carriedNextNetCash)}
              </td>
            </tr>

            {/* Egg Production & Inventory Row */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3.5 px-4">
                <div className="font-bold text-slate-900">Egg Production &amp; Stock Rollover</div>
                <div className="text-[11px] text-slate-500">
                  360 Eggs per Standard Carton • Est. Closing Value: {formatFullPkr(metrics.carriedNextEggValue)}
                </div>
              </td>
              <td className="py-3.5 px-4 text-right bg-amber-50/30">
                <div className="font-bold text-slate-900">
                  {Math.round(metrics.carriedPrevCartons).toLocaleString()} ctns
                </div>
                <div className="text-[10px] text-slate-500">
                  {metrics.carriedPrevEggs.toLocaleString()} eggs
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="font-bold text-emerald-700">
                  +{Math.round(metrics.cleanEggsProduced / 360).toLocaleString()} ctns
                </div>
                <div className="text-[10px] text-slate-500">
                  {Math.round(metrics.totalCartonsProduced).toLocaleString()} prod −{' '}
                  {(metrics.brokenEggs / 360).toLocaleString(undefined, { maximumFractionDigits: 1 })} broken
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="font-bold text-rose-600">
                  −{Math.round(metrics.cartonsSold).toLocaleString()} ctns
                </div>
                <div className="text-[10px] text-slate-500">
                  {metrics.eggsSold.toLocaleString()} eggs sold
                </div>
              </td>
              <td
                className={`py-3.5 px-4 text-right font-bold ${
                  metrics.periodRemainingCartons >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                <div>
                  {metrics.periodRemainingCartons >= 0 ? '+' : ''}
                  {Math.round(metrics.periodRemainingCartons).toLocaleString()} ctns
                </div>
                <div className="text-[10px] font-normal">
                  {metrics.periodRemainingEggs >= 0 ? '+' : ''}
                  {metrics.periodRemainingEggs.toLocaleString()} eggs
                </div>
              </td>
              <td className="py-3.5 px-4 text-right bg-emerald-50/40">
                <div className="font-black text-emerald-900">
                  {Math.round(metrics.carriedNextCartons).toLocaleString()} ctns
                </div>
                <div className="text-[10px] text-emerald-700">
                  {metrics.carriedNextEggs.toLocaleString()} eggs remaining
                </div>
              </td>
            </tr>

            {/* Feed Stock & Consumption Row */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3.5 px-4">
                <div className="font-bold text-slate-900">Feed Bags &amp; Reserve Rollover</div>
                <div className="text-[11px] text-slate-500">
                  50 kg/Bag • Stock Received vs Feed Consumed Continuity
                </div>
              </td>
              <td className="py-3.5 px-4 text-right bg-amber-50/30">
                <div className="font-bold text-slate-900">
                  {metrics.carriedPrevFeedBags.toLocaleString()} bags
                </div>
                <div className="text-[10px] text-slate-500">
                  {(metrics.carriedPrevFeedBags * 50).toLocaleString()} kg opening
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="font-bold text-emerald-700">
                  +{metrics.feedStockReceivedBags.toLocaleString()} bags
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatPkr(metrics.feedStockReceivedAmount)} purchased
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="font-bold text-rose-600">
                  −{metrics.feedConsumedBags.toLocaleString()} bags
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatPkr(metrics.feedExpenses)} consumed • {metrics.feedConsumedKg.toLocaleString()} kg
                </div>
              </td>
              <td
                className={`py-3.5 px-4 text-right font-bold ${
                  metrics.periodNetFeedBags >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                <div>
                  {metrics.periodNetFeedBags >= 0 ? '+' : ''}
                  {metrics.periodNetFeedBags.toLocaleString()} bags
                </div>
                <div className="text-[10px] font-normal">
                  {(metrics.periodNetFeedBags * 50).toLocaleString()} kg net
                </div>
              </td>
              <td className="py-3.5 px-4 text-right bg-emerald-50/40">
                <div className="font-black text-emerald-900">
                  {metrics.remainingFeedBags.toLocaleString()} bags
                </div>
                <div className="text-[10px] text-emerald-700">
                  {metrics.remainingFeedKg.toLocaleString()} kg remaining
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </TableCard>

      {/* Month-by-Month Rollover Ledger */}
      <TableCard
        title={`Monthly Financial & Inventory Rollover Schedule (${selectedYear === 'all' ? 'All Years' : selectedYear})`}
        subtitle="Chronological month-by-month Income vs Expenses, Production, Feed Consumption, Remaining Stock & Unit Economics. Click any month row to focus that month."
        badge={
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{monthlyRows.length} Months</span>
          </span>
        }
      >
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
          <thead className="font-bold uppercase text-[10px]">
            {/* Section Group Header Row */}
            <tr className="border-b border-slate-200">
              <th className="py-2 px-3.5 bg-slate-100 text-slate-700 border-r border-slate-200">
                Period
              </th>
              <th
                colSpan={5}
                className="py-2 px-3 text-center bg-amber-100/90 text-amber-950 border-r border-amber-200 tracking-wider"
              >
                Egg Production &amp; Stock (Cartons)
              </th>
              <th
                colSpan={3}
                className="py-2 px-3 text-center bg-emerald-100/90 text-emerald-950 border-r border-emerald-200 tracking-wider"
              >
                Financials (Income &amp; Expenses)
              </th>
              <th
                colSpan={3}
                className="py-2 px-3 text-center bg-sky-100/90 text-sky-950 border-r border-sky-200 tracking-wider"
              >
                Feed Inventory (Bags)
              </th>
              <th
                colSpan={2}
                className="py-2 px-3.5 text-center bg-indigo-100/90 text-indigo-950 tracking-wider"
              >
                Unit Economics
              </th>
            </tr>
            {/* Individual Column Headers */}
            <tr className="border-b-2 border-slate-200">
              <th className="py-2.5 px-3.5 bg-slate-50 text-slate-700 border-r border-slate-200">
                Month
              </th>
              <th className="py-2.5 px-3 text-right bg-amber-50/80 text-amber-900">
                C/F Prev (Ctns)
              </th>
              <th className="py-2.5 px-3 text-right bg-amber-50/80 text-amber-900">
                Produced (Ctns)
              </th>
              <th className="py-2.5 px-3 text-right bg-amber-50/80 text-rose-800">
                Broken (Ctns)
              </th>
              <th className="py-2.5 px-3 text-right bg-amber-50/80 text-amber-900">
                Sold (Ctns)
              </th>
              <th className="py-2.5 px-3 text-right bg-amber-50/80 text-amber-900 border-r border-amber-200/80">
                Rem. Prod (Next)
              </th>
              <th className="py-2.5 px-3 text-right bg-emerald-50/80 text-emerald-900">
                Total Sale
              </th>
              <th className="py-2.5 px-3 text-right bg-emerald-50/80 text-emerald-900">
                Total Expense
              </th>
              <th className="py-2.5 px-3 text-right bg-emerald-50/80 text-emerald-900 border-r border-emerald-200/80">
                Net P&amp;L
              </th>
              <th className="py-2.5 px-3 text-right bg-sky-50/80 text-sky-900">
                Total Feed
              </th>
              <th className="py-2.5 px-3 text-right bg-sky-50/80 text-sky-900">
                Feed Consumed
              </th>
              <th className="py-2.5 px-3 text-right bg-sky-50/80 text-sky-900 border-r border-sky-200/80">
                Rem. Feed
              </th>
              <th className="py-2.5 px-3 text-right bg-indigo-50/80 text-indigo-900">
                Avg Carton
              </th>
              <th className="py-2.5 px-3.5 text-right bg-indigo-50/80 text-indigo-900">
                Expense / Bird
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-slate-400">
                  No monthly activity recorded for {selectedYear === 'all' ? 'the selected filters' : selectedYear}.
                </td>
              </tr>
            ) : (
              monthlyRows.map((row) => {
                const isSelectedMonth = activeMonthKey === row.monthKey;
                const monthCode = row.monthKey.split('-')[1];
                const isProfit = row.netIncome >= 0;
                const eggTint = isSelectedMonth ? 'bg-emerald-50/60' : 'bg-amber-50/30';
                const finTint = isSelectedMonth ? 'bg-emerald-50/80' : 'bg-emerald-50/30';
                const feedTint = isSelectedMonth ? 'bg-emerald-50/60' : 'bg-sky-50/30';
                const econTint = isSelectedMonth ? 'bg-emerald-50/60' : 'bg-indigo-50/30';

                return (
                  <tr
                    key={row.monthKey}
                    onClick={() => onSelectMonth(monthCode)}
                    className={`cursor-pointer transition-colors group ${
                      isSelectedMonth
                        ? 'bg-emerald-50 font-semibold border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-3.5 border-r border-slate-200/80">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">{row.monthLabel}</span>
                        {isSelectedMonth && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                            Selected
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Egg Production & Stock Section */}
                    <td
                      className={`py-3 px-3 text-right font-medium ${eggTint} ${
                        row.carriedPrevCartons < 0 ? 'text-rose-600' : 'text-amber-800'
                      }`}
                    >
                      {Math.round(row.carriedPrevCartons).toLocaleString()}
                    </td>
                    <td className={`py-3 px-3 text-right ${eggTint}`}>
                      <div className="font-bold text-slate-900">
                        {Math.round(row.totalCartonsProduced).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Net: {Math.round(row.netCartonsProduced).toLocaleString()}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right ${eggTint}`}>
                      <div className={`font-semibold ${row.brokenEggs > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {row.brokenCartons.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.brokenEggs.toLocaleString()} eggs
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold text-slate-700 ${eggTint}`}>
                      {Math.round(row.cartonsSold).toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold border-r border-amber-200/70 ${eggTint} ${
                        row.carriedNextCartons < 0 ? 'text-rose-600' : 'text-amber-900'
                      }`}
                    >
                      {Math.round(row.carriedNextCartons).toLocaleString()} ctns
                    </td>
                    {/* Financials Section */}
                    <td className={`py-3 px-3 text-right font-bold text-emerald-700 ${finTint}`}>
                      {formatPkr(row.totalSales)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold text-rose-600 ${finTint}`}>
                      {formatPkr(row.totalExpenses)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-black border-r border-emerald-200/70 ${finTint} ${
                        isProfit ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatPkr(row.netIncome)}
                    </td>
                    {/* Feed Inventory Section */}
                    <td className={`py-3 px-3 text-right ${feedTint}`}>
                      <div className="font-bold text-sky-900">
                        {row.totalAvailableFeedBags.toLocaleString()} bags
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {row.feedReceivedBags.toLocaleString()} purch + {row.carriedPrevFeedBags.toLocaleString()} C/F
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right ${feedTint}`}>
                      <div className="font-semibold text-slate-700">
                        {row.feedConsumedBags.toLocaleString()} bags
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatPkr(row.feedConsumedExpense)}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold text-sky-700 border-r border-sky-200/70 ${feedTint}`}
                    >
                      {row.remainingFeedBags.toLocaleString()} bags
                    </td>
                    {/* Unit Economics Section */}
                    <td className={`py-3 px-3 text-right font-bold text-indigo-800 ${econTint}`}>
                      Rs. {Math.round(row.avgCartonPrice).toLocaleString()}
                    </td>
                    <td className={`py-3 px-3.5 text-right font-bold text-indigo-950 ${econTint}`}>
                      Rs. {Math.round(row.avgPerBirdCost).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {monthlyRows.length > 0 && (() => {
            const openingCartons = monthlyRows[0].carriedPrevCartons;
            const totalProdCartons = monthlyRows.reduce((s, r) => s + r.totalCartonsProduced, 0);
            const totalNetCartons = monthlyRows.reduce((s, r) => s + r.netCartonsProduced, 0);
            const totalBrokenCartons = monthlyRows.reduce((s, r) => s + r.brokenCartons, 0);
            const totalBrokenEggs = monthlyRows.reduce((s, r) => s + r.brokenEggs, 0);
            const totalSoldCartons = monthlyRows.reduce((s, r) => s + r.cartonsSold, 0);
            const closingCartons = monthlyRows[monthlyRows.length - 1].carriedNextCartons;
            const totalSalesAmt = monthlyRows.reduce((s, r) => s + r.totalSales, 0);
            const totalExpenseAmt = monthlyRows.reduce((s, r) => s + r.totalExpenses, 0);
            const totalNetAmt = totalSalesAmt - totalExpenseAmt;
            const totalFeedRecv = monthlyRows.reduce((s, r) => s + r.feedReceivedBags, 0);
            const totalFeedCons = monthlyRows.reduce((s, r) => s + r.feedConsumedBags, 0);
            const closingFeed = monthlyRows[monthlyRows.length - 1].remainingFeedBags;

            return (
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                <tr>
                  <td className="py-3 px-3.5 border-r border-slate-700">
                    Total / Closing ({monthlyRows.length}M)
                  </td>
                  <td className="py-3 px-3 text-right text-amber-300">
                    {Math.round(openingCartons).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div>{Math.round(totalProdCartons).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-300 font-normal">
                      Net: {Math.round(totalNetCartons).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-rose-300">
                    <div>{totalBrokenCartons.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-slate-300 font-normal">
                      {totalBrokenEggs.toLocaleString()} eggs
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-300">
                    {Math.round(totalSoldCartons).toLocaleString()}
                  </td>
                  <td
                    className={`py-3 px-3 text-right border-r border-slate-700 ${
                      closingCartons < 0 ? 'text-rose-300' : 'text-amber-300'
                    }`}
                  >
                    {Math.round(closingCartons).toLocaleString()} ctns
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-300">
                    {formatPkr(totalSalesAmt)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-300">
                    {formatPkr(totalExpenseAmt)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right border-r border-slate-700 ${
                      totalNetAmt >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {formatPkr(totalNetAmt)}
                  </td>
                  <td className="py-3 px-3 text-right text-sky-200">
                    {(monthlyRows[0].carriedPrevFeedBags + totalFeedRecv).toLocaleString()} bags
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200">
                    {totalFeedCons.toLocaleString()} bags
                  </td>
                  <td className="py-3 px-3 text-right text-sky-300 border-r border-slate-700">
                    {closingFeed.toLocaleString()} bags
                  </td>
                  <td className="py-3 px-3 text-right text-amber-300">
                    Rs. {Math.round(metrics.avgCartonPrice).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-200">
                    Rs. {Math.round(metrics.avgPerBirdCost).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </TableCard>

      {/* Two-Column Breakdown: Expense Heads + Sales Channels & Unit Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown by Category Head */}
        <TableCard
          title="Expense Allocation by Expense Head"
          subtitle={`Direct vs Operating Expense breakdown for ${metrics.periodLabel}`}
          badge={
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
              {metrics.expenseByHead.length} Active Heads
            </span>
          }
        >
          <div className="p-4 space-y-3">
            {metrics.expenseByHead.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No expenses recorded for the selected period/unit.
              </div>
            ) : (
              metrics.expenseByHead.slice(0, 10).map((item) => {
                const perBird = metrics.activeBirds > 0 ? item.amount / metrics.activeBirds : 0;
                return (
                  <div key={item.head} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          {item.head.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.isCogs
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.isCogs ? 'COGS' : 'OPEX'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          {formatFullPkr(item.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          ({item.percent.toFixed(1)}% • Rs. {Math.round(perBird).toLocaleString()}/bird)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.isCogs ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, item.percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TableCard>

        {/* Sales Channel Mix & Per-Bird Financial Ratios */}
        <div className="space-y-6">
          <TableCard
            title="Revenue Streams & Collection Split"
            subtitle={`Commercial collections and channel mix for ${metrics.periodLabel}`}
            badge={
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {metrics.salesCount.toLocaleString()} Transactions
              </span>
            }
          >
            <div className="p-4 space-y-4">
              {/* Online vs Cash Settlement */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-blue-800">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Online / Bank Transfer</span>
                  </div>
                  <div className="text-base font-black text-blue-950 mt-1">
                    {formatFullPkr(metrics.onlineCollections)}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-0.5">
                    {metrics.totalSalesRevenue > 0
                      ? ((metrics.onlineCollections / metrics.totalSalesRevenue) * 100).toFixed(1)
                      : '0.0'}
                    % of collections
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash Counter / Farm</span>
                  </div>
                  <div className="text-base font-black text-emerald-950 mt-1">
                    {formatFullPkr(metrics.cashCollections)}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    {metrics.totalSalesRevenue > 0
                      ? ((metrics.cashCollections / metrics.totalSalesRevenue) * 100).toFixed(1)
                      : '0.0'}
                    % of collections
                  </div>
                </div>
              </div>

              {/* Revenue by Category Head */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {metrics.salesByHead.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No sales recorded in the selected filter.
                  </div>
                ) : (
                  metrics.salesByHead.map((s) => (
                    <div key={s.head} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-800">{s.head}</span>
                        <span className="text-[10px] text-slate-500">({s.count} bills)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">
                          {formatFullPkr(s.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          ({s.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Per-Bird & Per-Carton Profitability Strip */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500">Revenue / Bird</div>
                  <div className="text-xs font-black text-emerald-700 mt-0.5">
                    Rs. {Math.round(metrics.avgPerBirdRevenue).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500">Expense / Bird</div>
                  <div className="text-xs font-black text-rose-600 mt-0.5">
                    Rs. {Math.round(metrics.avgPerBirdCost).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500">Expense / Carton</div>
                  <div className="text-xs font-black text-slate-900 mt-0.5">
                    Rs. {Math.round(metrics.costPerCartonProduced).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </TableCard>
        </div>
      </div>

      {/* Bank Balances & Opening Balance Register */}
      <TableCard
        title="Bank Balances & Opening Balance Register"
        subtitle="Add opening balances for farm bank accounts. Recording or editing online/bank sales dynamically updates the selected bank's live balance."
        badge={
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Landmark className="w-3.5 h-3.5" />
            <span>{bankSummary.banks.length} Active {bankSummary.banks.length === 1 ? 'Bank' : 'Banks'}</span>
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingBank(null);
              setShowBankModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Opening Balance</span>
          </button>
        }
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Bank Opening Balance
              </div>
              <div className="text-base font-black text-slate-900 mt-1">
                {formatFullPkr(bankSummary.totalOpeningBalance)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Configured across {bankSummary.banks.length} bank{bankSummary.banks.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                + Sales Added ({metrics.periodLabel})
              </div>
              <div className="text-base font-black text-blue-950 mt-1">
                +{formatFullPkr(bankSummary.totalPeriodSalesAddedToBanks)}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">
                Cumulative post-opening: +{formatFullPkr(bankSummary.totalSalesAddedToBanks)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Current Total Bank Balance
              </div>
              <div className="text-base font-black text-emerald-900 mt-1">
                {formatFullPkr(bankSummary.totalCurrentBankBalance)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                Opening Balance + Dynamic Sales Added
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Unassigned Online Receipts (Period)
              </div>
              <div className="text-base font-black text-amber-950 mt-1">
                {formatFullPkr(bankSummary.unassignedPeriodOnlineSales)}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                Online sales not linked to a specific bank
              </div>
            </div>
          </div>

          {bankSummary.banks.length === 0 ? (
            <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70">
              <Landmark className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">
                No Bank Accounts Added Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Add opening balances for farm bank accounts so online/bank sales update live bank balances automatically.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingBank(null);
                  setShowBankModal(true);
                }}
                className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Bank Account</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Bank Name &amp; Account</th>
                    <th className="py-3 px-3 text-center">Opening Date</th>
                    <th className="py-3 px-4 text-right">Opening Balance</th>
                    <th className="py-3 px-4 text-right">+ Sales Added (Period)</th>
                    <th className="py-3 px-4 text-right">+ Total Sales Added</th>
                    <th className="py-3 px-4 text-right bg-emerald-50/70 text-emerald-900">
                      Current Live Balance
                    </th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankSummary.banks.map((item) => {
                    const { bank } = item;
                    const isConfirming = confirmDeleteId === bank.id;
                    return (
                      <tr key={bank.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Landmark className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{bank.bankName}</div>
                              <div className="text-[11px] text-slate-500">
                                {bank.accountTitle}
                                {bank.accountNumber ? ` • ${bank.accountNumber}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {bank.openingDate}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatFullPkr(item.openingBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">
                          +{formatFullPkr(item.salesInPeriod)}
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({item.periodTxCount})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          +{formatFullPkr(item.totalSalesAdded)}
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({item.txCount} {item.txCount === 1 ? 'sale' : 'sales'})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-900 bg-emerald-50/40 text-sm">
                          {formatFullPkr(item.currentBalance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isConfirming ? (
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteBank(bank.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setViewingBankItem(item)}
                                title="View Bank Account Details"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBank(bank);
                                  setShowBankModal(true);
                                }}
                                title="Edit Bank Opening Balance"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(bank.id)}
                                title="Remove Bank Account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TableCard>

      {/* Add / Edit Bank Opening Balance Form Modal */}
      {showBankModal && (
        <BankFormModal
          initialBank={editingBank}
          onClose={() => {
            setShowBankModal(false);
            setEditingBank(null);
          }}
          onSave={(saved) => {
            if (editingBank) {
              onEditBank(saved);
            } else {
              onAddBank(saved);
            }
            setShowBankModal(false);
            setEditingBank(null);
          }}
        />
      )}

      {/* Bank Account View Detail Popup */}
      <RecordDetailModal
        isOpen={Boolean(viewingBankItem)}
        onClose={() => setViewingBankItem(null)}
        title={viewingBankItem?.bank.bankName || 'Bank Account Details'}
        subtitle={viewingBankItem?.bank.accountTitle}
        badge={
          viewingBankItem
            ? {
                text: 'Active Bank Ledger',
                color: 'emerald',
              }
            : undefined
        }
        fields={
          viewingBankItem
            ? [
                { label: 'Bank Name', value: viewingBankItem.bank.bankName },
                { label: 'Account Title', value: viewingBankItem.bank.accountTitle },
                {
                  label: 'Account Number / IBAN',
                  value: viewingBankItem.bank.accountNumber || '—',
                  mono: true,
                },
                { label: 'Opening Date', value: viewingBankItem.bank.openingDate, mono: true },
                {
                  label: 'Opening Balance',
                  value: formatFullPkr(viewingBankItem.openingBalance),
                },
                {
                  label: 'Sales Added (Period)',
                  value: `+${formatFullPkr(viewingBankItem.salesInPeriod)} (${viewingBankItem.periodTxCount} tx)`,
                  highlight: true,
                },
                {
                  label: 'Total Sales Added',
                  value: `+${formatFullPkr(viewingBankItem.totalSalesAdded)} (${viewingBankItem.txCount} tx)`,
                  highlight: true,
                },
                {
                  label: 'Current Live Balance',
                  value: formatFullPkr(viewingBankItem.currentBalance),
                  highlight: true,
                },
              ]
            : []
        }
        notes={viewingBankItem?.bank.notes}
        onEdit={
          viewingBankItem
            ? () => {
                setEditingBank(viewingBankItem.bank);
                setShowBankModal(true);
              }
            : undefined
        }
        onDelete={
          viewingBankItem
            ? () => {
                onDeleteBank(viewingBankItem.bank.id);
              }
            : undefined
        }
      />
    </div>
  );
};
