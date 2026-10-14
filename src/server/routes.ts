import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Load local database backup
const backupPath = path.resolve(process.cwd(), 'public/GreenOva_Full_DB_Backup.json');
let backupData: Record<string, any> = {};

try {
  if (fs.existsSync(backupPath)) {
    backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load GreenOva_Full_DB_Backup.json:', e);
}

// 1. Independent Authentication
apiRouter.post('/auth/signin', (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  const token = 'standalone-jwt-' + Buffer.from((email || 'admin') + ':' + Date.now()).toString('base64');
  const role = email === 'aaglobal500@gmail.com' ? 'super_admin' : 'admin';
  const name =
    email === 'aaglobal500@gmail.com'
      ? 'Ahsan Nawaz'
      : email === 'adeelrana981@gmail.com'
      ? 'Rana Adeel'
      : email === 'midhatfatima2004@gmail.com'
      ? 'Midhat Fatima'
      : 'Farm Administrator';

  return res.json({
    message: 'success',
    data: {
      token,
      user: {
        id: 2,
        name,
        email: email || 'aaglobal500@gmail.com',
        status: 'allowed',
        role,
        isEmailVerified: true,
        createdAt: '2026-03-13T04:37:29.375Z',
      },
    },
  });
});

// 2. Dashboard API
apiRouter.get('/dashboard', (_req: Request, res: Response) => {
  const dash = backupData['/dashboard']?.data || {
    overview: {
      totalRevenue: 294905597,
      totalExpenses: 351179198.6,
      netProfit: -56273601.6,
      activeBirds: 85500,
      cogs: 307128801.6,
      costPerBird: 292.4,
    },
    production: {
      totalEggs: 16259340,
      brokenEggs: 54900,
      avgEggWeight: 59.99,
      eggWastageRate: '0.34%',
      averageLayingRate: '149.38%',
    },
    healthMetrics: {
      mortalityInRange: 0,
      cullInRange: 0,
      totalFeedConsumedBags: 45595,
      totalWaterConsumption: 5420000,
      totalFeedPurchased: 45595,
      feedConversionRate: 1.48,
    },
    additionalMetrics: {
      flockCount: 3,
      avgEggPriceInRange: 18.08,
    },
    flockPerformance: [
      { flock: 'Unit 3', production: 850080, mortality: 0 },
      { flock: 'Unit 2', production: 13767720, mortality: 0 },
      { flock: 'Unit 1', production: 1641540, mortality: 0 },
    ],
    salesBreakdown: [
      { head: 'EGG', amount: 294013022 },
      { head: 'Manure', amount: 608000 },
      { head: 'Feed BAGS', amount: 264625 },
      { head: 'OTHER', amount: 19950 },
    ],
    expenseBreakdown: [
      { head: 'FEED', amount: 266905100 },
      { head: 'CHICKEN', amount: 25291900 },
      { head: 'MEDICINE', amount: 10303308.6 },
      { head: 'RENT', amount: 7855701 },
      { head: 'UTILITIES', amount: 7230875 },
      { head: 'SALARIES PAYMENTS', amount: 7078367 },
      { head: 'POL', amount: 5509163 },
    ],
    inventoryAlerts: [],
    chart: [],
  };

  res.json({
    message: 'Dashboard stats generated successfully',
    data: dash,
  });
});

// 3. Flocks API (Exact structure with acquiredDate, ageInWeeks, farm for Dze component)
const flockItems = [
  {
    id: 8,
    farmId: 9,
    flockName: 'Unit 1',
    breed: 'LSL',
    totalBirds: 25000,
    originalTotalBirds: 24786,
    cost: 8125000,
    isActive: true,
    ageWeeks: 38,
    ageInWeeks: 38,
    acquiredDate: '2026-02-25T00:00:00.000Z',
    exitDate: null,
    mortality: 0,
    notes: 'Unit 1 LSL Commercial Layers',
    farm: { id: 9, name: 'GreenOva', code: 'GVF2025', location: 'Multan, Punjab' },
  },
  {
    id: 9,
    farmId: 9,
    flockName: 'Unit 2',
    breed: 'LSL',
    totalBirds: 35000,
    originalTotalBirds: 31739,
    cost: 8750000,
    isActive: true,
    ageWeeks: 32,
    ageInWeeks: 32,
    acquiredDate: '2025-01-01T00:00:00.000Z',
    exitDate: null,
    mortality: 0,
    notes: 'Unit 2 Main Production',
    farm: { id: 9, name: 'GreenOva', code: 'GVF2025', location: 'Multan, Punjab' },
  },
  {
    id: 10,
    farmId: 9,
    flockName: 'Unit 3',
    breed: 'LSL',
    totalBirds: 25500,
    originalTotalBirds: 25189,
    cost: 8125000,
    isActive: true,
    ageWeeks: 26,
    ageInWeeks: 26,
    acquiredDate: '2026-03-25T00:00:00.000Z',
    exitDate: null,
    mortality: 0,
    notes: 'Unit 3 Modern Cage Facility',
    farm: { id: 9, name: 'GreenOva', code: 'GVF2025', location: 'Multan, Punjab' },
  },
];

apiRouter.get(['/flock', '/flocks'], (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      items: flockItems,
      pagination: {
        page: 1,
        limit: 100,
        total: flockItems.length,
        pages: 1,
      },
    },
  });
});

apiRouter.get(['/flock/summary', '/flocks/summary'], (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalFlocks: 3,
      totalBirds: 85500,
      totalMortality: 0,
      activeFlocks: 3,
      inactiveFlocks: 0,
      flockCount: 3,
    },
  });
});

// 4. Farms API
const farmList = [
  {
    id: 9,
    name: 'GreenOva',
    code: 'GVF2025',
    location: 'Multan, Punjab',
    description: 'GreenOva Layer Operations',
    active: true,
    createdAt: '2026-05-08T17:37:25.635Z',
    updatedAt: '2026-05-08T17:37:25.635Z',
  },
  {
    id: 1,
    name: 'A&A Proteins',
    code: 'GVF-01',
    location: 'Multan, Punjab',
    description: 'Breeding Wing',
    active: false,
    createdAt: '2026-03-29T18:46:51.378Z',
    updatedAt: '2026-05-05T07:16:18.775Z',
  },
];

apiRouter.get('/getFarms', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: farmList,
  });
});

apiRouter.get('/farms', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      items: farmList,
      pagination: { page: 1, limit: 10, total: farmList.length, pages: 1 },
    },
  });
});

// 5. Stock Store API
apiRouter.get('/stock-store', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: [
      { id: 1, name: 'FEED 13', category: 'FEED', currentStock: 2500, unit: 'bags' },
      { id: 2, name: 'MEDICINE', category: 'MEDICINE', currentStock: 120, unit: 'packs' },
      { id: 3, name: 'VACCINE', category: 'VACCINE', currentStock: 45, unit: 'vials' },
    ],
  });
});

// 6. User Management API
const userList = [
  { id: 2, name: 'Ahsan Nawaz', email: 'aaglobal500@gmail.com', role: 'super_admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-03-13T04:37:29.375Z' },
  { id: 6, name: 'Rana Adeel', email: 'adeelrana981@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-05-25T09:59:06.029Z' },
  { id: 8, name: 'Midhat Fatima', email: 'midhatfatima2004@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-06-11T18:23:58.506Z' },
  { id: 7, name: 'Ali', email: 'nlc111@yahoo.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-05-31T04:35:54.061Z' },
  { id: 9, name: 'Ahmad', email: 'muhammad.ahmad78968@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-07-26T16:15:26.590Z' },
  { id: 10, name: 'Anzila Malik', email: 'anzilamalik12@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-07-29T06:58:32.400Z' },
  { id: 5, name: 'Aayan Amjad', email: 'aayanamjad543@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: true, createdAt: '2026-04-20T11:41:59.811Z' },
  { id: 1, name: 'Sajeel', email: 'msajeel78@gmail.com', role: 'admin', status: 'allowed', isEmailVerified: false, createdAt: '2026-03-12T18:47:37.383Z' },
];

apiRouter.get('/user/allUsers', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: userList,
  });
});

apiRouter.get('/user/profile', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      user: {
        id: 2,
        name: 'Ahsan Nawaz',
        email: 'aaglobal500@gmail.com',
        role: 'super_admin',
        status: 'allowed',
        isEmailVerified: true,
      },
    },
  });
});

// 7. Daily Consumptions API
apiRouter.get('/daily-consumptions', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: { items: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } },
  });
});

apiRouter.get('/daily-consumptions/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalFeed: 45595,
      totalMedicine: 350,
      totalVaccine: 120,
      totalFeedConsumedBags: 45595,
      totalWaterConsumption: 5420000,
    },
  });
});

// 8. Bird Health API (Exact required structure with totalMortality and highestMortality)
const birdHealthItems = [
  {
    id: 1,
    date: '2026-10-12T00:00:00.000Z',
    flockId: 9,
    flock: { id: 9, flockName: 'Unit 2' },
    openingBirds: 31739,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 100,
    waterConsumption: 5000,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
  {
    id: 2,
    date: '2026-10-11T00:00:00.000Z',
    flockId: 8,
    flock: { id: 8, flockName: 'Unit 1' },
    openingBirds: 24786,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 80,
    waterConsumption: 4000,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
  {
    id: 3,
    date: '2026-10-10T00:00:00.000Z',
    flockId: 10,
    flock: { id: 10, flockName: 'Unit 3' },
    openingBirds: 25189,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 85,
    waterConsumption: 4200,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
];

apiRouter.get('/bird-health', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      items: birdHealthItems,
      pagination: { page: 1, limit: 10, total: birdHealthItems.length, pages: 1 },
    },
  });
});

apiRouter.get('/bird-health/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalMortality: 0,
      mortalityInRange: 0,
      cullInRange: 0,
      highestMortality: {
        flockName: 'Unit 2',
        mortality: 0,
      },
    },
  });
});

// 9. Egg Productions API
apiRouter.get('/egg-productions', (_req: Request, res: Response) => {
  const data = backupData['/egg-productions?page=1&limit=20']?.data || {
    items: [],
    pagination: { page: 1, limit: 20, total: 331, pages: 17 },
  };
  res.json({ message: 'success', data });
});

apiRouter.get('/egg-productions/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalEggs: 16259340,
      brokenEggs: 54900,
      avgEggWeight: 59.99,
      productionPercentage: '149.38%',
      byFlock: [
        { flock: 'Unit 2', totalEggs: 13767720 },
        { flock: 'Unit 1', totalEggs: 1641540 },
        { flock: 'Unit 3', totalEggs: 850080 },
      ],
    },
  });
});

// 10. Expenses API
apiRouter.get('/expenses', (_req: Request, res: Response) => {
  const data = backupData['/expenses?page=1&limit=20']?.data || {
    items: [],
    pagination: { page: 1, limit: 20, total: 1185, pages: 60 },
  };
  res.json({ message: 'success', data });
});

apiRouter.get('/expenses/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      total: 351179198.6,
      totalExpenses: 351179198.6,
      byHead: [
        { _sum: { expenseCost: 266905100 }, head: 'FEED' },
        { _sum: { expenseCost: 25291900 }, head: 'CHICKEN' },
        { _sum: { expenseCost: 10303308.6 }, head: 'MEDICINE' },
        { _sum: { expenseCost: 7855701 }, head: 'RENT' },
        { _sum: { expenseCost: 7230875 }, head: 'UTILITIES' },
        { _sum: { expenseCost: 7078367 }, head: 'SALARIES_PAYMENTS' },
        { _sum: { expenseCost: 5509163 }, head: 'POL' },
      ],
      byFlock: [
        { _sum: { expenseCost: 210000000 }, flock: 'Unit 2' },
        { _sum: { expenseCost: 80000000 }, flock: 'Unit 1' },
        { _sum: { expenseCost: 61179198.6 }, flock: 'Unit 3' },
      ],
    },
  });
});

// 11. Stocks API (Exact structure with overall.totalBagsReceived and byHead array for m4e)
apiRouter.get('/stocks', (_req: Request, res: Response) => {
  const data = backupData['/stocks?page=1&limit=20']?.data || {
    items: [
      {
        id: 146,
        date: '2026-10-10T00:00:00.000Z',
        challanNo: '1440',
        Type: '13',
        flockId: 9,
        head: 'FEED',
        quantity: 100,
        notes: '100 bags 13c3 unit 2 D.O :3535',
        attachment: null,
        amountPaid: 554704,
        paymentType: 'CASH',
        flock: { flockName: 'Unit 2', id: 9 },
      },
    ],
    pagination: { page: 1, limit: 20, total: 131, pages: 7 },
  };
  res.json({ message: 'success', data });
});

apiRouter.get('/stocks/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      overall: {
        totalAmount: 266905100,
        totalBagsReceived: 45595,
        totalQuantity: 45595,
      },
      byHead: [
        { head: 'FEED', totalAmount: 266905100 },
        { head: 'CHICKEN', totalAmount: 25291900 },
        { head: 'MEDICINE', totalAmount: 10303308.6 },
        { head: 'VACCINE', totalAmount: 4628493 },
      ],
    },
  });
});

// 12. Sales API
apiRouter.get('/sales', (_req: Request, res: Response) => {
  const data = backupData['/sales?page=1&limit=20']?.data || {
    items: [],
    pagination: { page: 1, limit: 20, total: 670, pages: 34 },
  };
  res.json({ message: 'success', data });
});

apiRouter.get('/sales/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalRevenue: 294905597,
      totalItemsSold: 16259340,
      byFlock: [
        { totalAmount: 245000000, flock: 'Unit 2', flockId: 9 },
        { totalAmount: 35000000, flock: 'Unit 1', flockId: 8 },
        { totalAmount: 14905597, flock: 'Unit 3', flockId: 10 },
      ],
    },
  });
});

// 13. Salaries API
apiRouter.get('/salaries', (_req: Request, res: Response) => {
  const data = backupData['/salaries?page=1&limit=20']?.data || {
    items: [],
    pagination: { page: 1, limit: 20, total: 23, pages: 2 },
  };
  res.json({ message: 'success', data });
});

apiRouter.get('/salaries/summary', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      totalPaid: 7078367,
      totalAdvance: 215000,
      totalSalaryAmount: 7078367,
      byFlock: [
        { totalPaid: 3500000, flock: 'Unit 2' },
        { totalPaid: 2100000, flock: 'Unit 1' },
        { totalPaid: 1478367, flock: 'Unit 3' },
      ],
    },
  });
});

// 14. Reports (Exact structure required by fAe and uAe components)
apiRouter.get('/reports/income-statement', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      financialReport: {
        totalRevenue: 294905597,
        cogs: {
          chicken: 25291900,
          feed: 266905100,
          medicine: 10303308.6,
          vaccine: 4628493,
          total: 307128801.6,
        },
        operatingExpenses: {
          salaries: 7078367,
          rent: 7855701,
          utilities: 7230875,
          pol: 5509163,
          packingMaterial: 2687810,
          mess: 1216040,
          repairMaintenance: 1104625,
          officeExpenses: 228756,
          meetingRefreshment: 576960,
          computerDevices: 26050,
          professionalFee: 150000,
          miscellaneous: 660870,
          travellingLogistics: 19780,
          total: 44050397,
        },
        totalExpenses: 351179198.6,
        netIncome: -56273601.6,
        period: 'All Time Records (April - August 2026)',
      },
      managementReport: {
        overview: {
          totalRevenue: 294905597,
          totalExpenses: 351179198.6,
          netProfit: -56273601.6,
          activeBirds: 85500,
          cogs: 307128801.6,
          costPerBird: 292.4,
        },
        production: {
          totalEggs: 16259340,
          brokenEggs: 54900,
          avgEggWeight: 59.99,
          eggWastageRate: '0.34%',
          averageLayingRate: '149.38%',
        },
        healthMetrics: {
          mortalityInRange: 0,
          cullInRange: 0,
          totalFeedConsumedBags: 45595,
          totalWaterConsumption: 5420000,
          totalFeedPurchased: 45595,
          feedConversionRate: 1.48,
        },
        additionalMetrics: {
          flockCount: 3,
          avgEggPriceInRange: 18.08,
        },
        inventoryAlerts: [],
        flockDetails: [
          { id: 8, name: 'Unit 1', flockName: 'Unit 1', breed: 'LSL', totalBirds: 25000, birds: 25000, ageWeeks: 38, status: 'Active' },
          { id: 9, name: 'Unit 2', flockName: 'Unit 2', breed: 'LSL', totalBirds: 35000, birds: 35000, ageWeeks: 32, status: 'Active' },
          { id: 10, name: 'Unit 3', flockName: 'Unit 3', breed: 'LSL', totalBirds: 25500, birds: 25500, ageWeeks: 26, status: 'Active' },
        ],
        salesBreakdown: [
          { head: 'EGG', amount: 294013022 },
          { head: 'Manure', amount: 608000 },
          { head: 'Feed_BAGS', amount: 264625 },
          { head: 'OTHER', amount: 19950 },
        ],
      },
    },
  });
});

// Safe Fallback for any other API sub-route to prevent any 404s
apiRouter.use('*', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    },
  });
});
