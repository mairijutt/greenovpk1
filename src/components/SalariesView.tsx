import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  Wallet,
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Edit2,
  UserCheck,
  Timer,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import {
  Worker,
  SalaryDisbursal,
  AdvanceSalaryRecord,
  Flock,
  StaffAttendanceLog,
} from '../types/farm';
import {
  PageHeader,
  StatCard,
  UIButton,
  UISearchInput,
  UIFilterBar,
  TableCard,
  DatePreset,
} from './ui';

interface SalariesViewProps {
  workers: Worker[];
  disbursals: SalaryDisbursal[];
  advances: AdvanceSalaryRecord[];
  flocks: Flock[];
  onAddSalaryDisbursal: (salary: SalaryDisbursal) => void;
  onAddAdvanceRecord: (advance: AdvanceSalaryRecord) => void;
  onAddWorker?: (worker: Worker) => void;
  onUpdateWorker?: (worker: Worker) => void;
}

type TabType = 'overview' | 'attendance' | 'staff' | 'disbursals' | 'advances' | 'add-staff';

export const SalariesView: React.FC<SalariesViewProps> = ({
  workers,
  disbursals,
  advances,
  flocks,
  onAddSalaryDisbursal,
  onAddAdvanceRecord,
  onAddWorker,
  onUpdateWorker,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFlock, setSelectedFlock] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalaryDisbursal | null>(null);
  const [staffToast, setStaffToast] = useState<string | null>(null);

  // Dedicated Attendance Sheet Date, Shift, and Status filters
  const [attendanceSheetDate, setAttendanceSheetDate] = useState<string>('2026-11-03');
  const [attendanceShiftFilter, setAttendanceShiftFilter] = useState<string>('all');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('all');

  // Admin In/Out Time Tracking Modal State
  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);
  const [selectedWorkerForLog, setSelectedWorkerForLog] = useState<Worker | null>(null);
  const [logWorkerId, setLogWorkerId] = useState<string>(workers[0]?.id || 'w-1');
  const [logDate, setLogDate] = useState<string>('2026-11-03');
  const [logShift, setLogShift] = useState<string>('Morning Shift (07:00 - 17:00)');
  const [logCheckIn, setLogCheckIn] = useState<string>('07:00 AM');
  const [logCheckOut, setLogCheckOut] = useState<string>('05:00 PM');
  const [logStatus, setLogStatus] = useState<
    'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent'
  >('Present');
  const [logOvertime, setLogOvertime] = useState<number | string>(0);
  const [logNotes, setLogNotes] = useState<string>('Biometric punch verified by Admin');

  // Attendance Records Log List
  const [attendanceLogs, setAttendanceLogs] = useState<StaffAttendanceLog[]>(() => {
    try {
      const saved = localStorage.getItem('greenova_attendance_logs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return workers.map((w, idx) => {
      const isNight =
        (w.shift || '').includes('Night') ||
        w.role.toLowerCase().includes('night') ||
        w.role.toLowerCase().includes('security');
      const isLeave = w.status === 'On Leave' || w.attendanceStatus === 'On Leave';
      const isLate = w.attendanceStatus === 'Late' || idx === 3;

      const checkIn = isLeave
        ? '—'
        : w.checkInTime || (isNight ? '07:00 PM' : isLate ? '07:25 AM' : '06:50 AM');
      const checkOut = isLeave ? '—' : w.checkOutTime || (isNight ? '07:00 AM' : '05:00 PM');
      const shift =
        w.shift || (isNight ? 'Night Shift (19:00 - 07:00)' : 'Morning Shift (07:00 - 17:00)');
      const hoursWorked = isLeave ? 0 : isNight ? 12 : 10;

      return {
        id: `att-${w.id}-2026-11-03`,
        workerId: w.id,
        workerName: w.name,
        role: w.role,
        flockId: w.flockId || '9',
        flockName: w.flockName || 'Unit 2',
        date: '2026-11-03',
        shift,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        hoursWorked,
        overtimeHours: idx === 4 ? 0.3 : 0,
        status: isLeave
          ? ('On Leave' as const)
          : isLate
          ? ('Late' as const)
          : ('Present' as const),
        adminNotes: isLeave
          ? 'Approved medical leave'
          : isLate
          ? 'Late gate check-in logged'
          : 'Verified biometric punch',
        loggedBy: 'Admin (Operations)',
        updatedAt: '07:30 AM',
      };
    });
  });

  // Add Staff Form state
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Flock Supervisor');
  const [staffFlockId, setStaffFlockId] = useState('9');
  const [staffSalary, setStaffSalary] = useState<number | string>(35000);
  const [staffPhone, setStaffPhone] = useState('+92 300 ');
  const [staffJoiningDate, setStaffJoiningDate] = useState('2026-10-27');
  const [staffAdvanceBalance, setStaffAdvanceBalance] = useState<number | string>(0);
  const [staffStatus, setStaffStatus] = useState<'Active' | 'On Leave'>('Active');
  const [staffNotes, setStaffNotes] = useState('');
  const [staffShift, setStaffShift] = useState('Morning Shift (07:00 - 17:00)');
  const [staffCheckIn, setStaffCheckIn] = useState('07:00 AM');
  const [staffCheckOut, setStaffCheckOut] = useState('05:00 PM');
  const [staffAttendance, setStaffAttendance] = useState<'Present' | 'Late' | 'On Leave' | 'Absent'>('Present');

  const handleResetStaffForm = () => {
    setStaffName('');
    setStaffRole('Flock Supervisor');
    setStaffFlockId('9');
    setStaffSalary(35000);
    setStaffPhone('+92 300 ');
    setStaffJoiningDate('2026-10-27');
    setStaffAdvanceBalance(0);
    setStaffStatus('Active');
    setStaffNotes('');
    setStaffShift('Morning Shift (07:00 - 17:00)');
    setStaffCheckIn('07:00 AM');
    setStaffCheckOut('05:00 PM');
    setStaffAttendance('Present');
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      alert('Please enter employee name.');
      return;
    }

    const assignedFlock = flocks.find((f) => String(f.id) === staffFlockId);
    const flockName = assignedFlock
      ? assignedFlock.name
      : staffFlockId === '9'
      ? 'Unit 2'
      : staffFlockId === '10'
      ? 'Unit 3'
      : 'Unit 1';

    const newWorker: Worker = {
      id: `w-${Date.now()}`,
      name: staffName.trim(),
      role: staffRole.trim(),
      farmAssigned: `${flockName} (${
        staffFlockId === '9' ? 'Shed 2' : staffFlockId === '10' ? 'Shed 3' : 'Shed 1'
      })`,
      flockId: staffFlockId,
      flockName,
      monthlySalary: Number(staffSalary) || 30000,
      advanceBalance: Number(staffAdvanceBalance) || 0,
      phone: staffPhone.trim(),
      status: staffStatus,
      joinedDate: staffJoiningDate,
      notes: staffNotes.trim(),
      shift: staffShift,
      shiftHours: staffShift.includes('Night') ? 12 : staffShift.includes('General') ? 8 : 10,
      checkInTime: staffStatus === 'On Leave' ? '—' : staffCheckIn,
      checkOutTime: staffStatus === 'On Leave' ? '—' : staffCheckOut,
      attendanceStatus: staffStatus === 'On Leave' ? 'On Leave' : staffAttendance,
    };

    if (onAddWorker) {
      onAddWorker(newWorker);
    }

    // Save to localStorage as backup
    try {
      const stored = localStorage.getItem('greenova_staff_v2');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem(
        'greenova_staff_v2',
        JSON.stringify([newWorker, ...(Array.isArray(parsed) ? parsed : [])])
      );
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setStaffToast(`Staff member "${newWorker.name}" registered successfully!`);
    setTimeout(() => setStaffToast(null), 4000);
    handleResetStaffForm();
    setIsStaffModalOpen(false);
    if (activeTab === 'add-staff') {
      setActiveTab('staff');
    }
  };

  // Edit Staff Member State
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('Flock Supervisor');
  const [editStaffFlockId, setEditStaffFlockId] = useState('9');
  const [editStaffSalary, setEditStaffSalary] = useState<number | string>(35000);
  const [editStaffPhone, setEditStaffPhone] = useState('+92 300 ');
  const [editStaffJoiningDate, setEditStaffJoiningDate] = useState('2026-10-27');
  const [editStaffAdvanceBalance, setEditStaffAdvanceBalance] = useState<number | string>(0);
  const [editStaffStatus, setEditStaffStatus] = useState<'Active' | 'On Leave'>('Active');
  const [editStaffNotes, setEditStaffNotes] = useState('');
  const [editStaffShift, setEditStaffShift] = useState('Morning Shift (07:00 - 17:00)');
  const [editStaffCheckIn, setEditStaffCheckIn] = useState('07:00 AM');
  const [editStaffCheckOut, setEditStaffCheckOut] = useState('05:00 PM');
  const [editStaffAttendance, setEditStaffAttendance] = useState<'Present' | 'Late' | 'On Leave' | 'Absent'>('Present');

  // Attendance filter in Staff Tab
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'Present' | 'Late' | 'On Leave'>('all');

  const handleOpenEditStaff = (worker: Worker) => {
    setEditingWorker(worker);
    setEditStaffName(worker.name);
    setEditStaffRole(worker.role);
    setEditStaffFlockId(worker.flockId || '9');
    setEditStaffSalary(worker.monthlySalary);
    setEditStaffPhone(worker.phone || '+92 300 ');
    setEditStaffJoiningDate(worker.joinedDate || '2026-10-27');
    setEditStaffAdvanceBalance(worker.advanceBalance || 0);
    setEditStaffStatus(worker.status || 'Active');
    setEditStaffNotes(worker.notes || '');
    setEditStaffShift(worker.shift || 'Morning Shift (07:00 - 17:00)');
    setEditStaffCheckIn(worker.checkInTime || '07:00 AM');
    setEditStaffCheckOut(worker.checkOutTime || '05:00 PM');
    setEditStaffAttendance(worker.attendanceStatus || (worker.status === 'On Leave' ? 'On Leave' : 'Present'));
    setIsEditStaffModalOpen(true);
  };

  const handleToggleAttendance = (worker: Worker) => {
    const nextStatus: 'Present' | 'Late' | 'On Leave' =
      worker.attendanceStatus === 'Present'
        ? 'Late'
        : worker.attendanceStatus === 'Late'
        ? 'On Leave'
        : 'Present';

    const updatedWorker: Worker = {
      ...worker,
      attendanceStatus: nextStatus,
      status: nextStatus === 'On Leave' ? 'On Leave' : 'Active',
      checkInTime:
        nextStatus === 'On Leave'
          ? '—'
          : worker.checkInTime && worker.checkInTime !== '—'
          ? worker.checkInTime
          : '07:00 AM',
      checkOutTime:
        nextStatus === 'On Leave'
          ? '—'
          : worker.checkOutTime && worker.checkOutTime !== '—'
          ? worker.checkOutTime
          : '05:00 PM',
    };

    if (onUpdateWorker) {
      onUpdateWorker(updatedWorker);
    }

    try {
      const stored = localStorage.getItem('greenova_staff_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updatedList = parsed.map((w: Worker) =>
            w.id === updatedWorker.id ? updatedWorker : w
          );
          localStorage.setItem('greenova_staff_v2', JSON.stringify(updatedList));
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setStaffToast(`${worker.name} marked as "${nextStatus}"`);
    setTimeout(() => setStaffToast(null), 3500);
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !editStaffName.trim()) {
      alert('Please enter employee name.');
      return;
    }

    const assignedFlock = flocks.find((f) => String(f.id) === editStaffFlockId);
    const flockName = assignedFlock
      ? assignedFlock.name
      : editStaffFlockId === '9'
      ? 'Unit 2'
      : editStaffFlockId === '10'
      ? 'Unit 3'
      : 'Unit 1';

    const updatedWorker: Worker = {
      ...editingWorker,
      name: editStaffName.trim(),
      role: editStaffRole.trim(),
      farmAssigned: `${flockName} (${
        editStaffFlockId === '9' ? 'Shed 2' : editStaffFlockId === '10' ? 'Shed 3' : 'Shed 1'
      })`,
      flockId: editStaffFlockId,
      flockName,
      monthlySalary: Number(editStaffSalary) || 30000,
      advanceBalance: Number(editStaffAdvanceBalance) || 0,
      phone: editStaffPhone.trim(),
      status: editStaffStatus,
      joinedDate: editStaffJoiningDate,
      notes: editStaffNotes.trim(),
      shift: editStaffShift,
      shiftHours: editStaffShift.includes('Night') ? 12 : editStaffShift.includes('General') ? 8 : 10,
      checkInTime: editStaffStatus === 'On Leave' ? '—' : editStaffCheckIn,
      checkOutTime: editStaffStatus === 'On Leave' ? '—' : editStaffCheckOut,
      attendanceStatus: editStaffStatus === 'On Leave' ? 'On Leave' : editStaffAttendance,
    };

    if (onUpdateWorker) {
      onUpdateWorker(updatedWorker);
    }

    // Also update localStorage greenova_staff_v2
    try {
      const stored = localStorage.getItem('greenova_staff_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updatedList = parsed.map((w: Worker) =>
            w.id === updatedWorker.id ? updatedWorker : w
          );
          localStorage.setItem('greenova_staff_v2', JSON.stringify(updatedList));
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setStaffToast(`Staff member "${updatedWorker.name}" updated successfully!`);
    setTimeout(() => setStaffToast(null), 4000);
    setIsEditStaffModalOpen(false);
    setEditingWorker(null);
  };

  // Admin In/Out Time Handlers
  const handleOpenTimeLogModal = (worker?: Worker) => {
    const target = worker || (selectedFlock !== 'all' ? filteredWorkers[0] : workers[0]) || workers[0];
    if (!target) return;
    setSelectedWorkerForLog(target);
    setLogWorkerId(target.id);
    setLogDate(attendanceSheetDate || '2026-11-03');
    setLogShift(target.shift || 'Morning Shift (07:00 - 17:00)');
    setLogCheckIn(
      target.checkInTime && target.checkInTime !== '—' ? target.checkInTime : '07:00 AM'
    );
    setLogCheckOut(
      target.checkOutTime && target.checkOutTime !== '—' ? target.checkOutTime : '05:00 PM'
    );
    setLogStatus(
      (target.attendanceStatus as any) || (target.status === 'On Leave' ? 'On Leave' : 'Present')
    );
    setLogOvertime(0);
    setLogNotes(target.notes || 'In/out timing recorded by Admin');
    setIsTimeLogModalOpen(true);
  };

  const handleLogWorkerChange = (workerId: string) => {
    const w = workers.find((item) => item.id === workerId);
    if (!w) return;
    setSelectedWorkerForLog(w);
    setLogWorkerId(w.id);
    setLogShift(w.shift || 'Morning Shift (07:00 - 17:00)');
    setLogCheckIn(w.checkInTime && w.checkInTime !== '—' ? w.checkInTime : '07:00 AM');
    setLogCheckOut(w.checkOutTime && w.checkOutTime !== '—' ? w.checkOutTime : '05:00 PM');
    setLogStatus(
      (w.attendanceStatus as any) || (w.status === 'On Leave' ? 'On Leave' : 'Present')
    );
  };

  const handleSaveAttendanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerForLog) return;

    const w = selectedWorkerForLog;
    const isLeave = logStatus === 'On Leave';
    const isAbsent = logStatus === 'Absent';
    const finalIn = isLeave || isAbsent ? '—' : logCheckIn.trim();
    const finalOut = isLeave || isAbsent ? '—' : logCheckOut.trim();

    let hoursWorked = logShift.includes('Night') ? 12 : logShift.includes('General') ? 8 : 10;
    if (isLeave || isAbsent) hoursWorked = 0;
    else if (logStatus === 'Half Day') hoursWorked = hoursWorked / 2;

    const newLog: StaffAttendanceLog = {
      id: `att-${w.id}-${logDate}-${Date.now().toString().slice(-4)}`,
      workerId: w.id,
      workerName: w.name,
      role: w.role,
      flockId: w.flockId || '9',
      flockName: w.flockName || 'Unit 2',
      date: logDate,
      shift: logShift,
      checkInTime: finalIn,
      checkOutTime: finalOut,
      hoursWorked,
      overtimeHours: Number(logOvertime) || 0,
      status: logStatus,
      adminNotes: logNotes.trim() || 'Admin manual punch recorded',
      loggedBy: 'Admin (Operations)',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAttendanceLogs((prev) => {
      const filtered = prev.filter(
        (item) => !(item.workerId === w.id && item.date === logDate)
      );
      const nextLogs = [newLog, ...filtered];
      try {
        localStorage.setItem('greenova_attendance_logs_v1', JSON.stringify(nextLogs));
      } catch (err) {}
      return nextLogs;
    });

    const updatedWorker: Worker = {
      ...w,
      shift: logShift,
      checkInTime: finalIn,
      checkOutTime: finalOut,
      attendanceStatus: logStatus as any,
      status: isLeave ? 'On Leave' : 'Active',
    };

    if (onUpdateWorker) {
      onUpdateWorker(updatedWorker);
    }

    try {
      const stored = localStorage.getItem('greenova_staff_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updatedList = parsed.map((item: Worker) =>
            item.id === updatedWorker.id ? updatedWorker : item
          );
          localStorage.setItem('greenova_staff_v2', JSON.stringify(updatedList));
        }
      }
    } catch (err) {}

    setIsTimeLogModalOpen(false);
    setStaffToast(`Saved attendance for ${w.name}: IN ${finalIn} | OUT ${finalOut}`);
    setTimeout(() => setStaffToast(null), 3500);
  };

  const handleQuickClockStaff = (worker: Worker, action: 'in' | 'out') => {
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const finalIn =
      action === 'in'
        ? nowTime
        : worker.checkInTime && worker.checkInTime !== '—'
        ? worker.checkInTime
        : '07:00 AM';
    const finalOut = action === 'out' ? nowTime : worker.checkOutTime || 'On Duty';

    const updatedWorker: Worker = {
      ...worker,
      checkInTime: finalIn,
      checkOutTime: finalOut,
      attendanceStatus: 'Present',
      status: 'Active',
    };

    if (onUpdateWorker) {
      onUpdateWorker(updatedWorker);
    }

    setAttendanceLogs((prev) => {
      const updatedLog: StaffAttendanceLog = {
        id: `att-${worker.id}-${attendanceSheetDate}`,
        workerId: worker.id,
        workerName: worker.name,
        role: worker.role,
        flockId: worker.flockId || '9',
        flockName: worker.flockName || 'Unit 2',
        date: attendanceSheetDate,
        shift: worker.shift || 'Morning Shift (07:00 - 17:00)',
        checkInTime: finalIn,
        checkOutTime: finalOut,
        hoursWorked: 10,
        status: 'Present',
        adminNotes: `Quick Clock-${action.toUpperCase()} recorded by Admin at ${nowTime}`,
        loggedBy: 'Admin',
        updatedAt: nowTime,
      };
      const filtered = prev.filter(
        (l) => !(l.workerId === worker.id && l.date === attendanceSheetDate)
      );
      const next = [updatedLog, ...filtered];
      try {
        localStorage.setItem('greenova_attendance_logs_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setStaffToast(`${worker.name} successfully clocked ${action.toUpperCase()} at ${nowTime}`);
    setTimeout(() => setStaffToast(null), 3500);
  };

  const handleClockAllPresent = () => {
    const updated = workers.map((w) => {
      if (w.status === 'On Leave') return w;
      return {
        ...w,
        checkInTime: w.checkInTime && w.checkInTime !== '—' ? w.checkInTime : '07:00 AM',
        checkOutTime: w.checkOutTime && w.checkOutTime !== '—' ? w.checkOutTime : '05:00 PM',
        attendanceStatus: 'Present' as const,
        status: 'Active' as const,
      };
    });

    updated.forEach((w) => {
      if (onUpdateWorker) onUpdateWorker(w);
    });

    try {
      localStorage.setItem('greenova_staff_v2', JSON.stringify(updated));
    } catch (e) {}

    setStaffToast(
      `All active staff (${updated.filter((w) => w.status === 'Active').length} staff) marked Present on-time!`
    );
    setTimeout(() => setStaffToast(null), 3500);
  };

  // Salary Disbursal Form state
  const [salEmployeeId, setSalEmployeeId] = useState(workers[0]?.id || 'w-1');
  const [salMonth, setSalMonth] = useState('October 2026');
  const [salBasic, setSalBasic] = useState<number>(workers[0]?.monthlySalary || 35000);
  const [salAdvanceDeduct, setSalAdvanceDeduct] = useState<number>(0);
  const [salBonus, setSalBonus] = useState<number>(0);
  const [salPenalty, setSalPenalty] = useState<number>(0);
  const [salMethod, setSalMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [salDate, setSalDate] = useState('2026-10-27');
  const [salChallan, setSalChallan] = useState(`SAL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [salRemarks, setSalRemarks] = useState('Monthly wage disbursement after advance adjustment');

  // Advance Form state
  const [advEmployeeId, setAdvEmployeeId] = useState(workers[0]?.id || 'w-1');
  const [advAmount, setAdvAmount] = useState<number>(10000);
  const [advDate, setAdvDate] = useState('2026-10-27');
  const [advChallan, setAdvChallan] = useState(`Challan ${Math.floor(1290 + Math.random() * 50)}`);
  const [advFlockId, setAdvFlockId] = useState('9');
  const [advTerms, setAdvTerms] = useState('Deduct from upcoming payroll cycle');
  const [advRemarks, setAdvRemarks] = useState('Staff advance request approved by farm manager');

  // Get currently selected worker for salary modal
  const activeSalWorker = useMemo(() => {
    return workers.find((w) => w.id === salEmployeeId) || workers[0];
  }, [workers, salEmployeeId]);

  // When worker changes in salary modal, auto update basic and suggested advance
  const handleSalaryWorkerChange = (empId: string) => {
    setSalEmployeeId(empId);
    const worker = workers.find((w) => w.id === empId);
    if (worker) {
      setSalBasic(worker.monthlySalary);
      const outstandingAdv = worker.advanceBalance || 0;
      setSalAdvanceDeduct(Math.min(outstandingAdv, Math.floor(worker.monthlySalary * 0.5)));
    }
  };

  // Get currently selected worker for advance modal
  const activeAdvWorker = useMemo(() => {
    return workers.find((w) => w.id === advEmployeeId) || workers[0];
  }, [workers, advEmployeeId]);

  const handleAdvWorkerChange = (empId: string) => {
    setAdvEmployeeId(empId);
    const worker = workers.find((w) => w.id === empId);
    if (worker && worker.flockId) {
      setAdvFlockId(worker.flockId);
    }
  };

  // Net payable calculation
  const netPayable = Math.max(0, salBasic - salAdvanceDeduct + salBonus - salPenalty);

  // Submit Salary Disbursal
  const handleDisburseSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalWorker) return;

    const newSalary: SalaryDisbursal = {
      id: `sal-${Date.now()}`,
      employeeName: activeSalWorker.name,
      designation: activeSalWorker.role,
      flockId: activeSalWorker.flockId || '9',
      flockName: activeSalWorker.flockName || 'Unit 2',
      basicSalary: Number(salBasic) || 0,
      advanceDeducted: Number(salAdvanceDeduct) || 0,
      allowanceBonus: Number(salBonus) || 0,
      penaltyDeduction: Number(salPenalty) || 0,
      netSalaryPaid: netPayable,
      totalSalary: Number(salBasic) + Number(salBonus),
      paymentDate: salDate,
      paymentMethod: salMethod,
      status: 'Paid',
      challanNo: salChallan,
      month: salMonth,
      remarks: salRemarks,
    };

    onAddSalaryDisbursal(newSalary);
    setIsSalaryModalOpen(false);
  };

  // Submit Advance Salary
  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdvWorker) return;

    const targetFlock = flocks.find((f) => String(f.id) === advFlockId) || {
      id: advFlockId,
      name: advFlockId === '9' ? 'Unit 2' : advFlockId === '10' ? 'Unit 3' : 'Unit 1',
    };

    const newAdvance: AdvanceSalaryRecord = {
      id: `adv-${Date.now()}`,
      employeeName: activeAdvWorker.name,
      designation: activeAdvWorker.role,
      flockId: advFlockId,
      flockName: targetFlock.name,
      advanceAmount: Number(advAmount) || 0,
      date: advDate,
      challanNo: advChallan,
      repaymentStatus: 'Pending',
      deductedAmount: 0,
      remainingBalance: Number(advAmount) || 0,
      remarks: advRemarks,
    };

    onAddAdvanceRecord(newAdvance);
    setIsAdvanceModalOpen(false);
  };

  // Quick Action from staff row: Pay Salary or Give Advance
  const handleQuickPaySalary = (worker: Worker) => {
    handleSalaryWorkerChange(worker.id);
    setIsSalaryModalOpen(true);
  };

  const handleQuickGiveAdvance = (worker: Worker) => {
    handleAdvWorkerChange(worker.id);
    setIsAdvanceModalOpen(true);
  };

  // -------------------------------------------------------------
  // Dynamic Flock Aggregations matching screenshot sc1366_cfa37225.png
  // Baseline matching the old system:
  // Total Paid: Rs. 708,000.00
  // Total Advance: Rs. 157,430.00
  // Net Salary Paid: Rs. 30,000.00
  // Unit 2: Rs. 517,000.00 | Advance: Rs. 101,430.00
  // Unit 3: Rs. 191,000.00 | Advance: Rs. 56,000.00
  // -------------------------------------------------------------
  const summary = useMemo(() => {
    // Group advances by flock
    const advanceByFlock: Record<string, number> = {
      '8': 0, // Unit 1
      '9': 0, // Unit 2
      '10': 0, // Unit 3
    };
    advances.forEach((a) => {
      const fid = String(a.flockId);
      advanceByFlock[fid] = (advanceByFlock[fid] || 0) + (a.advanceAmount || 0);
    });

    // Group disbursals by flock
    const paidByFlock: Record<string, number> = {
      '8': 0,
      '9': 0,
      '10': 0,
    };
    const netPaidByFlock: Record<string, number> = {
      '8': 0,
      '9': 0,
      '10': 0,
    };
    disbursals.forEach((d) => {
      const fid = String(d.flockId);
      paidByFlock[fid] = (paidByFlock[fid] || 0) + (d.totalSalary || d.netSalaryPaid || 0);
      netPaidByFlock[fid] = (netPaidByFlock[fid] || 0) + (d.netSalaryPaid || 0);
    });

    // If "All Flocks"
    const totalPaidAll = Object.values(paidByFlock).reduce((a, b) => a + b, 0);
    const totalAdvanceAll = Object.values(advanceByFlock).reduce((a, b) => a + b, 0);
    // In screenshot, net salary paid was 30,000.00 (direct net wage disbursed without deductions)
    const netSalaryPaidAll = disbursals
      .filter((d) => d.advanceDeducted === 0 && d.netSalaryPaid > 0)
      .reduce((sum, d) => sum + d.netSalaryPaid, 0) || 30000;

    // Filtered by selected flock
    if (selectedFlock !== 'all') {
      const fid = selectedFlock;
      const flockPaid = paidByFlock[fid] || 0;
      const flockAdvance = advanceByFlock[fid] || 0;
      const flockNet = disbursals
        .filter((d) => String(d.flockId) === fid && d.advanceDeducted === 0)
        .reduce((sum, d) => sum + d.netSalaryPaid, 0);

      return {
        totalPaid: flockPaid,
        totalAdvance: flockAdvance,
        netSalaryPaid: flockNet,
        advanceByFlock,
        paidByFlock,
      };
    }

    return {
      totalPaid: totalPaidAll,
      totalAdvance: totalAdvanceAll,
      netSalaryPaid: netSalaryPaidAll,
      advanceByFlock,
      paidByFlock,
    };
  }, [advances, disbursals, selectedFlock]);

  // Filtered lists
  const filteredDisbursals = useMemo(() => {
    return disbursals.filter((d) => {
      const matchesFlock = selectedFlock === 'all' || String(d.flockId) === selectedFlock;
      const matchesSearch =
        d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.challanNo && d.challanNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.month && d.month.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFlock && matchesSearch;
    });
  }, [disbursals, selectedFlock, searchTerm]);

  const filteredAdvances = useMemo(() => {
    return advances.filter((a) => {
      const matchesFlock = selectedFlock === 'all' || String(a.flockId) === selectedFlock;
      const matchesSearch =
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.challanNo && a.challanNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.remarks && a.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFlock && matchesSearch;
    });
  }, [advances, selectedFlock, searchTerm]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesFlock =
        selectedFlock === 'all' || !w.flockId || String(w.flockId) === selectedFlock;
      const matchesSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.farmAssigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.phone.includes(searchTerm);
      return matchesFlock && matchesSearch;
    });
  }, [workers, selectedFlock, searchTerm]);

  // Attendance & Staff metrics for summary cards
  const staffAttendanceMetrics = useMemo(() => {
    const totalStaff = filteredWorkers.length;
    const activeStaff = filteredWorkers.filter((w) => w.status === 'Active').length;
    const leaveStaff = filteredWorkers.filter(
      (w) => w.status === 'On Leave' || w.attendanceStatus === 'On Leave'
    ).length;
    const presentStaff = filteredWorkers.filter(
      (w) => w.attendanceStatus === 'Present' || (!w.attendanceStatus && w.status === 'Active')
    ).length;
    const lateStaff = filteredWorkers.filter((w) => w.attendanceStatus === 'Late').length;
    const attendanceRate =
      totalStaff > 0 ? (((presentStaff + lateStaff) / totalStaff) * 100).toFixed(1) : '100.0';

    const unit1Staff = filteredWorkers.filter((w) => String(w.flockId) === '8').length;
    const unit2Staff = filteredWorkers.filter((w) => String(w.flockId) === '9').length;
    const unit3Staff = filteredWorkers.filter((w) => String(w.flockId) === '10').length;

    return {
      totalStaff,
      activeStaff,
      leaveStaff,
      presentStaff,
      lateStaff,
      attendanceRate,
      unit1Staff,
      unit2Staff,
      unit3Staff,
    };
  }, [filteredWorkers]);

  // Displayed workers in Staff tab considering attendance filter
  const displayedWorkers = useMemo(() => {
    if (attendanceFilter === 'all') return filteredWorkers;
    if (attendanceFilter === 'Present') {
      return filteredWorkers.filter(
        (w) => w.attendanceStatus === 'Present' || (!w.attendanceStatus && w.status === 'Active')
      );
    }
    if (attendanceFilter === 'Late') {
      return filteredWorkers.filter((w) => w.attendanceStatus === 'Late');
    }
    if (attendanceFilter === 'On Leave') {
      return filteredWorkers.filter(
        (w) => w.attendanceStatus === 'On Leave' || w.status === 'On Leave'
      );
    }
    return filteredWorkers;
  }, [filteredWorkers, attendanceFilter]);

  // Dedicated Attendance Sheet calculated records for selected date & filters
  const attendanceSheetRecords = useMemo(() => {
    return filteredWorkers
      .map((w, idx) => {
        const existingLog = attendanceLogs.find(
          (log) => log.workerId === w.id && log.date === attendanceSheetDate
        );

        const isNight =
          (w.shift || '').includes('Night') ||
          w.role.toLowerCase().includes('night') ||
          w.role.toLowerCase().includes('security');
        const isLeave = w.status === 'On Leave' || w.attendanceStatus === 'On Leave';
        const isLate = w.attendanceStatus === 'Late' || (!existingLog && idx === 3);

        const status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent' = existingLog
          ? (existingLog.status as any)
          : isLeave
          ? 'On Leave'
          : isLate
          ? 'Late'
          : 'Present';

        const checkInTime = existingLog
          ? existingLog.checkInTime
          : isLeave
          ? '—'
          : w.checkInTime || (isNight ? '07:00 PM' : isLate ? '07:25 AM' : '06:50 AM');

        const checkOutTime = existingLog
          ? existingLog.checkOutTime
          : isLeave
          ? '—'
          : w.checkOutTime || (isNight ? '07:00 AM' : '05:00 PM');

        const shift =
          existingLog?.shift ||
          w.shift ||
          (isNight ? 'Night Shift (19:00 - 07:00)' : 'Morning Shift (07:00 - 17:00)');

        const hoursWorked = existingLog
          ? existingLog.hoursWorked
          : isLeave
          ? 0
          : status === 'Half Day'
          ? 5
          : isNight
          ? 12
          : 10;

        const overtimeHours = (existingLog?.overtimeHours ?? (idx === 4 ? 0.5 : 0)) || 0;

        const adminNotes =
          existingLog?.adminNotes ||
          (isLeave
            ? 'Approved leave'
            : isLate
            ? 'Late check-in logged'
            : 'Biometric punch verified');

        const loggedBy = existingLog?.loggedBy || 'Admin (Operations)';

        return {
          worker: w,
          logId: existingLog?.id || `att-${w.id}-${attendanceSheetDate}`,
          status,
          shift,
          checkInTime,
          checkOutTime,
          hoursWorked,
          overtimeHours,
          adminNotes,
          loggedBy,
        };
      })
      .filter((rec) => {
        if (attendanceStatusFilter !== 'all' && rec.status !== attendanceStatusFilter) {
          return false;
        }
        if (attendanceShiftFilter !== 'all') {
          if (attendanceShiftFilter === 'Morning' && !rec.shift.toLowerCase().includes('morning'))
            return false;
          if (attendanceShiftFilter === 'Night' && !rec.shift.toLowerCase().includes('night'))
            return false;
          if (attendanceShiftFilter === 'General' && !rec.shift.toLowerCase().includes('general'))
            return false;
        }
        return true;
      });
  }, [
    filteredWorkers,
    attendanceLogs,
    attendanceSheetDate,
    attendanceStatusFilter,
    attendanceShiftFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {staffToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{staffToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Salary Summary</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time poultry farm payroll, advance adjustments, and flock-wise wage distribution.
          </p>
        </div>

        {/* Flock Selector Dropdown & Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500">Flock</span>
            <select
              value={selectedFlock}
              onChange={(e) => setSelectedFlock(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Flocks</option>
              <option value="8">Unit 1 (Shed 1)</option>
              <option value="9">Unit 2 (Shed 2)</option>
              <option value="10">Unit 3 (Shed 3)</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenTimeLogModal()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Admin: Log or adjust staff check-in and check-out timings"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>+ Log In/Out Time</span>
          </button>

          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Staff</span>
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>+ Add Advance Salary</span>
          </button>

          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Disburse Salary</span>
          </button>
        </div>
      </div>

      {/* 5 Top Summary Cards: Total Employees, Attendance Today, Total Paid, Total Advance, Net Salary Paid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Employees */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight">
              {staffAttendanceMetrics.totalStaff} <span className="text-base font-bold text-indigo-700">Staff</span>
            </div>
            <div className="text-[11px] font-medium text-indigo-700/80 mt-1">
              Unit 1: {staffAttendanceMetrics.unit1Staff} • U2: {staffAttendanceMetrics.unit2Staff} • U3: {staffAttendanceMetrics.unit3Staff}
            </div>
            <div className="mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[10px] font-semibold text-indigo-800">
              <span>{staffAttendanceMetrics.activeStaff} Active Duty</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                {staffAttendanceMetrics.leaveStaff} On Leave
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Staff Attendance Today */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/90 shadow-xs flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group"
          title="Click to view dedicated Daily Staff Attendance Register & Time Tracking Sheet"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 tracking-wide uppercase">
              Staff Attendance Today
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center text-teal-700 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black text-teal-950 tracking-tight">
                {staffAttendanceMetrics.presentStaff + staffAttendanceMetrics.lateStaff}{' '}
                <span className="text-base font-bold text-teal-700">/ {staffAttendanceMetrics.totalStaff}</span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 group-hover:underline flex items-center space-x-0.5">
                <span>View Sheet</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-[11px] font-medium text-teal-700/80 mt-1">
              {staffAttendanceMetrics.attendanceRate}% Attendance Rate Today
            </div>
            <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center justify-between text-[10px] font-semibold text-teal-800">
              <span className="text-emerald-700 font-bold">{staffAttendanceMetrics.presentStaff} On Time</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                {staffAttendanceMetrics.lateStaff} Late
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Paid */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">Total Paid</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
              Rs. {summary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-emerald-700/80 mt-1">Gross salary disbursed</div>
            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] font-semibold text-emerald-800">
              <span>Verified Payroll</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">Audited</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Advance */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 tracking-wide uppercase">Total Advance</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
              Rs. {summary.totalAdvance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-amber-700/80 mt-1">Advance payments</div>
            <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-semibold text-amber-800">
              <span>Active Advance Loans</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">Pending</span>
            </div>
          </div>
        </div>

        {/* Card 5: Net Salary Paid */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">Net Salary Paid</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
              Rs. {summary.netSalaryPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium text-blue-700/80 mt-1">After advance deduction</div>
            <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] font-semibold text-blue-800">
              <span>Direct Net Disbursal</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">Settled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary by Flock Section matching sc1366_cfa37225.png */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span>Salary by Flock</span>
          </div>
          {selectedFlock !== 'all' && (
            <button
              onClick={() => setSelectedFlock('all')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
            >
              Reset to All Flocks
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Unit 2 Row */}
          <div
            onClick={() => setSelectedFlock(selectedFlock === '9' ? 'all' : '9')}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              selectedFlock === '9'
                ? 'bg-purple-50/80 border-purple-200 ring-2 ring-purple-300'
                : 'bg-slate-50/70 hover:bg-purple-50/40 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900">Unit 2</span>
                <div className="text-xs font-semibold text-purple-700 mt-0.5">
                  Advance: Rs.{' '}
                  {(summary.advanceByFlock['9'] || 101430).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-purple-900">
                  Rs.{' '}
                  {(summary.paidByFlock['9'] || 517000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <div className="text-[11px] text-slate-400">Layer Shed 2</div>
              </div>
            </div>
          </div>

          {/* Unit 3 Row */}
          <div
            onClick={() => setSelectedFlock(selectedFlock === '10' ? 'all' : '10')}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              selectedFlock === '10'
                ? 'bg-purple-50/80 border-purple-200 ring-2 ring-purple-300'
                : 'bg-white hover:bg-purple-50/40 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900">Unit 3</span>
                <div className="text-xs font-semibold text-purple-700 mt-0.5">
                  Advance: Rs.{' '}
                  {(summary.advanceByFlock['10'] || 56000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-purple-900">
                  Rs.{' '}
                  {(summary.paidByFlock['10'] || 191000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <div className="text-[11px] text-slate-400">Layer Shed 3</div>
              </div>
            </div>
          </div>

          {/* Unit 1 Row */}
          <div
            onClick={() => setSelectedFlock(selectedFlock === '8' ? 'all' : '8')}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              selectedFlock === '8'
                ? 'bg-purple-50/80 border-purple-200 ring-2 ring-purple-300'
                : 'bg-white hover:bg-purple-50/40 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900">Unit 1</span>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  Advance: Rs.{' '}
                  {(summary.advanceByFlock['8'] || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-slate-900">
                  Rs.{' '}
                  {(summary.paidByFlock['8'] || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <div className="text-[11px] text-slate-400">Layer Shed 1</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>All Ledgers Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
              : 'text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance Sheet ({staffAttendanceMetrics.presentStaff + staffAttendanceMetrics.lateStaff}/{staffAttendanceMetrics.totalStaff})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'staff'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory ({filteredWorkers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disbursals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'disbursals'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary Disbursals ({filteredDisbursals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'advances'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Advance Register ({filteredAdvances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add-staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'add-staff'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-teal-700 bg-teal-50/70 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff Form</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <UIFilterBar>
        <UISearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by staff name, role, challan # or remarks..."
          containerClassName="w-full sm:w-80"
        />

        <div className="text-xs text-slate-500 font-medium flex items-center space-x-2">
          <span>Active Filter:</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">
            {selectedFlock === 'all'
              ? 'All Units'
              : selectedFlock === '9'
              ? 'Unit 2 (Shed 2)'
              : selectedFlock === '10'
              ? 'Unit 3 (Shed 3)'
              : 'Unit 1 (Shed 1)'}
          </span>
        </div>
      </UIFilterBar>

      {/* TAB 1: OVERVIEW - Recent Disbursals + Advances */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Salary Disbursals */}
          <TableCard
            title="Recent Salary Disbursals"
            subtitle="Verified net pay runs and direct wage disbursements"
            badge={
              <button
                onClick={() => setActiveTab('disbursals')}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {filteredDisbursals.slice(0, 5).map((sal) => (
                <div
                  key={sal.id}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{sal.employeeName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sal.designation}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {sal.flockName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{sal.paymentDate}</span>
                      <span>•</span>
                      <span>{sal.challanNo}</span>
                      <span>•</span>
                      <span>{sal.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-emerald-700 text-sm">
                      Rs. {sal.netSalaryPaid.toLocaleString()}
                    </div>
                    {sal.advanceDeducted > 0 && (
                      <div className="text-[10px] text-amber-700">
                        Adv Deduct: Rs. {sal.advanceDeducted.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TableCard>

          {/* Recent Advance Salary Records */}
          <TableCard
            title="Recent Advance Salary Withdrawals"
            subtitle="Advance challans and temporary loans disbursed"
            badge={
              <button
                onClick={() => setActiveTab('advances')}
                className="text-[11px] font-bold text-amber-700 hover:underline flex items-center"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {filteredAdvances.slice(0, 5).map((adv) => (
                <div
                  key={adv.id}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{adv.employeeName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {adv.designation}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {adv.flockName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{adv.date}</span>
                      <span>•</span>
                      <span>{adv.challanNo}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-amber-800 text-sm">
                      Rs. {adv.advanceAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Balance: Rs. {adv.remainingBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TableCard>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DEDICATED ATTENDANCE SHEET & ADMIN TIME TRACKING */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <TableCard
            title="Daily Staff Attendance Register & Time Tracking Sheet"
            subtitle="Official farm muster roll with shift punch-in/out timestamps, hours worked, overtime, and Admin time adjustments"
            badge={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTimeLogModal()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ Log In/Out Time (Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={handleClockAllPresent}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Mark all unclocked active workers as Present at 07:00 AM"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Clock-All Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer border border-slate-300"
                  title="Print daily attendance register"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            }
          >
            {/* Top Toolbar: Date Selector, Shift Filter, Status Filter */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Date Selection */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Muster Date:</span>
                  </div>
                  <input
                    type="date"
                    value={attendanceSheetDate}
                    onChange={(e) => setAttendanceSheetDate(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setAttendanceSheetDate('2026-11-03')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      attendanceSheetDate === '2026-11-03'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Today (Nov 03)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceSheetDate('2026-11-02')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      attendanceSheetDate === '2026-11-02'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    Yesterday (Nov 02)
                  </button>
                </div>

                {/* Shift Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-semibold mr-1">Shift:</span>
                  {[
                    { id: 'all', label: 'All Shifts' },
                    { id: 'Morning', label: 'Morning' },
                    { id: 'Night', label: 'Night' },
                    { id: 'General', label: 'General' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAttendanceShiftFilter(s.id)}
                      className={`px-2 py-0.8 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        attendanceShiftFilter === s.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter Chips & Shift Schedule Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 font-semibold mr-1">Status:</span>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('all')}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                      attendanceStatusFilter === 'all'
                        ? 'bg-indigo-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All ({filteredWorkers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('Present')}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                      attendanceStatusFilter === 'Present'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Present ({staffAttendanceMetrics.presentStaff})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('Late')}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                      attendanceStatusFilter === 'Late'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Late ({staffAttendanceMetrics.lateStaff})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('On Leave')}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                      attendanceStatusFilter === 'On Leave'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>On Leave ({staffAttendanceMetrics.leaveStaff})</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-emerald-800">Biometric Sync Active</span>
                  </span>
                  <span>•</span>
                  <span>Standard Shift: 10 hrs</span>
                </div>
              </div>
            </div>

            {/* Attendance Register Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Staff Member & ID</th>
                    <th className="py-3 px-4">Assigned Shed</th>
                    <th className="py-3 px-4">Shift Schedule</th>
                    <th className="py-3 px-4">In Time (Punch In)</th>
                    <th className="py-3 px-4">Out Time (Punch Out)</th>
                    <th className="py-3 px-4 text-center">Hours & OT</th>
                    <th className="py-3 px-4 text-center">Attendance Status</th>
                    <th className="py-3 px-4">Audit Note / Remark</th>
                    <th className="py-3 px-4 text-center">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceSheetRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No attendance records match the selected date and filters.
                      </td>
                    </tr>
                  ) : (
                    attendanceSheetRecords.map((rec) => {
                      const isPresent = rec.status === 'Present';
                      const isLate = rec.status === 'Late';
                      const isHalfDay = rec.status === 'Half Day';
                      const isLeave = rec.status === 'On Leave';
                      const isAbsent = rec.status === 'Absent';
                      const isOnDuty =
                        !isLeave &&
                        !isAbsent &&
                        (rec.checkOutTime === 'On Duty' ||
                          rec.checkOutTime === '—' ||
                          rec.checkOutTime === 'Active');

                      return (
                        <tr key={rec.worker.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Staff Member & ID */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{rec.worker.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 font-mono">
                              <span>{rec.worker.phone}</span>
                              <span>•</span>
                              <span className="text-slate-400 font-sans">{rec.worker.role}</span>
                            </div>
                          </td>

                          {/* Assigned Shed */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              {rec.worker.flockName || 'Unit 2'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {rec.worker.flockId === '8'
                                ? 'Shed 1'
                                : rec.worker.flockId === '10'
                                ? 'Shed 3'
                                : 'Shed 2'}
                            </div>
                          </td>

                          {/* Shift Schedule */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-[11px]">
                              {rec.shift.split('(')[0]?.trim()}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {rec.shift.includes('(') ? rec.shift.split('(')[1]?.replace(')', '') : '07:00 - 17:00'}
                            </div>
                          </td>

                          {/* Check-In Time */}
                          <td className="py-3 px-4">
                            {isLeave || isAbsent ? (
                              <span className="text-slate-400 font-mono italic">—</span>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {rec.checkInTime}
                                </span>
                                {isLate ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    Late
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    On Time
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Check-Out Time */}
                          <td className="py-3 px-4">
                            {isLeave || isAbsent ? (
                              <span className="text-slate-400 font-mono italic">—</span>
                            ) : isOnDuty ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>Active On Duty</span>
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {rec.checkOutTime}
                              </span>
                            )}
                          </td>

                          {/* Hours & Overtime */}
                          <td className="py-3 px-4 text-center">
                            <div className="font-bold text-slate-900 font-mono">
                              {rec.hoursWorked} hrs
                            </div>
                            {(rec.overtimeHours || 0) > 0 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                                +{rec.overtimeHours}h OT
                              </span>
                            )}
                          </td>

                          {/* Attendance Status (clickable toggle) */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(rec.worker)}
                              title="Click to quickly toggle: Present -> Late -> On Leave"
                              className="cursor-pointer transition-transform hover:scale-105"
                            >
                              {isPresent && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Present</span>
                                </span>
                              )}
                              {isLate && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Late</span>
                                </span>
                              )}
                              {isHalfDay && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                  <span>Half Day</span>
                                </span>
                              )}
                              {isLeave && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  <span>On Leave</span>
                                </span>
                              )}
                              {isAbsent && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Absent</span>
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Audit Remarks */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-[11px] text-slate-700 truncate font-medium">
                              {rec.adminNotes}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              By {rec.loggedBy}
                            </div>
                          </td>

                          {/* Admin Action */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenTimeLogModal(rec.worker)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                                title="Admin: Edit exact check-in / check-out times, shift, and overtime"
                              >
                                <Clock className="w-3 h-3 text-indigo-600" />
                                <span>Edit Timings</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickClockStaff(
                                    rec.worker,
                                    isOnDuty || rec.checkOutTime === '—' ? 'out' : 'in'
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Stamp current time"
                              >
                                {isOnDuty || rec.checkOutTime === '—' ? 'Clock Out' : 'Clock In'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Attendance Sheet Footer Summary Ribbon */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <div>
                  Total Staff on Register:{' '}
                  <strong className="text-slate-900 font-bold">{filteredWorkers.length}</strong>
                </div>
                <div>
                  Present:{' '}
                  <strong className="text-emerald-700 font-bold">{staffAttendanceMetrics.presentStaff}</strong>
                </div>
                <div>
                  Late:{' '}
                  <strong className="text-amber-700 font-bold">{staffAttendanceMetrics.lateStaff}</strong>
                </div>
                <div>
                  On Leave:{' '}
                  <strong className="text-purple-700 font-bold">{staffAttendanceMetrics.leaveStaff}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-500 font-medium text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className="text-indigo-600 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Go to Staff Directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </TableCard>
        </div>
      )}

      {/* TAB 2: SALARY DISBURSALS LEDGER */}
      {activeTab === 'disbursals' && (
        <TableCard
          title="Staff Salary Disbursals Ledger"
          subtitle="Detailed historical salary vouchers, basic wages, and advance deductions"
          badge={
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              Verified Disbursements
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Ref #</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Unit / Flock</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Basic Salary</th>
                  <th className="py-3 px-4 text-right">Advance Deducted</th>
                  <th className="py-3 px-4 text-right">Net Disbursed</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisbursals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No salary disbursals found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDisbursals.map((sal) => (
                    <tr key={sal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sal.paymentDate}</div>
                        <div className="font-mono text-[10px] text-slate-500">{sal.challanNo}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sal.employeeName}</div>
                        <div className="text-[10px] text-slate-500">{sal.designation}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          {sal.flockName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {sal.month || 'August 2026'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        Rs. {sal.basicSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">
                        {sal.advanceDeducted > 0
                          ? `Rs. ${sal.advanceDeducted.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">
                        Rs. {sal.netSalaryPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {sal.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSlip(sal)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* TAB 3: ADVANCE SALARY REGISTER */}
      {activeTab === 'advances' && (
        <TableCard
          title="Advance Salary Register"
          subtitle="All recorded advances with voucher/challan references and repayment tracking"
          badge={
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
              Rs. {summary.totalAdvance.toLocaleString()} Total Advances
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Challan / Voucher</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Unit</th>
                  <th className="py-3 px-4 text-right">Advance Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks / Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No advance salary records match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">{adv.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {adv.challanNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{adv.employeeName}</td>
                      <td className="py-3 px-4 text-slate-600">{adv.designation}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          {adv.flockName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-900 text-sm">
                        Rs. {adv.advanceAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">
                        Rs. {adv.remainingBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            adv.repaymentStatus === 'Deducted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {adv.repaymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{adv.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* TAB 4: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <TableCard
          title="Staff Directory & Payroll Profiles"
          subtitle="Employee records, unit allocations, monthly compensation, advance balances, and muster roll assignments"
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer border border-indigo-200"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Attendance Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Staff Member</span>
              </button>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                {displayedWorkers.length} Personnel
              </span>
            </div>
          }
        >
          {/* Quick Attendance Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 px-4 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-semibold mr-1">Filter Attendance:</span>
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  attendanceFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({filteredWorkers.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('Present')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                  attendanceFilter === 'Present'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Present ({staffAttendanceMetrics.presentStaff})</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('Late')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                  attendanceFilter === 'Late'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Late ({staffAttendanceMetrics.lateStaff})</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('On Leave')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 ${
                  attendanceFilter === 'On Leave'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>On Leave ({staffAttendanceMetrics.leaveStaff})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard Shift: 07:00 AM – 05:00 PM (10 hrs)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Designation &amp; Shift</th>
                  <th className="py-3 px-4">Assigned Unit</th>
                  <th className="py-3 px-4">In / Out Timings</th>
                  <th className="py-3 px-4 text-center">Today's Attendance</th>
                  <th className="py-3 px-4 text-right">Monthly Basic Salary</th>
                  <th className="py-3 px-4 text-right">Advance Bal.</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  displayedWorkers.map((w) => {
                    const isPresent =
                      w.attendanceStatus === 'Present' || (!w.attendanceStatus && w.status === 'Active');
                    const isLate = w.attendanceStatus === 'Late';
                    const isLeave = w.attendanceStatus === 'On Leave' || w.status === 'On Leave';

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{w.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">{w.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{w.role}</div>
                          <div className="text-[10px] text-slate-500">
                            {w.shift || 'Morning Shift (07:00 - 17:00)'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                            {w.flockName || w.farmAssigned?.split('(')[0]?.trim() || 'Unit 2'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {isLeave ? (
                            <span className="text-slate-400 italic">Off Shift / On Leave</span>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                                <span className="text-[10px] text-slate-400">IN:</span>
                                <span className="bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {w.checkInTime || '07:00 AM'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-slate-600 text-[11px]">
                                <span className="text-[10px] text-slate-400">OUT:</span>
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {w.checkOutTime || '05:00 PM'}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(w)}
                            title="Click to toggle status: Present -> Late -> On Leave"
                            className="cursor-pointer transition-transform hover:scale-105"
                          >
                            {isPresent && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Present</span>
                              </span>
                            )}
                            {isLate && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Late Check-in</span>
                              </span>
                            )}
                            {isLeave && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                <span>On Leave</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          Rs. {w.monthlySalary.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-700">
                          {w.advanceBalance && w.advanceBalance > 0
                            ? `Rs. ${w.advanceBalance.toLocaleString()}`
                            : 'Rs. 0'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenTimeLogModal(w)}
                              title="Admin: Log / Edit Staff In-Out Timings"
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>Time</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditStaff(w)}
                              title="Edit Staff Member"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleQuickGiveAdvance(w)}
                              title="Give Advance"
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              + Adv
                            </button>
                            <button
                              onClick={() => handleQuickPaySalary(w)}
                              title="Disburse Salary"
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Pay
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ADD STAFF MEMBER FORM (OLD SYSTEM SCREENSHOT STYLE) */}
      {/* ========================================================= */}
      {activeTab === 'add-staff' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-teal-700 mb-1">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Staff Details</h3>
              </div>
              <p className="text-xs text-slate-500">
                Enter the farm employee registration and payroll profile details below
              </p>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-5 text-xs">
              {/* Row 1: Date & Employee Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    value={staffJoiningDate}
                    onChange={(e) => setStaffJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Full Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Designation / Role & Flock Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Role *
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="Flock Supervisor">Flock Supervisor</option>
                    <option value="Shed Worker">Shed Worker</option>
                    <option value="Feeder & Sanitation Worker">Feeder & Sanitation Worker</option>
                    <option value="Perimeter Security Guard">Perimeter Security Guard</option>
                    <option value="Cage & Climate Technician">Cage & Climate Technician</option>
                    <option value="Egg Collection Specialist">Egg Collection Specialist</option>
                    <option value="Poultry Veterinarian">Poultry Veterinarian</option>
                    <option value="General Farm Labour">General Farm Labour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Flock / Unit *
                  </label>
                  <select
                    value={staffFlockId}
                    onChange={(e) => setStaffFlockId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="9">Unit 2 (Shed 2)</option>
                    <option value="10">Unit 3 (Shed 3)</option>
                    <option value="8">Unit 1 (Shed 1)</option>
                    <option value="all">Main Complex / All Sheds</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Monthly Basic Salary & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Basic Salary (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Initial Advance Balance & Employment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Advance Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={staffAdvanceBalance}
                    onChange={(e) => setStaffAdvanceBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-amber-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employment Status *
                  </label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as 'Active' | 'On Leave')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Shift & Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Shift *
                  </label>
                  <select
                    value={staffShift}
                    onChange={(e) => setStaffShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Morning Shift (07:00 - 17:00)">Morning Shift (07:00 - 17:00)</option>
                    <option value="Night Shift (19:00 - 07:00)">Night Shift (19:00 - 07:00)</option>
                    <option value="General Shift (08:30 - 16:30)">General Shift (08:30 - 16:30)</option>
                    <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Check-in Timing
                  </label>
                  <input
                    type="text"
                    value={staffCheckIn}
                    onChange={(e) => setStaffCheckIn(e.target.value)}
                    placeholder="e.g. 07:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Check-out Timing
                  </label>
                  <input
                    type="text"
                    value={staffCheckOut}
                    onChange={(e) => setStaffCheckOut(e.target.value)}
                    placeholder="e.g. 05:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 6: Today's Attendance Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Today's Attendance Status
                </label>
                <select
                  value={staffAttendance}
                  onChange={(e) => setStaffAttendance(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Present">Present (On Time)</option>
                  <option value="Late">Late Check-in</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {/* Row 5: Quarters / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accommodation / Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="On-site staff quarters, room 3 or special notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons matching st1_d471a4d4.png */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={handleResetStaffForm}
                  className="px-5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Staff Member
                </button>
              </div>

              {/* View All Staff Records button matching old system green footer button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className="w-full py-3 rounded-xl bg-[#3b8754] hover:bg-[#327347] text-white text-xs font-black tracking-wide transition-colors cursor-pointer shadow-sm text-center flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View Staff Member list</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD ADVANCE SALARY FORM                          */}
      {/* ========================================================= */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Wallet className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Record Advance Salary</h3>
                  <p className="text-xs text-amber-100">
                    Issue farm staff advance payment with challan reference
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordAdvance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Employee *</label>
                <select
                  value={advEmployeeId}
                  onChange={(e) => handleAdvWorkerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.role} ({w.farmAssigned})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Flock / Unit *</label>
                  <select
                    value={advFlockId}
                    onChange={(e) => setAdvFlockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="9">Unit 2 (Shed 2)</option>
                    <option value="10">Unit 3 (Shed 3)</option>
                    <option value="8">Unit 1 (Shed 1)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-black text-amber-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date Issued *</label>
                  <input
                    type="date"
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Challan / Voucher # *</label>
                  <input
                    type="text"
                    value={advChallan}
                    onChange={(e) => setAdvChallan(e.target.value)}
                    placeholder="e.g. Challan 1309"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Repayment Schedule</label>
                <select
                  value={advTerms}
                  onChange={(e) => setAdvTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="Deduct from upcoming payroll cycle">
                    Full deduction in upcoming payroll
                  </option>
                  <option value="Deduct in 2 installments">Split into 2 equal installments</option>
                  <option value="Deduct in 3 installments">Split into 3 monthly deductions</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose / Reason *</label>
                <textarea
                  value={advRemarks}
                  onChange={(e) => setAdvRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="Reason for advance..."
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Advance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DISBURSE SALARY FORM (with Advance Adjustment)   */}
      {/* ========================================================= */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <DollarSign className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Salary Disbursal Form</h3>
                  <p className="text-xs text-emerald-100">
                    Disburse monthly wages with automatic advance deduction
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDisburseSalary} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Employee *</label>
                  <select
                    value={salEmployeeId}
                    onChange={(e) => handleSalaryWorkerChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pay Period / Month *</label>
                  <select
                    value={salMonth}
                    onChange={(e) => setSalMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="October 2026">October 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="August 2026">August 2026</option>
                  </select>
                </div>
              </div>

              {/* Outstanding Advance Notice */}
              {activeSalWorker && (activeSalWorker.advanceBalance || 0) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>{activeSalWorker.name}</strong> has{' '}
                      <strong>Rs. {(activeSalWorker.advanceBalance || 0).toLocaleString()}</strong>{' '}
                      outstanding advance balance.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSalAdvanceDeduct(Math.min(activeSalWorker.advanceBalance || 0, salBasic))
                    }
                    className="text-[11px] font-bold text-amber-800 underline hover:text-amber-900"
                  >
                    Deduct Max
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Salary (Rs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={salBasic}
                    onChange={(e) => setSalBasic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Advance Deducted (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activeSalWorker?.advanceBalance || 100000}
                    step="500"
                    value={salAdvanceDeduct}
                    onChange={(e) => setSalAdvanceDeduct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-amber-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus / Allowance</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={salBonus}
                    onChange={(e) => setSalBonus(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penalty / Fines</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={salPenalty}
                    onChange={(e) => setSalPenalty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={salMethod}
                    onChange={(e) =>
                      setSalMethod(e.target.value as 'Cash' | 'Bank Transfer' | 'Cheque')
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                  >
                    <option value="Cash">Cash In Hand</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold">Net Disbursed Amount</span>
                  <div className="text-[11px] text-slate-500">
                    Basic (Rs. {salBasic.toLocaleString()}) - Advance (Rs.{' '}
                    {salAdvanceDeduct.toLocaleString()}) + Bonus (Rs. {salBonus.toLocaleString()})
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-800">
                  Rs. {netPayable.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursement Date *</label>
                  <input
                    type="date"
                    value={salDate}
                    onChange={(e) => setSalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher / Slip Ref *</label>
                  <input
                    type="text"
                    value={salChallan}
                    onChange={(e) => setSalChallan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={salRemarks}
                  onChange={(e) => setSalRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Disburse & Generate Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW / PRINT SALARY SLIP                         */}
      {/* ========================================================= */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  GreenOva Poultry Farm
                </h4>
                <div className="text-[11px] text-slate-500">Employee Salary Slip</div>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900">{selectedSlip.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="font-semibold text-slate-700">{selectedSlip.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farm Flock:</span>
                <span className="font-semibold text-purple-700">{selectedSlip.flockName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pay Period:</span>
                <span className="font-semibold text-slate-800">{selectedSlip.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disbursed On:</span>
                <span className="font-semibold text-slate-800">{selectedSlip.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Voucher #:</span>
                <span className="font-mono text-slate-800">{selectedSlip.challanNo}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-y border-slate-100 py-3">
              <div className="flex justify-between text-slate-600">
                <span>Basic Salary:</span>
                <span>Rs. {selectedSlip.basicSalary.toLocaleString()}</span>
              </div>
              {selectedSlip.advanceDeducted > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Advance Deducted:</span>
                  <span>- Rs. {selectedSlip.advanceDeducted.toLocaleString()}</span>
                </div>
              )}
              {(selectedSlip.allowanceBonus || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Allowance / Bonus:</span>
                  <span>+ Rs. {(selectedSlip.allowanceBonus || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Net Disbursed:</span>
                <span className="text-emerald-700">
                  Rs. {selectedSlip.netSalaryPaid.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Payment mode: {selectedSlip.paymentMethod}. Received with thanks.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD FARM STAFF MEMBER FORM                       */}
      {/* ========================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Add Farm Staff Member</h3>
                  <p className="text-xs text-teal-100">
                    Register poultry staff, shed assignment &amp; basic salary
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Full Name *</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  >
                    <option value="Flock Supervisor">Flock Supervisor</option>
                    <option value="Shed Worker">Shed Worker</option>
                    <option value="Feeder & Sanitation Worker">Feeder &amp; Sanitation Worker</option>
                    <option value="Perimeter Security Guard">Perimeter Security Guard</option>
                    <option value="Cage & Climate Technician">Cage &amp; Climate Technician</option>
                    <option value="Egg Collection Specialist">Egg Collection Specialist</option>
                    <option value="Poultry Veterinarian">Poultry Veterinarian</option>
                    <option value="General Farm Labour">General Farm Labour</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Flock / Unit *</label>
                  <select
                    value={staffFlockId}
                    onChange={(e) => setStaffFlockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="9">Unit 2 (Shed 2)</option>
                    <option value="10">Unit 3 (Shed 3)</option>
                    <option value="8">Unit 1 (Shed 1)</option>
                    <option value="all">Main Complex / All Sheds</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Basic Salary (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-black text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={staffJoiningDate}
                    onChange={(e) => setStaffJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initial Advance Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={staffAdvanceBalance}
                    onChange={(e) => setStaffAdvanceBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-amber-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as 'Active' | 'On Leave')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={staffShift}
                    onChange={(e) => setStaffShift(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="Morning Shift (07:00 - 17:00)">Morning (07:00 - 17:00)</option>
                    <option value="Night Shift (19:00 - 07:00)">Night (19:00 - 07:00)</option>
                    <option value="General Shift (08:30 - 16:30)">General (08:30 - 16:30)</option>
                    <option value="Evening Shift (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={staffCheckIn}
                    onChange={(e) => setStaffCheckIn(e.target.value)}
                    placeholder="07:00 AM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={staffCheckOut}
                    onChange={(e) => setStaffCheckOut(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Today's Attendance Status</label>
                <select
                  value={staffAttendance}
                  onChange={(e) => setStaffAttendance(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="Present">Present (On Time)</option>
                  <option value="Late">Late Check-in</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes / Quarters Address (optional)
                </label>
                <input
                  type="text"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="e.g. On-site staff accommodation quarters, room 3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: EDIT FARM STAFF MEMBER FORM                      */}
      {/* ========================================================= */}
      {isEditStaffModalOpen && editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Edit Staff Member</h3>
                  <p className="text-xs text-slate-300">
                    Update profile, designation, assigned shed &amp; salary
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStaffModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditStaff} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Full Name *</label>
                  <input
                    type="text"
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Role *</label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="Flock Supervisor">Flock Supervisor</option>
                    <option value="Shed Worker">Shed Worker</option>
                    <option value="Feeder & Sanitation Worker">Feeder &amp; Sanitation Worker</option>
                    <option value="Perimeter Security Guard">Perimeter Security Guard</option>
                    <option value="Cage & Climate Technician">Cage &amp; Climate Technician</option>
                    <option value="Egg Collection Specialist">Egg Collection Specialist</option>
                    <option value="Poultry Veterinarian">Poultry Veterinarian</option>
                    <option value="General Farm Labour">General Farm Labour</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Flock / Unit *</label>
                  <select
                    value={editStaffFlockId}
                    onChange={(e) => setEditStaffFlockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="9">Unit 2 (Shed 2)</option>
                    <option value="10">Unit 3 (Shed 3)</option>
                    <option value="8">Unit 1 (Shed 1)</option>
                    <option value="all">Main Complex / All Sheds</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Basic Salary (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={editStaffSalary}
                    onChange={(e) => setEditStaffSalary(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={editStaffJoiningDate}
                    onChange={(e) => setEditStaffJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Outstanding Advance Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={editStaffAdvanceBalance}
                    onChange={(e) => setEditStaffAdvanceBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-amber-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={editStaffStatus}
                    onChange={(e) => setEditStaffStatus(e.target.value as 'Active' | 'On Leave')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={editStaffShift}
                    onChange={(e) => setEditStaffShift(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Morning Shift (07:00 - 17:00)">Morning (07:00 - 17:00)</option>
                    <option value="Night Shift (19:00 - 07:00)">Night (19:00 - 07:00)</option>
                    <option value="General Shift (08:30 - 16:30)">General (08:30 - 16:30)</option>
                    <option value="Evening Shift (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={editStaffCheckIn}
                    onChange={(e) => setEditStaffCheckIn(e.target.value)}
                    placeholder="07:00 AM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={editStaffCheckOut}
                    onChange={(e) => setEditStaffCheckOut(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Today's Attendance Status</label>
                <select
                  value={editStaffAttendance}
                  onChange={(e) => setEditStaffAttendance(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Present">Present (On Time)</option>
                  <option value="Late">Late Check-in</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes / Quarters Address (optional)
                </label>
                <input
                  type="text"
                  value={editStaffNotes}
                  onChange={(e) => setEditStaffNotes(e.target.value)}
                  placeholder="e.g. On-site staff accommodation quarters, room 3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Staff Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN IN/OUT TIME TRACKING & OVERRIDE MODAL */}
      {/* ========================================================= */}
      {isTimeLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5 text-indigo-700">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Admin Staff In / Out Time Logger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record or adjust official muster roll check-in and check-out timestamps
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimeLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceLog} className="space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  value={logWorkerId}
                  onChange={(e) => handleLogWorkerChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  required
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.role} ({w.flockName || 'Unit 2'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Date & Quick Date Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Attendance Date *</label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setLogDate('2026-11-03')}
                      className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] cursor-pointer"
                    >
                      Today (Nov 03)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogDate('2026-11-02')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Shift Schedule */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Schedule</label>
                <select
                  value={logShift}
                  onChange={(e) => setLogShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Morning Shift (07:00 - 17:00)">Morning Shift (07:00 AM – 05:00 PM • 10 hrs)</option>
                  <option value="Night Shift (19:00 - 07:00)">Night Shift (07:00 PM – 07:00 AM • 12 hrs)</option>
                  <option value="General Shift (08:00 - 16:30)">General Shift (08:00 AM – 04:30 PM • 8.5 hrs)</option>
                  <option value="Afternoon Shift (13:00 - 21:00)">Afternoon Shift (01:00 PM – 09:00 PM • 8 hrs)</option>
                </select>
              </div>

              {/* Check-In Time Input + Preset Buttons */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Check-In Time (Punch In)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Format: HH:MM AM/PM</span>
                </div>
                <input
                  type="text"
                  value={logCheckIn}
                  onChange={(e) => setLogCheckIn(e.target.value)}
                  placeholder="07:00 AM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium mr-1">Presets:</span>
                  {[
                    { label: '06:45 AM (Early)', val: '06:45 AM' },
                    { label: '07:00 AM (Std)', val: '07:00 AM' },
                    { label: '07:30 AM (Late)', val: '07:30 AM' },
                    { label: '07:00 PM (Night)', val: '07:00 PM' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setLogCheckIn(preset.val)}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-semibold cursor-pointer transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setLogCheckIn(
                        new Date().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] cursor-pointer"
                  >
                    Current Time
                  </button>
                </div>
              </div>

              {/* Check-Out Time Input + Preset Buttons */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Check-Out Time (Punch Out)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Format: HH:MM AM/PM</span>
                </div>
                <input
                  type="text"
                  value={logCheckOut}
                  onChange={(e) => setLogCheckOut(e.target.value)}
                  placeholder="05:00 PM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium mr-1">Presets:</span>
                  {[
                    { label: '05:00 PM (Std)', val: '05:00 PM' },
                    { label: '07:00 AM (Night)', val: '07:00 AM' },
                    { label: 'Active / On Duty', val: 'On Duty' },
                    { label: 'Clear (—)', val: '—' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setLogCheckOut(preset.val)}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 text-[10px] font-semibold cursor-pointer transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setLogCheckOut(
                        new Date().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] cursor-pointer"
                  >
                    Current Time
                  </button>
                </div>
              </div>

              {/* Status & Overtime Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Status *</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Present">Present (On Time)</option>
                    <option value="Late">Late Check-in</option>
                    <option value="Half Day">Half Day (4-5 hrs)</option>
                    <option value="On Leave">On Leave (Approved)</option>
                    <option value="Absent">Absent (Unexcused)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overtime (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={logOvertime}
                    onChange={(e) => setLogOvertime(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Admin Remarks / Audit Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Admin Verification Remarks / Reason
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Approved gate delay pass, extra hour on feeder motor servicing"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">
                  Logged as: <strong className="text-slate-800">Admin (Operations)</strong>
                </span>
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsTimeLogModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Save Attendance Punch</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
