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
} from 'lucide-react';
import {
  emailSafetyService,
  type EmailSafetyReport,
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
  const scannedEmailRef = React.useRef<string>(activeReport ? initialEmail : '');

  const performScan = async (targetEmail: string) => {
    const clean = targetEmail.trim();
    if (!clean || !clean.includes('@')) return;
    scannedEmailRef.current = clean;
    setIsScanning(true);
    try {
      const report = await emailSafetyService.checkEmail(clean);
      setActiveReport(report);
      // Automatically expand first breach if pwned
      if (report.breaches.length > 0) {
        setExpandedBreach(report.breaches[0].name);
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

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl text-left ${
        activeReport?.status === 'pwned'
          ? 'bg-white dark:bg-rose-950/20 border-rose-500/30 dark:border-rose-500/40 shadow-rose-950/10'
          : activeReport?.status === 'disposable'
          ? 'bg-white dark:bg-amber-950/20 border-amber-500/30 dark:border-amber-500/40 shadow-amber-950/10'
          : 'bg-white dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/40 shadow-emerald-950/10'
      } ${className}`}
    >
      {/* Top Banner Status Bar */}
      <div
        className={`p-6 sm:p-8 relative overflow-hidden transition-colors ${
          activeReport?.status === 'pwned'
            ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-white'
            : activeReport?.status === 'disposable'
            ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white'
            : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                activeReport?.status === 'pwned'
                  ? 'bg-rose-950/40 text-rose-200 border border-rose-400/30 animate-pulse'
                  : activeReport?.status === 'disposable'
                  ? 'bg-amber-950/40 text-amber-200 border border-amber-400/30'
                  : 'bg-emerald-950/40 text-emerald-200 border border-emerald-400/30'
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

            <div className="space-y-1">
              {activeReport?.source === 'live_network' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    Live Feed Verified
                  </span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                {isScanning
                  ? 'Scanning Breach Repositories...'
                  : activeReport?.headline || 'Have I Been Pwned Check'}
              </h2>

              <p className="text-xs sm:text-sm text-white/85 max-w-2xl font-normal leading-relaxed m-0">
                {isScanning
                  ? `Querying breach intelligence across 14+ billion leaked records for ${emailInput}...`
                  : activeReport?.subheadline || `Checking ${initialEmail} against known security breaches.`}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/25 hover:bg-black/40 text-white border border-white/20 transition-all backdrop-blur-sm disabled:opacity-50 shadow-sm"
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
            <div className="p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Data Breaches
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {activeReport.breachCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Pastes Detected
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {activeReport.pastesCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Identity Health
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {activeReport.isSafe ? '100% Safe' : activeReport.isDisposable ? 'Disposable' : 'Exposed'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                MFA Shield
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-1">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Body: Details, Breaches list, and Scanner Bar */}
      <div className="p-6 sm:p-7 space-y-6">
        {/* Interactive Search / Test Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                id="hibp-email-search-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Check any email address (e.g. test@gmail.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                required
              />
            </div>

            <button
              type="submit"
              id="hibp-scan-btn"
              disabled={isScanning || !emailInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyber-500 hover:bg-cyber-400 text-slate-950 shadow-sm transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Check Email</span>
            </button>
          </form>

          {/* Quick Test Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500">Quick Test:</span>
            <button
              type="button"
              onClick={() => handleQuickTest('test@gmail.com')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 transition-colors"
            >
              ⚠️ Known Breached Email (test@gmail.com)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('clean.security@secureshield.gov')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
            >
              🛡️ Clean Safe Email (clean.security@secureshield.gov)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('temporary@mailinator.com')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors"
            >
              🗑️ Burner Email (mailinator.com)
            </button>
          </div>
        </div>

        {/* SAFE RESULT DETAILS */}
        {activeReport?.isSafe && !isScanning && (
          <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Identity Verification Passed — No Leaks Found</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              The email address <strong className="font-mono text-slate-900 dark:text-slate-100">{activeReport.email}</strong> has
              not appeared in any documented enterprise database breaches, credential dumps, or Pastebin leaks.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Zero Trust Dual-Factor Graphical Authentication actively secures this portal.</span>
            </div>
          </div>
        )}

        {/* PWNED RESULT: LIST OF BREACHES */}
        {activeReport?.status === 'pwned' && !isScanning && activeReport.breaches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Compromised Breaches & Exposed Data ({activeReport.breaches.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Click any incident for incident breakdown
              </span>
            </div>

            <div className="space-y-3">
              {activeReport.breaches.slice(0, isCompact ? 3 : 8).map((breach) => {
                const isExpanded = expandedBreach === breach.name;
                return (
                  <div
                    key={breach.name}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-rose-400/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedBreach(isExpanded ? null : breach.name)}
                      className="w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        {breach.logoUrl ? (
                          <img
                            src={breach.logoUrl}
                            alt={breach.name}
                            className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0 border border-rose-500/20">
                            {breach.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {breach.name}
                            </span>
                            {breach.domain && (
                              <span className="text-[11px] font-mono text-slate-400">
                                ({breach.domain})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Breach Date: {breach.breachDate}
                            {breach.recordsCount ? ` • ${breach.recordsCount.toLocaleString()} records` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {breach.dataClasses.length} Data Types Leaked
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Expandable breach details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                          {breach.description}
                        </p>

                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                            Compromised Data Classes:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {breach.dataClasses.map((dc) => (
                              <span
                                key={dc}
                                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-medium"
                              >
                                {dc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeReport.breaches.length > (isCompact ? 3 : 8) && (
                <div className="text-center pt-2">
                  <span className="text-xs font-mono text-slate-400">
                    + {activeReport.breaches.length - (isCompact ? 3 : 8)} additional historical breaches found
                  </span>
                </div>
              )}
            </div>

            {/* Remediation Guide */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Zero Trust Security Recommendation</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc m-0">
                {activeReport.recommendedActions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
