import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Files,
  Radio,
  Clock,
  CheckCircle2,
  Server,
  Laptop,
  Search,
  RotateCcw,
  ArrowRight,
  Info,
  Terminal,
  Check,
} from 'lucide-react';
import type {
  AuthSession,
  CorporateDocument,
  InternalCanaryIncident,
  InternalCanaryToken,
} from '../types';
import { internalCanaryService } from '../services/internalCanaryService';
import { documentRepositoryService } from '../services/documentRepositoryService';
import { getAuditLogs, authService, type AuditLogEntry } from '../services/authService';

const INVESTIGATED_INCIDENTS_KEY = 'secureshield_investigated_incident_ids';

function getInvestigatedIncidentIds(): string[] {
  try {
    const raw = localStorage.getItem(INVESTIGATED_INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInvestigatedIncidentIds(ids: string[]): void {
  try {
    localStorage.setItem(INVESTIGATED_INCIDENTS_KEY, JSON.stringify(ids));
  } catch {
    // storage quota / unavailable
  }
}

interface SecurityOverviewProps {
  session: AuthSession;
  onNavigateTab: (tab: 'stats' | 'users' | 'audit' | 'threats' | 'email-safety' | 'message-checker' | 'canary-soc') => void;
  onRefreshAuditLogs?: () => void;
}

interface TimelineItem {
  id: string;
  source: 'canary' | 'audit';
  timestamp: string;
  title: string;
  description: string;
  eventType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  isServerVerified: boolean;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  resourceName?: string;
  isInvestigated?: boolean;
  canaryIncidentId?: string;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  session,
  onNavigateTab,
  onRefreshAuditLogs,
}) => {
  const [documents, setDocuments] = useState<CorporateDocument[]>([]);
  const [tokens, setTokens] = useState<InternalCanaryToken[]>([]);
  const [incidents, setIncidents] = useState<InternalCanaryIncident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [investigatedIds, setInvestigatedIds] = useState<string[]>(() => getInvestigatedIncidentIds());
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'PENDING' | 'SERVER' | 'SANDBOX'>('ALL');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isSupabaseLive = internalCanaryService.isSupabasePersistenceActive();
  const systemStats = authService.getSystemStats();

  const reloadData = async () => {
    setDocuments(documentRepositoryService.getDocuments());
    setAuditLogs(getAuditLogs());
    if (onRefreshAuditLogs) {
      onRefreshAuditLogs();
    }

    try {
      const [fetchedTokens, fetchedIncidents] = await Promise.all([
        internalCanaryService.fetchTokens(),
        internalCanaryService.fetchIncidents(),
      ]);
      setTokens(fetchedTokens);
      setIncidents(fetchedIncidents);
    } catch {
      setTokens(internalCanaryService.getTokens());
      setIncidents(internalCanaryService.getIncidents());
    }
  };

  useEffect(() => {
    void reloadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle investigated state for an incident
  const handleToggleInvestigated = (incidentId: string) => {
    setInvestigatedIds((prev) => {
      let next: string[];
      if (prev.includes(incidentId)) {
        next = prev.filter((id) => id !== incidentId);
        showToast(`Incident marked as Awaiting Investigation.`);
      } else {
        next = [...prev, incidentId];
        showToast(`Incident marked as Investigated / Triage Complete.`);
      }
      saveInvestigatedIncidentIds(next);
      return next;
    });
  };

  // Summary Metrics calculations
  const monitoredFilesCount = useMemo(() => {
    return documents.filter((doc) => doc.isMonitored).length;
  }, [documents]);

  const activeTokensCount = useMemo(() => {
    return tokens.filter((token) => token.enabled).length;
  }, [tokens]);

  const serverIncidentsCount = useMemo(() => {
    return incidents.filter((inc) => inc.origin === 'server').length;
  }, [incidents]);

  const sandboxIncidentsCount = useMemo(() => {
    return incidents.filter((inc) => inc.origin === 'sandbox').length;
  }, [incidents]);

  const awaitingInvestigationIncidents = useMemo(() => {
    return incidents.filter((inc) => !investigatedIds.includes(inc.id));
  }, [incidents, investigatedIds]);

  // Build unified chronological activity timeline
  const timelineItems = useMemo(() => {
    const canaryItems: TimelineItem[] = incidents.map((inc) => ({
      id: `canary_${inc.id}`,
      source: 'canary',
      timestamp: inc.timestamp,
      title: inc.tokenName,
      description: inc.summary,
      eventType: inc.eventType || 'CANARY_TRIPWIRE',
      severity: inc.severity,
      isServerVerified: inc.origin === 'server',
      userEmail: inc.userContext?.email,
      userName: inc.userContext?.username,
      userRole: inc.userContext?.role,
      resourceName: inc.resourceName || inc.resourceDescription,
      isInvestigated: investigatedIds.includes(inc.id),
      canaryIncidentId: inc.id,
    }));

    const auditItems: TimelineItem[] = auditLogs.map((log) => {
      const isFailed = log.status === 'FAILED';
      const isWarning = log.status === 'WARNING';
      const severity: TimelineItem['severity'] = isFailed ? 'HIGH' : isWarning ? 'MEDIUM' : 'INFO';
      const isServerVerified = isSupabaseLive && !log.description.includes('Sandbox') && !log.description.includes('SIMULATION');

      return {
        id: `audit_${log.id}`,
        source: 'audit',
        timestamp: log.timestamp,
        title: log.eventType.replace(/_/g, ' '),
        description: log.description,
        eventType: log.eventType,
        severity,
        isServerVerified,
        userEmail: log.userId,
      };
    });

    const combined = [...canaryItems, ...auditItems];
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined;
  }, [incidents, auditLogs, investigatedIds, isSupabaseLive]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    return timelineItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        item.eventType.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(timelineSearch.toLowerCase())) ||
        (item.resourceName && item.resourceName.toLowerCase().includes(timelineSearch.toLowerCase()));

      let matchesFilter = true;
      if (timelineFilter === 'PENDING') {
        matchesFilter = item.source === 'canary' && !item.isInvestigated;
      } else if (timelineFilter === 'SERVER') {
        matchesFilter = item.isServerVerified;
      } else if (timelineFilter === 'SANDBOX') {
        matchesFilter = !item.isServerVerified;
      }

      return matchesSearch && matchesFilter;
    });
  }, [timelineItems, timelineSearch, timelineFilter]);

  const getSeverityBadge = (severity: TimelineItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">INFO</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 text-left">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Executive Security Posture Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                ENTERPRISE SECURITY OVERVIEW
              </span>

              {isSupabaseLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <Server className="w-3.5 h-3.5 text-emerald-500" />
                  POSTGRESQL BACKEND LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  LOCAL SANDBOX MODE
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              Threat Deception & Defense Posture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Consolidated security telemetry integrating active document tripwires, canary honeypots, zero-trust authentication logs, and threat incident investigations.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
              <span>Admin: {session.user.email}</span>
              {session.user.department && (
                <>
                  <span>•</span>
                  <span>Unit: {session.user.department}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('canary-soc')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Canary SOC</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Logs</span>
            </button>

            <button
              type="button"
              onClick={reloadData}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              title="Refresh security overview telemetry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monitored Files */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total Monitored Files
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
            {monitoredFilesCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{documents.length} repository files armed</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bait Vault Active</span>
          </div>
        </div>

        {/* Card 2: Active Canary Tokens */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Active Canary Tokens
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-1">
            {activeTokensCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{tokens.length} total decoys deployed</span>
            <span className="text-teal-600 dark:text-teal-400 font-medium">Listening</span>
          </div>
        </div>

        {/* Card 3: Total Recorded Incidents */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total Recorded Incidents
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
            {incidents.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              {serverIncidentsCount} Server • {sandboxIncidentsCount} Sandbox
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium font-mono text-[10px]">
              Audit Stored
            </span>
          </div>
        </div>

        {/* Card 4: Incidents Awaiting Investigation */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Awaiting Investigation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold font-mono mt-1 ${
              awaitingInvestigationIncidents.length > 0
                ? 'text-amber-500 animate-pulse'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {awaitingInvestigationIncidents.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              {awaitingInvestigationIncidents.length > 0 ? 'Requires analyst review' : 'All queues triaged'}
            </span>
            {awaitingInvestigationIncidents.length > 0 ? (
              <button
                type="button"
                onClick={() => setTimelineFilter('PENDING')}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Filter List
              </button>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cleared</span>
            )}
          </div>
        </div>
      </div>

      {/* Zero Trust & Threat Posture Telemetry Strip */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">System Threat Alert:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                systemStats.threatLevel === 'HIGH'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : systemStats.threatLevel === 'ELEVATED'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {systemStats.threatLevel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Visual MFA Adoption:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {systemStats.mfaAdoptionRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Intercepted Anomalies:</span>
            <span className="font-mono font-bold text-amber-500">
              {systemStats.totalFailedAttempts}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={() => onNavigateTab('stats')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <span>View Sector Statistics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 2: RECENT ACTIVITY TIMELINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Security Activity Timeline
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {filteredTimeline.length} events
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time chronological events from canary tripwires and system security audit logs.
            </p>
          </div>

          {/* Timeline Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search event, user, file..."
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTimelineFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  timelineFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('PENDING')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  timelineFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Awaiting Review ({awaitingInvestigationIncidents.length})
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('SERVER')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  timelineFilter === 'SERVER'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Server Events
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter('SANDBOX')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  timelineFilter === 'SANDBOX'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sandbox/Simulated
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Transparency Notice */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 shadow-sm">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-indigo-950 dark:text-indigo-100">Telemetry Distinction & Scope:</strong>{' '}
            Events tagged <strong className="text-emerald-700 dark:text-emerald-400 font-mono">[GENUINE SERVER EVENT]</strong> are verified and persisted via Supabase PostgreSQL. Events tagged <strong className="text-amber-700 dark:text-amber-400 font-mono">[SANDBOX / SIMULATED EVENT]</strong> represent safe local security testing drills or browser memory operations; they are not real external attacks.
          </div>
        </div>

        {/* Timeline Event Feed */}
        {filteredTimeline.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6 stroke-[1.7]" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching activity records found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {timelineFilter === 'PENDING'
                ? 'Great news! There are no unresolved incidents awaiting investigation.'
                : 'Try adjusting your search query or filter criteria above.'}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredTimeline.map((item) => (
              <div
                key={item.id}
                className="relative p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
              >
                {/* Timeline Node Dot */}
                <span
                  className={`absolute -left-[27px] sm:-left-[35px] top-4.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-navy-900 shrink-0 ${
                    item.severity === 'CRITICAL'
                      ? 'bg-rose-500 ring-4 ring-rose-500/20'
                      : item.severity === 'HIGH'
                      ? 'bg-amber-500 ring-4 ring-amber-500/20'
                      : item.source === 'canary'
                      ? 'bg-teal-500 ring-4 ring-teal-500/20'
                      : 'bg-indigo-500 ring-4 ring-indigo-500/20'
                  }`}
                />

                <div className="space-y-1.5 flex-1">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(item.severity)}

                    {/* Server vs Sandbox Distinction */}
                    {item.isServerVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <Server className="w-3 h-3 text-emerald-500" />
                        GENUINE SERVER EVENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Laptop className="w-3 h-3 text-amber-500" />
                        SANDBOX / SIMULATED EVENT
                      </span>
                    )}

                    {/* Source / Module */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 font-semibold">
                      {item.source === 'canary' ? 'CANARY TRIPWIRE' : 'SECURITY AUDIT'}
                    </span>

                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {item.description}
                  </div>

                  {/* Context Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                    {item.resourceName && (
                      <span>
                        Resource: <strong className="text-slate-700 dark:text-slate-300">{item.resourceName}</strong>
                      </span>
                    )}
                    {item.userEmail && (
                      <>
                        <span>•</span>
                        <span>Operator: {item.userName || item.userEmail}</span>
                      </>
                    )}
                    {item.userRole && (
                      <>
                        <span>•</span>
                        <span className="uppercase text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {item.userRole}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Timestamp & Investigation Controls */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Canary Incident Investigation Toggle */}
                  {item.canaryIncidentId && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.isInvestigated ? (
                        <button
                          type="button"
                          onClick={() => handleToggleInvestigated(item.canaryIncidentId!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                          title="Click to reopen investigation"
                        >
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Investigated</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleInvestigated(item.canaryIncidentId!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                          title="Click to mark this incident investigated"
                        >
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Mark Investigated</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
