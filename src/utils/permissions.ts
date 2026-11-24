export type CanonicalRole = 'super_admin' | 'admin' | 'supervisor';

export type AppNavTab =
  | 'dashboard'
  | 'flocks'
  | 'egg-production'
  | 'daily-consumption'
  | 'bird-health'
  | 'sales'
  | 'expenses'
  | 'stocks'
  | 'salaries'
  | 'reports'
  | 'power-consumption'
  | 'farms'
  | 'users';

const ADMIN_ALLOWED_TABS: ReadonlySet<AppNavTab> = new Set([
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
  'power-consumption',
  'farms',
]);

const SUPERVISOR_ALLOWED_TABS: ReadonlySet<AppNavTab> = new Set([
  'dashboard',
  'flocks',
  'egg-production',
  'daily-consumption',
  'bird-health',
  'stocks',
  'power-consumption',
]);

export function normalizeRole(role?: string | null): CanonicalRole {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'admin' || r === 'accountant' || r === 'farm_admin') return 'admin';
  return 'supervisor';
}

export function getRoleDisplayLabel(role?: string | null): string {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'superadmin') return 'Super Admin';
  if (r === 'admin' || r === 'farm_admin') return 'Admin';
  if (r === 'accountant') return 'Accountant (Admin)';
  if (r === 'veterinarian') return 'Veterinarian (Supervisor)';
  return 'Supervisor';
}

export interface RolePermissions {
  canonicalRole: CanonicalRole;
  rawRole: string;
  roleLabel: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewFinancials: boolean;
  canViewSalaries: boolean;
  canViewReports: boolean;
  canViewFarms: boolean;
  canManageUsers: boolean;
  canAccessTab: (tab: AppNavTab | string) => boolean;
}

export function getRolePermissions(role?: string | null): RolePermissions {
  const canonicalRole = normalizeRole(role);
  const isSuperAdmin = canonicalRole === 'super_admin';
  const isAdmin = canonicalRole === 'admin';
  const isSupervisor = canonicalRole === 'supervisor';

  return {
    canonicalRole,
    rawRole: String(role || canonicalRole),
    roleLabel: getRoleDisplayLabel(role),
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    canAdd: true,
    canEdit: isSuperAdmin,
    canDelete: isSuperAdmin,
    canViewFinancials: isSuperAdmin || isAdmin,
    canViewSalaries: isSuperAdmin || isAdmin,
    canViewReports: isSuperAdmin || isAdmin,
    canViewFarms: isSuperAdmin || isAdmin,
    canManageUsers: isSuperAdmin,
    canAccessTab: (tab: AppNavTab | string) => {
      if (isSuperAdmin) return true;
      if (isAdmin) return ADMIN_ALLOWED_TABS.has(tab as AppNavTab);
      return SUPERVISOR_ALLOWED_TABS.has(tab as AppNavTab);
    },
  };
}
