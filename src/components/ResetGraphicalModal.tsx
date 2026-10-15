import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  KeyRound,
  X,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { emailResetService, type EmailDispatchRecord } from '../services/emailResetService';
import { authService } from '../services/authService';

interface ResetGraphicalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onResetAuthorized: (email: string) => void;
}

export const ResetGraphicalModal: React.FC<ResetGraphicalModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onResetAuthorized,
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dispatchRecord, setDispatchRecord] = useState<EmailDispatchRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Sync state if defaultEmail changes externally
  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const matchedUser = authService.findUserByEmail(email);
  const isAdmin = email.trim().toLowerCase().includes('admin') || matchedUser?.role === 'admin';

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let targetEmail = email.trim();
    if (!targetEmail.includes('@')) {
      const resolved = authService.findUserByEmail(targetEmail);
      if (resolved?.email) {
        targetEmail = resolved.email;
        setEmail(resolved.email);
      } else {
        setErrorMsg('Please enter a valid workplace email address or registered username.');
        return;
      }
    }

    setIsSending(true);
    try {
      const res = await emailResetService.sendRecoveryEmail(targetEmail);
      if (res.success && res.dispatchRecord) {
        setDispatchRecord(res.dispatchRecord);
        setStep('verify');
      } else {
        setErrorMsg(res.error || 'Failed to dispatch recovery email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to email dispatcher.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || code.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit recovery code from your email.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await emailResetService.verifyRecoveryCode(email, code);
      if (res.success) {
        onResetAuthorized(email.trim().toLowerCase());
      } else {
        setErrorMsg(res.error || 'Invalid or expired recovery code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying recovery code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFillCode = () => {
    if (dispatchRecord) {
      setCode(dispatchRecord.code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in-50">
      <div className="w-full max-w-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
                Reset Visual MFA Key via Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Zero Trust Self-Service Identity Recovery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: REQUEST CODE */}
        {step === 'request' && (
          <form onSubmit={handleSendEmail} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              If you or an administrator cannot recall your 4 visual authentication icons or sequential pathway, we will transmit a single-use authorization code to your workplace email address.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workplace Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@secureshield.gov or user@bank.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verification Requirements:</span>
              </div>
              <div>• Single-use 6-digit numeric OTP generated</div>
              <div>• Code valid for 10 minutes</div>
              <div>• Resets failed intrusion attempt counters</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY CODE */}
        {step === 'verify' && (
          <div className="p-6 space-y-4">
            {/* For Admin: Show direct verification preview on dashboard */}
            {isAdmin ? (
              dispatchRecord && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Inbox className="w-4 h-4 text-indigo-500" />
                      <span>📬 Administrator Security Notification • Direct Console Verification</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">{dispatchRecord.timestamp}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] font-mono">
                      Subject: {dispatchRecord.subject}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                      Use this 6-digit authorization code to reset your visual authentication factor:
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700">
                      <span className="font-mono text-lg font-black tracking-widest text-amber-700 dark:text-amber-300">
                        {dispatchRecord.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(dispatchRecord.code)}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoFillCode}
                          className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-400"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* For Normal Users: Do NOT show code on dashboard! Sent through email inbox */
              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-slate-900 border border-teal-200 dark:border-teal-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>Security Verification Email Dispatched</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                  A visual MFA recovery verification email has been dispatched to:
                  <br />
                  <strong className="font-mono text-sm text-slate-900 dark:text-slate-100 inline-block mt-1">
                    {email}
                  </strong>
                </p>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-teal-100 dark:border-teal-900/60 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Inbox className="w-3.5 h-3.5 text-teal-500" />
                    <span>Two Simple Ways to Complete Verification:</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pl-1">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">1.</span>
                      <span><strong>Click Email Link:</strong> Click the verification link inside your email to automatically authorize and jump straight to choosing your new visual keys.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">2.</span>
                      <span><strong>Or Enter 6-Digit Code:</strong> If your email contains a 6-digit numeric code, enter it below.</span>
                    </div>
                  </div>
                </div>

                {/* Instant preview for demo/sandbox mode */}
                {dispatchRecord && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase">
                        Enterprise Sandbox Code:
                      </div>
                      <div className="font-mono text-lg font-black tracking-widest text-amber-700 dark:text-amber-300">
                        {dispatchRecord.code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(dispatchRecord.code)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-400 transition-colors"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Email troubleshooting accordion for "null is unreachable" error */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                    className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1.5 underline decoration-amber-500/40 underline-offset-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Does your email link say &quot;null is unreachable&quot;? Click here</span>
                  </button>

                  {showTroubleshoot && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 space-y-2.5 animate-in fade-in-50">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Why &quot;null is unreachable&quot; occurred:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 m-0">
                        Your Supabase project currently has its <strong>Site URL</strong> set to empty/null. When Supabase generates email links, it used <code>null</code> as the domain address instead of <code>http://localhost:5173</code>.
                      </p>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/50 space-y-1.5 font-sans">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <span>⚡ Permanent Fix in Supabase Dashboard (30 seconds):</span>
                        </div>
                        <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal pl-4 m-0">
                          <li>Open your <strong>Supabase Dashboard</strong> → <strong>Authentication</strong> → <strong>URL Configuration</strong>.</li>
                          <li>Set <strong>Site URL</strong> to: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-amber-600 dark:text-amber-400">http://localhost:5173</code></li>
                          <li>Under <strong>Redirect URLs</strong>, add: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">http://localhost:5173/**</code></li>
                          <li>Click <strong>Save</strong>.</li>
                        </ol>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/50 space-y-1.5 font-sans">
                        <div className="font-bold text-[11px] text-slate-900 dark:text-slate-100">
                          ⚡ Instant Workaround for Current Email:
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 m-0">
                          In the unreachable browser tab's address bar (showing <code>http://null/#access_token=...</code>), replace <code>http://null</code> with:
                          <br />
                          <code className="select-all font-mono font-bold text-emerald-600 dark:text-emerald-400">http://localhost:5173</code>
                          <br />
                          and press Enter to instantly return to SecureShield.
                        </p>
                      </div>

                      {/* Developer testing simulation code fallback */}
                      <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Sandbox testing fallback:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (dispatchRecord) {
                              setCode(dispatchRecord.code);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition-colors"
                        >
                          Auto-Fill Test OTP ({dispatchRecord?.code})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter 6-Digit Verification Code
                  </label>
                  {dispatchRecord && (
                    <button
                      type="button"
                      onClick={() => setCode(dispatchRecord.code)}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Paste Code ({dispatchRecord.code})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Change Email or Resend
                </button>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize & Re-enroll Visual Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
