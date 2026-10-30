import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
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

  // Authenticated user state - restored from localStorage so refreshing page keeps session until manual logout
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    token?: string;
    phone?: string;
    role?: string;
    emailVerified?: boolean;
    initials?: string;
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
  const [farms] = useState<Farm[]>(liveFarms);
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
    const saved = localStorage.getItem('greenova_eggs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 371) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveEggProductions;
  });
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(() => {
    const saved = localStorage.getItem('greenova_mortality_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) {
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
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveVaccineSchedules;
  });
  const [consumptionLogs, setConsumptionLogs] = useState<FeedConsumption[]>(() => {
    const saved = localStorage.getItem('greenova_feed_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 145) {
          return parsed;
        }
      } catch (e) {}
    }
    return liveConsumptionRecords;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('greenova_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => {
    const saved = localStorage.getItem('greenova_financials_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2049) {
          return parsed;
        }
      } catch (e) {}
    }
    return [...liveSalesRecords, ...liveExpenseRecords];
  });
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('greenova_staff_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return liveStaffRoster;
  });

  const [salaryDisbursals, setSalaryDisbursals] = useState<SalaryDisbursal[]>(() => {
    const saved = localStorage.getItem('greenova_salaries_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return liveSalaryDisbursals;
  });

  const [advanceRecords, setAdvanceRecords] = useState<AdvanceSalaryRecord[]>(() => {
    const saved = localStorage.getItem('greenova_advances_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return liveAdvanceRecords;
  });

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('greenova_flocks', JSON.stringify(flocks));
  }, [flocks]);
  useEffect(() => {
    localStorage.setItem('greenova_eggs_v2', JSON.stringify(eggProductions));
  }, [eggProductions]);
  useEffect(() => {
    localStorage.setItem('greenova_mortality_v2', JSON.stringify(mortalityLogs));
  }, [mortalityLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_vaccines_v2', JSON.stringify(vaccines));
  }, [vaccines]);
  useEffect(() => {
    localStorage.setItem('greenova_feed_v2', JSON.stringify(consumptionLogs));
  }, [consumptionLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('greenova_financials_v2', JSON.stringify(financials));
  }, [financials]);
  useEffect(() => {
    localStorage.setItem('greenova_staff_v2', JSON.stringify(workers));
  }, [workers]);
  useEffect(() => {
    localStorage.setItem('greenova_salaries_v2', JSON.stringify(salaryDisbursals));
  }, [salaryDisbursals]);
  useEffect(() => {
    localStorage.setItem('greenova_advances_v2', JSON.stringify(advanceRecords));
  }, [advanceRecords]);

  // Initial flock sync from backend if reachable
  useEffect(() => {
    fetch('/api/flocks')
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
          const apiFlocks: Flock[] = res.data.items.map((item: any) => ({
            id: String(item.id),
            farmId: String(item.farmId || 9),
            name: item.flockName || `Unit ${item.id}`,
            shedNumber: `Shed ${item.id}`,
            breed: item.breed || 'LSL',
            purpose: 'Layers',
            initialCount: Number(item.originalTotalBirds || item.totalBirds || 25000),
            currentCount: Number(item.totalBirds || 25000),
            startDate: item.acquiredDate ? item.acquiredDate.split('T')[0] : '2026-02-25',
            ageWeeks: Number(item.ageWeeks || item.ageInWeeks || 38),
            status: item.isActive !== false ? 'Active' : 'Culled',
            cost: Number(item.cost || 7500000),
            notes: item.notes || '',
          }));
          setFlocks(apiFlocks);
        }
      })
      .catch((e) => console.warn('Backend sync:', e));
  }, []);

  // Action handlers
  const handleAddEgg = (newEgg: EggProduction) => {
    // Generate next sequential numeric ID matching PDF series (e.g. #377, #378)
    const numericIds = eggProductions
      .map((e) => Number(e.id))
      .filter((n) => !isNaN(n) && n > 0);
    const nextNumericId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 377;
    const finalEgg: EggProduction = {
      ...newEgg,
      id: String(nextNumericId),
    };

    setEggProductions((prev) => [finalEgg, ...prev]);

    // Immediate localStorage sync
    try {
      const stored = localStorage.getItem('greenova_eggs_v2');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem('greenova_eggs_v2', JSON.stringify([finalEgg, ...(Array.isArray(parsed) ? parsed : [])]));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    const numFid =
      Number(finalEgg.flockId) ||
      (finalEgg.flockName?.includes('2') ? 9 : finalEgg.flockName?.includes('3') ? 10 : 8);

    fetch('/api/egg-production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: finalEgg.date,
        flockId: numFid,
        totalEggs: finalEgg.totalEggs,
        morningEggs: finalEgg.morningEggs,
        eveningEggs: finalEgg.eveningEggs,
        brokenEggs: finalEgg.damagedEggs,
        cartons: Math.floor(finalEgg.totalEggs / 360),
        trays: finalEgg.cleanTrays,
        averageWeight: 60,
        grade: 'standard',
        notes: finalEgg.notes || `Morning: ${finalEgg.morningEggs}, Evening: ${finalEgg.eveningEggs}`,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.id) {
          setEggProductions((prev) =>
            prev.map((e) => (e.id === finalEgg.id ? { ...e, id: String(res.data.id) } : e))
          );
        }
      })
      .catch((e) => console.warn('Egg persistence error:', e));
  };

  const handleAddFeed = (newFeed: FeedConsumption) => {
    setConsumptionLogs((prev) => [newFeed, ...prev]);
    const numFid =
      Number(newFeed.flockId) ||
      (newFeed.flockName?.includes('2') ? 9 : newFeed.flockName?.includes('3') ? 10 : 8);
    fetch('/api/daily-consumption', {
      method: 'POST',
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
    setMortalityLogs([newMort, ...mortalityLogs]);
    setFlocks(
      flocks.map((f) =>
        f.id === newMort.flockId
          ? { ...f, currentCount: Math.max(0, f.currentCount - newMort.count) }
          : f
      )
    );
    const numFid = newMort.flockId === '8' ? 8 : newMort.flockId === '9' ? 9 : 8;
    fetch('/api/bird-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: newMort.date,
        flockId: numFid,
        mortality: newMort.count,
        notes: newMort.cause,
      }),
    }).catch((e) => console.warn('Mortality persistence error:', e));
  };

  const handleAddVaccine = (newVaccine: VaccineLog) => {
    setVaccines((prev) => [newVaccine, ...prev]);
  };

  const handleAddFlock = (flock: Flock) => {
    setFlocks([...flocks, flock]);
    fetch('/api/flock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flockName: flock.name,
        breed: flock.breed,
        totalBirds: flock.initialCount,
        cost: flock.cost || 7500000,
        acquiredDate: flock.startDate,
      }),
    }).catch((e) => console.warn('Flock persistence error:', e));
  };

  const handleEditFlock = (updatedFlock: Flock) => {
    setFlocks(flocks.map((f) => (f.id === updatedFlock.id ? updatedFlock : f)));
    fetch(`/api/flock/${updatedFlock.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFlock),
    }).catch((e) => console.warn('Flock edit error:', e));
  };

  const handleDeleteFlock = (id: string) => {
    setFlocks(flocks.filter((f) => f.id !== id));
    fetch(`/api/flock/${id}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('Flock delete error:', e));
  };

  const handleToggleVaccine = (id: string) => {
    setVaccines(
      vaccines.map((v) =>
        v.id === id
          ? {
              ...v,
              status: v.status === 'Completed' ? 'Scheduled' : 'Completed',
              administeredDate:
                v.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0],
            }
          : v
      )
    );
  };

  const handleRestock = (id: string, amount: number) => {
    setInventory(
      inventory.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + amount } : item
      )
    );
  };

  const handleAddTransaction = (record: FinancialRecord) => {
    setFinancials([record, ...financials]);
    const isExp = record.type === 'Expense';
    fetch(isExp ? '/api/expense' : '/api/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: record.amount,
        expenseCost: record.amount,
        totalAmount: record.amount,
        head: record.category.toUpperCase().replace(/\s+/g, '_'),
        notes: record.description,
        flockId: 8,
        date: record.date,
      }),
    }).catch((e) => console.warn('Transaction persistence error:', e));
  };

  const handleAddSalaryDisbursal = (newSalary: SalaryDisbursal) => {
    setSalaryDisbursals((prev) => [newSalary, ...prev]);

    // If advance was deducted, update worker's advance balance and advance logs
    if (newSalary.advanceDeducted > 0) {
      setWorkers((prev) =>
        prev.map((w) =>
          w.name.toLowerCase() === newSalary.employeeName.toLowerCase()
            ? {
                ...w,
                advanceBalance: Math.max(0, (w.advanceBalance || 0) - newSalary.advanceDeducted),
              }
            : w
        )
      );

      let remainingToDeduct = newSalary.advanceDeducted;
      setAdvanceRecords((prev) =>
        prev.map((adv) => {
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
              repaymentStatus: newBal <= 0 ? 'Deducted' : 'Partially Deducted',
            };
          }
          return adv;
        })
      );
    }

    // Post to backend
    fetch('/api/salaries', {
      method: 'POST',
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
    setAdvanceRecords((prev) => [newAdvance, ...prev]);

    // Increase worker's advance balance
    setWorkers((prev) =>
      prev.map((w) =>
        w.name.toLowerCase() === newAdvance.employeeName.toLowerCase()
          ? { ...w, advanceBalance: (w.advanceBalance || 0) + newAdvance.advanceAmount }
          : w
      )
    );

    // Post to backend
    fetch('/api/salaries', {
      method: 'POST',
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
    setWorkers((prev) => [newWorker, ...prev]);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w))
    );
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
  }) => {
    setCurrentUser((prev) => {
      const next = prev ? { ...prev, ...updated } : { ...updated };
      try {
        localStorage.setItem('greenova_user', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // If not logged in, render the Login View directly
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          const profile = {
            name: user.name || (user.email.includes('aaglobal') ? 'Ahsan Nawaz' : 'Farm Supervisor'),
            email: user.email,
            token: user.token || 'auth-prod-' + Date.now(),
            phone: user.email.includes('aaglobal') ? '+92 300 8645210' : '+92 301 7654321',
            role: user.email.includes('aaglobal') ? 'Managing Director & Farm Admin' : 'Shed Supervisor',
            initials: user.email.includes('aaglobal') ? 'CN' : 'FS',
            emailVerified: true,
          };
          setCurrentUser(profile);
          try {
            localStorage.setItem('greenova_user', JSON.stringify(profile));
          } catch (e) {}
          const targetTab = currentTab && currentTab !== 'dashboard' ? currentTab : 'dashboard';
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
      {/* Top Header with Mobile Hamburger Menu */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenLogin={() => setShowLoginModal(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNavigateHome={() => handleNavigateTab('dashboard')}
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
            />
          )}

          {currentTab === 'egg-production' && (
            <EggProductionView
              eggProductions={eggProductions}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('egg')}
            />
          )}

          {currentTab === 'daily-consumption' && (
            <ConsumptionView
              consumptionLogs={consumptionLogs}
              flocks={flocks}
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
              defaultType="Income"
            />
          )}

          {currentTab === 'expenses' && (
            <FinanceView
              financials={financials}
              onAddTransaction={handleAddTransaction}
              defaultType="Expense"
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
            />
          )}

          {currentTab === 'farms' && (
            <FarmsView farms={farms} flocks={flocks} />
          )}

          {currentTab === 'users' && <UserManagementView />}
        </main>
      </div>

      {/* Switch Account Modal if invoked while logged in */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-w-md w-full">
            <LoginView
              onLoginSuccess={(user) => {
                const profile = {
                  name: user.name || (user.email.includes('aaglobal') ? 'Ahsan Nawaz' : 'Farm Supervisor'),
                  email: user.email,
                  token: user.token || 'auth-prod-' + Date.now(),
                  phone: user.email.includes('aaglobal') ? '+92 300 8645210' : '+92 301 7654321',
                  role: user.email.includes('aaglobal') ? 'Managing Director & Farm Admin' : 'Shed Supervisor',
                  initials: user.email.includes('aaglobal') ? 'CN' : 'FS',
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
      />
    </div>
  );
}
