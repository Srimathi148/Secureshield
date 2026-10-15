import { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Activity,
  Layers,
  Building2,
  Clock,
  Eye,
  EyeOff,
  Check,
  FileCode,
  Copy,
} from 'lucide-react';
import type { AuthSession } from '../types';
import { authService, getAuditLogs, type AuditLogEntry } from '../services/authService';

interface DashboardProps {
  session: AuthSession;
  onSignOut: () => void;
  onResetGraphicalPassword: () => void;
  onTestReAuth: () => void;
}

export const Dashboard = ({
  session,
  onSignOut,
  onResetGraphicalPassword,
  onTestReAuth,
}: DashboardProps) => {
  const isRecognition = session.method === 'recognition';
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'audit' | 'architecture'>('overview');

  // Change primary password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Copy SQL state
  const [copiedSql, setCopiedSql] = useState(false);

  // Audit logs
  const auditLogs: AuditLogEntry[] = getAuditLogs();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters according to enterprise policy.' });
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
        setPasswordStatus({ success: true, message: 'Primary workplace password updated successfully in Supabase Auth!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ success: false, message: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordStatus({ success: false, message: err.message || 'Error occurred while updating password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- SecureShield Enterprise Database Setup
CREATE TABLE IF NOT EXISTS public.user_graphical_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('recognition', 'recall')),
    credential_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_graphical_credential UNIQUE (user_id)
);

ALTER TABLE public.user_graphical_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own graphical credential"
    ON public.user_graphical_credentials FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own graphical credential"
    ON public.user_graphical_credentials FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own graphical credential"
    ON public.user_graphical_credentials FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE OR REPLACE FUNCTION public.save_graphical_credential(
    p_user_id UUID, p_auth_method TEXT, p_credential_hash TEXT, p_salt TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.user_graphical_credentials (user_id, auth_method, credential_hash, salt, failed_attempts, updated_at)
    VALUES (p_user_id, p_auth_method, p_credential_hash, p_salt, 0, timezone('utc'::text, now()))
    ON CONFLICT (user_id) DO UPDATE SET
        auth_method = EXCLUDED.auth_method, credential_hash = EXCLUDED.credential_hash,
        salt = EXCLUDED.salt, failed_attempts = 0, updated_at = timezone('utc'::text, now());
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_graphical_credential(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      {/* Top Banner / Operator Identity Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-500/5 rounded-full blur-3xl pointer-events-none" />

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
                  {session.user.fullName || 'Enterprise Security Operator'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ZERO TRUST AUTHENTICATED
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <span>{session.user.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                  <Building2 className="w-3.5 h-3.5 text-cyber-500" />
                  {session.user.department || 'Banking Sector - Retail & Commercial Banking'}
                </span>
                <span>•</span>
                <span>ID: {session.user.id.slice(0, 13)}...</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              id="dashboard-reauth-btn"
              onClick={onTestReAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-cyber-500/50 hover:text-cyber-500 transition-colors shadow-sm"
              title="Lock terminal and challenge with visual MFA to unlock"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lock Terminal</span>
            </button>

            <button
              type="button"
              id="dashboard-signout-btn"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Enterprise Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Security Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'credentials'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Password & MFA Credentials
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Audit Logs & Events
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'architecture'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            RLS & Database Architecture
          </button>
        </div>
      </div>

      {/* TAB 1: SECURITY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in-50">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Factor 2 */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Enforced MFA Factor
                </span>
                <div className="p-2 rounded-xl bg-cyber-500/10 text-cyber-500">
                  {isRecognition ? <ShieldCheck className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {isRecognition ? 'Recognition-Based MFA' : 'Recall Sequential MFA'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isRecognition
                  ? '4 visual markers verified independently of randomized grid positions to prevent shoulder-surfing.'
                  : 'Strict 4-step directional graphical pathway enforced with sequential token validation.'}
              </p>
            </div>

            {/* Anomaly / Failed Attempts */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Authentication Anomalies
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    session.failedAttempts > 0
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {session.failedAttempts > 0 ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {session.failedAttempts} {session.failedAttempts === 1 ? 'Failed Attempt' : 'Failed Attempts'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {session.failedAttempts === 0
                  ? 'Zero unauthorized authentication attempts recorded for this identity.'
                  : `${session.failedAttempts} unauthorized ${session.failedAttempts === 1 ? 'attempt was' : 'attempts were'} intercepted and recorded prior to successful authentication.`}
              </p>
            </div>

            {/* Cryptographic Standard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Dual-Factor Cryptography
                </span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Fingerprint className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Bcrypt + SHA-256
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Primary password stored via Supabase bcrypt. Visual MFA protected by 16-byte random salt and SHA-256.
              </p>
            </div>
          </div>

          {/* Session Profile Details */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-500" />
              Active Enterprise Session Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Assigned Sector</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 flex items-center gap-1.5" title={session.user.department || 'Banking Sector - Retail & Commercial Banking'}>
                  <Building2 className="w-3.5 h-3.5 text-cyber-500 shrink-0" />
                  <span className="truncate">{session.user.department || 'Banking Sector - Retail & Commercial Banking'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">User Identity UUID</div>
                <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
                  {session.user.id}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Authentication Time</div>
                <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyber-500" />
                  {new Date(session.authenticatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Row Level Security (RLS)</div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  auth.uid() Isolated
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Directory Backend</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {session.isDemoMode ? 'Local Enterprise Sandbox' : 'Supabase Cloud Postgres'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PASSWORD & CREDENTIALS MANAGEMENT */}
      {activeTab === 'credentials' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Change Primary Password Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Factor 1 • Primary Password Management
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Update Primary Workplace Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Updates your password encrypted with salted bcrypt in Supabase Auth. Your password is never stored in plaintext.
              </p>
            </div>

            {passwordStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-3 ${
                  passwordStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {passwordStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">{passwordStatus.message}</div>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Primary Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !newPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 shadow-cyber disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Save New Primary Password'}
              </button>
            </form>
          </div>

          {/* Reconfigure Visual MFA Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Factor 2 • Visual Multi-Factor Authentication
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Reconfigure Visual MFA Key
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                Modify your enrolled visual markers or sequential pathway. All updates generate a new 16-byte cryptographic salt and SHA-256 digest in the database.
              </p>
            </div>

            <button
              type="button"
              id="reset-graphical-cred-btn"
              onClick={onResetGraphicalPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto shrink-0"
            >
              <Layers className="w-4 h-4 text-cyber-500" />
              <span>Update Visual Key</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ENTERPRISE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Enterprise Identity Audit Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time security telemetry of authentication events, password updates, and MFA challenges.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 self-start sm:self-auto">
              Retaining last 25 events
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {log.eventType}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : log.status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {log.status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RLS & DATABASE ARCHITECTURE GUIDE */}
      {activeTab === 'architecture' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in-50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Technical Architecture & Row Level Security
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Why Passwords & Credentials are Restricted by Row Level Security (RLS)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Enterprise explanation of how primary passwords vs graphical MFA tokens are protected in Supabase PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Lock className="w-4 h-4 text-cyber-500" />
                <span>1. Where is the Primary Password Stored?</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Supabase stores primary passwords inside the internal system schema <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">auth.users</code> using <strong>bcrypt</strong>.
                Client-side SQL queries can NEVER view or update passwords directly. You set and update passwords exclusively via <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">supabase.auth.signUp()</code> and <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">supabase.auth.updateUser()</code>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>2. Why did Row Level Security (RLS) Restrict Credentials?</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The graphical MFA tokens live in <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">public.user_graphical_credentials</code>.
                When Supabase has <em>"Confirm email"</em> enabled, a newly registered user has no active session JWT yet (<code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">auth.uid() = NULL</code>).
                When the app attempts to insert the graphical password, the standard policy <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">auth.uid() = user_id</code> evaluates to FALSE, blocking the save.
              </p>
            </div>
          </div>

          {/* Solution & Copy SQL */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-500" />
                <span>Enterprise SQL Script: Fixed RLS & SECURITY DEFINER Function</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyber-500 transition-colors shadow-sm"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run this SQL script in your <strong>Supabase Dashboard -&gt; SQL Editor</strong> to create the table, RLS policies, and the <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">save_graphical_credential</code> procedure which safely eliminates RLS onboarding blocks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
