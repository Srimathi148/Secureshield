import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  BarChart3,
  Search,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Download,
  LogOut,
  Shield,
  ShieldCheck,
  Terminal,
  Flame,
} from 'lucide-react';
import type { AuthSession, ManagedUser, UserRole, UserStatus } from '../types';
import { authService, getAuditLogs, type AuditLogEntry } from '../services/authService';
import { EmailSafetyCard } from './EmailSafetyCard';

interface AdminDashboardProps {
  session: AuthSession;
  onSignOut: () => void;
  onTestReAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  onSignOut,
  onTestReAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'audit' | 'threats' | 'email-safety'>('stats');

  // User management state
  const [users, setUsers] = useState<ManagedUser[]>(() => authService.getAllUsers());
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'user' | 'admin'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'WARNING'>('ALL');

  // Handler for tab switching that keeps data fresh
  const handleSwitchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setUsers(authService.getAllUsers());
    setAuditLogs(getAuditLogs());
  };

  // Real-time statistics
  const stats = authService.getSystemStats();

  const handleToggleUserStatus = async (userId: string, currentStatus: UserStatus) => {
    const newStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const success = await authService.toggleUserStatus(userId, newStatus);
    if (success) {
      setUsers(authService.getAllUsers());
      setAuditLogs(getAuditLogs());
      setUserActionMessage(`User status changed to ${newStatus.toUpperCase()}`);
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    const success = await authService.changeUserRole(userId, newRole);
    if (success) {
      setUsers(authService.getAllUsers());
      setAuditLogs(getAuditLogs());
      setUserActionMessage(`User role altered to ${newRole.toUpperCase()}`);
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleResetUserMFA = async (userId: string) => {
    const success = await authService.resetUserMFA(userId);
    if (success) {
      setUsers(authService.getAllUsers());
      setAuditLogs(getAuditLogs());
      setUserActionMessage('Visual MFA credentials reset. User will re-enroll on next login.');
      setTimeout(() => setUserActionMessage(null), 3000);
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `secureshield_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.eventType.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.ipAddress.includes(logSearch);
    const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-left">
      {/* Administrator Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-indigo-500/20 dark:border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyber-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 m-0">
                  SecureShield Administrator Console
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                  <Terminal className="w-3.5 h-3.5" />
                  ELEVATED PRIVILEGES
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  RLS ACTIVE
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <span>Admin: {session.user.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {session.user.department || 'Federal Cyber Security Agency'}
                </span>
                <span>•</span>
                <span>UUID: {session.user.id.slice(0, 14)}...</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              id="admin-lock-terminal-btn"
              onClick={onTestReAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lock Terminal</span>
            </button>

            <button
              type="button"
              id="admin-signout-btn"
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
            onClick={() => handleSwitchTab('stats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            System Statistics
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            User Management ({users.length})
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            System-Wide Audit Logs
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('threats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'threats'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Security Events & Threats
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('email-safety')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'email-safety'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Breach Intelligence (HIBP)
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {userActionMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-2 shadow-sm animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{userActionMessage}</span>
        </div>
      )}

      {/* TAB 1: SYSTEM STATISTICS & MONITORING */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Have I Been Pwned Email Safety Status Banner */}
          <EmailSafetyCard initialEmail={session.user.email} isCompact={true} />

          {/* Metrics Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Total Provisioned Users</span>
                <Users className="w-4 h-4 text-cyber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.totalUsers}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {stats.activeUsers} Active • {stats.suspendedUsers} Suspended
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Visual MFA Adoption</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.mfaAdoptionRate}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                100% Zero Trust Mandatory MFA
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Intercepted Anomalies</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-amber-500 font-mono">
                {stats.totalFailedAttempts}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Suspicious challenge attempts blocked
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Threat Alert Level</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </div>
              <div
                className={`text-2xl font-extrabold font-mono ${
                  stats.threatLevel === 'HIGH'
                    ? 'text-rose-500'
                    : stats.threatLevel === 'ELEVATED'
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {stats.threatLevel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Zero Trust Guardian Active
              </div>
            </div>
          </div>

          {/* Sector Breakdown Chart */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Enterprise Sector Identity Distribution
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  🏦 Banking & Financial Sector
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {stats.sectorCounts.Banking} Identities
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Commercial & Central Banks</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  🏛️ Government & Defense
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {stats.sectorCounts.Government} Identities
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Defense & Intelligence Agencies</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  🛡️ Critical Infrastructure & Tech
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {stats.sectorCounts.Critical} Identities
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Energy, Cloud IAM, SecOps</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Access Control
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Enterprise User Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage roles, lock accounts, and revoke/reset visual MFA factors.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, email, sector..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="user">Normal Users</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setUsers(authService.getAllUsers());
                  setUserActionMessage('Directory refreshed: loaded latest enterprise users.');
                  setTimeout(() => setUserActionMessage(null), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-semibold transition-colors"
                title="Refresh user directory"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Directory</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                <tr>
                  <th className="p-3.5">User Identity</th>
                  <th className="p-3.5">Sector / Unit</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">MFA Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {u.username} • {u.email}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={u.department}>
                        {u.department}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                        <span>{u.phone}</span>
                        {u.country && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-sans font-medium">
                            {u.country}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <span className="capitalize">{u.authMethod}</span>
                      {u.failedAttempts > 0 && (
                        <span className="ml-1.5 text-amber-500 font-bold">({u.failedAttempts} failed)</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Lock / Unlock */}
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          u.status === 'active'
                            ? 'border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'border-emerald-200 dark:border-emerald-900 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={u.status === 'active' ? 'Suspend User Access' : 'Reactivate User'}
                      >
                        {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      {/* Reset MFA */}
                      <button
                        type="button"
                        onClick={() => handleResetUserMFA(u.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Revoke & Reset Visual MFA"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                      </button>

                      {/* Promote/Demote Role */}
                      <button
                        type="button"
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={u.role === 'admin' ? 'Demote to Normal User' : 'Promote to Administrator'}
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM-WIDE AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                SIEM & Compliance Audit Trail
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                System-Wide Audit Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time chronological events, cryptographic proofs, and authentication logs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by event or IP..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Outcomes</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed Only</option>
                <option value="WARNING">Warnings</option>
              </select>

              <button
                type="button"
                onClick={handleExportLogs}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : log.status === 'FAILED'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {log.eventType}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {log.description}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Client IP: {log.ipAddress} • User Agent: {log.userAgent}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: THREAT EVENTS & DETECTION */}
      {activeTab === 'threats' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in-50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Threat Intelligence
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Intrusion Detection & Anomaly Thresholds
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active monitoring for visual pattern brute-forcing, altered sequential pathways, and coordinate scraping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sequential MFA Tampering Detection
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500">
                  ENGAGED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Reversed or altered 4-icon pathways automatically increment the user anomaly counter and re-randomize coordinates to deny trial-and-error reconnaissance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Anti-Shoulder Surfing Fisher-Yates Engine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500">
                  SHUFFLING ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cryptographically random Fisher-Yates array permutation invalidates spatial mouse recordings, camera recordings, or screen-capture interception.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EMAIL BREACH INTELLIGENCE (HAVE I BEEN PWNED) */}
      {activeTab === 'email-safety' && (
        <div className="space-y-6 animate-in fade-in-50">
          <EmailSafetyCard initialEmail={session.user.email} isCompact={false} />
        </div>
      )}
    </div>
  );
};
