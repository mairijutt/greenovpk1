import { Flock, FeedConsumption, FinancialRecord, InventoryItem, BankAccount } from '../types/farm.ts';
import { DetailedEggProduction } from '../data/liveEggProductions.ts';
import { SaleRecord } from '../data/liveSales.ts';
import { StockRecord } from '../data/liveStocks.ts';

export const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months (Full Year)' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const COGS_CATEGORIES = new Set(['FEED', 'CHICKEN', 'MEDICINE', 'VACCINE']);

export function normalizeDateStr(d?: string): string {
  if (!d) return '';
  return String(d).slice(0, 10);
}

export function getUnitFromRecord(rec: any): string {
  const fname = String(rec?.flockName || rec?.flock || '');
  const fid = String(rec?.flockId ?? '');
  if (fname.toLowerCase().includes('unit 1') || fid === '8') return 'Unit 1';
  if (fname.toLowerCase().includes('unit 2') || fid === '9') return 'Unit 2';
  if (fname.toLowerCase().includes('unit 3') || fid === '10') return 'Unit 3';
  return fname || (fid ? `Unit ${fid}` : 'Unit 1');
}

export function matchesSelectedUnit(rec: any, selectedUnit: string): boolean {
  if (!selectedUnit || selectedUnit === 'all') return true;
  const u = getUnitFromRecord(rec);
  return u.toLowerCase() === selectedUnit.toLowerCase() || String(rec?.flockId) === selectedUnit;
}

export function isEggSaleRecord(sale: any): boolean {
  const head = String(sale?.head || '').toUpperCase();
  const cat = String(sale?.category || '').toLowerCase();
  return head.includes('EGG') || cat.includes('egg');
}

export function getMonthDateBounds(year: string, month: string): { from: string; to: string } {
  if (!year || year === 'all') {
    return { from: '', to: '' };
  }
  if (!month || month === 'all') {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  const yNum = parseInt(year, 10);
  const mNum = parseInt(month, 10);
  if (isNaN(yNum) || isNaN(mNum)) return { from: '', to: '' };
  const lastDay = new Date(yNum, mNum, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getAdjacentMonthLabel(year: string, month: string, deltaMonths: number): string {
  if (!year || year === 'all' || !month || month === 'all' || month === 'custom') {
    return deltaMonths < 0 ? 'Prior Periods' : 'Subsequent Periods';
  }
  const yNum = parseInt(year, 10);
  const mNum = parseInt(month, 10) - 1;
  const dt = new Date(yNum, mNum + deltaMonths, 1);
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface CeoSummaryMetrics {
  periodLabel: string;
  prevPeriodLabel: string;
  nextPeriodLabel: string;
  activeBirds: number;
  // Production
  totalEggsProduced: number;
  totalCartonsProduced: number;
  brokenEggs: number;
  cleanEggsProduced: number;
  avgLayingRate: number;
  eggLogCount: number;
  // Sales
  totalSalesRevenue: number;
  eggSalesRevenue: number;
  otherSalesRevenue: number;
  eggsSold: number;
  cartonsSold: number;
  eggSalesCount: number;
  onlineCollections: number;
  cashCollections: number;
  salesCount: number;
  // Expenses
  totalExpenses: number;
  cogsExpenses: number;
  operatingExpenses: number;
  feedExpenses: number;
  salariesExpenses: number;
  medicineVaccineExpenses: number;
  utilitiesPolExpenses: number;
  chickenCapexExpenses: number;
  expenseCount: number;
  expenseByHead: { head: string; amount: number; percent: number; isCogs: boolean }[];
  salesByHead: { head: string; amount: number; percent: number; count: number }[];
  // P&L
  netIncome: number;
  netMarginPercent: number;
  operatingMarginPercent: number;
  // Feed & Stock
  feedConsumedBags: number;
  feedConsumedKg: number;
  feedStockReceivedBags: number;
  feedStockReceivedAmount: number;
  warehouseReserveBags: number;
  warehouseReserveKg: number;
  remainingFeedBags: number;
  remainingFeedKg: number;
  periodNetFeedBags: number;
  // Remaining Production & Carry Forward
  periodRemainingEggs: number;
  periodRemainingCartons: number;
  carriedPrevEggs: number;
  carriedPrevCartons: number;
  carriedNextEggs: number;
  carriedNextCartons: number;
  carriedNextEggValue: number;
  carriedPrevFeedBags: number;
  carriedNextFeedBags: number;
  carriedPrevNetCash: number;
  carriedNextNetCash: number;
  // Unit Economics
  avgCartonPrice: number;
  avgEggPrice: number;
  avgPerBirdCost: number;
  avgPerBirdRevenue: number;
  avgPerBirdNet: number;
  avgPerBirdFeedCost: number;
  costPerCartonProduced: number;
}

export interface MonthlyCeoRow {
  monthKey: string;
  monthLabel: string;
  totalEggsProduced: number;
  totalCartonsProduced: number;
  eggsSold: number;
  cartonsSold: number;
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  feedConsumedBags: number;
  feedReceivedBags: number;
  carriedPrevCartons: number;
  remainingProductionCartons: number;
  carriedNextCartons: number;
  remainingFeedBags: number;
  carriedNextFeedBags: number;
  avgCartonPrice: number;
  avgPerBirdCost: number;
}

export function computeCeoSummary(params: {
  flocks: Flock[];
  eggProductions: DetailedEggProduction[];
  salesRecords: SaleRecord[];
  expenseRecords: FinancialRecord[];
  consumptionLogs: FeedConsumption[];
  stockRecords: StockRecord[];
  inventory: InventoryItem[];
  selectedUnit: string;
  fromDate: string;
  toDate: string;
  periodLabel: string;
  prevPeriodLabel: string;
  nextPeriodLabel: string;
}): CeoSummaryMetrics {
  const {
    flocks,
    eggProductions,
    salesRecords,
    expenseRecords,
    consumptionLogs,
    stockRecords,
    inventory,
    selectedUnit,
    fromDate,
    toDate,
    periodLabel,
    prevPeriodLabel,
    nextPeriodLabel,
  } = params;

  // Active birds in selected unit(s)
  const matchingFlocks = flocks.filter((f) => {
    if (selectedUnit === 'all') return true;
    return (
      f.name.toLowerCase() === selectedUnit.toLowerCase() ||
      (selectedUnit === 'Unit 1' && String(f.id) === '8') ||
      (selectedUnit === 'Unit 2' && String(f.id) === '9') ||
      (selectedUnit === 'Unit 3' && String(f.id) === '10')
    );
  });
  const activeBirds = matchingFlocks.reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);

  const isInPeriod = (d: string) => {
    const nd = normalizeDateStr(d);
    if (fromDate && nd < fromDate) return false;
    if (toDate && nd > toDate) return false;
    return true;
  };
  const isBeforePeriod = (d: string) => {
    if (!fromDate) return false;
    const nd = normalizeDateStr(d);
    return Boolean(nd) && nd < fromDate;
  };

  // Warehouse feed reserve from inventory
  const warehouseReserveKg = inventory
    .filter((i) => i.category === 'Feed')
    .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const warehouseReserveBags = Math.round(warehouseReserveKg / 50);

  // Filter unit-scoped datasets first
  const unitEggs = eggProductions.filter((e) => matchesSelectedUnit(e, selectedUnit));
  const unitSales = salesRecords.filter((s) => matchesSelectedUnit(s, selectedUnit));
  const unitExpenses = expenseRecords.filter((x) => matchesSelectedUnit(x, selectedUnit));
  const unitConsumptions = consumptionLogs.filter((c) => matchesSelectedUnit(c, selectedUnit));
  const unitStocks = stockRecords.filter((k) => matchesSelectedUnit(k, selectedUnit));

  // Period Eggs
  const periodEggs = unitEggs.filter((e) => isInPeriod(e.date));
  const prevEggs = unitEggs.filter((e) => isBeforePeriod(e.date));

  const totalEggsProduced = periodEggs.reduce((s, e) => s + (Number(e.totalEggs) || 0), 0);
  const brokenEggs = periodEggs.reduce((s, e) => s + (Number(e.damagedEggs ?? e.brokenEggs) || 0), 0);
  const cleanEggsProduced = Math.max(0, totalEggsProduced - brokenEggs);
  const totalCartonsProduced = totalEggsProduced / 360;
  const avgLayingRate =
    periodEggs.length > 0
      ? periodEggs.reduce((s, e) => s + (Number(e.layingRatePercent) || 0), 0) / periodEggs.length
      : 0;

  const prevEggsProduced = prevEggs.reduce((s, e) => s + (Number(e.totalEggs) || 0), 0);

  // Period Sales
  const periodSales = unitSales.filter((s) => isInPeriod(s.date));
  const prevSales = unitSales.filter((s) => isBeforePeriod(s.date));

  let totalSalesRevenue = 0;
  let eggSalesRevenue = 0;
  let eggsSold = 0;
  let eggSalesCount = 0;
  let onlineCollections = 0;
  let cashCollections = 0;
  const salesHeadMap: Record<string, { amount: number; count: number }> = {};

  for (const s of periodSales) {
    const amt = Number(s.amount ?? s.totalAmount) || 0;
    totalSalesRevenue += amt;
    const head = String(s.head || s.category || 'EGG').toUpperCase();
    if (!salesHeadMap[head]) salesHeadMap[head] = { amount: 0, count: 0 };
    salesHeadMap[head].amount += amt;
    salesHeadMap[head].count += 1;

    if (isEggSaleRecord(s)) {
      eggSalesRevenue += amt;
      eggSalesCount += 1;
      const rawQty = Number(s.quantity ?? (s as any).itemsSold) || 0;
      eggsSold += rawQty > 0 ? rawQty : amt > 0 ? Math.round(amt / 18.3) : 0;
    }
    const online = Number((s as any).onlinePayment) || (s.paymentMethod === 'Bank Transfer' ? amt : 0);
    const cash = Number((s as any).cashPayment) || (s.paymentMethod === 'Cash' ? amt : 0);
    onlineCollections += online;
    cashCollections += cash;
  }
  const otherSalesRevenue = Math.max(0, totalSalesRevenue - eggSalesRevenue);
  const cartonsSold = eggsSold / 360;

  const prevSalesRevenue = prevSales.reduce((sum, s) => sum + (Number(s.amount ?? s.totalAmount) || 0), 0);
  const prevEggsSold = prevSales
    .filter((s) => isEggSaleRecord(s))
    .reduce((sum, s) => sum + (Number(s.quantity ?? (s as any).itemsSold) || 0), 0);

  // Period Expenses
  const periodExpenses = unitExpenses.filter((x) => isInPeriod(x.date));
  const prevExpensesList = unitExpenses.filter((x) => isBeforePeriod(x.date));

  let totalExpenses = 0;
  let cogsExpenses = 0;
  let feedExpenses = 0;
  let salariesExpenses = 0;
  let medicineVaccineExpenses = 0;
  let utilitiesPolExpenses = 0;
  let chickenCapexExpenses = 0;
  const expHeadMap: Record<string, number> = {};

  for (const x of periodExpenses) {
    const amt = Number(x.amount ?? (x as any).expenseCost) || 0;
    totalExpenses += amt;
    const head = String(x.head || x.category || 'OTHER').toUpperCase().replace(/\s+/g, '_');
    expHeadMap[head] = (expHeadMap[head] || 0) + amt;
    if (COGS_CATEGORIES.has(head)) cogsExpenses += amt;
    if (head === 'FEED') feedExpenses += amt;
    if (head === 'SALARIES_PAYMENTS') salariesExpenses += amt;
    if (head === 'MEDICINE' || head === 'VACCINE') medicineVaccineExpenses += amt;
    if (head === 'UTILITIES' || head === 'POL' || head === 'POWER_ELECTRIC') utilitiesPolExpenses += amt;
    if (head === 'CHICKEN') chickenCapexExpenses += amt;
  }
  const operatingExpenses = Math.max(0, totalExpenses - cogsExpenses);
  const prevExpensesTotal = prevExpensesList.reduce((sum, x) => sum + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);

  const expenseByHead = Object.entries(expHeadMap)
    .map(([head, amount]) => ({
      head,
      amount,
      percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      isCogs: COGS_CATEGORIES.has(head),
    }))
    .sort((a, b) => b.amount - a.amount);

  const salesByHead = Object.entries(salesHeadMap)
    .map(([head, info]) => ({
      head,
      amount: info.amount,
      percent: totalSalesRevenue > 0 ? (info.amount / totalSalesRevenue) * 100 : 0,
      count: info.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Feed Consumption & Stock
  const periodConsumptions = unitConsumptions.filter((c) => isInPeriod(c.date));
  const prevConsumptions = unitConsumptions.filter((c) => isBeforePeriod(c.date));
  const periodStocks = unitStocks.filter((k) => isInPeriod(k.date));
  const prevStocks = unitStocks.filter((k) => isBeforePeriod(k.date));

  const feedConsumedKg = periodConsumptions.reduce((sum, c) => sum + (Number(c.feedQuantityKg) || (Number(c.bags) || 0) * 50), 0);
  const feedConsumedBags = periodConsumptions.reduce((sum, c) => sum + (Number(c.bags) || Math.round((Number(c.feedQuantityKg) || 0) / 50)), 0);

  const feedStockReceivedBags = periodStocks.reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
  const feedStockReceivedAmount = periodStocks.reduce((sum, k) => sum + (Number(k.amount) || 0), 0);

  const prevFeedConsumedBags = prevConsumptions.reduce((sum, c) => sum + (Number(c.bags) || Math.round((Number(c.feedQuantityKg) || 0) / 50)), 0);
  const prevFeedReceivedBags = prevStocks.reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);

  // Waterfall / Rollover calculations
  const netIncome = totalSalesRevenue - totalExpenses;
  const netMarginPercent = totalSalesRevenue > 0 ? (netIncome / totalSalesRevenue) * 100 : 0;
  const operatingProfitExclCapex = totalSalesRevenue - (totalExpenses - chickenCapexExpenses);
  const operatingMarginPercent = totalSalesRevenue > 0 ? (operatingProfitExclCapex / totalSalesRevenue) * 100 : 0;

  const carriedPrevEggs = Math.max(0, prevEggsProduced - prevEggsSold);
  const carriedPrevCartons = carriedPrevEggs / 360;
  const periodRemainingEggs = totalEggsProduced - eggsSold;
  const periodRemainingCartons = periodRemainingEggs / 360;
  const carriedNextEggs = Math.max(0, carriedPrevEggs + totalEggsProduced - eggsSold);
  const carriedNextCartons = carriedNextEggs / 360;

  const avgCartonPrice = cartonsSold > 0 ? eggSalesRevenue / cartonsSold : 0;
  const avgEggPrice = avgCartonPrice > 0 ? avgCartonPrice / 360 : 0;
  const carriedNextEggValue = carriedNextCartons * avgCartonPrice;

  const carriedPrevFeedBags = Math.max(0, prevFeedReceivedBags - prevFeedConsumedBags);
  const periodNetFeedBags = feedStockReceivedBags - feedConsumedBags;
  const closingLedgerFeedBags = Math.max(0, carriedPrevFeedBags + feedStockReceivedBags - feedConsumedBags);
  const unitShareRatio =
    selectedUnit === 'Unit 1' ? 0.25 : selectedUnit === 'Unit 2' ? 0.50 : selectedUnit === 'Unit 3' ? 0.25 : 1;
  const unitWarehouseBags = Math.round(warehouseReserveBags * unitShareRatio);
  const unitWarehouseKg = Math.round(warehouseReserveKg * unitShareRatio);
  const remainingFeedBags = closingLedgerFeedBags + unitWarehouseBags;
  const remainingFeedKg = remainingFeedBags * 50;
  const carriedNextFeedBags = remainingFeedBags;

  const carriedPrevNetCash = fromDate ? prevSalesRevenue - prevExpensesTotal : 0;
  const carriedNextNetCash = carriedPrevNetCash + netIncome;

  const avgPerBirdCost = activeBirds > 0 ? totalExpenses / activeBirds : 0;
  const avgPerBirdRevenue = activeBirds > 0 ? totalSalesRevenue / activeBirds : 0;
  const avgPerBirdNet = activeBirds > 0 ? netIncome / activeBirds : 0;
  const avgPerBirdFeedCost = activeBirds > 0 ? feedExpenses / activeBirds : 0;
  const costPerCartonProduced = totalCartonsProduced > 0 ? totalExpenses / totalCartonsProduced : 0;

  return {
    periodLabel,
    prevPeriodLabel,
    nextPeriodLabel,
    activeBirds,
    totalEggsProduced,
    totalCartonsProduced,
    brokenEggs,
    cleanEggsProduced,
    avgLayingRate,
    eggLogCount: periodEggs.length,
    totalSalesRevenue,
    eggSalesRevenue,
    otherSalesRevenue,
    eggsSold,
    cartonsSold,
    eggSalesCount,
    onlineCollections,
    cashCollections,
    salesCount: periodSales.length,
    totalExpenses,
    cogsExpenses,
    operatingExpenses,
    feedExpenses,
    salariesExpenses,
    medicineVaccineExpenses,
    utilitiesPolExpenses,
    chickenCapexExpenses,
    expenseCount: periodExpenses.length,
    expenseByHead,
    salesByHead,
    netIncome,
    netMarginPercent,
    operatingMarginPercent,
    feedConsumedBags,
    feedConsumedKg,
    feedStockReceivedBags,
    feedStockReceivedAmount,
    warehouseReserveBags: unitWarehouseBags,
    warehouseReserveKg: unitWarehouseKg,
    remainingFeedBags,
    remainingFeedKg,
    periodNetFeedBags,
    periodRemainingEggs,
    periodRemainingCartons,
    carriedPrevEggs,
    carriedPrevCartons,
    carriedNextEggs,
    carriedNextCartons,
    carriedNextEggValue,
    carriedPrevFeedBags,
    carriedNextFeedBags,
    carriedPrevNetCash,
    carriedNextNetCash,
    avgCartonPrice,
    avgEggPrice,
    avgPerBirdCost,
    avgPerBirdRevenue,
    avgPerBirdNet,
    avgPerBirdFeedCost,
    costPerCartonProduced,
  };
}

export function computeMonthlyBreakdown(params: {
  flocks: Flock[];
  eggProductions: DetailedEggProduction[];
  salesRecords: SaleRecord[];
  expenseRecords: FinancialRecord[];
  consumptionLogs: FeedConsumption[];
  stockRecords: StockRecord[];
  inventory: InventoryItem[];
  selectedUnit: string;
  selectedYear: string;
}): MonthlyCeoRow[] {
  const {
    flocks,
    eggProductions,
    salesRecords,
    expenseRecords,
    consumptionLogs,
    stockRecords,
    inventory,
    selectedUnit,
    selectedYear,
  } = params;

  const matchingFlocks = flocks.filter((f) => {
    if (selectedUnit === 'all') return true;
    return (
      f.name.toLowerCase() === selectedUnit.toLowerCase() ||
      (selectedUnit === 'Unit 1' && String(f.id) === '8') ||
      (selectedUnit === 'Unit 2' && String(f.id) === '9') ||
      (selectedUnit === 'Unit 3' && String(f.id) === '10')
    );
  });
  const activeBirds = matchingFlocks.reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);

  const monthSet = new Set<string>();
  const collectMonth = (d?: string) => {
    const nd = normalizeDateStr(d);
    if (nd.length >= 7) {
      const m = nd.slice(0, 7);
      if (!selectedYear || selectedYear === 'all' || m.startsWith(`${selectedYear}-`)) {
        monthSet.add(m);
      }
    }
  };

  eggProductions.filter((e) => matchesSelectedUnit(e, selectedUnit)).forEach((e) => collectMonth(e.date));
  salesRecords.filter((s) => matchesSelectedUnit(s, selectedUnit)).forEach((s) => collectMonth(s.date));
  expenseRecords.filter((x) => matchesSelectedUnit(x, selectedUnit)).forEach((x) => collectMonth(x.date));
  consumptionLogs.filter((c) => matchesSelectedUnit(c, selectedUnit)).forEach((c) => collectMonth(c.date));
  stockRecords.filter((k) => matchesSelectedUnit(k, selectedUnit)).forEach((k) => collectMonth(k.date));

  const sortedMonths = Array.from(monthSet).sort();

  const warehouseReserveKg = inventory
    .filter((i) => i.category === 'Feed')
    .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const unitShareRatio =
    selectedUnit === 'Unit 1' ? 0.25 : selectedUnit === 'Unit 2' ? 0.50 : selectedUnit === 'Unit 3' ? 0.25 : 1;
  const unitWarehouseBags = Math.round((warehouseReserveKg / 50) * unitShareRatio);

  let runningEggsBalance = 0;
  let runningFeedBalance = 0;

  return sortedMonths.map((monthKey) => {
    const [y, m] = monthKey.split('-');
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const mEggs = eggProductions.filter(
      (e) => matchesSelectedUnit(e, selectedUnit) && normalizeDateStr(e.date).startsWith(monthKey)
    );
    const mSales = salesRecords.filter(
      (s) => matchesSelectedUnit(s, selectedUnit) && normalizeDateStr(s.date).startsWith(monthKey)
    );
    const mExpenses = expenseRecords.filter(
      (x) => matchesSelectedUnit(x, selectedUnit) && normalizeDateStr(x.date).startsWith(monthKey)
    );
    const mConsumptions = consumptionLogs.filter(
      (c) => matchesSelectedUnit(c, selectedUnit) && normalizeDateStr(c.date).startsWith(monthKey)
    );
    const mStocks = stockRecords.filter(
      (k) => matchesSelectedUnit(k, selectedUnit) && normalizeDateStr(k.date).startsWith(monthKey)
    );

    const totalEggsProduced = mEggs.reduce((s, e) => s + (Number(e.totalEggs) || 0), 0);
    const eggSales = mSales.filter((s) => isEggSaleRecord(s));
    const eggsSold = eggSales.reduce((s, x) => s + (Number(x.quantity ?? (x as any).itemsSold) || 0), 0);
    const eggRevenue = eggSales.reduce((s, x) => s + (Number(x.amount ?? x.totalAmount) || 0), 0);
    const totalSales = mSales.reduce((s, x) => s + (Number(x.amount ?? x.totalAmount) || 0), 0);
    const totalExpenses = mExpenses.reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
    const feedConsumedBags = mConsumptions.reduce(
      (s, c) => s + (Number(c.bags) || Math.round((Number(c.feedQuantityKg) || 0) / 50)),
      0
    );
    const feedReceivedBags = mStocks.reduce((s, k) => s + (Number(k.quantity) || 0), 0);

    const carriedPrevCartons = Math.max(0, runningEggsBalance) / 360;
    runningEggsBalance = Math.max(0, runningEggsBalance + totalEggsProduced - eggsSold);
    const carriedNextCartons = runningEggsBalance / 360;

    runningFeedBalance = Math.max(0, runningFeedBalance + feedReceivedBags - feedConsumedBags);

    const cartonsSold = eggsSold / 360;
    const avgCartonPrice = cartonsSold > 0 ? eggRevenue / cartonsSold : 0;
    const avgPerBirdCost = activeBirds > 0 ? totalExpenses / activeBirds : 0;

    return {
      monthKey,
      monthLabel,
      totalEggsProduced,
      totalCartonsProduced: totalEggsProduced / 360,
      eggsSold,
      cartonsSold,
      totalSales,
      totalExpenses,
      netIncome: totalSales - totalExpenses,
      feedConsumedBags,
      feedReceivedBags,
      carriedPrevCartons,
      remainingProductionCartons: (totalEggsProduced - eggsSold) / 360,
      carriedNextCartons,
      remainingFeedBags: runningFeedBalance + unitWarehouseBags,
      carriedNextFeedBags: runningFeedBalance + unitWarehouseBags,
      avgCartonPrice,
      avgPerBirdCost,
    };
  });
}

export interface ComputedBankBalance {
  bank: BankAccount;
  openingBalance: number;
  salesInPeriod: number;
  totalSalesAdded: number;
  currentBalance: number;
  txCount: number;
  periodTxCount: number;
}

export interface BankBalancesReportSummary {
  banks: ComputedBankBalance[];
  totalOpeningBalance: number;
  totalSalesAddedToBanks: number;
  totalPeriodSalesAddedToBanks: number;
  totalCurrentBankBalance: number;
  unassignedPeriodOnlineSales: number;
}

export function getSaleOnlineAmount(sale: any): number {
  const amt = Number(sale?.amount ?? sale?.totalAmount) || 0;
  if (sale?.onlinePayment !== undefined && sale?.onlinePayment !== null) {
    const onl = Number(sale.onlinePayment) || 0;
    if (onl > 0) return onl;
    // If onlinePayment is explicitly 0 and cashPayment covers amount, return 0
    const cash = Number(sale?.cashPayment) || 0;
    if (cash > 0) return 0;
  }
  const pm = String(sale?.paymentMethod || '').toLowerCase();
  if (pm.includes('online') || pm.includes('bank')) {
    return amt;
  }
  return 0;
}

export function computeBankBalances(params: {
  bankAccounts: BankAccount[];
  salesRecords: SaleRecord[];
  fromDate?: string;
  toDate?: string;
}): BankBalancesReportSummary {
  const { bankAccounts, salesRecords, fromDate = '', toDate = '' } = params;

  const isInPeriod = (d: string) => {
    const nd = normalizeDateStr(d);
    if (fromDate && nd < fromDate) return false;
    if (toDate && nd > toDate) return false;
    return true;
  };

  let unassignedPeriodOnlineSales = 0;

  // Map bank IDs & names for quick lookup
  const bankMatchesSale = (bank: BankAccount, sale: any): boolean => {
    if (sale?.bankId && String(sale.bankId) === String(bank.id)) return true;
    if (!sale?.bankId && sale?.bankName && bank.bankName) {
      return String(sale.bankName).trim().toLowerCase() === bank.bankName.trim().toLowerCase();
    }
    return false;
  };

  const banks: ComputedBankBalance[] = bankAccounts.map((bank) => {
    const openingBal = Number(bank.openingBalance) || 0;
    const openingDate = normalizeDateStr(bank.openingDate);

    let totalSalesAdded = 0;
    let salesInPeriod = 0;
    let txCount = 0;
    let periodTxCount = 0;

    for (const sale of salesRecords) {
      if (!bankMatchesSale(bank, sale)) continue;
      const saleDate = normalizeDateStr(sale.date);
      if (openingDate && saleDate && saleDate < openingDate) continue;

      const amt = Number(sale.amount ?? (sale as any).totalAmount) || 0;
      const onlineAmt = getSaleOnlineAmount(sale);
      // If user explicitly linked this sale to a bank account and onlineAmt > 0 use onlineAmt; otherwise if not cash-only, fallback to amt
      const cashAmt = Number((sale as any).cashPayment) || 0;
      const depositAmt = onlineAmt > 0 ? onlineAmt : cashAmt === 0 ? amt : 0;

      if (depositAmt > 0) {
        totalSalesAdded += depositAmt;
        txCount += 1;
        if (isInPeriod(sale.date)) {
          salesInPeriod += depositAmt;
          periodTxCount += 1;
        }
      }
    }

    return {
      bank,
      openingBalance: openingBal,
      salesInPeriod,
      totalSalesAdded,
      currentBalance: openingBal + totalSalesAdded,
      txCount,
      periodTxCount,
    };
  });

  for (const sale of salesRecords) {
    if (!isInPeriod(sale.date)) continue;
    const onlineAmt = getSaleOnlineAmount(sale);
    if (onlineAmt <= 0) continue;
    const matchedAny = bankAccounts.some((b) => bankMatchesSale(b, sale));
    if (!matchedAny) {
      unassignedPeriodOnlineSales += onlineAmt;
    }
  }

  const totalOpeningBalance = banks.reduce((s, b) => s + b.openingBalance, 0);
  const totalSalesAddedToBanks = banks.reduce((s, b) => s + b.totalSalesAdded, 0);
  const totalPeriodSalesAddedToBanks = banks.reduce((s, b) => s + b.salesInPeriod, 0);
  const totalCurrentBankBalance = totalOpeningBalance + totalSalesAddedToBanks;

  return {
    banks,
    totalOpeningBalance,
    totalSalesAddedToBanks,
    totalPeriodSalesAddedToBanks,
    totalCurrentBankBalance,
    unassignedPeriodOnlineSales,
  };
}
