import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/index.ts';
import {
  AuthenticatedRequest,
  hashPassword,
  verifyPassword,
  signAuthToken,
  requireAuth,
  requireSuperAdmin,
  requireFinancialAccess,
  requireFarmsAccess,
} from './auth.ts';
import { getRolePermissions } from '../utils/permissions.ts';
import {
  ensureDbInitialized,
  flockIdFromInput,
  fetchAllFlocks,
  upsertFlock,
  deleteFlock,
  fetchAllFarms,
  upsertFarm,
  deleteFarm,
  fetchAllEggProductions,
  upsertEggProduction,
  deleteEggProduction,
  fetchAllExpenses,
  upsertExpense,
  deleteExpense,
  fetchAllSales,
  upsertSale,
  deleteSale,
  fetchAllStocks,
  upsertStock,
  deleteStock,
  fetchAllConsumptions,
  upsertConsumption,
  deleteConsumption,
  fetchAllBirdHealth,
  upsertBirdHealth,
  deleteBirdHealth,
  fetchAllVaccines,
  upsertVaccine,
  deleteVaccine,
  fetchAllSalaries,
  upsertSalary,
  deleteSalary,
  fetchAllWorkers,
  upsertWorker,
  deleteWorker,
  fetchAllBanks,
  upsertBank,
  deleteBank,
  fetchAllUsers,
  fetchAllPowerConsumptions,
  upsertPowerConsumption,
  deletePowerConsumption,
  reconcileFlockBirdHealth,
  StockLinkedExpenseError,
} from './supabaseSync.ts';

export const apiRouter = Router();

const asyncHandler =
  (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch((err) => {
      console.error('API Error:', err);
      if (!res.headersSent) {
        if (err instanceof StockLinkedExpenseError) {
          res.status(err.statusCode).json({
            message: err.message,
            code: err.code,
          });
          return;
        }
        res.status(500).json({
          message: err?.message || 'Database operation failed. Please try again.',
          code: 'SERVER_ERROR',
        });
      }
    });
  };

// Ensure PostgreSQL schema, sequences & one-time seeds are ready on every cold start
apiRouter.use(
  asyncHandler(async (_req, _res, next) => {
    await ensureDbInitialized();
    next();
  })
);

function getFlockId(req: Request): number | null {
  const f = req.query.flockId;
  if (!f || f === 'all' || f === 'null' || f === 'undefined') return null;
  const num = parseInt(f as string, 10);
  return isNaN(num) ? null : num;
}

function isDateInRange(itemDateStr?: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  if (!itemDateStr) return true;
  const itemTime = new Date(itemDateStr).getTime();
  if (isNaN(itemTime)) return true;
  if (startDate) {
    const sTime = new Date(startDate).getTime();
    if (!isNaN(sTime) && itemTime < sTime) return false;
  }
  if (endDate) {
    const eTime = new Date(endDate).getTime();
    const endOfDay = endDate.includes('T') ? eTime : eTime + 86400000;
    if (!isNaN(endOfDay) && itemTime > endOfDay) return false;
  }
  return true;
}

function paginateItems(items: any[], req: Request, defaultLimit = 10) {
  const pageParam = req.query.page !== undefined ? parseInt(req.query.page as string, 10) : undefined;
  const limitParam = req.query.limit !== undefined ? parseInt(req.query.limit as string, 10) : undefined;
  const limit = limitParam && !isNaN(limitParam) && limitParam > 0 ? limitParam : defaultLimit;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = pageParam && !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

  const paginatedItems =
    pageParam !== undefined ? items.slice((page - 1) * limit, page * limit) : items;

  return {
    items: paginatedItems,
    pagination: { page, limit, total, pages },
  };
}

// Public Health Check
apiRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', timestamp: new Date().toISOString() });
  })
);

// ==========================================
// 1. Authentication (Real DB Verification)
// ==========================================
apiRouter.post(
  '/auth/signin',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const identifier = String(email || '').trim();
    const pwd = String(password || '');

    if (!identifier || !pwd) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const userRes = await pool.query(
      `SELECT id, name, email, password, role, status::text AS status, "isEmailVerified", "farmAssigned", "createdAt"
       FROM public."user"
       WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    const dbUser = userRes.rows[0];
    if (!dbUser) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { valid, needsRehash } = verifyPassword(pwd, dbUser.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (dbUser.status !== 'allowed') {
      return res.status(403).json({
        message: 'Account access is suspended or pending administrator approval.',
      });
    }

    // Upgrade legacy plaintext password hash silently on successful login
    const nowLabel = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (needsRehash) {
      await pool.query(
        'UPDATE public."user" SET password = $1, "lastLogin" = $2 WHERE id = $3',
        [hashPassword(pwd), nowLabel, dbUser.id]
      );
    } else {
      await pool.query('UPDATE public."user" SET "lastLogin" = $1 WHERE id = $2', [
        nowLabel,
        dbUser.id,
      ]);
    }

    const token = signAuthToken({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
    });

    res.json({
      message: 'success',
      data: {
        token,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          status: dbUser.status,
          role: dbUser.role,
          farmAssigned: dbUser.farmAssigned || 'All Farm Complexes',
          isEmailVerified: Boolean(dbUser.isEmailVerified),
          isSuperAdmin: dbUser.role === 'super_admin',
          createdAt: dbUser.createdAt,
        },
      },
    });
  })
);

// Protect all routes below with verified Bearer JWT/HMAC session
apiRouter.use(requireAuth);

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const u = req.authUser!;
  res.json({
    message: 'success',
    data: {
      user: {
        ...u,
        isSuperAdmin: u.role === 'super_admin',
      },
    },
  });
});

// Helper: Mask financial fields for supervisor accounts on shared operational modules
function isFinancialAllowed(req: AuthenticatedRequest): boolean {
  return getRolePermissions(req.authUser?.role).canViewFinancials;
}

function maskStockFinancials(item: any) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    amount: 0,
    amountPaid: 0,
    costPerBag: 0,
    paymentType: undefined,
    expenseId: undefined,
    syncedExpense: undefined,
  };
}

function maskPowerFinancials(item: any) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    unitRatePkr: 0,
    solarUnitRatePkr: 0,
    gridUnitRatePkr: 0,
    dieselRatePerLiter: 0,
    dieselPurchaseCost: 0,
  };
}

// Challan Upload Handlers
const dummyChallan = (_req: Request, res: Response) => {
  res.json({ message: 'success', data: { url: '/assets/favicon-DwnAFEdf.png' } });
};
apiRouter.post('/expenses/upload-challan', requireFinancialAccess, dummyChallan);
apiRouter.post('/sales/upload-challan', requireFinancialAccess, dummyChallan);
apiRouter.post('/stocks/upload-challan', dummyChallan);

// ==========================================
// Metrics Computation directly from DB
// ==========================================
const COGS_HEADS = new Set(['FEED', 'CHICKEN', 'MEDICINE', 'VACCINE']);

async function computeMetricsFromDb(flockId?: number | null, startDate?: string, endDate?: string) {
  const isAll = !flockId;
  const [flockItems, rawExpenses, rawSales, rawEggProductions, rawStocks, allConsumptions, birdHealthItems] =
    await Promise.all([
      fetchAllFlocks(),
      fetchAllExpenses(),
      fetchAllSales(),
      fetchAllEggProductions(),
      fetchAllStocks(),
      fetchAllConsumptions(),
      fetchAllBirdHealth(),
    ]);

  const targetFlocks = isAll ? flockItems : flockItems.filter((f) => f.id === flockId);
  const flockCount = targetFlocks.length;
  const activeBirds = targetFlocks
    .filter((f) => f.isActive !== false)
    .reduce((sum, f) => sum + (Number(f.totalBirds) || 0), 0);

  const flockMortalitySum = targetFlocks.reduce((sum, f) => sum + (Number(f.mortality) || 0), 0);
  const healthInRange = birdHealthItems.filter((h) => {
    if (flockId && h.flockId !== flockId) return false;
    return isDateInRange(h.date, startDate, endDate);
  });
  const healthMortality = healthInRange.reduce((sum, h) => sum + (Number(h.mortality) || 0), 0);
  const totalMortality = startDate || endDate ? healthMortality : flockMortalitySum;
  const cullInRange = healthInRange.reduce((sum, h) => sum + (Number(h.cull) || 0), 0);

  let totalExpenses = 0;
  const expenseMap: Record<string, number> = {};
  const flockExpenseMap: Record<number, number> = {};
  for (const exp of rawExpenses) {
    const expFid = Number(exp.flockId) || 8;
    if (!isAll && expFid !== flockId) continue;
    if (!isDateInRange(exp.expenseDate || exp.date, startDate, endDate)) continue;
    const cost = Number(exp.expenseCost ?? exp.amount ?? 0) || 0;
    const head = String(exp.head || 'OTHER').trim();
    flockExpenseMap[expFid] = (flockExpenseMap[expFid] || 0) + cost;
    totalExpenses += cost;
    expenseMap[head] = (expenseMap[head] || 0) + cost;
  }

  let totalRevenue = 0;
  let totalItemsSold = 0;
  const salesMap: Record<string, number> = {};
  const flockSalesMap: Record<number, number> = {};
  for (const sale of rawSales) {
    const saleFid = Number(sale.flockId) || 8;
    if (!isAll && saleFid !== flockId) continue;
    if (!isDateInRange(sale.saleDate || sale.date, startDate, endDate)) continue;
    const amt = Number(sale.totalAmount ?? sale.amount ?? 0) || 0;
    const items = Number(sale.itemsSold ?? sale.quantity ?? 0) || 0;
    const head = String(sale.head || 'EGG').trim();
    flockSalesMap[saleFid] = (flockSalesMap[saleFid] || 0) + amt;
    totalRevenue += amt;
    totalItemsSold += items;
    salesMap[head] = (salesMap[head] || 0) + amt;
  }

  let totalEggs = 0;
  let brokenEggs = 0;
  const flockEggMap: Record<number, number> = {};
  for (const egg of rawEggProductions) {
    const eggFid = Number(egg.flockId) || 8;
    if (!isAll && eggFid !== flockId) continue;
    if (!isDateInRange(egg.date, startDate, endDate)) continue;
    const count = Number(egg.totalEggs) || 0;
    const broken = Number(egg.brokenEggs) || 0;
    flockEggMap[eggFid] = (flockEggMap[eggFid] || 0) + count;
    totalEggs += count;
    brokenEggs += broken;
  }

  let totalFeedPurchased = 0;
  for (const stk of rawStocks) {
    const sFid = Number(stk.flockId) || 8;
    if (!isAll && sFid !== flockId) continue;
    if (!isDateInRange(stk.date, startDate, endDate)) continue;
    totalFeedPurchased += Number(stk.quantity) || 0;
  }

  let totalFeedConsumedBags = 0;
  let totalWaterConsumption = 0;
  for (const c of allConsumptions) {
    const cFid = Number(c.flockId) || 8;
    if (!isAll && cFid !== flockId) continue;
    if (!isDateInRange(c.date, startDate, endDate)) continue;
    totalFeedConsumedBags += Number(c.feedConsumed ?? c.bags) || 0;
    totalWaterConsumption += Number(c.waterConsumed ?? c.waterIntakeLiters) || 0;
  }

  let cogs = 0;
  for (const [head, amt] of Object.entries(expenseMap)) {
    if (COGS_HEADS.has(head)) cogs += amt;
  }

  const netProfit = totalRevenue - totalExpenses;
  const costPerBird = activeBirds > 0 ? Number((cogs / activeBirds).toFixed(2)) : 0;
  const eggWastageRate = totalEggs > 0 ? ((brokenEggs / totalEggs) * 100).toFixed(2) + '%' : '0.00%';
  const layingRateVal = activeBirds > 0 ? ((totalEggs / (activeBirds * 120)) * 100).toFixed(2) : '0.00';

  const expenseBreakdown = Object.entries(expenseMap).map(([head, amount]) => ({ head, amount }));
  const salesBreakdown = Object.entries(salesMap).map(([head, amount]) => ({ head, amount }));

  const flockPerformance = targetFlocks.map((f) => ({
    flock: f.flockName,
    production: flockEggMap[f.id] || 0,
    mortality: Number(f.mortality) || 0,
  }));

  return {
    targetFlocks,
    flockCount,
    activeBirds,
    totalRevenue,
    totalExpenses,
    netProfit,
    cogs,
    costPerBird,
    totalEggs,
    brokenEggs,
    avgEggWeight: 59.99,
    eggWastageRate,
    averageLayingRate: `${layingRateVal}%`,
    totalMortality,
    cullInRange,
    expenseMap,
    flockExpenseMap,
    expenseBreakdown,
    salesBreakdown,
    flockSalesMap,
    totalItemsSold,
    flockEggMap,
    flockPerformance,
    totalFeedConsumedBags,
    totalWaterConsumption,
    totalFeedPurchased,
    rawEggProductions,
  };
}

// ==========================================
// 2. Dashboard
// ==========================================
apiRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const m = await computeMetricsFromDb(flockId, startDate, endDate);
    const canViewFinancials = isFinancialAllowed(req);

    const dailyEggMap: Record<string, { label: string; eggs: number }> = {};
    for (const egg of m.rawEggProductions) {
      if (flockId && egg.flockId !== flockId) continue;
      const dStr = egg.date ? egg.date.split('T')[0] : '';
      if (!dStr) continue;
      if (!dailyEggMap[dStr]) {
        const dayLabel = new Date(dStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        dailyEggMap[dStr] = { label: dayLabel, eggs: 0 };
      }
      dailyEggMap[dStr].eggs += Number(egg.totalEggs) || 0;
    }
    const chart = Object.keys(dailyEggMap)
      .sort()
      .slice(-7)
      .map((dStr) => ({ date: dailyEggMap[dStr].label, eggs: dailyEggMap[dStr].eggs }));

    res.json({
      message: 'Dashboard stats generated successfully',
      data: {
        overview: {
          totalRevenue: canViewFinancials ? m.totalRevenue : 0,
          totalExpenses: canViewFinancials ? m.totalExpenses : 0,
          netProfit: canViewFinancials ? m.netProfit : 0,
          activeBirds: m.activeBirds,
          cogs: canViewFinancials ? m.cogs : 0,
          costPerBird: canViewFinancials ? m.costPerBird : 0,
        },
        production: {
          totalEggs: m.totalEggs,
          brokenEggs: m.brokenEggs,
          avgEggWeight: m.avgEggWeight,
          eggWastageRate: m.eggWastageRate,
          averageLayingRate: m.averageLayingRate,
        },
        healthMetrics: {
          mortalityInRange: m.totalMortality,
          cullInRange: m.cullInRange,
          totalFeedConsumedBags: m.totalFeedConsumedBags,
          totalWaterConsumption: m.totalWaterConsumption,
          totalFeedPurchased: m.totalFeedPurchased,
          feedConversionRate: 1.48,
        },
        additionalMetrics: {
          flockCount: m.flockCount,
          avgEggPriceInRange: canViewFinancials ? 18.08 : 0,
        },
        flockPerformance: m.flockPerformance,
        salesBreakdown: canViewFinancials ? m.salesBreakdown : [],
        expenseBreakdown: canViewFinancials ? m.expenseBreakdown : [],
        inventoryAlerts: [],
        chart,
      },
    });
  })
);

// ==========================================
// 3. Flocks CRUD
// ==========================================
apiRouter.get(
  ['/flock', '/flocks'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const all = await fetchAllFlocks();
    const items = flockId ? all.filter((f) => f.id === flockId) : all;
    res.json({
      message: 'success',
      data: { items, pagination: { page: 1, limit: 100, total: items.length, pages: 1 } },
    });
  })
);

apiRouter.post(
  ['/flock', '/flocks'],
  asyncHandler(async (req, res) => {
    const saved = await upsertFlock(req.body || {});
    if (Number(saved?.mortality) > 0) {
      await reconcileFlockBirdHealth(Number(saved.id), Number(saved.mortality), saved.flockName);
    }
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  ['/flock/:id', '/flocks/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return res.status(400).json({ message: 'Invalid flock ID.' });
    }
    const existingList = await fetchAllFlocks();
    const existing = existingList.find((f) => f.id === id) || {};
    const saved = await upsertFlock({ ...existing, ...(req.body || {}), id }, id);
    if (req.body?.mortality !== undefined) {
      await reconcileFlockBirdHealth(id, Number(saved.mortality ?? 0), saved.flockName);
    }
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  ['/flock/:id', '/flocks/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return res.status(400).json({ message: 'Invalid flock ID.' });
    }
    await deleteFlock(id);
    res.json({ message: 'success', data: { id } });
  })
);

apiRouter.get(
  ['/flock/summary', '/flocks/summary'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const all = await fetchAllFlocks();
    const targetFlocks = flockId ? all.filter((f) => f.id === flockId) : all;
    const totalBirds = targetFlocks.reduce((sum, f) => sum + (Number(f.totalBirds) || 0), 0);
    const totalMortality = targetFlocks.reduce((sum, f) => sum + (Number(f.mortality) || 0), 0);
    res.json({
      message: 'success',
      data: {
        totalFlocks: targetFlocks.length,
        totalBirds,
        totalMortality,
        activeFlocks: targetFlocks.filter((f) => f.isActive !== false).length,
        inactiveFlocks: targetFlocks.filter((f) => f.isActive === false).length,
        flockCount: targetFlocks.length,
      },
    });
  })
);

// ==========================================
// 4. Farms CRUD
// ==========================================
apiRouter.get(
  '/getFarms',
  requireFarmsAccess,
  asyncHandler(async (_req, res) => {
    const items = await fetchAllFarms();
    res.json({ message: 'success', data: items });
  })
);

apiRouter.get(
  '/farms',
  requireFarmsAccess,
  asyncHandler(async (_req, res) => {
    const items = await fetchAllFarms();
    res.json({
      message: 'success',
      data: { items, pagination: { page: 1, limit: 100, total: items.length, pages: 1 } },
    });
  })
);

apiRouter.post(
  '/farms',
  requireFarmsAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertFarm(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/farms/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const validId = Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : undefined;
    if (!validId) return res.status(400).json({ message: 'Invalid farm ID.' });
    const saved = await upsertFarm({ ...(req.body || {}), id: validId }, validId);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/farms/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return res.status(400).json({ message: 'Invalid farm ID.' });
    }
    await deleteFarm(id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

// ==========================================
// 5. User Management (PostgreSQL + RBAC)
// ==========================================
apiRouter.get(
  '/user/allUsers',
  requireSuperAdmin,
  asyncHandler(async (_req, res) => {
    const users = await fetchAllUsers();
    res.json({ message: 'success', data: users });
  })
);

apiRouter.get('/user/profile', (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'success', data: req.authUser });
});

apiRouter.post(
  '/user/create',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { name, email, role, farmAssigned, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ message: 'Full name and email are required.' });
    }
    const existing = await pool.query(
      'SELECT id FROM public."user" WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    const rawPass = String(password || '').trim() || 'Greenova@2026';
    const insertRes = await pool.query(
      `INSERT INTO public."user" (name, email, password, status, role, "isEmailVerified", "farmAssigned", "lastLogin", "createdAt")
       VALUES ($1, $2, $3, 'allowed'::"UserStatus", $4, true, $5, 'Invited', NOW())
       RETURNING id, name, email, role, status::text AS status, "farmAssigned", "lastLogin", "isEmailVerified", "createdAt"`,
      [cleanName, cleanEmail, hashPassword(rawPass), role || 'supervisor', farmAssigned || 'GreenOva Unit 1']
    );
    const u = insertRes.rows[0];
    res.json({
      message: 'success',
      data: {
        id: String(u.id),
        dbId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        farmAssigned: u.farmAssigned || 'All Farm Complexes',
        status: u.status === 'allowed' ? 'Active' : 'Inactive',
        lastLogin: u.lastLogin || 'Invited',
      },
    });
  })
);

apiRouter.put(
  '/user/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const { name, email, role, farmAssigned, status, password } = req.body || {};
    const dbStatus = status === 'Inactive' || status === 'rejected' ? 'rejected' : 'allowed';

    if (password && String(password).trim().length >= 6) {
      await pool.query(
        `UPDATE public."user"
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             role = COALESCE($3, role),
             "farmAssigned" = COALESCE($4, "farmAssigned"),
             status = $5::"UserStatus",
             password = $6
         WHERE id = $7`,
        [name, email?.toLowerCase(), role, farmAssigned, dbStatus, hashPassword(String(password).trim()), id]
      );
    } else {
      await pool.query(
        `UPDATE public."user"
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             role = COALESCE($3, role),
             "farmAssigned" = COALESCE($4, "farmAssigned"),
             status = $5::"UserStatus"
         WHERE id = $6`,
        [name, email?.toLowerCase(), role, farmAssigned, dbStatus, id]
      );
    }

    const updated = await pool.query(
      'SELECT id, name, email, role, status::text AS status, "farmAssigned", "lastLogin" FROM public."user" WHERE id = $1',
      [id]
    );
    const u = updated.rows[0];
    if (!u) return res.status(404).json({ message: 'User not found.' });
    res.json({
      message: 'success',
      data: {
        id: String(u.id),
        dbId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        farmAssigned: u.farmAssigned,
        status: u.status === 'allowed' ? 'Active' : 'Inactive',
        lastLogin: u.lastLogin || 'Never',
      },
    });
  })
);

apiRouter.post(
  '/user/change-password',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id, password } = req.body || {};
    const numId = Number(id);
    if (isNaN(numId) || !password || String(password).length < 6) {
      return res.status(400).json({ message: 'Valid user ID and password (min 6 chars) required.' });
    }
    await pool.query('UPDATE public."user" SET password = $1 WHERE id = $2', [
      hashPassword(String(password)),
      numId,
    ]);
    res.json({ message: 'success', data: { id: String(numId) } });
  })
);

apiRouter.post(
  '/user/shift-user-status',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id, status } = req.body || {};
    const numId = Number(id);
    const dbStatus = status === 'Inactive' || status === 'rejected' ? 'rejected' : 'allowed';
    await pool.query('UPDATE public."user" SET status = $1::"UserStatus" WHERE id = $2', [
      dbStatus,
      numId,
    ]);
    res.json({ message: 'success', data: { id: String(numId), status: dbStatus } });
  })
);

apiRouter.delete(
  '/user/:id',
  requireSuperAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const numId = Number(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid user ID.' });
    const targetRes = await pool.query('SELECT id, email FROM public."user" WHERE id = $1', [numId]);
    const target = targetRes.rows[0];
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.email?.toLowerCase() === 'aaglobal500@gmail.com') {
      return res.status(403).json({ message: 'Primary Super Administrator cannot be deleted.' });
    }
    if (req.authUser?.id === numId) {
      return res.status(400).json({ message: 'Cannot delete your own currently signed-in account.' });
    }
    await pool.query('DELETE FROM public."user" WHERE id = $1', [numId]);
    res.json({ message: 'success', data: { id: String(numId) } });
  })
);

// ==========================================
// 6. Daily Consumptions CRUD
// ==========================================
apiRouter.get(
  ['/daily-consumption', '/daily-consumptions'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const all = await fetchAllConsumptions();
    const items = flockId ? all.filter((c) => c.flockId === flockId) : all;
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  ['/daily-consumption', '/daily-consumptions'],
  asyncHandler(async (req, res) => {
    const saved = await upsertConsumption(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  ['/daily-consumption/:id', '/daily-consumptions/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertConsumption(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  ['/daily-consumption/:id', '/daily-consumptions/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteConsumption(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  ['/daily-consumption/summary', '/daily-consumptions/summary'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const all = await fetchAllConsumptions();
    const filtered = flockId ? all.filter((c) => c.flockId === flockId) : all;
    const totalFeed = filtered.reduce((s, c) => s + (Number(c.bags ?? c.feedConsumed) || 0), 0);
    const totalWater = filtered.reduce((s, c) => s + (Number(c.waterConsumed) || 0), 0);
    res.json({
      message: 'success',
      data: {
        totalFeed,
        totalFeedConsumedBags: totalFeed,
        totalWaterConsumption: totalWater,
      },
    });
  })
);

// ==========================================
// 7. Bird Health (Mortality) CRUD
// ==========================================
apiRouter.get(
  '/bird-health',
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const all = await fetchAllBirdHealth();
    const items = flockId ? all.filter((b) => b.flockId === flockId) : all;
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  '/bird-health',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const saved = await upsertBirdHealth(body);
    const fid = flockIdFromInput(body.flockId, body.flockName);

    if (!body.skipFlockAdjust) {
      if (body.flockTotalBirds !== undefined && body.flockMortality !== undefined) {
        await pool.query(
          'UPDATE public."Flock" SET "totalBirds" = $1, mortality = $2, "updatedAt" = NOW() WHERE id = $3',
          [Math.max(0, Number(body.flockTotalBirds)), Math.max(0, Number(body.flockMortality)), fid]
        );
      } else if (Number(body.mortality) > 0) {
        await pool.query(
          'UPDATE public."Flock" SET "totalBirds" = GREATEST(0, "totalBirds" - $1), mortality = mortality + $1, "updatedAt" = NOW() WHERE id = $2',
          [Number(body.mortality), fid]
        );
      }
    }
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/bird-health/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertBirdHealth(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/bird-health/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteBirdHealth(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  '/bird-health/summary',
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const [flocks, health] = await Promise.all([fetchAllFlocks(), fetchAllBirdHealth()]);
    const targetFlocks = flockId ? flocks.filter((f) => f.id === flockId) : flocks;
    const relevantHealth = flockId ? health.filter((h) => h.flockId === flockId) : health;
    const mortalityInRange = relevantHealth.reduce((sum, h) => sum + (Number(h.mortality) || 0), 0);
    const cullInRange = relevantHealth.reduce((sum, h) => sum + (Number(h.cull) || 0), 0);
    const totalMortality = targetFlocks.reduce((sum, f) => sum + (Number(f.mortality) || 0), 0);

    let highestFlock = targetFlocks[0]?.flockName || 'Unit 2';
    let highestMort = 0;
    for (const f of targetFlocks) {
      if ((Number(f.mortality) || 0) >= highestMort) {
        highestMort = Number(f.mortality) || 0;
        highestFlock = f.flockName;
      }
    }

    res.json({
      message: 'success',
      data: {
        totalMortality,
        mortalityInRange,
        cullInRange,
        highestMortality: { flockName: highestFlock, mortality: highestMort },
      },
    });
  })
);

// ==========================================
// 8. Vaccine Schedule CRUD
// ==========================================
apiRouter.get(
  '/vaccines',
  asyncHandler(async (_req, res) => {
    const items = await fetchAllVaccines();
    res.json({ message: 'success', data: { items } });
  })
);

apiRouter.post(
  '/vaccines',
  asyncHandler(async (req, res) => {
    const saved = await upsertVaccine(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/vaccines/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertVaccine(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/vaccines/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteVaccine(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

// ==========================================
// 9. Egg Productions CRUD
// ==========================================
apiRouter.get(
  ['/egg-production', '/egg-productions'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    let items = await fetchAllEggProductions();
    if (flockId) items = items.filter((it) => it.flockId === flockId);
    if (startDate || endDate) items = items.filter((it) => isDateInRange(it.date, startDate, endDate));
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  ['/egg-production', '/egg-productions'],
  asyncHandler(async (req, res) => {
    const saved = await upsertEggProduction(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  ['/egg-production/:id', '/egg-productions/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertEggProduction(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  ['/egg-production/:id', '/egg-productions/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteEggProduction(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  ['/egg-production/summary', '/egg-productions/summary'],
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const m = await computeMetricsFromDb(flockId);
    const byFlock = m.targetFlocks.map((f) => ({
      flock: f.flockName,
      totalEggs: m.flockEggMap[f.id] || 0,
    }));
    res.json({
      message: 'success',
      data: {
        totalEggs: m.totalEggs,
        brokenEggs: m.brokenEggs,
        avgEggWeight: m.avgEggWeight,
        productionPercentage: m.averageLayingRate,
        byFlock,
      },
    });
  })
);

// ==========================================
// 10. Expenses CRUD
// ==========================================
apiRouter.get(
  '/expenses',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const headFilter = req.query.head as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;

    let items = await fetchAllExpenses();
    if (flockId) items = items.filter((it) => it.flockId === flockId);
    if (headFilter && headFilter !== 'all') {
      items = items.filter((it) => it.head === headFilter);
    }
    if (startDate || endDate) {
      items = items.filter((it) => isDateInRange(it.expenseDate || it.date, startDate, endDate));
    }
    if (sortBy === 'cost' && sortOrder) {
      items = [...items].sort((a, b) =>
        sortOrder.toLowerCase() === 'asc' ? a.expenseCost - b.expenseCost : b.expenseCost - a.expenseCost
      );
    }
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  ['/expense', '/expenses'],
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertExpense(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  ['/expense/:id', '/expenses/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertExpense(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  ['/expense/:id', '/expenses/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteExpense(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  '/expenses/summary',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const headFilter = req.query.head as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const m = await computeMetricsFromDb(flockId, startDate, endDate);

    let total = m.totalExpenses;
    const byHead = m.expenseBreakdown.map((b) => ({
      _sum: { expenseCost: b.amount },
      head: b.head,
    }));
    if (headFilter && headFilter !== 'all') {
      const matching = m.expenseBreakdown.find((b) => b.head.toUpperCase() === headFilter.toUpperCase());
      total = matching ? matching.amount : 0;
    }
    const byFlock = m.targetFlocks.map((f) => ({
      _sum: { expenseCost: m.flockExpenseMap[f.id] || 0 },
      flock: f.flockName,
      flockName: f.flockName,
      flockId: f.id,
    }));
    res.json({ message: 'success', data: { total, totalExpenses: total, byHead, byFlock } });
  })
);

// ==========================================
// 11. Stocks CRUD
// ==========================================
apiRouter.get(
  '/stocks',
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    let items = await fetchAllStocks();
    if (flockId) items = items.filter((it) => it.flockId === flockId);
    if (startDate || endDate) items = items.filter((it) => isDateInRange(it.date, startDate, endDate));
    if (!isFinancialAllowed(req)) {
      items = items.map(maskStockFinancials);
    }
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  '/stocks',
  asyncHandler(async (req, res) => {
    const canFinancial = isFinancialAllowed(req);
    const payload = canFinancial
      ? req.body || {}
      : {
          ...(req.body || {}),
          amount: 0,
          amountPaid: 0,
          paymentType: 'CASH',
          skipExpenseSync: true,
        };
    const saved = await upsertStock(payload);
    res.json({ message: 'success', data: canFinancial ? saved : maskStockFinancials(saved) });
  })
);

apiRouter.put(
  '/stocks/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertStock(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/stocks/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const result = await deleteStock(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id, ...result } });
  })
);

apiRouter.get(
  '/stocks/summary',
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const canFinancial = isFinancialAllowed(req);
    let items = await fetchAllStocks();
    if (flockId) items = items.filter((s) => s.flockId === flockId);
    let totalAmount = 0;
    let totalBags = 0;
    let totalQuantity = 0;
    const headMap: Record<string, number> = {};
    for (const s of items) {
      const amt = canFinancial ? Number(s.amountPaid || s.amount || 0) : 0;
      const qty = Number(s.quantity || 0);
      totalAmount += amt;
      totalQuantity += qty;
      if (s.head === 'FEED') totalBags += qty;
      headMap[s.head] = (headMap[s.head] || 0) + amt;
    }
    res.json({
      message: 'success',
      data: {
        overall: { totalAmount, totalBagsReceived: totalBags, totalQuantity },
        byHead: Object.entries(headMap).map(([head, amt]) => ({ head, totalAmount: amt })),
      },
    });
  })
);

// ==========================================
// 12. Sales CRUD
// ==========================================
apiRouter.get(
  '/sales',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    let items = await fetchAllSales();
    if (flockId) items = items.filter((it) => it.flockId === flockId);
    if (startDate || endDate) {
      items = items.filter((it) => isDateInRange(it.saleDate || it.date, startDate, endDate));
    }
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  ['/sale', '/sales'],
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertSale(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  ['/sale/:id', '/sales/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertSale(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  ['/sale/:id', '/sales/:id'],
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteSale(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  '/sales/summary',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const m = await computeMetricsFromDb(flockId);
    const byFlock = m.targetFlocks.map((f) => ({
      totalAmount: m.flockSalesMap[f.id] || 0,
      flock: f.flockName,
      flockId: f.id,
    }));
    res.json({
      message: 'success',
      data: { totalRevenue: m.totalRevenue, totalItemsSold: m.totalItemsSold, byFlock },
    });
  })
);

// ==========================================
// 13. Salaries, Advances & Workers CRUD
// ==========================================
apiRouter.get(
  '/salaries',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const search = req.query.search as string | undefined;
    let items = await fetchAllSalaries();
    if (flockId) items = items.filter((it) => Number(it.flockId) === flockId);
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.employeeName?.toLowerCase().includes(s) ||
          it.designation?.toLowerCase().includes(s) ||
          it.remarks?.toLowerCase().includes(s)
      );
    }
    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  '/salaries',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertSalary(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/salaries/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertSalary(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/salaries/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteSalary(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.get(
  '/workers',
  requireFinancialAccess,
  asyncHandler(async (_req, res) => {
    const items = await fetchAllWorkers();
    res.json({ message: 'success', data: { items } });
  })
);

apiRouter.post(
  '/workers',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertWorker(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/workers/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertWorker({ ...(req.body || {}), id: req.params.id });
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/workers/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteWorker(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

// ==========================================
// 14. Reports
// ==========================================
apiRouter.get(
  '/reports/income-statement',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const flockId = getFlockId(req);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const m = await computeMetricsFromDb(flockId, startDate, endDate);
    const flockTitle = flockId
      ? m.targetFlocks[0]?.flockName || `Flock ${flockId}`
      : 'All Flocks Combined';

    res.json({
      message: 'success',
      data: {
        financialReport: {
          totalRevenue: m.totalRevenue,
          cogs: {
            chicken: m.expenseMap['CHICKEN'] || 0,
            feed: m.expenseMap['FEED'] || 0,
            medicine: m.expenseMap['MEDICINE'] || 0,
            vaccine: m.expenseMap['VACCINE'] || 0,
            total: m.cogs,
          },
          operatingExpenses: {
            salaries: m.expenseMap['SALARIES_PAYMENTS'] || 0,
            rent: m.expenseMap['RENT'] || 0,
            utilities: m.expenseMap['UTILITIES'] || 0,
            pol: m.expenseMap['POL'] || 0,
            mess: m.expenseMap['MESS'] || 0,
            repairMaintenance: m.expenseMap['REPAIR_MAINTENANCE'] || 0,
            officeExpenses: m.expenseMap['OFFICE_EXPENSES'] || 0,
            meetingRefreshment: m.expenseMap['MEETING_REFRESHMENT'] || 0,
            computerDevices: m.expenseMap['COMPUTER_DEVICES'] || 0,
            professionalFee: m.expenseMap['PROFESSIONAL_FEE'] || 0,
            miscellaneous: m.expenseMap['MISCELLANEOUS'] || 0,
            travellingLogistics: m.expenseMap['TRAVELLING_LOGISTICS'] || 0,
            packingMaterial: m.expenseMap['PACKING_MATERIAL'] || 0,
            tp: m.expenseMap['TP'] || 0,
            powerElectric: m.expenseMap['POWER_ELECTRIC'] || 0,
            furnitureFixture: m.expenseMap['FURNITURE_FIXTURE'] || 0,
            other: m.expenseMap['OTHER'] || 0,
            total: Math.max(0, m.totalExpenses - m.cogs),
          },
          totalExpenses: m.totalExpenses,
          netIncome: m.netProfit,
          period: `${flockTitle} - Performance Statement`,
        },
        managementReport: {
          overview: {
            totalRevenue: m.totalRevenue,
            totalExpenses: m.totalExpenses,
            netProfit: m.netProfit,
            activeBirds: m.activeBirds,
            cogs: m.cogs,
            costPerBird: m.costPerBird,
          },
          production: {
            totalEggs: m.totalEggs,
            brokenEggs: m.brokenEggs,
            avgEggWeight: m.avgEggWeight,
            eggWastageRate: m.eggWastageRate,
            averageLayingRate: m.averageLayingRate,
          },
          healthMetrics: {
            mortalityInRange: m.totalMortality,
            cullInRange: m.cullInRange,
            totalFeedConsumedBags: m.totalFeedConsumedBags,
            totalWaterConsumption: m.totalWaterConsumption,
            totalFeedPurchased: m.totalFeedPurchased,
            feedConversionRate: 1.48,
          },
          additionalMetrics: {
            flockCount: m.flockCount,
            avgEggPriceInRange: 18.08,
          },
          inventoryAlerts: [],
          flockDetails: m.targetFlocks.map((f) => ({
            id: f.id,
            name: f.flockName,
            flockName: f.flockName,
            breed: f.breed,
            totalBirds: f.totalBirds,
            birds: f.totalBirds,
            ageWeeks: f.ageWeeks || 30,
            status: f.isActive !== false ? 'Active' : 'Inactive',
          })),
          salesBreakdown: m.salesBreakdown,
        },
      },
    });
  })
);

// ==========================================
// 15. Bank Accounts CRUD
// ==========================================
apiRouter.get(
  '/banks',
  requireFinancialAccess,
  asyncHandler(async (_req, res) => {
    const items = await fetchAllBanks();
    res.json({ message: 'success', data: { items } });
  })
);

apiRouter.post(
  '/banks',
  requireFinancialAccess,
  asyncHandler(async (req, res) => {
    const saved = await upsertBank(req.body || {});
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.put(
  '/banks/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertBank({ ...(req.body || {}), id: req.params.id });
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/banks/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deleteBank(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

// ==========================================
// 16. Power Consumption (Solar, Grid & Diesel) CRUD
// ==========================================
apiRouter.get(
  '/power-consumptions',
  asyncHandler(async (req, res) => {
    const flockIdParam = req.query.flockId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const search = req.query.search as string | undefined;

    let items = await fetchAllPowerConsumptions();
    if (flockIdParam && flockIdParam !== 'all' && flockIdParam !== 'null' && flockIdParam !== 'undefined') {
      items = items.filter((it) => String(it.flockId) === String(flockIdParam));
    }
    if (startDate || endDate) {
      items = items.filter((it) => isDateInRange(it.date, startDate, endDate));
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.flockName?.toLowerCase().includes(s) ||
          it.referenceNo?.toLowerCase().includes(s) ||
          it.notes?.toLowerCase().includes(s) ||
          it.date?.includes(s)
      );
    }

    if (!isFinancialAllowed(req)) {
      items = items.map(maskPowerFinancials);
    }

    res.json({ message: 'success', data: paginateItems(items, req, 10) });
  })
);

apiRouter.post(
  '/power-consumptions',
  asyncHandler(async (req, res) => {
    const canFinancial = isFinancialAllowed(req);
    const payload = canFinancial
      ? req.body || {}
      : {
          ...(req.body || {}),
          unitRatePkr: 0,
          solarUnitRatePkr: 0,
          gridUnitRatePkr: 0,
          dieselRatePerLiter: 0,
          dieselPurchaseCost: 0,
        };
    const saved = await upsertPowerConsumption(payload);
    res.json({ message: 'success', data: canFinancial ? saved : maskPowerFinancials(saved) });
  })
);

apiRouter.put(
  '/power-consumptions/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const saved = await upsertPowerConsumption(req.body || {}, req.params.id);
    res.json({ message: 'success', data: saved });
  })
);

apiRouter.delete(
  '/power-consumptions/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    await deletePowerConsumption(req.params.id);
    res.json({ message: 'success', data: { id: req.params.id } });
  })
);

apiRouter.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'API endpoint not found.', code: 'NOT_FOUND' });
});
