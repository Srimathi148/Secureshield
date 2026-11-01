import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldAlert,
  FileCode,
  Globe,
  Database,
  Key,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  Terminal,
  Files,
  Folder,
  Server,
  Laptop,
  UploadCloud,
  Info,
} from 'lucide-react';
import type {
  InternalCanaryToken,
  InternalCanaryIncident,
  InternalCanaryTokenType,
  InternalCanarySeverity,
  CorporateDocument,
  AuthSession,
} from '../types';
import { internalCanaryService } from '../services/internalCanaryService';
import { documentRepositoryService } from '../services/documentRepositoryService';

interface InternalCanarySOCProps {
  session: AuthSession;
  onRefreshAuditLogs?: () => void;
}

export const InternalCanarySOC: React.FC<InternalCanarySOCProps> = ({
  session,
  onRefreshAuditLogs,
}) => {
  const [tokens, setTokens] = useState<InternalCanaryToken[]>([]);
  const [incidents, setIncidents] = useState<InternalCanaryIncident[]>([]);
  const [repoDocuments, setRepoDocuments] = useState<CorporateDocument[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'alert' | 'info'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedDecoyId, setRevealedDecoyId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSupabaseLive = internalCanaryService.isSupabasePersistenceActive();

  // New token modal / form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenType, setNewTokenType] = useState<InternalCanaryTokenType>('file');
  const [newTokenTarget, setNewTokenTarget] = useState('');
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [newTokenDecoy, setNewTokenDecoy] = useState('');

  // Plant Document Modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docDepartment, setDocDepartment] = useState('Finance');
  const [docType, setDocType] = useState('');

  // Load tokens, incidents, & documents asynchronously from Supabase or Sandbox cache
  const reloadData = async () => {
    try {
      const [fetchedTokens, fetchedIncidents] = await Promise.all([
        internalCanaryService.fetchTokens(),
        internalCanaryService.fetchIncidents(),
      ]);
      setTokens(fetchedTokens);
      setIncidents(fetchedIncidents);
      setRepoDocuments(documentRepositoryService.getDocuments());
    } catch {
      setTokens(internalCanaryService.getTokens());
      setIncidents(internalCanaryService.getIncidents());
      setRepoDocuments(documentRepositoryService.getDocuments());
    }
  };

  useEffect(() => {
    void reloadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Toggle enable/disable
  const handleToggleToken = async (token: InternalCanaryToken) => {
    if (token.enabled) {
      internalCanaryService.disableToken(token.id);
      showToast(`Decoy token '${token.name}' disabled. Trips will not trigger alarms.`, 'info');
    } else {
      internalCanaryService.enableToken(token.id);
      showToast(`Decoy token '${token.name}' enabled and monitoring for intrusion.`, 'success');
    }
    await reloadData();
  };

  // Simulate trigger with real backend execution or sandbox fallback
  const handleSimulateTrigger = async (token: InternalCanaryToken) => {
    if (!token.enabled) {
      showToast(`Cannot trip disabled token '${token.name}'. Enable it first.`, 'alert');
      return;
    }

    const incident = await internalCanaryService.triggerToken({
      tokenId: token.id,
      eventType: 'SIMULATED_TEST_TRIGGER',
      resourceName: token.targetResource,
      severity: 'HIGH',
      userContext: {
        userId: session.user.id,
        email: session.user.email,
        username: session.user.username || session.user.fullName,
        role: session.user.role,
        action: 'SIMULATED_DECOY_ACCESS',
        channel: 'Admin SOC Terminal',
      },
      summary: `Test tripwire activated for decoy [${token.targetResource}]. Immediate alert dispatched.`,
    });

    if (incident) {
      const originTag = incident.origin === 'server' ? 'SUPABASE POSTGRESQL' : 'SANDBOX SIMULATION';
      showToast(`🚨 CANARY TRIPWIRE DETECTED: Incident ${incident.id} registered [${originTag}]!`, 'alert');
      await reloadData();
      if (onRefreshAuditLogs) {
        onRefreshAuditLogs();
      }
    }
  };

  // Synchronize local tokens to Supabase table
  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await internalCanaryService.syncTokensToSupabase();
      if (res.error) {
        showToast(`Sync error: ${res.error}`, 'alert');
      } else {
        showToast(`Successfully synchronized ${res.count} decoy definitions to Supabase table!`, 'success');
        await reloadData();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset tokens
  const handleResetTokens = async () => {
    internalCanaryService.resetTestTokens();
    await reloadData();
    showToast('Reset all test Canary Tokens to baseline defaults with 0 trip counts.', 'info');
    if (onRefreshAuditLogs) onRefreshAuditLogs();
  };

  // Clear incidents
  const handleClearIncidents = async () => {
    await internalCanaryService.clearIncidents();
    await reloadData();
    showToast('Cleared recorded incident history.', 'info');
  };

  // Copy decoy data
  const handleCopyDecoy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied decoy data payload to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete token
  const handleDeleteToken = (id: string) => {
    internalCanaryService.deleteToken(id);
    reloadData();
    showToast('Canary Token deleted.', 'info');
  };

  // Create new token
  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim() || !newTokenTarget.trim() || !newTokenDescription.trim()) {
      showToast('Please fill in token name, target resource, and description.', 'alert');
      return;
    }

    internalCanaryService.createToken({
      name: newTokenName.trim(),
      type: newTokenType,
      targetResource: newTokenTarget.trim(),
      resourceDescription: newTokenDescription.trim(),
      decoyData: newTokenDecoy.trim() || `# SIMULATED DECOY: ${newTokenTarget.trim()}\n# NON-OPERATIONAL DEMO PAYLOAD`,
      metadata: {
        creator: session.user.email,
        createdVia: 'Admin SOC Console',
      },
    });

    setNewTokenName('');
    setNewTokenTarget('');
    setNewTokenDescription('');
    setNewTokenDecoy('');
    setShowCreateModal(false);
    reloadData();
    showToast('New Canary Token deployed successfully.', 'success');
  };

  // Plant Document into User Repository
  const handlePlantDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) {
      showToast('Please provide both file name and file content.', 'alert');
      return;
    }

    documentRepositoryService.addDocument({
      name: docName.trim(),
      content: docContent,
      department: docDepartment,
      type: docType.trim() || undefined,
      isMonitored: true,
    });

    setDocName('');
    setDocContent('');
    setDocType('');
    setShowDocModal(false);
    reloadData();
    showToast(`Planted bait document '${docName.trim()}' into Corporate Document Repository.`, 'success');
  };

  const handleDeleteDocument = (id: string, name: string) => {
    documentRepositoryService.deleteDocument(id);
    reloadData();
    showToast(`Document '${name}' removed from repository.`, 'info');
  };

  const applyDocPreset = (preset: 'salary' | 'aws' | 'financial' | 'db') => {
    switch (preset) {
      case 'salary':
        setDocName('Q3_Executive_Compensation_Plan.xlsx');
        setDocDepartment('Executive');
        setDocType('Excel Spreadsheet');
        setDocContent('CONFIDENTIAL - EXECUTIVE BOARD REVIEW ONLY\n\nEmployee ID, Full Name, Title, Base Salary, Bonus Allocation\nEXEC-001, John Doe, CEO, $450,000, 35%\nEXEC-002, Jane Smith, CTO, $380,000, 30%\nEXEC-003, Alex Taylor, CFO, $390,000, 30%\n\nNote: Strictly restricted distribution.');
        break;
      case 'aws':
        setDocName('AWS_Production_Keys_Backup.env');
        setDocDepartment('Engineering');
        setDocType('Configuration File');
        setDocContent('# INTERNAL CORPORATE BACKUP - DO NOT SHARE\nAWS_REGION=us-east-1\nAWS_ACCESS_KEY_ID=AKIA_SIMULATED_DEMO_KEY_NOT_REAL\nAWS_SECRET_ACCESS_KEY=DEMO_SECRET_NOT_A_REAL_CREDENTIAL\nS3_BUCKET_NAME=corp-secureshield-prod-backups');
        break;
      case 'financial':
        setDocName('FY2026_Strategic_Forecast.pdf');
        setDocDepartment('Finance');
        setDocType('PDF Document');
        setDocContent('SecureShield Technologies - FY2026 Strategic Financial Forecast\n\n1. Executive Summary:\nProjected Enterprise ARR growth: +142%\nProjected CapEx: $12.4M\nAnticipated M&A Transactions: Confidential Project Titan\n\nApproved by Office of the CFO.');
        break;
      case 'db':
        setDocName('Customer_DB_Migration_Schema.sql');
        setDocDepartment('Operations');
        setDocType('Database SQL Script');
        setDocContent('-- Internal DB Migration Script\n-- WARNING: Contains production schema mappings\nCREATE DATABASE IF NOT EXISTS secureshield_customers;\n-- Connection String: postgresql://readonly_demo:synthetic_pw_123@10.0.4.15:5432/customers_db\nSELECT * FROM enterprise_accounts LIMIT 100;');
        break;
    }
  };

  // Preset generator for rapid deployment
  const applyPreset = (preset: 'aws' | 'url' | 'sql' | 'apikey') => {
    switch (preset) {
      case 'aws':
        setNewTokenName('Simulated S3 Backup Credentials');
        setNewTokenType('file');
        setNewTokenTarget('.aws/credentials');
        setNewTokenDescription('Bait AWS credentials file in root directory');
        setNewTokenDecoy('[default]\naws_access_key_id = AKIA_SIMULATED_TEST_KEY\naws_secret_access_key = DEMO_SECRET_NOT_OPERATIONAL');
        break;
      case 'url':
        setNewTokenName('Internal Secrets Wiki Route');
        setNewTokenType('url');
        setNewTokenTarget('/internal/engineering-secrets');
        setNewTokenDescription('Hidden hyperlink in internal staff documentation');
        setNewTokenDecoy('https://secureshield.internal.corp/trap/engineering-secrets');
        break;
      case 'sql':
        setNewTokenName('Core Financial DB Connection');
        setNewTokenType('credential');
        setNewTokenTarget('DB_FINANCIAL_CONNECTION_URI');
        setNewTokenDescription('Simulated production database connection string');
        setNewTokenDecoy('postgres://canary_user:fake_password_not_real@internal-db:5432/finance_ledger');
        break;
      case 'apikey':
        setNewTokenName('Master Stripe Webhook Secret');
        setNewTokenType('credential');
        setNewTokenTarget('STRIPE_WEBHOOK_SECRET');
        setNewTokenDescription('Fake Stripe webhook key placed in sample repository');
        setNewTokenDecoy('whsec_simulated_decoy_not_a_real_key_secureshield');
        break;
    }
  };

  const totalTrips = tokens.reduce((sum, t) => sum + (t.tripCount || 0), 0);
  const activeCount = tokens.filter((t) => t.enabled).length;

  const getTypeBadge = (type: InternalCanaryTokenType) => {
    switch (type) {
      case 'file':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <FileCode className="w-3 h-3" />
            File Bait
          </span>
        );
      case 'url':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Globe className="w-3 h-3" />
            URL Trap
          </span>
        );
      case 'credential':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Key className="w-3 h-3" />
            Decoy Credential
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Database className="w-3 h-3" />
            Custom Decoy
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: InternalCanarySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 text-left">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-lg transition-all animate-in fade-in-50 ${
            notification.type === 'alert'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : notification.type === 'info'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
              : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'alert' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : notification.type === 'info' ? (
              <Radio className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                ACTIVE DECEPTION GRID
              </span>
              {isSupabaseLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <Server className="w-3 h-3 text-emerald-500" />
                  SUPABASE POSTGRESQL BACKEND LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Laptop className="w-3 h-3 text-slate-400" />
                  LOCAL ENTERPRISE SANDBOX MODE
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              Internal Canary Tokens & Intrusion Tripwires
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Deploy simulated honeypot files, decoy credentials, and trap URLs across internal systems.
              When an unauthorized party attempts to read or execute a decoy, an autonomous incident is recorded server-side and dispatched to audit telemetry.
            </p>
          </div>

          {/* Quick Control Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isSupabaseLive && (
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                title="Synchronize all local decoy definitions into the Supabase internal_canary_tokens table"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync to Supabase'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Files className="w-4 h-4" />
              <span>Plant Document Bait</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Custom Token</span>
            </button>

            <button
              type="button"
              onClick={handleResetTokens}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Reset Canary Tokens"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Configured Decoys</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {tokens.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Simulated targets</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Active Traps</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeCount}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Armed and listening</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Tripped Intrusions</div>
            <div
              className={`text-2xl font-bold font-mono mt-0.5 ${
                totalTrips > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {totalTrips}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {totalTrips > 0 ? 'Threat detected' : 'Zero breaches'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Total Incidents</div>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {incidents.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">In SOC telemetry</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Server Verified</div>
            <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1.5">
              <span>{incidents.filter((i) => i.origin === 'server').length}</span>
              <Server className="w-4 h-4 text-teal-500 inline" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">PostgreSQL audit rows</div>
          </div>
        </div>
      </div>

      {/* SECTION 0: CORPORATE DOCUMENT VAULT BAITS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Files className="w-4 h-4 text-teal-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Corporate Document Vault Baits ({repoDocuments.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Files planted in the user-facing repository. Normal users can preview and download them without suspecting deception.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDocModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plant New Document</span>
          </button>
        </div>

        {repoDocuments.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Folder className="w-5 h-5 stroke-[1.6]" />
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Document Baits Currently Planted
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Click 'Plant New Document' to publish files that will appear in the standard user's document repository.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {repoDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {doc.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {doc.department}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5 truncate" title={doc.name}>
                    {doc.name}
                  </h5>

                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {doc.content.slice(0, 100)}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">{doc.size}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (doc.canaryTokenId) {
                          const token = tokens.find((t) => t.id === doc.canaryTokenId);
                          if (token) handleSimulateTrigger(token);
                        }
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      title="Test trip this document bait"
                    >
                      Simulate Trip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: CONFIGURED CANARY DECOYS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Deployed Canary Tokens ({tokens.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click 'Simulate Trip' to test trigger detection
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => {
            const isTripped = token.tripCount > 0;
            const isRevealed = revealedDecoyId === token.id;

            return (
              <div
                key={token.id}
                className={`p-5 rounded-2xl bg-white dark:bg-navy-900 border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden ${
                  !token.enabled
                    ? 'border-slate-200 dark:border-slate-800 opacity-60'
                    : isTripped
                    ? 'border-rose-500/40 dark:border-rose-500/30 shadow-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div>
                  {/* Top Bar with Type Badge & Status Toggle */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      {getTypeBadge(token.type)}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {token.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleToken(token)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        token.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                      title={token.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {token.enabled ? 'ARMED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Target Resource & Description */}
                  <div className="mt-3 space-y-1.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{token.targetResource}</span>
                      <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {token.resourceDescription}
                    </p>
                  </div>

                  {/* Decoy Data Preview Toggle */}
                  {token.decoyData && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setRevealedDecoyId(isRevealed ? null : token.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isRevealed ? 'Hide Decoy Payload' : 'View Decoy Payload'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyDecoy(token.id, token.decoyData || '')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                          title="Copy decoy text to clipboard"
                        >
                          {copiedId === token.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>

                      {isRevealed && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-28 border border-slate-800">
                          <pre className="whitespace-pre-wrap">{token.decoyData}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trip Statistics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Total Trips:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        isTripped
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {token.tripCount} {token.tripCount === 1 ? 'trip' : 'trips'}
                    </span>
                  </div>
                  {token.lastTriggeredAt && (
                    <div className="text-[10px] font-mono text-slate-400 text-right mt-1">
                      Last: {new Date(token.lastTriggeredAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Simulate Trigger & Delete */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateTrigger(token)}
                    disabled={!token.enabled}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      token.enabled
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                    title="Simulate accessing or executing this decoy to test tripwire alert"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate Trip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteToken(token.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete token"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: INCIDENT DETECTION & AUDIT FEED */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Canary Threat Incident Telemetry ({incidents.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Autonomous security events captured server-side whenever an active decoy asset is accessed.
            </p>
          </div>

          {incidents.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearIncidents}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Incidents
              </button>
              <button
                type="button"
                onClick={reloadData}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh incident telemetry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Monitoring Boundary & Tripwire Detection Disclosure */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 shadow-sm">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-indigo-950 dark:text-indigo-100">Intrusion Detection Gateway Policy:</strong>{' '}
            Decoy document events are captured in real-time at the repository request boundary (when an operator requests a Preview or Download). Note: Files opened offline outside this secure web application cannot be monitored unless embedded active network beacons or host agents are present.
          </div>
        </div>

        {incidents.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Radio className="w-6 h-6 stroke-[1.7]" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Intrusion Incidents Recorded Yet
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All tripwires are armed. Click <strong className="text-rose-500">'Simulate Trip'</strong> on any token card above to test how the detection engine captures and registers the event.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    {incident.origin === 'server' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <Server className="w-3 h-3 text-emerald-500" />
                        SUPABASE SERVER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Laptop className="w-3 h-3 text-amber-500" />
                        SANDBOX SIMULATION
                      </span>
                    )}
                    {incident.eventType && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {incident.eventType}
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {incident.tokenName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {incident.id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {incident.summary}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Resource: <strong className="text-slate-700 dark:text-slate-300">{incident.resourceDescription}</strong></span>
                    {incident.userContext && (
                      <>
                        <span>•</span>
                        <span>User: {incident.userContext.username || incident.userContext.email || 'Anonymous'}</span>
                        <span>•</span>
                        <span>Channel: {incident.userContext.channel || 'Internal'}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {new Date(incident.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(incident.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE NEW TOKEN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Deploy Canary Decoy Token
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Rapid Preset Selector */}
            <div className="mt-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                ⚡ Quick Presets:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('aws')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  AWS Config
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('url')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Wiki Trap URL
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('sql')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  SQL Conn URI
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('apikey')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  API Key Decoy
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateToken} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Decoy Token Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Database Secrets Backup"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Token Type
                  </label>
                  <select
                    value={newTokenType}
                    onChange={(e) => setNewTokenType(e.target.value as InternalCanaryTokenType)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="file">File Decoy</option>
                    <option value="url">URL Trap</option>
                    <option value="credential">Decoy Credential</option>
                    <option value="custom">Custom Decoy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Resource Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS_SECRET_BACKUP.env"
                    value={newTokenTarget}
                    onChange={(e) => setNewTokenTarget(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bait configuration file placed in internal staff repository"
                  value={newTokenDescription}
                  onChange={(e) => setNewTokenDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Decoy Payload (Safe Synthetic Mock Content)
                </label>
                <textarea
                  rows={3}
                  placeholder="# Simulated safe mock content for the decoy..."
                  value={newTokenDecoy}
                  onChange={(e) => setNewTokenDecoy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Deploy Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLANT DOCUMENT BAIT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Files className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Plant Document Bait into Repository
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                ⚡ Quick Document Presets:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyDocPreset('salary')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Exec Salaries
                </button>
                <button
                  type="button"
                  onClick={() => applyDocPreset('aws')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  AWS Backup
                </button>
                <button
                  type="button"
                  onClick={() => applyDocPreset('financial')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Strategic PDF
                </button>
                <button
                  type="button"
                  onClick={() => applyDocPreset('db')}
                  className="px-2.5 py-1.5 rounded-xl text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  SQL Script
                </button>
              </div>
            </div>

            <form onSubmit={handlePlantDocument} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3_Executive_Compensation.xlsx or Database_Backup.sql"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={docDepartment}
                    onChange={(e) => setDocDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Type (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Word Document (or auto-detect)"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Content (Safe Simulated Payload)
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter the mock business document text or decoy data payload..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Plant Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
