import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, X, LayoutDashboard, Egg, Wheat, TrendingUp, FileBarChart2 } from 'lucide-react';
import { Header, HealthNotification } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EggProductionView } from './components/EggProductionView';
import { FlocksView } from './components/FlocksView';
import { BirdHealthView } from './components/BirdHealthView';
import { ConsumptionView } from './components/ConsumptionView';
import { StocksView } from './components/StocksView';
import { FinanceView } from './components/FinanceView';
import { StaffView } from './components/StaffView';
import { SalariesView } from './components/SalariesView';
import { ReportsView } from './components/ReportsView';
import { FarmsView } from './components/FarmsView';
import { UserManagementView } from './components/UserManagementView';
import { LoginView } from './components/LoginView';
import { RecordModal } from './components/RecordModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { apiFetch } from './services/api';

import {
  initialFarms,
  initialFlocks,
  initialEggProductions,
  initialMortalityLogs,
  initialVaccineSchedule,
  initialConsumptionLogs,
  initialInventory,
  initialFinancials,
  initialWorkers,
} from './data/mockData';

import {
  liveFarms,
  liveFlocks,
  liveEggProductions,
  liveConsumptionRecords,
  liveSalesRecords,
  liveExpenseRecords,
  liveStaffRecords,
  liveMortalityLogs,
  liveVaccineSchedules,
  liveStaffRoster,
  liveAdvanceRecords,
  liveSalaryDisbursals,
} from './data/productionData';

import {
  Farm,
  Flock,
  EggProduction,
  MortalityLog,
  VaccineLog,
  FeedConsumption,
  InventoryItem,
  FinancialRecord,
  Worker,
  SalaryDisbursal,
  AdvanceSalaryRecord,
  BankAccount,
} from './types/farm';

const VALID_TABS: NavTab[] = [
  'dashboard',
  'flocks',
  'egg-production',
  'daily-consumption',
  'bird-health',
  'sales',
  'expenses',
  'stocks',
  'salaries',
  'reports',
  'farms',
  'users',
];

const getTabFromPath = (pathname: string): NavTab => {
  try {
    const clean = pathname.replace(/^\/+/, '').split('/')[0].trim().toLowerCase();
    if (VALID_TABS.includes(clean as NavTab)) {
      return clean as NavTab;
    }
  } catch (e) {}
  return 'dashboard';
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'dashboard';
  });
  const [activeFarm, setActiveFarm] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('greenova_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('greenova_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Authenticated user state - restored from localStorage so refreshing page keeps session until manual logout
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    token?: string;
    phone?: string;
    role?: string;
    emailVerified?: boolean;
    initials?: string;
    isSuperAdmin?: boolean;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('greenova_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  });

  // Navigate tab and sync browser URL path (e.g., /dashboard, /sales, /flocks)
  const handleNavigateTab = (tab: NavTab) => {
    setCurrentTab(tab);
    const targetPath = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      try {
        window.history.pushState({ tab }, '', targetPath);
      } catch (e) {}
    }
  };

  // Keep browser URL path and history state in sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentUser) {
      const currentPath = window.location.pathname;
      const detectedTab = getTabFromPath(currentPath);
      const expectedPath = detectedTab === 'dashboard' ? '/dashboard' : `/${detectedTab}`;
      if (currentPath === '/' || currentPath === '' || currentPath === '/login') {
        try {
          window.history.replaceState({ tab: 'dashboard' }, '', '/dashboard');
        } catch (e) {}
      } else if (currentPath !== expectedPath) {
        try {
          window.history.replaceState({ tab: detectedTab }, '', expectedPath);
        } catch (e) {}
      }
    } else {
      if (window.location.pathname !== '/login') {
        try {
          window.history.replaceState(null, '', '/login');
        } catch (e) {}
      }
    }

    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [recordModalType, setRecordModalType] = useState<'egg' | 'mortality' | 'feed' | null>(null);
  const [savedBanner, setSavedBanner] = useState<{ title: string; detail?: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reportError = (err: unknown, fallback: string) => {
    const msg = err instanceof Error ? err.message : fallback;
    setActionError(msg);
    setTimeout(() => {
      setActionError((prev) => (prev === msg ? null : prev));
    }, 6000);
  };

  const triggerSavedRefresh = (detail?: string) => {
    setSavedBanner({
      title: 'Record saved successfully',
      detail: detail || 'Refreshing page to sync latest farm records...',
    });
    setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  // Domain State
  const [farms, setFarms] = useState<Farm[]>(() => {
    const saved = localStorage.getItem('greenova_farm_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveFarms;
  });
  const [flocks, setFlocks] = useState<Flock[]>(() => {
    const saved = localStorage.getItem('greenova_flocks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((f) => String(f.id) === '8')) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveFlocks;
  });
  const [eggProductions, setEggProductions] = useState<EggProduction[]>(() => {
    const savedV3 = localStorage.getItem('greenova_eggs_v3');
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const savedV2 = localStorage.getItem('greenova_eggs_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length >= 413) return parsed;
      } catch (e) {}
    }
    return liveEggProductions;
  });
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(() => {
    const saved = localStorage.getItem('greenova_mortality_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveMortalityLogs;
  });
  const [vaccines, setVaccines] = useState<VaccineLog[]>(() => {
    const saved = localStorage.getItem('greenova_vaccines_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveVaccineSchedules;
  });
  const [latestHealthPrompt, setLatestHealthPrompt] = useState<HealthNotification | null>(null);
  const [consumptionLogs, setConsumptionLogs] = useState<FeedConsumption[]>(() => {
    const savedV4 = localStorage.getItem('greenova_feed_v4');
    if (savedV4) {
      try {
        const parsed = JSON.parse(savedV4);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const savedV3 = localStorage.getItem('greenova_feed_v3');
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Preserve any user-created logs while upgrading Unit 3 baseline to authentic Mar-Oct monthly consumptions
          const userAddedLogs = parsed.filter((c: FeedConsumption) =>
            String(c.id).startsWith('feed-')
          );
          if (userAddedLogs.length > 0) {
            return [...userAddedLogs, ...liveConsumptionRecords];
          }
        }
      } catch (e) {}
    }
    return liveConsumptionRecords;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('greenova_inventory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return initialInventory;
  });
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => {
    const savedV3 = localStorage.getItem('greenova_financials_v3');
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const savedV2 = localStorage.getItem('greenova_financials_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length >= 2316) return parsed;
      } catch (e) {}
    }
    return [...liveSalesRecords, ...liveExpenseRecords];
  });
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('greenova_staff_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((w: Worker, idx: number) => ({
            ...w,
            shift:
              w.shift ||
              (idx === 2 || idx === 10
                ? 'Night Shift (19:00 - 07:00)'
                : 'Morning Shift (07:00 - 17:00)'),
            shiftHours: w.shiftHours || (idx === 2 || idx === 10 ? 12 : 10),
            checkInTime:
              w.checkInTime ||
              (w.status === 'On Leave'
                ? '—'
                : idx === 3
                ? '07:25 AM'
                : idx === 8
                ? '07:04 AM'
                : '06:50 AM'),
            checkOutTime:
              w.checkOutTime ||
              (w.status === 'On Leave'
                ? '—'
                : idx === 2 || idx === 10
                ? '07:00 AM'
                : '05:00 PM'),
            attendanceStatus:
              w.attendanceStatus ||
              (w.status === 'On Leave' ? 'On Leave' : idx === 3 ? 'Late' : 'Present'),
          }));
        }
      } catch (e) {}
    }
    return liveStaffRoster;
  });

  const [salaryDisbursals, setSalaryDisbursals] = useState<SalaryDisbursal[]>(() => {
    const saved = localStorage.getItem('greenova_salaries_v3') || localStorage.getItem('greenova_salaries_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 46) return parsed;
      } catch (e) {}
    }
    return liveSalaryDisbursals;
  });

  const [advanceRecords, setAdvanceRecords] = useState<AdvanceSalaryRecord[]>(() => {
    const saved = localStorage.getItem('greenova_advances_v3') || localStorage.getItem('greenova_advances_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 22) return parsed;
      } catch (e) {}
    }
    return liveAdvanceRecords;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('greenova_banks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('greenova_banks_v1', JSON.stringify(bankAccounts));
    } catch {}
  }, [bankAccounts]);
  useEffect(() => {
    localStorage.setItem('greenova_farm_records', JSON.stringify(farms));
  }, [farms]);
  useEffect(() => {
    localStorage.setItem('greenova_flocks', JSON.stringify(flocks));
  }, [flocks]);
  useEffect(() => {
    localStorage.setItem('greenova_eggs_v3', JSON.stringify(eggProductions));
  }, [eggProductions]);
  useEffect(() => {
    localStorage.setItem('greenova_mortality_v2', JSON.stringify(mortalityLogs));
  }, [mortalityLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_vaccines_v2', JSON.stringify(vaccines));
  }, [vaccines]);
  useEffect(() => {
    localStorage.setItem('greenova_feed_v4', JSON.stringify(consumptionLogs));
  }, [consumptionLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('greenova_financials_v3', JSON.stringify(financials));
  }, [financials]);
  useEffect(() => {
    localStorage.setItem('greenova_staff_v2', JSON.stringify(workers));
  }, [workers]);
  useEffect(() => {
    localStorage.setItem('greenova_salaries_v3', JSON.stringify(salaryDisbursals));
  }, [salaryDisbursals]);
  useEffect(() => {
    localStorage.setItem('greenova_advances_v3', JSON.stringify(advanceRecords));
  }, [advanceRecords]);

  // Cross-tab synchronization via storage events (keeps Dashboard and new tabs in sync)
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'greenova_farm_records') setFarms(JSON.parse(e.newValue));
        else if (e.key === 'greenova_flocks') setFlocks(JSON.parse(e.newValue));
        else if (e.key === 'greenova_mortality_v2') setMortalityLogs(JSON.parse(e.newValue));
        else if (e.key === 'greenova_eggs_v3') setEggProductions(JSON.parse(e.newValue));
        else if (e.key === 'greenova_financials_v3') setFinancials(JSON.parse(e.newValue));
        else if (e.key === 'greenova_feed_v4') setConsumptionLogs(JSON.parse(e.newValue));
        else if (e.key === 'greenova_vaccines_v2') setVaccines(JSON.parse(e.newValue));
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Listen for 401 unauthorized events from apiFetch and clear stale sessions
  useEffect(() => {
    const onUnauthorized = () => {
      try {
        localStorage.removeItem('greenova_user');
      } catch {}
      setCurrentUser(null);
    };
    window.addEventListener('greenova:unauthorized', onUnauthorized);
    return () => window.removeEventListener('greenova:unauthorized', onUnauthorized);
  }, []);

  // Verify live session and hydrate ALL domain entities from PostgreSQL
  useEffect(() => {
    if (!currentUser?.token) return;
    let active = true;

    const hydrateAllFromDb = async () => {
      try {
        const meRes = await apiFetch('/api/auth/me');
        if (!active) return;
        const verifiedUser = meRes?.data?.user;
        if (verifiedUser) {
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              name: verifiedUser.name || prev.name,
              email: verifiedUser.email || prev.email,
              role: verifiedUser.role || prev.role,
              isSuperAdmin: verifiedUser.role === 'super_admin',
            };
            try {
              localStorage.setItem('greenova_user', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } catch {
        // 401 handler signs out expired/legacy sessions automatically
        return;
      }

      const [
        flocksRes,
        farmsRes,
        banksRes,
        eggsRes,
        consumptionsRes,
        healthRes,
        vaccinesRes,
        salesRes,
        expensesRes,
        salariesRes,
        workersRes,
      ] = await Promise.allSettled([
        apiFetch('/api/flocks'),
        apiFetch('/api/farms'),
        apiFetch('/api/banks'),
        apiFetch('/api/egg-productions?limit=5000'),
        apiFetch('/api/daily-consumptions?limit=5000'),
        apiFetch('/api/bird-health?limit=5000'),
        apiFetch('/api/vaccines'),
        apiFetch('/api/sales?limit=5000'),
        apiFetch('/api/expenses?limit=5000'),
        apiFetch('/api/salaries?limit=5000'),
        apiFetch('/api/workers'),
      ]);

      if (!active) return;

      // 1. Flocks
      if (flocksRes.status === 'fulfilled' && Array.isArray(flocksRes.value?.data?.items) && flocksRes.value.data.items.length > 0) {
        const mappedFlocks: Flock[] = flocksRes.value.data.items.map((item: any) => {
          const idStr = String(item.id);
          const shedNum =
            item.shedNumber ||
            (idStr === '8' ? 'Shed 1' : idStr === '9' ? 'Shed 2' : idStr === '10' ? 'Shed 3' : `Shed ${idStr}`);
          return {
            id: idStr,
            farmId: String(item.farmId || 9),
            farmName: item.farm?.name || item.farmName || 'GreenOva',
            name: item.flockName || item.name || `Unit ${idStr}`,
            shedNumber: shedNum,
            breed: item.breed || 'LSL Classic',
            purpose: 'Layers',
            initialCount: Number(item.originalTotalBirds || item.totalBirds || 25000),
            currentCount: Number(item.totalBirds ?? 25000),
            startDate: item.acquiredDate ? String(item.acquiredDate).split('T')[0] : '2026-02-25',
            ageWeeks: Number(item.ageWeeks || item.ageInWeeks || 38),
            status: item.isActive !== false ? 'Active' : 'Inactive',
            mortality: Number(item.mortality ?? 0),
            targetFCR: Number(item.targetFCR || 1.48),
            cost: Number(item.cost || 7500000),
            notes: item.notes || '',
            updatedAt: item.updatedAt,
          };
        });
        setFlocks(mappedFlocks);
        try {
          localStorage.setItem('greenova_flocks', JSON.stringify(mappedFlocks));
        } catch {}
      }

      // 2. Farms
      if (farmsRes.status === 'fulfilled' && Array.isArray(farmsRes.value?.data?.items)) {
        const mappedFarms: Farm[] = farmsRes.value.data.items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          code: item.code || `GVF-${item.id}`,
          location: item.location || 'Multan, Punjab',
          description: item.description || 'Main Processing Facility',
          capacity: Number(item.capacity ?? 50000),
          currentBirds: Number(item.currentBirds ?? 0),
          shedsCount: Number(item.shedsCount ?? 1),
          manager: item.manager || 'Farm Supervisor',
          temperature: Number(item.temperature ?? 25),
          humidity: Number(item.humidity ?? 56),
        }));
        setFarms(mappedFarms);
        try {
          localStorage.setItem('greenova_farm_records', JSON.stringify(mappedFarms));
        } catch {}
      }

      // 3. Bank Accounts
      if (banksRes.status === 'fulfilled' && Array.isArray(banksRes.value?.data?.items)) {
        const remoteBanks: BankAccount[] = banksRes.value.data.items;
        setBankAccounts(remoteBanks);
        try {
          localStorage.setItem('greenova_banks_v1', JSON.stringify(remoteBanks));
        } catch {}
      }

      // 4. Egg Productions
      if (eggsRes.status === 'fulfilled' && Array.isArray(eggsRes.value?.data?.items)) {
        const mappedEggs: EggProduction[] = eggsRes.value.data.items.map((r: any) => {
          const fid = String(r.flockId || 8);
          const totalEggs = Number(r.totalEggs || 0);
          const birds = Number(r.birds || (fid === '8' ? 24786 : fid === '9' ? 31739 : 25189));
          return {
            id: String(r.id),
            flockId: fid,
            flockName: r.flock?.flockName || (fid === '9' ? 'Unit 2' : fid === '10' ? 'Unit 3' : 'Unit 1'),
            date: String(r.date).split('T')[0],
            morningEggs: Number(r.morningEggs ?? Math.round(totalEggs * 0.55)),
            eveningEggs: Number(r.eveningEggs ?? Math.max(0, totalEggs - Math.round(totalEggs * 0.55))),
            totalEggs,
            damagedEggs: Number(r.damagedEggs ?? r.brokenEggs ?? 0),
            cleanTrays: Number(r.cleanTrays ?? r.trays ?? Math.floor(totalEggs / 30)),
            layingRatePercent: birds > 0 ? Number(((totalEggs / birds) * 100).toFixed(1)) : 82,
            cartons: r.cartons !== undefined ? Number(r.cartons) : Math.floor(totalEggs / 360),
            looseEggs: r.looseEggs !== undefined ? Number(r.looseEggs) : totalEggs % 30,
            eggGrade: r.eggGrade || r.grade || 'standard',
            avgWeightGrams: Number(r.avgWeightGrams ?? r.averageWeight ?? 60),
            notes: r.notes || '',
          };
        });
        setEggProductions(mappedEggs);
        try {
          localStorage.setItem('greenova_eggs_v3', JSON.stringify(mappedEggs));
        } catch {}
      }

      // 5. Daily Feed & Water Consumptions
      if (consumptionsRes.status === 'fulfilled' && Array.isArray(consumptionsRes.value?.data?.items)) {
        const mappedFeed: FeedConsumption[] = consumptionsRes.value.data.items.map((r: any) => {
          const fid = String(r.flockId || 8);
          const bags = Number(r.bags ?? r.feedConsumed ?? 0);
          const kg = Number(r.feedQuantityKg ?? bags * 50);
          return {
            id: r.clientId || String(r.id),
            trackingId: Number(r.trackingId || r.id) || undefined,
            flockId: fid,
            flockName: r.flock?.flockName || (fid === '9' ? 'Unit 2' : fid === '10' ? 'Unit 3' : 'Unit 1'),
            date: String(r.date).split('T')[0],
            feedType: r.feedType || 'Layer Feed 13',
            feedQuantityKg: kg,
            bags,
            gramsPerBird: Number(r.gramsPerBird || 0),
            waterIntakeLiters: Number(r.waterIntakeLiters ?? r.waterConsumed ?? 0),
            fcrEstimate: 1.95,
            challanNo: r.challanNo || '',
            notes: r.notes || '',
          };
        });
        setConsumptionLogs(mappedFeed);
        try {
          localStorage.setItem('greenova_feed_v4', JSON.stringify(mappedFeed));
        } catch {}
      }

      // 6. Bird Health (Mortality)
      if (healthRes.status === 'fulfilled' && Array.isArray(healthRes.value?.data?.items)) {
        const mappedMort: MortalityLog[] = healthRes.value.data.items.map((r: any) => {
          const fid = String(r.flockId || 8);
          return {
            id: r.clientId || String(r.id),
            flockId: fid,
            flockName: r.flock?.flockName || (fid === '9' ? 'Unit 2' : fid === '10' ? 'Unit 3' : 'Unit 1'),
            date: String(r.date).split('T')[0],
            count: Number(r.mortality ?? 0),
            cause: r.cause || r.notes || 'Daily Mortality',
            symptoms: r.symptoms || r.notes || '',
            recordedBy: r.recordedBy || 'Farm Admin',
          };
        });
        setMortalityLogs(mappedMort);
        try {
          localStorage.setItem('greenova_mortality_v2', JSON.stringify(mappedMort));
        } catch {}
      }

      // 7. Vaccines
      if (vaccinesRes.status === 'fulfilled' && Array.isArray(vaccinesRes.value?.data?.items)) {
        const mappedVaccines: VaccineLog[] = vaccinesRes.value.data.items.map((r: any) => ({
          id: String(r.id),
          flockId: String(r.flockId),
          flockName:
            r.flockName ||
            (String(r.flockId) === '9' ? 'Unit 2' : String(r.flockId) === '10' ? 'Unit 3' : 'Unit 1'),
          vaccineName: r.vaccineName,
          scheduledWeek: Number(r.scheduledWeek || 0),
          scheduledDate: r.scheduledDate || '',
          administeredDate: r.administeredDate || undefined,
          status: (r.status as any) || 'Scheduled',
          method: r.method || 'Drinking Water',
          dosage: r.dosage || '',
          batchNumber: r.batchNumber || '',
          vetNotes: r.vetNotes || '',
        }));
        setVaccines(mappedVaccines);
        try {
          localStorage.setItem('greenova_vaccines_v2', JSON.stringify(mappedVaccines));
        } catch {}
      }

      // 8. Financials (Sales + Expenses merged)
      const salesItems =
        salesRes.status === 'fulfilled' && Array.isArray(salesRes.value?.data?.items)
          ? salesRes.value.data.items
          : null;
      const expenseItems =
        expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value?.data?.items)
          ? expensesRes.value.data.items
          : null;

      if (salesItems && expenseItems) {
        const mappedSales: FinancialRecord[] = salesItems.map((s: any) => {
          const fid = Number(s.flockId) || 8;
          const dateStr = String(s.saleDate || s.date).split('T')[0];
          const cashAmt = Number(s.cashPayment || 0);
          const onlineAmt = Number(s.onlinePayment || 0);
          return {
            id: s.clientId || `sale-${s.id}`,
            trackingId: Number(s.id),
            type: 'Income',
            category: s.head || 'EGG',
            head: s.head || 'EGG',
            amount: Number(s.totalAmount ?? s.amount ?? 0),
            totalAmount: Number(s.totalAmount ?? s.amount ?? 0),
            date: dateStr,
            rawDate: dateStr,
            referenceNo: s.challanNo ? `CH-${s.challanNo}` : `INV-${s.id}`,
            challanNo: s.challanNo || String(s.id),
            flockId: fid,
            flockName: s.flock?.flockName || (fid === 9 ? 'Unit 2' : fid === 10 ? 'Unit 3' : 'Unit 1'),
            partyName: s.partyName || 'Market',
            vehicleNumber: s.vehicleNumber || 'Direct',
            description: s.notes || s.description || `${s.head || 'EGG'} Sale`,
            notes: s.notes || '',
            status: 'Paid',
            paymentMethod:
              s.paymentMethod ||
              (onlineAmt > 0 && cashAmt > 0
                ? 'Split (Online/Cash)'
                : cashAmt > 0
                ? 'Cash Counter'
                : 'Online / Bank'),
            onlinePayment: onlineAmt,
            cashPayment: cashAmt,
            quantity: Number(s.itemsSold ?? s.quantity ?? 0),
            unitPrice: Number(s.rate ?? s.unitPrice ?? 0),
            cartons: s.cartons ?? undefined,
            trays: s.trays ?? undefined,
            looseEggs: s.looseEggs ?? undefined,
            bankId: s.bankId || undefined,
            bankName: s.bankName || undefined,
            attachment: s.attachment || null,
          };
        });

        const mappedExpenses: FinancialRecord[] = expenseItems.map((e: any) => {
          const fid = Number(e.flockId) || 8;
          const dateStr = String(e.expenseDate || e.date).split('T')[0];
          return {
            id: e.clientId || `exp-${e.id}`,
            trackingId: Number(e.id),
            type: 'Expense',
            category: e.head || 'OTHER',
            head: e.head || 'OTHER',
            amount: Number(e.expenseCost ?? e.amount ?? 0),
            expenseCost: Number(e.expenseCost ?? e.amount ?? 0),
            date: dateStr,
            rawDate: dateStr,
            referenceNo: e.challanNo ? `CH-${e.challanNo}` : `EXP-${e.id}`,
            challanNo: e.challanNo || String(e.id),
            flockId: fid,
            flockName: e.flock?.flockName || (fid === 9 ? 'Unit 2' : fid === 10 ? 'Unit 3' : 'Unit 1'),
            description: e.notes || e.description || e.head || 'Expense',
            notes: e.notes || '',
            status: 'Paid',
            attachment: e.attachment || null,
          };
        });

        const mergedFin = [...mappedSales, ...mappedExpenses].sort((a, b) => {
          const cmp = String(b.date).localeCompare(String(a.date));
          if (cmp !== 0) return cmp;
          return (Number(b.trackingId) || 0) - (Number(a.trackingId) || 0);
        });
        setFinancials(mergedFin);
        try {
          localStorage.setItem('greenova_financials_v3', JSON.stringify(mergedFin));
        } catch {}
      }

      // 9. Salaries & Advances
      if (salariesRes.status === 'fulfilled' && Array.isArray(salariesRes.value?.data?.items)) {
        const allSal = salariesRes.value.data.items;
        const mappedAdv: AdvanceSalaryRecord[] = allSal
          .filter((s: any) => s.recordType === 'advance')
          .map((s: any) => ({
            id: String(s.id),
            employeeName: s.employeeName,
            designation: s.designation || 'Farm Staff',
            flockId: String(s.flockId || 9),
            flockName: s.flockName || 'Unit 2',
            advanceAmount: Number(s.advanceAmount ?? s.advance ?? 0),
            date: s.date || s.paymentDate || '',
            challanNo: s.challanNo || '',
            repaymentStatus: (s.repaymentStatus as any) || 'Pending',
            deductedAmount: Number(s.deductedAmount ?? s.deduction ?? 0),
            remainingBalance: Number(s.remainingBalance ?? 0),
            remarks: s.remarks || '',
          }));

        const mappedDisbursals: SalaryDisbursal[] = allSal
          .filter((s: any) => s.recordType !== 'advance' && (s.recordType === 'salary_disbursal' || Number(s.netSalaryPaid || s.salaryAmount || 0) > 0))
          .map((s: any) => ({
            id: String(s.id),
            employeeName: s.employeeName,
            designation: s.designation || 'Farm Staff',
            flockId: String(s.flockId || 9),
            flockName: s.flockName || 'Unit 2',
            basicSalary: Number(s.basicSalary ?? s.salaryAmount ?? 0),
            advanceDeducted: Number(s.advanceDeducted ?? s.advance ?? 0),
            allowanceBonus: 0,
            penaltyDeduction: Number(s.deduction ?? 0),
            netSalaryPaid: Number(s.netSalaryPaid ?? s.salaryAmount ?? 0),
            totalSalary: Number(s.totalSalary ?? s.total ?? s.salaryAmount ?? 0),
            paymentDate: s.paymentDate || s.date || '',
            paymentMethod: (s.paymentMethod as any) || 'Cash',
            status: s.status === 'Pending' ? 'Pending' : 'Paid',
            remarks: s.remarks || '',
            challanNo: s.challanNo || '',
            month: s.month || '',
          }));

        setSalaryDisbursals(mappedDisbursals);
        try {
          localStorage.setItem('greenova_salaries_v3', JSON.stringify(mappedDisbursals));
        } catch {}
        setAdvanceRecords(mappedAdv);
        try {
          localStorage.setItem('greenova_advances_v3', JSON.stringify(mappedAdv));
        } catch {}
      }

      // 10. Staff Workers
      if (workersRes.status === 'fulfilled' && Array.isArray(workersRes.value?.data?.items)) {
        const mappedWorkers: Worker[] = workersRes.value.data.items;
        setWorkers(mappedWorkers);
        try {
          localStorage.setItem('greenova_staff_v2', JSON.stringify(mappedWorkers));
        } catch {}
      }
    };

    hydrateAllFromDb();
    return () => {
      active = false;
    };
  }, [currentUser?.token]);

  // Action handlers (awaited against PostgreSQL before UI confirmation / reload)
  const handleAddEgg = async (newEgg: EggProduction) => {
    const numFid =
      Number(newEgg.flockId) ||
      (newEgg.flockName?.includes('2') ? 9 : newEgg.flockName?.includes('3') ? 10 : 8);
    try {
      const res = await apiFetch('/api/egg-production', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newEgg.id,
          date: newEgg.date,
          flockId: numFid,
          totalEggs: newEgg.totalEggs,
          morningEggs: newEgg.morningEggs,
          eveningEggs: newEgg.eveningEggs,
          brokenEggs: newEgg.damagedEggs,
          cartons: newEgg.cartons ?? Math.floor(newEgg.totalEggs / 360),
          trays: newEgg.cleanTrays,
          eggs: newEgg.looseEggs ?? newEgg.totalEggs % 30,
          averageWeight: newEgg.avgWeightGrams ?? 60,
          grade: newEgg.eggGrade ?? 'standard',
          notes: newEgg.notes || `Morning: ${newEgg.morningEggs}, Evening: ${newEgg.eveningEggs}`,
        }),
      });

      const canonicalId = String(res?.data?.id || newEgg.id);
      const finalEgg: EggProduction = { ...newEgg, id: canonicalId };
      setEggProductions((prev) => {
        const next = [finalEgg, ...prev];
        try {
          localStorage.setItem('greenova_eggs_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
      triggerSavedRefresh(
        `${finalEgg.totalEggs.toLocaleString()} eggs logged for ${finalEgg.flockName}. Refreshing page...`
      );
    } catch (err) {
      reportError(err, 'Failed to save egg production record.');
    }
  };

  const handleAddFeed = async (newFeed: FeedConsumption) => {
    const numFid =
      Number(newFeed.flockId) ||
      (newFeed.flockName?.includes('2') ? 9 : newFeed.flockName?.includes('3') ? 10 : 8);
    try {
      const res = await apiFetch('/api/daily-consumption', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newFeed.id,
          trackingId: newFeed.trackingId,
          challanNo: newFeed.challanNo,
          date: newFeed.date,
          flockId: numFid,
          bags: newFeed.bags || Math.round((newFeed.feedQuantityKg || 0) / 50),
          feedConsumed: newFeed.bags || Math.round((newFeed.feedQuantityKg || 0) / 50),
          feedQuantityKg: newFeed.feedQuantityKg,
          gramsPerBird: newFeed.gramsPerBird,
          waterIntakeLiters: newFeed.waterIntakeLiters || 0,
          waterConsumption: newFeed.waterIntakeLiters || 0,
          feedType: newFeed.feedType,
          notes: newFeed.notes || '',
        }),
      });
      const canonicalFeed: FeedConsumption = {
        ...newFeed,
        trackingId: Number(res?.data?.id) || newFeed.trackingId,
      };
      const nextLogs = [canonicalFeed, ...consumptionLogs];
      setConsumptionLogs(nextLogs);
      try {
        localStorage.setItem('greenova_feed_v4', JSON.stringify(nextLogs));
      } catch {}
      triggerSavedRefresh(`Feed & water record logged for ${newFeed.flockName}. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to save daily feed consumption record.');
    }
  };

  const handleEditFeed = async (updatedFeed: FeedConsumption) => {
    const numFid =
      Number(updatedFeed.flockId) ||
      (updatedFeed.flockName?.includes('2') ? 9 : updatedFeed.flockName?.includes('3') ? 10 : 8);
    const resolvedId = updatedFeed.trackingId || updatedFeed.id;

    try {
      await apiFetch(`/api/daily-consumption/${resolvedId}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: updatedFeed.id,
          date: updatedFeed.date,
          flockId: numFid,
          flockName: updatedFeed.flockName,
          feedType: updatedFeed.feedType,
          bags: updatedFeed.bags,
          feedConsumed: updatedFeed.bags || Math.round((updatedFeed.feedQuantityKg || 0) / 50),
          feedQuantityKg: updatedFeed.feedQuantityKg,
          gramsPerBird: updatedFeed.gramsPerBird,
          waterIntakeLiters: updatedFeed.waterIntakeLiters,
          waterConsumed: updatedFeed.waterIntakeLiters,
          challanNo: updatedFeed.challanNo,
          notes: updatedFeed.notes || '',
        }),
      });
      setConsumptionLogs((prev) => {
        const next = prev.map((c) => (String(c.id) === String(updatedFeed.id) ? updatedFeed : c));
        try {
          localStorage.setItem('greenova_feed_v4', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update feed consumption record.');
      throw err;
    }
  };

  const handleAddMortality = async (newMort: MortalityLog) => {
    const isFlockMatchMort = (f: Flock) =>
      String(f.id) === String(newMort.flockId) ||
      (newMort.flockName && f.name.toLowerCase().includes(newMort.flockName.toLowerCase())) ||
      (String(newMort.flockId) === '8' && (f.name.includes('Unit 1') || f.shedNumber === 'Shed 1')) ||
      (String(newMort.flockId) === '9' && (f.name.includes('Unit 2') || f.shedNumber === 'Shed 2')) ||
      (String(newMort.flockId) === '10' && (f.name.includes('Unit 3') || f.shedNumber === 'Shed 3'));

    const nowIso = new Date().toISOString();
    const updatedFlocks = flocks.map((f) => {
      if (isFlockMatchMort(f)) {
        return {
          ...f,
          currentCount: Math.max(0, f.currentCount - newMort.count),
          mortality: (f.mortality || 0) + newMort.count,
          updatedAt: nowIso,
        };
      }
      return f;
    });
    const matchedFlock = updatedFlocks.find(isFlockMatchMort);
    const numFid =
      Number(matchedFlock?.id || newMort.flockId) ||
      (newMort.flockId === '8' ? 8 : newMort.flockId === '9' ? 9 : 10);

    try {
      const res = await apiFetch('/api/bird-health', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newMort.id,
          date: newMort.date,
          flockId: numFid,
          mortality: newMort.count,
          notes: newMort.symptoms || newMort.cause,
          cause: newMort.cause,
          symptoms: newMort.symptoms || '',
          recordedBy: newMort.recordedBy || 'Farm Admin',
          flockTotalBirds: matchedFlock?.currentCount,
          flockMortality: matchedFlock?.mortality,
        }),
      });

      const canonicalMort: MortalityLog = {
        ...newMort,
        id: res?.data?.clientId || (res?.data?.id ? String(res.data.id) : newMort.id),
      };
      const updatedMortLogs = [canonicalMort, ...mortalityLogs];
      setMortalityLogs(updatedMortLogs);
      setFlocks(updatedFlocks);
      try {
        localStorage.setItem('greenova_mortality_v2', JSON.stringify(updatedMortLogs));
        localStorage.setItem('greenova_flocks', JSON.stringify(updatedFlocks));
      } catch {}

      triggerSavedRefresh(`Mortality record logged for ${newMort.flockName}. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to save mortality record.');
    }
  };

  const handleEditMortality = async (updatedMort: MortalityLog) => {
    const prevMort = mortalityLogs.find((m) => String(m.id) === String(updatedMort.id));
    const prevCount = Number(prevMort?.count) || 0;
    const newCount = Number(updatedMort.count) || 0;
    const isMatch = (f: Flock, fid?: string, fname?: string) =>
      String(f.id) === String(fid || '') ||
      (fname && f.name.toLowerCase().includes(fname.toLowerCase())) ||
      (String(fid) === '8' && (f.name.includes('Unit 1') || f.shedNumber === 'Shed 1')) ||
      (String(fid) === '9' && (f.name.includes('Unit 2') || f.shedNumber === 'Shed 2')) ||
      (String(fid) === '10' && (f.name.includes('Unit 3') || f.shedNumber === 'Shed 3'));

    const oldFlockId = prevMort?.flockId || updatedMort.flockId;
    const oldFlockName = prevMort?.flockName || updatedMort.flockName;
    const sameFlock =
      String(oldFlockId) === String(updatedMort.flockId) &&
      (!oldFlockName || oldFlockName === updatedMort.flockName);

    const nowIso = new Date().toISOString();
    const touchedFlocks: Flock[] = [];
    const updatedFlocks = flocks.map((f) => {
      if (sameFlock) {
        if (isMatch(f, updatedMort.flockId, updatedMort.flockName)) {
          const delta = newCount - prevCount;
          if (delta !== 0) {
            const nextF = {
              ...f,
              currentCount: Math.max(0, (f.currentCount || 0) - delta),
              mortality: Math.max(0, (f.mortality || 0) + delta),
              updatedAt: nowIso,
            };
            touchedFlocks.push(nextF);
            return nextF;
          }
        }
        return f;
      }

      if (isMatch(f, oldFlockId, oldFlockName)) {
        const nextF = {
          ...f,
          currentCount: (f.currentCount || 0) + prevCount,
          mortality: Math.max(0, (f.mortality || 0) - prevCount),
          updatedAt: nowIso,
        };
        touchedFlocks.push(nextF);
        return nextF;
      }
      if (isMatch(f, updatedMort.flockId, updatedMort.flockName)) {
        const nextF = {
          ...f,
          currentCount: Math.max(0, (f.currentCount || 0) - newCount),
          mortality: (f.mortality || 0) + newCount,
          updatedAt: nowIso,
        };
        touchedFlocks.push(nextF);
        return nextF;
      }
      return f;
    });

    const numFid =
      Number(updatedMort.flockId) ||
      (updatedMort.flockName?.includes('2') ? 9 : updatedMort.flockName?.includes('3') ? 10 : 8);

    try {
      await apiFetch(`/api/bird-health/${updatedMort.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: updatedMort.id,
          date: updatedMort.date,
          flockId: numFid,
          flockName: updatedMort.flockName,
          mortality: newCount,
          count: newCount,
          cause: updatedMort.cause,
          symptoms: updatedMort.symptoms || '',
          notes: updatedMort.symptoms || updatedMort.cause,
          recordedBy: updatedMort.recordedBy || 'Farm Admin',
        }),
      });

      if (touchedFlocks.length > 0) {
        await Promise.all(
          touchedFlocks.map((mf) =>
            apiFetch(`/api/flock/${mf.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                flockName: mf.name,
                totalBirds: mf.currentCount,
                originalTotalBirds: mf.initialCount,
                mortality: mf.mortality || 0,
                isActive: mf.status === 'Active',
              }),
            })
          )
        );
        setFlocks(updatedFlocks);
        try {
          localStorage.setItem('greenova_flocks', JSON.stringify(updatedFlocks));
        } catch {}
      }

      const nextLogs = mortalityLogs.map((m) =>
        String(m.id) === String(updatedMort.id) ? updatedMort : m
      );
      setMortalityLogs(nextLogs);
      try {
        localStorage.setItem('greenova_mortality_v2', JSON.stringify(nextLogs));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to update mortality record.');
      throw err;
    }
  };

  const handleEditEgg = async (updatedEgg: EggProduction) => {
    const resolvedId = encodeURIComponent(
      String((updatedEgg as any).trackingId || updatedEgg.id)
    );
    try {
      await apiFetch(`/api/egg-production/${resolvedId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedEgg),
      });
      setEggProductions((prev) => {
        const next = prev.map((e) => (String(e.id) === String(updatedEgg.id) ? updatedEgg : e));
        try {
          localStorage.setItem('greenova_eggs_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update egg production record.');
      throw err;
    }
  };

  const handleDeleteEgg = async (id: string) => {
    const resolvedId = encodeURIComponent(String(id));
    try {
      await apiFetch(`/api/egg-production/${resolvedId}`, { method: 'DELETE' });
      setEggProductions((prev) => {
        const next = prev.filter((e) => String(e.id) !== String(id));
        try {
          localStorage.setItem('greenova_eggs_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete egg production record.');
      throw err;
    }
  };

  const handleDeleteFeed = async (log: FeedConsumption) => {
    const resolvedId = encodeURIComponent(String(log.trackingId || log.id));
    try {
      await apiFetch(`/api/daily-consumption/${resolvedId}`, { method: 'DELETE' });
      setConsumptionLogs((prev) => {
        const next = prev.filter((c) => String(c.id) !== String(log.id));
        try {
          localStorage.setItem('greenova_feed_v4', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete daily consumption record.');
      throw err;
    }
  };

  const handleDeleteMortality = async (log: MortalityLog) => {
    const isMatch = (f: Flock) =>
      String(f.id) === String(log.flockId) ||
      (log.flockName && f.name.toLowerCase().includes(log.flockName.toLowerCase())) ||
      (String(log.flockId) === '8' && (f.name.includes('Unit 1') || f.shedNumber === 'Shed 1')) ||
      (String(log.flockId) === '9' && (f.name.includes('Unit 2') || f.shedNumber === 'Shed 2')) ||
      (String(log.flockId) === '10' && (f.name.includes('Unit 3') || f.shedNumber === 'Shed 3'));
    try {
      await apiFetch(`/api/bird-health/${encodeURIComponent(String(log.id))}`, { method: 'DELETE' });
      const countToRestore = Number(log.count) || 0;
      if (countToRestore > 0) {
        const matched = flocks.find(isMatch);
        if (matched) {
          const restoredFlock: Flock = {
            ...matched,
            currentCount: (matched.currentCount || 0) + countToRestore,
            mortality: Math.max(0, (matched.mortality || 0) - countToRestore),
            updatedAt: new Date().toISOString(),
          };
          await apiFetch(`/api/flock/${restoredFlock.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              flockName: restoredFlock.name,
              totalBirds: restoredFlock.currentCount,
              originalTotalBirds: restoredFlock.initialCount,
              mortality: restoredFlock.mortality,
              isActive: restoredFlock.status === 'Active',
            }),
          });
          setFlocks((prev) => {
            const nextF = prev.map((f) => (f.id === restoredFlock.id ? restoredFlock : f));
            try {
              localStorage.setItem('greenova_flocks', JSON.stringify(nextF));
            } catch {}
            return nextF;
          });
        }
      }
      setMortalityLogs((prev) => {
        const next = prev.filter((m) => String(m.id) !== String(log.id));
        try {
          localStorage.setItem('greenova_mortality_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete mortality record.');
      throw err;
    }
  };

  const handleEditTransaction = async (updatedTx: FinancialRecord) => {
    const isSale = updatedTx.type === 'Income';
    const resolvedId = encodeURIComponent(String((updatedTx as any).trackingId || updatedTx.id));
    const endpoint = isSale ? `/api/sales/${resolvedId}` : `/api/expenses/${resolvedId}`;

    try {
      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updatedTx),
      });
      setFinancials((prev) => {
        const next = prev.map((f) => (String(f.id) === String(updatedTx.id) ? updatedTx : f));
        try {
          localStorage.setItem('greenova_financials_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update financial transaction.');
      throw err;
    }
  };

  const handleDeleteTransaction = async (record: FinancialRecord) => {
    const isSale = record.type === 'Income';
    const resolvedId = encodeURIComponent(String((record as any).trackingId || record.id));
    const endpoint = isSale ? `/api/sales/${resolvedId}` : `/api/expenses/${resolvedId}`;

    try {
      await apiFetch(endpoint, { method: 'DELETE' });
      setFinancials((prev) => {
        const next = prev.filter((f) => String(f.id) !== String(record.id));
        try {
          localStorage.setItem('greenova_financials_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete financial transaction.');
      throw err;
    }
  };

  const handleAddVaccine = async (newVaccine: VaccineLog) => {
    try {
      const res = await apiFetch('/api/vaccines', {
        method: 'POST',
        body: JSON.stringify({ ...newVaccine, clientId: newVaccine.id }),
      });
      const canonicalVaccine: VaccineLog = {
        ...newVaccine,
        id: res?.data?.clientId || (res?.data?.id ? String(res.data.id) : newVaccine.id),
      };
      setVaccines((prev) => {
        const next = [canonicalVaccine, ...prev];
        try {
          localStorage.setItem('greenova_vaccines_v2', JSON.stringify(next));
        } catch {}
        return next;
      });

      const isMed =
        canonicalVaccine.vaccineName.toLowerCase().includes('medicin') ||
        canonicalVaccine.vaccineName.toLowerCase().includes('antibiotic') ||
        canonicalVaccine.vaccineName.toLowerCase().includes('vitamin') ||
        canonicalVaccine.vaccineName.toLowerCase().includes('tonic') ||
        canonicalVaccine.vaccineName.toLowerCase().includes('powder') ||
        canonicalVaccine.vaccineName.toLowerCase().includes('dewormer');

      setLatestHealthPrompt({
        id: canonicalVaccine.id,
        title: canonicalVaccine.vaccineName,
        message: `${canonicalVaccine.flockName || 'Layer Shed'} • ${canonicalVaccine.method || 'Standard'} • ${canonicalVaccine.dosage || ''}`,
        date: canonicalVaccine.scheduledDate || new Date().toISOString().split('T')[0],
        flockName: canonicalVaccine.flockName || 'Unit 1',
        status: canonicalVaccine.status as any,
        method: canonicalVaccine.method,
        dosage: canonicalVaccine.dosage,
        type: isMed ? 'medicine' : 'vaccine',
        isNew: true,
      });
      triggerSavedRefresh(
        `${canonicalVaccine.vaccineName} scheduled for ${canonicalVaccine.flockName}. Refreshing page...`
      );
    } catch (err) {
      reportError(err, 'Failed to save vaccine schedule.');
    }
  };

  const handleEditVaccine = async (updatedVaccine: VaccineLog) => {
    try {
      await apiFetch(`/api/vaccines/${updatedVaccine.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedVaccine),
      });
      setVaccines((prev) => {
        const next = prev.map((v) => (v.id === updatedVaccine.id ? updatedVaccine : v));
        try {
          localStorage.setItem('greenova_vaccines_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (latestHealthPrompt?.id === updatedVaccine.id) {
        setLatestHealthPrompt(null);
      }
    } catch (err) {
      reportError(err, 'Failed to update vaccine schedule.');
      throw err;
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    try {
      await apiFetch(`/api/vaccines/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
      setVaccines((prev) => {
        const next = prev.filter((v) => v.id !== id);
        try {
          localStorage.setItem('greenova_vaccines_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (latestHealthPrompt?.id === id) {
        setLatestHealthPrompt(null);
      }
    } catch (err) {
      reportError(err, 'Failed to delete vaccine schedule.');
      throw err;
    }
  };

  const handleAddFlock = async (flock: Flock) => {
    try {
      const res = await apiFetch('/api/flock', {
        method: 'POST',
        body: JSON.stringify({
          id: Number(flock.id) || undefined,
          flockName: flock.name,
          breed: flock.breed,
          shedNumber: flock.shedNumber,
          totalBirds: flock.currentCount || flock.initialCount,
          originalTotalBirds: flock.initialCount,
          mortality: flock.mortality || 0,
          ageWeeks: flock.ageWeeks,
          isActive: flock.status === 'Active',
          acquiredDate: flock.startDate,
          cost: flock.cost || 7500000,
          notes: flock.notes || '',
        }),
      });
      const canonicalId = String(res?.data?.id || flock.id);
      const stampedFlock: Flock = {
        ...flock,
        id: canonicalId,
        updatedAt: new Date().toISOString(),
      };
      const nextFlocks = [...flocks, stampedFlock];
      setFlocks(nextFlocks);
      try {
        localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
      } catch {}

      if (flock.mortality && flock.mortality > 0) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const mortEntry: MortalityLog = {
          id: `mort-flock-${Date.now()}`,
          flockId: canonicalId,
          flockName: flock.name,
          date: todayStr,
          count: flock.mortality,
          cause: 'Initial Flock Mortality Entry',
          symptoms: 'Recorded when creating flock',
          recordedBy: currentUser?.name || 'Farm Admin',
        };
        await apiFetch('/api/bird-health', {
          method: 'POST',
          body: JSON.stringify({
            clientId: mortEntry.id,
            date: todayStr,
            flockId: Number(canonicalId) || 8,
            mortality: flock.mortality,
            cause: mortEntry.cause,
            symptoms: mortEntry.symptoms,
            recordedBy: mortEntry.recordedBy,
            skipFlockAdjust: true,
          }),
        });
        const nextMorts = [mortEntry, ...mortalityLogs];
        setMortalityLogs(nextMorts);
        try {
          localStorage.setItem('greenova_mortality_v2', JSON.stringify(nextMorts));
        } catch {}
      }

      triggerSavedRefresh(`Flock "${flock.name}" added. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to create flock.');
    }
  };

  const handleEditFlock = async (updatedFlock: Flock) => {
    const prevFlock = flocks.find((f) => String(f.id) === String(updatedFlock.id));
    const prevMort = prevFlock?.mortality || 0;
    const newMort = updatedFlock.mortality || 0;
    const mortDelta = newMort - prevMort;

    try {
      await apiFetch(`/api/flock/${updatedFlock.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          flockName: updatedFlock.name,
          farmName: updatedFlock.farmName,
          shedNumber: updatedFlock.shedNumber,
          breed: updatedFlock.breed,
          totalBirds: updatedFlock.currentCount,
          originalTotalBirds: updatedFlock.initialCount,
          ageWeeks: updatedFlock.ageWeeks,
          isActive: updatedFlock.status === 'Active',
          acquiredDate: updatedFlock.startDate,
          mortality: updatedFlock.mortality || 0,
          notes: updatedFlock.notes || '',
        }),
      });

      const stampedFlock: Flock = { ...updatedFlock, updatedAt: new Date().toISOString() };
      const nextFlocks = flocks.map((f) =>
        String(f.id) === String(updatedFlock.id) ? stampedFlock : f
      );
      setFlocks(nextFlocks);
      try {
        localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
      } catch {}

      if (mortDelta !== 0) {
        try {
          const freshHealth = await apiFetch('/api/bird-health');
          if (Array.isArray(freshHealth?.data?.items)) {
            const mappedMort: MortalityLog[] = freshHealth.data.items.map((r: any) => {
              const fid = String(r.flockId || 8);
              return {
                id: r.clientId || String(r.id),
                flockId: fid,
                flockName:
                  r.flock?.flockName ||
                  (fid === '9' ? 'Unit 2' : fid === '10' ? 'Unit 3' : 'Unit 1'),
                date: String(r.date).split('T')[0],
                count: Number(r.mortality ?? 0),
                cause: r.cause || r.notes || 'Daily Mortality',
                symptoms: r.symptoms || r.notes || '',
                recordedBy: r.recordedBy || 'Farm Admin',
              };
            });
            setMortalityLogs(mappedMort);
            try {
              localStorage.setItem('greenova_mortality_v2', JSON.stringify(mappedMort));
            } catch {}
          }
        } catch {
          // Offline fallback reconciliation
          if (mortDelta > 0) {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const newLog: MortalityLog = {
              id: `mort-flock-${Date.now()}`,
              flockId: updatedFlock.id,
              flockName: updatedFlock.name,
              date: todayStr,
              count: mortDelta,
              cause: 'Recorded in Flock Management',
              symptoms: `Flock mortality updated (${prevMort} -> ${newMort})`,
              recordedBy: currentUser?.name || 'Farm Admin',
            };
            const nextMorts = [newLog, ...mortalityLogs];
            setMortalityLogs(nextMorts);
            try {
              localStorage.setItem('greenova_mortality_v2', JSON.stringify(nextMorts));
            } catch {}
          }
        }
      }
    } catch (err) {
      reportError(err, 'Failed to update flock details.');
    }
  };

  const handleDeleteFlock = async (id: string) => {
    try {
      await apiFetch(`/api/flock/${id}`, { method: 'DELETE' });
      const nextFlocks = flocks.filter((f) => f.id !== id);
      setFlocks(nextFlocks);
      try {
        localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to delete flock.');
    }
  };

  const handleToggleVaccine = async (id: string) => {
    const target = vaccines.find((v) => v.id === id);
    if (!target) return;
    const updatedVaccine: VaccineLog = {
      ...target,
      status: (target.status === 'Completed' ? 'Scheduled' : 'Completed') as any,
      administeredDate:
        target.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0],
    };
    try {
      await apiFetch(`/api/vaccines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedVaccine),
      });
      setVaccines((prev) => {
        const updated = prev.map((v) => (v.id === id ? updatedVaccine : v));
        try {
          localStorage.setItem('greenova_vaccines_v2', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      reportError(err, 'Failed to update vaccine status.');
    }
  };

  const handleRestock = (id: string, amount: number) => {
    const nextInv = inventory.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + amount } : item
    );
    setInventory(nextInv);
    try {
      localStorage.setItem('greenova_inventory', JSON.stringify(nextInv));
    } catch {}
  };

  const handleAddTransaction = async (record: FinancialRecord) => {
    const isExp = record.type === 'Expense';
    const numFid =
      Number(record.flockId) ||
      (record.flockName?.includes('2') ? 9 : record.flockName?.includes('3') ? 10 : 8);

    try {
      const res = await apiFetch(isExp ? '/api/expense' : '/api/sale', {
        method: 'POST',
        body: JSON.stringify({
          clientId: record.id,
          amount: record.amount,
          expenseCost: record.amount,
          totalAmount: record.amount,
          head: isExp
            ? (record.head || record.category || 'OTHER').toUpperCase().replace(/\s+/g, '_')
            : record.head || record.category || 'EGG',
          notes: record.notes || record.description || '',
          flockId: numFid,
          flockName: record.flockName,
          challanNo: record.challanNo || record.referenceNo || '0',
          cashPayment: record.cashPayment || 0,
          onlinePayment: record.onlinePayment || 0,
          itemsSold: record.quantity || 0,
          rate: record.unitPrice || 17.5,
          unitPrice: record.unitPrice || 17.5,
          partyName: record.partyName || '',
          vehicleNumber: record.vehicleNumber || 'Direct',
          cartons: record.cartons,
          trays: record.trays,
          looseEggs: record.looseEggs,
          bankId: record.bankId || undefined,
          bankName: record.bankName || undefined,
          paymentMethod: record.paymentMethod || undefined,
          attachment: record.attachment || null,
          date: record.date,
        }),
      });

      const canonicalTrackingId = Number(res?.data?.id) || record.trackingId;
      const savedRecord: FinancialRecord = {
        ...record,
        trackingId: canonicalTrackingId,
      };
      const nextFinancials = [savedRecord, ...financials];
      setFinancials(nextFinancials);
      try {
        localStorage.setItem('greenova_financials_v3', JSON.stringify(nextFinancials));
      } catch {}

      triggerSavedRefresh(
        `${isExp ? 'Expense record' : 'Sale record'} (Rs. ${Number(record.amount).toLocaleString()}) saved. Refreshing page...`
      );
    } catch (err) {
      reportError(err, `Failed to save ${isExp ? 'expense' : 'sale'} record.`);
      throw err;
    }
  };

  const handleAddSalaryDisbursal = async (newSalary: SalaryDisbursal) => {
    try {
      const res = await apiFetch('/api/salaries', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newSalary.id,
          recordType: 'salary_disbursal',
          employeeName: newSalary.employeeName,
          designation: newSalary.designation,
          flockId: Number(newSalary.flockId) || 9,
          flockName: newSalary.flockName,
          basicSalary: newSalary.basicSalary,
          salaryAmount: newSalary.netSalaryPaid,
          netSalaryPaid: newSalary.netSalaryPaid,
          total: newSalary.totalSalary,
          totalSalary: newSalary.totalSalary,
          advance: newSalary.advanceDeducted,
          deduction: newSalary.penaltyDeduction || 0,
          date: newSalary.paymentDate,
          paymentDate: newSalary.paymentDate,
          month: newSalary.month,
          challanNo: newSalary.challanNo,
          paymentMethod: newSalary.paymentMethod,
          status: newSalary.status,
          remarks: newSalary.remarks || '',
        }),
      });

      const savedSalary: SalaryDisbursal = {
        ...newSalary,
        id: res?.data?.clientId || (res?.data?.id ? String(res.data.id) : newSalary.id),
      };
      const nextSalaries = [savedSalary, ...salaryDisbursals];
      setSalaryDisbursals(nextSalaries);
      try {
        localStorage.setItem('greenova_salaries_v3', JSON.stringify(nextSalaries));
      } catch {}

      if (newSalary.advanceDeducted > 0) {
        const matchedWorker = workers.find(
          (w) => w.name.toLowerCase() === newSalary.employeeName.toLowerCase()
        );
        if (matchedWorker) {
          const updatedWorker: Worker = {
            ...matchedWorker,
            advanceBalance: Math.max(
              0,
              (matchedWorker.advanceBalance || 0) - newSalary.advanceDeducted
            ),
          };
          await apiFetch(`/api/workers/${updatedWorker.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedWorker),
          });
          setWorkers((prev) => {
            const nextWorkers = prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w));
            try {
              localStorage.setItem('greenova_staff_v2', JSON.stringify(nextWorkers));
            } catch {}
            return nextWorkers;
          });
        }
      }

      triggerSavedRefresh(
        `Salary disbursal for ${newSalary.employeeName} saved. Refreshing page...`
      );
    } catch (err) {
      reportError(err, 'Failed to save salary disbursal.');
    }
  };

  const handleAddAdvanceRecord = async (newAdvance: AdvanceSalaryRecord) => {
    try {
      const res = await apiFetch('/api/salaries', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newAdvance.id,
          recordType: 'advance',
          employeeName: newAdvance.employeeName,
          designation: newAdvance.designation,
          flockId: Number(newAdvance.flockId) || 9,
          flockName: newAdvance.flockName,
          salaryAmount: 0,
          advance: newAdvance.advanceAmount,
          advanceAmount: newAdvance.advanceAmount,
          deduction: newAdvance.deductedAmount || 0,
          remainingBalance: newAdvance.remainingBalance,
          total: newAdvance.advanceAmount,
          date: newAdvance.date,
          challanNo: newAdvance.challanNo || '',
          repaymentStatus: newAdvance.repaymentStatus,
          remarks: newAdvance.remarks || '',
        }),
      });

      const savedAdv: AdvanceSalaryRecord = {
        ...newAdvance,
        id: res?.data?.clientId || (res?.data?.id ? String(res.data.id) : newAdvance.id),
      };
      const nextAdv = [savedAdv, ...advanceRecords];
      setAdvanceRecords(nextAdv);
      try {
        localStorage.setItem('greenova_advances_v3', JSON.stringify(nextAdv));
      } catch {}

      const matchedWorker = workers.find(
        (w) => w.name.toLowerCase() === newAdvance.employeeName.toLowerCase()
      );
      if (matchedWorker) {
        const updatedWorker: Worker = {
          ...matchedWorker,
          advanceBalance: (matchedWorker.advanceBalance || 0) + newAdvance.advanceAmount,
        };
        await apiFetch(`/api/workers/${updatedWorker.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedWorker),
        });
        setWorkers((prev) => {
          const nextWorkers = prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w));
          try {
            localStorage.setItem('greenova_staff_v2', JSON.stringify(nextWorkers));
          } catch {}
          return nextWorkers;
        });
      }

      triggerSavedRefresh(`Advance record for ${newAdvance.employeeName} saved. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to save salary advance record.');
    }
  };

  const handleAddWorker = async (newWorker: Worker) => {
    try {
      await apiFetch('/api/workers', {
        method: 'POST',
        body: JSON.stringify(newWorker),
      });
      setWorkers((prev) => {
        const next = [newWorker, ...prev];
        try {
          localStorage.setItem('greenova_staff_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
      triggerSavedRefresh(`Staff member "${newWorker.name}" added. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to register staff member.');
    }
  };

  const handleUpdateWorker = async (updatedWorker: Worker) => {
    try {
      await apiFetch(`/api/workers/${updatedWorker.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedWorker),
      });
      setWorkers((prev) => {
        const next = prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w));
        try {
          localStorage.setItem('greenova_staff_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update staff record.');
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      await apiFetch(`/api/workers/${id}`, { method: 'DELETE' });
      setWorkers((prev) => {
        const next = prev.filter((w) => String(w.id) !== String(id));
        try {
          localStorage.setItem('greenova_staff_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete staff member.');
      throw err;
    }
  };

  const handleEditSalaryDisbursal = async (updatedSalary: SalaryDisbursal) => {
    try {
      await apiFetch(`/api/salaries/${updatedSalary.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          recordType: 'salary_disbursal',
          employeeName: updatedSalary.employeeName,
          designation: updatedSalary.designation,
          flockId: Number(updatedSalary.flockId) || 9,
          flockName: updatedSalary.flockName,
          basicSalary: updatedSalary.basicSalary,
          salaryAmount: updatedSalary.netSalaryPaid,
          netSalaryPaid: updatedSalary.netSalaryPaid,
          total: updatedSalary.totalSalary,
          totalSalary: updatedSalary.totalSalary,
          advance: updatedSalary.advanceDeducted,
          advanceDeducted: updatedSalary.advanceDeducted,
          allowanceBonus: updatedSalary.allowanceBonus || 0,
          penaltyDeduction: updatedSalary.penaltyDeduction || 0,
          deduction: updatedSalary.penaltyDeduction || 0,
          date: updatedSalary.paymentDate,
          paymentDate: updatedSalary.paymentDate,
          month: updatedSalary.month,
          challanNo: updatedSalary.challanNo,
          paymentMethod: updatedSalary.paymentMethod,
          status: updatedSalary.status,
          remarks: updatedSalary.remarks || '',
        }),
      });
      setSalaryDisbursals((prev) => {
        const next = prev.map((s) =>
          String(s.id) === String(updatedSalary.id) ? updatedSalary : s
        );
        try {
          localStorage.setItem('greenova_salaries_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update salary disbursal.');
      throw err;
    }
  };

  const handleDeleteSalaryDisbursal = async (id: string) => {
    try {
      await apiFetch(`/api/salaries/${id}`, { method: 'DELETE' });
      setSalaryDisbursals((prev) => {
        const next = prev.filter((s) => String(s.id) !== String(id));
        try {
          localStorage.setItem('greenova_salaries_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete salary disbursal.');
      throw err;
    }
  };

  const handleEditAdvanceRecord = async (updatedAdvance: AdvanceSalaryRecord) => {
    try {
      await apiFetch(`/api/salaries/${updatedAdvance.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          recordType: 'advance',
          employeeName: updatedAdvance.employeeName,
          designation: updatedAdvance.designation,
          flockId: Number(updatedAdvance.flockId) || 9,
          flockName: updatedAdvance.flockName,
          salaryAmount: 0,
          advance: updatedAdvance.advanceAmount,
          advanceAmount: updatedAdvance.advanceAmount,
          deductedAmount: updatedAdvance.deductedAmount || 0,
          deduction: updatedAdvance.deductedAmount || 0,
          remainingBalance: updatedAdvance.remainingBalance,
          total: updatedAdvance.advanceAmount,
          date: updatedAdvance.date,
          challanNo: updatedAdvance.challanNo || '',
          repaymentStatus: updatedAdvance.repaymentStatus,
          remarks: updatedAdvance.remarks || '',
        }),
      });
      setAdvanceRecords((prev) => {
        const next = prev.map((a) =>
          String(a.id) === String(updatedAdvance.id) ? updatedAdvance : a
        );
        try {
          localStorage.setItem('greenova_advances_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to update advance salary record.');
      throw err;
    }
  };

  const handleDeleteAdvanceRecord = async (id: string) => {
    try {
      await apiFetch(`/api/salaries/${id}`, { method: 'DELETE' });
      setAdvanceRecords((prev) => {
        const next = prev.filter((a) => String(a.id) !== String(id));
        try {
          localStorage.setItem('greenova_advances_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      reportError(err, 'Failed to delete advance salary record.');
      throw err;
    }
  };

  // Farm Records CRUD handlers (persisted directly to PostgreSQL /api/farms)
  const handleAddFarm = async (newFarm: Farm) => {
    try {
      const res = await apiFetch('/api/farms', {
        method: 'POST',
        body: JSON.stringify(newFarm),
      });
      const canonicalFarm: Farm = {
        ...newFarm,
        id: res?.data?.id ? String(res.data.id) : newFarm.id,
      };
      const nextFarms = [...farms, canonicalFarm];
      setFarms(nextFarms);
      try {
        localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
      } catch {}
      triggerSavedRefresh(`Farm "${canonicalFarm.name}" added. Refreshing page...`);
    } catch (err) {
      reportError(err, 'Failed to add farm record.');
    }
  };

  const handleEditFarm = async (updatedFarm: Farm) => {
    try {
      await apiFetch(`/api/farms/${updatedFarm.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFarm),
      });
      const nextFarms = farms.map((f) =>
        String(f.id) === String(updatedFarm.id) ? updatedFarm : f
      );
      setFarms(nextFarms);
      try {
        localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to update farm record.');
    }
  };

  const handleDeleteFarm = async (id: string) => {
    try {
      await apiFetch(`/api/farms/${id}`, { method: 'DELETE' });
      const nextFarms = farms.filter((f) => String(f.id) !== String(id));
      setFarms(nextFarms);
      try {
        localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to delete farm record.');
    }
  };

  // Bank Accounts CRUD handlers (persisted directly to PostgreSQL /api/banks)
  const handleAddBank = async (newBank: BankAccount) => {
    try {
      const res = await apiFetch('/api/banks', {
        method: 'POST',
        body: JSON.stringify(newBank),
      });
      const canonicalBank: BankAccount = {
        ...newBank,
        id: res?.data?.id || newBank.id,
      };
      const nextBanks = [...bankAccounts, canonicalBank];
      setBankAccounts(nextBanks);
      try {
        localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to add bank account.');
    }
  };

  const handleEditBank = async (updatedBank: BankAccount) => {
    try {
      await apiFetch(`/api/banks/${updatedBank.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedBank),
      });
      const nextBanks = bankAccounts.map((b) =>
        String(b.id) === String(updatedBank.id) ? updatedBank : b
      );
      setBankAccounts(nextBanks);
      try {
        localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to update bank account.');
    }
  };

  const handleDeleteBank = async (id: string) => {
    try {
      await apiFetch(`/api/banks/${id}`, { method: 'DELETE' });
      const nextBanks = bankAccounts.filter((b) => String(b.id) !== String(id));
      setBankAccounts(nextBanks);
      try {
        localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
      } catch {}
    } catch (err) {
      reportError(err, 'Failed to delete bank account.');
    }
  };

  // Sign out handler - explicitly removes session and redirects to /login
  const handleSignOut = () => {
    try {
      localStorage.removeItem('greenova_user');
    } catch (e) {}
    setCurrentUser(null);
    try {
      window.history.pushState(null, '', '/login');
    } catch (e) {}
  };

  // Update profile handler
  const handleUpdateUser = (updated: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    emailVerified?: boolean;
    initials?: string;
    isSuperAdmin?: boolean;
  }) => {
    setCurrentUser((prev) => {
      const preservedRole = prev?.role || updated.role;
      const next = prev
        ? {
            ...prev,
            ...updated,
            role: preservedRole,
            isSuperAdmin: preservedRole === 'super_admin',
          }
        : {
            ...updated,
            isSuperAdmin: updated.role === 'super_admin',
          };
      try {
        localStorage.setItem('greenova_user', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Health notifications derived strictly from scheduled vaccines & medications (unconditionally declared at top level)
  const healthNotifications: HealthNotification[] = useMemo(() => {
    return vaccines
      .filter((v) => v.status === 'Scheduled')
      .map((v) => {
        const isMed =
          v.vaccineName.toLowerCase().includes('medicin') ||
          v.vaccineName.toLowerCase().includes('antibiotic') ||
          v.vaccineName.toLowerCase().includes('vitamin') ||
          v.vaccineName.toLowerCase().includes('tonic') ||
          v.vaccineName.toLowerCase().includes('powder') ||
          v.vaccineName.toLowerCase().includes('dewormer');

        return {
          id: v.id,
          title: v.vaccineName,
          message: `${v.flockName || 'Layer Shed'} • ${v.method || 'Standard'} • ${v.dosage || ''}`,
          date: v.scheduledDate || `Week ${v.scheduledWeek}`,
          flockName: v.flockName,
          status: v.status as any,
          method: v.method,
          dosage: v.dosage,
          type: isMed ? 'medicine' : 'vaccine',
          isNew: latestHealthPrompt?.id === v.id,
        };
      });
  }, [vaccines, latestHealthPrompt]);

  // If not logged in, render the Login View directly
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={(user) => {
            const isSuper = user.role === 'super_admin';
            const profile = {
              name: user.name || (isSuper ? 'Ahsan Nawaz' : 'Farm Supervisor'),
              email: user.email,
              token: user.token,
              phone: isSuper ? '+92 300 8645210' : '+92 301 7654321',
              role: user.role || (isSuper ? 'super_admin' : 'supervisor'),
              isSuperAdmin: isSuper,
              initials: isSuper ? 'AN' : 'FS',
              emailVerified: true,
            };
            setCurrentUser(profile);
            try {
              localStorage.setItem('greenova_user', JSON.stringify(profile));
            } catch (e) {}
            const targetTab = currentTab && currentTab !== 'dashboard' ? currentTab : 'dashboard';
            setCurrentTab(targetTab);
            const targetPath = targetTab === 'dashboard' ? '/dashboard' : `/${targetTab}`;
            try {
              window.history.pushState({ tab: targetTab }, '', targetPath);
            } catch (e) {}
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header with Mobile Hamburger Menu, Desktop Collapse Toggle, and Bell Notification Prompt */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenLogin={() => setShowLoginModal(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        onNavigateHome={() => handleNavigateTab('dashboard')}
        notifications={healthNotifications}
        latestPrompt={latestHealthPrompt}
        onClearPrompt={() => setLatestHealthPrompt(null)}
        onNavigateTab={(tab) => handleNavigateTab(tab as NavTab)}
        onToggleVaccineStatus={handleToggleVaccine}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar matching live menu */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onUpdateUser={handleUpdateUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-8 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              farms={farms}
              flocks={flocks}
              eggProductions={eggProductions}
              mortalityLogs={mortalityLogs}
              consumptionLogs={consumptionLogs}
              financials={financials}
              inventory={inventory}
              bankAccounts={bankAccounts}
              onAddTransaction={handleAddTransaction}
              onAddBank={handleAddBank}
              onRestock={handleRestock}
              onOpenRecordModal={(type) => setRecordModalType(type)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {currentTab === 'flocks' && (
            <FlocksView
              flocks={flocks}
              farms={farms}
              onAddFlock={handleAddFlock}
              onEditFlock={handleEditFlock}
              onDeleteFlock={handleDeleteFlock}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {currentTab === 'egg-production' && (
            <EggProductionView
              eggProductions={eggProductions}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('egg')}
              onEditEgg={handleEditEgg}
              onDeleteEgg={handleDeleteEgg}
            />
          )}

          {currentTab === 'daily-consumption' && (
            <ConsumptionView
              consumptionLogs={consumptionLogs}
              flocks={flocks}
              mortalityLogs={mortalityLogs}
              onOpenRecordModal={() => setRecordModalType('feed')}
              onEditConsumption={handleEditFeed}
              onDeleteConsumption={handleDeleteFeed}
            />
          )}

          {currentTab === 'bird-health' && (
            <BirdHealthView
              mortalityLogs={mortalityLogs}
              vaccines={vaccines}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('mortality')}
              onToggleVaccine={handleToggleVaccine}
              onAddVaccine={handleAddVaccine}
              onEditVaccine={handleEditVaccine}
              onDeleteVaccine={handleDeleteVaccine}
              onEditMortality={handleEditMortality}
              onDeleteMortality={handleDeleteMortality}
            />
          )}

          {currentTab === 'sales' && (
            <FinanceView
              financials={financials}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              defaultType="Income"
              bankAccounts={bankAccounts}
              onAddBank={handleAddBank}
            />
          )}

          {currentTab === 'expenses' && (
            <FinanceView
              financials={financials}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              defaultType="Expense"
              bankAccounts={bankAccounts}
              onAddBank={handleAddBank}
            />
          )}

          {currentTab === 'stocks' && (
            <StocksView
              inventory={inventory}
              onRestock={handleRestock}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {currentTab === 'salaries' && (
            <SalariesView
              workers={workers}
              disbursals={salaryDisbursals}
              advances={advanceRecords}
              flocks={flocks}
              onAddSalaryDisbursal={handleAddSalaryDisbursal}
              onAddAdvanceRecord={handleAddAdvanceRecord}
              onAddWorker={handleAddWorker}
              onUpdateWorker={handleUpdateWorker}
              onDeleteWorker={handleDeleteWorker}
              onEditSalaryDisbursal={handleEditSalaryDisbursal}
              onDeleteSalaryDisbursal={handleDeleteSalaryDisbursal}
              onEditAdvanceRecord={handleEditAdvanceRecord}
              onDeleteAdvanceRecord={handleDeleteAdvanceRecord}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              flocks={flocks}
              eggProductions={eggProductions}
              mortalityLogs={mortalityLogs}
              consumptionLogs={consumptionLogs}
              financials={financials}
              inventory={inventory}
              bankAccounts={bankAccounts}
              onAddBank={handleAddBank}
              onEditBank={handleEditBank}
              onDeleteBank={handleDeleteBank}
              onNavigateTab={(tab) => handleNavigateTab(tab as NavTab)}
            />
          )}

          {currentTab === 'farms' && (
            <FarmsView
              farms={farms}
              flocks={flocks}
              onAddFarm={handleAddFarm}
              onEditFarm={handleEditFarm}
              onDeleteFarm={handleDeleteFarm}
            />
          )}

          {currentTab === 'users' && <UserManagementView currentUser={currentUser} />}
        </main>
      </div>

      {/* Switch Account Modal if invoked while logged in */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-w-md w-full">
            <LoginView
              onLoginSuccess={(user) => {
                const isSuper = user.role === 'super_admin';
                const profile = {
                  name: user.name || (isSuper ? 'Ahsan Nawaz' : 'Farm Supervisor'),
                  email: user.email,
                  token: user.token,
                  phone: isSuper ? '+92 300 8645210' : '+92 301 7654321',
                  role: user.role || (isSuper ? 'super_admin' : 'supervisor'),
                  isSuperAdmin: isSuper,
                  initials: isSuper ? 'AN' : 'FS',
                  emailVerified: true,
                };
                try {
                  localStorage.setItem('greenova_user', JSON.stringify(profile));
                } catch {}
                setCurrentUser(profile);
                setShowLoginModal(false);
              }}
              onCancel={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}

      {/* Standardized Record Modal */}
      <RecordModal
        type={recordModalType}
        flocks={flocks}
        isOpen={Boolean(recordModalType)}
        onClose={() => setRecordModalType(null)}
        onAddEgg={handleAddEgg}
        onAddFeed={handleAddFeed}
        onAddMortality={handleAddMortality}
        onNavigateTab={(tab) => handleNavigateTab(tab as any)}
      />

      {/* Unified Record Saved Confirmation Overlay */}
      {savedBanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-3 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {savedBanner.title}
            </h3>
            {savedBanner.detail && (
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {savedBanner.detail}
              </p>
            )}
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Refreshing page...</span>
            </div>
          </div>
        </div>
      )}

      {/* Database / API Mutation Error Banner */}
      {actionError && (
        <div className="fixed bottom-6 right-6 z-[110] max-w-md bg-rose-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-rose-700 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Database Save Error</div>
            <div className="text-rose-200 mt-0.5">{actionError}</div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-300 hover:text-white cursor-pointer p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Bottom Thumb Navigation Bar (Native App Feel) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {(
            [
              { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
              { id: 'egg-production', label: 'Eggs', Icon: Egg },
              { id: 'daily-consumption', label: 'Feed', Icon: Wheat },
              { id: 'sales', label: 'Sales', Icon: TrendingUp },
              { id: 'reports', label: 'Reports', Icon: FileBarChart2 },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavigateTab(id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                  active
                    ? 'text-emerald-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span
                  className={`p-1.5 rounded-xl transition-colors ${
                    active ? 'bg-emerald-100 text-emerald-700' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  );
}
