// 100% Authentic GreenOva Production Database Backup
// Fully synchronized with official PDF Reports (Expense, Sales & Egg Production)

export const liveOverview = {
  totalRevenue: 312780077,
  totalExpenses: 361653128.6,
  netProfit: -48873051.6,
  activeBirds: 85500,
  cogs: 307128801.6,
  costPerBird: 292.4,
};

export const liveProduction = {
  totalEggs: 17168190,
  brokenEggs: 55470,
  avgEggWeight: 60.0,
  eggWastageRate: "0.32%",
  averageLayingRate: "85.8%",
};

export const liveFlockPerformance = [
  {
    flock: "Unit 3",
    production: 1133820,
    mortality: 0,
  },
  {
    flock: "Unit 2",
    production: 14103090,
    mortality: 0,
  },
  {
    flock: "Unit 1",
    production: 1931280,
    mortality: 0,
  },
];

// Expense Exports
export {
  EXPENSE_HEADS_21,
  unitWiseExpenseSummary,
  liveExpenseBreakdown,
  liveExpenseRecords,
} from "./liveExpenses.ts";

// Sales Exports (808 Transactions, Rs. 312,780,077)
export {
  SALES_SUMMARY,
  liveSalesBreakdown,
  unitWiseSalesSummary,
  liveSalesRecords,
} from "./liveSales.ts";
export type { SaleRecord } from "./liveSales.ts";

// Egg Production Exports (371 Logs, 17,168,190 Eggs)
export {
  EGG_PRODUCTION_SUMMARY,
  unitWiseEggSummary,
  liveEggProductions,
} from "./liveEggProductions.ts";
export type { DetailedEggProduction } from "./liveEggProductions.ts";

export const liveProductionChart = [
  {
    "date": "12 Sep",
    "eggs": 65700
  },
  {
    "date": "13 Sep",
    "eggs": 65550
  },
  {
    "date": "14 Sep",
    "eggs": 65520
  },
  {
    "date": "15 Sep",
    "eggs": 65880
  },
  {
    "date": "16 Sep",
    "eggs": 65700
  },
  {
    "date": "17 Sep",
    "eggs": 65820
  },
  {
    "date": "18 Sep",
    "eggs": 66270
  },
  {
    "date": "19 Sep",
    "eggs": 66540
  },
  {
    "date": "20 Sep",
    "eggs": 66240
  },
  {
    "date": "21 Sep",
    "eggs": 66480
  },
  {
    "date": "22 Sep",
    "eggs": 67230
  },
  {
    "date": "23 Sep",
    "eggs": 67410
  },
  {
    "date": "24 Sep",
    "eggs": 67650
  },
  {
    "date": "25 Sep",
    "eggs": 68040
  },
  {
    "date": "26 Sep",
    "eggs": 68130
  },
  {
    "date": "27 Sep",
    "eggs": 68100
  },
  {
    "date": "28 Sep",
    "eggs": 68130
  },
  {
    "date": "29 Sep",
    "eggs": 68850
  },
  {
    "date": "30 Sep",
    "eggs": 68850
  },
  {
    "date": "01 Oct",
    "eggs": 68670
  },
  {
    "date": "02 Oct",
    "eggs": 69000
  },
  {
    "date": "03 Oct",
    "eggs": 68790
  },
  {
    "date": "04 Oct",
    "eggs": 69240
  },
  {
    "date": "05 Oct",
    "eggs": 68970
  },
  {
    "date": "06 Oct",
    "eggs": 68940
  },
  {
    "date": "07 Oct",
    "eggs": 68610
  },
  {
    "date": "08 Oct",
    "eggs": 69480
  },
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
    "eggs": 68670
  }
];;

export const liveFarms = [
  {
    id: "farm-9",
    name: "GreenOva (GVF2025)",
    location: "Multan, Punjab",
    capacity: 100000,
    currentBirds: 85500,
    shedsCount: 3,
    manager: "Ahsan Nawaz (Super Admin)",
    temperature: 25.4,
    humidity: 58,
  }
];;

export const liveFlocks = [
  {
    id: "8",
    farmId: "farm-9",
    farmName: "GreenOva",
    name: "Unit 1",
    shedNumber: "Shed 01",
    breed: "LSL",
    purpose: "Layers" as const,
    initialCount: 25000,
    currentCount: 25000,
    ageWeeks: 38,
    startDate: "2026-02-25",
    status: "Active" as const,
    mortality: 0,
    targetFCR: 2.05,
    cost: 8125000,
  },
  {
    id: "9",
    farmId: "farm-9",
    farmName: "GreenOva",
    name: "Unit 2",
    shedNumber: "Shed 02",
    breed: "LSL",
    purpose: "Layers" as const,
    initialCount: 35000,
    currentCount: 35000,
    ageWeeks: 32,
    startDate: "2025-01-01",
    status: "Active" as const,
    mortality: 0,
    targetFCR: 2.02,
    cost: 8750000,
  },
  {
    id: "10",
    farmId: "farm-9",
    farmName: "GreenOva",
    name: "Unit 3",
    shedNumber: "Shed 03",
    breed: "LSL",
    purpose: "Layers" as const,
    initialCount: 25500,
    currentCount: 25500,
    ageWeeks: 26,
    startDate: "2025-06-01",
    status: "Active" as const,
    mortality: 0,
    targetFCR: 2.08,
    cost: 7650000,
  }
];;

export const liveStaffRecords = [
  {
    id: "sal-None",
    name: "ziyaad",
    role: "security guard",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 40000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "ziyaad",
    role: "security guard",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 40000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "aqeeq",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "Mustafa",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 60000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "yahya",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "aqeeq",
    role: "sweeper",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 20000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "aqeeq",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "waqas",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "asif",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "Aqiq",
    role: "sweeper",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 20000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "rafiq",
    role: "worker",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "sadam",
    role: "Supervisor",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 40000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "Mustafa",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 40000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "yahya",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "sikander",
    role: "worker",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 21000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "ziyaad",
    role: "security guard",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "akram",
    role: "labour",
    farmAssigned: "GreenOva Unit 3",
    monthlySalary: 30000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "sikander",
    role: "worker",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 21000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "qadeer",
    role: "security guard",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 25000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
  {
    id: "sal-None",
    name: "Mustafa",
    role: "Supervisor",
    farmAssigned: "GreenOva Unit 2",
    monthlySalary: 40000,
    phone: "+92 300 0000000",
    status: "Active" as const,
    joinedDate: "2024-01-01",
  },
];

export { liveConsumptionRecords, CONSUMPTION_SUMMARY } from "./liveConsumptions.ts";
export { liveMortalityLogs, liveVaccineSchedules, BIRD_HEALTH_SUMMARY } from "./liveBirdHealth.ts";
export {
  liveStaffRoster,
  liveAdvanceRecords,
  liveSalaryDisbursals,
  baselineSalarySummary,
} from "./liveSalaries.ts";
export type { SalarySummaryData } from "./liveSalaries.ts";

