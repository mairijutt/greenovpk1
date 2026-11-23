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

export const BIRD_EXPENSE_HEADS = new Set([
  'FEED',
  'CHICKEN',
  'MEDICINE',
  'UTILITIES',
  'SALARIES_PAYMENTS',
  'POL',
  'VACCINE',
  'MESS',
  'RENT',
]);

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

export function getEggSaleQuantity(sale: any): number {
  const rawQty = Number(sale?.quantity ?? sale?.itemsSold) || 0;
  if (rawQty > 0) return rawQty;
  const amt = Number(sale?.amount ?? sale?.totalAmount) || 0;
  return amt > 0 ? Math.round(amt / 18.3) : 0;
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
  birdExpenses: number;
  unitOperatingExpense: number;
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
  feedAvgCostPerBag: number;
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
  brokenEggs: number;
  brokenCartons: number;
  netEggsProduced: number;
  netCartonsProduced: number;
  eggsSold: number;
  cartonsSold: number;
  totalSales: number;
  totalExpenses: number;
  feedConsumedExpense: number;
  netIncome: number;
  feedConsumedBags: number;
  feedReceivedBags: number;
  carriedPrevCartons: number;
  remainingProductionCartons: number;
  carriedNextCartons: number;
  carriedPrevFeedBags: number;
  totalAvailableFeedBags: number;
  remainingFeedBags: number;
  carriedNextFeedBags: number;
  avgCartonPrice: number;
  avgPerBirdCost: number;
}

export function isFeedStockRecord(rec: any): boolean {
  const h = String(rec?.head || rec?.category || '').trim().toUpperCase();
  return !h || h === 'FEED';
}

function getConsumptionBags(rec: any): number {
  const b = Number(rec?.bags);
  if (!isNaN(b) && b > 0) return b;
  const kg = Number(rec?.feedQuantityKg) || 0;
  return kg > 0 ? Math.round(kg / 50) : 0;
}

function resolveFeedRatePerBag(
  unitFeedStocks: StockRecord[],
  allFeedStocks: StockRecord[],
  fromDate: string,
  toDate: string
): number {
  const inPeriod = (d: string) => {
    const nd = normalizeDateStr(d);
    if (fromDate && nd < fromDate) return false;
    if (toDate && nd > toDate) return false;
    return true;
  };
  const upToToDate = (d: string) => {
    if (!toDate) return true;
    const nd = normalizeDateStr(d);
    return Boolean(nd) && nd <= toDate;
  };

  // 1. Unit's feed purchases inside the period
  const uPeriod = unitFeedStocks.filter((k) => inPeriod(k.date));
  const uPeriodBags = uPeriod.reduce((s, k) => s + (Number(k.quantity) || 0), 0);
  const uPeriodAmt = uPeriod.reduce((s, k) => s + (Number(k.amount) || 0), 0);
  if (uPeriodBags > 0) return uPeriodAmt / uPeriodBags;

  // 2. Unit's cumulative feed purchases up to toDate
  const uUpTo = unitFeedStocks.filter((k) => upToToDate(k.date));
  const uUpToBags = uUpTo.reduce((s, k) => s + (Number(k.quantity) || 0), 0);
  const uUpToAmt = uUpTo.reduce((s, k) => s + (Number(k.amount) || 0), 0);
  if (uUpToBags > 0) return uUpToAmt / uUpToBags;

  // 3. Farm-wide feed purchases inside the period
  const fPeriod = allFeedStocks.filter((k) => inPeriod(k.date));
  const fPeriodBags = fPeriod.reduce((s, k) => s + (Number(k.quantity) || 0), 0);
  const fPeriodAmt = fPeriod.reduce((s, k) => s + (Number(k.amount) || 0), 0);
  if (fPeriodBags > 0) return fPeriodAmt / fPeriodBags;

  // 4. Unit's all-time feed purchases
  const uAllBags = unitFeedStocks.reduce((s, k) => s + (Number(k.quantity) || 0), 0);
  const uAllAmt = unitFeedStocks.reduce((s, k) => s + (Number(k.amount) || 0), 0);
  if (uAllBags > 0) return uAllAmt / uAllBags;

  // 5. Farm-wide all-time feed purchases
  const fAllBags = allFeedStocks.reduce((s, k) => s + (Number(k.quantity) || 0), 0);
  const fAllAmt = allFeedStocks.reduce((s, k) => s + (Number(k.amount) || 0), 0);
  if (fAllBags > 0) return fAllAmt / fAllBags;

  return 5500;
}

export function computeConsumedFeedCostForUnit(params: {
  unitStocks: StockRecord[];
  allFeedStocks: StockRecord[];
  unitConsumptions: FeedConsumption[];
  rawUnitFeedExpenses: number;
  fromDate: string;
  toDate: string;
}): number {
  const { unitStocks, allFeedStocks, unitConsumptions, rawUnitFeedExpenses, fromDate, toDate } = params;
  const inBounds = (d: string) => {
    const nd = normalizeDateStr(d);
    if (fromDate && nd < fromDate) return false;
    if (toDate && nd > toDate) return false;
    return true;
  };

  // Fallback only if the unit has neither consumption nor stock records at all
  if (unitConsumptions.length === 0 && unitStocks.length === 0) {
    return rawUnitFeedExpenses;
  }

  const periodCons = unitConsumptions.filter((c) => inBounds(c.date));
  if (periodCons.length === 0) return 0;

  // Group by YYYY-MM so multi-month summaries equal the exact sum of monthly rows
  const byMonth: Record<string, number> = {};
  for (const c of periodCons) {
    const nd = normalizeDateStr(c.date);
    const monthKey = nd.length >= 7 ? nd.slice(0, 7) : 'unknown';
    byMonth[monthKey] = (byMonth[monthKey] || 0) + getConsumptionBags(c);
  }

  let totalCost = 0;
  for (const [monthKey, bags] of Object.entries(byMonth)) {
    if (bags <= 0) continue;
    let effFrom = fromDate;
    let effTo = toDate;
    if (/^\d{4}-\d{2}$/.test(monthKey)) {
      const mStart = `${monthKey}-01`;
      const mEnd = `${monthKey}-31`;
      effFrom = !fromDate || mStart > fromDate ? mStart : fromDate;
      effTo = !toDate || mEnd < toDate ? mEnd : toDate;
    }
    const rate = resolveFeedRatePerBag(unitStocks, allFeedStocks, effFrom, effTo);
    totalCost += Math.round(bags * rate);
  }
  return totalCost;
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

  // All stocks assign directly to production units (no central warehouse)
  const warehouseReserveKg = 0;
  const warehouseReserveBags = 0;

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
  const prevBrokenEggs = prevEggs.reduce((s, e) => s + (Number(e.damagedEggs ?? e.brokenEggs) || 0), 0);
  const prevCleanEggsProduced = prevEggsProduced - prevBrokenEggs;

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
      eggsSold += getEggSaleQuantity(s);
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
    .reduce((sum, s) => sum + getEggSaleQuantity(s), 0);

  // Feed Consumption & Stock (All FEED stock records)
  const allFeedStocks = stockRecords.filter((k) => isFeedStockRecord(k));
  const unitFeedStocks = unitStocks.filter((k) => isFeedStockRecord(k));
  const periodConsumptions = unitConsumptions.filter((c) => isInPeriod(c.date));
  const prevConsumptions = unitConsumptions.filter((c) => isBeforePeriod(c.date));
  const periodStocks = unitFeedStocks.filter((k) => isInPeriod(k.date));
  const prevStocks = unitFeedStocks.filter((k) => isBeforePeriod(k.date));

  const feedConsumedKg = periodConsumptions.reduce(
    (sum, c) => sum + (Number(c.feedQuantityKg) || (Number(c.bags) || 0) * 50),
    0
  );
  const feedConsumedBags = periodConsumptions.reduce((sum, c) => sum + getConsumptionBags(c), 0);

  const feedStockReceivedBags = periodStocks.reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
  const feedStockReceivedAmount = periodStocks.reduce((sum, k) => sum + (Number(k.amount) || 0), 0);

  const prevFeedConsumedBags = prevConsumptions.reduce((sum, c) => sum + getConsumptionBags(c), 0);
  const prevFeedReceivedBags = prevStocks.reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);

  // Period Expenses — Feed expense in Income vs Expense Summary reflects CONSUMED bags only
  const periodExpenses = unitExpenses.filter((x) => isInPeriod(x.date));
  const prevExpensesList = unitExpenses.filter((x) => isBeforePeriod(x.date));

  let nonFeedExpenses = 0;
  let rawFeedExpenses = 0;
  let salariesExpenses = 0;
  let medicineVaccineExpenses = 0;
  let utilitiesPolExpenses = 0;
  let chickenCapexExpenses = 0;
  const expHeadMap: Record<string, number> = {};

  for (const x of periodExpenses) {
    const amt = Number(x.amount ?? (x as any).expenseCost) || 0;
    const head = String(x.head || x.category || 'OTHER').toUpperCase().replace(/\s+/g, '_');
    if (head === 'FEED') {
      rawFeedExpenses += amt;
    } else {
      nonFeedExpenses += amt;
      expHeadMap[head] = (expHeadMap[head] || 0) + amt;
    }
    if (head === 'SALARIES_PAYMENTS') salariesExpenses += amt;
    if (head === 'MEDICINE' || head === 'VACCINE') medicineVaccineExpenses += amt;
    if (head === 'UTILITIES' || head === 'POL' || head === 'POWER_ELECTRIC') utilitiesPolExpenses += amt;
    if (head === 'CHICKEN') chickenCapexExpenses += amt;
  }

  // Compute consumed feed cost per unit so "All Units" reconciles with sum of individual units
  let feedExpenses = 0;
  if (selectedUnit === 'all') {
    const unitNames = new Set<string>(['Unit 1', 'Unit 2', 'Unit 3']);
    consumptionLogs.forEach((c) => unitNames.add(getUnitFromRecord(c)));
    allFeedStocks.forEach((k) => unitNames.add(getUnitFromRecord(k)));
    for (const uName of unitNames) {
      const uRawFeed = periodExpenses
        .filter((x) => getUnitFromRecord(x).toLowerCase() === uName.toLowerCase() && String(x.head || x.category || '').toUpperCase() === 'FEED')
        .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
      feedExpenses += computeConsumedFeedCostForUnit({
        unitStocks: allFeedStocks.filter((k) => getUnitFromRecord(k).toLowerCase() === uName.toLowerCase()),
        allFeedStocks,
        unitConsumptions: consumptionLogs.filter((c) => getUnitFromRecord(c).toLowerCase() === uName.toLowerCase()),
        rawUnitFeedExpenses: uRawFeed,
        fromDate,
        toDate,
      });
    }
  } else {
    feedExpenses = computeConsumedFeedCostForUnit({
      unitStocks: unitFeedStocks,
      allFeedStocks,
      unitConsumptions,
      rawUnitFeedExpenses: rawFeedExpenses,
      fromDate,
      toDate,
    });
  }

  if (feedExpenses > 0) {
    expHeadMap['FEED'] = feedExpenses;
  }

  const totalExpenses = nonFeedExpenses + feedExpenses;
  const cogsExpenses = Object.entries(expHeadMap).reduce(
    (sum, [head, amt]) => (COGS_CATEGORIES.has(head) ? sum + amt : sum),
    0
  );
  const operatingExpenses = Math.max(0, totalExpenses - cogsExpenses);
  const birdExpenses = Object.entries(expHeadMap).reduce(
    (sum, [head, amt]) => (BIRD_EXPENSE_HEADS.has(head) ? sum + amt : sum),
    0
  );
  const unitOperatingExpense = Math.max(0, totalExpenses - birdExpenses);

  // Prior period expenses also on consumed-feed basis for consistent cash rollover
  const prevNonFeedExpenses = prevExpensesList
    .filter((x) => String(x.head || x.category || '').toUpperCase().replace(/\s+/g, '_') !== 'FEED')
    .reduce((sum, x) => sum + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);

  let prevFeedExpenses = 0;
  if (fromDate) {
    const prevToDate = (() => {
      const d = new Date(`${fromDate}T00:00:00Z`);
      if (isNaN(d.getTime())) return fromDate;
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    if (selectedUnit === 'all') {
      const unitNames = new Set<string>(['Unit 1', 'Unit 2', 'Unit 3']);
      consumptionLogs.forEach((c) => unitNames.add(getUnitFromRecord(c)));
      allFeedStocks.forEach((k) => unitNames.add(getUnitFromRecord(k)));
      for (const uName of unitNames) {
        const uRawPrev = prevExpensesList
          .filter((x) => getUnitFromRecord(x).toLowerCase() === uName.toLowerCase() && String(x.head || x.category || '').toUpperCase() === 'FEED')
          .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
        prevFeedExpenses += computeConsumedFeedCostForUnit({
          unitStocks: allFeedStocks.filter((k) => getUnitFromRecord(k).toLowerCase() === uName.toLowerCase()),
          allFeedStocks,
          unitConsumptions: consumptionLogs.filter((c) => getUnitFromRecord(c).toLowerCase() === uName.toLowerCase()),
          rawUnitFeedExpenses: uRawPrev,
          fromDate: '',
          toDate: prevToDate,
        });
      }
    } else {
      const rawPrev = prevExpensesList
        .filter((x) => String(x.head || x.category || '').toUpperCase() === 'FEED')
        .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
      prevFeedExpenses = computeConsumedFeedCostForUnit({
        unitStocks: unitFeedStocks,
        allFeedStocks,
        unitConsumptions,
        rawUnitFeedExpenses: rawPrev,
        fromDate: '',
        toDate: prevToDate,
      });
    }
  }
  const prevExpensesTotal = prevNonFeedExpenses + prevFeedExpenses;

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

  const feedAvgCostPerBag =
    feedConsumedBags > 0
      ? feedExpenses / feedConsumedBags
      : feedStockReceivedBags > 0
      ? feedStockReceivedAmount / feedStockReceivedBags
      : 0;

  // Waterfall / Rollover calculations
  const netIncome = totalSalesRevenue - totalExpenses;
  const netMarginPercent = totalSalesRevenue > 0 ? (netIncome / totalSalesRevenue) * 100 : 0;
  const operatingProfitExclCapex = totalSalesRevenue - (totalExpenses - chickenCapexExpenses);
  const operatingMarginPercent = totalSalesRevenue > 0 ? (operatingProfitExclCapex / totalSalesRevenue) * 100 : 0;

  const carriedPrevEggs = prevCleanEggsProduced - prevEggsSold;
  const carriedPrevCartons = carriedPrevEggs / 360;
  const periodRemainingEggs = cleanEggsProduced - eggsSold;
  const periodRemainingCartons = periodRemainingEggs / 360;
  const carriedNextEggs = carriedPrevEggs + cleanEggsProduced - eggsSold;
  const carriedNextCartons = carriedNextEggs / 360;

  const avgCartonPrice = cartonsSold > 0 ? eggSalesRevenue / cartonsSold : 0;
  const avgEggPrice = avgCartonPrice > 0 ? avgCartonPrice / 360 : 0;
  const carriedNextEggValue = Math.max(0, carriedNextCartons) * avgCartonPrice;

  const carriedPrevFeedBags = prevFeedReceivedBags - prevFeedConsumedBags;
  const periodNetFeedBags = feedStockReceivedBags - feedConsumedBags;
  const closingLedgerFeedBags = carriedPrevFeedBags + feedStockReceivedBags - feedConsumedBags;
  const unitWarehouseBags = 0;
  const unitWarehouseKg = 0;
  const remainingFeedBags = closingLedgerFeedBags;
  const remainingFeedKg = remainingFeedBags * 50;
  const carriedNextFeedBags = remainingFeedBags;

  const carriedPrevNetCash = fromDate ? prevSalesRevenue - prevExpensesTotal : 0;
  const carriedNextNetCash = carriedPrevNetCash + netIncome;

  const avgPerBirdCost = activeBirds > 0 ? birdExpenses / activeBirds : 0;
  const avgPerBirdRevenue = activeBirds > 0 ? totalSalesRevenue / activeBirds : 0;
  const avgPerBirdNet = avgPerBirdRevenue - avgPerBirdCost;
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
    birdExpenses,
    unitOperatingExpense,
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
    feedAvgCostPerBag,
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

  // All stocks assign directly to production units (no central warehouse)
  const warehouseReserveKg = 0;
  const unitWarehouseBags = 0;

  const allFeedStocks = stockRecords.filter((k) => isFeedStockRecord(k));
  const unitNamesForAll = new Set<string>(['Unit 1', 'Unit 2', 'Unit 3']);
  consumptionLogs.forEach((c) => unitNamesForAll.add(getUnitFromRecord(c)));
  allFeedStocks.forEach((k) => unitNamesForAll.add(getUnitFromRecord(k)));

  let runningEggsBalance = 0;
  let runningFeedBalance = 0;

  if (selectedYear && selectedYear !== 'all') {
    const yearStart = `${selectedYear}-01-01`;
    const priorEggRows = eggProductions.filter(
      (e) => matchesSelectedUnit(e, selectedUnit) && normalizeDateStr(e.date) < yearStart
    );
    const priorEggsProduced = priorEggRows.reduce((s, e) => s + (Number(e.totalEggs) || 0), 0);
    const priorBrokenEggs = priorEggRows.reduce(
      (s, e) => s + (Number(e.damagedEggs ?? e.brokenEggs) || 0),
      0
    );
    const priorEggsSold = salesRecords
      .filter(
        (s) =>
          matchesSelectedUnit(s, selectedUnit) &&
          isEggSaleRecord(s) &&
          normalizeDateStr(s.date) < yearStart
      )
      .reduce((s, x) => s + getEggSaleQuantity(x), 0);
    runningEggsBalance = priorEggsProduced - priorBrokenEggs - priorEggsSold;

    const priorFeedReceived = allFeedStocks
      .filter((k) => matchesSelectedUnit(k, selectedUnit) && normalizeDateStr(k.date) < yearStart)
      .reduce((s, k) => s + (Number(k.quantity) || 0), 0);
    const priorFeedConsumed = consumptionLogs
      .filter((c) => matchesSelectedUnit(c, selectedUnit) && normalizeDateStr(c.date) < yearStart)
      .reduce((s, c) => s + getConsumptionBags(c), 0);
    runningFeedBalance = priorFeedReceived - priorFeedConsumed;
  }

  return sortedMonths.map((monthKey) => {
    const [y, m] = monthKey.split('-');
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    const mFrom = `${monthKey}-01`;
    const mTo = `${monthKey}-31`;

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
    const mStocks = allFeedStocks.filter(
      (k) => matchesSelectedUnit(k, selectedUnit) && normalizeDateStr(k.date).startsWith(monthKey)
    );

    const totalEggsProduced = mEggs.reduce((s, e) => s + (Number(e.totalEggs) || 0), 0);
    const brokenEggs = mEggs.reduce((s, e) => s + (Number(e.damagedEggs ?? e.brokenEggs) || 0), 0);
    const netEggsProduced = Math.max(0, totalEggsProduced - brokenEggs);
    const eggSales = mSales.filter((s) => isEggSaleRecord(s));
    const eggsSold = eggSales.reduce((s, x) => s + getEggSaleQuantity(x), 0);
    const eggRevenue = eggSales.reduce((s, x) => s + (Number(x.amount ?? x.totalAmount) || 0), 0);
    const totalSales = mSales.reduce((s, x) => s + (Number(x.amount ?? x.totalAmount) || 0), 0);

    const nonFeedMonthExpenses = mExpenses
      .filter((x) => String(x.head || x.category || '').toUpperCase().replace(/\s+/g, '_') !== 'FEED')
      .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);

    let feedConsumedExpense = 0;
    if (selectedUnit === 'all') {
      for (const uName of unitNamesForAll) {
        const uRawFeed = mExpenses
          .filter((x) => getUnitFromRecord(x).toLowerCase() === uName.toLowerCase() && String(x.head || x.category || '').toUpperCase() === 'FEED')
          .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
        feedConsumedExpense += computeConsumedFeedCostForUnit({
          unitStocks: allFeedStocks.filter((k) => getUnitFromRecord(k).toLowerCase() === uName.toLowerCase()),
          allFeedStocks,
          unitConsumptions: consumptionLogs.filter((c) => getUnitFromRecord(c).toLowerCase() === uName.toLowerCase()),
          rawUnitFeedExpenses: uRawFeed,
          fromDate: mFrom,
          toDate: mTo,
        });
      }
    } else {
      const rawFeed = mExpenses
        .filter((x) => String(x.head || x.category || '').toUpperCase() === 'FEED')
        .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
      feedConsumedExpense = computeConsumedFeedCostForUnit({
        unitStocks: allFeedStocks.filter((k) => matchesSelectedUnit(k, selectedUnit)),
        allFeedStocks,
        unitConsumptions: consumptionLogs.filter((c) => matchesSelectedUnit(c, selectedUnit)),
        rawUnitFeedExpenses: rawFeed,
        fromDate: mFrom,
        toDate: mTo,
      });
    }

    const totalExpenses = nonFeedMonthExpenses + feedConsumedExpense;
    const feedConsumedBags = mConsumptions.reduce((s, c) => s + getConsumptionBags(c), 0);
    const feedReceivedBags = mStocks.reduce((s, k) => s + (Number(k.quantity) || 0), 0);

    const carriedPrevCartons = runningEggsBalance / 360;
    runningEggsBalance = runningEggsBalance + (totalEggsProduced - brokenEggs) - eggsSold;
    const carriedNextCartons = runningEggsBalance / 360;

    const carriedPrevFeedBags = runningFeedBalance;
    const totalAvailableFeedBags = carriedPrevFeedBags + feedReceivedBags;
    runningFeedBalance = totalAvailableFeedBags - feedConsumedBags;

    const nonFeedBirdMonthExpenses = mExpenses
      .filter((x) => {
        const h = String(x.head || x.category || '').toUpperCase().replace(/\s+/g, '_');
        return h !== 'FEED' && BIRD_EXPENSE_HEADS.has(h);
      })
      .reduce((s, x) => s + (Number(x.amount ?? (x as any).expenseCost) || 0), 0);
    const monthBirdExpenses = feedConsumedExpense + nonFeedBirdMonthExpenses;
    const cartonsSold = eggsSold / 360;
    const avgCartonPrice = cartonsSold > 0 ? eggRevenue / cartonsSold : 0;
    const avgPerBirdCost = activeBirds > 0 ? monthBirdExpenses / activeBirds : 0;

    return {
      monthKey,
      monthLabel,
      totalEggsProduced,
      totalCartonsProduced: totalEggsProduced / 360,
      brokenEggs,
      brokenCartons: brokenEggs / 360,
      netEggsProduced,
      netCartonsProduced: (totalEggsProduced - brokenEggs) / 360,
      eggsSold,
      cartonsSold,
      totalSales,
      totalExpenses,
      feedConsumedExpense,
      netIncome: totalSales - totalExpenses,
      feedConsumedBags,
      feedReceivedBags,
      carriedPrevCartons,
      remainingProductionCartons: (totalEggsProduced - brokenEggs - eggsSold) / 360,
      carriedNextCartons,
      carriedPrevFeedBags,
      totalAvailableFeedBags,
      remainingFeedBags: runningFeedBalance,
      carriedNextFeedBags: runningFeedBalance,
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
