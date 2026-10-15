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

// In-Memory Data Stores for Full Interactive CRUD
let flockItems: any[] = [
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

let farmList = [
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

let rawExpenses = (backupData['/expenses?page=1&limit=20']?.data?.items || []).map((exp: any, index: number) => {
  const fid = index % 3 === 0 ? 8 : index % 3 === 1 ? 9 : 10;
  const fname = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  return {
    ...exp,
    flockId: fid,
    flock: { id: fid, flockName: fname },
  };
});

let rawStocks = (backupData['/stocks?page=1&limit=20']?.data?.items || []).map((stk: any) => ({
  ...stk,
  flock: stk.flock || { id: stk.flockId, flockName: stk.flockId === 8 ? 'Unit 1' : stk.flockId === 9 ? 'Unit 2' : 'Unit 3' },
}));

let rawSales = (backupData['/sales?page=1&limit=20']?.data?.items || []).map((sale: any) => ({
  ...sale,
  flock: sale.flock || { id: sale.flockId, flockName: sale.flockId === 8 ? 'Unit 1' : sale.flockId === 9 ? 'Unit 2' : 'Unit 3' },
}));

let rawEggProductions = (backupData['/egg-productions?page=1&limit=20']?.data?.items || []).map((egg: any) => ({
  ...egg,
  flock: egg.flock || { id: egg.flockId, flockName: egg.flockId === 8 ? 'Unit 1' : egg.flockId === 9 ? 'Unit 2' : 'Unit 3' },
}));

let rawSalaries = (backupData['/salaries?page=1&limit=20']?.data?.items || []).map((sal: any, idx: number) => {
  const fid = idx % 3 === 0 ? 8 : idx % 3 === 1 ? 9 : 10;
  const fname = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  return {
    ...sal,
    flockId: fid,
    flock: { id: fid, flockName: fname },
  };
});

let birdHealthItems = [
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
];

let allConsumptions = [
  { id: 1, date: '2026-10-12T00:00:00.000Z', flockId: 8, flock: { id: 8, flockName: 'Unit 1' }, feedConsumed: 70, waterConsumed: 4000, medicineConsumed: 2, vaccineConsumed: 1 },
  { id: 2, date: '2026-10-11T00:00:00.000Z', flockId: 8, flock: { id: 8, flockName: 'Unit 1' }, feedConsumed: 68, waterConsumed: 3900, medicineConsumed: 0, vaccineConsumed: 0 },
  { id: 3, date: '2026-10-12T00:00:00.000Z', flockId: 9, flock: { id: 9, flockName: 'Unit 2' }, feedConsumed: 105, waterConsumed: 5200, medicineConsumed: 3, vaccineConsumed: 1 },
  { id: 4, date: '2026-10-12T00:00:00.000Z', flockId: 10, flock: { id: 10, flockName: 'Unit 3' }, feedConsumed: 80, waterConsumed: 4200, medicineConsumed: 1, vaccineConsumed: 0 },
];

// Challan Upload Handlers
const dummyChallan = (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      url: '/assets/favicon-DwnAFEdf.png',
    },
  });
};
apiRouter.post('/expenses/upload-challan', dummyChallan);
apiRouter.post('/sales/upload-challan', dummyChallan);
apiRouter.post('/stocks/upload-challan', dummyChallan);

// 1. Authentication
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

// 2. Dashboard
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const flockId = getFlockId(req);

  if (flockId === 8) {
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: { totalRevenue: 35000000, totalExpenses: 80000000, netProfit: -45000000, activeBirds: 25000, cogs: 69800000, costPerBird: 320.0 },
        production: { totalEggs: 1641540, brokenEggs: 5500, avgEggWeight: 59.8, eggWastageRate: '0.33%', averageLayingRate: '142.50%' },
        healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 4600, totalWaterConsumption: 580000, totalFeedPurchased: 4600, feedConversionRate: 1.48 },
        additionalMetrics: { flockCount: 1, avgEggPriceInRange: 18.2 },
        flockPerformance: [{ flock: 'Unit 1', production: 1641540, mortality: 0 }],
        salesBreakdown: [{ head: 'EGG', amount: 35000000 }],
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
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: { totalRevenue: 245000000, totalExpenses: 210000000, netProfit: 35000000, activeBirds: 35000, cogs: 184000000, costPerBird: 278.5 },
        production: { totalEggs: 13767720, brokenEggs: 46000, avgEggWeight: 60.1, eggWastageRate: '0.33%', averageLayingRate: '152.80%' },
        healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 31500, totalWaterConsumption: 4100000, totalFeedPurchased: 31500, feedConversionRate: 1.46 },
        additionalMetrics: { flockCount: 1, avgEggPriceInRange: 17.9 },
        flockPerformance: [{ flock: 'Unit 2', production: 13767720, mortality: 0 }],
        salesBreakdown: [{ head: 'EGG', amount: 244500000 }, { head: 'Manure', amount: 500000 }],
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
    return res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: { totalRevenue: 14905597, totalExpenses: 61179198.6, netProfit: -46273601.6, activeBirds: 25500, cogs: 53328801.6, costPerBird: 318.0 },
        production: { totalEggs: 850080, brokenEggs: 3400, avgEggWeight: 59.9, eggWastageRate: '0.40%', averageLayingRate: '140.20%' },
        healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 9495, totalWaterConsumption: 740000, totalFeedPurchased: 9495, feedConversionRate: 1.50 },
        additionalMetrics: { flockCount: 1, avgEggPriceInRange: 17.5 },
        flockPerformance: [{ flock: 'Unit 3', production: 850080, mortality: 0 }],
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

  res.json({
    message: 'Dashboard stats generated successfully',
    data: {
      overview: { totalRevenue: 294905597, totalExpenses: 351179198.6, netProfit: -56273601.6, activeBirds: 85500, cogs: 307128801.6, costPerBird: 292.4 },
      production: { totalEggs: 16259340, brokenEggs: 54900, avgEggWeight: 59.99, eggWastageRate: '0.34%', averageLayingRate: '149.38%' },
      healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 45595, totalWaterConsumption: 5420000, totalFeedPurchased: 45595, feedConversionRate: 1.48 },
      additionalMetrics: { flockCount: 3, avgEggPriceInRange: 18.08 },
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
    },
  });
});

// 3. Flocks CRUD
apiRouter.get(['/flock', '/flocks'], (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? flockItems.filter(f => f.id === flockId) : flockItems;

  res.json({
    message: 'success',
    data: {
      items,
      pagination: { page: 1, limit: 100, total: items.length, pages: 1 },
    },
  });
});

apiRouter.post('/flock', (req: Request, res: Response) => {
  const body = req.body || {};
  const newId = flockItems.length > 0 ? Math.max(...flockItems.map(f => f.id)) + 1 : 11;
  const fid = body.farmId ? Number(body.farmId) : 9;
  const foundFarm = farmList.find(f => f.id === fid) || { id: 9, name: 'GreenOva', code: 'GVF2025', location: 'Multan, Punjab' };
  const acquiredDate = body.acquiredDate ? new Date(body.acquiredDate).toISOString() : new Date().toISOString();
  const exitDate = body.exitDate && String(body.exitDate).trim() && String(body.exitDate) !== 'null' ? new Date(body.exitDate).toISOString() : null;

  const newFlock = {
    id: newId,
    farmId: fid,
    flockName: body.flockName || `Unit ${newId}`,
    breed: body.breed || 'LSL',
    totalBirds: Number(body.totalBirds) || 20000,
    originalTotalBirds: Number(body.totalBirds) || 20000,
    cost: Number(body.cost) || 7500000,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    status: body.isActive !== false ? 'Active' : 'Inactive',
    ageWeeks: Number(body.ageInWeeks || body.ageWeeks) || 20,
    ageInWeeks: Number(body.ageInWeeks || body.ageWeeks) || 20,
    acquiredDate,
    exitDate,
    mortality: Number(body.mortality) || 0,
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    farm: { id: foundFarm.id, name: foundFarm.name, code: foundFarm.code || 'GVF2025', location: foundFarm.location || 'Multan, Punjab' },
  };

  flockItems.unshift(newFlock);
  return res.json({ message: 'success', data: newFlock });
});

apiRouter.put('/flock/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = flockItems.findIndex(f => f.id === id);
  if (idx >= 0) {
    flockItems[idx] = {
      ...flockItems[idx],
      ...body,
      id,
      ageInWeeks: body.ageInWeeks !== undefined ? Number(body.ageInWeeks) : flockItems[idx].ageInWeeks,
      totalBirds: body.totalBirds !== undefined ? Number(body.totalBirds) : flockItems[idx].totalBirds,
      farm: flockItems[idx].farm || { id: 9, name: 'GreenOva' },
    };
    return res.json({ message: 'success', data: flockItems[idx] });
  }
  return res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/flock/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  flockItems = flockItems.filter(f => f.id !== id);
  return res.json({ message: 'success', data: { id } });
});

apiRouter.get(['/flock/summary', '/flocks/summary'], (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const targetFlocks = flockId ? flockItems.filter(f => f.id === flockId) : flockItems;
  const totalBirds = targetFlocks.reduce((sum, f) => sum + (f.totalBirds || 0), 0);

  res.json({
    message: 'success',
    data: {
      totalFlocks: targetFlocks.length,
      totalBirds,
      totalMortality: 0,
      activeFlocks: targetFlocks.filter(f => f.isActive).length,
      inactiveFlocks: targetFlocks.filter(f => !f.isActive).length,
      flockCount: targetFlocks.length,
    },
  });
});

// 4. Farms CRUD
apiRouter.get('/getFarms', (_req: Request, res: Response) => {
  res.json({ message: 'success', data: farmList });
});

apiRouter.get('/farms', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: { items: farmList, pagination: { page: 1, limit: 10, total: farmList.length, pages: 1 } },
  });
});

apiRouter.post('/farms', (req: Request, res: Response) => {
  const body = req.body || {};
  const newId = farmList.length > 0 ? Math.max(...farmList.map(f => f.id)) + 1 : 10;
  const newFarm = {
    id: newId,
    name: body.name || 'New Farm Facility',
    code: body.code || `GVF-${newId}`,
    location: body.location || 'Punjab, Pakistan',
    description: body.description || '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  farmList.unshift(newFarm);
  res.json({ message: 'success', data: newFarm });
});

apiRouter.put('/farms/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = farmList.findIndex(f => f.id === id);
  if (idx >= 0) {
    farmList[idx] = { ...farmList[idx], ...body, id, updatedAt: new Date().toISOString() };
    return res.json({ message: 'success', data: farmList[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/farms/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  farmList = farmList.filter(f => f.id !== id);
  res.json({ message: 'success', data: { id } });
});

// 5. Stock Store
apiRouter.get('/stock-store', (_req: Request, res: Response) => {
  res.json({
    message: 'success',
    data: {
      feeds: [
        { id: 1, Type: '11', name: 'FEED 11', quantity: 15000, currentStock: 15000, head: 'FEED', unit: 'bags' },
        { id: 2, Type: '12', name: 'FEED 12', quantity: 15000, currentStock: 15000, head: 'FEED', unit: 'bags' },
        { id: 3, Type: '13', name: 'FEED 13', quantity: 15000, currentStock: 15000, head: 'FEED', unit: 'bags' },
        { id: 4, Type: '14', name: 'FEED 14', quantity: 15000, currentStock: 15000, head: 'FEED', unit: 'bags' },
      ],
      medicines: [
        { id: 5, Type: 'Paracetamol', name: 'Paracetamol', quantity: 500, currentStock: 500, head: 'MEDICINE', unit: 'packs' },
        { id: 6, Type: 'Antibiotic', name: 'Antibiotic', quantity: 300, currentStock: 300, head: 'MEDICINE', unit: 'packs' },
      ],
      vaccines: [
        { id: 7, Type: 'ND+IB', name: 'ND+IB', quantity: 200, currentStock: 200, head: 'VACCINE', unit: 'vials' },
        { id: 8, Type: 'Gumboro', name: 'Gumboro', quantity: 150, currentStock: 150, head: 'VACCINE', unit: 'vials' },
      ],
      equipment: [
        { id: 9, Type: 'Feeder Trays', name: 'Feeder Trays', quantity: 50, currentStock: 50, head: 'EQUIPMENT', unit: 'units' },
        { id: 10, Type: 'Drinkers', name: 'Drinkers', quantity: 50, currentStock: 50, head: 'EQUIPMENT', unit: 'units' },
      ],
      others: [
        { id: 11, Type: 'Disinfectant', name: 'Disinfectant', quantity: 50, currentStock: 50, head: 'OTHER', unit: 'cans' },
      ],
    },
  });
});

// 6. User Management
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
  res.json({ message: 'success', data: userList });
});

apiRouter.post('/user/shift-user-status', (req: Request, res: Response) => {
  const { id, status } = req.body || {};
  const user = userList.find(u => u.id === Number(id));
  if (user) {
    user.status = status;
  }
  res.json({ message: 'success', data: { id, status } });
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

// 7. Daily Consumptions CRUD
apiRouter.get('/daily-consumptions', (req: Request, res: Response) => {
  const flockId = getFlockId(req);
  const items = flockId ? allConsumptions.filter(c => c.flockId === flockId) : allConsumptions;
  res.json({
    message: 'success',
    data: { items, pagination: { page: 1, limit: 10, total: items.length, pages: 1 } },
  });
});

apiRouter.post('/daily-consumptions', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const flockName = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  const newConsumption = {
    id: allConsumptions.length > 0 ? Math.max(...allConsumptions.map(c => c.id)) + 1 : 1,
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    flockId: fid,
    flock: { id: fid, flockName },
    feedConsumed: Number(body.feedConsumed) || 0,
    waterConsumed: Number(body.waterConsumed) || 0,
    medicineConsumed: Number(body.medicineConsumed) || 0,
    vaccineConsumed: Number(body.vaccineConsumed) || 0,
  };
  allConsumptions.unshift(newConsumption);
  res.json({ message: 'success', data: newConsumption });
});

apiRouter.put('/daily-consumptions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = allConsumptions.findIndex(c => c.id === id);
  if (idx >= 0) {
    allConsumptions[idx] = { ...allConsumptions[idx], ...body, id };
    return res.json({ message: 'success', data: allConsumptions[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/daily-consumptions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  allConsumptions = allConsumptions.filter(c => c.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 8. Bird Health CRUD
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

apiRouter.post('/bird-health', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const flockName = fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3';
  const newHealth = {
    id: birdHealthItems.length > 0 ? Math.max(...birdHealthItems.map(b => b.id)) + 1 : 1,
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    flockId: fid,
    flock: { id: fid, flockName },
    openingBirds: Number(body.openingBirds) || 25000,
    mortality: Number(body.mortality) || 0,
    cull: Number(body.cull) || 0,
    feedId: body.feedId || '13',
    feedConsumed: Number(body.feedConsumed) || 80,
    waterConsumption: Number(body.waterConsumption) || 4000,
    lightHours: Number(body.lightHours) || 16,
    lightLux: Number(body.lightLux) || 30,
    temperature: Number(body.temperature) || 24,
    humidity: Number(body.humidity) || 60,
  };
  birdHealthItems.unshift(newHealth);
  res.json({ message: 'success', data: newHealth });
});

apiRouter.put('/bird-health/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = birdHealthItems.findIndex(b => b.id === id);
  if (idx >= 0) {
    birdHealthItems[idx] = { ...birdHealthItems[idx], ...body, id };
    return res.json({ message: 'success', data: birdHealthItems[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/bird-health/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  birdHealthItems = birdHealthItems.filter(b => b.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 9. Egg Productions CRUD
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

apiRouter.post('/egg-productions', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const foundFlock = flockItems.find(f => f.id === fid);
  const flockName = foundFlock ? foundFlock.flockName : (fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3');
  const newProd = {
    id: rawEggProductions.length > 0 ? Math.max(...rawEggProductions.map((e: any) => e.id || 0)) + 1 : 1,
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    flockId: fid,
    flock: { id: fid, flockName },
    cartons: Number(body.cartons) || 0,
    trays: Number(body.trays) || 0,
    eggs: Number(body.eggs) || 0,
    totalEggs: Number(body.totalEggs) || (Number(body.cartons || 0) * 360 + Number(body.trays || 0) * 30 + Number(body.eggs || 0)),
    brokenEggs: Number(body.brokenEggs) || 0,
    averageWeight: Number(body.averageWeight) || 60.0,
    grade: body.grade || 'standard',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rawEggProductions.unshift(newProd);
  res.json({ message: 'success', data: newProd });
});

apiRouter.put('/egg-productions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = rawEggProductions.findIndex((e: any) => e.id === id);
  if (idx >= 0) {
    rawEggProductions[idx] = { ...rawEggProductions[idx], ...body, id };
    return res.json({ message: 'success', data: rawEggProductions[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/egg-productions/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rawEggProductions = rawEggProductions.filter((e: any) => e.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 10. Expenses CRUD
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

apiRouter.post('/expenses', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const foundFlock = flockItems.find(f => f.id === fid);
  const fname = foundFlock ? foundFlock.flockName : (fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3');
  const newExp = {
    id: rawExpenses.length > 0 ? Math.max(...rawExpenses.map((e: any) => e.id || 0)) + 1 : 1,
    expenseDate: body.expenseDate ? new Date(body.expenseDate).toISOString() : new Date().toISOString(),
    challanNo: body.challanNo || '1450',
    attachment: body.attachment || null,
    flockId: fid,
    flock: { id: fid, flockName: fname },
    expenseCost: Number(body.expenseCost) || 50000,
    head: body.head || 'FEED',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rawExpenses.unshift(newExp);
  res.json({ message: 'success', data: newExp });
});

apiRouter.put('/expenses/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = rawExpenses.findIndex((e: any) => e.id === id);
  if (idx >= 0) {
    rawExpenses[idx] = { ...rawExpenses[idx], ...body, id, updatedAt: new Date().toISOString() };
    return res.json({ message: 'success', data: rawExpenses[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/expenses/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rawExpenses = rawExpenses.filter((e: any) => e.id !== id);
  res.json({ message: 'success', data: { id } });
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
        byFlock: [{ _sum: { expenseCost: 80000000 }, flock: 'Unit 1', flockName: 'Unit 1', flockId: 8 }],
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
        byFlock: [{ _sum: { expenseCost: 210000000 }, flock: 'Unit 2', flockName: 'Unit 2', flockId: 9 }],
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
        byFlock: [{ _sum: { expenseCost: 61179198.6 }, flock: 'Unit 3', flockName: 'Unit 3', flockId: 10 }],
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
        { _sum: { expenseCost: 210000000 }, flock: 'Unit 2', flockName: 'Unit 2', flockId: 9 },
        { _sum: { expenseCost: 80000000 }, flock: 'Unit 1', flockName: 'Unit 1', flockId: 8 },
        { _sum: { expenseCost: 61179198.6 }, flock: 'Unit 3', flockName: 'Unit 3', flockId: 10 },
      ],
    },
  });
});

// 11. Stocks CRUD
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

apiRouter.post('/stocks', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const foundFlock = flockItems.find(f => f.id === fid);
  const fname = foundFlock ? foundFlock.flockName : (fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3');
  const newStock = {
    id: rawStocks.length > 0 ? Math.max(...rawStocks.map((s: any) => s.id || 0)) + 1 : 1,
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    challanNo: body.challanNo || '1445',
    Type: body.Type || 'FEED',
    flockId: fid,
    flock: { id: fid, flockName: fname },
    head: body.head || 'FEED',
    quantity: Number(body.quantity) || 100,
    notes: body.notes || '',
    attachment: body.attachment || null,
    amountPaid: Number(body.amountPaid) || 550000,
    paymentType: body.paymentType || 'CASH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rawStocks.unshift(newStock);
  res.json({ message: 'success', data: newStock });
});

apiRouter.put('/stocks/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = rawStocks.findIndex((s: any) => s.id === id);
  if (idx >= 0) {
    rawStocks[idx] = { ...rawStocks[idx], ...body, id, updatedAt: new Date().toISOString() };
    return res.json({ message: 'success', data: rawStocks[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/stocks/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rawStocks = rawStocks.filter((s: any) => s.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 12. Sales CRUD
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

apiRouter.post('/sales', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const foundFlock = flockItems.find(f => f.id === fid);
  const fname = foundFlock ? foundFlock.flockName : (fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3');
  const newSale = {
    id: rawSales.length > 0 ? Math.max(...rawSales.map((s: any) => s.id || 0)) + 1 : 1,
    saleDate: body.saleDate ? new Date(body.saleDate).toISOString() : new Date().toISOString(),
    flockId: fid,
    flock: { id: fid, flockName: fname },
    partyName: body.partyName || 'Ahmed Traders',
    vehicleNumber: body.vehicleNumber || 'MN-1234',
    head: body.head || 'EGG',
    grade: body.grade || 'standard',
    itemsSold: Number(body.itemsSold) || 3600,
    rate: Number(body.rate) || 18.5,
    totalAmount: Number(body.totalAmount) || (Number(body.itemsSold || 3600) * Number(body.rate || 18.5)),
    weight: Number(body.weight) || 60.0,
    attachment: body.attachment || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rawSales.unshift(newSale);
  res.json({ message: 'success', data: newSale });
});

apiRouter.put('/sales/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = rawSales.findIndex((s: any) => s.id === id);
  if (idx >= 0) {
    rawSales[idx] = { ...rawSales[idx], ...body, id, updatedAt: new Date().toISOString() };
    return res.json({ message: 'success', data: rawSales[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/sales/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rawSales = rawSales.filter((s: any) => s.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 13. Salaries CRUD
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

apiRouter.post('/salaries', (req: Request, res: Response) => {
  const body = req.body || {};
  const fid = Number(body.flockId) || 8;
  const foundFlock = flockItems.find(f => f.id === fid);
  const fname = foundFlock ? foundFlock.flockName : (fid === 8 ? 'Unit 1' : fid === 9 ? 'Unit 2' : 'Unit 3');
  const newSalary = {
    id: rawSalaries.length > 0 ? Math.max(...rawSalaries.map((s: any) => s.id || 0)) + 1 : 1,
    employeeName: body.employeeName || 'Staff Member',
    designation: body.designation || 'Farm Worker',
    flockId: fid,
    flock: { id: fid, flockName: fname },
    total: Number(body.total) || 35000,
    advance: Number(body.advance) || 0,
    salaryAmount: Number(body.salaryAmount) || 35000,
    remarks: body.remarks || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rawSalaries.unshift(newSalary);
  res.json({ message: 'success', data: newSalary });
});

apiRouter.put('/salaries/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const idx = rawSalaries.findIndex((s: any) => s.id === id);
  if (idx >= 0) {
    rawSalaries[idx] = { ...rawSalaries[idx], ...body, id, updatedAt: new Date().toISOString() };
    return res.json({ message: 'success', data: rawSalaries[idx] });
  }
  res.json({ message: 'success', data: { id, ...body } });
});

apiRouter.delete('/salaries/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rawSalaries = rawSalaries.filter((s: any) => s.id !== id);
  res.json({ message: 'success', data: { id } });
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

// 14. Reports
apiRouter.get('/reports/income-statement', (req: Request, res: Response) => {
  const flockId = getFlockId(req);

  if (flockId === 8) {
    return res.json({
      message: 'success',
      data: {
        financialReport: {
          totalRevenue: 35000000,
          cogs: { chicken: 7800000, feed: 62000000, medicine: 3200000, vaccine: 1200000, total: 74200000 },
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
            tp: 0,
            powerElectric: 0,
            furnitureFixture: 0,
            other: 0,
            total: 5800000,
          },
          totalExpenses: 80000000,
          netIncome: -45000000,
          period: 'Unit 1 - Flock Performance Statement',
        },
        managementReport: {
          overview: { totalRevenue: 35000000, totalExpenses: 80000000, netProfit: -45000000, activeBirds: 25000, cogs: 74200000, costPerBird: 320.0 },
          production: { totalEggs: 1641540, brokenEggs: 5500, avgEggWeight: 59.8, eggWastageRate: '0.33%', averageLayingRate: '142.50%' },
          healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 4600, totalWaterConsumption: 580000, totalFeedPurchased: 4600, feedConversionRate: 1.48 },
          additionalMetrics: { flockCount: 1, avgEggPriceInRange: 18.2 },
          inventoryAlerts: [],
          flockDetails: [{ id: 8, name: 'Unit 1', flockName: 'Unit 1', breed: 'LSL', totalBirds: 25000, birds: 25000, ageWeeks: 38, status: 'Active' }],
          salesBreakdown: [{ head: 'EGG', amount: 35000000 }],
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
          cogs: { chicken: 15000000, feed: 160000000, medicine: 5500000, vaccine: 2500000, total: 183000000 },
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
            tp: 3809593,
            powerElectric: 1373671,
            furnitureFixture: 100000,
            other: 0,
            total: 27000000,
          },
          totalExpenses: 210000000,
          netIncome: 35000000,
          period: 'Unit 2 - Flock Performance Statement',
        },
        managementReport: {
          overview: { totalRevenue: 245000000, totalExpenses: 210000000, netProfit: 35000000, activeBirds: 35000, cogs: 183000000, costPerBird: 278.5 },
          production: { totalEggs: 13767720, brokenEggs: 46000, avgEggWeight: 60.1, eggWastageRate: '0.33%', averageLayingRate: '152.80%' },
          healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 31500, totalWaterConsumption: 4100000, totalFeedPurchased: 31500, feedConversionRate: 1.46 },
          additionalMetrics: { flockCount: 1, avgEggPriceInRange: 17.9 },
          inventoryAlerts: [],
          flockDetails: [{ id: 9, name: 'Unit 2', flockName: 'Unit 2', breed: 'LSL', totalBirds: 35000, birds: 35000, ageWeeks: 32, status: 'Active' }],
          salesBreakdown: [{ head: 'EGG', amount: 244500000 }, { head: 'Manure', amount: 500000 }],
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
          cogs: { chicken: 2491900, feed: 44905100, medicine: 1603308.6, vaccine: 928493, total: 49928801.6 },
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
            tp: 0,
            powerElectric: 0,
            furnitureFixture: 0,
            other: 0,
            total: 11250397,
          },
          totalExpenses: 61179198.6,
          netIncome: -46273601.6,
          period: 'Unit 3 - Flock Performance Statement',
        },
        managementReport: {
          overview: { totalRevenue: 14905597, totalExpenses: 61179198.6, netProfit: -46273601.6, activeBirds: 25500, cogs: 49928801.6, costPerBird: 318.0 },
          production: { totalEggs: 850080, brokenEggs: 3400, avgEggWeight: 59.9, eggWastageRate: '0.40%', averageLayingRate: '140.20%' },
          healthMetrics: { mortalityInRange: 0, cullInRange: 0, totalFeedConsumedBags: 9495, totalWaterConsumption: 740000, totalFeedPurchased: 9495, feedConversionRate: 1.50 },
          additionalMetrics: { flockCount: 1, avgEggPriceInRange: 17.5 },
          inventoryAlerts: [],
          flockDetails: [{ id: 10, name: 'Unit 3', flockName: 'Unit 3', breed: 'LSL', totalBirds: 25500, birds: 25500, ageWeeks: 26, status: 'Active' }],
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
          packingMaterial: 4797610,
          tp: 3809593,
          mess: 2777583,
          repairMaintenance: 1652935,
          powerElectric: 1373671,
          miscellaneous: 678801,
          meetingRefreshment: 627590,
          officeExpenses: 264416,
          furnitureFixture: 192860,
          professionalFee: 150000,
          computerDevices: 26050,
          travellingLogistics: 25180,
          other: 2,
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
