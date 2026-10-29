export interface Farm {
  id: string;
  name: string;
  code?: string;
  location: string;
  description?: string;
  capacity: number;
  currentBirds: number;
  shedsCount: number;
  manager: string;
  temperature: number;
  humidity: number;
}

export interface Flock {
  id: string;
  farmId: string;
  farmName?: string;
  name: string;
  shedNumber?: string;
  breed?: string;
  purpose?: 'Layers' | 'Broilers' | 'Breeders';
  initialCount: number;
  currentCount: number;
  ageWeeks: number;
  startDate: string;
  status: 'Active' | 'Culled' | 'Completed' | 'Inactive';
  mortality?: number;
  targetFCR?: number;
  cost?: number;
  notes?: string;
}

export interface EggProduction {
  id: string;
  flockId: string;
  flockName: string;
  date: string;
  morningEggs: number;
  eveningEggs: number;
  totalEggs: number;
  damagedEggs: number;
  cleanTrays: number; // 30 eggs per tray
  layingRatePercent: number;
  notes?: string;
}

export interface MortalityLog {
  id: string;
  flockId: string;
  flockName: string;
  date: string;
  count: number;
  cause: string;
  symptoms?: string;
  recordedBy: string;
}

export interface VaccineLog {
  id: string;
  flockId: string;
  flockName?: string;
  vaccineName: string;
  scheduledWeek: number;
  scheduledDate?: string;
  administeredDate?: string;
  status: 'Scheduled' | 'Completed' | 'Overdue';
  method: 'Drinking Water' | 'Eye Drop' | 'Injection' | 'Spray' | 'Wing Web' | 'Subcutaneous' | string;
  vetNotes?: string;
  dosage?: string;
  batchNumber?: string;
}

export interface FeedConsumption {
  id: string;
  flockId: string;
  flockName: string;
  date: string;
  feedType: string;
  feedQuantityKg: number;
  gramsPerBird: number;
  waterIntakeLiters: number;
  fcrEstimate: number;
  bags?: number;
  challanNo?: string;
  notes?: string;
  trackingId?: number;
  amount?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Feed' | 'Medicine' | 'Vaccine' | 'Packaging' | 'Equipment';
  quantity: number;
  unit: string;
  minAlertThreshold: number;
  costPerUnit: number;
  location: string;
  lastUpdated: string;
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  referenceNo: string;
  description: string;
  status: 'Paid' | 'Pending';
  trackingId?: number | string;
  flockId?: string | number;
  flockName?: string;
  flock?: string;
  challanNo?: string;
  head?: string;
  notes?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  farmAssigned: string;
  flockId?: string;
  flockName?: string;
  monthlySalary: number;
  advanceBalance?: number;
  phone: string;
  status: 'Active' | 'On Leave';
  joinedDate: string;
  notes?: string;
}

export interface SalaryDisbursal {
  id: string;
  employeeName: string;
  designation: string;
  flockId: string;
  flockName: string;
  basicSalary: number;
  advanceDeducted: number;
  allowanceBonus?: number;
  penaltyDeduction?: number;
  netSalaryPaid: number;
  totalSalary: number; // Gross salary
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
  status: 'Paid' | 'Pending';
  remarks?: string;
  challanNo?: string;
  month?: string;
}

export interface AdvanceSalaryRecord {
  id: string;
  employeeName: string;
  designation: string;
  flockId: string;
  flockName: string;
  advanceAmount: number;
  date: string;
  challanNo?: string;
  repaymentStatus: 'Deducted' | 'Pending' | 'Partially Deducted';
  deductedAmount: number;
  remainingBalance: number;
  remarks?: string;
}
