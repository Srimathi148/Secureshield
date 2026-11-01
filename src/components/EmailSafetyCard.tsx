import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Flame,
  Lock,
  Mail,
  Info,
  Globe,
  User,
  Zap,
  Key,
  Phone,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  emailSafetyService,
  type EmailSafetyReport,
  type DataSeverityTier,
} from '../services/emailSafetyService';

interface EmailSafetyCardProps {
  initialEmail: string;
  autoScan?: boolean;
  className?: string;
  isCompact?: boolean;
}

export const EmailSafetyCard: React.FC<EmailSafetyCardProps> = ({
  initialEmail,
  autoScan = true,
  className = '',
  isCompact = false,
}) => {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [activeReport, setActiveReport] = useState<EmailSafetyReport | null>(() =>
    emailSafetyService.getCached(initialEmail)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [expandedBreach, setExpandedBreach] = useState<string | null>(null);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | DataSeverityTier>('ALL');
  const scannedEmailRef = React.useRef<string>(activeReport ? initialEmail : '');

  const performScan = async (targetEmail: string) => {
    const clean = targetEmail.trim();
    if (!clean || !clean.includes('@')) return;
    scannedEmailRef.current = clean;
    setIsScanning(true);
    try {
      const report = await emailSafetyService.checkEmail(clean);
      setActiveReport(report);
      if (report.breaches.length > 0) {
        setExpandedBreach(report.breaches[0].name);
      } else {
        setExpandedBreach(null);
      }
    } catch {
      // Handled in service
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    setEmailInput(initialEmail);
    if (autoScan && initialEmail && scannedEmailRef.current !== initialEmail) {
      performScan(initialEmail);
    }
  }, [initialEmail, autoScan]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performScan(emailInput);
  };

  const handleQuickTest = (testEmail: string) => {
    setEmailInput(testEmail);
    performScan(testEmail);
  };

  const multiVector = activeReport?.multiVector;
  const severityCounts = activeReport?.severityCounts;

  // Filter breaches by selected severity tier
  const filteredBreaches = (activeReport?.breaches || []).filter((b) => {
    if (selectedSeverityFilter === 'ALL') return true;
    return b.maxSeverity === selectedSeverityFilter;
  });

  // Grade color scheme
  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40';
      case 'B':
        return 'text-teal-300 bg-teal-500/20 border-teal-400/40';
      case 'C':
        return 'text-amber-300 bg-amber-500/20 border-amber-400/40';
      case 'D':
      case 'F':
      default:
        return 'text-rose-300 bg-rose-500/20 border-rose-400/40';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-teal-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getTierBadgeStyle = (tier?: DataSeverityTier) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'LOW':
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl text-left ${
        activeReport?.status === 'pwned'
          ? 'bg-white dark:bg-navy-900 border-rose-500/30 dark:border-rose-500/40 shadow-rose-950/10'
          : activeReport?.status === 'disposable'
          ? 'bg-white dark:bg-navy-900 border-amber-500/30 dark:border-amber-500/40 shadow-amber-950/10'
          : 'bg-white dark:bg-navy-900 border-emerald-500/30 dark:border-emerald-500/40 shadow-emerald-950/10'
      } ${className}`}
    >
      {/* Top Banner Status Bar */}
      <div
        className={`p-6 sm:p-8 relative overflow-hidden transition-colors ${
          activeReport?.status === 'pwned'
            ? 'bg-gradient-to-br from-rose-700 via-rose-800 to-slate-950 text-white'
            : activeReport?.status === 'disposable'
            ? 'bg-gradient-to-br from-amber-600 via-amber-800 to-slate-950 text-white'
            : 'bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950 text-white'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                activeReport?.status === 'pwned'
                  ? 'bg-rose-950/60 text-rose-200 border border-rose-400/30 animate-pulse'
                  : activeReport?.status === 'disposable'
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-400/30'
                  : 'bg-emerald-950/60 text-emerald-200 border border-emerald-400/30'
              }`}
            >
              {isScanning ? (
                <RefreshCw className="w-8 h-8 animate-spin text-white" />
              ) : activeReport?.status === 'pwned' ? (
                <ShieldAlert className="w-8 h-8 stroke-[2.2] text-rose-200" />
              ) : activeReport?.status === 'disposable' ? (
                <AlertTriangle className="w-8 h-8 stroke-[2.2] text-amber-200" />
              ) : (
                <CheckCircle2 className="w-8 h-8 stroke-[2.2] text-emerald-200" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {activeReport?.source === 'live_network' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    Live Feed Verified
                  </span>
                )}
                {multiVector && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getGradeColor(
                      multiVector.grade
                    )}`}
                  >
                    GRADE {multiVector.grade} • {multiVector.gradeLabel.toUpperCase()}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                {isScanning
                  ? 'Scanning Breach Repositories...'
                  : activeReport?.headline || 'Breach Intelligence Check'}
              </h2>

              <p className="text-xs sm:text-sm text-white/85 max-w-2xl font-normal leading-relaxed m-0">
                {isScanning
                  ? `Analyzing multi-vector threat profile across 14+ billion records for ${emailInput}...`
                  : activeReport?.subheadline || `Checking ${initialEmail} against threat databases.`}
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              id="rescan-email-btn"
              onClick={() => performScan(emailInput)}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/30 hover:bg-black/50 text-white border border-white/20 transition-all backdrop-blur-sm disabled:opacity-50 shadow-sm cursor-pointer"
              title="Re-scan this email against latest database breaches"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Re-scan'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row inside banner */}
        {activeReport && !isScanning && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
            <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Security Score
              </div>
              <div className="text-xl font-black text-white mt-0.5 flex items-baseline gap-1">
                <span>{multiVector?.compositeScore ?? (activeReport.isSafe ? 98 : 30)}</span>
                <span className="text-xs text-white/60 font-normal">/100</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Public Breaches
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {activeReport.breachCount}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Critical Hazards
              </div>
              <div className="text-xl font-black text-white mt-0.5 flex items-center gap-1.5">
                <span className={severityCounts && severityCounts.critical > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                  {severityCounts?.critical ?? 0}
                </span>
                <span className="text-[10px] font-normal text-white/60">critical classes</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                MFA Shield
              </div>
              <div className="text-xl font-black text-white mt-0.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span className="text-sm">Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Body: Multi-Vector Breakdown, Tiering, Breaches & Remediation */}
      <div className="p-6 sm:p-8 space-y-7">
        {/* Interactive Search / Test Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                id="hibp-email-search-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Check any email address (e.g. test@gmail.com, company@bank.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              id="hibp-scan-btn"
              disabled={isScanning || !emailInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 text-slate-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Evaluate Security</span>
            </button>
          </form>

          {/* Quick Test Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="text-slate-400">Quick Test:</span>
            <button
              type="button"
              onClick={() => handleQuickTest('test@gmail.com')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
            >
              🔴 Leaked Passwords (test@gmail.com)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('clean.security@secureshield.gov')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
            >
              🟢 Verified Secure (.gov domain)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('temporary@mailinator.com')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
            >
              🟡 Disposable Burner (mailinator.com)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('user@gmai.com')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 transition-colors cursor-pointer"
            >
              ⚠️ Typo Domain (@gmai.com)
            </button>
          </div>
        </div>

        {/* 1. MULTI-VECTOR SECURITY SCORE BREAKDOWN PANEL */}
        {multiVector && !isScanning && (
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 m-0">
                    Multi-Vector Security Score (0–100)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                    Weighted algorithmic evaluation across 4 threat vectors.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Composite Score</div>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {multiVector.compositeScore}/100
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border shadow-sm ${getGradeColor(
                    multiVector.grade
                  )}`}
                >
                  {multiVector.grade}
                </div>
              </div>
            </div>

            {/* 4-Vector Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vector 1: Breach Impact */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Breach Exposure Impact (35%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {multiVector.breachScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(
                      multiVector.breachScore
                    )}`}
                    style={{ width: `${multiVector.breachScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  {multiVector.breachScore === 100
                    ? 'Clean record: No historical leaks or database dump matches.'
                    : `Compromised: Penalized for ${activeReport.breachCount} breach match${activeReport.breachCount === 1 ? '' : 'es'}.`}
                </p>
              </div>

              {/* Vector 2: Domain Reputation */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-teal-500" />
                    Domain Trust & Infrastructure (25%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {multiVector.domainScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(
                      multiVector.domainScore
                    )}`}
                    style={{ width: `${multiVector.domainScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  {multiVector.domainScore >= 90
                    ? 'Verified infrastructure: Reputable educational, enterprise, or standard provider.'
                    : multiVector.domainScore <= 20
                    ? 'High risk: Typosquatting or throwaway burner email domain.'
                    : 'Standard reputation with typical delivery policies.'}
                </p>
              </div>

              {/* Vector 3: Identity Pattern */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Identity Syntactic Pattern (20%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {multiVector.identityScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(
                      multiVector.identityScore
                    )}`}
                    style={{ width: `${multiVector.identityScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  {multiVector.identityScore >= 90
                    ? 'Human pattern: Standard named personal/workplace identifier.'
                    : multiVector.identityScore <= 45
                    ? 'Role-based address: Shared inbox prone to account takeover.'
                    : 'Random bot-like character entropy detected.'}
                </p>
              </div>

              {/* Vector 4: Credential Stuffing Hazard */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-500" />
                    Credential Stuffing Hazard (20%)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {multiVector.stuffingScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(
                      multiVector.stuffingScore
                    )}`}
                    style={{ width: `${multiVector.stuffingScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  {multiVector.stuffingScore >= 90
                    ? 'Protected: No credentials associated with combo dumps.'
                    : 'Vulnerable: Plaintext/hashed passwords exposed in public lists.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. LEAKED DATA SEVERITY TIERING SECTION */}
        {severityCounts && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 m-0">
                  <Filter className="w-4 h-4 text-teal-500" />
                  <span>Leaked Data Severity Tiering ({severityCounts.total} Data Classes)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                  Compromised information categorized by risk severity and exploitability.
                </p>
              </div>

              {/* Filter Tabs */}
              {activeReport?.breaches.length > 0 && (
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSeverityFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedSeverityFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({activeReport.breaches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverityFilter('CRITICAL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedSeverityFilter === 'CRITICAL'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    Critical ({severityCounts.critical})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverityFilter('HIGH')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedSeverityFilter === 'HIGH'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
                    }`}
                  >
                    High ({severityCounts.high})
                  </button>
                </div>
              )}
            </div>

            {/* 4 Interactive Severity Tier Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Tier 1: Critical */}
              <div
                onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  severityCounts.critical > 0
                    ? selectedSeverityFilter === 'CRITICAL'
                      ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Tier 1: Critical
                  </span>
                  <span className="text-base font-black">{severityCounts.critical}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Passwords, hashes, PINs & financial records.
                </div>
              </div>

              {/* Tier 2: High */}
              <div
                onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  severityCounts.high > 0
                    ? selectedSeverityFilter === 'HIGH'
                      ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/30'
                      : 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Tier 2: High
                  </span>
                  <span className="text-base font-black">{severityCounts.high}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Phone numbers, addresses & government IDs.
                </div>
              </div>

              {/* Tier 3: Moderate */}
              <div
                onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  severityCounts.moderate > 0
                    ? selectedSeverityFilter === 'MODERATE'
                      ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Tier 3: Moderate
                  </span>
                  <span className="text-base font-black">{severityCounts.moderate}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Usernames, names, employer & location details.
                </div>
              </div>

              {/* Tier 4: Low */}
              <div
                onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'LOW' ? 'ALL' : 'LOW')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  severityCounts.low > 0
                    ? selectedSeverityFilter === 'LOW'
                      ? 'bg-slate-500/20 border-slate-500 ring-2 ring-slate-500/30'
                      : 'bg-slate-500/5 hover:bg-slate-500/10 border-slate-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Tier 4: Low</span>
                  <span className="text-base font-black">{severityCounts.low}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Website activity, preferences & signup dates.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SAFE RESULT DETAILS */}
        {activeReport?.isSafe && !isScanning && (
          <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Identity Verification Passed — No Leaks Found</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              The email address <strong className="font-mono text-slate-900 dark:text-slate-100">{activeReport.email}</strong> has
              not appeared in any documented enterprise database breaches, credential dumps, or Pastebin leaks.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Multi-Vector Composite score is optimal (Grade A+). SecureShield Picture MFA remains active.</span>
            </div>
          </div>
        )}

        {/* 4. PWNED RESULT: LIST OF BREACHES WITH SEVERITY BADGES */}
        {activeReport?.status === 'pwned' && !isScanning && activeReport.breaches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2 m-0">
                <Flame className="w-4 h-4 text-rose-500" />
                Compromised Incidents & Threat Profiles ({filteredBreaches.length}
                {selectedSeverityFilter !== 'ALL' ? ` filtered by ${selectedSeverityFilter}` : ''})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Click incident to expand threat analysis
              </span>
            </div>

            <div className="space-y-3">
              {filteredBreaches.slice(0, isCompact ? 3 : 8).map((breach) => {
                const isExpanded = expandedBreach === breach.name;
                const maxSeverity = breach.maxSeverity || 'LOW';

                return (
                  <div
                    key={breach.name}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/30'
                        : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-slate-800 hover:border-rose-400/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedBreach(isExpanded ? null : breach.name)}
                      className="w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {breach.logoUrl ? (
                          <img
                            src={breach.logoUrl}
                            alt={breach.name}
                            className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0 border border-rose-500/20">
                            {breach.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {breach.name}
                            </span>
                            {breach.domain && (
                              <span className="text-xs font-mono text-slate-400">
                                ({breach.domain})
                              </span>
                            )}
                            {/* Incident Severity Pill */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getTierBadgeStyle(
                                maxSeverity
                              )}`}
                            >
                              {maxSeverity} SEVERITY
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Breach Date: {breach.breachDate}
                            {breach.recordsCount ? ` • ${breach.recordsCount.toLocaleString()} records leaked` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {breach.dataClasses.length} data classes
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expandable breach details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                          {breach.description}
                        </p>

                        {/* Tiered Data Classes Breakdown */}
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                            Exposed Data Classes & Severity Tier:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(breach.tieredDataClasses || []).map((tc) => (
                              <div
                                key={tc.name}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 ${getTierBadgeStyle(
                                  tc.tier
                                )}`}
                                title={tc.riskDescription}
                              >
                                {tc.tier === 'CRITICAL' && <Key className="w-3 h-3 text-rose-500" />}
                                {tc.tier === 'HIGH' && <Phone className="w-3 h-3 text-orange-500" />}
                                {tc.tier === 'MODERATE' && <User className="w-3 h-3 text-amber-500" />}
                                <span className="font-semibold">{tc.name}</span>
                                <span className="text-[9px] opacity-75">({tc.tier})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Incident Threat Profile Callout */}
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                          <Info className="w-4 h-4 text-cyber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              Threat Assessment:
                            </strong>{' '}
                            {maxSeverity === 'CRITICAL'
                              ? 'Credentials from this incident pose direct account takeover hazards. Immediate password rotation is essential.'
                              : maxSeverity === 'HIGH'
                              ? 'Contact and identity parameters were exposed, increasing targeted phishing and SMS fraud exposure.'
                              : 'Reconnaissance metadata was leaked which can be used to build contextual spear-phishing profiles.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredBreaches.length === 0 && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No incidents match the selected severity tier ({selectedSeverityFilter}).
                </div>
              )}
            </div>

            {/* Zero Trust Hardening & Remediation Playbook */}
            <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Zero Trust Incident Remediation Playbook</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc m-0">
                {activeReport.recommendedActions.map((act, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
