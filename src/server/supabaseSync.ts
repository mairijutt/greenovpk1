import { pool } from '../db/index.ts';
import { hashPassword } from './auth.ts';
import { liveConsumptionRecords } from '../data/liveConsumptions.ts';
import { liveMortalityLogs, liveVaccineSchedules } from '../data/liveBirdHealth.ts';
import {
  liveStaffRoster,
  liveAdvanceRecords,
  liveSalaryDisbursals,
} from '../data/liveSalaries.ts';

let initPromise: Promise<void> | null = null;

function flockNameForId(fid: number): string {
  if (fid === 8) return 'Unit 1';
  if (fid === 9) return 'Unit 2';
  if (fid === 10) return 'Unit 3';
  return `Unit ${fid}`;
}

export function flockIdFromInput(flockId?: any, flockName?: string): number {
  const num = Number(flockId);
  if (!isNaN(num) && num > 0) return num;
  if (flockName) {
    const low = flockName.toLowerCase();
    if (low.includes('2')) return 9;
    if (low.includes('3')) return 10;
    if (low.includes('1')) return 8;
  }
  return 8;
}

async function alignSequence(tableName: string) {
  try {
    await pool.query(
      `SELECT setval(pg_get_serial_sequence('public."${tableName}"', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public."${tableName}"), 1), 1), true)`
    );
  } catch (err) {
    console.warn(`Sequence align warning for ${tableName}:`, err);
  }
}

async function hasMeta(key: string): Promise<boolean> {
  const res = await pool.query('SELECT value FROM public."AppMeta" WHERE key = $1 LIMIT 1', [key]);
  return res.rows.length > 0;
}

async function setMeta(key: string, value = '1') {
  await pool.query(
    `INSERT INTO public."AppMeta" (key, value, "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [key, value]
  );
}

async function runInitialization(): Promise<void> {
  // 1. Metadata & Additional Tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public."AppMeta" (
      key text PRIMARY KEY,
      value text NOT NULL,
      "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public."VaccineSchedule" (
      id serial PRIMARY KEY,
      "clientId" text,
      "flockId" integer NOT NULL,
      "flockName" text,
      "vaccineName" text NOT NULL,
      "scheduledWeek" integer,
      "scheduledDate" text,
      "administeredDate" text,
      status text NOT NULL DEFAULT 'Scheduled',
      method text,
      dosage text,
      "batchNumber" text,
      "vetNotes" text,
      "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public."BankAccount" (
      id text PRIMARY KEY,
      "bankName" text NOT NULL,
      "accountTitle" text NOT NULL,
      "accountNumber" text DEFAULT '',
      "openingBalance" double precision NOT NULL DEFAULT 0,
      "openingDate" text,
      notes text DEFAULT '',
      "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public."StaffWorker" (
      id text PRIMARY KEY,
      name text NOT NULL,
      role text NOT NULL,
      "farmAssigned" text,
      "flockId" integer,
      "flockName" text,
      "monthlySalary" double precision NOT NULL DEFAULT 0,
      "advanceBalance" double precision NOT NULL DEFAULT 0,
      phone text,
      status text NOT NULL DEFAULT 'Active',
      "joinedDate" text,
      "checkInTime" text,
      "checkOutTime" text,
      shift text,
      "shiftHours" integer DEFAULT 10,
      "attendanceStatus" text DEFAULT 'Present',
      notes text,
      "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Non-destructive schema extensions on existing production tables
  await pool.query(`
    ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "farmAssigned" text DEFAULT 'All Farm Complexes';
    ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "lastLogin" text;

    ALTER TABLE public."Flock" ADD COLUMN IF NOT EXISTS "ageWeeks" integer;
    ALTER TABLE public."Flock" ADD COLUMN IF NOT EXISTS "shedNumber" text;

    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 50000;
    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS "currentBirds" integer DEFAULT 0;
    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS "shedsCount" integer DEFAULT 1;
    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS manager text DEFAULT 'Farm Supervisor';
    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS temperature double precision DEFAULT 25;
    ALTER TABLE public."Farm" ADD COLUMN IF NOT EXISTS humidity double precision DEFAULT 56;

    ALTER TABLE public."EggProduction" ADD COLUMN IF NOT EXISTS cartons integer;
    ALTER TABLE public."EggProduction" ADD COLUMN IF NOT EXISTS trays integer;
    ALTER TABLE public."EggProduction" ADD COLUMN IF NOT EXISTS eggs integer;
    ALTER TABLE public."EggProduction" ADD COLUMN IF NOT EXISTS "morningEggs" integer;
    ALTER TABLE public."EggProduction" ADD COLUMN IF NOT EXISTS "eveningEggs" integer;

    ALTER TABLE public."Expense" ADD COLUMN IF NOT EXISTS "clientId" text;

    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS "clientId" text;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS rate double precision;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS "bankId" text;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS "bankName" text;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS "paymentMethod" text;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS cartons integer;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS trays integer;
    ALTER TABLE public."Sale" ADD COLUMN IF NOT EXISTS "looseEggs" integer;

    ALTER TABLE public."Stock" ADD COLUMN IF NOT EXISTS "clientId" text;

    ALTER TABLE public."BirdHealth" ADD COLUMN IF NOT EXISTS "clientId" text;
    ALTER TABLE public."BirdHealth" ADD COLUMN IF NOT EXISTS cause text;
    ALTER TABLE public."BirdHealth" ADD COLUMN IF NOT EXISTS symptoms text;
    ALTER TABLE public."BirdHealth" ADD COLUMN IF NOT EXISTS "recordedBy" text;

    ALTER TABLE public."DailyConsumption" ADD COLUMN IF NOT EXISTS "clientId" text;
    ALTER TABLE public."DailyConsumption" ADD COLUMN IF NOT EXISTS bags integer;
    ALTER TABLE public."DailyConsumption" ADD COLUMN IF NOT EXISTS "gramsPerBird" double precision;
    ALTER TABLE public."DailyConsumption" ADD COLUMN IF NOT EXISTS "challanNo" text;

    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "clientId" text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "recordType" text DEFAULT 'salary';
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS date text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS month text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "challanNo" text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "paymentMode" text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "bankName" text;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS deduction double precision DEFAULT 0;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "remainingBalance" double precision DEFAULT 0;
    ALTER TABLE public."Salary" ADD COLUMN IF NOT EXISTS "repaymentStatus" text;
  `);

  // 3. Align sequences across all serial tables
  await Promise.all([
    alignSequence('Farm'),
    alignSequence('Flock'),
    alignSequence('EggProduction'),
    alignSequence('Expense'),
    alignSequence('Sale'),
    alignSequence('Stock'),
    alignSequence('Salary'),
    alignSequence('BirdHealth'),
    alignSequence('DailyConsumption'),
    alignSequence('VaccineSchedule'),
    alignSequence('user'),
  ]);

  // 4. One-Time Idempotent Seeding (only when empty & not previously seeded)
  // 4a. Users
  if (!(await hasMeta('users_seeded_v1'))) {
    const userCntRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."user"');
    if (userCntRes.rows[0].cnt === 0) {
      const initialUsers = [
        { name: 'Ahsan Nawaz', email: 'aaglobal500@gmail.com', role: 'super_admin', farmAssigned: 'All Farm Complexes', pass: 'GreenovaAdmin@2026', verified: true },
        { name: 'Farm Director (Admin)', email: 'admin@greenovapk.com', role: 'admin', farmAssigned: 'All Farm Complexes', pass: 'Greenova@2026', verified: true },
        { name: 'Dr. Tariq (Chief Vet)', email: 'vet.tariq@greenovapk.com', role: 'veterinarian', farmAssigned: 'Unit 1 & Unit 2', pass: 'Greenova@2026', verified: true },
        { name: 'Mustafa (Shed In-charge)', email: 'mustafa@greenovapk.com', role: 'supervisor', farmAssigned: 'GreenOva Unit 2', pass: 'Greenova@2026', verified: true },
        { name: 'Sadam (Shift Lead)', email: 'sadam@greenovapk.com', role: 'supervisor', farmAssigned: 'GreenOva Unit 3', pass: 'Greenova@2026', verified: true },
        { name: 'Farooq (Accounts Officer)', email: 'accounts@greenovapk.com', role: 'accountant', farmAssigned: 'Head Office', pass: 'Greenova@2026', verified: true },
        { name: 'Rana Adeel', email: 'adeelrana981@gmail.com', role: 'admin', farmAssigned: 'All Farm Complexes', pass: 'Greenova@2026', verified: true },
        { name: 'Midhat Fatima', email: 'midhatfatima2004@gmail.com', role: 'admin', farmAssigned: 'All Farm Complexes', pass: 'Greenova@2026', verified: true },
      ];
      for (const u of initialUsers) {
        await pool.query(
          `INSERT INTO public."user" (name, email, password, status, role, "isEmailVerified", "farmAssigned", "lastLogin", "createdAt")
           VALUES ($1, $2, $3, 'allowed'::"UserStatus", $4, $5, $6, 'Ready', NOW())`,
          [u.name, u.email, hashPassword(u.pass), u.role, u.verified, u.farmAssigned]
        );
      }
    }
    await setMeta('users_seeded_v1');
  }

  // 4b. DailyConsumption (including Unit 3 Mar–Oct 2026 + Unit 1 & Unit 2 baseline)
  if (!(await hasMeta('consumptions_seeded_v1'))) {
    const cntRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."DailyConsumption"');
    if (cntRes.rows[0].cnt === 0) {
      for (const c of liveConsumptionRecords) {
        const fid = flockIdFromInput(c.flockId, c.flockName);
        const bags = Number(c.bags ?? Math.round((Number(c.feedQuantityKg) || 0) / 50));
        const feedKg = Number(c.feedQuantityKg || bags * 50);
        await pool.query(
          `INSERT INTO public."DailyConsumption" ("clientId", date, "flockId", "feedQuantity", "waterIntake", "feedType", notes, bags, "gramsPerBird", "challanNo", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            c.id,
            c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
            fid,
            feedKg,
            Number(c.waterIntakeLiters || 0),
            c.feedType || 'Layer Feed 13',
            c.notes || '',
            bags,
            Number(c.gramsPerBird || 0),
            c.challanNo || '',
          ]
        );
      }
      await alignSequence('DailyConsumption');
    }
    await setMeta('consumptions_seeded_v1');
  }

  // 4c. BirdHealth mortality logs
  if (!(await hasMeta('bird_health_seeded_v1'))) {
    const cntRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."BirdHealth"');
    if (cntRes.rows[0].cnt === 0) {
      for (const m of liveMortalityLogs) {
        const fid = flockIdFromInput(m.flockId, m.flockName);
        await pool.query(
          `INSERT INTO public."BirdHealth" ("clientId", date, "flockId", "openingBirds", mortality, cull, notes, cause, symptoms, "recordedBy", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, NOW(), NOW())`,
          [
            m.id,
            m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
            fid,
            fid === 8 ? 24786 : fid === 9 ? 31739 : 25189,
            Number(m.count || 0),
            m.symptoms || m.cause || '',
            m.cause || 'Daily Mortality',
            m.symptoms || '',
            m.recordedBy || 'Farm Admin',
          ]
        );
      }
      await alignSequence('BirdHealth');
    }
    await setMeta('bird_health_seeded_v1');
  }

  // Ensure BirdHealth logs stay reconciled with authoritative Flock.mortality values on startup
  await reconcileAllFlocksBirdHealth();

  // 4d. VaccineSchedule
  if (!(await hasMeta('vaccines_seeded_v1'))) {
    const cntRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."VaccineSchedule"');
    if (cntRes.rows[0].cnt === 0) {
      for (const v of liveVaccineSchedules) {
        const fid = flockIdFromInput(v.flockId, v.flockName);
        await pool.query(
          `INSERT INTO public."VaccineSchedule" ("clientId", "flockId", "flockName", "vaccineName", "scheduledWeek", "scheduledDate", "administeredDate", status, method, dosage, "batchNumber", "vetNotes", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
          [
            v.id,
            fid,
            v.flockName || flockNameForId(fid),
            v.vaccineName,
            Number(v.scheduledWeek || 0),
            v.scheduledDate || null,
            v.administeredDate || null,
            v.status || 'Scheduled',
            v.method || 'Drinking Water',
            v.dosage || '',
            v.batchNumber || '',
            v.vetNotes || '',
          ]
        );
      }
      await alignSequence('VaccineSchedule');
    }
    await setMeta('vaccines_seeded_v1');
  }

  // 4e. StaffWorker
  if (!(await hasMeta('workers_seeded_v1'))) {
    const cntRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."StaffWorker"');
    if (cntRes.rows[0].cnt === 0) {
      for (const w of liveStaffRoster) {
        const fid = flockIdFromInput(w.flockId, w.flockName);
        await pool.query(
          `INSERT INTO public."StaffWorker" (id, name, role, "farmAssigned", "flockId", "flockName", "monthlySalary", "advanceBalance", phone, status, "joinedDate", "checkInTime", "checkOutTime", shift, "shiftHours", "attendanceStatus", notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (id) DO NOTHING`,
          [
            w.id,
            w.name,
            w.role,
            w.farmAssigned || '',
            fid,
            w.flockName || flockNameForId(fid),
            Number(w.monthlySalary || 0),
            Number(w.advanceBalance || 0),
            w.phone || '',
            w.status || 'Active',
            w.joinedDate || '',
            w.checkInTime || '',
            w.checkOutTime || '',
            w.shift || 'Morning Shift (07:00 - 17:00)',
            Number(w.shiftHours || 10),
            w.attendanceStatus || 'Present',
            w.notes || '',
          ]
        );
      }
    }
    await setMeta('workers_seeded_v1');
  }

  // 4f. Salary Disbursals & Advance Records
  if (!(await hasMeta('salaries_seeded_v1'))) {
    const existingRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM public."Salary" WHERE "clientId" IS NOT NULL');
    if (existingRes.rows[0].cnt === 0) {
      for (const s of liveSalaryDisbursals) {
        const fid = flockIdFromInput(s.flockId, s.flockName);
        await pool.query(
          `INSERT INTO public."Salary" ("clientId", "recordType", "employeeName", designation, "basicSalary", "salaryAmount", advance, deduction, total, remarks, "flockId", date, month, "challanNo", "paymentMode", "repaymentStatus", "createdAt", "updatedAt")
           VALUES ($1, 'salary_disbursal', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
          [
            s.id,
            s.employeeName,
            s.designation || 'Farm Staff',
            Number(s.basicSalary || 0),
            Number(s.netSalaryPaid || 0),
            Number(s.advanceDeducted || 0),
            Number(s.penaltyDeduction || 0),
            Number(s.totalSalary || s.netSalaryPaid || 0),
            s.remarks || '',
            fid,
            s.paymentDate || '',
            s.month || '',
            s.challanNo || '',
            s.paymentMethod || 'Cash',
            s.status || 'Paid',
          ]
        );
      }
      for (const a of liveAdvanceRecords) {
        const fid = flockIdFromInput(a.flockId, a.flockName);
        await pool.query(
          `INSERT INTO public."Salary" ("clientId", "recordType", "employeeName", designation, "basicSalary", "salaryAmount", advance, deduction, "remainingBalance", total, remarks, "flockId", date, "challanNo", "repaymentStatus", "createdAt", "updatedAt")
           VALUES ($1, 'advance', $2, $3, 0, 0, $4, $5, $6, $4, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            a.id,
            a.employeeName,
            a.designation || 'Farm Staff',
            Number(a.advanceAmount || 0),
            Number(a.deductedAmount || 0),
            Number(a.remainingBalance || 0),
            a.remarks || '',
            fid,
            a.date || '',
            a.challanNo || '',
            a.repaymentStatus || 'Pending',
          ]
        );
      }
      await alignSequence('Salary');
    }
    await setMeta('salaries_seeded_v1');
  }
}

export async function ensureDbInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = runInitialization().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// ==========================================
// FLOCKS
// ==========================================
export async function fetchAllFlocks() {
  const res = await pool.query('SELECT * FROM public."Flock" ORDER BY id ASC');
  return res.rows.map((r: any) => {
    const defaultMort = r.id === 8 ? 5 : r.id === 9 ? 7 : r.id === 10 ? 3 : 0;
    const defaultAge = r.id === 8 ? 42 : r.id === 9 ? 36 : r.id === 10 ? 30 : 20;
    const defaultShed = r.id === 8 ? 'Shed 1' : r.id === 9 ? 'Shed 2' : r.id === 10 ? 'Shed 3' : `Shed ${r.id}`;
    return {
      id: r.id,
      farmId: r.farmId,
      flockName: r.flockName,
      breed: r.breed,
      shedNumber: r.shedNumber || defaultShed,
      totalBirds: Number(r.totalBirds ?? 0),
      originalTotalBirds: Number(r.originalTotalBirds ?? r.totalBirds ?? 0),
      cost: Number(r.cost || 0),
      isActive: r.isActive !== false,
      ageWeeks: Number(r.ageWeeks ?? defaultAge),
      ageInWeeks: Number(r.ageWeeks ?? defaultAge),
      mortality: r.mortality !== null && r.mortality !== undefined ? Number(r.mortality) : defaultMort,
      acquiredDate: r.acquiredDate ? new Date(r.acquiredDate).toISOString() : new Date().toISOString(),
      exitDate: r.exitDate ? new Date(r.exitDate).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
      notes: r.notes || '',
      farm: { id: r.farmId || 9, name: 'GreenOva', code: 'GVF2025', location: 'Multan, Punjab' },
    };
  });
}

export async function upsertFlock(flock: any, explicitId?: number) {
  const id = explicitId ?? (Number(flock.id) > 0 ? Number(flock.id) : undefined);

  if (id) {
    const prevRes = await pool.query('SELECT * FROM public."Flock" WHERE id = $1 LIMIT 1', [id]);
    const prev = prevRes.rows[0] || {};
    const acquired =
      flock.acquiredDate ?? flock.startDate ?? prev.acquiredDate ?? new Date().toISOString();
    const totalBirds = Number(flock.totalBirds ?? flock.currentCount ?? prev.totalBirds ?? 0);
    const originalBirds = Number(
      flock.originalTotalBirds ?? flock.initialCount ?? prev.originalTotalBirds ?? totalBirds
    );
    const ageWeeks = Number(flock.ageWeeks ?? flock.ageInWeeks ?? prev.ageWeeks ?? 20);
    const isActive =
      flock.isActive !== undefined
        ? Boolean(flock.isActive)
        : flock.status
        ? flock.status === 'Active'
        : prev.isActive !== undefined
        ? prev.isActive
        : true;

    const res = await pool.query(
      `INSERT INTO public."Flock" (id, "farmId", mortality, notes, "isActive", "acquiredDate", breed, "flockName", "totalBirds", "originalTotalBirds", cost, "ageWeeks", "shedNumber", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         "farmId" = COALESCE(NULLIF($2, 0), public."Flock"."farmId"),
         mortality = $3,
         notes = $4,
         "isActive" = $5,
         "acquiredDate" = $6,
         breed = $7,
         "flockName" = $8,
         "totalBirds" = $9,
         "originalTotalBirds" = $10,
         cost = $11,
         "ageWeeks" = $12,
         "shedNumber" = COALESCE($13, public."Flock"."shedNumber"),
         "updatedAt" = NOW()
       RETURNING *`,
      [
        id,
        Number(flock.farmId ?? prev.farmId ?? 9),
        Number(flock.mortality ?? prev.mortality ?? 0),
        flock.notes ?? prev.notes ?? '',
        isActive,
        new Date(acquired).toISOString(),
        flock.breed ?? prev.breed ?? 'LSL',
        flock.flockName ?? flock.name ?? prev.flockName ?? `Unit ${id}`,
        totalBirds,
        originalBirds,
        Number(flock.cost ?? prev.cost ?? 7500000),
        ageWeeks,
        flock.shedNumber ?? prev.shedNumber ?? null,
      ]
    );
    await alignSequence('Flock');
    return res.rows[0];
  } else {
    const acquired = flock.acquiredDate || flock.startDate || new Date().toISOString();
    const totalBirds = Number(flock.totalBirds ?? flock.currentCount ?? 0);
    const originalBirds = Number(flock.originalTotalBirds ?? flock.initialCount ?? totalBirds);
    const ageWeeks = Number(flock.ageWeeks ?? flock.ageInWeeks ?? 20);
    const isActive =
      flock.isActive !== undefined ? Boolean(flock.isActive) : flock.status ? flock.status === 'Active' : true;
    const res = await pool.query(
      `INSERT INTO public."Flock" ("farmId", mortality, notes, "isActive", "acquiredDate", breed, "flockName", "totalBirds", "originalTotalBirds", cost, "ageWeeks", "shedNumber", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        Number(flock.farmId || 9),
        Number(flock.mortality || 0),
        flock.notes || '',
        isActive,
        new Date(acquired).toISOString(),
        flock.breed || 'LSL',
        flock.flockName || flock.name || 'New Unit',
        totalBirds,
        originalBirds,
        Number(flock.cost || 7500000),
        ageWeeks,
        flock.shedNumber || null,
      ]
    );
    return res.rows[0];
  }
}

export async function deleteFlock(id: number) {
  await pool.query('DELETE FROM public."Flock" WHERE id = $1', [id]);
}

// ==========================================
// FARMS
// ==========================================
export async function fetchAllFarms() {
  const res = await pool.query('SELECT * FROM public."Farm" ORDER BY id DESC');
  return res.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    location: r.location || 'Multan, Punjab',
    description: r.description || '',
    capacity: Number(r.capacity ?? 50000),
    currentBirds: Number(r.currentBirds ?? 0),
    shedsCount: Number(r.shedsCount ?? 1),
    manager: r.manager || 'Farm Supervisor',
    temperature: Number(r.temperature ?? 25),
    humidity: Number(r.humidity ?? 56),
    active: r.active !== false,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
  }));
}

export async function upsertFarm(farm: any, explicitId?: number) {
  const id = explicitId ?? (Number(farm.id) > 0 ? Number(farm.id) : undefined);
  if (id) {
    const prevRes = await pool.query('SELECT * FROM public."Farm" WHERE id = $1 LIMIT 1', [id]);
    const prev = prevRes.rows[0] || {};
    const merged = { ...prev, ...farm };
    const res = await pool.query(
      `INSERT INTO public."Farm" (id, name, code, location, description, active, capacity, "currentBirds", "shedsCount", manager, temperature, humidity, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         location = EXCLUDED.location,
         description = EXCLUDED.description,
         active = EXCLUDED.active,
         capacity = EXCLUDED.capacity,
         "currentBirds" = EXCLUDED."currentBirds",
         "shedsCount" = EXCLUDED."shedsCount",
         manager = EXCLUDED.manager,
         temperature = EXCLUDED.temperature,
         humidity = EXCLUDED.humidity,
         "updatedAt" = NOW()
       RETURNING *`,
      [
        id,
        merged.name || 'GreenOva Farm',
        merged.code || `GVF-${id}`,
        merged.location || 'Punjab, Pakistan',
        merged.description || '',
        merged.active !== false,
        Number(merged.capacity ?? 50000),
        Number(merged.currentBirds ?? 0),
        Number(merged.shedsCount ?? 1),
        merged.manager || 'Farm Supervisor',
        Number(merged.temperature ?? 25),
        Number(merged.humidity ?? 56),
      ]
    );
    await alignSequence('Farm');
    return res.rows[0];
  } else {
    const code = farm.code || `GVF-${Date.now().toString().slice(-4)}`;
    const res = await pool.query(
      `INSERT INTO public."Farm" (name, code, location, description, active, capacity, "currentBirds", "shedsCount", manager, temperature, humidity, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        farm.name || 'New Farm Facility',
        code,
        farm.location || 'Punjab, Pakistan',
        farm.description || '',
        farm.active !== false,
        Number(farm.capacity ?? 50000),
        Number(farm.currentBirds ?? 0),
        Number(farm.shedsCount ?? 1),
        farm.manager || 'Farm Supervisor',
        Number(farm.temperature ?? 25),
        Number(farm.humidity ?? 56),
      ]
    );
    return res.rows[0];
  }
}

export async function deleteFarm(id: number) {
  await pool.query('DELETE FROM public."Farm" WHERE id = $1', [id]);
}

// ==========================================
// EGG PRODUCTION
// ==========================================
export async function fetchAllEggProductions() {
  const res = await pool.query('SELECT * FROM public."EggProduction" ORDER BY date DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const totalEggs = Number(r.totalEggs || 0);
    const brokenEggs = Number(r.brokenEggs || 0);
    const trays = r.trays !== null && r.trays !== undefined ? Number(r.trays) : Math.floor(totalEggs / 30);
    const cartons = r.cartons !== null && r.cartons !== undefined ? Number(r.cartons) : Math.floor(totalEggs / 360);
    const birds = Number(r.birds || (fid === 8 ? 24786 : fid === 9 ? 31739 : 25189));
    return {
      id: r.id,
      date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      totalEggs,
      brokenEggs,
      damagedEggs: brokenEggs,
      cleanTrays: trays,
      trays,
      cartons,
      looseEggs: r.eggs !== null && r.eggs !== undefined ? Number(r.eggs) : totalEggs % 30,
      morningEggs: r.morningEggs !== null && r.morningEggs !== undefined ? Number(r.morningEggs) : Math.round(totalEggs * 0.55),
      eveningEggs: r.eveningEggs !== null && r.eveningEggs !== undefined ? Number(r.eveningEggs) : Math.max(0, totalEggs - Math.round(totalEggs * 0.55)),
      averageWeight: Number(r.averageWeight || 60),
      avgWeightGrams: Number(r.averageWeight || 60),
      flockId: fid,
      grade: r.grade || 'standard',
      eggGrade: r.grade || 'standard',
      birds,
      notes: r.notes || '',
      flock: { id: fid, flockName: flockNameForId(fid) },
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    };
  });
}

export async function upsertEggProduction(prod: any, explicitId?: number) {
  const validGrades = new Set(['started', 'medium', 'standard', 'jumbo']);
  const id = explicitId ?? (Number(prod.id) > 0 ? Number(prod.id) : undefined);
  let prev: any = {};
  if (id) {
    const prevRes = await pool.query('SELECT * FROM public."EggProduction" WHERE id = $1 LIMIT 1', [id]);
    prev = prevRes.rows[0] || {};
  }
  const merged = { ...prev, ...prod };
  const rawGrade = String(merged.grade || merged.eggGrade || 'standard').toLowerCase();
  const grade = validGrades.has(rawGrade) ? rawGrade : 'standard';
  const fid = flockIdFromInput(merged.flockId, merged.flockName);
  const totalEggs = Number(
    prod.totalEggs !== undefined || prod.cartons !== undefined || prod.trays !== undefined || prod.cleanTrays !== undefined || prod.eggs !== undefined || prod.looseEggs !== undefined
      ? (prod.totalEggs ?? (Number(prod.cartons ?? prev.cartons ?? 0) * 360 + Number(prod.trays ?? prod.cleanTrays ?? prev.trays ?? 0) * 30 + Number(prod.eggs ?? prod.looseEggs ?? prev.eggs ?? 0)))
      : (prev.totalEggs ?? 0)
  );
  const brokenEggs = Number(prod.brokenEggs ?? prod.damagedEggs ?? prev.brokenEggs ?? 0);
  const avgWeight = Math.round(Number(prod.averageWeight ?? prod.avgWeightGrams ?? prev.averageWeight ?? 60));
  const dateIso = merged.date ? new Date(merged.date).toISOString() : new Date().toISOString();
  const cartons = prod.cartons !== undefined ? Number(prod.cartons) : prev.cartons !== undefined && prod.totalEggs === undefined ? Number(prev.cartons) : Math.floor(totalEggs / 360);
  const trays = prod.trays !== undefined ? Number(prod.trays) : prod.cleanTrays !== undefined ? Number(prod.cleanTrays) : prev.trays !== undefined && prod.totalEggs === undefined ? Number(prev.trays) : Math.floor((totalEggs % 360) / 30);
  const looseEggs = prod.eggs !== undefined ? Number(prod.eggs) : prod.looseEggs !== undefined ? Number(prod.looseEggs) : prev.eggs !== undefined && prod.totalEggs === undefined ? Number(prev.eggs) : totalEggs % 30;
  const morningEggs = prod.morningEggs !== undefined ? Number(prod.morningEggs) : prev.morningEggs !== undefined && prod.totalEggs === undefined ? Number(prev.morningEggs) : Math.round(totalEggs * 0.55);
  const eveningEggs = prod.eveningEggs !== undefined ? Number(prod.eveningEggs) : prev.eveningEggs !== undefined && prod.totalEggs === undefined ? Number(prev.eveningEggs) : Math.max(0, totalEggs - morningEggs);

  if (id) {
    const res = await pool.query(
      `INSERT INTO public."EggProduction" (id, date, "totalEggs", notes, "averageWeight", "brokenEggs", "flockId", grade, birds, cartons, trays, eggs, "morningEggs", "eveningEggs", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::"EGG_GRADE",$9,$10,$11,$12,$13,$14,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         "totalEggs" = EXCLUDED."totalEggs",
         "brokenEggs" = EXCLUDED."brokenEggs",
         "averageWeight" = EXCLUDED."averageWeight",
         "flockId" = EXCLUDED."flockId",
         grade = EXCLUDED.grade,
         birds = COALESCE(EXCLUDED.birds, public."EggProduction".birds),
         notes = EXCLUDED.notes,
         cartons = EXCLUDED.cartons,
         trays = EXCLUDED.trays,
         eggs = EXCLUDED.eggs,
         "morningEggs" = EXCLUDED."morningEggs",
         "eveningEggs" = EXCLUDED."eveningEggs",
         "updatedAt" = NOW()
       RETURNING *`,
      [id, dateIso, totalEggs, merged.notes || '', avgWeight, brokenEggs, fid, grade, merged.birds ? Number(merged.birds) : null, cartons, trays, looseEggs, morningEggs, eveningEggs]
    );
    await alignSequence('EggProduction');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."EggProduction" (date, "totalEggs", notes, "averageWeight", "brokenEggs", "flockId", grade, birds, cartons, trays, eggs, "morningEggs", "eveningEggs", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7::"EGG_GRADE",$8,$9,$10,$11,$12,$13,NOW(),NOW())
       RETURNING *`,
      [dateIso, totalEggs, prod.notes || '', avgWeight, brokenEggs, fid, grade, prod.birds ? Number(prod.birds) : null, cartons, trays, looseEggs, morningEggs, eveningEggs]
    );
    return res.rows[0];
  }
}

export async function deleteEggProduction(id: number) {
  await pool.query('DELETE FROM public."EggProduction" WHERE id = $1', [id]);
}

// ==========================================
// EXPENSES
// ==========================================
const VALID_EXPENSE_HEADS = new Set([
  'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP',
  'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE',
  'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT',
  'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS',
  'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT',
]);

function normalizeExpenseHead(raw?: string): string {
  const clean = String(raw || 'OTHER').toUpperCase().trim().replace(/\s+/g, '_');
  if (VALID_EXPENSE_HEADS.has(clean)) return clean;
  return 'OTHER';
}

export async function fetchAllExpenses() {
  const res = await pool.query('SELECT * FROM public."Expense" ORDER BY expense_date DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const dIso = r.expense_date ? new Date(r.expense_date).toISOString() : new Date().toISOString();
    return {
      id: r.id,
      clientId: r.clientId || undefined,
      expenseDate: dIso,
      date: dIso,
      expenseCost: Number(r.expense_cost || 0),
      amount: Number(r.expense_cost || 0),
      head: r.head,
      category: r.head,
      notes: r.notes || '',
      description: r.notes || r.head,
      attachment: r.attachment || null,
      challanNo: r.challanNo || '0',
      flockId: fid,
      flock: { id: fid, flockName: flockNameForId(fid) },
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : dIso,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : dIso,
    };
  });
}

export async function upsertExpense(exp: any, explicitId?: number | string) {
  const clientId = exp.clientId || (typeof exp.id === 'string' && isNaN(Number(exp.id)) ? exp.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(exp.trackingId || exp.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."Expense" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."Expense" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const head = normalizeExpenseHead(exp.head || exp.expenseHead || exp.category || prev.head);
  const fid = flockIdFromInput(exp.flockId ?? prev.flockId, exp.flockName);
  const cost = Number(exp.expenseCost ?? exp.amount ?? exp.cost ?? prev.expense_cost ?? 0);
  const rawDate = exp.expenseDate ?? exp.date ?? prev.expense_date;
  const dateIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
  const notes = exp.notes ?? exp.description ?? prev.notes ?? '';
  const challanNo = String(exp.challanNo ?? exp.referenceNo ?? prev.challanNo ?? '0');

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."Expense" (id, expense_date, expense_cost, head, notes, attachment, "challanNo", "flockId", "clientId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4::"ExpenseHead",$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         expense_date = EXCLUDED.expense_date,
         expense_cost = EXCLUDED.expense_cost,
         head = EXCLUDED.head,
         notes = EXCLUDED.notes,
         attachment = COALESCE(EXCLUDED.attachment, public."Expense".attachment),
         "challanNo" = EXCLUDED."challanNo",
         "flockId" = EXCLUDED."flockId",
         "clientId" = COALESCE(EXCLUDED."clientId", public."Expense"."clientId"),
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, dateIso, cost, head, notes, exp.attachment || null, challanNo, fid, clientId || prev.clientId || null]
    );
    await alignSequence('Expense');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."Expense" (expense_date, expense_cost, head, notes, attachment, "challanNo", "flockId", "clientId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3::"ExpenseHead",$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [dateIso, cost, head, notes, exp.attachment || null, challanNo, fid, clientId]
    );
    return res.rows[0];
  }
}

export async function deleteExpense(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."Expense" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."Expense" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// SALES
// ==========================================
function normalizeSaleHeadForDb(raw?: string): string {
  const s = String(raw || 'EGG').trim();
  if (s === 'Feed BAGS' || s === 'Feed_BAG' || s === 'Feed_BAGS') return 'Feed_BAGS';
  if (s === 'Cull Birds' || s === 'Chicken') return 'Chicken';
  if (s === 'Manure') return 'Manure';
  if (s === 'EGG' || s === 'Eggs') return 'EGG';
  if (s === 'OTHER') return 'OTHER';
  return 'EGG';
}

function normalizeSaleHeadForUi(dbHead?: string): string {
  if (dbHead === 'Feed_BAGS') return 'Feed BAGS';
  return dbHead || 'EGG';
}

export async function fetchAllSales() {
  const res = await pool.query('SELECT * FROM public."Sale" ORDER BY "saleDate" DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const dIso = r.saleDate ? new Date(r.saleDate).toISOString() : new Date().toISOString();
    const qty = Number(r.itemsSold || 0);
    const totalAmount = Number(r.totalAmount || 0);
    const rate = r.rate !== null && r.rate !== undefined ? Number(r.rate) : (qty > 0 ? Number((totalAmount / qty).toFixed(2)) : 0);
    const uiHead = normalizeSaleHeadForUi(r.head);
    return {
      id: r.id,
      clientId: r.clientId || undefined,
      saleDate: dIso,
      date: dIso,
      flockId: fid,
      flock: { id: fid, flockName: flockNameForId(fid) },
      itemsSold: qty,
      quantity: qty,
      unitPrice: rate,
      rate,
      attachment: r.attachment || null,
      head: uiHead,
      category: uiHead,
      totalAmount,
      amount: totalAmount,
      notes: r.notes || '',
      description: r.notes || `${uiHead} Sale`,
      grade: r.grade || 'standard',
      averageWeight: Number(r.averageWeight || 60),
      cashPayment: Number(r.cashPayment || 0),
      onlinePayment: Number(r.onlinePayment || 0),
      partyName: r.partyName || 'Market',
      vehicleNumber: r.vehicleNumber || 'Direct',
      weight: r.weight,
      challanNo: r.challanNo || '0',
      bankId: r.bankId || undefined,
      bankName: r.bankName || undefined,
      paymentMethod: r.paymentMethod || undefined,
      cartons: r.cartons ?? undefined,
      trays: r.trays ?? undefined,
      looseEggs: r.looseEggs ?? undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : dIso,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : dIso,
    };
  });
}

export async function upsertSale(sale: any, explicitId?: number | string) {
  const clientId = sale.clientId || (typeof sale.id === 'string' && isNaN(Number(sale.id)) ? sale.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(sale.trackingId || sale.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."Sale" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."Sale" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const head = normalizeSaleHeadForDb(sale.head || sale.saleHead || sale.category || prev.head);
  const fid = flockIdFromInput(sale.flockId ?? prev.flockId, sale.flockName);
  const itemsSold = Math.round(Number(sale.itemsSold ?? sale.quantity ?? prev.itemsSold ?? 0));
  const totalAmount = Number(sale.totalAmount ?? sale.amount ?? prev.totalAmount ?? 0);
  const rate = sale.rate !== undefined ? Number(sale.rate) : sale.unitPrice !== undefined ? Number(sale.unitPrice) : prev.rate !== undefined && prev.rate !== null ? Number(prev.rate) : (itemsSold > 0 ? Number((totalAmount / itemsSold).toFixed(2)) : 0);
  const cashPayment = Math.round(Number(sale.cashPayment ?? prev.cashPayment ?? 0));
  const onlinePayment = Math.round(Number(sale.onlinePayment ?? (sale.totalAmount !== undefined || sale.amount !== undefined || sale.cashPayment !== undefined ? (totalAmount - cashPayment) : prev.onlinePayment ?? (totalAmount - cashPayment))));
  const rawDate = sale.saleDate ?? sale.date ?? prev.saleDate;
  const dateIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
  const notes = sale.notes ?? sale.description ?? prev.notes ?? '';
  const partyName = sale.partyName ?? prev.partyName ?? 'Market';
  const vehicleNumber = sale.vehicleNumber ?? prev.vehicleNumber ?? 'Direct';
  const challanNo = String(sale.challanNo ?? sale.referenceNo ?? prev.challanNo ?? '0');

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."Sale" (id, "saleDate", "flockId", "itemsSold", attachment, head, "totalAmount", notes, "cashPayment", "onlinePayment", "partyName", "vehicleNumber", "challanNo", "clientId", rate, "bankId", "bankName", "paymentMethod", cartons, trays, "looseEggs", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6::"Sale_Head",$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         "saleDate" = EXCLUDED."saleDate",
         "flockId" = EXCLUDED."flockId",
         "itemsSold" = EXCLUDED."itemsSold",
         attachment = COALESCE(EXCLUDED.attachment, public."Sale".attachment),
         head = EXCLUDED.head,
         "totalAmount" = EXCLUDED."totalAmount",
         notes = EXCLUDED.notes,
         "cashPayment" = EXCLUDED."cashPayment",
         "onlinePayment" = EXCLUDED."onlinePayment",
         "partyName" = EXCLUDED."partyName",
         "vehicleNumber" = EXCLUDED."vehicleNumber",
         "challanNo" = EXCLUDED."challanNo",
         "clientId" = COALESCE(EXCLUDED."clientId", public."Sale"."clientId"),
         rate = EXCLUDED.rate,
         "bankId" = EXCLUDED."bankId",
         "bankName" = EXCLUDED."bankName",
         "paymentMethod" = EXCLUDED."paymentMethod",
         cartons = EXCLUDED.cartons,
         trays = EXCLUDED.trays,
         "looseEggs" = EXCLUDED."looseEggs",
         "updatedAt" = NOW()
       RETURNING *`,
      [
        targetId, dateIso, fid, itemsSold, sale.attachment || null, head, totalAmount, notes,
        cashPayment, onlinePayment, partyName, vehicleNumber, challanNo, clientId || prev.clientId || null,
        rate, sale.bankId ?? prev.bankId ?? null, sale.bankName ?? prev.bankName ?? null, sale.paymentMethod ?? prev.paymentMethod ?? null,
        sale.cartons ?? prev.cartons ?? null, sale.trays ?? prev.trays ?? null, sale.looseEggs ?? prev.looseEggs ?? null,
      ]
    );
    await alignSequence('Sale');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."Sale" ("saleDate", "flockId", "itemsSold", attachment, head, "totalAmount", notes, "cashPayment", "onlinePayment", "partyName", "vehicleNumber", "challanNo", "clientId", rate, "bankId", "bankName", "paymentMethod", cartons, trays, "looseEggs", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5::"Sale_Head",$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW())
       RETURNING *`,
      [
        dateIso, fid, itemsSold, sale.attachment || null, head, totalAmount, notes,
        cashPayment, onlinePayment, partyName, vehicleNumber, challanNo, clientId,
        rate, sale.bankId || null, sale.bankName || null, sale.paymentMethod || null,
        sale.cartons ?? null, sale.trays ?? null, sale.looseEggs ?? null,
      ]
    );
    return res.rows[0];
  }
}

export async function deleteSale(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."Sale" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."Sale" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// STOCKS
// ==========================================
const VALID_STOCK_HEADS = new Set(['FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT']);

export async function fetchAllStocks() {
  const res = await pool.query('SELECT * FROM public."Stock" ORDER BY date DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const qty = Number(r.quantity || 0);
    const amt = r.amountPaid !== null && r.amountPaid !== undefined ? Number(r.amountPaid) : 0;
    const dIso = r.date ? new Date(r.date).toISOString() : new Date().toISOString();
    return {
      id: r.id,
      clientId: r.clientId || undefined,
      trackingId: r.id,
      date: dIso,
      rawDate: dIso.slice(0, 10),
      Type: r.Type || '13',
      type: r.Type || '13',
      feedType: r.head === 'FEED' ? `Layer Feed ${r.Type || '13'}` : r.Type || r.head,
      head: r.head || 'FEED',
      quantity: qty,
      bags: qty,
      notes: r.notes || '',
      attachment: r.attachment || null,
      amountPaid: amt,
      amount: amt,
      costPerBag: qty > 0 ? Math.round(amt / qty) : 0,
      paymentType: r.paymentType || 'CASH',
      expenseId: r.expenseId || 0,
      challanNo: r.challanNo || '0',
      flockId: fid,
      flock: { id: fid, flockName: flockNameForId(fid) },
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : dIso,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : dIso,
    };
  });
}

export async function upsertStock(stock: any, explicitId?: number | string) {
  const clientId = stock.clientId || (typeof stock.id === 'string' && isNaN(Number(stock.id)) ? stock.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(stock.trackingId || stock.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."Stock" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."Stock" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const rawHead = String(stock.head || prev.head || 'FEED').toUpperCase().trim();
  const head = VALID_STOCK_HEADS.has(rawHead) ? rawHead : 'OTHER';
  const fid = flockIdFromInput(stock.flockId ?? prev.flockId, stock.flockName);
  const rawDate = stock.date ?? prev.date;
  const dateIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
  const qty = Math.round(Number(stock.quantity ?? stock.bags ?? prev.quantity ?? 0));
  const amt = stock.amountPaid !== undefined ? Number(stock.amountPaid) : stock.amount !== undefined ? Number(stock.amount) : Number(prev.amountPaid ?? 0);
  const stockType = String(stock.Type ?? stock.type ?? prev.Type ?? '13');
  const challanNo = String(stock.challanNo ?? prev.challanNo ?? '0');

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."Stock" (id, date, "Type", head, quantity, notes, attachment, "amountPaid", "paymentType", "expenseId", "challanNo", "flockId", "clientId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4::"StockHead",$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         "Type" = EXCLUDED."Type",
         head = EXCLUDED.head,
         quantity = EXCLUDED.quantity,
         notes = EXCLUDED.notes,
         attachment = COALESCE(EXCLUDED.attachment, public."Stock".attachment),
         "amountPaid" = EXCLUDED."amountPaid",
         "paymentType" = EXCLUDED."paymentType",
         "challanNo" = EXCLUDED."challanNo",
         "flockId" = EXCLUDED."flockId",
         "clientId" = COALESCE(EXCLUDED."clientId", public."Stock"."clientId"),
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, dateIso, stockType, head, qty, stock.notes ?? prev.notes ?? '', stock.attachment || null, amt, stock.paymentType ?? prev.paymentType ?? 'CASH', Number(stock.expenseId ?? prev.expenseId ?? 0), challanNo, fid, clientId || prev.clientId || null]
    );
    await alignSequence('Stock');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."Stock" (date, "Type", head, quantity, notes, attachment, "amountPaid", "paymentType", "expenseId", "challanNo", "flockId", "clientId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3::"StockHead",$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       RETURNING *`,
      [dateIso, stockType, head, qty, stock.notes || '', stock.attachment || null, amt, stock.paymentType || 'CASH', Number(stock.expenseId || 0), challanNo, fid, clientId]
    );
    return res.rows[0];
  }
}

export async function deleteStock(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."Stock" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."Stock" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// DAILY CONSUMPTION
// ==========================================
export async function fetchAllConsumptions() {
  const res = await pool.query('SELECT * FROM public."DailyConsumption" ORDER BY date DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const feedKg = Number(r.feedQuantity || 0);
    const bags = r.bags !== null && r.bags !== undefined ? Number(r.bags) : Math.round(feedKg / 50);
    const water = Number(r.waterIntake || 0);
    const dIso = r.date ? new Date(r.date).toISOString() : new Date().toISOString();
    return {
      id: r.id,
      clientId: r.clientId || undefined,
      trackingId: r.id,
      date: dIso,
      flockId: fid,
      flock: { id: fid, flockName: flockNameForId(fid) },
      feedType: r.feedType || 'Layer Feed 13',
      feedConsumed: bags,
      bags,
      feedQuantityKg: feedKg,
      gramsPerBird: Number(r.gramsPerBird || 0),
      waterConsumed: water,
      waterConsumption: water,
      waterIntakeLiters: water,
      challanNo: r.challanNo || '',
      notes: r.notes || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : dIso,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : dIso,
    };
  });
}

export async function upsertConsumption(c: any, explicitId?: number | string) {
  const clientId = c.clientId || (typeof c.id === 'string' && isNaN(Number(c.id)) ? c.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(c.trackingId || c.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."DailyConsumption" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."DailyConsumption" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const fid = flockIdFromInput(c.flockId ?? prev.flockId, c.flockName);
  const bags = Number(c.bags ?? c.feedConsumed ?? (c.feedQuantityKg !== undefined ? Math.round(Number(c.feedQuantityKg) / 50) : prev.bags ?? 0));
  const feedKg = Number(c.feedQuantityKg ?? c.feedQuantity ?? (c.bags !== undefined || c.feedConsumed !== undefined ? bags * 50 : prev.feedQuantity ?? bags * 50));
  const water = Number(c.waterIntakeLiters ?? c.waterConsumed ?? c.waterConsumption ?? c.waterIntake ?? prev.waterIntake ?? 0);
  const rawDate = c.date ?? c.consumptionDate ?? prev.date;
  const dateIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."DailyConsumption" (id, "clientId", date, "flockId", "feedQuantity", "waterIntake", "feedType", notes, bags, "gramsPerBird", "challanNo", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         "flockId" = EXCLUDED."flockId",
         "feedQuantity" = EXCLUDED."feedQuantity",
         "waterIntake" = EXCLUDED."waterIntake",
         "feedType" = EXCLUDED."feedType",
         notes = EXCLUDED.notes,
         bags = EXCLUDED.bags,
         "gramsPerBird" = EXCLUDED."gramsPerBird",
         "challanNo" = EXCLUDED."challanNo",
         "clientId" = COALESCE(EXCLUDED."clientId", public."DailyConsumption"."clientId"),
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, clientId || prev.clientId || null, dateIso, fid, feedKg, water, c.feedType ?? prev.feedType ?? 'Layer Feed 13', c.notes ?? prev.notes ?? '', bags, Number(c.gramsPerBird ?? prev.gramsPerBird ?? 0), c.challanNo ?? prev.challanNo ?? '']
    );
    await alignSequence('DailyConsumption');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."DailyConsumption" ("clientId", date, "flockId", "feedQuantity", "waterIntake", "feedType", notes, bags, "gramsPerBird", "challanNo", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING *`,
      [clientId, dateIso, fid, feedKg, water, c.feedType || 'Layer Feed 13', c.notes || '', bags, Number(c.gramsPerBird || 0), c.challanNo || '']
    );
    return res.rows[0];
  }
}

export async function deleteConsumption(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."DailyConsumption" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."DailyConsumption" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// BIRD HEALTH (MORTALITY)
// ==========================================
export async function fetchAllBirdHealth() {
  const res = await pool.query('SELECT * FROM public."BirdHealth" ORDER BY date DESC, id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 8;
    const dIso = r.date ? new Date(r.date).toISOString() : new Date().toISOString();
    return {
      id: r.id,
      clientId: r.clientId || undefined,
      date: dIso,
      flockId: fid,
      flock: { id: fid, flockName: flockNameForId(fid) },
      openingBirds: Number(r.openingBirds || 0),
      mortality: Number(r.mortality || 0),
      cull: Number(r.cull || 0),
      cause: r.cause || r.notes || 'Daily Mortality',
      symptoms: r.symptoms || r.notes || '',
      notes: r.notes || r.symptoms || '',
      recordedBy: r.recordedBy || 'Farm Admin',
      feedConsumed: Number(r.feedConsumed || 0),
      waterConsumption: Number(r.waterConsumption || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : dIso,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : dIso,
    };
  });
}

export async function upsertBirdHealth(h: any, explicitId?: number | string) {
  const clientId = h.clientId || (typeof h.id === 'string' && isNaN(Number(h.id)) ? h.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(h.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."BirdHealth" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."BirdHealth" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const fid = flockIdFromInput(h.flockId ?? prev.flockId, h.flockName);
  const mort = Number(h.mortality ?? h.count ?? prev.mortality ?? 0);
  const cull = Number(h.cull ?? prev.cull ?? 0);
  const rawDate = h.date ?? prev.date;
  const dateIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
  const cause = h.cause ?? h.notes ?? prev.cause ?? 'Daily Mortality';
  const symptoms = h.symptoms ?? h.notes ?? prev.symptoms ?? '';
  const recordedBy = h.recordedBy ?? prev.recordedBy ?? 'Farm Admin';

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."BirdHealth" (id, "clientId", date, "flockId", "openingBirds", mortality, cull, notes, cause, symptoms, "recordedBy", "feedConsumed", "waterConsumption", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         "flockId" = EXCLUDED."flockId",
         mortality = EXCLUDED.mortality,
         cull = EXCLUDED.cull,
         notes = EXCLUDED.notes,
         cause = EXCLUDED.cause,
         symptoms = EXCLUDED.symptoms,
         "recordedBy" = EXCLUDED."recordedBy",
         "clientId" = COALESCE(EXCLUDED."clientId", public."BirdHealth"."clientId"),
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, clientId || prev.clientId || null, dateIso, fid, Number(h.openingBirds ?? prev.openingBirds ?? 25000), mort, cull, symptoms || cause, cause, symptoms, recordedBy, Number(h.feedConsumed ?? prev.feedConsumed ?? 0), Number(h.waterConsumption ?? prev.waterConsumption ?? 0)]
    );
    await alignSequence('BirdHealth');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."BirdHealth" ("clientId", date, "flockId", "openingBirds", mortality, cull, notes, cause, symptoms, "recordedBy", "feedConsumed", "waterConsumption", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       RETURNING *`,
      [clientId, dateIso, fid, Number(h.openingBirds || 25000), mort, cull, symptoms || cause, cause, symptoms, recordedBy, Number(h.feedConsumed || 0), Number(h.waterConsumption || 0)]
    );
    return res.rows[0];
  }
}

export async function deleteBirdHealth(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."BirdHealth" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."BirdHealth" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

export async function reconcileFlockBirdHealth(
  flockId: number,
  targetMortality: number,
  flockName?: string
) {
  const safeTarget = Math.max(0, Math.round(Number(targetMortality) || 0));
  const rowsRes = await pool.query(
    'SELECT id, "clientId", mortality, cause FROM public."BirdHealth" WHERE "flockId" = $1 ORDER BY id DESC',
    [flockId]
  );
  const currentSum = rowsRes.rows.reduce((s: number, r: any) => s + (Number(r.mortality) || 0), 0);
  const delta = safeTarget - currentSum;
  if (delta === 0) return;

  const nowIso = new Date().toISOString();
  const label = flockName || flockNameForId(flockId);

  if (delta > 0) {
    const clientId = `mort-sync-${flockId}-${Date.now()}`;
    await pool.query(
      `INSERT INTO public."BirdHealth" ("clientId", date, "flockId", "openingBirds", mortality, cull, notes, cause, symptoms, "recordedBy", "feedConsumed", "waterConsumption", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,$9,0,0,NOW(),NOW())`,
      [
        clientId,
        nowIso,
        flockId,
        flockId === 8 ? 24786 : flockId === 9 ? 31739 : 25189,
        delta,
        `Synchronized with ${label} mortality (${currentSum} -> ${safeTarget})`,
        'Recorded in Flock Management',
        `Synchronized with ${label} mortality (${currentSum} -> ${safeTarget})`,
        'Farm Admin',
      ]
    );
    await alignSequence('BirdHealth');
  } else {
    let toRemove = Math.abs(delta);
    // Prefer reducing/removing prior sync rows first, then newest logs
    const orderedRows = [...rowsRes.rows].sort((a: any, b: any) => {
      const aSync = String(a.clientId || '').startsWith('mort-sync-') || String(a.clientId || '').startsWith('mort-flock-') ? 0 : 1;
      const bSync = String(b.clientId || '').startsWith('mort-sync-') || String(b.clientId || '').startsWith('mort-flock-') ? 0 : 1;
      if (aSync !== bSync) return aSync - bSync;
      return b.id - a.id;
    });

    for (const row of orderedRows) {
      if (toRemove <= 0) break;
      const rowMort = Number(row.mortality) || 0;
      if (rowMort <= 0) {
        await pool.query('DELETE FROM public."BirdHealth" WHERE id = $1', [row.id]);
        continue;
      }
      if (rowMort <= toRemove) {
        await pool.query('DELETE FROM public."BirdHealth" WHERE id = $1', [row.id]);
        toRemove -= rowMort;
      } else {
        await pool.query(
          'UPDATE public."BirdHealth" SET mortality = $1, "updatedAt" = NOW() WHERE id = $2',
          [rowMort - toRemove, row.id]
        );
        toRemove = 0;
      }
    }
  }
}

export async function reconcileAllFlocksBirdHealth() {
  try {
    const flocksRes = await pool.query('SELECT id, "flockName", mortality FROM public."Flock"');
    for (const fl of flocksRes.rows) {
      if (fl.mortality !== null && fl.mortality !== undefined) {
        await reconcileFlockBirdHealth(Number(fl.id), Number(fl.mortality), fl.flockName);
      }
    }
  } catch (err) {
    console.warn('Reconcile flocks bird health warning:', err);
  }
}

// ==========================================
// VACCINE SCHEDULES
// ==========================================
export async function fetchAllVaccines() {
  const res = await pool.query('SELECT * FROM public."VaccineSchedule" ORDER BY id DESC');
  return res.rows.map((r: any) => ({
    id: r.clientId || String(r.id),
    dbId: r.id,
    flockId: String(r.flockId),
    flockName: r.flockName || flockNameForId(Number(r.flockId)),
    vaccineName: r.vaccineName,
    scheduledWeek: Number(r.scheduledWeek || 0),
    scheduledDate: r.scheduledDate || '',
    administeredDate: r.administeredDate || undefined,
    status: r.status || 'Scheduled',
    method: r.method || 'Drinking Water',
    dosage: r.dosage || '',
    batchNumber: r.batchNumber || '',
    vetNotes: r.vetNotes || '',
  }));
}

export async function upsertVaccine(v: any, explicitId?: number | string) {
  const clientId = v.clientId || (typeof v.id === 'string' && isNaN(Number(v.id)) ? v.id : null);

  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(v.dbId || v.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."VaccineSchedule" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."VaccineSchedule" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const fid = flockIdFromInput(v.flockId ?? prev.flockId, v.flockName ?? prev.flockName);
  const flockName = v.flockName || prev.flockName || flockNameForId(fid);
  const vaccineName = String(v.vaccineName || prev.vaccineName || 'Routine Vaccine').trim();
  const scheduledWeek = Number(v.scheduledWeek ?? prev.scheduledWeek ?? 0);
  const scheduledDate = v.scheduledDate ?? prev.scheduledDate ?? null;
  const administeredDate = v.administeredDate !== undefined ? v.administeredDate : prev.administeredDate ?? null;
  const status = v.status || prev.status || 'Scheduled';
  const method = v.method || prev.method || 'Drinking Water';
  const dosage = v.dosage ?? prev.dosage ?? '';
  const batchNumber = v.batchNumber ?? prev.batchNumber ?? '';
  const vetNotes = v.vetNotes ?? v.notes ?? prev.vetNotes ?? '';

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."VaccineSchedule" (id, "clientId", "flockId", "flockName", "vaccineName", "scheduledWeek", "scheduledDate", "administeredDate", status, method, dosage, "batchNumber", "vetNotes", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         "flockId" = EXCLUDED."flockId",
         "flockName" = EXCLUDED."flockName",
         "vaccineName" = EXCLUDED."vaccineName",
         "scheduledWeek" = EXCLUDED."scheduledWeek",
         "scheduledDate" = EXCLUDED."scheduledDate",
         "administeredDate" = EXCLUDED."administeredDate",
         status = EXCLUDED.status,
         method = EXCLUDED.method,
         dosage = EXCLUDED.dosage,
         "batchNumber" = EXCLUDED."batchNumber",
         "vetNotes" = EXCLUDED."vetNotes",
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, clientId || prev.clientId || null, fid, flockName, vaccineName, scheduledWeek, scheduledDate, administeredDate, status, method, dosage, batchNumber, vetNotes]
    );
    await alignSequence('VaccineSchedule');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."VaccineSchedule" ("clientId", "flockId", "flockName", "vaccineName", "scheduledWeek", "scheduledDate", "administeredDate", status, method, dosage, "batchNumber", "vetNotes", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       RETURNING *`,
      [clientId, fid, flockName, vaccineName, scheduledWeek, scheduledDate, administeredDate, status, method, dosage, batchNumber, vetNotes]
    );
    return res.rows[0];
  }
}

export async function deleteVaccine(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."VaccineSchedule" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."VaccineSchedule" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// SALARIES & ADVANCES
// ==========================================
export async function fetchAllSalaries() {
  const res = await pool.query('SELECT * FROM public."Salary" ORDER BY id DESC');
  return res.rows.map((r: any) => {
    const fid = Number(r.flockId) || 9;
    return {
      id: r.clientId || String(r.id),
      dbId: r.id,
      recordType: r.recordType || 'salary',
      employeeName: r.employeeName,
      designation: r.designation || 'Farm Staff',
      flockId: String(fid),
      flockName: flockNameForId(fid),
      flock: { id: fid, flockName: flockNameForId(fid) },
      basicSalary: Number(r.basicSalary ?? r.salaryAmount ?? 0),
      salaryAmount: Number(r.salaryAmount || 0),
      netSalaryPaid: Number(r.salaryAmount || 0),
      advance: Number(r.advance || 0),
      advanceDeducted: Number(r.advance || 0),
      advanceAmount: Number(r.advance || 0),
      deduction: Number(r.deduction || 0),
      deductedAmount: Number(r.deduction || 0),
      remainingBalance: Number(r.remainingBalance || 0),
      total: Number(r.total || r.salaryAmount || 0),
      totalSalary: Number(r.total || r.salaryAmount || 0),
      remarks: r.remarks || '',
      paymentDate: r.date || (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
      date: r.date || (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
      month: r.month || '',
      challanNo: r.challanNo || '',
      paymentMethod: r.paymentMode || 'Cash',
      status: r.repaymentStatus || 'Paid',
      repaymentStatus: r.repaymentStatus || 'Pending',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    };
  });
}

export async function upsertSalary(s: any, explicitId?: number | string) {
  const clientId = s.clientId || (typeof s.id === 'string' && isNaN(Number(s.id)) ? s.id : null);
  let targetId = explicitId !== undefined && !isNaN(Number(explicitId)) ? Number(explicitId) : Number(s.dbId || s.id);
  if (isNaN(targetId) || targetId <= 0) targetId = 0;

  let prev: any = {};
  if (!targetId && (clientId || explicitId)) {
    const key = String(clientId || explicitId);
    const found = await pool.query('SELECT * FROM public."Salary" WHERE "clientId" = $1 LIMIT 1', [key]);
    if (found.rows[0]) {
      prev = found.rows[0];
      targetId = prev.id;
    }
  } else if (targetId > 0) {
    const found = await pool.query('SELECT * FROM public."Salary" WHERE id = $1 LIMIT 1', [targetId]);
    if (found.rows[0]) prev = found.rows[0];
  }

  const fid = flockIdFromInput(s.flockId ?? prev.flockId, s.flockName);
  const recordType = s.recordType ?? prev.recordType ?? 'salary_disbursal';
  const employeeName = s.employeeName ?? prev.employeeName ?? 'Staff';
  const designation = s.designation ?? prev.designation ?? 'Farm Staff';
  const basicSalary = Number(s.basicSalary ?? s.salaryAmount ?? prev.basicSalary ?? 0);
  const salaryAmount = Number(s.salaryAmount ?? s.netSalaryPaid ?? prev.salaryAmount ?? 0);
  const advance = Number(s.advance ?? s.advanceAmount ?? s.advanceDeducted ?? prev.advance ?? 0);
  const deduction = Number(s.deduction ?? s.deductedAmount ?? s.penaltyDeduction ?? prev.deduction ?? 0);
  const remainingBalance = Number(s.remainingBalance ?? prev.remainingBalance ?? 0);
  const total = Number(s.total ?? s.totalSalary ?? prev.total ?? (salaryAmount || advance));
  const remarks = s.remarks ?? prev.remarks ?? '';
  const dateStr = s.date ?? s.paymentDate ?? prev.date ?? new Date().toISOString().slice(0, 10);
  const month = s.month ?? prev.month ?? '';
  const challanNo = s.challanNo ?? prev.challanNo ?? '';
  const paymentMode = s.paymentMethod ?? s.paymentMode ?? prev.paymentMode ?? 'Cash';
  const repaymentStatus = s.repaymentStatus ?? s.status ?? prev.repaymentStatus ?? 'Paid';

  if (targetId > 0) {
    const res = await pool.query(
      `INSERT INTO public."Salary" (id, "clientId", "recordType", "employeeName", designation, "basicSalary", "salaryAmount", advance, deduction, "remainingBalance", total, remarks, "flockId", date, month, "challanNo", "paymentMode", "repaymentStatus", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         "recordType" = EXCLUDED."recordType",
         "employeeName" = EXCLUDED."employeeName",
         designation = EXCLUDED.designation,
         "basicSalary" = EXCLUDED."basicSalary",
         "salaryAmount" = EXCLUDED."salaryAmount",
         advance = EXCLUDED.advance,
         deduction = EXCLUDED.deduction,
         "remainingBalance" = EXCLUDED."remainingBalance",
         total = EXCLUDED.total,
         remarks = EXCLUDED.remarks,
         "flockId" = EXCLUDED."flockId",
         date = EXCLUDED.date,
         month = EXCLUDED.month,
         "challanNo" = EXCLUDED."challanNo",
         "paymentMode" = EXCLUDED."paymentMode",
         "repaymentStatus" = EXCLUDED."repaymentStatus",
         "clientId" = COALESCE(EXCLUDED."clientId", public."Salary"."clientId"),
         "updatedAt" = NOW()
       RETURNING *`,
      [targetId, clientId || prev.clientId || null, recordType, employeeName, designation, basicSalary, salaryAmount, advance, deduction, remainingBalance, total, remarks, fid, dateStr, month, challanNo, paymentMode, repaymentStatus]
    );
    await alignSequence('Salary');
    return res.rows[0];
  } else {
    const res = await pool.query(
      `INSERT INTO public."Salary" ("clientId", "recordType", "employeeName", designation, "basicSalary", "salaryAmount", advance, deduction, "remainingBalance", total, remarks, "flockId", date, month, "challanNo", "paymentMode", "repaymentStatus", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
       RETURNING *`,
      [clientId, recordType, employeeName, designation, basicSalary, salaryAmount, advance, deduction, remainingBalance, total, remarks, fid, dateStr, month, challanNo, paymentMode, repaymentStatus]
    );
    return res.rows[0];
  }
}

export async function deleteSalary(idOrClient: number | string) {
  const num = Number(idOrClient);
  if (!isNaN(num) && num > 0) {
    await pool.query('DELETE FROM public."Salary" WHERE id = $1', [num]);
  } else {
    await pool.query('DELETE FROM public."Salary" WHERE "clientId" = $1', [String(idOrClient)]);
  }
}

// ==========================================
// STAFF WORKERS
// ==========================================
export async function fetchAllWorkers() {
  const res = await pool.query('SELECT * FROM public."StaffWorker" ORDER BY "createdAt" DESC, id ASC');
  return res.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    farmAssigned: r.farmAssigned || '',
    flockId: String(r.flockId || 9),
    flockName: r.flockName || flockNameForId(Number(r.flockId || 9)),
    monthlySalary: Number(r.monthlySalary || 0),
    advanceBalance: Number(r.advanceBalance || 0),
    phone: r.phone || '',
    status: r.status || 'Active',
    joinedDate: r.joinedDate || '',
    checkInTime: r.checkInTime || '07:00 AM',
    checkOutTime: r.checkOutTime || '05:00 PM',
    shift: r.shift || 'Morning Shift (07:00 - 17:00)',
    shiftHours: Number(r.shiftHours || 10),
    attendanceStatus: r.attendanceStatus || 'Present',
    notes: r.notes || '',
  }));
}

export async function upsertWorker(w: any) {
  const id = String(w.id || `w-${Date.now()}`);
  const prevRes = await pool.query('SELECT * FROM public."StaffWorker" WHERE id = $1 LIMIT 1', [id]);
  const prev = prevRes.rows[0] || {};
  const fid = flockIdFromInput(w.flockId ?? prev.flockId, w.flockName ?? prev.flockName);
  const res = await pool.query(
    `INSERT INTO public."StaffWorker" (id, name, role, "farmAssigned", "flockId", "flockName", "monthlySalary", "advanceBalance", phone, status, "joinedDate", "checkInTime", "checkOutTime", shift, "shiftHours", "attendanceStatus", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       "farmAssigned" = EXCLUDED."farmAssigned",
       "flockId" = EXCLUDED."flockId",
       "flockName" = EXCLUDED."flockName",
       "monthlySalary" = EXCLUDED."monthlySalary",
       "advanceBalance" = EXCLUDED."advanceBalance",
       phone = EXCLUDED.phone,
       status = EXCLUDED.status,
       "joinedDate" = EXCLUDED."joinedDate",
       "checkInTime" = EXCLUDED."checkInTime",
       "checkOutTime" = EXCLUDED."checkOutTime",
       shift = EXCLUDED.shift,
       "shiftHours" = EXCLUDED."shiftHours",
       "attendanceStatus" = EXCLUDED."attendanceStatus",
       notes = EXCLUDED.notes,
       "updatedAt" = NOW()
     RETURNING *`,
    [
      id,
      w.name ?? prev.name ?? 'Staff Member',
      w.role ?? prev.role ?? 'Farm Worker',
      w.farmAssigned ?? prev.farmAssigned ?? '',
      fid,
      w.flockName ?? prev.flockName ?? flockNameForId(fid),
      Number(w.monthlySalary ?? prev.monthlySalary ?? 0),
      Number(w.advanceBalance ?? prev.advanceBalance ?? 0),
      w.phone ?? prev.phone ?? '',
      w.status ?? prev.status ?? 'Active',
      w.joinedDate ?? prev.joinedDate ?? '',
      w.checkInTime ?? prev.checkInTime ?? '07:00 AM',
      w.checkOutTime ?? prev.checkOutTime ?? '05:00 PM',
      w.shift ?? prev.shift ?? 'Morning Shift (07:00 - 17:00)',
      Number(w.shiftHours ?? prev.shiftHours ?? 10),
      w.attendanceStatus ?? prev.attendanceStatus ?? 'Present',
      w.notes ?? prev.notes ?? '',
    ]
  );
  return res.rows[0];
}

export async function deleteWorker(id: string) {
  await pool.query('DELETE FROM public."StaffWorker" WHERE id = $1', [id]);
}

// ==========================================
// BANK ACCOUNTS
// ==========================================
export async function fetchAllBanks() {
  const res = await pool.query('SELECT * FROM public."BankAccount" ORDER BY "createdAt" ASC');
  return res.rows.map((r: any) => ({
    id: r.id,
    bankName: r.bankName,
    accountTitle: r.accountTitle,
    accountNumber: r.accountNumber || '',
    openingBalance: Number(r.openingBalance || 0),
    openingDate: r.openingDate || '',
    notes: r.notes || '',
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
  }));
}

export async function upsertBank(b: any) {
  const id = String(b.id || `bank-${Date.now()}`);
  const prevRes = await pool.query('SELECT * FROM public."BankAccount" WHERE id = $1 LIMIT 1', [id]);
  const prev = prevRes.rows[0] || {};
  const nowDate = new Date().toISOString().slice(0, 10);
  const res = await pool.query(
    `INSERT INTO public."BankAccount" (id, "bankName", "accountTitle", "accountNumber", "openingBalance", "openingDate", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     ON CONFLICT (id) DO UPDATE SET
       "bankName" = EXCLUDED."bankName",
       "accountTitle" = EXCLUDED."accountTitle",
       "accountNumber" = EXCLUDED."accountNumber",
       "openingBalance" = EXCLUDED."openingBalance",
       "openingDate" = EXCLUDED."openingDate",
       notes = EXCLUDED.notes,
       "updatedAt" = NOW()
     RETURNING *`,
    [
      id,
      String(b.bankName ?? prev.bankName ?? 'Bank Account').trim(),
      String(b.accountTitle ?? prev.accountTitle ?? 'GreenOva Poultry Farm').trim(),
      String(b.accountNumber ?? prev.accountNumber ?? '').trim(),
      Number(b.openingBalance ?? prev.openingBalance ?? 0),
      b.openingDate ?? prev.openingDate ?? nowDate,
      b.notes ?? prev.notes ?? '',
    ]
  );
  return res.rows[0];
}

export async function deleteBank(id: string) {
  await pool.query('DELETE FROM public."BankAccount" WHERE id = $1', [id]);
}

// ==========================================
// USERS
// ==========================================
export async function fetchAllUsers() {
  const res = await pool.query(
    'SELECT id, name, email, status::text AS status, role, "isEmailVerified", "farmAssigned", "lastLogin", "createdAt" FROM public."user" ORDER BY id ASC'
  );
  return res.rows.map((u: any) => ({
    id: String(u.id),
    dbId: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'admin',
    farmAssigned: u.farmAssigned || 'All Farm Complexes',
    status: u.status === 'allowed' ? 'Active' : 'Inactive',
    rawStatus: u.status,
    isEmailVerified: Boolean(u.isEmailVerified),
    lastLogin: u.lastLogin || 'Never',
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
  }));
}
