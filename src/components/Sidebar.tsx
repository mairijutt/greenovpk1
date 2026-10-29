import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Egg,
  Layers,
  HeartPulse,
  Wheat,
  Boxes,
  TrendingUp,
  ArrowDownRight,
  Users,
  FileBarChart2,
  Building2,
  UserCheck,
  LogOut,
  ChevronsUpDown,
  Key,
  Mail,
  User,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Send,
  AlertCircle,
  Smartphone,
  Check,
} from 'lucide-react';

export type NavTab =
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
  | 'farms'
  | 'users';

interface UserProfileData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  emailVerified?: boolean;
  initials?: string;
}

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  currentUser?: UserProfileData | null;
  onSignOut?: () => void;
  onUpdateUser?: (updated: UserProfileData) => void;
}

interface NavSection {
  title: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  currentUser,
  onSignOut,
  onUpdateUser,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfileModal, setActiveProfileModal] = useState<
    'password' | 'email' | 'profile' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile modal fields
  const [userName, setUserName] = useState(currentUser?.name || 'Ahsan Nawaz');
  const [userEmail, setUserEmail] = useState(currentUser?.email || 'aaglobal500@gmail.com');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '+92 300 8645210');
  const [userRole, setUserRole] = useState(currentUser?.role || 'Managing Director & Farm Admin');
  const [userInitials, setUserInitials] = useState(currentUser?.initials || 'CN');

  // Change password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Email verification fields
  const [isEmailVerified, setIsEmailVerified] = useState(
    currentUser?.email === 'aaglobal500@gmail.com' ? true : (currentUser?.emailVerified ?? false)
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Synchronize internal state if currentUser prop changes
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name);
      setUserEmail(currentUser.email);
      if (currentUser.phone) setUserPhone(currentUser.phone);
      if (currentUser.role) setUserRole(currentUser.role);
      if (currentUser.initials) setUserInitials(currentUser.initials);
      setIsEmailVerified(
        currentUser.email === 'aaglobal500@gmail.com' ? true : Boolean(currentUser.emailVerified)
      );
    }
  }, [currentUser]);

  const sections: NavSection[] = [
    {
      title: 'Analytics & Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Livestock & Production',
      items: [
        { id: 'flocks', label: 'Flocks', icon: Layers },
        { id: 'egg-production', label: 'Egg Production', icon: Egg, badge: 'Daily' },
        { id: 'daily-consumption', label: 'Daily Consumptions', icon: Wheat },
        { id: 'bird-health', label: 'Bird Health', icon: HeartPulse },
      ],
    },
    {
      title: 'Financials & Store',
      items: [
        { id: 'sales', label: 'Sales', icon: TrendingUp },
        { id: 'expenses', label: 'Expenses', icon: ArrowDownRight },
        { id: 'stocks', label: 'Stocks', icon: Boxes },
        { id: 'salaries', label: 'Salaries', icon: Users },
        { id: 'reports', label: 'Reports', icon: FileBarChart2 },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'farms', label: 'Farms', icon: Building2 },
        { id: 'users', label: 'User Management', icon: UserCheck },
      ],
    },
  ];

  // Handler: Change Password
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setActiveProfileModal(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMessage('Account password updated successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handler: Send Email Verification Code
  const handleSendVerificationCode = () => {
    setEmailError('');
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(randomCode);
    setCodeSent(true);
    setInputCode(randomCode); // automatically populated for smooth demo
    setToastMessage(`Verification code sent to ${userEmail}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handler: Confirm Email Verification Code
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!inputCode.trim()) {
      setEmailError('Please enter the 6-digit verification code.');
      return;
    }

    if (verificationCode && inputCode.trim() !== verificationCode) {
      setEmailError('Invalid verification code. Please check and try again.');
      return;
    }

    setIsEmailVerified(true);
    if (onUpdateUser) {
      onUpdateUser({
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        initials: userInitials,
        emailVerified: true,
      });
    }
    setActiveProfileModal(null);
    setToastMessage('Email address verified successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handler: Update Profile Details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Full name is required.');
      return;
    }
    if (!userEmail.trim()) {
      alert('Email address is required.');
      return;
    }

    const calculatedInitials =
      userInitials.trim() ||
      userName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ||
      'CN';

    setUserInitials(calculatedInitials);

    if (onUpdateUser) {
      onUpdateUser({
        name: userName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        role: userRole.trim(),
        initials: calculatedInitials,
        emailVerified: isEmailVerified,
      });
    }

    setActiveProfileModal(null);
    setToastMessage('Profile details updated successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <>
      <aside
        className={`bg-white border-r border-slate-200 w-64 flex-shrink-0 flex flex-col justify-between transition-all duration-200 shadow-sm ${
          isOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        {/* Scrollable Navigation Menu */}
        <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
          {sections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'pt-2' : ''}>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-1 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Card with Popover matching sc1.png */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 relative">
          {/* Popover Menu matching sc1.png exactly */}
          {isProfileOpen && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />

              <div className="absolute bottom-[calc(100%+8px)] left-2.5 right-2.5 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Profile Card Header */}
                <div className="flex items-center space-x-2.5 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#dbeee0] text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {userName}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {userEmail}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-1"></div>

                {/* Menu options matching sc1.png */}
                <div className="py-0.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setActiveProfileModal('password');
                    }}
                    className="w-full flex items-center space-x-3 px-3.5 py-2 text-slate-800 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-slate-700" />
                    <span className="font-normal text-xs text-slate-800">Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setActiveProfileModal('email');
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-slate-800 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-slate-700" />
                      <span className="font-normal text-xs text-slate-800">Verify Email</span>
                    </div>
                    {isEmailVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        Pending
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setActiveProfileModal('profile');
                    }}
                    className="w-full flex items-center space-x-3 px-3.5 py-2 text-slate-800 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-700" />
                    <span className="font-normal text-xs text-slate-800">Update Profile</span>
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-1"></div>

                {/* Log out option matching sc1.png (black/dark text and exit bracket icon) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full flex items-center space-x-3 px-3.5 py-2 text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-900" />
                  <span className="font-normal text-xs text-slate-900">Log out</span>
                </button>
              </div>
            </>
          )}

          {/* Bottom trigger pill matching sc1.png */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#dcefe0] hover:bg-[#d0e8d6] border border-[#c2e2c9] shadow-2xs transition-all text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#d0e8d4] text-[#1b4d24] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {userName}
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  {userEmail}
                </div>
              </div>
            </div>

            <ChevronsUpDown className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1" />
          </button>
        </div>
      </aside>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CHANGE PASSWORD                                  */}
      {/* ========================================================= */}
      {activeProfileModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Change Password</span>
              </div>
              <button
                onClick={() => setActiveProfileModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveProfileModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VERIFY EMAIL                                     */}
      {/* ========================================================= */}
      {activeProfileModal === 'email' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Verify Email Address</span>
              </div>
              <button
                onClick={() => setActiveProfileModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registered Email:</span>
                {isEmailVerified ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Pending Verification
                  </span>
                )}
              </div>
              <div className="font-mono font-bold text-slate-800 text-sm">
                {userEmail}
              </div>
            </div>

            {isEmailVerified ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="font-bold text-emerald-900 text-sm">
                  Email Successfully Verified!
                </div>
                <p className="text-[11px] text-emerald-700">
                  Your email address is authenticated for farm security alerts, reports export, and password resets.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveProfileModal(null)}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold">Verification Code</label>
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      {codeSent ? 'Resend Code' : 'Send Code to Email'}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 582194)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 tracking-widest text-center text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {codeSent && (
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                      <span>Code dispatched to inbox.</span>
                      <button
                        type="button"
                        onClick={() => setInputCode(verificationCode)}
                        className="text-emerald-600 font-bold hover:underline cursor-pointer"
                      >
                        Auto-fill ({verificationCode})
                      </button>
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveProfileModal(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer shadow-xs"
                  >
                    Confirm &amp; Verify
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: UPDATE PROFILE                                   */}
      {/* ========================================================= */}
      {activeProfileModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Update Profile</span>
              </div>
              <button
                onClick={() => setActiveProfileModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Ahsan Nawaz"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. aaglobal500@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Avatar Initials</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={userInitials}
                    onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
                    placeholder="CN"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-center text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+92 300 8645210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">System Role / Designation</label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="Managing Director &amp; Farm Admin"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveProfileModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
