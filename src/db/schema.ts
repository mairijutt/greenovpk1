import { pgTable, serial, integer, text, timestamp, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// 1. Farms Table
export const farms = pgTable('Farm', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  location: text('location'),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// 2. Flocks Table
export const flocks = pgTable('Flock', {
  id: serial('id').primaryKey(),
  farmId: integer('farmId').notNull(),
  exitDate: timestamp('exitDate'),
  mortality: integer('mortality').default(0).notNull(),
  notes: text('notes'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  acquiredDate: timestamp('acquiredDate').notNull(),
  breed: text('breed').notNull(),
  flockName: text('flockName').notNull(),
  totalBirds: integer('totalBirds').default(0).notNull(),
  originalTotalBirds: integer('originalTotalBirds'),
  cost: integer('cost').notNull(),
});

// 3. Egg Production Table
export const eggProductions = pgTable('EggProduction', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  totalEggs: integer('totalEggs').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  averageWeight: integer('averageWeight').notNull(),
  brokenEggs: integer('brokenEggs').default(0).notNull(),
  flockId: integer('flockId').notNull(),
  grade: text('grade').notNull(),
  birds: integer('birds'),
});

// 4. Expense Table
export const expenses = pgTable('Expense', {
  id: serial('id').primaryKey(),
  expenseDate: timestamp('expense_date').notNull(),
  expenseCost: doublePrecision('expense_cost').notNull(),
  head: text('head').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  attachment: text('attachment'),
  challanNo: text('challanNo').default('0').notNull(),
  flockId: integer('flockId').notNull(),
});

// 5. Sale Table
export const sales = pgTable('Sale', {
  id: serial('id').primaryKey(),
  saleDate: timestamp('saleDate').notNull(),
  flockId: integer('flockId').notNull(),
  itemsSold: integer('itemsSold').default(0).notNull(),
  attachment: text('attachment'),
  head: text('head').notNull(),
  totalAmount: doublePrecision('totalAmount').notNull(),
  notes: text('notes'),
  grade: text('grade'),
  averageWeight: integer('averageWeight'),
  cashPayment: integer('cashPayment').notNull(),
  onlinePayment: integer('onlinePayment').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  partyName: text('partyName').notNull(),
  vehicleNumber: text('vehicleNumber').notNull(),
  weight: integer('weight'),
  challanNo: text('challanNo').default('0').notNull(),
});

// 6. Stock Table
export const stocks = pgTable('Stock', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  type: text('Type').notNull(),
  head: text('head').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  attachment: text('attachment'),
  amountPaid: doublePrecision('amountPaid'),
  paymentType: text('paymentType'),
  expenseId: integer('expenseId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  challanNo: text('challanNo').default('0').notNull(),
  flockId: integer('flockId').notNull(),
});

// 7. Salary Table
export const salaries = pgTable('Salary', {
  id: serial('id').primaryKey(),
  employeeName: text('employeeName').notNull(),
  designation: text('designation').notNull(),
  attendance: integer('attendance'),
  basicSalary: doublePrecision('basicSalary'),
  salaryAmount: doublePrecision('salaryAmount').notNull(),
  advance: doublePrecision('advance'),
  penaltyReward: doublePrecision('penaltyReward'),
  total: doublePrecision('total').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  flockId: integer('flockId').notNull(),
});

// 8. Bird Health Table
export const birdHealth = pgTable('BirdHealth', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  flockId: integer('flockId').notNull(),
  openingBirds: integer('openingBirds').notNull(),
  mortality: integer('mortality').default(0).notNull(),
  cull: integer('cull').default(0).notNull(),
  feedId: text('feedId'),
  feedConsumed: doublePrecision('feedConsumed'),
  waterConsumption: doublePrecision('waterConsumption'),
  lightHours: doublePrecision('lightHours'),
  lightIntensity: doublePrecision('lightIntensity'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// 9. Daily Consumption Table
export const dailyConsumption = pgTable('DailyConsumption', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  flockId: integer('flockId').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  feeds: jsonb('feeds').default([]).notNull(),
  medicines: jsonb('medicines').default([]).notNull(),
  vaccines: jsonb('vaccines').default([]).notNull(),
  equipment: jsonb('equipment').default([]).notNull(),
  other: jsonb('other').default([]).notNull(),
});

// 10. User Table
export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  status: text('status').default('allowed').notNull(),
  role: text('role').default('admin').notNull(),
  isEmailVerified: boolean('isEmailVerified').default(false).notNull(),
  otp: text('otp'),
  otpExpires: timestamp('otpExpires'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  uid: text('uid'), // Firebase UID link
});
