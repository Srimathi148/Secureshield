import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  RefreshCw,
  Mail,
  Lock,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  emailSafetyService,
  type EmailSafetyReport,
  type EmailSafetyCategory,
} from '../services/emailSafetyService';

interface NormalUserEmailCheckerProps {
  initialEmail: string;
  autoScan?: boolean;
}

export const NormalUserEmailChecker: React.FC<NormalUserEmailCheckerProps> = ({
  initialEmail,
  autoScan = true,
}) => {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [activeReport, setActiveReport] = useState<EmailSafetyReport | null>(() =>
    emailSafetyService.getCached(initialEmail)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [expandedBreach, setExpandedBreach] = useState<string | null>(null);
  const scannedEmailRef = React.useRef<string>(activeReport ? initialEmail : '');

  const runScan = async (targetEmail: string) => {
    const clean = targetEmail.trim();
    if (!clean || !clean.includes('@')) return;
    scannedEmailRef.current = clean;
    setIsScanning(true);
    try {
      const report = await emailSafetyService.checkEmail(clean);
      setActiveReport(report);
      if (report.friendly?.friendlyBreaches && report.friendly.friendlyBreaches.length > 0) {
        setExpandedBreach(report.friendly.friendlyBreaches[0].websiteName);
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
      runScan(initialEmail);
    }
  }, [initialEmail, autoScan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runScan(emailInput);
  };

  const handleQuickTest = (testEmail: string) => {
    setEmailInput(testEmail);
    runScan(testEmail);
  };

  const friendly = activeReport?.friendly;
  const level: EmailSafetyCategory = friendly?.safetyLevel || 'safe';

  // Visual style mappings based on 3-tier status
  const themeStyles = {
    safe: {
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      heroBg: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
      barColor: 'bg-emerald-500',
      iconColor: 'text-emerald-500',
      cardGlow: 'shadow-emerald-500/5',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    suspicious: {
      border: 'border-amber-500/30 dark:border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      heroBg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent',
      barColor: 'bg-amber-500',
      iconColor: 'text-amber-500',
      cardGlow: 'shadow-amber-500/5',
      accentColor: 'text-amber-600 dark:text-amber-400',
    },
    dangerous: {
      border: 'border-rose-500/30 dark:border-rose-500/40',
      badgeBg: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30',
      heroBg: 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent',
      barColor: 'bg-rose-500',
      iconColor: 'text-rose-500',
      cardGlow: 'shadow-rose-500/5',
      accentColor: 'text-rose-600 dark:text-rose-400',
    },
  }[level];

  return (
    <div className="space-y-6 text-left">
      {/* Search Bar & Checker Tool */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 m-0">
              Check an Email Address
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
              Type any email address below to see if it is safe, suspicious, or involved in data leaks.
            </p>
          </div>

          {initialEmail && initialEmail !== emailInput && (
            <button
              type="button"
              onClick={() => {
                setEmailInput(initialEmail);
                runScan(initialEmail);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
            >
              <Mail className="w-3.5 h-3.5 text-cyber-500" />
              <span>Check My Account Email</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. friend@gmail.com, sender@company.com"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isScanning || !emailInput.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 text-slate-950 shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Check Safety</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Chips for Demo */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Quick examples:</span>
          <button
            type="button"
            onClick={() => handleQuickTest('clean.security@secureshield.gov')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer"
          >
            🟢 Safe Email
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('temp.user@mailinator.com')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
          >
            🟡 Suspicious Temporary Email
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('test@gmail.com')}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            🔴 Leaked Email (Past Breach)
          </button>
        </div>
      </div>

      {/* Loading State Animation */}
      {isScanning && (
        <div className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-4 animate-in fade-in-50">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
              Checking Email Safety...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
              Checking for known security issues, public leaks, and throwaway inbox warning signs.
            </p>
          </div>
        </div>
      )}

      {/* RESULT DISPLAY CARD */}
      {!isScanning && activeReport && friendly && (
        <div
          className={`rounded-3xl border bg-white dark:bg-navy-900 overflow-hidden shadow-xl transition-all duration-300 ${themeStyles.border} ${themeStyles.cardGlow}`}
        >
          {/* Main Status Header Banner */}
          <div className={`p-6 sm:p-8 ${themeStyles.heroBg} border-b border-slate-100 dark:border-slate-800/80`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Large Visual Icon */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    level === 'safe'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : level === 'suspicious'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}
                >
                  {level === 'safe' && <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />}
                  {level === 'suspicious' && <AlertTriangle className="w-8 h-8 stroke-[2.2]" />}
                  {level === 'dangerous' && <ShieldAlert className="w-8 h-8 stroke-[2.2]" />}
                </div>

                {/* Plain English Status Titles */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${themeStyles.badgeBg}`}
                    >
                      {level === 'safe' && 'Safe Email'}
                      {level === 'suspicious' && 'Suspicious Email'}
                      {level === 'dangerous' && 'Dangerous Email'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                      {activeReport.email}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 m-0">
                    {friendly.simpleHeadline}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed m-0">
                    {friendly.simpleSummary}
                  </p>
                </div>
              </div>

              {/* Refresh / Re-check Button */}
              <button
                type="button"
                onClick={() => runScan(activeReport.email)}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check</span>
              </button>
            </div>

            {/* Visual Safety Meter / Progress Bar */}
            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Overall Safety Rating:
                </span>
                <span className={`font-bold ${themeStyles.accentColor}`}>
                  {friendly.scoreLabel} ({friendly.safetyScore}/100)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${themeStyles.barColor}`}
                  style={{ width: `${friendly.safetyScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body Section with Reasons, Leaked Details, and Next Steps */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* WHY IS THIS EMAIL FLAGGED? */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 m-0">
                <Info className="w-4 h-4 text-teal-500" />
                <span>Why was this result given?</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {friendly.whyReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="mt-0.5 shrink-0">
                      {level === 'safe' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className={`w-4 h-4 ${themeStyles.iconColor}`} />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT WAS EXPOSED? (ONLY FOR DANGEROUS / LEAKED EMAILS) */}
            {level === 'dangerous' && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2 m-0">
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>What information was leaked?</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                      friendly.exposedItems.passwords
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <Lock className="w-5 h-5 mx-auto" />
                    <div className="text-xs font-bold">Passwords</div>
                    <div className="text-[10px]">
                      {friendly.exposedItems.passwords ? '⚠️ Stolen in leaks' : 'Not detected'}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                      friendly.exposedItems.personalInfo
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <User className="w-5 h-5 mx-auto" />
                    <div className="text-xs font-bold">Names & Usernames</div>
                    <div className="text-[10px]">
                      {friendly.exposedItems.personalInfo ? '⚠️ Exposed online' : 'Not detected'}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                      friendly.exposedItems.phoneNumbers
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <Phone className="w-5 h-5 mx-auto" />
                    <div className="text-xs font-bold">Phone Numbers</div>
                    <div className="text-[10px]">
                      {friendly.exposedItems.phoneNumbers ? '⚠️ Exposed online' : 'Not detected'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center space-y-1">
                    <ShieldCheck className="w-5 h-5 mx-auto" />
                    <div className="text-xs font-bold">SecureShield</div>
                    <div className="text-[10px]">Protected by Picture Key</div>
                  </div>
                </div>

                {/* List of Websites Where Leak Happened */}
                {friendly.friendlyBreaches.length > 0 && (
                  <div className="space-y-2 mt-3 pt-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Known websites where this email was exposed:
                    </span>
                    <div className="space-y-2">
                      {friendly.friendlyBreaches.map((breach) => {
                        const isOpen = expandedBreach === breach.websiteName;
                        return (
                          <div
                            key={breach.websiteName}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedBreach(isOpen ? null : breach.websiteName)}
                              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0">
                                  {breach.websiteName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {breach.websiteName}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Leak Date: {breach.year}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex flex-wrap gap-1">
                                  {breach.leakedItems.map((item) => (
                                    <span
                                      key={item}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 mt-1 leading-relaxed">
                                {breach.simpleDescription}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WHAT SHOULD YOU DO NEXT? ACTION PLAN */}
            <div className="p-5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 space-y-3">
              <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2 m-0">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>What should you do next?</span>
              </h4>

              <div className="space-y-2">
                {friendly.whatToDoRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5 leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
