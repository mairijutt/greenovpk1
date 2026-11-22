import React, { useMemo, useState } from 'react';
import {
  Zap,
  Sun,
  Fuel,
  PlugZap,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
} from 'lucide-react';
import { Flock, PowerConsumptionRecord } from '../types/farm';
import { getInitialUrlFilters } from '../utils/urlFilters';
import { downloadRecordsCSV, downloadRecordsPDF } from '../utils/exportRecords';
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
  RecordDetailModal,
} from './ui';

interface PowerConsumptionViewProps {
  powerLogs: PowerConsumptionRecord[];
  flocks: Flock[];
  onAddPowerLog: (record: Omit<PowerConsumptionRecord, 'id'>) => Promise<PowerConsumptionRecord | void> | void;
  onEditPowerLog: (record: PowerConsumptionRecord) => Promise<void> | void;
  onDeletePowerLog: (record: PowerConsumptionRecord) => Promise<void> | void;
}

const DEFAULT_SOLAR_RATE_PKR = 35;
const DEFAULT_GRID_RATE_PKR = 60;

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getUnitLabel = (flockId?: string, flockName?: string) => {
  if (flockName && flockName.trim()) {
    return flockName.trim() === 'Main Complex' ? 'All Units' : flockName;
  }
  if (String(flockId) === '0' || String(flockId) === 'common') return 'All Units';
  if (String(flockId) === '9') return 'Unit 2';
  if (String(flockId) === '10') return 'Unit 3';
  return 'Unit 1';
};

const getSolarRate = (rec: PowerConsumptionRecord) =>
  Number(rec.solarUnitRatePkr ?? rec.unitRatePkr ?? DEFAULT_SOLAR_RATE_PKR) || DEFAULT_SOLAR_RATE_PKR;

const getGridRate = (rec: PowerConsumptionRecord) =>
  Number(rec.gridUnitRatePkr ?? DEFAULT_GRID_RATE_PKR) || DEFAULT_GRID_RATE_PKR;

export const PowerConsumptionView: React.FC<PowerConsumptionViewProps> = ({
  powerLogs,
  flocks,
  onAddPowerLog,
  onEditPowerLog,
  onDeletePowerLog,
}) => {
  const initialUrlFilters = useMemo(() => getInitialUrlFilters(), []);
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUrlFilters.flockId || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(initialUrlFilters.from || '');
  const [toDate, setToDate] = useState<string>(initialUrlFilters.to || '');
  const [preset, setPreset] = useState<DatePreset>(initialUrlFilters.hasDateRange ? 'custom' : 'all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & action state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PowerConsumptionRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PowerConsumptionRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [formDate, setFormDate] = useState(getTodayDateStr());
  const [formFlockId, setFormFlockId] = useState('8');
  const [formReferenceNo, setFormReferenceNo] = useState('');
  const [formSolarRate, setFormSolarRate] = useState<string>(String(DEFAULT_SOLAR_RATE_PKR));
  const [formGridRate, setFormGridRate] = useState<string>(String(DEFAULT_GRID_RATE_PKR));
  const [formSolarProduced, setFormSolarProduced] = useState<string>('');
  const [formSolarConsumed, setFormSolarConsumed] = useState<string>('');
  const [formGridConsumed, setFormGridConsumed] = useState<string>('');
  const [formDieselPurchased, setFormDieselPurchased] = useState<string>('');
  const [formDieselRate, setFormDieselRate] = useState<string>('');
  const [formDieselCost, setFormDieselCost] = useState<string>('');
  const [formDieselConsumed, setFormDieselConsumed] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');

  const unitOptions = useMemo(() => {
    const base =
      flocks.length > 0
        ? flocks.map((f) => ({ id: String(f.id), name: f.name }))
        : [
            { id: '8', name: 'Unit 1' },
            { id: '9', name: 'Unit 2' },
            { id: '10', name: 'Unit 3' },
          ];
    return [...base, { id: '0', name: 'All Units' }];
  }, [flocks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 3500);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormError(null);
    setFormDate(getTodayDateStr());
    setFormFlockId(selectedUnit !== 'all' ? selectedUnit : '8');
    setFormReferenceNo('');
    setFormSolarRate(String(DEFAULT_SOLAR_RATE_PKR));
    setFormGridRate(String(DEFAULT_GRID_RATE_PKR));
    setFormSolarProduced('');
    setFormSolarConsumed('');
    setFormGridConsumed('');
    setFormDieselPurchased('');
    setFormDieselRate('');
    setFormDieselCost('');
    setFormDieselConsumed('');
    setFormNotes('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (rec: PowerConsumptionRecord) => {
    setEditingRecord(rec);
    setFormError(null);
    setFormDate(rec.date ? rec.date.split('T')[0] : getTodayDateStr());
    setFormFlockId(String(rec.flockId ?? '8'));
    setFormReferenceNo(rec.referenceNo || '');
    setFormSolarRate(String(getSolarRate(rec)));
    setFormGridRate(String(getGridRate(rec)));
    setFormSolarProduced(rec.solarProducedUnits ? String(rec.solarProducedUnits) : '');
    setFormSolarConsumed(rec.solarConsumedUnits ? String(rec.solarConsumedUnits) : '');
    setFormGridConsumed(rec.gridConsumedUnits ? String(rec.gridConsumedUnits) : '');
    setFormDieselPurchased(rec.dieselPurchasedLiters ? String(rec.dieselPurchasedLiters) : '');
    setFormDieselRate(rec.dieselRatePerLiter ? String(rec.dieselRatePerLiter) : '');
    setFormDieselCost(rec.dieselPurchaseCost ? String(rec.dieselPurchaseCost) : '');
    setFormDieselConsumed(rec.dieselConsumedLiters ? String(rec.dieselConsumedLiters) : '');
    setFormNotes(rec.notes || '');
    setIsFormModalOpen(true);
  };

  // Auto-sync Diesel Cost when Liters & Rate change
  const handleDieselLitersOrRateChange = (litersVal: string, rateVal: string) => {
    setFormDieselPurchased(litersVal);
    setFormDieselRate(rateVal);
    const l = Number(litersVal);
    const r = Number(rateVal);
    if (l > 0 && r > 0) {
      setFormDieselCost(String(Math.round(l * r)));
    } else if (!litersVal || Number(litersVal) <= 0) {
      setFormDieselCost('');
    }
  };

  const formPreview = useMemo(() => {
    const solarRate = Math.max(1, Number(formSolarRate) || DEFAULT_SOLAR_RATE_PKR);
    const gridRate = Math.max(1, Number(formGridRate) || DEFAULT_GRID_RATE_PKR);
    const solarProd = Math.max(0, Number(formSolarProduced) || 0);
    const solarCons = Math.max(0, Number(formSolarConsumed) || 0);
    const gridCons = Math.max(0, Number(formGridConsumed) || 0);
    const dieselPurch = Math.max(0, Number(formDieselPurchased) || 0);
    const dieselRate = Math.max(0, Number(formDieselRate) || 0);
    const dieselCost =
      Math.max(0, Number(formDieselCost) || 0) ||
      (dieselPurch > 0 && dieselRate > 0 ? dieselPurch * dieselRate : 0);
    const dieselCons = Math.max(0, Number(formDieselConsumed) || 0);

    const solarConsCost = solarCons * solarRate;
    const gridCost = gridCons * gridRate;

    return {
      solarRate,
      gridRate,
      solarProdValue: solarProd * solarRate,
      solarConsCost,
      gridCost,
      dieselCost,
      dieselNetLiters: dieselPurch - dieselCons,
      totalPowerCost: solarConsCost + gridCost + dieselCost,
    };
  }, [
    formSolarRate,
    formGridRate,
    formSolarProduced,
    formSolarConsumed,
    formGridConsumed,
    formDieselPurchased,
    formDieselRate,
    formDieselCost,
    formDieselConsumed,
  ]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDate) {
      setFormError('Please select a recording date.');
      return;
    }

    const solarProducedUnits = Math.max(0, Number(formSolarProduced) || 0);
    const solarConsumedUnits = Math.max(0, Number(formSolarConsumed) || 0);
    const gridConsumedUnits = Math.max(0, Number(formGridConsumed) || 0);
    const dieselPurchasedLiters = Math.max(0, Number(formDieselPurchased) || 0);
    const dieselConsumedLiters = Math.max(0, Number(formDieselConsumed) || 0);
    const solarUnitRatePkr =
      Number(formSolarRate) > 0 ? Number(formSolarRate) : DEFAULT_SOLAR_RATE_PKR;
    const gridUnitRatePkr =
      Number(formGridRate) > 0 ? Number(formGridRate) : DEFAULT_GRID_RATE_PKR;

    let dieselRatePerLiter = Math.max(0, Number(formDieselRate) || 0);
    let dieselPurchaseCost = Math.max(0, Number(formDieselCost) || 0);

    if (dieselPurchaseCost === 0 && dieselPurchasedLiters > 0 && dieselRatePerLiter > 0) {
      dieselPurchaseCost = Number((dieselPurchasedLiters * dieselRatePerLiter).toFixed(2));
    } else if (dieselRatePerLiter === 0 && dieselPurchasedLiters > 0 && dieselPurchaseCost > 0) {
      dieselRatePerLiter = Number((dieselPurchaseCost / dieselPurchasedLiters).toFixed(2));
    }

    if (
      solarProducedUnits === 0 &&
      solarConsumedUnits === 0 &&
      gridConsumedUnits === 0 &&
      dieselPurchasedLiters === 0 &&
      dieselConsumedLiters === 0 &&
      dieselPurchaseCost === 0
    ) {
      setFormError('Please enter at least one solar, main grid, or diesel meter reading.');
      return;
    }

    const matchedUnit = unitOptions.find((u) => String(u.id) === String(formFlockId));
    const flockName = matchedUnit?.name || getUnitLabel(formFlockId);

    setIsSaving(true);
    try {
      if (editingRecord) {
        const updated: PowerConsumptionRecord = {
          ...editingRecord,
          date: formDate,
          flockId: formFlockId,
          flockName,
          solarProducedUnits,
          solarConsumedUnits,
          gridConsumedUnits,
          unitRatePkr: solarUnitRatePkr,
          solarUnitRatePkr,
          gridUnitRatePkr,
          dieselPurchasedLiters,
          dieselConsumedLiters,
          dieselRatePerLiter,
          dieselPurchaseCost,
          referenceNo: formReferenceNo.trim() || undefined,
          notes: formNotes.trim() || undefined,
        };
        await onEditPowerLog(updated);
        showToast(`Power log (${formDate} • ${flockName}) updated.`);
      } else {
        await onAddPowerLog({
          date: formDate,
          flockId: formFlockId,
          flockName,
          solarProducedUnits,
          solarConsumedUnits,
          gridConsumedUnits,
          unitRatePkr: solarUnitRatePkr,
          solarUnitRatePkr,
          gridUnitRatePkr,
          dieselPurchasedLiters,
          dieselConsumedLiters,
          dieselRatePerLiter,
          dieselPurchaseCost,
          referenceNo: formReferenceNo.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
        showToast(`Power log saved for ${flockName} (${formDate}).`);
      }
      setIsFormModalOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save power consumption record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter records
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return powerLogs
      .filter((rec) => {
        if (selectedUnit !== 'all') {
          const recUnit = String(rec.flockId);
          if (selectedUnit === '0') {
            if (
              recUnit !== '0' &&
              !rec.flockName?.toLowerCase().includes('complex') &&
              rec.flockName?.toLowerCase() !== 'all units'
            ) {
              return false;
            }
          } else if (recUnit !== String(selectedUnit)) {
            return false;
          }
        }
        if (fromDate && rec.date < fromDate) return false;
        if (toDate && rec.date > toDate) return false;
        if (q) {
          const haystack = [
            rec.date,
            rec.flockName,
            rec.referenceNo,
            rec.notes,
            rec.trackingId ? `#${rec.trackingId}` : '',
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [powerLogs, selectedUnit, fromDate, toDate, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  // Aggregate KPI Totals
  const totals = useMemo(() => {
    let solarProduced = 0;
    let solarConsumed = 0;
    let solarProducedValue = 0;
    let solarConsumedCost = 0;
    let solarGridDiffSavings = 0;
    let gridConsumed = 0;
    let gridCost = 0;
    let dieselPurchased = 0;
    let dieselConsumed = 0;
    let dieselPurchaseCost = 0;

    for (const r of filtered) {
      const sRate = getSolarRate(r);
      const gRate = getGridRate(r);
      const sProd = Number(r.solarProducedUnits) || 0;
      const sCons = Number(r.solarConsumedUnits) || 0;
      const gCons = Number(r.gridConsumedUnits) || 0;
      const dPurch = Number(r.dieselPurchasedLiters) || 0;
      const dCons = Number(r.dieselConsumedLiters) || 0;
      const dCost = Number(r.dieselPurchaseCost) || 0;

      solarProduced += sProd;
      solarConsumed += sCons;
      solarProducedValue += sProd * sRate;
      solarConsumedCost += sCons * sRate;
      solarGridDiffSavings += sCons * Math.max(0, gRate - sRate);
      gridConsumed += gCons;
      gridCost += gCons * gRate;
      dieselPurchased += dPurch;
      dieselConsumed += dCons;
      dieselPurchaseCost += dCost;
    }

    const totalElectricityUnits = solarConsumed + gridConsumed;
    const solarSharePct =
      totalElectricityUnits > 0 ? (solarConsumed / totalElectricityUnits) * 100 : 0;
    const gridSharePct =
      totalElectricityUnits > 0 ? (gridConsumed / totalElectricityUnits) * 100 : 0;
    const solarSelfUsePct =
      solarProduced > 0 ? Math.min(100, (solarConsumed / solarProduced) * 100) : 0;
    const dieselBalanceLiters = dieselPurchased - dieselConsumed;
    const totalPowerCost = solarConsumedCost + gridCost + dieselPurchaseCost;

    return {
      solarProduced,
      solarConsumed,
      solarProducedValue,
      solarConsumedCost,
      solarGridDiffSavings,
      gridConsumed,
      gridCost,
      dieselPurchased,
      dieselConsumed,
      dieselPurchaseCost,
      dieselBalanceLiters,
      totalElectricityUnits,
      solarSharePct,
      gridSharePct,
      solarSelfUsePct,
      totalPowerCost,
    };
  }, [filtered]);

  // Unit-wise summary breakdown
  const unitSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        unitId: string;
        unitName: string;
        solarProduced: number;
        solarConsumed: number;
        solarCost: number;
        gridConsumed: number;
        gridCost: number;
        dieselPurchased: number;
        dieselConsumed: number;
        dieselCost: number;
        entries: number;
      }
    >();

    for (const r of filtered) {
      const uid = String(r.flockId || '8');
      const uName = getUnitLabel(uid, r.flockName);
      const sRate = getSolarRate(r);
      const gRate = getGridRate(r);
      const curr = map.get(uid) || {
        unitId: uid,
        unitName: uName,
        solarProduced: 0,
        solarConsumed: 0,
        solarCost: 0,
        gridConsumed: 0,
        gridCost: 0,
        dieselPurchased: 0,
        dieselConsumed: 0,
        dieselCost: 0,
        entries: 0,
      };
      curr.solarProduced += Number(r.solarProducedUnits) || 0;
      curr.solarConsumed += Number(r.solarConsumedUnits) || 0;
      curr.solarCost += (Number(r.solarConsumedUnits) || 0) * sRate;
      curr.gridConsumed += Number(r.gridConsumedUnits) || 0;
      curr.gridCost += (Number(r.gridConsumedUnits) || 0) * gRate;
      curr.dieselPurchased += Number(r.dieselPurchasedLiters) || 0;
      curr.dieselConsumed += Number(r.dieselConsumedLiters) || 0;
      curr.dieselCost += Number(r.dieselPurchaseCost) || 0;
      curr.entries += 1;
      map.set(uid, curr);
    }

    return Array.from(map.values()).sort((a, b) => a.unitName.localeCompare(b.unitName));
  }, [filtered]);

  // Export CSV / PDF payload
  const getExportPayload = () => {
    const columns = [
      { header: 'Date' },
      { header: 'Unit / Shed' },
      { header: 'Solar Prod (kWh)', align: 'right' as const },
      { header: 'Solar Used (kWh)', align: 'right' as const },
      { header: 'Solar Rate (PKR)', align: 'right' as const },
      { header: 'Solar Cost (PKR)', align: 'right' as const },
      { header: 'Grid Used (kWh)', align: 'right' as const },
      { header: 'Grid Rate (PKR)', align: 'right' as const },
      { header: 'Grid Cost (PKR)', align: 'right' as const },
      { header: 'Diesel Bought (L)', align: 'right' as const },
      { header: 'Diesel Used (L)', align: 'right' as const },
      { header: 'Diesel Cost (PKR)', align: 'right' as const },
      { header: 'Total Power Cost (PKR)', align: 'right' as const },
      { header: 'Notes' },
    ];

    const rows = filtered.map((r) => {
      const sRate = getSolarRate(r);
      const gRate = getGridRate(r);
      const solarCost = (Number(r.solarConsumedUnits) || 0) * sRate;
      const gridCost = (Number(r.gridConsumedUnits) || 0) * gRate;
      const dCost = Number(r.dieselPurchaseCost) || 0;
      return [
        r.date,
        getUnitLabel(r.flockId, r.flockName),
        Number(r.solarProducedUnits || 0).toLocaleString(),
        Number(r.solarConsumedUnits || 0).toLocaleString(),
        sRate,
        Math.round(solarCost).toLocaleString(),
        Number(r.gridConsumedUnits || 0).toLocaleString(),
        gRate,
        Math.round(gridCost).toLocaleString(),
        Number(r.dieselPurchasedLiters || 0).toLocaleString(),
        Number(r.dieselConsumedLiters || 0).toLocaleString(),
        Math.round(dCost).toLocaleString(),
        Math.round(solarCost + gridCost + dCost).toLocaleString(),
        r.notes || r.referenceNo || '—',
      ];
    });

    const csvRows = filtered.map((r) => {
      const sRate = getSolarRate(r);
      const gRate = getGridRate(r);
      const solarCost = (Number(r.solarConsumedUnits) || 0) * sRate;
      const gridCost = (Number(r.gridConsumedUnits) || 0) * gRate;
      const dCost = Number(r.dieselPurchaseCost) || 0;
      return [
        r.date,
        getUnitLabel(r.flockId, r.flockName),
        Number(r.solarProducedUnits || 0),
        Number(r.solarConsumedUnits || 0),
        sRate,
        Math.round(solarCost),
        Number(r.gridConsumedUnits || 0),
        gRate,
        Math.round(gridCost),
        Number(r.dieselPurchasedLiters || 0),
        Number(r.dieselConsumedLiters || 0),
        Math.round(dCost),
        Math.round(solarCost + gridCost + dCost),
        r.notes || r.referenceNo || '',
      ];
    });

    const totalsRow = [
      'TOTAL',
      `${filtered.length} logs`,
      totals.solarProduced.toLocaleString(),
      totals.solarConsumed.toLocaleString(),
      DEFAULT_SOLAR_RATE_PKR,
      Math.round(totals.solarConsumedCost).toLocaleString(),
      totals.gridConsumed.toLocaleString(),
      DEFAULT_GRID_RATE_PKR,
      Math.round(totals.gridCost).toLocaleString(),
      totals.dieselPurchased.toLocaleString(),
      totals.dieselConsumed.toLocaleString(),
      Math.round(totals.dieselPurchaseCost).toLocaleString(),
      Math.round(totals.totalPowerCost).toLocaleString(),
      '',
    ];

    return { columns, rows, csvRows, totalsRow };
  };

  const handleExportCSV = () => {
    const payload = getExportPayload();
    downloadRecordsCSV({
      filenameBase: `greenova_power_consumption_${getTodayDateStr()}`,
      columns: payload.columns,
      rows: payload.rows,
      csvRows: payload.csvRows,
    });
  };

  const handleExportPDF = () => {
    const payload = getExportPayload();
    const unitTitle =
      selectedUnit === 'all'
        ? 'All Units'
        : unitOptions.find((u) => String(u.id) === String(selectedUnit))?.name || 'Selected Unit';
    downloadRecordsPDF({
      title: 'Power & Energy Consumption Ledger',
      subtitle: `${unitTitle} • Solar: Rs. ${DEFAULT_SOLAR_RATE_PKR}/unit • Main Grid: Rs. ${DEFAULT_GRID_RATE_PKR}/unit`,
      filenameBase: `greenova_power_consumption_${getTodayDateStr()}`,
      columns: payload.columns,
      rows: payload.rows,
      totalsRow: payload.totalsRow,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Power & Energy Consumption"
        subtitle={`Record daily solar production & usage (Rs. ${DEFAULT_SOLAR_RATE_PKR}/unit), main grid electricity units (Rs. ${DEFAULT_GRID_RATE_PKR}/unit), and diesel purchases & generator fuel consumption.`}
        icon={Zap}
        iconColor="amber"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <UIButton
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
            >
              Export CSV
            </UIButton>
            <UIButton
              variant="secondary"
              size="sm"
              icon={FileText}
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
            >
              Export PDF
            </UIButton>
            <UIButton variant="primary" size="sm" icon={Plus} onClick={openAddModal}>
              Record Power Log
            </UIButton>
          </div>
        }
      />

      {/* Date Range & Unit Filters */}
      <DateRangePickerBar
        showFarmSelector={false}
        showFlockSelector={true}
        flocks={unitOptions}
        selectedFlock={selectedUnit}
        onSelectFlock={(val) => {
          setSelectedUnit(val);
          setCurrentPage(1);
        }}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={(f, t) => {
          setFromDate(f);
          setToDate(t);
          setCurrentPage(1);
        }}
        activePreset={preset}
        onPresetChange={setPreset}
        onReset={() => {
          setSelectedUnit('all');
          setSearchTerm('');
          setFromDate('');
          setToDate('');
          setPreset('all');
          setCurrentPage(1);
        }}
      />

      <UIFilterBar>
        <UISearchInput
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          onClear={() => {
            setSearchTerm('');
            setCurrentPage(1);
          }}
          placeholder="Search by unit, meter ref, date, or notes..."
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>
            Solar: <strong className="text-amber-700 font-mono tabular-nums">Rs. {DEFAULT_SOLAR_RATE_PKR} / unit</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Main Grid: <strong className="text-blue-700 font-mono tabular-nums">Rs. {DEFAULT_GRID_RATE_PKR} / unit</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Showing <strong className="text-slate-800 font-mono tabular-nums">{filtered.length}</strong> records
          </span>
        </div>
      </UIFilterBar>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Solar Produced & Used"
          value={totals.solarConsumed.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          unit="units used"
          icon={Sun}
          color="amber"
          valueColor="text-amber-700"
          subtext={
            <span className="font-mono tabular-nums">
              Prod: {totals.solarProduced.toLocaleString(undefined, { maximumFractionDigits: 1 })} u · Cost Rs.{' '}
              {Math.round(totals.solarConsumedCost).toLocaleString()} (@ Rs. {DEFAULT_SOLAR_RATE_PKR})
            </span>
          }
        />

        <StatCard
          title="Main Grid Electricity"
          value={totals.gridConsumed.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          unit="units"
          icon={PlugZap}
          color="blue"
          valueColor="text-blue-700"
          subtext={
            <span className="font-mono tabular-nums">
              Cost: Rs. {Math.round(totals.gridCost).toLocaleString()} (@ Rs. {DEFAULT_GRID_RATE_PKR}/u)
            </span>
          }
        />

        <StatCard
          title="Diesel Purchased & Used"
          value={totals.dieselConsumed.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          unit="L consumed"
          icon={Fuel}
          color="rose"
          valueColor="text-rose-700"
          subtext={
            <span className="font-mono tabular-nums">
              Bought: {totals.dieselPurchased.toLocaleString(undefined, { maximumFractionDigits: 1 })} L · Bal:{' '}
              {totals.dieselBalanceLiters >= 0 ? '+' : ''}
              {totals.dieselBalanceLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L
            </span>
          }
        />

        <StatCard
          title="Total Power Cost"
          value={`Rs. ${Math.round(totals.totalPowerCost).toLocaleString()}`}
          icon={Gauge}
          color="emerald"
          valueColor="text-slate-900"
          subtext={
            <span className="font-mono tabular-nums">
              Solar Rs. {Math.round(totals.solarConsumedCost).toLocaleString()} + Grid Rs.{' '}
              {Math.round(totals.gridCost).toLocaleString()} + Diesel Rs.{' '}
              {Math.round(totals.dieselPurchaseCost).toLocaleString()}
            </span>
          }
        />
      </div>

      {/* Energy Mix & Solar Efficiency Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Electricity Source Mix (Solar vs Main Grid)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Combined consumption of{' '}
                <span className="font-mono tabular-nums font-bold text-slate-800">
                  {totals.totalElectricityUnits.toLocaleString(undefined, { maximumFractionDigits: 1 })} units
                </span>{' '}
                · Solar saved{' '}
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  Rs. {Math.round(totals.solarGridDiffSavings).toLocaleString()}
                </span>{' '}
                vs Main Grid tariff
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
              <span>
                Solar: <strong className="text-amber-700">{totals.solarSharePct.toFixed(1)}%</strong>
              </span>
              <span>
                Grid: <strong className="text-blue-700">{totals.gridSharePct.toFixed(1)}%</strong>
              </span>
            </div>
          </div>

          <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/80">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${totals.solarSharePct}%` }}
              title={`Solar Consumed: ${totals.solarConsumed.toLocaleString()} units`}
            />
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${totals.gridSharePct}%` }}
              title={`Main Grid Consumed: ${totals.gridConsumed.toLocaleString()} units`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Solar Power Cost (Rs. {DEFAULT_SOLAR_RATE_PKR}/u)</div>
              <div className="text-base font-black text-amber-700 font-mono tabular-nums mt-0.5">
                Rs. {Math.round(totals.solarConsumedCost).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                {totals.solarProduced.toLocaleString(undefined, { maximumFractionDigits: 1 })} u prod ({totals.solarSelfUsePct.toFixed(0)}% used)
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-medium">Main Grid Cost (Rs. {DEFAULT_GRID_RATE_PKR}/u)</div>
              <div className="text-base font-black text-blue-700 font-mono tabular-nums mt-0.5">
                Rs. {Math.round(totals.gridCost).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                {totals.gridConsumed.toLocaleString(undefined, { maximumFractionDigits: 1 })} units @ Rs. {DEFAULT_GRID_RATE_PKR}/unit
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-medium">Diesel Fuel Balance</div>
              <div
                className={`text-base font-black font-mono tabular-nums mt-0.5 ${
                  totals.dieselBalanceLiters >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {totals.dieselBalanceLiters >= 0 ? '+' : ''}
                {totals.dieselBalanceLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                Spent Rs. {Math.round(totals.dieselPurchaseCost).toLocaleString()} on diesel
              </div>
            </div>
          </div>
        </div>

        {/* Unit-Wise Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900">Unit-Wise Power Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">
            Solar (Rs. {DEFAULT_SOLAR_RATE_PKR}/u), Grid (Rs. {DEFAULT_GRID_RATE_PKR}/u) &amp; Diesel cost
          </p>

          {unitSummary.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No power records logged yet. Click &ldquo;Record Power Log&rdquo; to add your first entry.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unitSummary.map((u) => (
                <div key={u.unitId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{u.unitName}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Solar {u.solarConsumed.toLocaleString()} u · Grid {u.gridConsumed.toLocaleString()} u · Diesel {u.dieselConsumed.toLocaleString()} L
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-bold text-slate-900">
                      Rs. {Math.round(u.solarCost + u.gridCost + u.dieselCost).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Grid Rs. {Math.round(u.gridCost).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginated Ledger Table */}
      <TableCard
        title={`Power Consumption Ledger (${filtered.length.toLocaleString()} records)`}
        subtitle={`Showing 10 records per page • Page ${safePage} of ${totalPages}`}
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Unit / Shed</th>
              <th className="py-3 px-3 text-right">Solar Prod (Units)</th>
              <th className="py-3 px-3 text-right">Solar Used (Units &amp; Cost)</th>
              <th className="py-3 px-3 text-right">Main Grid (Units &amp; Cost)</th>
              <th className="py-3 px-3 text-right">Diesel Bought / Used</th>
              <th className="py-3 px-3 text-right">Total Power Cost</th>
              <th className="py-3 px-3">Notes / Ref</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No power consumption logs match the selected filters. Click &ldquo;Record Power Log&rdquo; to record solar, grid, and diesel usage.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => {
                const sRate = getSolarRate(rec);
                const gRate = getGridRate(rec);
                const solarProd = Number(rec.solarProducedUnits) || 0;
                const solarCons = Number(rec.solarConsumedUnits) || 0;
                const solarCost = solarCons * sRate;
                const gridCons = Number(rec.gridConsumedUnits) || 0;
                const gridCost = gridCons * gRate;
                const dPurch = Number(rec.dieselPurchasedLiters) || 0;
                const dCons = Number(rec.dieselConsumedLiters) || 0;
                const dCost = Number(rec.dieselPurchaseCost) || 0;
                const totalPowerCost = solarCost + gridCost + dCost;
                const unitLabel = getUnitLabel(rec.flockId, rec.flockName);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 whitespace-nowrap tabular-nums">
                      {rec.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {unitLabel}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900">{solarProd.toLocaleString()} u</div>
                      <div className="text-[10px] text-amber-700">
                        Val: Rs. {Math.round(solarProd * sRate).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-amber-700">{solarCons.toLocaleString()} u</div>
                      <div className="text-[10px] text-slate-500">
                        Rs. {Math.round(solarCost).toLocaleString()} (@ Rs. {sRate})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-blue-700">{gridCons.toLocaleString()} u</div>
                      <div className="text-[10px] text-slate-500">
                        Rs. {Math.round(gridCost).toLocaleString()} (@ Rs. {gRate})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-semibold text-slate-900">
                        +{dPurch.toLocaleString()} L / -{dCons.toLocaleString()} L
                      </div>
                      <div className="text-[10px] text-rose-700">
                        Bought: Rs. {Math.round(dCost).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 tabular-nums">
                      Rs. {Math.round(totalPowerCost).toLocaleString()}
                    </td>
                    <td
                      className="py-3 px-3 text-slate-600 text-[11px] max-w-[180px] truncate"
                      title={rec.notes || rec.referenceNo || '—'}
                    >
                      {rec.notes || (rec.referenceNo ? `Ref #${rec.referenceNo}` : '—')}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(rec)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Edit Power Log"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {confirmDeleteId !== rec.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rec.id)}
                            className="inline-flex items-center p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Power Log"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {confirmDeleteId === rec.id && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px]">
                          <span className="font-bold text-rose-900">Delete?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await onDeletePowerLog(rec);
                                setConfirmDeleteId(null);
                                showToast(`Power log (${rec.date}) deleted.`);
                              } catch {
                                setConfirmDeleteId(null);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="text-slate-600 font-medium">
            Showing{' '}
            <span className="font-bold text-slate-900">
              {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900">
              {Math.min(safePage * pageSize, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-slate-900">{filtered.length.toLocaleString()}</span> records
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </TableCard>

      {/* Add / Edit Power Log Modal */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsFormModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingRecord ? 'Edit Power Consumption Record' : 'Record Power & Energy Log'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solar default Rs. {DEFAULT_SOLAR_RATE_PKR}/unit • Main Grid default Rs. {DEFAULT_GRID_RATE_PKR}/unit • Diesel fuel tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <UIInput
                  label="Date *"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
                <UISelect
                  label="Unit / Shed *"
                  value={formFlockId}
                  onChange={(e) => setFormFlockId(e.target.value)}
                >
                  {unitOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </UISelect>
                <UIInput
                  label="Solar Rate (Rs. / unit)"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formSolarRate}
                  onChange={(e) => setFormSolarRate(e.target.value)}
                  helperText={`Default Rs. ${DEFAULT_SOLAR_RATE_PKR}`}
                />
                <UIInput
                  label="Main Grid Rate (Rs. / unit)"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formGridRate}
                  onChange={(e) => setFormGridRate(e.target.value)}
                  helperText={`Default Rs. ${DEFAULT_GRID_RATE_PKR}`}
                />
              </div>

              {/* Solar & Main Grid */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800">Solar &amp; Main Grid Electricity (kWh / Units)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <UIInput
                    label="Solar Produced (Units)"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 420"
                    value={formSolarProduced}
                    onChange={(e) => setFormSolarProduced(e.target.value)}
                  />
                  <UIInput
                    label="Solar Consumed (Units)"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 380"
                    value={formSolarConsumed}
                    onChange={(e) => setFormSolarConsumed(e.target.value)}
                  />
                  <UIInput
                    label="Main Grid Consumed (Units)"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 150"
                    value={formGridConsumed}
                    onChange={(e) => setFormGridConsumed(e.target.value)}
                  />
                </div>
              </div>

              {/* Diesel Generator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800">Diesel Generator Fuel (Purchased &amp; Consumed)</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <UIInput
                    label="Diesel Purchased (L)"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 200"
                    value={formDieselPurchased}
                    onChange={(e) => handleDieselLitersOrRateChange(e.target.value, formDieselRate)}
                  />
                  <UIInput
                    label="Diesel Rate (Rs./L)"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 265"
                    value={formDieselRate}
                    onChange={(e) => handleDieselLitersOrRateChange(formDieselPurchased, e.target.value)}
                  />
                  <UIInput
                    label="Diesel Purchase Cost (Rs.)"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Auto or manual Rs."
                    value={formDieselCost}
                    onChange={(e) => setFormDieselCost(e.target.value)}
                  />
                  <UIInput
                    label="Diesel Consumed (L)"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 45"
                    value={formDieselConsumed}
                    onChange={(e) => setFormDieselConsumed(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Calculation Summary */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Solar Cost (@ Rs.{formPreview.solarRate})</div>
                  <div className="font-black text-amber-800 font-mono tabular-nums">
                    Rs. {Math.round(formPreview.solarConsCost).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Grid Cost (@ Rs.{formPreview.gridRate})</div>
                  <div className="font-black text-blue-800 font-mono tabular-nums">
                    Rs. {Math.round(formPreview.gridCost).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Diesel Net (Bought - Used)</div>
                  <div className="font-black text-slate-900 font-mono tabular-nums">
                    {formPreview.dieselNetLiters >= 0 ? '+' : ''}
                    {formPreview.dieselNetLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Total Power Cost</div>
                  <div className="font-black text-slate-900 font-mono tabular-nums">
                    Rs. {Math.round(formPreview.totalPowerCost).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <UIInput
                  label="Meter / Slip Ref #"
                  placeholder="Optional challan or meter ref"
                  value={formReferenceNo}
                  onChange={(e) => setFormReferenceNo(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <UITextarea
                    label="Notes / Remarks"
                    rows={2}
                    placeholder="Generator hours, shift timings, WAPDA outage duration, etc."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <UIButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    setEditingRecord(null);
                  }}
                >
                  Cancel
                </UIButton>
                <UIButton type="submit" variant="primary" disabled={isSaving}>
                  {isSaving
                    ? 'Saving...'
                    : editingRecord
                    ? 'Update Power Log'
                    : 'Save Power Log'}
                </UIButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewingRecord && (() => {
        const sRate = getSolarRate(viewingRecord);
        const gRate = getGridRate(viewingRecord);
        const solarProd = Number(viewingRecord.solarProducedUnits) || 0;
        const solarCons = Number(viewingRecord.solarConsumedUnits) || 0;
        const solarCost = solarCons * sRate;
        const gridCons = Number(viewingRecord.gridConsumedUnits) || 0;
        const gridCost = gridCons * gRate;
        const dPurch = Number(viewingRecord.dieselPurchasedLiters) || 0;
        const dCons = Number(viewingRecord.dieselConsumedLiters) || 0;
        const dCost = Number(viewingRecord.dieselPurchaseCost) || 0;
        const unitLabel = getUnitLabel(viewingRecord.flockId, viewingRecord.flockName);

        return (
          <RecordDetailModal
            isOpen={Boolean(viewingRecord)}
            onClose={() => setViewingRecord(null)}
            title={`Power Consumption • ${viewingRecord.date}`}
            subtitle={`${unitLabel}${viewingRecord.referenceNo ? ` • Ref #${viewingRecord.referenceNo}` : ''}`}
            badge={{ text: `Solar Rs. ${sRate}/u • Grid Rs. ${gRate}/u`, color: 'amber' }}
            fields={[
              { label: 'Date', value: viewingRecord.date, mono: true },
              { label: 'Unit / Shed', value: unitLabel },
              {
                label: 'Solar Produced',
                value: `${solarProd.toLocaleString()} units (Val: Rs. ${Math.round(solarProd * sRate).toLocaleString()})`,
                mono: true,
              },
              {
                label: 'Solar Consumed & Cost',
                value: `${solarCons.toLocaleString()} units • Rs. ${Math.round(solarCost).toLocaleString()} (@ Rs. ${sRate}/u)`,
                mono: true,
              },
              {
                label: 'Main Grid Consumed',
                value: `${gridCons.toLocaleString()} units`,
                mono: true,
              },
              {
                label: 'Main Grid Cost',
                value: `Rs. ${Math.round(gridCost).toLocaleString()} (@ Rs. ${gRate}/unit)`,
                mono: true,
              },
              {
                label: 'Diesel Purchased',
                value: `${dPurch.toLocaleString()} L (Rs. ${Math.round(dCost).toLocaleString()})`,
                mono: true,
              },
              {
                label: 'Diesel Consumed',
                value: `${dCons.toLocaleString()} L`,
                mono: true,
              },
              {
                label: 'Total Power Cost (Solar + Grid + Diesel)',
                value: `Rs. ${Math.round(solarCost + gridCost + dCost).toLocaleString()}`,
                mono: true,
                highlight: true,
                fullWidth: true,
              },
            ]}
            notes={viewingRecord.notes}
            onEdit={() => openEditModal(viewingRecord)}
            onDelete={async () => {
              await onDeletePowerLog(viewingRecord);
              showToast(`Power log (${viewingRecord.date}) deleted.`);
            }}
          />
        );
      })()}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
