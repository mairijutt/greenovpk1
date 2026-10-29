import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  host: 'db.tchlzcytxtmycxdmbgug.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Chaudhary@182!@',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('=== Connected to Supabase PostgreSQL via Node PG ===');
  const client = await pool.connect();

  try {
    // 1. Create Enums
    console.log('1. Creating ENUM types...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE public."EGG_GRADE" AS ENUM ('started', 'medium', 'standard', 'jumbo');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE public."ExpenseHead" AS ENUM (
          'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP',
          'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE',
          'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT',
          'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS',
          'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE public."Sale_Head" AS ENUM ('EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE public."StockHead" AS ENUM ('FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE public."UserStatus" AS ENUM ('pending', 'rejected', 'allowed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Create Tables
    console.log('2. Creating Tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public."Farm" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        location TEXT,
        description TEXT,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."Flock" (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        "exitDate" TIMESTAMP(3),
        mortality INTEGER DEFAULT 0 NOT NULL,
        notes TEXT,
        "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "acquiredDate" TIMESTAMP(3) NOT NULL,
        breed TEXT NOT NULL,
        "flockName" TEXT NOT NULL,
        "totalBirds" INTEGER DEFAULT 0 NOT NULL,
        "originalTotalBirds" INTEGER,
        cost INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."EggProduction" (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP(3) NOT NULL,
        "totalEggs" INTEGER DEFAULT 0 NOT NULL,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "averageWeight" INTEGER NOT NULL,
        "brokenEggs" INTEGER DEFAULT 0 NOT NULL,
        "flockId" INTEGER NOT NULL,
        grade public."EGG_GRADE" NOT NULL,
        birds INTEGER
      );

      CREATE TABLE IF NOT EXISTS public."Expense" (
        id SERIAL PRIMARY KEY,
        expense_date TIMESTAMP(3) NOT NULL,
        expense_cost DOUBLE PRECISION NOT NULL,
        head public."ExpenseHead" NOT NULL,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        attachment TEXT,
        "challanNo" TEXT DEFAULT '0' NOT NULL,
        "flockId" INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."Sale" (
        id SERIAL PRIMARY KEY,
        "saleDate" TIMESTAMP(3) NOT NULL,
        "flockId" INTEGER NOT NULL,
        "itemsSold" INTEGER DEFAULT 0 NOT NULL,
        attachment TEXT,
        head public."Sale_Head" NOT NULL,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        notes TEXT,
        grade public."EGG_GRADE",
        "averageWeight" INTEGER,
        "cashPayment" INTEGER NOT NULL,
        "onlinePayment" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "partyName" TEXT NOT NULL,
        "vehicleNumber" TEXT NOT NULL,
        weight INTEGER,
        "challanNo" TEXT DEFAULT '0' NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."Stock" (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP(3) NOT NULL,
        "Type" TEXT NOT NULL,
        head public."StockHead" NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        attachment TEXT,
        "amountPaid" DOUBLE PRECISION,
        "paymentType" TEXT,
        "expenseId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "challanNo" TEXT DEFAULT '0' NOT NULL,
        "flockId" INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."Salary" (
        id SERIAL PRIMARY KEY,
        "employeeName" TEXT NOT NULL,
        designation TEXT NOT NULL,
        attendance INTEGER,
        "basicSalary" DOUBLE PRECISION,
        "salaryAmount" DOUBLE PRECISION NOT NULL,
        advance DOUBLE PRECISION,
        "penaltyReward" DOUBLE PRECISION,
        total DOUBLE PRECISION NOT NULL,
        remarks TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "flockId" INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."BirdHealth" (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP(3) NOT NULL,
        "flockId" INTEGER NOT NULL,
        "openingBirds" INTEGER NOT NULL,
        mortality INTEGER DEFAULT 0 NOT NULL,
        cull INTEGER DEFAULT 0 NOT NULL,
        "feedId" TEXT,
        "feedConsumed" DOUBLE PRECISION,
        "waterConsumption" DOUBLE PRECISION,
        "lightHours" DOUBLE PRECISION,
        "lightIntensity" DOUBLE PRECISION,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."DailyConsumption" (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP(3) NOT NULL,
        "flockId" INTEGER NOT NULL,
        "feedQuantity" DOUBLE PRECISION DEFAULT 0,
        "waterIntake" DOUBLE PRECISION DEFAULT 0,
        "feedType" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public."user" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status public."UserStatus" DEFAULT 'pending' NOT NULL,
        role TEXT DEFAULT 'admin' NOT NULL,
        "isEmailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
        otp TEXT,
        "otpExpires" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('Tables created successfully.');

    // 3. Load Backup JSON
    const backupData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/GreenOva_Full_DB_Backup.json'), 'utf-8'));

    // Farms
    console.log('Seeding Farms...');
    await client.query(`
      INSERT INTO public."Farm" (id, name, code, location, description, active)
      VALUES 
        (9, 'GreenOva', 'GVF2025', 'Multan, Punjab', 'Main Processing Facility', true),
        (1, 'A&A Proteins', 'GVF-01', 'Faisalabad, Punjab', 'Broiler & Layer Farm', true),
        (2, 'GreenOva South Unit', 'GVF-02', 'Bahawalpur', 'Broiler Wing', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Flocks
    console.log('Seeding Flocks...');
    await client.query(`
      INSERT INTO public."Flock" (id, "farmId", mortality, notes, "isActive", "acquiredDate", breed, "flockName", "totalBirds", "originalTotalBirds", cost)
      VALUES 
        (8, 9, 0, 'Unit 1 LSL Commercial Layers', true, '2026-02-25', 'LSL', 'Unit 1', 25000, 24786, 8125000),
        (9, 9, 0, 'Unit 2 Main Production', true, '2025-01-01', 'LSL', 'Unit 2', 35000, 31739, 8750000),
        (10, 9, 0, 'Unit 3 Layer Batch', true, '2025-06-01', 'LSL', 'Unit 3', 25500, 25189, 7650000)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Expenses
    const expenses = backupData.all_expenses || [];
    console.log(`Seeding ${expenses.length} Expenses...`);
    const validExpenseHeads = new Set([
      'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP',
      'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE',
      'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT',
      'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS',
      'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT'
    ]);

    for (let i = 0; i < expenses.length; i += 200) {
      const chunk = expenses.slice(i, i + 200);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const e of chunk) {
        const id = e.id;
        const date = e.expense_date || e.date || e.createdAt || new Date().toISOString();
        const cost = Number(e.expense_cost || e.amount || 0);
        const rawHead = (e.head || 'OTHER').toUpperCase().trim();
        const head = validExpenseHeads.has(rawHead) ? rawHead : 'OTHER';
        const notes = e.notes || '';
        const attachment = e.attachment || null;
        const challanNo = String(e.challanNo || '0');
        const flockId = Number(e.flockId || 8);
        const cAt = e.createdAt || new Date().toISOString();
        const uAt = e.updatedAt || new Date().toISOString();

        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(id, date, cost, head, notes, attachment, challanNo, flockId, cAt, uAt);
      }

      await client.query(`
        INSERT INTO public."Expense" (id, expense_date, expense_cost, head, notes, attachment, "challanNo", "flockId", "createdAt", "updatedAt")
        VALUES ${values.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);
    }

    // Sales
    const sales = backupData.all_sales || [];
    console.log(`Seeding ${sales.length} Sales...`);
    const validSaleHeads = new Set(['EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER']);
    const validGrades = new Set(['started', 'medium', 'standard', 'jumbo']);

    for (let i = 0; i < sales.length; i += 200) {
      const chunk = sales.slice(i, i + 200);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const s of chunk) {
        const id = s.id;
        const date = s.saleDate || s.date || s.createdAt || new Date().toISOString();
        const flockId = Number(s.flockId || 8);
        const items = Number(s.itemsSold || 0);
        const attachment = s.attachment || null;
        const rawHead = s.head || 'EGG';
        const head = validSaleHeads.has(rawHead) ? rawHead : 'EGG';
        const amount = Number(s.totalAmount || s.amount || 0);
        const notes = s.notes || '';
        const grade = validGrades.has(s.grade) ? s.grade : null;
        const avgWeight = s.averageWeight ? Number(s.averageWeight) : 60;
        const cash = Number(s.cashPayment || 0);
        const online = Number(s.onlinePayment || 0);
        const party = s.partyName || 'General Wholesale Market';
        const vehicle = s.vehicleNumber || 'Direct Transfer';
        const weight = s.weight ? Number(s.weight) : null;
        const challanNo = String(s.challanNo || '0');
        const cAt = s.createdAt || new Date().toISOString();
        const uAt = s.updatedAt || new Date().toISOString();

        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(id, date, flockId, items, attachment, head, amount, notes, grade, avgWeight, cash, online, party, vehicle, weight, challanNo, cAt, uAt);
      }

      await client.query(`
        INSERT INTO public."Sale" (id, "saleDate", "flockId", "itemsSold", attachment, head, "totalAmount", notes, grade, "averageWeight", "cashPayment", "onlinePayment", "partyName", "vehicleNumber", weight, "challanNo", "createdAt", "updatedAt")
        VALUES ${values.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);
    }

    // Egg Production
    const eggs = backupData.all_egg_productions || [];
    console.log(`Seeding ${eggs.length} Egg Productions...`);

    for (let i = 0; i < eggs.length; i += 200) {
      const chunk = eggs.slice(i, i + 200);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const e of chunk) {
        const id = e.id;
        const date = e.date || e.createdAt || new Date().toISOString();
        const total = Number(e.totalEggs || 0);
        const notes = e.notes || '';
        const avgWeight = Number(e.averageWeight || 60);
        const broken = Number(e.brokenEggs || 0);
        const flockId = Number(e.flockId || 8);
        const rawGrade = (e.grade || 'standard').toLowerCase();
        const grade = validGrades.has(rawGrade) ? rawGrade : 'standard';
        const birds = e.birds ? Number(e.birds) : null;
        const cAt = e.createdAt || new Date().toISOString();
        const uAt = e.updatedAt || new Date().toISOString();

        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(id, date, total, notes, avgWeight, broken, flockId, grade, birds, cAt, uAt);
      }

      await client.query(`
        INSERT INTO public."EggProduction" (id, date, "totalEggs", notes, "averageWeight", "brokenEggs", "flockId", grade, birds, "createdAt", "updatedAt")
        VALUES ${values.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);
    }

    // Stocks
    const stocks = backupData.all_stocks || [];
    console.log(`Seeding ${stocks.length} Stocks...`);
    const validStockHeads = new Set(['FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT']);

    for (let i = 0; i < stocks.length; i += 200) {
      const chunk = stocks.slice(i, i + 200);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const st of chunk) {
        const id = st.id;
        const date = st.date || st.createdAt || new Date().toISOString();
        const type = st.Type || 'Purchase';
        const rawHead = (st.head || 'FEED').toUpperCase();
        const head = validStockHeads.has(rawHead) ? rawHead : 'OTHER';
        const qty = Number(st.quantity || 0);
        const notes = st.notes || '';
        const att = st.attachment || null;
        const paid = st.amountPaid !== undefined && st.amountPaid !== null ? Number(st.amountPaid) : null;
        const pType = st.paymentType || 'Cash';
        const expId = Number(st.expenseId || 0);
        const challan = String(st.challanNo || '0');
        const flockId = Number(st.flockId || 8);
        const cAt = st.createdAt || new Date().toISOString();
        const uAt = st.updatedAt || new Date().toISOString();

        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(id, date, type, head, qty, notes, att, paid, pType, expId, challan, flockId, cAt, uAt);
      }

      await client.query(`
        INSERT INTO public."Stock" (id, date, "Type", head, quantity, notes, attachment, "amountPaid", "paymentType", "expenseId", "challanNo", "flockId", "createdAt", "updatedAt")
        VALUES ${values.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `, params);
    }

    // Salaries
    console.log('Seeding Salaries...');
    const salariesData = [
      { id: 1, employeeName: 'Muhammad Aslam', designation: 'Farm Manager', basicSalary: 85000, salaryAmount: 85000, total: 85000, flockId: 8 },
      { id: 2, employeeName: 'Tariq Mehmood', designation: 'Supervisor Shed 01', basicSalary: 45000, salaryAmount: 45000, total: 45000, flockId: 8 },
      { id: 3, employeeName: 'Rashid Ali', designation: 'Feeder Shed 02', basicSalary: 35000, salaryAmount: 35000, total: 35000, flockId: 9 },
      { id: 4, employeeName: 'Imran Khan', designation: 'Egg Collector', basicSalary: 32000, salaryAmount: 32000, total: 32000, flockId: 9 },
      { id: 5, employeeName: 'Dr. Zafar Iqbal', designation: 'Veterinary Officer', basicSalary: 120000, salaryAmount: 120000, total: 120000, flockId: 10 }
    ];

    for (const sal of salariesData) {
      await client.query(`
        INSERT INTO public."Salary" (id, "employeeName", designation, "basicSalary", "salaryAmount", total, "flockId")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `, [sal.id, sal.employeeName, sal.designation, sal.basicSalary, sal.salaryAmount, sal.total, sal.flockId]);
    }

    // Reset sequences
    console.log('Resetting SERIAL sequences for future auto-increment...');
    for (const t of ['Farm', 'Flock', 'EggProduction', 'Expense', 'Sale', 'Stock', 'Salary', 'BirdHealth', 'DailyConsumption', 'user']) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('public."${t}"', 'id'), COALESCE((SELECT MAX(id) FROM public."${t}"), 1) + 1, false);
      `);
    }

    // Verification queries
    console.log('\n=== Supabase Migration Verification ===');
    for (const t of ['Farm', 'Flock', 'EggProduction', 'Expense', 'Sale', 'Stock', 'Salary']) {
      const res = await client.query(`SELECT COUNT(*) as count FROM public."${t}"`);
      console.log(`Table "${t}": ${res.rows[0].count} records`);
    }

    console.log('\nSUCCESS! Supabase database is completely seeded and ready!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
