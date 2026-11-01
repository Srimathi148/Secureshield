import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileWarning,
  Info,
  Link2,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  SAMPLE_DANGEROUS_MESSAGE,
  SAMPLE_SAFE_MESSAGE,
  SAMPLE_SUSPICIOUS_MESSAGE,
  emailMessageSafetyService,
  type EmailMessageReport,
  type MessageRiskLevel,
} from '../services/emailMessageSafetyService';

interface EmailMessageCheckerProps {
  variant?: 'user' | 'admin';
}

export const EmailMessageChecker: React.FC<EmailMessageCheckerProps> = ({
  variant = 'user',
}) => {
  const [rawMessage, setRawMessage] = useState('');
  const [report, setReport] = useState<EmailMessageReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showHeaders, setShowHeaders] = useState(variant === 'admin');

  const runScan = (source = rawMessage) => {
    const text = source.trim();
    if (!text) return;
    setIsScanning(true);
    window.setTimeout(() => {
      setReport(emailMessageSafetyService.analyze(text));
      setIsScanning(false);
    }, 280);
  };

  const loadSample = (sample: string) => {
    setRawMessage(sample);
    runScan(sample);
  };

  const level: MessageRiskLevel = report?.riskLevel || 'safe';
  const theme = {
    safe: {
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      heroBg: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
      barColor: 'bg-emerald-500',
      iconColor: 'text-emerald-500',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
    suspicious: {
      border: 'border-amber-500/30 dark:border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      heroBg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent',
      barColor: 'bg-amber-500',
      iconColor: 'text-amber-500',
      accentColor: 'text-amber-600 dark:text-amber-400',
    },
    dangerous: {
      border: 'border-rose-500/30 dark:border-rose-500/40',
      badgeBg: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30',
      heroBg: 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent',
      barColor: 'bg-rose-500',
      iconColor: 'text-rose-500',
      accentColor: 'text-rose-600 dark:text-rose-400',
    },
  }[level];

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 m-0">
            Check a Full Email Message
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
            Paste the entire email (From, Subject, and message body). We look for fake sender names,
            lookalike links, rush language, and risky attachments. This runs on your device — the
            message is not uploaded.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runScan();
          }}
          className="space-y-3"
        >
          <textarea
            value={rawMessage}
            onChange={(e) => setRawMessage(e.target.value)}
            placeholder={'From: Name <email@domain.com>\nSubject: ...\n\nPaste the full message here'}
            rows={10}
            className="w-full px-4 py-3 rounded-2xl text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner leading-relaxed"
            required
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 m-0">
              Tip: copy from your inbox including the sender line, not just the body.
            </p>
            <button
              type="submit"
              disabled={isScanning || !rawMessage.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 text-slate-950 shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking message...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check This Message</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Quick examples:</span>
          <button
            type="button"
            onClick={() => loadSample(SAMPLE_SAFE_MESSAGE)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer"
          >
            Safe workplace email
          </button>
          <button
            type="button"
            onClick={() => loadSample(SAMPLE_SUSPICIOUS_MESSAGE)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
          >
            Suspicious shortened link
          </button>
          <button
            type="button"
            onClick={() => loadSample(SAMPLE_DANGEROUS_MESSAGE)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            Fake PayPal phishing
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
              Reading the message...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
              Checking sender identity, links, wording, and attachments locally.
            </p>
          </div>
        </div>
      )}

      {!isScanning && report && (
        <div
          className={`rounded-3xl border bg-white dark:bg-navy-900 overflow-hidden shadow-xl ${theme.border}`}
        >
          <div className={`p-6 sm:p-8 ${theme.heroBg} border-b border-slate-100 dark:border-slate-800/80`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    level === 'safe'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : level === 'suspicious'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {level === 'safe' && <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />}
                  {level === 'suspicious' && <AlertTriangle className="w-8 h-8 stroke-[2.2]" />}
                  {level === 'dangerous' && <ShieldAlert className="w-8 h-8 stroke-[2.2]" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${theme.badgeBg}`}
                    >
                      {report.scoreLabel}
                    </span>
                    {report.parsed.fromEmail && (
                      <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                        {report.parsed.fromEmail}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 m-0">
                    {report.headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed m-0">
                    {report.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Message safety rating</span>
                <span className={`font-bold ${theme.accentColor}`}>
                  {report.scoreLabel} ({report.score}/100)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${theme.barColor}`}
                  style={{ width: `${report.score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400">Sender</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 break-all">
                  {report.parsed.fromDisplayName || 'Not provided'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5 break-all">
                  {report.parsed.fromEmail || 'No From address found'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400">Reply-To</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 break-all">
                  {report.parsed.replyToEmail || 'Same as sender / not found'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400">Subject</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1">
                  {report.parsed.subject || 'No subject line found'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 m-0">
                <Info className="w-4 h-4 text-teal-500" />
                <span>Why was this result given?</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {report.whyReasons.map((reason) => (
                  <div
                    key={reason}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                  >
                    {level === 'safe' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 ${theme.iconColor} mt-0.5 shrink-0`} />
                    )}
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {report.findings.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 m-0">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  <span>What we found</span>
                </h4>
                <div className="space-y-2">
                  {report.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-3.5 rounded-2xl border ${
                        finding.severity === 'critical'
                          ? 'bg-rose-500/5 border-rose-500/20'
                          : finding.severity === 'warning'
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {finding.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                            finding.severity === 'critical'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : finding.severity === 'warning'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-0 leading-relaxed">
                        {finding.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.links.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 m-0">
                  <Link2 className="w-4 h-4 text-teal-500" />
                  Links in this message
                </h4>
                <div className="space-y-2">
                  {report.links.map((link) => (
                    <div
                      key={link.url}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="text-xs font-mono text-slate-700 dark:text-slate-200 break-all">
                        {link.host}
                      </div>
                      <div className="text-[11px] text-slate-400 break-all mt-0.5">{link.url}</div>
                      {link.issues.map((issue) => (
                        <div key={issue} className="text-[11px] text-rose-600 dark:text-rose-300 mt-1">
                          {issue}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.attachments.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Files mentioned: {report.attachments.join(', ')}</span>
              </div>
            )}

            {variant === 'admin' && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHeaders((open) => !open)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 dark:bg-slate-950 cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    Parsed header details
                  </span>
                  {showHeaders ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {showHeaders && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    <div>From: {report.parsed.fromEmail || '—'}</div>
                    <div>Display: {report.parsed.fromDisplayName || '—'}</div>
                    <div>Reply-To: {report.parsed.replyToEmail || '—'}</div>
                    <div>Return-Path: {report.parsed.returnPath || '—'}</div>
                    <div className="sm:col-span-2">Subject: {report.parsed.subject || '—'}</div>
                    <div className="sm:col-span-2 text-slate-400">
                      Analyzed locally at {new Date(report.scannedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 space-y-3">
              <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2 m-0">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>What should you do next?</span>
              </h4>
              <div className="space-y-2">
                {report.whatToDo.map((step, idx) => (
                  <div key={step} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5 leading-relaxed">{step}</span>
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
