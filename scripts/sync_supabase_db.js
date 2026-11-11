import fs from 'fs';
import pg from 'pg';

const rawUrl = process.env.DATABASE_URL;
let config;
if (rawUrl) {
  try {
    const u = new URL(rawUrl);
    config = {
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      database: u.pathname ? u.pathname.slice(1) : 'postgres',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 15000,
    };
  } catch {
    config = {
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 15000,
    };
  }
} else {
  config = {
    host: 'db.tchlzcytxtmycxdmbgug.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Chaudhary@182!@',
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
  };
}

const pool = new pg.Pool(config);

const VALID_SALE_HEADS = new Set(['EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER']);
const VALID_EXPENSE_HEADS = new Set([
  'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP',
  'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE',
  'VACCINE', 'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES',
  'MEETING_REFRESHMENT', 'FURNITURE_FIXTURE', 'COMPUTER_DEVICES',
  'PROFESSIONAL_FEE', 'MISCELLANEOUS', 'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT'
]);

function normalizeSaleHead(raw) {
  const h = String(raw || 'EGG').trim();
  if (h === 'Feed BAGS' || h === 'Feed_BAGS' || h === 'Feed_BAG') return 'Feed_BAGS';
  if (VALID_SALE_HEADS.has(h)) return h;
  return 'OTHER';
}

function normalizeExpenseHead(raw) {
  let h = String(raw || 'OTHER').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (h === 'SALARIES_PAY') h = 'SALARIES_PAYMENTS';
  if (h === 'MEETING_REFR') h = 'MEETING_REFRESHMENT';
  if (h === 'OFFICE_EXPEN') h = 'OFFICE_EXPENSES';
  if (h === 'POWER_ELECT') h = 'POWER_ELECTRIC';
  if (h === 'PACKING_MATE') h = 'PACKING_MATERIAL';
  if (VALID_EXPENSE_HEADS.has(h)) return h;
  return 'OTHER';
}

async function syncAll() {
  const client = await pool.connect();
  try {
    const appData = JSON.parse(fs.readFileSync('src/data/app-data.json', 'utf8'));

    console.log('🔄 Syncing EggProduction to Supabase...');
    const eggs = appData.rawEggProductions;
    await client.query('BEGIN;');
    await client.query('DELETE FROM public."EggProduction";');
    for (let i = 0; i < eggs.length; i += 100) {
      const chunk = eggs.slice(i, i + 100);
      const values = [];
      const placeholders = chunk.map((e, idx) => {
        const offset = idx * 9;
        values.push(
          e.id,
          e.date,
          e.totalEggs,
          e.notes || '',
          e.averageWeight || 60,
          e.brokenEggs || 0,
          e.flockId,
          e.grade || 'standard',
          e.birds || (e.flockId === 8 ? 24200 : e.flockId === 9 ? 32500 : 25500)
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
      }).join(', ');
      await client.query(`INSERT INTO public."EggProduction" (id, date, "totalEggs", notes, "averageWeight", "brokenEggs", "flockId", grade, birds) VALUES ${placeholders};`, values);
    }
    await client.query('COMMIT;');
    console.log(`✅ Synced ${eggs.length} EggProduction records.`);

    console.log('🔄 Syncing Stock to Supabase...');
    const stocks = appData.rawStocks;
    await client.query('BEGIN;');
    await client.query('DELETE FROM public."Stock";');
    for (let i = 0; i < stocks.length; i += 100) {
      const chunk = stocks.slice(i, i + 100);
      const values = [];
      const placeholders = chunk.map((s, idx) => {
        const offset = idx * 9;
        values.push(
          s.id,
          s.date,
          s.Type || '13',
          s.head || 'FEED',
          s.quantity || 0,
          s.notes || '',
          s.amountPaid || 0,
          s.challanNo ? String(s.challanNo) : '0',
          s.flockId || 9
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, 0)`;
      }).join(', ');
      await client.query(`INSERT INTO public."Stock" (id, date, "Type", head, quantity, notes, "amountPaid", "challanNo", "flockId", "expenseId") VALUES ${placeholders};`, values);
    }
    await client.query('COMMIT;');
    console.log(`✅ Synced ${stocks.length} Stock records.`);

    console.log('🔄 Syncing Sales to Supabase...');
    const sales = appData.rawSales;
    await client.query('BEGIN;');
    await client.query('DELETE FROM public."Sale";');
    for (let i = 0; i < sales.length; i += 100) {
      const chunk = sales.slice(i, i + 100);
      const values = [];
      const placeholders = chunk.map((s, idx) => {
        const offset = idx * 12;
        values.push(
          s.id,
          s.saleDate || s.date,
          s.flockId || 8,
          s.itemsSold !== undefined ? s.itemsSold : (s.quantity || 0),
          normalizeSaleHead(s.head || s.category),
          s.totalAmount !== undefined ? s.totalAmount : (s.amount || 0),
          s.notes || '',
          s.cashPayment || 0,
          s.onlinePayment || 0,
          s.partyName || 'Market',
          s.vehicleNumber || 'Direct',
          s.challanNo ? String(s.challanNo) : '0'
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
      }).join(', ');
      await client.query(`INSERT INTO public."Sale" (id, "saleDate", "flockId", "itemsSold", head, "totalAmount", notes, "cashPayment", "onlinePayment", "partyName", "vehicleNumber", "challanNo") VALUES ${placeholders};`, values);
    }
    await client.query('COMMIT;');
    console.log(`✅ Synced ${sales.length} Sale records.`);

    console.log('🔄 Syncing Expenses to Supabase...');
    const expenses = appData.rawExpenses;
    await client.query('BEGIN;');
    await client.query('DELETE FROM public."Expense";');
    for (let i = 0; i < expenses.length; i += 100) {
      const chunk = expenses.slice(i, i + 100);
      const values = [];
      const placeholders = chunk.map((e, idx) => {
        const offset = idx * 7;
        values.push(
          e.id,
          e.expenseDate || e.date,
          e.expenseCost !== undefined ? e.expenseCost : (e.amount || 0),
          normalizeExpenseHead(e.head || e.category),
          e.notes || '',
          e.flockId || 8,
          e.challanNo ? String(e.challanNo) : '0'
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
      }).join(', ');
      await client.query(`INSERT INTO public."Expense" (id, expense_date, expense_cost, head, notes, "flockId", "challanNo") VALUES ${placeholders};`, values);
    }
    await client.query('COMMIT;');
    console.log(`✅ Synced ${expenses.length} Expense records.`);

    console.log('🎉 ALL SUPABASE TABLES SUCCESSFULLY SYNCHRONIZED!');
  } catch (err) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('❌ Supabase sync failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

syncAll();
