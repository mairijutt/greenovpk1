export interface Farm {
  id: string;
  name: string;
  location: string;
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
  name: string;
  shedNumber: string;
  breed: string;
  purpose: 'Layers' | 'Broilers' | 'Breeders';
  initialCount: number;
  currentCount: number;
  ageWeeks: number;
  startDate: string;
  status: 'Active' | 'Culled' | 'Completed';
  targetFCR?: number;
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
  vaccineName: string;
  scheduledWeek: number;
  administeredDate?: string;
  status: 'Scheduled' | 'Completed' | 'Overdue';
  method: 'Drinking Water' | 'Eye Drop' | 'Injection' | 'Spray';
  vetNotes?: string;
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
  category: 'Egg Sales' | 'Bird Sales' | 'Manure' | 'Feed Purchase' | 'Medicine' | 'Electricity' | 'Labour' | 'Maintenance';
  amount: number;
  date: string;
  referenceNo: string;
  description: string;
  status: 'Paid' | 'Pending';
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  farmAssigned: string;
  monthlySalary: number;
  phone: string;
  status: 'Active' | 'On Leave';
  joinedDate: string;
}
