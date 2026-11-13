// 100% Authentic GreenOva Production Database Backup
// Fully synchronized with official PDF Reports (Expense, Sales, Stock, Salaries & Egg Production)

export const liveOverview = {
  totalRevenue: 329694177,
  totalExpenses: 387153843.6,
  netProfit: -57459666.600000024,
  activeBirds: 81714,
  cogs: 336594580.6,
  costPerBird: 4737.9,
};

export const liveProduction = {
  totalEggs: 18126930,
  brokenEggs: 57570,
  avgEggWeight: 60.0,
  eggWastageRate: "0.32%",
  averageLayingRate: "85.8%",
};

export const liveFlockPerformance = [
  {
    "flock": "Unit 1",
    "production": 2242800,
    "mortality": 0
  },
  {
    "flock": "Unit 2",
    "production": 14463810,
    "mortality": 0
  },
  {
    "flock": "Unit 3",
    "production": 1420320,
    "mortality": 0
  }
];

// Expense Exports
export {
  EXPENSE_HEADS_21,
  unitWiseExpenseSummary,
  liveExpenseBreakdown,
  liveExpenseRecords,
} from "./liveExpenses.ts";

// Sales Exports (938 Transactions, Rs. 329,694,177)
export {
  SALES_SUMMARY,
  liveSalesBreakdown,
  unitWiseSalesSummary,
  liveSalesRecords,
} from "./liveSales.ts";
export type { SaleRecord } from "./liveSales.ts";

// Egg Production Exports (413 Logs, 18,126,930 Eggs)
export {
  EGG_PRODUCTION_SUMMARY,
  unitWiseEggSummary,
  liveEggProductions,
} from "./liveEggProductions.ts";
export type { DetailedEggProduction } from "./liveEggProductions.ts";

export const liveProductionChart = [
  {
    "date": "09 Oct",
    "eggs": 69180
  },
  {
    "date": "10 Oct",
    "eggs": 69270
  },
  {
    "date": "11 Oct",
    "eggs": 69060
  },
  {
    "date": "12 Oct",
    "eggs": 68640
  },
  {
    "date": "13 Oct",
    "eggs": 68550
  },
  {
    "date": "14 Oct",
    "eggs": 68640
  },
  {
    "date": "15 Oct",
    "eggs": 68370
  },
  {
    "date": "16 Oct",
    "eggs": 68160
  },
  {
    "date": "17 Oct",
    "eggs": 68340
  },
  {
    "date": "18 Oct",
    "eggs": 68220
  },
  {
    "date": "19 Oct",
    "eggs": 68070
  },
  {
    "date": "20 Oct",
    "eggs": 68160
  },
  {
    "date": "21 Oct",
    "eggs": 67800
  },
  {
    "date": "22 Oct",
    "eggs": 68400
  },
  {
    "date": "23 Oct",
    "eggs": 68790
  },
  {
    "date": "24 Oct",
    "eggs": 68670
  },
  {
    "date": "25 Oct",
    "eggs": 68640
  },
  {
    "date": "26 Oct",
    "eggs": 68550
  },
  {
    "date": "27 Oct",
    "eggs": 68730
  },
  {
    "date": "28 Oct",
    "eggs": 68430
  },
  {
    "date": "29 Oct",
    "eggs": 68760
  },
  {
    "date": "30 Oct",
    "eggs": 68460
  },
  {
    "date": "31 Oct",
    "eggs": 68160
  },
  {
    "date": "01 Nov",
    "eggs": 68460
  },
  {
    "date": "02 Nov",
    "eggs": 68910
  },
  {
    "date": "03 Nov",
    "eggs": 68130
  },
  {
    "date": "04 Nov",
    "eggs": 68280
  },
  {
    "date": "05 Nov",
    "eggs": 68370
  },
  {
    "date": "06 Nov",
    "eggs": 68370
  },
  {
    "date": "07 Nov",
    "eggs": 68490
  }
];

export {
  liveStockRecords,
  unitWiseStockSummary,
  STOCK_SUMMARY,
} from "./liveStocks.ts";
export type { StockRecord } from "./liveStocks.ts";

export {
  liveConsumptionRecords,
  CONSUMPTION_SUMMARY,
} from "./liveConsumptions.ts";

export {
  liveStaffRoster,
  liveAdvanceRecords,
  liveSalaryDisbursals,
  baselineSalarySummary,
} from "./liveSalaries.ts";

export {
  liveMortalityLogs,
  liveVaccineSchedules,
} from "./liveBirdHealth.ts";

export const liveFarms = [
  {
    id: "9",
    name: "GreenOva",
    code: "GVF2025",
    location: "Multan, Punjab",
    capacity: 100000,
    currentBirds: 81714,
    shedsCount: 3,
    manager: "Ahsan Nawaz",
    temperature: 24,
    humidity: 58,
    description: "Main Commercial Egg Production Facility",
  },
  {
    id: "1",
    name: "A&A Proteins",
    code: "GVF-01",
    location: "Multan, Punjab",
    capacity: 50000,
    currentBirds: 0,
    shedsCount: 2,
    manager: "Rana Adeel",
    temperature: 26,
    humidity: 55,
    description: "Secondary Layer Facility",
  },
];

export const liveFlocks = [
  {
    id: "8",
    farmId: "9",
    farmName: "GreenOva",
    name: "Unit 1",
    shedNumber: "Shed 1",
    breed: "LSL Classic",
    purpose: "Layers",
    initialCount: 25000,
    currentCount: 24786,
    ageWeeks: 42,
    startDate: "2026-02-25",
    status: "Active",
    mortality: 5,
    targetFCR: 1.48,
    cost: 8125000,
    notes: "Unit 1 Layer House - Peak Egg Production",
  },
  {
    id: "9",
    farmId: "9",
    farmName: "GreenOva",
    name: "Unit 2",
    shedNumber: "Shed 2",
    breed: "LSL Classic",
    purpose: "Layers",
    initialCount: 35000,
    currentCount: 31739,
    ageWeeks: 36,
    startDate: "2025-01-01",
    status: "Active",
    mortality: 7,
    targetFCR: 1.46,
    cost: 8750000,
    notes: "Unit 2 Main Commercial Egg House",
  },
  {
    id: "10",
    farmId: "9",
    farmName: "GreenOva",
    name: "Unit 3",
    shedNumber: "Shed 3",
    breed: "LSL Classic",
    purpose: "Layers",
    initialCount: 25500,
    currentCount: 25189,
    ageWeeks: 30,
    startDate: "2025-06-01",
    status: "Active",
    mortality: 3,
    targetFCR: 1.50,
    cost: 7650000,
    notes: "Unit 3 Layer Batch - Environmental Control",
  },
];

export const liveStaffRecords = [
  {
    id: "staff-1",
    name: "Mustafa",
    role: "Production Supervisor",
    farmAssigned: "Unit 2 (Shed 2)",
    phone: "+92 301 7728101",
    monthlySalary: 45000,
    advanceBalance: 53000,
    status: "Active",
  },
  {
    id: "staff-2",
    name: "Sadam",
    role: "Flock Supervisor",
    farmAssigned: "Unit 3 (Shed 3)",
    phone: "+92 302 8819202",
    monthlySalary: 40000,
    advanceBalance: 10000,
    status: "Active",
  },
  {
    id: "staff-3",
    name: "Ziyaad",
    role: "Security Guard",
    farmAssigned: "Main Gate",
    phone: "+92 303 6618293",
    monthlySalary: 35000,
    advanceBalance: 37000,
    status: "Active",
  },
];
