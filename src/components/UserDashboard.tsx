import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
  Lock,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  AtSign,
  History,
  Check,
  Eye,
  EyeOff,
  Building2,
  MailWarning,
  Files,
} from 'lucide-react';
import type { AuthSession, UserActivityLog, UserProfile } from '../types';
import { authService } from '../services/authService';
import { PhoneInput } from './PhoneInput';
import { NormalUserEmailChecker } from './NormalUserEmailChecker';
import { EmailMessageChecker } from './EmailMessageChecker';
import { DocumentRepository } from './DocumentRepository';

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
  const [activeTab, setActiveTab] = useState<'email-checker' | 'message-checker' | 'documents' | 'account' | 'activity'>('email-checker');

  // Personal profile state
  const [profile, setProfile] = useState<UserProfile>(session.user);
  const [fullNameInput, setFullNameInput] = useState(session.user.fullName);
  const [phoneInput, setPhoneInput] = useState(session.user.phone || '');
  const [countryInput, setCountryInput] = useState(session.user.country || '');
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Simple password strength guide
  const isLengthOk = newPassword.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must have at least 8 characters.' });
      return;
    }
    if (!hasLetters || !hasNumbers) {
      setPasswordStatus({ success: false, message: 'Please include both letters and numbers in your password.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'The two passwords do not match. Please re-enter them.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.updatePrimaryPassword(newPassword, session.user.id);
      if (res.success) {
        setPasswordStatus({ success: true, message: 'Your password was changed successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ success: false, message: res.error || 'Could not update password. Please try again.' });
      }
    } catch (err: any) {
      setPasswordStatus({ success: false, message: err.message || 'An error occurred while updating your password.' });
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
      setProfileStatus('Your profile details have been saved.');
      setTimeout(() => setProfileStatus(null), 3000);
    } else {
      setProfileStatus(res.error || 'Failed to update profile details.');
    }
  };

  const activityLogs: UserActivityLog[] = authService.getPersonalActivity(session.user.id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      {/* Friendly Welcome Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 m-0">
                  Welcome, {profile.fullName || 'User'}!
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Account Protected
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  {profile.username || 'user'}
                </span>
                {profile.department && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-teal-500" />
                      {profile.department}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Simple, intuitive top buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              id="user-lock-screen-btn"
              onClick={onTestReAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-teal-500 hover:text-teal-600 transition-colors shadow-sm cursor-pointer"
              title="Lock screen and sign back in using your picture password"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lock Screen</span>
            </button>

            <button
              type="button"
              id="user-signout-btn"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Simplified 3-Tab Navigation Bar */}
        <div className="flex items-center gap-2 mt-7 pt-4 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto text-xs">
          <button
            type="button"
            id="tab-email-checker"
            onClick={() => setActiveTab('email-checker')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'email-checker'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Email Safety Checker</span>
          </button>

          <button
            type="button"
            id="tab-message-checker"
            onClick={() => setActiveTab('message-checker')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'message-checker'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MailWarning className="w-4 h-4" />
            <span>Phishing Message Check</span>
          </button>

          <button
            type="button"
            id="tab-documents"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>Document Repository</span>
          </button>

          <button
            type="button"
            id="tab-account"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile & Password</span>
          </button>

          <button
            type="button"
            id="tab-activity"
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Sign-ins</span>
          </button>
        </div>
      </div>


      {/* TAB 1: EMAIL SAFETY CHECKER (MAIN FOCUS FOR NORMAL USER) */}
      {activeTab === 'email-checker' && (
        <div className="animate-in fade-in-50">
          <NormalUserEmailChecker initialEmail={profile.email} autoScan={true} />
        </div>
      )}

      {activeTab === 'message-checker' && (
        <div className="animate-in fade-in-50">
          <EmailMessageChecker variant="user" />
        </div>
      )}

      {/* TAB: SECURE DOCUMENT REPOSITORY */}
      {activeTab === 'documents' && (
        <div className="animate-in fade-in-50">
          <DocumentRepository session={session} />
        </div>
      )}

      {/* TAB 2: MY PROFILE & PASSWORD */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Profile Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
                Update your contact details below.
              </p>
            </div>

            {profileStatus && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{profileStatus}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <PhoneInput
                    id="user-dashboard-phone"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Account Email (Permanent)
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
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

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
              >
                Save Details
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
                Change Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
                Choose a strong password that you don't use anywhere else.
              </p>
            </div>

            {passwordStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                  passwordStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {passwordStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={isLengthOk ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                        {isLengthOk ? '✓' : '○'} At least 8 characters long
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={hasLetters && hasNumbers ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                        {hasLetters && hasNumbers ? '✓' : '○'} Mix of letters and numbers
                      </span>
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Picture Password Protection Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-teal-500" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
                    Picture Password Protection
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-xl m-0">
                  Your account is secured with a secret 4-picture password. When signing in, you click your pictures instead of entering codes. This prevents spyware or onlookers from stealing your password.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={onTestReAuth}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Test Picture Login
                </button>
                <button
                  type="button"
                  onClick={onResetGraphicalPassword}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
                >
                  Change My Pictures
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT SIGN-INS (SIMPLE & FRIENDLY) */}
      {activeTab === 'activity' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-in fade-in-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
              Recent Sign-in History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
              Here is a simple list of when your account was signed into.
            </p>
          </div>

          <div className="space-y-2.5">
            {activityLogs.slice(0, 10).map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isSuccess = log.status === 'SUCCESS';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {isSuccess ? 'Signed in successfully' : 'Unsuccessful sign-in attempt'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formattedDate} at {formattedTime} • Current browser
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isSuccess
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isSuccess ? 'Successful' : 'Blocked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
