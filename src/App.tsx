import React, { useState, useEffect, useMemo } from 'react';
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveVaccineSchedules;
  });
  const [latestHealthPrompt, setLatestHealthPrompt] = useState<HealthNotification | null>(null);
  const [consumptionLogs, setConsumptionLogs] = useState<FeedConsumption[]>(() => {
    const savedV3 = localStorage.getItem('greenova_feed_v3');
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const savedV2 = localStorage.getItem('greenova_feed_v2');
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length >= 157) return parsed;
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
    localStorage.setItem('greenova_feed_v3', JSON.stringify(consumptionLogs));
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
        else if (e.key === 'greenova_feed_v3') setConsumptionLogs(JSON.parse(e.newValue));
        else if (e.key === 'greenova_vaccines_v2') setVaccines(JSON.parse(e.newValue));
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Initial flock & mortality sync from backend if reachable
  useEffect(() => {
    fetch('/api/flocks')
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
          const apiFlocks: Flock[] = res.data.items.map((item: any) => {
            const idStr = String(item.id);
            const defaultMort = idStr === '8' ? 5 : idStr === '9' ? 7 : idStr === '10' ? 3 : 0;
            const shedNum = idStr === '8' ? 'Shed 1' : idStr === '9' ? 'Shed 2' : idStr === '10' ? 'Shed 3' : `Shed ${idStr}`;
            return {
              id: idStr,
              farmId: String(item.farmId || 9),
              farmName: item.farm?.name || item.farmName || 'GreenOva',
              name: item.flockName || item.name || `Unit ${idStr}`,
              shedNumber: item.shedNumber || shedNum,
              breed: item.breed || 'LSL Classic',
              purpose: 'Layers',
              initialCount: Number(item.originalTotalBirds || item.totalBirds || 25000),
              currentCount: Number(item.totalBirds ?? 25000),
              startDate: item.acquiredDate ? String(item.acquiredDate).split('T')[0] : '2026-02-25',
              ageWeeks: Number(item.ageWeeks || item.ageInWeeks || 38),
              status: item.isActive !== false ? 'Active' : 'Inactive',
              mortality: item.mortality !== undefined ? Number(item.mortality) : defaultMort,
              targetFCR: Number(item.targetFCR || 1.48),
              cost: Number(item.cost || 7500000),
              notes: item.notes || '',
              updatedAt: item.updatedAt,
            };
          });

          setFlocks((prevLocal) => {
            const merged = apiFlocks.map((apiF) => {
              const localMatch = prevLocal.find((l) => String(l.id) === String(apiF.id));
              if (localMatch?.updatedAt) {
                const localTs = new Date(localMatch.updatedAt).getTime();
                const apiTs = apiF.updatedAt ? new Date(apiF.updatedAt).getTime() : 0;
                if (!isNaN(localTs) && localTs > apiTs) {
                  // Keep newer local edit and push it to backend in case previous save was interrupted
                  fetch(`/api/flock/${localMatch.id}`, {
                    method: 'PUT',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      flockName: localMatch.name,
                      farmName: localMatch.farmName,
                      totalBirds: localMatch.currentCount,
                      originalTotalBirds: localMatch.initialCount,
                      ageWeeks: localMatch.ageWeeks,
                      isActive: localMatch.status === 'Active',
                      acquiredDate: localMatch.startDate,
                      mortality: localMatch.mortality || 0,
                      notes: localMatch.notes || '',
                    }),
                  }).catch(() => {});
                  return localMatch;
                }
              }
              return apiF;
            });
            // Preserve any locally created flocks not yet returned by backend
            for (const localF of prevLocal) {
              if (!merged.some((m) => String(m.id) === String(localF.id))) {
                merged.push(localF);
              }
            }
            try {
              localStorage.setItem('greenova_flocks', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch((e) => console.warn('Backend sync:', e));

    // Also pull any backend user-added mortality logs not yet in localStorage (e.g. fresh browser/tab)
    fetch('/api/bird-health?limit=200')
      .then((res) => res.json())
      .then((res) => {
        const items = res?.data?.items;
        if (!Array.isArray(items)) return;
        const userHealthLogs = items.filter((h: any) => h.isUserAdded && (Number(h.mortality) || 0) > 0);
        if (userHealthLogs.length === 0) return;
        setMortalityLogs((prev) => {
          const existingIds = new Set(prev.map((m) => String(m.id)));
          const additions: MortalityLog[] = [];
          for (const h of userHealthLogs) {
            const clientOrServerId = String(h.clientId || `srv-mort-${h.id}`);
            const dateStr = h.date ? String(h.date).split('T')[0] : '';
            const fidStr = String(h.flockId || 8);
            const alreadyMatched =
              existingIds.has(clientOrServerId) ||
              prev.some(
                (m) =>
                  String(m.flockId) === fidStr &&
                  m.date === dateStr &&
                  Number(m.count) === Number(h.mortality)
              );
            if (!alreadyMatched) {
              additions.push({
                id: clientOrServerId,
                flockId: fidStr,
                flockName: h.flock?.flockName || (fidStr === '9' ? 'Unit 2' : fidStr === '10' ? 'Unit 3' : 'Unit 1'),
                date: dateStr,
                count: Number(h.mortality) || 0,
                cause: h.cause || h.notes || 'Daily Mortality',
                symptoms: h.notes || '',
                recordedBy: h.recordedBy || 'Farm Admin',
              });
            }
          }
          if (additions.length === 0) return prev;
          const next = [...additions, ...prev];
          try {
            localStorage.setItem('greenova_mortality_v2', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      })
      .catch(() => {});

    // Sync farms with backend while respecting deleted farm IDs
    fetch('/api/farms')
      .then((res) => res.json())
      .then((res) => {
        const items = res?.data?.items;
        if (!Array.isArray(items) || items.length === 0) return;

        let deletedIds: string[] = [];
        try {
          const rawDeleted = localStorage.getItem('greenova_deleted_farm_ids');
          if (rawDeleted) {
            const parsed = JSON.parse(rawDeleted);
            if (Array.isArray(parsed)) deletedIds = parsed.map(String);
          }
        } catch {}

        let localIds: Set<string> | null = null;
        try {
          const savedRaw = localStorage.getItem('greenova_farm_records');
          if (savedRaw) {
            const parsedLocal = JSON.parse(savedRaw);
            if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
              localIds = new Set(parsedLocal.map((lf: any) => String(lf.id)));
            }
          }
        } catch {}

        const deletedSet = new Set(deletedIds);
        const filteredRemote: Farm[] = items
          .filter((item: any) => {
            const sid = String(item.id);
            if (deletedSet.has(sid)) return false;
            // If user had already removed a farm locally before backend delete was wired, honor local removal
            if (localIds && !localIds.has(sid) && !item.isUserAdded) {
              fetch(`/api/farms/${sid}`, { method: 'DELETE', keepalive: true }).catch(() => {});
              return false;
            }
            return true;
          })
          .map((item: any) => {
            const localDefaults = liveFarms.find((lf) => String(lf.id) === String(item.id));
            return {
              id: String(item.id),
              name: item.name,
              code: item.code || localDefaults?.code || `GVF-${item.id}`,
              location: item.location || localDefaults?.location || 'Multan, Punjab',
              description: item.description || localDefaults?.description || 'Main Processing Facility',
              capacity: Number(item.capacity ?? localDefaults?.capacity ?? 50000),
              currentBirds: Number(item.currentBirds ?? localDefaults?.currentBirds ?? 0),
              shedsCount: Number(item.shedsCount ?? localDefaults?.shedsCount ?? 1),
              manager: item.manager || localDefaults?.manager || 'Farm Supervisor',
              temperature: Number(item.temperature ?? localDefaults?.temperature ?? 25),
              humidity: Number(item.humidity ?? localDefaults?.humidity ?? 56),
            };
          });

        if (filteredRemote.length > 0) {
          setFarms(filteredRemote);
          try {
            localStorage.setItem('greenova_farm_records', JSON.stringify(filteredRemote));
          } catch {}
        }
      })
      .catch(() => {});

    // Sync bank accounts with backend while respecting deleted bank IDs
    fetch('/api/banks')
      .then((res) => res.json())
      .then((res) => {
        const items = res?.data?.items;
        if (!Array.isArray(items) || items.length === 0) return;

        let deletedIds: string[] = [];
        try {
          const rawDeleted = localStorage.getItem('greenova_deleted_bank_ids');
          if (rawDeleted) {
            const parsed = JSON.parse(rawDeleted);
            if (Array.isArray(parsed)) deletedIds = parsed.map(String);
          }
        } catch {}

        const deletedSet = new Set(deletedIds);
        const filteredRemote: BankAccount[] = items.filter((b: any) => !deletedSet.has(String(b.id)));
        if (filteredRemote.length === 0) return;

        setBankAccounts((prev) => {
          const merged = [...prev];
          for (const rb of filteredRemote) {
            if (!merged.some((lb) => String(lb.id) === String(rb.id))) {
              merged.push(rb);
            }
          }
          try {
            localStorage.setItem('greenova_banks_v1', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  // Action handlers
  const handleAddEgg = (newEgg: EggProduction) => {
    // Generate next sequential numeric ID matching PDF series (e.g. #414, #415)
    const numericIds = eggProductions
      .map((e) => Number(e.id))
      .filter((n) => !isNaN(n) && n > 0);
    const nextNumericId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 414;
    const finalEgg: EggProduction = {
      ...newEgg,
      id: String(nextNumericId),
    };

    setEggProductions((prev) => [finalEgg, ...prev]);

    // Immediate localStorage sync
    try {
      const stored = localStorage.getItem('greenova_eggs_v3') || localStorage.getItem('greenova_eggs_v2');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem('greenova_eggs_v3', JSON.stringify([finalEgg, ...(Array.isArray(parsed) ? parsed : [])]));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    const numFid =
      Number(finalEgg.flockId) ||
      (finalEgg.flockName?.includes('2') ? 9 : finalEgg.flockName?.includes('3') ? 10 : 8);

    fetch('/api/egg-production', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: finalEgg.date,
        flockId: numFid,
        totalEggs: finalEgg.totalEggs,
        morningEggs: finalEgg.morningEggs,
        eveningEggs: finalEgg.eveningEggs,
        brokenEggs: finalEgg.damagedEggs,
        cartons: finalEgg.cartons ?? Math.floor(finalEgg.totalEggs / 360),
        trays: finalEgg.cleanTrays,
        averageWeight: finalEgg.avgWeightGrams ?? 60,
        grade: finalEgg.eggGrade ?? 'standard',
        notes: finalEgg.notes || `Morning: ${finalEgg.morningEggs}, Evening: ${finalEgg.eveningEggs}`,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.id) {
          setEggProductions((prev) => {
            const next = prev.map((e) => (e.id === finalEgg.id ? { ...e, id: String(res.data.id) } : e));
            try {
              localStorage.setItem('greenova_eggs_v3', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      })
      .catch((e) => console.warn('Egg persistence error:', e));
  };

  const handleAddFeed = (newFeed: FeedConsumption) => {
    const nextLogs = [newFeed, ...consumptionLogs];
    setConsumptionLogs(nextLogs);
    try {
      localStorage.setItem('greenova_feed_v3', JSON.stringify(nextLogs));
    } catch (e) {}

    const numFid =
      Number(newFeed.flockId) ||
      (newFeed.flockName?.includes('2') ? 9 : newFeed.flockName?.includes('3') ? 10 : 8);
    fetch('/api/daily-consumption', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: newFeed.date,
        flockId: numFid,
        feedConsumed: newFeed.bags || Math.round((newFeed.feedQuantityKg || 0) / 50),
        waterConsumption: newFeed.waterIntakeLiters || 0,
        feedType: newFeed.feedType,
      }),
    }).catch((e) => console.warn('Feed persistence error:', e));
  };

  const handleAddMortality = (newMort: MortalityLog) => {
    const updatedMortLogs = [newMort, ...mortalityLogs];
    setMortalityLogs(updatedMortLogs);
    try {
      localStorage.setItem('greenova_mortality_v2', JSON.stringify(updatedMortLogs));
    } catch (e) {}

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

    setFlocks(updatedFlocks);
    try {
      localStorage.setItem('greenova_flocks', JSON.stringify(updatedFlocks));
    } catch (e) {}

    const numFid = Number(matchedFlock?.id || newMort.flockId) || (newMort.flockId === '8' ? 8 : newMort.flockId === '9' ? 9 : 10);
    fetch('/api/bird-health', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: newMort.id,
        date: newMort.date,
        flockId: numFid,
        mortality: newMort.count,
        notes: newMort.cause,
        cause: newMort.cause,
        recordedBy: newMort.recordedBy || 'Farm Admin',
        flockTotalBirds: matchedFlock?.currentCount,
        flockMortality: matchedFlock?.mortality,
      }),
    }).catch((e) => console.warn('Mortality persistence error:', e));

    if (matchedFlock) {
      fetch(`/api/flock/${matchedFlock.id}`, {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flockName: matchedFlock.name,
          totalBirds: matchedFlock.currentCount,
          originalTotalBirds: matchedFlock.initialCount,
          mortality: matchedFlock.mortality || 0,
          isActive: matchedFlock.status === 'Active',
        }),
      }).catch((e) => console.warn('Flock mortality sync error:', e));
    }
  };

  const handleEditEgg = (updatedEgg: EggProduction) => {
    setEggProductions((prev) => {
      const next = prev.map((e) => (String(e.id) === String(updatedEgg.id) ? updatedEgg : e));
      try {
        localStorage.setItem('greenova_eggs_v3', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const resolvedId = Number((updatedEgg as any).trackingId || String(updatedEgg.id).replace(/\D/g, '')) || updatedEgg.id;
    fetch(`/api/egg-production/${resolvedId}`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEgg),
    }).catch((e) => console.warn('Egg update error:', e));
  };

  const handleEditTransaction = (updatedTx: FinancialRecord) => {
    setFinancials((prev) => {
      const next = prev.map((f) => (String(f.id) === String(updatedTx.id) ? updatedTx : f));
      try {
        localStorage.setItem('greenova_financials_v3', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const isSale = updatedTx.type === 'Income';
    const resolvedId = Number((updatedTx as any).trackingId || String(updatedTx.id).replace(/\D/g, '')) || updatedTx.id;
    const endpoint = isSale
      ? `/api/sales/${resolvedId}`
      : `/api/expenses/${resolvedId}`;

    fetch(endpoint, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTx),
    }).catch((e) => console.warn('Transaction update error:', e));
  };

  const handleAddVaccine = (newVaccine: VaccineLog) => {
    setVaccines((prev) => [newVaccine, ...prev]);

    // Save to localStorage
    try {
      const stored = localStorage.getItem('greenova_vaccines_v2');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem('greenova_vaccines_v2', JSON.stringify([newVaccine, ...(Array.isArray(parsed) ? parsed : [])]));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    // Trigger immediate prompt on Bell icon in Header
    const isMed =
      newVaccine.vaccineName.toLowerCase().includes('medicin') ||
      newVaccine.vaccineName.toLowerCase().includes('antibiotic') ||
      newVaccine.vaccineName.toLowerCase().includes('vitamin') ||
      newVaccine.vaccineName.toLowerCase().includes('tonic') ||
      newVaccine.vaccineName.toLowerCase().includes('powder') ||
      newVaccine.vaccineName.toLowerCase().includes('dewormer');

    const promptNotification: HealthNotification = {
      id: newVaccine.id,
      title: newVaccine.vaccineName,
      message: `${newVaccine.flockName || 'Layer Shed'} • ${newVaccine.method || 'Standard'} • ${newVaccine.dosage || ''}`,
      date: newVaccine.scheduledDate || new Date().toISOString().split('T')[0],
      flockName: newVaccine.flockName || 'Unit 1',
      status: newVaccine.status as any,
      method: newVaccine.method,
      dosage: newVaccine.dosage,
      type: isMed ? 'medicine' : 'vaccine',
      isNew: true,
    };
    setLatestHealthPrompt(promptNotification);
  };

  const handleAddFlock = (flock: Flock) => {
    const stampedFlock: Flock = { ...flock, updatedAt: new Date().toISOString() };
    const nextFlocks = [...flocks, stampedFlock];
    setFlocks(nextFlocks);
    try {
      localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
    } catch (e) {}

    if (flock.mortality && flock.mortality > 0) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mortEntry: MortalityLog = {
        id: `mort-flock-${Date.now()}`,
        flockId: flock.id,
        flockName: flock.name,
        date: todayStr,
        count: flock.mortality,
        cause: 'Initial Flock Mortality Entry',
        symptoms: 'Recorded when creating flock',
        recordedBy: currentUser?.name || 'Farm Admin',
      };
      const nextMorts = [mortEntry, ...mortalityLogs];
      setMortalityLogs(nextMorts);
      try {
        localStorage.setItem('greenova_mortality_v2', JSON.stringify(nextMorts));
      } catch (e) {}
    }

    fetch('/api/flock', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Number(flock.id) || undefined,
        flockName: flock.name,
        breed: flock.breed,
        totalBirds: flock.currentCount || flock.initialCount,
        originalTotalBirds: flock.initialCount,
        mortality: flock.mortality || 0,
        ageWeeks: flock.ageWeeks,
        isActive: flock.status === 'Active',
        cost: flock.cost || 7500000,
        acquiredDate: flock.startDate,
      }),
    }).catch((e) => console.warn('Flock persistence error:', e));
  };

  const handleEditFlock = (updatedFlock: Flock) => {
    const prevFlock = flocks.find((f) => String(f.id) === String(updatedFlock.id));
    const stampedFlock: Flock = { ...updatedFlock, updatedAt: new Date().toISOString() };
    const nextFlocks = flocks.map((f) => (String(f.id) === String(updatedFlock.id) ? stampedFlock : f));
    setFlocks(nextFlocks);
    try {
      localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
    } catch (e) {}

    const prevMort = prevFlock?.mortality || 0;
    const newMort = updatedFlock.mortality || 0;
    const mortDelta = newMort - prevMort;

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
      } catch (e) {}

      fetch('/api/bird-health', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: newLog.id,
          date: todayStr,
          flockId: Number(updatedFlock.id) || 8,
          mortality: mortDelta,
          notes: newLog.cause,
          cause: newLog.cause,
          recordedBy: newLog.recordedBy,
          skipFlockAdjust: true,
        }),
      }).catch((e) => console.warn('Mortality log persistence error:', e));
    } else if (mortDelta < 0) {
      let toReduce = Math.abs(mortDelta);
      const nextMorts = mortalityLogs
        .map((m) => {
          if (
            toReduce > 0 &&
            (String(m.flockId) === String(updatedFlock.id) || m.flockName === updatedFlock.name)
          ) {
            const deduct = Math.min(m.count || 0, toReduce);
            toReduce -= deduct;
            return { ...m, count: Math.max(0, (m.count || 0) - deduct) };
          }
          return m;
        })
        .filter((m) => (m.count || 0) > 0);
      setMortalityLogs(nextMorts);
      try {
        localStorage.setItem('greenova_mortality_v2', JSON.stringify(nextMorts));
      } catch (e) {}
    }

    fetch(`/api/flock/${updatedFlock.id}`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flockName: updatedFlock.name,
        farmName: updatedFlock.farmName,
        totalBirds: updatedFlock.currentCount,
        originalTotalBirds: updatedFlock.initialCount,
        ageWeeks: updatedFlock.ageWeeks,
        isActive: updatedFlock.status === 'Active',
        acquiredDate: updatedFlock.startDate,
        mortality: updatedFlock.mortality || 0,
        notes: updatedFlock.notes || '',
      }),
    }).catch((e) => console.warn('Flock edit error:', e));
  };

  const handleDeleteFlock = (id: string) => {
    const nextFlocks = flocks.filter((f) => f.id !== id);
    setFlocks(nextFlocks);
    try {
      localStorage.setItem('greenova_flocks', JSON.stringify(nextFlocks));
    } catch (e) {}
    fetch(`/api/flock/${id}`, {
      method: 'DELETE',
      keepalive: true,
    }).catch((e) => console.warn('Flock delete error:', e));
  };

  const handleToggleVaccine = (id: string) => {
    setVaccines((prev) => {
      const updated = prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status: (v.status === 'Completed' ? 'Scheduled' : 'Completed') as any,
              administeredDate:
                v.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0],
            }
          : v
      );
      try {
        localStorage.setItem('greenova_vaccines_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleRestock = (id: string, amount: number) => {
    const nextInv = inventory.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + amount } : item
    );
    setInventory(nextInv);
    try {
      localStorage.setItem('greenova_inventory', JSON.stringify(nextInv));
    } catch (e) {}
  };

  const handleAddTransaction = (record: FinancialRecord) => {
    const nextFinancials = [record, ...financials];
    setFinancials(nextFinancials);
    try {
      localStorage.setItem('greenova_financials_v3', JSON.stringify(nextFinancials));
    } catch (e) {}

    const isExp = record.type === 'Expense';
    const numFid =
      Number(record.flockId) ||
      (record.flockName?.includes('2') ? 9 : record.flockName?.includes('3') ? 10 : 8);
    fetch(isExp ? '/api/expense' : '/api/sale', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: record.amount,
        expenseCost: record.amount,
        totalAmount: record.amount,
        head: (record.head || record.category || 'OTHER').toUpperCase().replace(/\s+/g, '_'),
        notes: record.notes || record.description || '',
        flockId: numFid,
        challanNo: record.challanNo || record.referenceNo || '0',
        cashPayment: record.cashPayment || 0,
        onlinePayment: record.onlinePayment || 0,
        itemsSold: record.quantity || 0,
        vehicleNumber: record.vehicleNumber || 'Direct',
        bankId: record.bankId || undefined,
        bankName: record.bankName || undefined,
        date: record.date,
      }),
    }).catch((e) => console.warn('Transaction persistence error:', e));
  };

  const handleAddSalaryDisbursal = (newSalary: SalaryDisbursal) => {
    const nextSalaries = [newSalary, ...salaryDisbursals];
    setSalaryDisbursals(nextSalaries);
    try {
      localStorage.setItem('greenova_salaries_v3', JSON.stringify(nextSalaries));
    } catch (e) {}

    // If advance was deducted, update worker's advance balance and advance logs
    if (newSalary.advanceDeducted > 0) {
      setWorkers((prev) => {
        const nextWorkers = prev.map((w) =>
          w.name.toLowerCase() === newSalary.employeeName.toLowerCase()
            ? {
                ...w,
                advanceBalance: Math.max(0, (w.advanceBalance || 0) - newSalary.advanceDeducted),
              }
            : w
        );
        try {
          localStorage.setItem('greenova_staff_v2', JSON.stringify(nextWorkers));
        } catch (e) {}
        return nextWorkers;
      });

      let remainingToDeduct = newSalary.advanceDeducted;
      setAdvanceRecords((prev) => {
        const nextAdv = prev.map((adv) => {
          if (
            remainingToDeduct > 0 &&
            adv.employeeName.toLowerCase() === newSalary.employeeName.toLowerCase() &&
            adv.repaymentStatus !== 'Deducted'
          ) {
            const deduct = Math.min(adv.remainingBalance, remainingToDeduct);
            remainingToDeduct -= deduct;
            const newBal = adv.remainingBalance - deduct;
            return {
              ...adv,
              deductedAmount: adv.deductedAmount + deduct,
              remainingBalance: newBal,
              repaymentStatus: (newBal <= 0 ? 'Deducted' : 'Partially Deducted') as 'Deducted' | 'Partially Deducted',
            };
          }
          return adv;
        });
        try {
          localStorage.setItem('greenova_advances_v3', JSON.stringify(nextAdv));
        } catch (e) {}
        return nextAdv;
      });
    }

    // Post to backend
    fetch('/api/salaries', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: newSalary.employeeName,
        designation: newSalary.designation,
        flockId: Number(newSalary.flockId) || 9,
        basicSalary: newSalary.basicSalary,
        salaryAmount: newSalary.netSalaryPaid,
        total: newSalary.totalSalary,
        advance: newSalary.advanceDeducted,
        remarks: `${newSalary.challanNo} - ${newSalary.remarks || ''}`,
      }),
    }).catch((e) => console.warn('Salary persistence error:', e));
  };

  const handleAddAdvanceRecord = (newAdvance: AdvanceSalaryRecord) => {
    const nextAdv = [newAdvance, ...advanceRecords];
    setAdvanceRecords(nextAdv);
    try {
      localStorage.setItem('greenova_advances_v3', JSON.stringify(nextAdv));
    } catch (e) {}

    // Increase worker's advance balance
    setWorkers((prev) => {
      const nextWorkers = prev.map((w) =>
        w.name.toLowerCase() === newAdvance.employeeName.toLowerCase()
          ? { ...w, advanceBalance: (w.advanceBalance || 0) + newAdvance.advanceAmount }
          : w
      );
      try {
        localStorage.setItem('greenova_staff_v2', JSON.stringify(nextWorkers));
      } catch (e) {}
      return nextWorkers;
    });

    // Post to backend
    fetch('/api/salaries', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: newAdvance.employeeName,
        designation: newAdvance.designation,
        flockId: Number(newAdvance.flockId) || 9,
        salaryAmount: 0,
        advance: newAdvance.advanceAmount,
        total: newAdvance.advanceAmount,
        remarks: `${newAdvance.challanNo} - ${newAdvance.remarks || ''}`,
      }),
    }).catch((e) => console.warn('Advance persistence error:', e));
  };

  const handleAddWorker = (newWorker: Worker) => {
    setWorkers((prev) => {
      const next = [newWorker, ...prev];
      try {
        localStorage.setItem('greenova_staff_v2', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => {
      const next = prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w));
      try {
        localStorage.setItem('greenova_staff_v2', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Farm Records CRUD handlers (persisted to localStorage + /api/farms)
  const handleAddFarm = (newFarm: Farm) => {
    const nextFarms = [...farms, newFarm];
    setFarms(nextFarms);
    try {
      localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
    } catch {}
    fetch('/api/farms', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFarm),
    }).catch((e) => console.warn('Farm add persistence error:', e));
  };

  const handleEditFarm = (updatedFarm: Farm) => {
    const nextFarms = farms.map((f) => (String(f.id) === String(updatedFarm.id) ? updatedFarm : f));
    setFarms(nextFarms);
    try {
      localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
    } catch {}
    fetch(`/api/farms/${updatedFarm.id}`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFarm),
    }).catch((e) => console.warn('Farm update persistence error:', e));
  };

  const handleDeleteFarm = (id: string) => {
    const nextFarms = farms.filter((f) => String(f.id) !== String(id));
    setFarms(nextFarms);
    try {
      localStorage.setItem('greenova_farm_records', JSON.stringify(nextFarms));
      const rawDeleted = localStorage.getItem('greenova_deleted_farm_ids');
      const existingDeleted: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!existingDeleted.includes(String(id))) {
        localStorage.setItem('greenova_deleted_farm_ids', JSON.stringify([...existingDeleted, String(id)]));
      }
    } catch {}
    fetch(`/api/farms/${id}`, {
      method: 'DELETE',
      keepalive: true,
    }).catch((e) => console.warn('Farm delete persistence error:', e));
  };

  // Bank Accounts CRUD handlers (persisted to localStorage + /api/banks)
  const handleAddBank = (newBank: BankAccount) => {
    const nextBanks = [...bankAccounts, newBank];
    setBankAccounts(nextBanks);
    try {
      localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
    } catch {}
    fetch('/api/banks', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBank),
    }).catch((e) => console.warn('Bank add persistence error:', e));
  };

  const handleEditBank = (updatedBank: BankAccount) => {
    const nextBanks = bankAccounts.map((b) =>
      String(b.id) === String(updatedBank.id) ? updatedBank : b
    );
    setBankAccounts(nextBanks);
    try {
      localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
    } catch {}
    fetch(`/api/banks/${updatedBank.id}`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBank),
    }).catch((e) => console.warn('Bank update persistence error:', e));
  };

  const handleDeleteBank = (id: string) => {
    const nextBanks = bankAccounts.filter((b) => String(b.id) !== String(id));
    setBankAccounts(nextBanks);
    try {
      localStorage.setItem('greenova_banks_v1', JSON.stringify(nextBanks));
      const rawDeleted = localStorage.getItem('greenova_deleted_bank_ids');
      const existingDeleted: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!existingDeleted.includes(String(id))) {
        localStorage.setItem('greenova_deleted_bank_ids', JSON.stringify([...existingDeleted, String(id)]));
      }
    } catch {}
    fetch(`/api/banks/${id}`, {
      method: 'DELETE',
      keepalive: true,
    }).catch((e) => console.warn('Bank delete persistence error:', e));
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
      const next = prev ? { ...prev, ...updated } : { ...updated };
      try {
        localStorage.setItem('greenova_user', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isSuperAdmin = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.role === 'super_admin' ||
    currentUser?.email?.toLowerCase() === 'aaglobal500@gmail.com' ||
    currentUser?.email?.toLowerCase().includes('aaglobal') ||
    currentUser?.role?.toLowerCase().includes('managing director') ||
    currentUser?.role?.toLowerCase().includes('super admin')
  );

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
      <LoginView
        onLoginSuccess={(user) => {
          const isSuper = Boolean(
            user.isSuperAdmin ||
            user.role === 'super_admin' ||
            user.email?.toLowerCase().includes('aaglobal')
          );
          const profile = {
            name: user.name || (isSuper ? 'Ahsan Nawaz' : 'Farm Supervisor'),
            email: user.email,
            token: user.token || 'auth-prod-' + Date.now(),
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              farms={farms}
              flocks={flocks}
              eggProductions={eggProductions}
              mortalityLogs={mortalityLogs}
              consumptionLogs={consumptionLogs}
              financials={financials}
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
            />
          )}

          {currentTab === 'daily-consumption' && (
            <ConsumptionView
              consumptionLogs={consumptionLogs}
              flocks={flocks}
              mortalityLogs={mortalityLogs}
              onOpenRecordModal={() => setRecordModalType('feed')}
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
            />
          )}

          {currentTab === 'sales' && (
            <FinanceView
              financials={financials}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
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
                const isSuper = Boolean(
                  user.isSuperAdmin ||
                  user.role === 'super_admin' ||
                  user.email?.toLowerCase().includes('aaglobal')
                );
                const profile = {
                  name: user.name || (isSuper ? 'Ahsan Nawaz' : 'Farm Supervisor'),
                  email: user.email,
                  token: user.token || 'auth-prod-' + Date.now(),
                  phone: isSuper ? '+92 300 8645210' : '+92 301 7654321',
                  role: user.role || (isSuper ? 'super_admin' : 'supervisor'),
                  isSuperAdmin: isSuper,
                  initials: isSuper ? 'AN' : 'FS',
                  emailVerified: true,
                };
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
    </div>
  );
}
