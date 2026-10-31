import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Users,
  HeartPulse,
  Mail,
  CheckCircle2,
  Lock,
  X,
  Edit2,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { StatCard, PageHeader, UIButton, UIInput, UISelect, UISearchInput, UIFilterBar, TableCard } from './ui';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'supervisor' | 'veterinarian' | 'accountant';
  farmAssigned: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  password?: string;
}

const initialUsers: UserRecord[] = [
  {
    id: 'usr-1',
    name: 'Ahsan Nawaz',
    email: 'aaglobal500@gmail.com',
    role: 'super_admin',
    farmAssigned: 'All Farm Complexes',
    status: 'Active',
    lastLogin: 'Just now',
    password: 'GreenovaAdmin@2026',
  },
  {
    id: 'usr-2',
    name: 'Farm Director (Admin)',
    email: 'admin@greenovapk.com',
    role: 'admin',
    farmAssigned: 'All Farm Complexes',
    status: 'Active',
    lastLogin: 'Today, 08:30 AM',
    password: 'Greenova@2026',
  },
  {
    id: 'usr-3',
    name: 'Dr. Tariq (Chief Vet)',
    email: 'vet.tariq@greenovapk.com',
    role: 'veterinarian',
    farmAssigned: 'Unit 1 & Unit 2',
    status: 'Active',
    lastLogin: 'Yesterday',
    password: 'Greenova@2026',
  },
  {
    id: 'usr-4',
    name: 'Mustafa (Shed In-charge)',
    email: 'mustafa@greenovapk.com',
    role: 'supervisor',
    farmAssigned: 'GreenOva Unit 2',
    status: 'Active',
    lastLogin: 'Today, 07:15 AM',
    password: 'Greenova@2026',
  },
  {
    id: 'usr-5',
    name: 'Sadam (Shift Lead)',
    email: 'sadam@greenovapk.com',
    role: 'supervisor',
    farmAssigned: 'GreenOva Unit 3',
    status: 'Active',
    lastLogin: 'Today, 06:45 AM',
    password: 'Greenova@2026',
  },
  {
    id: 'usr-6',
    name: 'Farooq (Accounts Officer)',
    email: 'accounts@greenovapk.com',
    role: 'accountant',
    farmAssigned: 'Head Office',
    status: 'Active',
    lastLogin: '2 days ago',
    password: 'Greenova@2026',
  },
];

const roleLabels: Record<string, { label: string; badgeClass: string }> = {
  super_admin: { label: 'Super Admin', badgeClass: 'bg-emerald-100 text-emerald-800' },
  admin: { label: 'Farm Admin', badgeClass: 'bg-blue-100 text-blue-800' },
  supervisor: { label: 'Supervisor', badgeClass: 'bg-amber-100 text-amber-800' },
  veterinarian: { label: 'Veterinarian', badgeClass: 'bg-rose-100 text-rose-800' },
  accountant: { label: 'Accountant', badgeClass: 'bg-purple-100 text-purple-800' },
};

interface UserManagementViewProps {
  currentUser?: {
    email: string;
    name: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const isSuperAdmin = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.role === 'super_admin' ||
    currentUser?.email?.toLowerCase() === 'aaglobal500@gmail.com' ||
    currentUser?.email?.toLowerCase().includes('aaglobal') ||
    currentUser?.role?.toLowerCase().includes('managing director') ||
    currentUser?.role?.toLowerCase().includes('super admin')
  );

  const [users, setUsers] = useState<UserRecord[]>(() => {
    const saved = localStorage.getItem('greenova_users_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialUsers;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'supervisor' as UserRecord['role'],
    farmAssigned: 'GreenOva Unit 1',
    password: '',
  });

  // Edit user form state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRecord['role']>('supervisor');
  const [editFarm, setEditFarm] = useState('GreenOva Unit 1');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editPassword, setEditPassword] = useState('');

  // Password change modal state
  const [passwordModalUser, setPasswordModalUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Persist users to localStorage
  const handleUpdateUsers = (updatedList: UserRecord[]) => {
    setUsers(updatedList);
    try {
      localStorage.setItem('greenova_users_v2', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.farmAssigned.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setToastMessage('Access Denied: Only Super Admin can add new user accounts.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const user: UserRecord = {
      id: `usr-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      farmAssigned: newUser.farmAssigned,
      status: 'Active',
      lastLogin: 'Invited',
      password: newUser.password.trim() || 'Greenova@2026',
    };
    handleUpdateUsers([...users, user]);
    setNewUser({
      name: '',
      email: '',
      role: 'supervisor',
      farmAssigned: 'GreenOva Unit 1',
      password: '',
    });
    setShowAddModal(false);
    setToastMessage(`User "${user.name}" created successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEdit = (user: UserRecord) => {
    if (!isSuperAdmin) {
      setToastMessage('Access Denied: Only Super Admin can edit accounts.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditFarm(user.farmAssigned);
    setEditStatus(user.status);
    setEditPassword('');
  };

  const handleOpenPasswordModal = (user: UserRecord) => {
    if (!isSuperAdmin) {
      setToastMessage('Access Denied: Only Super Admin can change account passwords.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowNewPassword(false);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setPasswordError('Permission denied: Only Super Admin can update passwords.');
      return;
    }
    if (!passwordModalUser) return;
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify.');
      return;
    }

    const updated = users.map((u) =>
      u.id === passwordModalUser.id ? { ...u, password: newPassword } : u
    );
    handleUpdateUsers(updated);
    setToastMessage(`Password for "${passwordModalUser.name}" successfully updated!`);
    setTimeout(() => setToastMessage(null), 4000);
    setPasswordModalUser(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setToastMessage('Access Denied: Only Super Admin can modify account details.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;

    const updated = users.map((u) =>
      u.id === editingUser.id
        ? {
            ...u,
            name: editName.trim(),
            email: editEmail.trim(),
            role: editRole,
            farmAssigned: editFarm,
            status: editStatus,
            ...(editPassword ? { password: editPassword } : {}),
          }
        : u
    );

    handleUpdateUsers(updated);
    setToastMessage(`User "${editName.trim()}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (!isSuperAdmin) {
      setToastMessage('Access Denied: Only Super Admin can delete user accounts.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    const target = users.find((u) => u.id === id);
    if (target?.email === 'aaglobal500@gmail.com') {
      alert('The primary Super Administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user account "${target?.name || id}"? This action cannot be undone.`)) {
      const updated = users.filter((u) => u.id !== id);
      handleUpdateUsers(updated);
      setToastMessage('User account deleted successfully.');
      setTimeout(() => setToastMessage(null), 4000);
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="User Management & Access Control"
        subtitle="Manage system administrators, veterinarians, supervisors, and role-based permissions."
        icon={UserCheck}
        iconColor="teal"
        badge={isSuperAdmin ? 'Super Admin Mode' : 'Read-Only Access'}
        actions={
          isSuperAdmin ? (
            <UIButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add New User
            </UIButton>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Super Admin Protected</span>
            </div>
          )
        }
      />

      {/* Standardized KPI Stats Grid matching DashboardView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total System Users"
          value={users.length}
          unit="Accounts"
          icon={Users}
          color="teal"
          badge={{ text: 'All Active', color: 'teal' }}
          subtext="Authenticated staff & management"
        />

        <StatCard
          title="Super Administrators"
          value={users.filter((u) => u.role === 'super_admin' || u.role === 'admin').length}
          unit="Admins"
          icon={ShieldCheck}
          color="emerald"
          badge={{ text: 'Full Access', color: 'emerald' }}
          subtext="Executive oversight & approval"
        />

        <StatCard
          title="Shed Supervisors"
          value={users.filter((u) => u.role === 'supervisor').length}
          unit="Supervisors"
          icon={UserCheck}
          color="blue"
          badge={{ text: 'Operational', color: 'blue' }}
          subtext="Daily data entry & flock logs"
        />

        <StatCard
          title="Veterinary Officers"
          value={users.filter((u) => u.role === 'veterinarian').length}
          unit="Vets"
          icon={HeartPulse}
          color="rose"
          badge={{ text: 'Health Control', color: 'rose' }}
          subtext="Bio-security and prescriptions"
        />
      </div>

      {/* Standardized Filters Bar */}
      <UIFilterBar>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <UISearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search user by name, email, or shed..."
            containerClassName="w-full sm:w-72"
          />

          <div className="w-full sm:w-48">
            <UISelect
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              aria-label="Filter by Role"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Farm Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="veterinarian">Veterinarian</option>
              <option value="accountant">Accountant</option>
            </UISelect>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> active user accounts
        </div>
      </UIFilterBar>

      {/* Users Table Card */}
      <TableCard
        title="Authorized Enterprise User Directory"
        subtitle="Manage login credentials, designated shed assignments, and operational permissions"
        badge={
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60">
            Active Roster
          </span>
        }
      >
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">User Name</th>
              <th className="py-3 px-4">Email / Login</th>
              <th className="py-3 px-4">Role Permission</th>
              <th className="py-3 px-4">Assigned Farm Unit</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const roleMeta = roleLabels[u.role] || {
                label: u.role,
                badgeClass: 'bg-slate-100 text-slate-700',
              };

              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleMeta.badgeClass}`}
                    >
                      {roleMeta.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{u.farmAssigned}</td>
                  <td className="py-3 px-4 text-slate-500">{u.lastLogin}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isSuperAdmin ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(u)}
                          title="Change Account Password (Super Admin)"
                          className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User Details"
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.email === 'aaglobal500@gmail.com'}
                          title={u.email === 'aaglobal500@gmail.com' ? 'Primary Super Admin account cannot be deleted' : 'Delete User Account'}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 inline-flex items-center space-x-1 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Super Admin Only</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-200/50">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New User</h2>
                  <p className="text-xs text-slate-500">Create login credentials and set roles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-4 text-xs">
              <UIInput
                label="Full Name"
                required
                placeholder="e.g. Dr. Salman Khan"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />

              <UIInput
                label="Email Address"
                type="email"
                required
                placeholder="e.g. salman@greenovapk.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <UISelect
                  label="Role Permission"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="veterinarian">Veterinarian</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Farm Admin</option>
                  <option value="super_admin">Super Admin</option>
                </UISelect>

                <UISelect
                  label="Assigned Unit"
                  value={newUser.farmAssigned}
                  onChange={(e) => setNewUser({ ...newUser, farmAssigned: e.target.value })}
                >
                  <option value="All Farm Complexes">All Units</option>
                  <option value="GreenOva Unit 1">GreenOva Unit 1</option>
                  <option value="GreenOva Unit 2">GreenOva Unit 2</option>
                  <option value="GreenOva Unit 3">GreenOva Unit 3</option>
                </UISelect>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <UIButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </UIButton>
                <UIButton type="submit" variant="primary">
                  Create User
                </UIButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Edit User Account</h2>
                  <p className="text-xs text-slate-500">Update system role, profile &amp; designated shed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <UIInput
                label="Full Name *"
                required
                placeholder="e.g. Ahsan Nawaz"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <UIInput
                label="Email / Login Identifier *"
                type="email"
                required
                placeholder="e.g. user@greenovapk.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <UISelect
                  label="Role Permission *"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="veterinarian">Veterinarian</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Farm Admin</option>
                  <option value="super_admin">Super Admin</option>
                </UISelect>

                <UISelect
                  label="Assigned Unit *"
                  value={editFarm}
                  onChange={(e) => setEditFarm(e.target.value)}
                >
                  <option value="All Farm Complexes">All Units</option>
                  <option value="GreenOva Unit 1">GreenOva Unit 1</option>
                  <option value="GreenOva Unit 2">GreenOva Unit 2</option>
                  <option value="GreenOva Unit 3">GreenOva Unit 3</option>
                  <option value="Head Office">Head Office</option>
                </UISelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 cursor-pointer"
                >
                  <option value="Active">Active (Permitted to log in)</option>
                  <option value="Inactive">Inactive (Access suspended)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(editingUser.id)}
                  className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                >
                  Delete Account
                </button>
                <div className="flex space-x-2">
                  <UIButton
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </UIButton>
                  <UIButton type="submit" variant="primary">
                    Save Changes
                  </UIButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal (Super Admin Exclusive) */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/50">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Change Account Password</h2>
                  <p className="text-xs text-slate-500">Super Administrator credential control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Account User:</span>
                  <span className="font-bold text-slate-900">{passwordModalUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email / Login ID:</span>
                  <span className="font-mono text-slate-700">{passwordModalUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <span className="font-bold text-emerald-700">{roleLabels[passwordModalUser.role]?.label || passwordModalUser.role}</span>
                </div>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="w-full px-3 py-2.5 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <UIButton
                  type="button"
                  variant="secondary"
                  onClick={() => setPasswordModalUser(null)}
                >
                  Cancel
                </UIButton>
                <UIButton type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Update Password
                </UIButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
