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
import { ReportsView } from './components/ReportsView';
import { DatabaseBackupView } from './components/DatabaseBackupView';
import { LoginView } from './components/LoginView';
import { VpsSettingsModal } from './components/VpsSettingsModal';
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
  liveSalesRecords,
  liveExpenseRecords,
  liveStaffRecords,
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
} from './types/farm';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeFarm, setActiveFarm] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; token?: string } | null>(() => {
    const saved = localStorage.getItem('greenova_user');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'Ahsan Nawaz (Super Admin)',
          email: 'aaglobal500@gmail.com',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhYWdsb2JhbDUwMEBnbWFpbC5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3OTE4MTExNjEsImV4cCI6MTc5MTg5NzU2MX0.taxM9J57xlS55sB-zdLTeGXIOTa9Xx5zAzvbbijnCkk',
        };
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Modals state
  const [isVpsModalOpen, setIsVpsModalOpen] = useState(false);
  const [recordModalType, setRecordModalType] = useState<'egg' | 'mortality' | 'feed' | null>(null);

  // Persistent Domain State populated with 100% Authentic Live VPS Database
  const [farms] = useState<Farm[]>(liveFarms);
  const [flocks, setFlocks] = useState<Flock[]>(() => {
    const saved = localStorage.getItem('greenova_flocks');
    return saved ? JSON.parse(saved) : liveFlocks;
  });
  const [eggProductions, setEggProductions] = useState<EggProduction[]>(() => {
    const saved = localStorage.getItem('greenova_eggs');
    return saved ? JSON.parse(saved) : liveEggProductions;
  });
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(() => {
    const saved = localStorage.getItem('greenova_mortality');
    return saved ? JSON.parse(saved) : initialMortalityLogs;
  });
  const [vaccines, setVaccines] = useState<VaccineLog[]>(() => {
    const saved = localStorage.getItem('greenova_vaccines');
    return saved ? JSON.parse(saved) : initialVaccineSchedule;
  });
  const [consumptionLogs, setConsumptionLogs] = useState<FeedConsumption[]>(() => {
    const saved = localStorage.getItem('greenova_feed');
    return saved ? JSON.parse(saved) : initialConsumptionLogs;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('greenova_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => {
    const saved = localStorage.getItem('greenova_financials');
    return saved ? JSON.parse(saved) : [...liveSalesRecords, ...liveExpenseRecords];
  });
  const [workers] = useState<Worker[]>(liveStaffRecords);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('greenova_flocks', JSON.stringify(flocks));
  }, [flocks]);
  useEffect(() => {
    localStorage.setItem('greenova_eggs', JSON.stringify(eggProductions));
  }, [eggProductions]);
  useEffect(() => {
    localStorage.setItem('greenova_mortality', JSON.stringify(mortalityLogs));
  }, [mortalityLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_vaccines', JSON.stringify(vaccines));
  }, [vaccines]);
  useEffect(() => {
    localStorage.setItem('greenova_feed', JSON.stringify(consumptionLogs));
  }, [consumptionLogs]);
  useEffect(() => {
    localStorage.setItem('greenova_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('greenova_financials', JSON.stringify(financials));
  }, [financials]);

  // Handler functions
  const handleAddEgg = (newEgg: EggProduction) => {
    setEggProductions([newEgg, ...eggProductions]);
  };

  const handleAddFeed = (newFeed: FeedConsumption) => {
    setConsumptionLogs([newFeed, ...consumptionLogs]);
  };

  const handleAddMortality = (newMort: MortalityLog) => {
    setMortalityLogs([newMort, ...mortalityLogs]);
    // Also deduct from flock
    setFlocks(
      flocks.map((f) =>
        f.id === newMort.flockId
          ? { ...f, currentCount: Math.max(0, f.currentCount - newMort.count) }
          : f
      )
    );
  };

  const handleAddFlock = (flock: Flock) => {
    setFlocks([...flocks, flock]);
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        activeFarm={activeFarm}
        onSelectFarm={setActiveFarm}
        onOpenRecordModal={(type) => setRecordModalType(type)}
        onOpenVpsModal={() => setIsVpsModalOpen(true)}
        currentUser={currentUser}
        onSignOut={() => {
          localStorage.removeItem('greenova_user');
          setCurrentUser(null);
        }}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'vps-sync') {
              setIsVpsModalOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          isOpen={isSidebarOpen}
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
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'egg-production' && (
            <EggProductionView
              eggProductions={eggProductions}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('egg')}
            />
          )}

          {currentTab === 'flocks' && (
            <FlocksView
              flocks={flocks}
              farms={farms}
              onAddFlock={handleAddFlock}
            />
          )}

          {currentTab === 'bird-health' && (
            <BirdHealthView
              mortalityLogs={mortalityLogs}
              vaccines={vaccines}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('mortality')}
              onToggleVaccine={handleToggleVaccine}
            />
          )}

          {currentTab === 'daily-consumption' && (
            <ConsumptionView
              consumptionLogs={consumptionLogs}
              flocks={flocks}
              onOpenRecordModal={() => setRecordModalType('feed')}
            />
          )}

          {currentTab === 'stocks' && (
            <StocksView inventory={inventory} onRestock={handleRestock} />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              financials={financials}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {currentTab === 'salaries' && <StaffView workers={workers} />}

          {currentTab === 'reports' && (
            <ReportsView
              flocks={flocks}
              eggProductions={eggProductions}
              mortalityLogs={mortalityLogs}
              consumptionLogs={consumptionLogs}
            />
          )}

          {currentTab === 'database-backup' && (
            <DatabaseBackupView />
          )}
        </main>
      </div>

      {/* Popups & Modals */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 z-10 text-white/80 hover:text-white font-bold text-lg bg-black/30 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <LoginView
              onLoginSuccess={(user) => {
                localStorage.setItem('greenova_user', JSON.stringify(user));
                setCurrentUser(user);
                setShowLoginModal(false);
              }}
            />
          </div>
        </div>
      )}
      <VpsSettingsModal
        isOpen={isVpsModalOpen}
        onClose={() => setIsVpsModalOpen(false)}
      />

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
