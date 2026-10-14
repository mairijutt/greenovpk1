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

// Helper to extract flockId from query parameter
function getFlockId(req: Request): number | null {
  const f = req.query.flockId;
  if (!f || f === 'all' || f === 'null' || f === 'undefined') return null;
  const num = parseInt(f as string, 10);
  return isNaN(num) ? null : num;
}

// 1. Independent Authentication
apiRouter.post('/auth/signin', (req: Request, res: Response) => {
  const { email } = req.body || {};

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

// 2. Dashboard API (Filtered dynamically by flockId)
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const flockId = getFlockId(req);

  if (flockId === 8) {
    // Unit 1 only
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: {
          totalRevenue: 35000000,
          totalExpenses: 80000000,
          netProfit: -45000000,
          activeBirds: 25000,
          cogs: 69800000,
          costPerBird: 320.0,
        },
        production: {
          totalEggs: 1641540,
          brokenEggs: 5500,
          avgEggWeight: 59.8,
          eggWastageRate: '0.33%',
          averageLayingRate: '142.50%',
        },
        healthMetrics: {
          mortalityInRange: 0,
          cullInRange: 0,
          totalFeedConsumedBags: 4600,
          totalWaterConsumption: 580000,
          totalFeedPurchased: 4600,
          feedConversionRate: 1.48,
        },
        additionalMetrics: {
          flockCount: 1,
          avgEggPriceInRange: 18.2,
        },
        flockPerformance: [
          { flock: 'Unit 1', production: 1641540, mortality: 0 },
        ],
        salesBreakdown: [
          { head: 'EGG', amount: 35000000 },
        ],
        expenseBreakdown: [
          { head: 'FEED', amount: 62000000 },
          { head: 'CHICKEN', amount: 7800000 },
          { head: 'MEDICINE', amount: 3200000 },
          { head: 'SALARIES_PAYMENTS', amount: 2700000 },
          { head: 'UTILITIES', amount: 2500000 },
          { head: 'POL', amount: 1800000 },
        ],
        inventoryAlerts: [],
        chart: [],
      },
    });
  }

  if (flockId === 9) {
    // Unit 2 only
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: {
          totalRevenue: 245000000,
          totalExpenses: 210000000,
          netProfit: 35000000,
          activeBirds: 35000,
          cogs: 184000000,
          costPerBird: 278.5,
        },
        production: {
          totalEggs: 13767720,
          brokenEggs: 46000,
          avgEggWeight: 60.1,
          eggWastageRate: '0.33%',
          averageLayingRate: '152.80%',
        },
        healthMetrics: {
          mortalityInRange: 0,
          cullInRange: 0,
          totalFeedConsumedBags: 31500,
          totalWaterConsumption: 4100000,
          totalFeedPurchased: 31500,
          feedConversionRate: 1.46,
        },
        additionalMetrics: {
          flockCount: 1,
          avgEggPriceInRange: 17.9,
        },
        flockPerformance: [
          { flock: 'Unit 2', production: 13767720, mortality: 0 },
        ],
        salesBreakdown: [
          { head: 'EGG', amount: 244500000 },
          { head: 'Manure', amount: 500000 },
        ],
        expenseBreakdown: [
          { head: 'FEED', amount: 160000000 },
          { head: 'CHICKEN', amount: 15000000 },
          { head: 'RENT', amount: 7855701 },
          { head: 'MEDICINE', amount: 5500000 },
          { head: 'SALARIES_PAYMENTS', amount: 3500000 },
          { head: 'UTILITIES', amount: 3500000 },
          { head: 'POL', amount: 2500000 },
        ],
        inventoryAlerts: [],
        chart: [],
      },
    });
  }

  if (flockId === 10) {
    // Unit 3 only
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: {
          totalRevenue: 14905597,
          totalExpenses: 61179198.6,
          netProfit: -46273601.6,
          activeBirds: 25500,
          cogs: 53328801.6,
          costPerBird: 318.0,
        },
        production: {
          totalEggs: 850080,
          brokenEggs: 3400,
          avgEggWeight: 59.9,
          eggWastageRate: '0.40%',
          averageLayingRate: '140.20%',
        },
        healthMetrics: {
          mortalityInRange: 0,
          cullInRange: 0,
          totalFeedConsumedBags: 9495,
          totalWaterConsumption: 740000,
          totalFeedPurchased: 9495,
          feedConversionRate: 1.50,
        },
        additionalMetrics: {
          flockCount: 1,
          avgEggPriceInRange: 17.5,
        },
        flockPerformance: [
          { flock: 'Unit 3', production: 850080, mortality: 0 },
        ],
        salesBreakdown: [
          { head: 'EGG', amount: 14513022 },
          { head: 'Manure', amount: 108000 },
          { head: 'Feed BAGS', amount: 264625 },
          { head: 'OTHER', amount: 19950 },
        ],
        expenseBreakdown: [
          { head: 'FEED', amount: 44905100 },
          { head: 'CHICKEN', amount: 2491900 },
          { head: 'MEDICINE', amount: 1603308.6 },
          { head: 'UTILITIES', amount: 1230875 },
          { head: 'POL', amount: 1209163 },
          { head: 'SALARIES_PAYMENTS', amount: 878367 },
        ],
        inventoryAlerts: [],
        chart: [],
      },
    });
  }

  // All flocks combined
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

// 3. Flocks API
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

apiRouter.get(['/flock', '/flocks'], (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? flockItems.filter(f => f.id === flockId) : flockItems;

  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 100,
        total: items.length,
        pages: 1,
      },
    },
  });
});

apiRouter.get(['/flock/summary', '/flocks/summary'], (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: { totalFlocks: 1, totalBirds: 25000, totalMortality: 0, activeFlocks: 1, inactiveFlocks: 0, flockCount: 1 },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: { totalFlocks: 1, totalBirds: 35000, totalMortality: 0, activeFlocks: 1, inactiveFlocks: 0, flockCount: 1 },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: { totalFlocks: 1, totalBirds: 25500, totalMortality: 0, activeFlocks: 1, inactiveFlocks: 0, flockCount: 1 },
    });
  }

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

// 7. Daily Consumptions API (Filtered by flockId)
const allConsumptions = [
  { id: 1, date: '2026-10-12T00:00:00.000Z', flockId: 8, flock: { id: 8, flockName: 'Unit 1' }, feedConsumed: 70, waterConsumed: 4000, medicineConsumed: 2, vaccineConsumed: 1 },
  { id: 2, date: '2026-10-11T00:00:00.000Z', flockId: 8, flock: { id: 8, flockName: 'Unit 1' }, feedConsumed: 68, waterConsumed: 3900, medicineConsumed: 0, vaccineConsumed: 0 },
  { id: 3, date: '2026-10-12T00:00:00.000Z', flockId: 9, flock: { id: 9, flockName: 'Unit 2' }, feedConsumed: 105, waterConsumed: 5200, medicineConsumed: 3, vaccineConsumed: 1 },
  { id: 4, date: '2026-10-11T00:00:00.000Z', flockId: 9, flock: { id: 9, flockName: 'Unit 2' }, feedConsumed: 102, waterConsumed: 5100, medicineConsumed: 2, vaccineConsumed: 0 },
  { id: 5, date: '2026-10-12T00:00:00.000Z', flockId: 10, flock: { id: 10, flockName: 'Unit 3' }, feedConsumed: 80, waterConsumed: 4200, medicineConsumed: 1, vaccineConsumed: 0 },
  { id: 6, date: '2026-10-11T00:00:00.000Z', flockId: 10, flock: { id: 10, flockName: 'Unit 3' }, feedConsumed: 79, waterConsumed: 4100, medicineConsumed: 1, vaccineConsumed: 1 },
];

apiRouter.get('/daily-consumptions', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? allConsumptions.filter(c => c.flockId === flockId) : allConsumptions;
  res.json({
    message: 'success',
    data: { items, pagination: { page: 1, limit: 10, total: items.length, pages: 1 } },
  });
});

apiRouter.get('/daily-consumptions/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: { totalFeed: 4600, totalMedicine: 80, totalVaccine: 30, totalFeedConsumedBags: 4600, totalWaterConsumption: 580000 },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: { totalFeed: 31500, totalMedicine: 210, totalVaccine: 70, totalFeedConsumedBags: 31500, totalWaterConsumption: 4100000 },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: { totalFeed: 9495, totalMedicine: 60, totalVaccine: 20, totalFeedConsumedBags: 9495, totalWaterConsumption: 740000 },
    });
  }

  res.json({
    message: 'success',
    data: { totalFeed: 45595, totalMedicine: 350, totalVaccine: 120, totalFeedConsumedBags: 45595, totalWaterConsumption: 5420000 },
  });
});

// 8. Bird Health API (Filtered by flockId)
const birdHealthItems = [
  {
    id: 1,
    date: '2026-10-12T00:00:00.000Z',
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
    id: 2,
    date: '2026-10-11T00:00:00.000Z',
    flockId: 8,
    flock: { id: 8, flockName: 'Unit 1' },
    openingBirds: 24786,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 80,
    waterConsumption: 3950,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
  {
    id: 3,
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
    id: 4,
    date: '2026-10-11T00:00:00.000Z',
    flockId: 9,
    flock: { id: 9, flockName: 'Unit 2' },
    openingBirds: 31739,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 100,
    waterConsumption: 5050,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
  {
    id: 5,
    date: '2026-10-12T00:00:00.000Z',
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
  {
    id: 6,
    date: '2026-10-11T00:00:00.000Z',
    flockId: 10,
    flock: { id: 10, flockName: 'Unit 3' },
    openingBirds: 25189,
    mortality: 0,
    cull: 0,
    feedId: '13',
    feedConsumed: 84,
    waterConsumption: 4150,
    lightHours: 16,
    lightLux: 30,
    temperature: 24,
    humidity: 60,
  },
];

apiRouter.get('/bird-health', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? birdHealthItems.filter(b => b.flockId === flockId) : birdHealthItems;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: { page: 1, limit: 10, total: items.length, pages: 1 },
    },
  });
});

apiRouter.get('/bird-health/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const flockName = flockId === 8 ? 'Unit 1' : flockId === 9 ? 'Unit 2' : flockId === 10 ? 'Unit 3' : 'Unit 2';

  res.json({
    message: 'success',
    data: {
      totalMortality: 0,
      mortalityInRange: 0,
      cullInRange: 0,
      highestMortality: {
        flockName,
        mortality: 0,
      },
    },
  });
});

// 9. Egg Productions API (Filtered by flockId)
const rawEggProductions = backupData['/egg-productions?page=1&limit=20']?.data?.items || [];
apiRouter.get('/egg-productions', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? rawEggProductions.filter((it: any) => it.flockId === flockId || it.flock?.id === flockId) : rawEggProductions;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        pages: Math.max(1, Math.ceil(items.length / 20)),
      },
    },
  });
});

apiRouter.get('/egg-productions/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        totalEggs: 1641540,
        brokenEggs: 5500,
        avgEggWeight: 59.8,
        productionPercentage: '142.50%',
        byFlock: [{ flock: 'Unit 1', totalEggs: 1641540 }],
      },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        totalEggs: 13767720,
        brokenEggs: 46000,
        avgEggWeight: 60.1,
        productionPercentage: '152.80%',
        byFlock: [{ flock: 'Unit 2', totalEggs: 13767720 }],
      },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        totalEggs: 850080,
        brokenEggs: 3400,
        avgEggWeight: 59.9,
        productionPercentage: '140.20%',
        byFlock: [{ flock: 'Unit 3', totalEggs: 850080 }],
      },
    });
  }

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

// 10. Expenses API (Filtered by flockId)
const rawExpenses = (backupData['/expenses?page=1&limit=20']?.data?.items || []).map((exp: any, index: number) => {
  // Distribute real sample items across flocks for demonstration
  const fid = index % 3 === 0 ? 8 : index % 3 === 1 ? 9 : 10;
  const fname = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  return {
    ...exp,
    flockId: fid,
    flock: { id: fid, flockName: fname },
  };
});

apiRouter.get('/expenses', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? rawExpenses.filter((it: any) => it.flockId === flockId || it.flock?.id === flockId) : rawExpenses;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        pages: Math.max(1, Math.ceil(items.length / 20)),
      },
    },
  });
});

apiRouter.get('/expenses/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        total: 80000000,
        totalExpenses: 80000000,
        byHead: [
          { _sum: { expenseCost: 62000000 }, head: 'FEED' },
          { _sum: { expenseCost: 7800000 }, head: 'CHICKEN' },
          { _sum: { expenseCost: 3200000 }, head: 'MEDICINE' },
          { _sum: { expenseCost: 2700000 }, head: 'SALARIES_PAYMENTS' },
          { _sum: { expenseCost: 2500000 }, head: 'UTILITIES' },
          { _sum: { expenseCost: 1800000 }, head: 'POL' },
        ],
        byFlock: [{ _sum: { expenseCost: 80000000 }, flock: 'Unit 1' }],
      },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        total: 210000000,
        totalExpenses: 210000000,
        byHead: [
          { _sum: { expenseCost: 160000000 }, head: 'FEED' },
          { _sum: { expenseCost: 15000000 }, head: 'CHICKEN' },
          { _sum: { expenseCost: 7855701 }, head: 'RENT' },
          { _sum: { expenseCost: 5500000 }, head: 'MEDICINE' },
          { _sum: { expenseCost: 3500000 }, head: 'SALARIES_PAYMENTS' },
          { _sum: { expenseCost: 3500000 }, head: 'UTILITIES' },
          { _sum: { expenseCost: 2500000 }, head: 'POL' },
        ],
        byFlock: [{ _sum: { expenseCost: 210000000 }, flock: 'Unit 2' }],
      },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        total: 61179198.6,
        totalExpenses: 61179198.6,
        byHead: [
          { _sum: { expenseCost: 44905100 }, head: 'FEED' },
          { _sum: { expenseCost: 2491900 }, head: 'CHICKEN' },
          { _sum: { expenseCost: 1603308.6 }, head: 'MEDICINE' },
          { _sum: { expenseCost: 1230875 }, head: 'UTILITIES' },
          { _sum: { expenseCost: 1209163 }, head: 'POL' },
          { _sum: { expenseCost: 878367 }, head: 'SALARIES_PAYMENTS' },
        ],
        byFlock: [{ _sum: { expenseCost: 61179198.6 }, flock: 'Unit 3' }],
      },
    });
  }

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

// 11. Stocks API (Filtered by flockId)
const rawStocks = (backupData['/stocks?page=1&limit=20']?.data?.items || []).map((stk: any) => ({
  ...stk,
  flock: stk.flock || { id: stk.flockId, flockName: stk.flockId === 8 ? 'Unit 1' : stk.flockId === 9 ? 'Unit 2' : 'Unit 3' },
}));

apiRouter.get('/stocks', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? rawStocks.filter((it: any) => it.flockId === flockId || it.flock?.id === flockId) : rawStocks;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        pages: Math.max(1, Math.ceil(items.length / 20)),
      },
    },
  });
});

apiRouter.get('/stocks/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        overall: { totalAmount: 62000000, totalBagsReceived: 4600, totalQuantity: 4600 },
        byHead: [
          { head: 'FEED', totalAmount: 62000000 },
          { head: 'MEDICINE', totalAmount: 3200000 },
        ],
      },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        overall: { totalAmount: 160000000, totalBagsReceived: 31500, totalQuantity: 31500 },
        byHead: [
          { head: 'FEED', totalAmount: 160000000 },
          { head: 'MEDICINE', totalAmount: 5500000 },
        ],
      },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        overall: { totalAmount: 44905100, totalBagsReceived: 9495, totalQuantity: 9495 },
        byHead: [
          { head: 'FEED', totalAmount: 44905100 },
          { head: 'MEDICINE', totalAmount: 1603308.6 },
        ],
      },
    });
  }

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

// 12. Sales API (Filtered by flockId)
const rawSales = (backupData['/sales?page=1&limit=20']?.data?.items || []).map((sale: any) => ({
  ...sale,
  flock: sale.flock || { id: sale.flockId, flockName: sale.flockId === 8 ? 'Unit 1' : sale.flockId === 9 ? 'Unit 2' : 'Unit 3' },
}));

apiRouter.get('/sales', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? rawSales.filter((it: any) => it.flockId === flockId || it.flock?.id === flockId) : rawSales;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        pages: Math.max(1, Math.ceil(items.length / 20)),
      },
    },
  });
});

apiRouter.get('/sales/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        totalRevenue: 35000000,
        totalItemsSold: 1641540,
        byFlock: [{ totalAmount: 35000000, flock: 'Unit 1', flockId: 8 }],
      },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        totalRevenue: 245000000,
        totalItemsSold: 13767720,
        byFlock: [{ totalAmount: 245000000, flock: 'Unit 2', flockId: 9 }],
      },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        totalRevenue: 14905597,
        totalItemsSold: 850080,
        byFlock: [{ totalAmount: 14905597, flock: 'Unit 3', flockId: 10 }],
      },
    });
  }

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

// 13. Salaries API (Filtered by flockId)
const rawSalaries = (backupData['/salaries?page=1&limit=20']?.data?.items || []).map((sal: any, idx: number) => {
  const fid = idx % 3 === 0 ? 8 : idx % 3 === 1 ? 9 : 10;
  const fname = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  return {
    ...sal,
    flockId: fid,
    flock: { id: fid, flockName: fname },
  };
});

apiRouter.get('/salaries', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? rawSalaries.filter((it: any) => it.flockId === flockId || it.flock?.id === flockId) : rawSalaries;
  res.json({
    message: 'success',
    data: {
      items,
      pagination: {
        page: 1,
        limit: 20,
        total: items.length,
        pages: Math.max(1, Math.ceil(items.length / 20)),
      },
    },
  });
});

apiRouter.get('/salaries/summary', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        totalPaid: 2100000,
        totalAdvance: 50000,
        totalSalaryAmount: 2100000,
        byFlock: [{ totalPaid: 2100000, flock: 'Unit 1' }],
      },
    });
  }
  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        totalPaid: 3500000,
        totalAdvance: 120000,
        totalSalaryAmount: 3500000,
        byFlock: [{ totalPaid: 3500000, flock: 'Unit 2' }],
      },
    });
  }
  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        totalPaid: 1478367,
        totalAdvance: 45000,
        totalSalaryAmount: 1478367,
        byFlock: [{ totalPaid: 1478367, flock: 'Unit 3' }],
      },
    });
  }

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

// 14. Reports (Filtered dynamically by flockId)
apiRouter.get('/reports/income-statement', (req: Request, res: Response) => {
  const flockId = getFlockId(req);

  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        financialReport: {
          totalRevenue: 35000000,
          cogs: {
            chicken: 7800000,
            feed: 62000000,
            medicine: 3200000,
            vaccine: 1200000,
            total: 74200000,
          },
          operatingExpenses: {
            salaries: 2100000,
            rent: 0,
            utilities: 1500000,
            pol: 1000000,
            mess: 400000,
            repairMaintenance: 350000,
            officeExpenses: 150000,
            meetingRefreshment: 100000,
            computerDevices: 10000,
            professionalFee: 50000,
            miscellaneous: 140000,
            travellingLogistics: 0,
            packingMaterial: 0,
            total: 5800000,
          },
          totalExpenses: 80000000,
          netIncome: -45000000,
          period: 'Unit 1 - Flock Performance Statement',
        },
        managementReport: {
          overview: {
            totalRevenue: 35000000,
            totalExpenses: 80000000,
            netProfit: -45000000,
            activeBirds: 25000,
            cogs: 74200000,
            costPerBird: 320.0,
          },
          production: {
            totalEggs: 1641540,
            brokenEggs: 5500,
            avgEggWeight: 59.8,
            eggWastageRate: '0.33%',
            averageLayingRate: '142.50%',
          },
          healthMetrics: {
            mortalityInRange: 0,
            cullInRange: 0,
            totalFeedConsumedBags: 4600,
            totalWaterConsumption: 580000,
            totalFeedPurchased: 4600,
            feedConversionRate: 1.48,
          },
          additionalMetrics: {
            flockCount: 1,
            avgEggPriceInRange: 18.2,
          },
          inventoryAlerts: [],
          flockDetails: [
            { id: 8, name: 'Unit 1', flockName: 'Unit 1', breed: 'LSL', totalBirds: 25000, birds: 25000, ageWeeks: 38, status: 'Active' },
          ],
          salesBreakdown: [
            { head: 'EGG', amount: 35000000 },
          ],
        },
      },
    });
  }

  if (flockId === 9) {
    return res.json({
      message: 'success',
      data: {
        financialReport: {
          totalRevenue: 245000000,
          cogs: {
            chicken: 15000000,
            feed: 160000000,
            medicine: 5500000,
            vaccine: 2500000,
            total: 183000000,
          },
          operatingExpenses: {
            salaries: 3500000,
            rent: 7855701,
            utilities: 4500000,
            pol: 3200000,
            packingMaterial: 2687810,
            mess: 600000,
            repairMaintenance: 600000,
            officeExpenses: 500000,
            meetingRefreshment: 400000,
            computerDevices: 10000,
            professionalFee: 50000,
            miscellaneous: 400000,
            travellingLogistics: 10000,
            total: 27000000,
          },
          totalExpenses: 210000000,
          netIncome: 35000000,
          period: 'Unit 2 - Flock Performance Statement',
        },
        managementReport: {
          overview: {
            totalRevenue: 245000000,
            totalExpenses: 210000000,
            netProfit: 35000000,
            activeBirds: 35000,
            cogs: 183000000,
            costPerBird: 278.5,
          },
          production: {
            totalEggs: 13767720,
            brokenEggs: 46000,
            avgEggWeight: 60.1,
            eggWastageRate: '0.33%',
            averageLayingRate: '152.80%',
          },
          healthMetrics: {
            mortalityInRange: 0,
            cullInRange: 0,
            totalFeedConsumedBags: 31500,
            totalWaterConsumption: 4100000,
            totalFeedPurchased: 31500,
            feedConversionRate: 1.46,
          },
          additionalMetrics: {
            flockCount: 1,
            avgEggPriceInRange: 17.9,
          },
          inventoryAlerts: [],
          flockDetails: [
            { id: 9, name: 'Unit 2', flockName: 'Unit 2', breed: 'LSL', totalBirds: 35000, birds: 35000, ageWeeks: 32, status: 'Active' },
          ],
          salesBreakdown: [
            { head: 'EGG', amount: 244500000 },
            { head: 'Manure', amount: 500000 },
          ],
        },
      },
    });
  }

  if (flockId === 10) {
    return res.json({
      message: 'success',
      data: {
        financialReport: {
          totalRevenue: 14905597,
          cogs: {
            chicken: 2491900,
            feed: 44905100,
            medicine: 1603308.6,
            vaccine: 928493,
            total: 49928801.6,
          },
          operatingExpenses: {
            salaries: 1478367,
            rent: 0,
            utilities: 1230875,
            pol: 1209163,
            mess: 216040,
            repairMaintenance: 154625,
            officeExpenses: 78756,
            meetingRefreshment: 76960,
            computerDevices: 6050,
            professionalFee: 50000,
            miscellaneous: 120870,
            travellingLogistics: 9780,
            packingMaterial: 0,
            total: 11250397,
          },
          totalExpenses: 61179198.6,
          netIncome: -46273601.6,
          period: 'Unit 3 - Flock Performance Statement',
        },
        managementReport: {
          overview: {
            totalRevenue: 14905597,
            totalExpenses: 61179198.6,
            netProfit: -46273601.6,
            activeBirds: 25500,
            cogs: 49928801.6,
            costPerBird: 318.0,
          },
          production: {
            totalEggs: 850080,
            brokenEggs: 3400,
            avgEggWeight: 59.9,
            eggWastageRate: '0.40%',
            averageLayingRate: '140.20%',
          },
          healthMetrics: {
            mortalityInRange: 0,
            cullInRange: 0,
            totalFeedConsumedBags: 9495,
            totalWaterConsumption: 740000,
            totalFeedPurchased: 9495,
            feedConversionRate: 1.50,
          },
          additionalMetrics: {
            flockCount: 1,
            avgEggPriceInRange: 17.5,
          },
          inventoryAlerts: [],
          flockDetails: [
            { id: 10, name: 'Unit 3', flockName: 'Unit 3', breed: 'LSL', totalBirds: 25500, birds: 25500, ageWeeks: 26, status: 'Active' },
          ],
          salesBreakdown: [
            { head: 'EGG', amount: 14513022 },
            { head: 'Manure', amount: 108000 },
            { head: 'Feed_BAGS', amount: 264625 },
            { head: 'OTHER', amount: 19950 },
          ],
        },
      },
    });
  }

  // All flocks combined
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

// Safe Fallback for any other API sub-route
apiRouter.use('*', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    },
  });
});
