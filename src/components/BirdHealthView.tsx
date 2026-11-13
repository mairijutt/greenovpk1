import React, { useState, useMemo, useEffect } from 'react';
import {
  HeartPulse,
  ShieldAlert,
  Plus,
  CheckCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  Activity,
  Syringe,
  X,
  Filter,
  BarChart2,
  Info,
  Users,
  ChevronDown,
} from 'lucide-react';
import { MortalityLog, VaccineLog, Flock, Farm } from '../types/farm';
import {
  StatCard,
  PageHeader,
  UIButton,
  UISearchInput,
  UIFilterBar,
  TableCard,
  DateRangePickerBar,
  DatePreset,
  UIInput,
  UISelect,
  UITextarea,
} from './ui';

interface BirdHealthViewProps {
  mortalityLogs: MortalityLog[];
  vaccines: VaccineLog[];
  flocks: Flock[];
  onOpenRecordModal: (type: 'mortality') => void;
  onToggleVaccine: (id: string) => void;
  onAddVaccine?: (vaccine: VaccineLog) => void;
  farms?: Farm[];
  selectedFarmId?: string;
  onSelectFarm?: (farmId: string) => void;
}

type HealthChartMode = 'mortality' | 'rate';
type VaccineFilterStatus = 'all' | 'scheduled' | 'completed';

export const BirdHealthView: React.FC<BirdHealthViewProps> = ({
  mortalityLogs,
  vaccines,
  flocks,
  onOpenRecordModal,
  onToggleVaccine,
  onAddVaccine,
  farms = [],
  selectedFarmId = 'all',
  onSelectFarm,
}) => {
  const latestDate = useMemo(() => {
    return mortalityLogs[0]?.date || '2026-10-24';
  }, [mortalityLogs]);

  const defaultFarmId = farms[0]?.id || 'farm-1';
  const [activeTab, setActiveTab] = useState<'mortality' | 'vaccines'>('mortality');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(
    selectedFarmId && selectedFarmId !== 'all' ? selectedFarmId : defaultFarmId
  );
  const [selectedFlock, setSelectedFlock] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preset, setPreset] = useState<DatePreset>('all');

  const isFirstFarm = selectedFarm === defaultFarmId || selectedFarm === 'farm-1';

  // Sync external farm selection if changed
  useEffect(() => {
    if (selectedFarmId !== undefined) {
      setSelectedFarm(selectedFarmId && selectedFarmId !== 'all' ? selectedFarmId : defaultFarmId);
    }
  }, [selectedFarmId, defaultFarmId]);

  const handleFarmChange = (fId: string) => {
    setSelectedFarm(fId);
    setSelectedFlock('all');
    onSelectFarm?.(fId);
  };

  // Vaccine sub-filter status
  const [vaccineStatusFilter, setVaccineStatusFilter] = useState<VaccineFilterStatus>('all');

  // Chart Interactive Controls
  const [chartMode, setChartMode] = useState<HealthChartMode>('mortality');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // Vaccine Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetFlockId, setTargetFlockId] = useState('8');
  const [vaccineName, setVaccineName] = useState('ND + IB Lasota Booster');
  const [scheduledWeek, setScheduledWeek] = useState(38);
  const [scheduledDate, setScheduledDate] = useState('2026-11-05');
  const [method, setMethod] = useState('Drinking Water');
  const [dosage, setDosage] = useState('25,000 Doses');
  const [batchNumber, setBatchNumber] = useState('V-2026-901');
  const [vaccineStatus, setVaccineStatus] = useState<'Scheduled' | 'Completed'>('Scheduled');
  const [vetNotes, setVetNotes] = useState('Maintain cold chain at 2-8°C. Water withheld 2 hours prior to administration.');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Handle Preset change
  const handlePresetChange = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    if (selectedPreset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (selectedPreset === 'today') {
      const todayStr = getTodayDateStr();
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (selectedPreset === '30d') {
      const todayStr = getTodayDateStr();
      const ref = new Date(todayStr);
      const prior = new Date(ref);
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const handleReset = () => {
    setSelectedFlock('all');
    setSelectedFarm(defaultFarmId);
    onSelectFarm?.(defaultFarmId);
    setFromDate('');
    setToDate('');
    setPreset('all');
    setSearchTerm('');
  };

  // Flocks available under the selected farm
  const availableFlocks = useMemo(() => {
    if (isFirstFarm) {
      return flocks.filter(
        (f) => f.farmId === 'farm-1' || f.id === '8' || f.id === '9' || f.id === '10'
      );
    }
    return flocks.filter((f) => {
      if (f.farmId === selectedFarm) return true;
      const farmObj = farms.find((farm) => farm.id === selectedFarm);
      return farmObj && f.farmName && f.farmName.toLowerCase().includes(farmObj.name.toLowerCase());
    });
  }, [flocks, selectedFarm, farms, isFirstFarm]);

  // Flock census data matching official farm records
  const flockCensus = useMemo(() => {
    if (!isFirstFarm) {
      if (availableFlocks.length === 0) {
        return {
          all: {
            activeBirds: 0,
            capacity: 0,
            mortality: 0,
            mortalityRate: 0,
            status: 'No Flocks Registered',
          },
          unit1: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
          unit2: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
          unit3: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
        };
      }

      const totalActiveBirds = availableFlocks.reduce((sum, f) => sum + (f.currentCount || 0), 0);
      const totalCapacity = availableFlocks.reduce((sum, f) => sum + (f.initialCount || f.currentCount || 0), 0);
      const availIds = new Set(availableFlocks.map((f) => String(f.id)));
      const availNames = new Set(availableFlocks.map((f) => f.name.toLowerCase()));
      const flMortFromFlocks = availableFlocks.reduce((sum, f) => sum + (f.mortality || 0), 0);
      const totalMortLogs = mortalityLogs
        .filter((m) => (m.flockId && availIds.has(String(m.flockId))) || (m.flockName && availNames.has(m.flockName.toLowerCase())))
        .reduce((sum, m) => sum + (m.count || 0), 0);
      const totalMort = Math.max(totalMortLogs, flMortFromFlocks);
      const mortRate = totalActiveBirds > 0 ? Number(((totalMort / totalActiveBirds) * 100).toFixed(3)) : 0;

      return {
        all: {
          activeBirds: totalActiveBirds,
          capacity: totalCapacity,
          mortality: totalMort,
          mortalityRate: mortRate,
          status: 'Active Bio-Security Monitoring',
        },
        unit1: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
        unit2: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
        unit3: { id: '0', name: 'N/A', currentCount: 0, initialCount: 0, activeBirds: 0, capacity: 0, mortality: 0, mortalityRate: 0, status: 'No Data', ageWeeks: 0, breed: '-' },
      };
    }

    const u1 = flocks.find((f) => f.id === '8' || f.name === 'Unit 1') || {
      id: '8',
      name: 'Unit 1',
      currentCount: 24786,
      initialCount: 25000,
      shedNumber: 'Shed 1',
      ageWeeks: 38,
      breed: 'Lohmann Brown (LSL)',
      mortality: 5,
    };
    const u2 = flocks.find((f) => f.id === '9' || f.name === 'Unit 2') || {
      id: '9',
      name: 'Unit 2',
      currentCount: 31739,
      initialCount: 35000,
      shedNumber: 'Shed 2',
      ageWeeks: 32,
      breed: 'Lohmann Brown (Primary)',
      mortality: 7,
    };
    const u3 = flocks.find((f) => f.id === '10' || f.name === 'Unit 3') || {
      id: '10',
      name: 'Unit 3',
      currentCount: 25189,
      initialCount: 25500,
      shedNumber: 'Shed 3',
      ageWeeks: 26,
      breed: 'Hy-Line W-36 Batch',
      mortality: 3,
    };

    const getMortCount = (fid: string) =>
      mortalityLogs
        .filter((m) => m.flockId === fid || m.flockName?.includes(fid === '8' ? '1' : fid === '9' ? '2' : '3'))
        .reduce((sum, m) => sum + (m.count || 0), 0);

    const u1Mort = u1.mortality !== undefined ? Math.max(u1.mortality, getMortCount('8')) : (getMortCount('8') || 5);
    const u2Mort = u2.mortality !== undefined ? Math.max(u2.mortality, getMortCount('9')) : (getMortCount('9') || 7);
    const u3Mort = u3.mortality !== undefined ? Math.max(u3.mortality, getMortCount('10')) : (getMortCount('10') || 3);
    const extraUnitsMort = availableFlocks
      .filter((f) => f.id !== '8' && f.id !== '9' && f.id !== '10' && !['Unit 1', 'Unit 2', 'Unit 3'].includes(f.name))
      .reduce((sum, f) => sum + (f.mortality || 0), 0);
    const totalMort = Math.max(
      mortalityLogs.reduce((sum, m) => sum + (m.count || 0), 0),
      u1Mort + u2Mort + u3Mort + extraUnitsMort
    );

    const totalActiveBirds = u1.currentCount + u2.currentCount + u3.currentCount;
    const totalCapacity = (u1.initialCount || 25000) + (u2.initialCount || 35000) + (u3.initialCount || 25500);

    return {
      all: {
        activeBirds: totalActiveBirds,
        capacity: totalCapacity,
        mortality: totalMort,
        mortalityRate: Number(((totalMort / (totalActiveBirds || 1)) * 100).toFixed(3)),
        status: 'Optimal Bio-Security (Level 1)',
      },
      unit1: {
        ...u1,
        activeBirds: u1.currentCount,
        capacity: u1.initialCount || 25000,
        mortality: u1Mort,
        mortalityRate: Number(((u1Mort / (u1.currentCount || 1)) * 100).toFixed(3)),
        status: 'Normal Attrition',
      },
      unit2: {
        ...u2,
        activeBirds: u2.currentCount,
        capacity: u2.initialCount || 35000,
        mortality: u2Mort,
        mortalityRate: Number(((u2Mort / (u2.currentCount || 1)) * 100).toFixed(3)),
        status: 'Ventilation Serviced',
      },
      unit3: {
        ...u3,
        activeBirds: u3.currentCount,
        capacity: u3.initialCount || 25500,
        mortality: u3Mort,
        mortalityRate: Number(((u3Mort / (u3.currentCount || 1)) * 100).toFixed(3)),
        status: 'Optimal Mineral Balance',
      },
    };
  }, [flocks, mortalityLogs, isFirstFarm, availableFlocks]);

  // Current scope population & mortality metrics
  const scopedMetrics = useMemo(() => {
    if (!isFirstFarm) {
      if (availableFlocks.length === 0) {
        return {
          label: 'No Units Registered',
          activeBirds: 0,
          capacity: 0,
          mortality: 0,
          mortalityRate: 0,
          ageWeeks: 0,
          breed: 'None',
        };
      }
      if (selectedFlock !== 'all') {
        const fl = availableFlocks.find((f) => String(f.id) === selectedFlock || f.name === selectedFlock);
        if (fl) {
          const flMort = mortalityLogs
            .filter((m) => String(m.flockId) === String(fl.id) || m.flockName === fl.name)
            .reduce((s, m) => s + (m.count || 0), 0);
          const act = fl.currentCount || 0;
          const cap = fl.initialCount || fl.currentCount || 0;
          return {
            label: fl.name,
            activeBirds: act,
            capacity: cap,
            mortality: flMort,
            mortalityRate: act > 0 ? Number(((flMort / act) * 100).toFixed(3)) : 0,
            ageWeeks: fl.ageWeeks || 0,
            breed: fl.breed || 'Commercial Layer',
          };
        }
      }
      return {
        label: 'All Units Combined',
        activeBirds: flockCensus.all.activeBirds,
        capacity: flockCensus.all.capacity,
        mortality: flockCensus.all.mortality,
        mortalityRate: flockCensus.all.mortalityRate,
        ageWeeks: Math.round(availableFlocks.reduce((s, f) => s + (f.ageWeeks || 0), 0) / (availableFlocks.length || 1)),
        breed: 'Commercial Layers',
      };
    }

    if (selectedFlock === '8' || selectedFlock === 'Unit 1') {
      return {
        label: 'Unit 1 (Shed 1)',
        activeBirds: flockCensus.unit1.activeBirds,
        capacity: flockCensus.unit1.capacity,
        mortality: flockCensus.unit1.mortality,
        mortalityRate: flockCensus.unit1.mortalityRate,
        ageWeeks: flockCensus.unit1.ageWeeks,
        breed: flockCensus.unit1.breed,
      };
    }
    if (selectedFlock === '9' || selectedFlock === 'Unit 2') {
      return {
        label: 'Unit 2 (Shed 2)',
        activeBirds: flockCensus.unit2.activeBirds,
        capacity: flockCensus.unit2.capacity,
        mortality: flockCensus.unit2.mortality,
        mortalityRate: flockCensus.unit2.mortalityRate,
        ageWeeks: flockCensus.unit2.ageWeeks,
        breed: flockCensus.unit2.breed,
      };
    }
    if (selectedFlock === '10' || selectedFlock === 'Unit 3') {
      return {
        label: 'Unit 3 (Shed 3)',
        activeBirds: flockCensus.unit3.activeBirds,
        capacity: flockCensus.unit3.capacity,
        mortality: flockCensus.unit3.mortality,
        mortalityRate: flockCensus.unit3.mortalityRate,
        ageWeeks: flockCensus.unit3.ageWeeks,
        breed: flockCensus.unit3.breed,
      };
    }
    return {
      label: 'All Units Combined',
      activeBirds: flockCensus.all.activeBirds,
      capacity: flockCensus.all.capacity,
      mortality: flockCensus.all.mortality,
      mortalityRate: flockCensus.all.mortalityRate,
      ageWeeks: 32,
      breed: 'Lohmann Brown & Hy-Line Layers',
    };
  }, [selectedFlock, flockCensus, isFirstFarm, availableFlocks, mortalityLogs]);

  // Filtered mortality logs
  const filteredMortality = useMemo(() => {
    if (!isFirstFarm) {
      if (availableFlocks.length === 0) return [];
      const availIds = new Set(availableFlocks.map((f) => String(f.id)));
      const availNames = new Set(availableFlocks.map((f) => f.name.toLowerCase()));

      return mortalityLogs.filter((log) => {
        const matchesFarmFlock =
          (log.flockId && availIds.has(String(log.flockId))) ||
          (log.flockName && availNames.has(log.flockName.toLowerCase())) ||
          (log.flockName && availableFlocks.some((f) => log.flockName.toLowerCase().includes(f.name.toLowerCase())));
        if (!matchesFarmFlock) return false;

        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          log.flockName.toLowerCase().includes(q) ||
          log.cause.toLowerCase().includes(q) ||
          (log.symptoms && log.symptoms.toLowerCase().includes(q)) ||
          log.recordedBy.toLowerCase().includes(q) ||
          log.date.includes(q);
        const matchesFlock =
          selectedFlock === 'all' ||
          String(log.flockId) === selectedFlock ||
          log.flockName === selectedFlock;
        const matchesFrom = !fromDate || log.date >= fromDate;
        const matchesTo = !toDate || log.date <= toDate;
        return matchesSearch && matchesFlock && matchesFrom && matchesTo;
      });
    }

    const greenOvaFlockIds = new Set(['8', '9', '10']);
    return mortalityLogs.filter((log) => {
      const isGreenOvaMatch =
        (log.flockId && greenOvaFlockIds.has(String(log.flockId))) ||
        (log.flockName && (log.flockName.includes('1') || log.flockName.includes('2') || log.flockName.includes('3')));
      if (!isGreenOvaMatch) return false;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        log.flockName.toLowerCase().includes(q) ||
        log.cause.toLowerCase().includes(q) ||
        (log.symptoms && log.symptoms.toLowerCase().includes(q)) ||
        log.recordedBy.toLowerCase().includes(q) ||
        log.date.includes(q);
      const matchesFlock =
        selectedFlock === 'all' ||
        String(log.flockId) === selectedFlock ||
        log.flockName === selectedFlock;
      const matchesFrom = !fromDate || log.date >= fromDate;
      const matchesTo = !toDate || log.date <= toDate;
      return matchesSearch && matchesFlock && matchesFrom && matchesTo;
    });
  }, [mortalityLogs, isFirstFarm, availableFlocks, searchTerm, selectedFlock, fromDate, toDate]);

  // Filtered vaccine schedules
  const filteredVaccines = useMemo(() => {
    if (!isFirstFarm) {
      if (availableFlocks.length === 0) return [];
      const availIds = new Set(availableFlocks.map((f) => String(f.id)));
      const availNames = new Set(availableFlocks.map((f) => f.name.toLowerCase()));

      return vaccines.filter((v) => {
        const vFlockName = v.flockName?.toLowerCase();
        const matchesFarmFlock =
          (v.flockId && availIds.has(String(v.flockId))) ||
          (vFlockName && availNames.has(vFlockName)) ||
          (vFlockName && availableFlocks.some((f) => vFlockName.includes(f.name.toLowerCase())));
        if (!matchesFarmFlock) return false;

        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          v.vaccineName.toLowerCase().includes(q) ||
          v.method.toLowerCase().includes(q) ||
          (v.flockName && v.flockName.toLowerCase().includes(q)) ||
          (v.vetNotes && v.vetNotes.toLowerCase().includes(q));

        const matchesFlock =
          selectedFlock === 'all' ||
          String(v.flockId) === selectedFlock ||
          (v.flockName && v.flockName === selectedFlock);

        const matchesStatus =
          vaccineStatusFilter === 'all' ||
          (vaccineStatusFilter === 'scheduled' && v.status !== 'Completed') ||
          (vaccineStatusFilter === 'completed' && v.status === 'Completed');

        return matchesSearch && matchesFlock && matchesStatus;
      });
    }

    const greenOvaFlockIds = new Set(['8', '9', '10']);
    return vaccines.filter((v) => {
      const vFlockName = v.flockName?.toLowerCase();
      const isGreenOvaMatch =
        (v.flockId && greenOvaFlockIds.has(String(v.flockId))) ||
        (vFlockName && (vFlockName.includes('1') || vFlockName.includes('2') || vFlockName.includes('3')));
      if (!isGreenOvaMatch) return false;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        v.vaccineName.toLowerCase().includes(q) ||
        v.method.toLowerCase().includes(q) ||
        (v.flockName && v.flockName.toLowerCase().includes(q)) ||
        (v.vetNotes && v.vetNotes.toLowerCase().includes(q));

      const matchesFlock =
        selectedFlock === 'all' ||
        String(v.flockId) === selectedFlock ||
        (v.flockName && v.flockName === selectedFlock);

      const matchesStatus =
        vaccineStatusFilter === 'all' ||
        (vaccineStatusFilter === 'scheduled' && v.status !== 'Completed') ||
        (vaccineStatusFilter === 'completed' && v.status === 'Completed');

      return matchesSearch && matchesFlock && matchesStatus;
    });
  }, [vaccines, isFirstFarm, availableFlocks, searchTerm, selectedFlock, vaccineStatusFilter]);

  const totalPeriodDeaths = filteredMortality.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const pendingVaccines = filteredVaccines.filter((v) => v.status !== 'Completed').length;
  const completedVaccines = filteredVaccines.filter((v) => v.status === 'Completed').length;

  // Group mortality logs by calendar date for interactive chart
  const dailyHealthChartData = useMemo(() => {
    const dateMap = new Map<
      string,
      {
        date: string;
        formattedDate: string;
        totalDeaths: number;
        unit1Deaths: number;
        unit2Deaths: number;
        unit3Deaths: number;
        causes: string[];
      }
    >();

    for (const log of filteredMortality) {
      if (!log.date) continue;
      const d = log.date;
      if (!dateMap.has(d)) {
        const dateObj = new Date(d);
        const formattedDate = isNaN(dateObj.getTime())
          ? d
          : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap.set(d, {
          date: d,
          formattedDate,
          totalDeaths: 0,
          unit1Deaths: 0,
          unit2Deaths: 0,
          unit3Deaths: 0,
          causes: [],
        });
      }
      const entry = dateMap.get(d)!;
      entry.totalDeaths += log.count || 0;
      entry.causes.push(log.cause);

      if (log.flockId === '8' || log.flockName?.includes('1')) {
        entry.unit1Deaths += log.count || 0;
      } else if (log.flockId === '9' || log.flockName?.includes('2')) {
        entry.unit2Deaths += log.count || 0;
      } else if (log.flockId === '10' || log.flockName?.includes('3')) {
        entry.unit3Deaths += log.count || 0;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMortality]);

  // Handle Vaccine Scheduling Form Submit
  const handleScheduleVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFlock = flocks.find((f) => f.id === targetFlockId) || flocks[0] || {
      id: '8',
      name: 'Unit 1',
    };

    const newVaccine: VaccineLog = {
      id: `v-${Date.now()}`,
      flockId: targetFlock.id,
      flockName: targetFlock.name,
      vaccineName,
      scheduledWeek: Number(scheduledWeek) || 30,
      scheduledDate,
      administeredDate: vaccineStatus === 'Completed' ? scheduledDate : undefined,
      status: vaccineStatus,
      method,
      dosage,
      batchNumber,
      vetNotes,
    };

    if (onAddVaccine) {
      onAddVaccine(newVaccine);
    }

    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
      setIsScheduleModalOpen(false);
    }, 800);
  };

  const activeTooltipData =
    hoveredDayIdx !== null && dailyHealthChartData[hoveredDayIdx]
      ? dailyHealthChartData[hoveredDayIdx]
      : null;

  return (
    <div className="space-y-6">
      {/* Standardized Page Header with Primary Action Buttons */}
      <PageHeader
        title="Bird Health &amp; Bio-Security Management"
        subtitle="Manage flock mortality logs, veterinary autopsy findings, and preventative layer vaccination schedules across all 3 units."
        icon={HeartPulse}
        iconColor="rose"
        badge="Bio-Security Level 1 Active"
        actions={
          <div className="flex items-center space-x-2">
            <UIButton
              variant="primary"
              icon={Syringe}
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule Vaccine / Medicine
            </UIButton>
            <UIButton
              variant="danger"
              icon={Plus}
              onClick={() => onOpenRecordModal('mortality')}
            >
              Log Mortality
            </UIButton>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. TOTAL BIRDS & TOTAL MORTALITY (IN TOTAL AND FLOCK-WISE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Flock Population Census &amp; Mortality Status (Total &amp; Flock-Wise)
            </h3>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Click any card to filter health records by shed
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {/* All Units Card */}
          <button
            type="button"
            onClick={() => setSelectedFlock('all')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFlock === 'all'
                ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>All Flocks Combined</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 font-semibold text-slate-700">
                {isFirstFarm ? '3 of 3 Active' : `${availableFlocks.length} Active`}
              </span>
            </div>
            <div className="mt-2 text-xl font-black text-slate-900 font-mono">
              {flockCensus.all.activeBirds.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {flockCensus.all.capacity.toLocaleString()} Birds
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2">
              <span className="text-slate-600 font-medium">Total Mortality:</span>
              <span className="font-bold text-rose-600 font-mono">
                {flockCensus.all.mortality} Deaths ({flockCensus.all.mortalityRate}%)
              </span>
            </div>
          </button>

          {isFirstFarm ? (
            <>
              {/* Unit 1 Card */}
              <button
                type="button"
                onClick={() => setSelectedFlock('8')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedFlock === '8' || selectedFlock === 'Unit 1'
                    ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Unit 1 (Shed 1)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                    Week {flockCensus.unit1.ageWeeks}
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-emerald-800 font-mono">
                  {flockCensus.unit1.activeBirds.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {flockCensus.unit1.capacity.toLocaleString()} Birds
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2">
                  <span className="text-slate-600 font-medium">Unit 1 Mortality:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {flockCensus.unit1.mortality} Deaths ({flockCensus.unit1.mortalityRate}%)
                  </span>
                </div>
              </button>

              {/* Unit 2 Card */}
              <button
                type="button"
                onClick={() => setSelectedFlock('9')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedFlock === '9' || selectedFlock === 'Unit 2'
                    ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Unit 2 (Shed 2)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                    Week {flockCensus.unit2.ageWeeks}
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-blue-800 font-mono">
                  {flockCensus.unit2.activeBirds.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {flockCensus.unit2.capacity.toLocaleString()} Birds
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2">
                  <span className="text-slate-600 font-medium">Unit 2 Mortality:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {flockCensus.unit2.mortality} Deaths ({flockCensus.unit2.mortalityRate}%)
                  </span>
                </div>
              </button>

              {/* Unit 3 Card */}
              <button
                type="button"
                onClick={() => setSelectedFlock('10')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedFlock === '10' || selectedFlock === 'Unit 3'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Unit 3 (Shed 3)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                    Week {flockCensus.unit3.ageWeeks}
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-amber-800 font-mono">
                  {flockCensus.unit3.activeBirds.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {flockCensus.unit3.capacity.toLocaleString()} Birds
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2">
                  <span className="text-slate-600 font-medium">Unit 3 Mortality:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {flockCensus.unit3.mortality} Deaths ({flockCensus.unit3.mortalityRate}%)
                  </span>
                </div>
              </button>
            </>
          ) : availableFlocks.length === 0 ? (
            <div className="sm:col-span-3 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-slate-600">No units registered for this farm yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Please add units and flocks in the Flocks tab to record bird health data.</p>
            </div>
          ) : (
            availableFlocks.map((flock, idx) => {
              const flMort = mortalityLogs
                .filter((m) => String(m.flockId) === String(flock.id) || m.flockName === flock.name)
                .reduce((s, m) => s + (m.count || 0), 0);
              const act = flock.currentCount || 0;
              const cap = flock.initialCount || flock.currentCount || 0;
              const rate = act > 0 ? Number(((flMort / act) * 100).toFixed(3)) : 0;
              const colors = [
                { bg: 'bg-emerald-500/10', border: 'border-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-800' },
                { bg: 'bg-blue-500/10', border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-800' },
                { bg: 'bg-amber-500/10', border: 'border-amber-500', dot: 'bg-amber-500', text: 'text-amber-800' },
                { bg: 'bg-purple-500/10', border: 'border-purple-500', dot: 'bg-purple-500', text: 'text-purple-800' },
              ];
              const c = colors[idx % colors.length];
              const isSelected = selectedFlock === String(flock.id) || selectedFlock === flock.name;

              return (
                <button
                  key={flock.id}
                  type="button"
                  onClick={() => setSelectedFlock(String(flock.id))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${c.bg} ${c.border} ring-2 ring-emerald-500/20`
                      : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span>{flock.name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 text-slate-700 font-semibold">
                      Week {flock.ageWeeks || 1}
                    </span>
                  </div>
                  <div className={`mt-2 text-xl font-black ${c.text} font-mono`}>
                    {act.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / {cap.toLocaleString()} Birds
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2">
                    <span className="text-slate-600 font-medium">{flock.name} Mortality:</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {flMort} Deaths ({rate}%)
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <DateRangePickerBar
        selectedFarm={selectedFarm}
        onSelectFarm={handleFarmChange}
        farms={farms}
        selectedFlock={selectedFlock}
        onSelectFlock={setSelectedFlock}
        flocks={availableFlocks}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={(from, to) => {
          setFromDate(from);
          setToDate(to);
        }}
        activePreset={preset}
        onPresetChange={handlePresetChange}
        onReset={handleReset}
      />

      {/* Standardized KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Live Population"
          value={scopedMetrics.activeBirds.toLocaleString()}
          unit="Birds"
          icon={Users}
          color="emerald"
          valueColor="text-emerald-800"
          badge={{ text: `${scopedMetrics.capacity.toLocaleString()} Capacity`, color: 'emerald' }}
          subtext={scopedMetrics.label}
        />

        <StatCard
          title="Monitored Casualties"
          value={totalPeriodDeaths}
          unit="Deaths"
          icon={HeartPulse}
          color="rose"
          valueColor="text-rose-600"
          badge={{ text: `${scopedMetrics.mortalityRate}% Rate`, color: 'rose' }}
          subtext="Casualties within selected scope"
        />

        <StatCard
          title="Pending Vaccines"
          value={pendingVaccines}
          unit="Doses Due"
          icon={Clock}
          color="amber"
          badge={{ text: 'Preventative Due', color: 'amber' }}
          subtext="Scheduled disease prophylaxis"
        />

        <StatCard
          title="Completed Vaccinations"
          value={completedVaccines}
          unit="Batches"
          icon={CheckCircle}
          color="teal"
          badge={{ text: 'Cold Chain Verified', color: 'teal' }}
          subtext="Successfully inoculated"
        />
      </div>



      {/* Standardized Filters & Tab Bar */}
      <UIFilterBar>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('mortality')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'mortality'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Mortality Records ({filteredMortality.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vaccines')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'vaccines'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vaccine Schedules ({filteredVaccines.length})</span>
            </button>
          </div>

          {activeTab === 'vaccines' && (
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setVaccineStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  vaccineStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({vaccines.length})
              </button>
              <button
                type="button"
                onClick={() => setVaccineStatusFilter('scheduled')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  vaccineStatusFilter === 'scheduled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Scheduled Due ({pendingVaccines})
              </button>
              <button
                type="button"
                onClick={() => setVaccineStatusFilter('completed')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  vaccineStatusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Administered ({completedVaccines})
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <UISearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder={
              activeTab === 'mortality'
                ? 'Filter cause, vet, or symptoms...'
                : 'Search vaccine name or method...'
            }
            containerClassName="w-full sm:w-72"
          />

          {farms && farms.length > 0 && (
            <div className="relative inline-flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Filter bird health records by farm"
                value={selectedFarm}
                onChange={(e) => handleFarmChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors appearance-none cursor-pointer shadow-xs"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} ({farm.location || 'Active'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          )}
        </div>
      </UIFilterBar>

      {/* Main Content Area */}
      {activeTab === 'mortality' ? (
        <TableCard
          title="Post-Mortem &amp; Death Cause Log"
          subtitle="Autopsy findings, mortality counts, and veterinary cause analysis"
          badge={
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200/60">
              Total {totalPeriodDeaths} deaths in period
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-20">Log ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flock / Shed</th>
                  <th className="py-3 px-4 text-center">Deaths</th>
                  <th className="py-3 px-4">Identified Cause</th>
                  <th className="py-3 px-4">Autopsy Symptoms / Clinical Remarks</th>
                  <th className="py-3 px-4">Inspecting Vet / Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMortality.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No mortality records match the selected date range and filters.
                    </td>
                  </tr>
                ) : (
                  filteredMortality.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                          #{log.id.replace('m-', '')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            log.flockName?.includes('Unit 2')
                              ? 'bg-blue-100 text-blue-900'
                              : log.flockName?.includes('Unit 1')
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.flockName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono text-xs">
                          {log.count}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {log.cause}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate italic">
                        {log.symptoms || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {log.recordedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      ) : (
        /* VACCINE SCHEDULES GRID */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Preventative Layer Vaccination Protocols
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled and verified batch administrations for commercial layer sheds
              </p>
            </div>
            <UIButton
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              + Schedule Vaccine / Medicine
            </UIButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVaccines.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No vaccine schedules match the filter criteria.
              </div>
            ) : (
              filteredVaccines.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.flockName?.includes('Unit 2')
                              ? 'bg-blue-100 text-blue-900'
                              : v.flockName?.includes('Unit 1')
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {v.flockName || `Unit ${v.flockId}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Week {v.scheduledWeek}
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleVaccine(v.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition-colors ${
                          v.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {v.status === 'Completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Administered</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Scheduled Due</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1">{v.vaccineName}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Method: {v.method}
                      </span>
                      {v.dosage && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium font-mono">
                          {v.dosage}
                        </span>
                      )}
                      {v.batchNumber && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">
                          #{v.batchNumber}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                      {v.administeredDate ? (
                        <div className="flex items-center text-emerald-700 font-semibold space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Administered on {v.administeredDate}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-700 font-semibold space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Target Date: {v.scheduledDate || 'Upcoming layer batch'}</span>
                        </div>
                      )}
                      {v.vetNotes && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {v.vetNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onToggleVaccine(v.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        v.status === 'Completed'
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {v.status === 'Completed' ? 'Mark as Scheduled' : '✓ Mark as Administered'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VACCINE SCHEDULING FORM / MODAL */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Schedule Flock Vaccination / Medication
                  </h2>
                  <p className="text-xs text-slate-500">
                    Schedules preventative vaccines or medicine with instant Header Bell prompt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Vaccine / Medicine Scheduled Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  {vaccineName} scheduled for {flocks.find((f) => f.id === targetFlockId)?.name || 'flock'} on {scheduledDate}.
                </p>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  <span>🔔 Prompt dispatched to Header Bell Icon!</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleScheduleVaccineSubmit} className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <UISelect
                    label="Target Flock / Unit"
                    value={targetFlockId}
                    onChange={(e) => setTargetFlockId(e.target.value)}
                  >
                    {flocks.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.shedNumber || `Shed ${f.id}`}) — {(f.currentCount || 25000).toLocaleString()} Birds
                      </option>
                    ))}
                  </UISelect>

                  <UIInput
                    label="Scheduled Target Date"
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vaccine Formulation / Medication / Antigen
                  </label>
                  <input
                    type="text"
                    required
                    list="vaccine-suggestions"
                    value={vaccineName}
                    onChange={(e) => setVaccineName(e.target.value)}
                    placeholder="e.g. ND + IB Lasota Booster or Vitamin AD3E Boost"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <datalist id="vaccine-suggestions">
                    <option value="ND + IB Lasota Booster" />
                    <option value="Vitamin AD3E + Selenium Solution (Medicine)" />
                    <option value="Amoxicillin 20% Water Medication (Medicine)" />
                    <option value="Electrolytes & Anti-Stress Powder (Medicine)" />
                    <option value="Infectious Coryza Inactivated (Avibacterium)" />
                    <option value="Salmonella Enteritidis Inactivated" />
                    <option value="Avian Influenza H9N2 Inactivated" />
                    <option value="Egg Drop Syndrome (EDS-76) Inactivated" />
                    <option value="Dewormer Levamisole 10% (Medicine)" />
                    <option value="Calcium & Phosphorus D3 Booster (Medicine)" />
                    <option value="Liver Tonic & Kidney Flush Solution (Medicine)" />
                    <option value="Gumboro (IBD Intermediate Plus)" />
                    <option value="Mycoplasma Gallisepticum (MG-6/85)" />
                    <option value="ND Clone 30 + IB H120 Live" />
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <UIInput
                    label="Flock Age / Week"
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={scheduledWeek}
                    onChange={(e) => setScheduledWeek(Number(e.target.value))}
                  />

                  <UISelect
                    label="Administration Method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Subcutaneous Injection">Subcutaneous Injection</option>
                    <option value="Intramuscular Injection">Intramuscular Injection</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Spray">Coarse Spray</option>
                    <option value="Wing Web">Wing Web Puncture</option>
                  </UISelect>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <UIInput
                    label="Target Dosage / Quantity"
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 25,000 Doses or 0.5 ml/bird"
                  />

                  <UIInput
                    label="Batch / Serial No."
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. V-2026-901"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Administration Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVaccineStatus('Scheduled')}
                      className={`py-2 px-3 rounded-lg border font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                        vaccineStatus === 'Scheduled'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Scheduled Due</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVaccineStatus('Completed')}
                      className={`py-2 px-3 rounded-lg border font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                        vaccineStatus === 'Completed'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Administered (Completed)</span>
                    </button>
                  </div>
                </div>

                <UITextarea
                  label="Veterinary Notes & Biosecurity Instructions"
                  rows={2}
                  value={vetNotes}
                  onChange={(e) => setVetNotes(e.target.value)}
                  placeholder="e.g. Skimmed milk stabilizer (2g/L), 2 hrs water deprivation prior to intake"
                />

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <UIButton
                    type="button"
                    variant="secondary"
                    onClick={() => setIsScheduleModalOpen(false)}
                  >
                    Cancel
                  </UIButton>
                  <UIButton
                    type="submit"
                    variant="primary"
                    icon={Syringe}
                  >
                    Save Vaccine Schedule
                  </UIButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
