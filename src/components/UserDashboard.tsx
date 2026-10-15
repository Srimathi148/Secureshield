import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Building2,
  Clock,
  Eye,
  EyeOff,
  User,
  Mail,
  AtSign,
  Activity,
  ShieldAlert,
  History,
  Check,
} from 'lucide-react';
import type { AuthSession, UserActivityLog, UserProfile } from '../types';
import { authService } from '../services/authService';
import { PhoneInput } from './PhoneInput';
import { EmailSafetyCard } from './EmailSafetyCard';

interface UserDashboardProps {
  session: AuthSession;
  onSignOut: () => void;
  onResetGraphicalPassword: () => void;
  onTestReAuth: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session,
  onSignOut,
  onResetGraphicalPassword,
  onTestReAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'graphical' | 'credentials' | 'activity' | 'profile' | 'email-safety'>('overview');

  // Personal profile state
  const [profile, setProfile] = useState<UserProfile>(session.user);
  const [fullNameInput, setFullNameInput] = useState(session.user.fullName);
  const [phoneInput, setPhoneInput] = useState(session.user.phone || '');
  const [countryInput, setCountryInput] = useState(session.user.country || '');
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  // Change primary password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Security preferences
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Personal activity logs
  const activityLogs: UserActivityLog[] = authService.getPersonalActivity(session.user.id);
  const isRecognition = session.method === 'recognition';

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = getPasswordStrength(newPassword);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters in length.' });
      return;
    }
    if (pwdScore < 3) {
      setPasswordStatus({ success: false, message: 'Please include uppercase letters, numbers, and special symbols for adequate security.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.updatePrimaryPassword(newPassword, session.user.id);
      if (res.success) {
        setPasswordStatus({ success: true, message: 'Primary password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ success: false, message: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordStatus({ success: false, message: err.message || 'Error updating password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);

    const res = await authService.updateUserProfile(session.user.id, {
      fullName: fullNameInput.trim(),
      phone: phoneInput.trim(),
      country: countryInput,
    });

    if (res.success) {
      setProfile((prev) => ({
        ...prev,
        fullName: fullNameInput.trim(),
        phone: phoneInput.trim(),
        country: countryInput,
      }));
      setProfileStatus('Profile information updated successfully.');
      setTimeout(() => setProfileStatus(null), 3000);
    } else {
      setProfileStatus(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      {/* User Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyber-500 flex items-center justify-center text-slate-950 font-bold shadow-cyber shrink-0">
              {isRecognition ? (
                <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
              ) : (
                <KeyRound className="w-8 h-8 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 m-0">
                  {profile.fullName || 'Workplace Identity'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ZERO TRUST SECURED
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  {profile.username || 'user'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                  <Building2 className="w-3.5 h-3.5 text-cyber-500" />
                  {profile.department || 'Banking Sector - Retail & Commercial Banking'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              id="user-lock-terminal-btn"
              onClick={onTestReAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-cyber-500/50 hover:text-cyber-500 transition-colors shadow-sm"
              title="Lock terminal and challenge with visual MFA to unlock"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lock Terminal</span>
            </button>

            <button
              type="button"
              id="user-signout-btn"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-7 pt-4 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('graphical')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'graphical'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            Graphical Authentication
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Password & MFA Management
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            My Login Activity
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile & Settings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email-safety')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'email-safety'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-cyber-500" />
            Email Safety (HIBP)
          </button>
        </div>
      </div>

      {/* TAB 1: SECURITY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in-50">
          {/* Have I Been Pwned Email Safety Status Banner */}
          <EmailSafetyCard initialEmail={profile.email} isCompact={true} />

          {/* Key Personal Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Graphical Authentication Status */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Graphical Factor Status
                </span>
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                  <Fingerprint className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Active & Enforced</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {isRecognition ? 'Recognition MFA' : 'Recall MFA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {isRecognition
                  ? 'Protected with 4 randomized visual markers resisting shoulder-surfing.'
                  : 'Protected with 4-step strict sequential visual pathway.'}
              </p>
            </div>

            {/* MFA Status */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Multi-Factor Protection
                </span>
                <div className="p-2 rounded-xl bg-cyber-500/10 text-cyber-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dual-Factor Active
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Both Factor 1 (Primary Password) and Factor 2 (Visual MFA Key) are mandatory for every session.
              </p>
            </div>

            {/* Account Security Status */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Security Posture
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                100% Zero Trust Verified
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Identity authenticated with salted cryptographic validation and session encryption.
              </p>
            </div>
          </div>

          {/* Personal Session & Login Details */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-500" />
              My Current Session Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Assigned Sector</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 flex items-center gap-1.5" title={profile.department}>
                  <Building2 className="w-3.5 h-3.5 text-cyber-500 shrink-0" />
                  <span className="truncate">{profile.department || 'Banking Sector'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Last Authentication</div>
                <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyber-500" />
                  {new Date(session.authenticatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Interception Rate</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                  {session.failedAttempts > 0 ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {session.failedAttempts} anomalies recorded
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      0 failed attempts
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Account Access Level</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Standard Operator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRAPHICAL AUTHENTICATION */}
      {activeTab === 'graphical' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Factor 2 Verification
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Visual Graphical MFA Key
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your visual credential acts as your secondary factor, replacing vulnerable SMS codes and keylog-prone pins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTestReAuth}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyber-500/10 text-cyber-600 dark:text-cyber-400 border border-cyber-500/20 hover:bg-cyber-500/20 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Test Challenge
              </button>

              <button
                type="button"
                onClick={onResetGraphicalPassword}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Re-enroll Visual Key
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Anti-Shoulder Surfing Protection
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                During every login challenge, the grid coordinates are shuffled using a cryptographically secure Fisher-Yates algorithm. An onlooker watching your screen or mouse clicks cannot deduce your secret passphrase.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-cyber-500" />
                Cryptographic Hashing
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your visual markers are combined with a dedicated 16-byte random salt and hashed using SHA-256 before verification. The raw graphical combination is never stored in plain text.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORD & MFA MANAGEMENT */}
      {activeTab === 'credentials' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in-50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Credentials Management
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Update Primary Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set a strong, unique passphrase for Step 1 of your dual-factor authentication.
            </p>
          </div>

          {passwordStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                passwordStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              }`}
            >
              {passwordStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Primary Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters with numbers & symbols"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 rounded-full transition-all ${
                          lvl <= pwdScore
                            ? pwdScore <= 2
                              ? 'bg-rose-500'
                              : pwdScore <= 3
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>
                      Strength:{' '}
                      {pwdScore <= 2 ? 'Weak' : pwdScore <= 3 ? 'Medium' : pwdScore <= 4 ? 'Strong' : 'Very Strong'}
                    </span>
                    <span>{newPassword.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyber-500 hover:bg-cyber-600 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: MY LOGIN ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-in fade-in-50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Security Audit
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              My Personal Login Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review recent authentications and visual challenges conducted under your account.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE & SETTINGS */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in-50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Personal Identity
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Profile & Security Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage your workplace contact details and session preferences.
            </p>
          </div>

          {profileStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{profileStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={profile.username || 'user'}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <PhoneInput
                  id="dashboard-phone"
                  label="Phone Number"
                  value={phoneInput}
                  defaultCountryCode="IN"
                  onChange={(fullNumber, countryOption) => {
                    setPhoneInput(fullNumber);
                    setCountryInput(countryOption.name);
                  }}
                />
              </div>
            </div>

            {/* Notification & Security toggles */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-700 dark:text-slate-300">
                Security Preferences
              </h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Dual-Factor Login Notifications
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Receive immediate alerts when visual challenges are initiated for this identity.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={loginAlerts}
                  onChange={(e) => setLoginAlerts(e.target.checked)}
                  className="w-4 h-4 accent-cyber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyber-500 hover:bg-cyber-600 text-slate-950 transition-colors shadow-sm"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: EMAIL SAFETY & BREACH INTELLIGENCE (HAVE I BEEN PWNED) */}
      {activeTab === 'email-safety' && (
        <div className="space-y-6 animate-in fade-in-50">
          <EmailSafetyCard initialEmail={profile.email} isCompact={false} />
        </div>
      )}
    </div>
  );
};
