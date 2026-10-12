// 100% Authentic GreenOva Production Database Backup
// Extracted live from https://greenovapk.com/api (Farm: GVF2025 Multan)

export const liveOverview = {
  "totalRevenue": 294905597,
  "totalExpenses": 351179198.6,
  "netProfit": -56273601.600000024,
  "activeBirds": 85500,
  "cogs": 307128801.6,
  "costPerBird": 292.4
};
export const liveProduction = {
  "totalEggs": 16259340,
  "brokenEggs": 54900,
  "avgEggWeight": 59.99,
  "eggWastageRate": "0.34%",
  "averageLayingRate": "149.38%"
};
export const liveFlockPerformance = [
  {
    "flock": "Unit 3",
    "production": 850080,
    "mortality": 0
  },
  {
    "flock": "Unit 2",
    "production": 13767720,
    "mortality": 0
  },
  {
    "flock": "Unit 1",
    "production": 1641540,
    "mortality": 0
  }
];
export const liveSalesBreakdown = [
  {
    "head": "Feed BAGS",
    "amount": 264625
  },
  {
    "head": "EGG",
    "amount": 294013022
  },
  {
    "head": "OTHER",
    "amount": 19950
  },
  {
    "head": "Manure",
    "amount": 608000
  }
];
export const liveExpenseBreakdown = [
  {
    "head": "PROFESSIONAL FEE",
    "amount": 150000
  },
  {
    "head": "PACKING MATERIAL",
    "amount": 4797610
  },
  {
    "head": "CHICKEN",
    "amount": 25291900
  },
  {
    "head": "POWER ELECTRIC",
    "amount": 1373671
  },
  {
    "head": "MEETING REFRESHMENT",
    "amount": 627590
  },
  {
    "head": "TRAVELLING LOGISTICS",
    "amount": 25180
  },
  {
    "head": "OTHER",
    "amount": 2
  },
  {
    "head": "SALARIES PAYMENTS",
    "amount": 7078367
  },
  {
    "head": "OFFICE EXPENSES",
    "amount": 264416
  },
  {
    "head": "MEDICINE",
    "amount": 10303308.6
  },
  {
    "head": "POL",
    "amount": 5509163
  },
  {
    "head": "RENT",
    "amount": 7855701
  },
  {
    "head": "FEED",
    "amount": 266905100
  },
  {
    "head": "UTILITIES",
    "amount": 7230875
  },
  {
    "head": "COMPUTER DEVICES",
    "amount": 26050
  },
  {
    "head": "VACCINE",
    "amount": 4628493
  },
  {
    "head": "TP",
    "amount": 3809593
  },
  {
    "head": "REPAIR MAINTENANCE",
    "amount": 1652935
  },
  {
    "head": "MISCELLANEOUS",
    "amount": 678801
  },
  {
    "head": "FURNITURE FIXTURE",
    "amount": 192860
  },
  {
    "head": "MESS",
    "amount": 2777583
  }
];
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
    "eggs": 49020
  }
];

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
];

export const liveFlocks = [
  {
    id: "flock-unit-1",
    farmId: "farm-9",
    name: "Unit 1 (Layer Shed)",
    shedNumber: "Shed 01",
    breed: "Lohmann Brown-Classic",
    purpose: "Layers" as const,
    initialCount: 20000,
    currentCount: 18500,
    ageWeeks: 38,
    startDate: "2026-01-15",
    status: "Active" as const,
    targetFCR: 2.05,
  },
  {
    id: "flock-unit-2",
    farmId: "farm-9",
    name: "Unit 2 (Main Layer Complex)",
    shedNumber: "Shed 02",
    breed: "Hy-Line Brown",
    purpose: "Layers" as const,
    initialCount: 50000,
    currentCount: 47000,
    ageWeeks: 32,
    startDate: "2026-03-01",
    status: "Active" as const,
    targetFCR: 2.02,
  },
  {
    id: "flock-unit-3",
    farmId: "farm-9",
    name: "Unit 3 (Commercial Batch)",
    shedNumber: "Shed 03",
    breed: "Lohmann Brown",
    purpose: "Layers" as const,
    initialCount: 22000,
    currentCount: 20000,
    ageWeeks: 26,
    startDate: "2026-04-10",
    status: "Active" as const,
    targetFCR: 2.08,
  }
];

export const liveEggProductions = [
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-11",
    morningEggs: 16461,
    eveningEggs: 10089,
    totalEggs: 26550,
    damagedEggs: 90,
    cleanTrays: 885,
    layingRatePercent: 75.86,
    notes: "81.49% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-11",
    morningEggs: 13931,
    eveningEggs: 8538,
    totalEggs: 22470,
    damagedEggs: 0,
    cleanTrays: 749,
    layingRatePercent: 89.88,
    notes: "92.65% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-10",
    morningEggs: 12536,
    eveningEggs: 7683,
    totalEggs: 20220,
    damagedEggs: 0,
    cleanTrays: 674,
    layingRatePercent: 79.29,
    notes: "87.57% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-10",
    morningEggs: 16591,
    eveningEggs: 10168,
    totalEggs: 26760,
    damagedEggs: 60,
    cleanTrays: 892,
    layingRatePercent: 76.46,
    notes: "82.04% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-10",
    morningEggs: 13819,
    eveningEggs: 8470,
    totalEggs: 22290,
    damagedEggs: 0,
    cleanTrays: 743,
    layingRatePercent: 89.16,
    notes: "91.89% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-09",
    morningEggs: 12555,
    eveningEggs: 7695,
    totalEggs: 20250,
    damagedEggs: 0,
    cleanTrays: 675,
    layingRatePercent: 79.41,
    notes: "87.44% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-09",
    morningEggs: 16609,
    eveningEggs: 10180,
    totalEggs: 26790,
    damagedEggs: 30,
    cleanTrays: 893,
    layingRatePercent: 76.54,
    notes: "81.94% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-09",
    morningEggs: 13726,
    eveningEggs: 8413,
    totalEggs: 22140,
    damagedEggs: 0,
    cleanTrays: 738,
    layingRatePercent: 88.56,
    notes: "91.25% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-08",
    morningEggs: 12629,
    eveningEggs: 7740,
    totalEggs: 20370,
    damagedEggs: 0,
    cleanTrays: 679,
    layingRatePercent: 79.88,
    notes: "87.95% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-08",
    morningEggs: 16591,
    eveningEggs: 10168,
    totalEggs: 26760,
    damagedEggs: 60,
    cleanTrays: 892,
    layingRatePercent: 76.46,
    notes: "81.35% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-08",
    morningEggs: 13857,
    eveningEggs: 8493,
    totalEggs: 22350,
    damagedEggs: 0,
    cleanTrays: 745,
    layingRatePercent: 89.4,
    notes: "92.11% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-07",
    morningEggs: 12536,
    eveningEggs: 7683,
    totalEggs: 20220,
    damagedEggs: 0,
    cleanTrays: 674,
    layingRatePercent: 79.29,
    notes: "87.16% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-07",
    morningEggs: 16107,
    eveningEggs: 9872,
    totalEggs: 25980,
    damagedEggs: 90,
    cleanTrays: 866,
    layingRatePercent: 74.23,
    notes: "81.74% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-07",
    morningEggs: 13894,
    eveningEggs: 8515,
    totalEggs: 22410,
    damagedEggs: 0,
    cleanTrays: 747,
    layingRatePercent: 89.64,
    notes: "92.34% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-06",
    morningEggs: 12592,
    eveningEggs: 7717,
    totalEggs: 20310,
    damagedEggs: 0,
    cleanTrays: 677,
    layingRatePercent: 79.65,
    notes: "87.67% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-06",
    morningEggs: 16256,
    eveningEggs: 9963,
    totalEggs: 26220,
    damagedEggs: 60,
    cleanTrays: 874,
    layingRatePercent: 74.91,
    notes: "81.45% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-06",
    morningEggs: 13894,
    eveningEggs: 8515,
    totalEggs: 22410,
    damagedEggs: 0,
    cleanTrays: 747,
    layingRatePercent: 89.64,
    notes: "92.33% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 3",
    date: "2026-10-05",
    morningEggs: 12499,
    eveningEggs: 7660,
    totalEggs: 20160,
    damagedEggs: 0,
    cleanTrays: 672,
    layingRatePercent: 79.06,
    notes: "87.02% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 2",
    date: "2026-10-05",
    morningEggs: 16330,
    eveningEggs: 10009,
    totalEggs: 26340,
    damagedEggs: 150,
    cleanTrays: 878,
    layingRatePercent: 75.26,
    notes: "80.98% production",
  },
  {
    id: "egg-None",
    flockId: "flock-unit-2",
    flockName: "Unit 1",
    date: "2026-10-05",
    morningEggs: 13931,
    eveningEggs: 8538,
    totalEggs: 22470,
    damagedEggs: 0,
    cleanTrays: 749,
    layingRatePercent: 89.88,
    notes: "92.57% production",
  },
];

export const liveSalesRecords = [
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 260000,
    date: "2026-10-10",
    referenceNo: "CHALLAN-2061",
    description: "14400 eggs to m shah (40p @6500)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 6700,
    date: "2026-10-10",
    referenceNo: "CHALLAN-2060",
    description: "360 eggs to Imran shop  (1p @6700)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 3240,
    date: "2026-10-10",
    referenceNo: "CHALLAN-2059",
    description: "180 eggs to Saleem Broken (6c @3600 broken + 12kg @120 liquid)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 31700,
    date: "2026-10-10",
    referenceNo: "CHALLAN-51",
    description: "1860 eggs to gulfan ali  (2c @7200 + 5p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 244000,
    date: "2026-10-09",
    referenceNo: "CHALLAN-20",
    description: "14400 eggs to rana Tasleem (40p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 61000,
    date: "2026-10-09",
    referenceNo: "CHALLAN-2058",
    description: "3600 eggs to rana Tasleem (10p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 39000,
    date: "2026-10-09",
    referenceNo: "CHALLAN-2057",
    description: "2160 eggs to shahbaz (6p @6500)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 6700,
    date: "2026-10-09",
    referenceNo: "CHALLAN-2056",
    description: "360 eggs to Imran shop  (1p @6700)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 32750,
    date: "2026-10-09",
    referenceNo: "CHALLAN-2055",
    description: "1800 eggs to nadeem (5p @6550)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 24400,
    date: "2026-10-09",
    referenceNo: "CHALLAN-50",
    description: "1440 eggs to nadeem bhai (4p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 361200,
    date: "2026-10-09",
    referenceNo: "CHALLAN-49",
    description: "0 eggs to latif (2c @7200+ 60p @6000)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 183000,
    date: "2026-10-09",
    referenceNo: "CHALLAN-48",
    description: "10800 eggs to azeem ahmad (30p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 768000,
    date: "2026-10-08",
    referenceNo: "CHALLAN-19",
    description: "43200 eggs to Tariq (120p @6400)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 0,
    date: "2026-10-08",
    referenceNo: "CHALLAN-2054",
    description: "90 eggs to Amjad Nawaz (3c @Amjad nawaz F.O.C)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 630000,
    date: "2026-10-08",
    referenceNo: "CHALLAN-2053",
    description: "36000 eggs to Masood (100p @6300)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 13300,
    date: "2026-10-08",
    referenceNo: "CHALLAN-2052",
    description: "720 eggs to sajjad  (1p @6700 + 1p @6600)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 28450,
    date: "2026-10-08",
    referenceNo: "CHALLAN-47",
    description: "1950 eggs to Saleem Broken (3p @5000 + 5c @3000+ 2p @6100)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 870600,
    date: "2026-10-08",
    referenceNo: "CHALLAN-46",
    description: "54030 eggs to Abdul jabar  (150p @5800+ 1c @7200 double)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 7800,
    date: "2026-10-07",
    referenceNo: "CHALLAN-18",
    description: "420 eggs to gulfam ali  (2c @7200 + 1p @6600)",
    status: "Paid" as const,
  },
  {
    id: "sale-None",
    type: "Income" as const,
    category: "Egg Sales" as const,
    amount: 6800,
    date: "2026-10-07",
    referenceNo: "CHALLAN-2051",
    description: "360 eggs to Imran shop  (1p @6800)",
    status: "Paid" as const,
  },
];

export const liveExpenseRecords = [
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 4950,
    date: "2026-10-11",
    referenceNo: "EXP-CHALLAN-1443",
    description: "POL: gas filling",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MEETING_REFRESHMENT" as any,
    amount: 1000,
    date: "2026-10-11",
    referenceNo: "EXP-CHALLAN-1443",
    description: "MEETING_REFRESHMENT: office refreshment",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MESS" as any,
    amount: 100,
    date: "2026-10-11",
    referenceNo: "EXP-CHALLAN-1443",
    description: "MESS: ice",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "TP" as any,
    amount: 100,
    date: "2026-10-10",
    referenceNo: "EXP-CHALLAN-1442",
    description: "TP: tube",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MESS" as any,
    amount: 130,
    date: "2026-10-10",
    referenceNo: "EXP-CHALLAN-1442",
    description: "MESS: ice",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 200,
    date: "2026-10-10",
    referenceNo: "EXP-CHALLAN-1442",
    description: "POL: petrol",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 24110,
    date: "2026-10-10",
    referenceNo: "EXP-CHALLAN-1441",
    description: "POL: diesel 60L",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "FEED" as any,
    amount: 554704,
    date: "2026-10-10",
    referenceNo: "EXP-CHALLAN-1440",
    description: "FEED: 100 bags 13c3 unit 2 D.O :3535",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MESS" as any,
    amount: 3830,
    date: "2026-10-09",
    referenceNo: "EXP-CHALLAN-1439",
    description: "MESS: meat + ice + roti lgwai",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 500,
    date: "2026-10-09",
    referenceNo: "EXP-CHALLAN-1439",
    description: "POL: PETROL",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "FEED" as any,
    amount: 554704,
    date: "2026-10-09",
    referenceNo: "EXP-CHALLAN-1438",
    description: "FEED: 100 bags 13c3 unit 2 D.O.:3499",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "REPAIR_MAINTENANCE" as any,
    amount: 200,
    date: "2026-10-08",
    referenceNo: "EXP-CHALLAN-200",
    description: "REPAIR_MAINTENANCE: cart puncture",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "OFFICE_EXPENSES" as any,
    amount: 100,
    date: "2026-10-08",
    referenceNo: "EXP-CHALLAN-1437",
    description: "OFFICE_EXPENSES: office lehsan and ginger",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 400,
    date: "2026-10-08",
    referenceNo: "EXP-CHALLAN-1437",
    description: "POL: petrol",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MESS" as any,
    amount: 130,
    date: "2026-10-08",
    referenceNo: "EXP-CHALLAN-1437",
    description: "MESS: ice",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "OFFICE_EXPENSES" as any,
    amount: 2000,
    date: "2026-10-07",
    referenceNo: "EXP-CHALLAN-1436",
    description: "OFFICE_EXPENSES: hasnain package mobile",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "MESS" as any,
    amount: 4930,
    date: "2026-10-07",
    referenceNo: "EXP-CHALLAN-1436",
    description: "MESS: ice + slipper 8",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 400,
    date: "2026-10-07",
    referenceNo: "EXP-CHALLAN-1436",
    description: "POL: petrol",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "POL" as any,
    amount: 24210,
    date: "2026-10-07",
    referenceNo: "EXP-CHALLAN-1435",
    description: "POL: diesel 60l",
    status: "Paid" as const,
  },
  {
    id: "exp-None",
    type: "Expense" as const,
    category: "PACKING_MATERIAL" as any,
    amount: 64000,
    date: "2026-10-06",
    referenceNo: "EXP-CHALLAN-1434",
    description: "PACKING_MATERIAL: cardboard 22 number 80 bundle",
    status: "Paid" as const,
  },
];

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
