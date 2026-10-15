import { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Zap,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  isSupabaseLive,
  SUPABASE_CONFIG,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

const SQL_SCHEMA = `-- SecureShield: Graphical Password Authentication Module
-- Run in Supabase SQL Editor:
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
    ON public.user_graphical_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own graphical credential"
    ON public.user_graphical_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own graphical credential"
    ON public.user_graphical_credentials FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);`;

export const SupabaseModal = ({
  isOpen,
  onClose,
  onConnectionChange,
}: SupabaseModalProps) => {
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(SUPABASE_CONFIG.url || '');
  const [keyInput, setKeyInput] = useState(SUPABASE_CONFIG.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableFound: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    const cleanUrl = urlInput.trim();
    const cleanKey = keyInput.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both your Supabase Project URL and Anon Public Key.',
        tableFound: false,
      });
      return;
    }

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      setTestResult({
        success: false,
        message: 'Invalid Supabase URL format. Expected: https://<project-ref>.supabase.co',
        tableFound: false,
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await testSupabaseConnection(cleanUrl, cleanKey);
      setTestResult(result);

      if (result.success) {
        // Save to runtime and localStorage
        setSupabaseCredentials(cleanUrl, cleanKey);
        if (onConnectionChange) onConnectionChange();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
        tableFound: false,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRevertSandbox = () => {
    clearSupabaseCredentials();
    setUrlInput('');
    setKeyInput('');
    setTestResult({
      success: true,
      message: 'Reverted to local client sandbox mode.',
      tableFound: true,
    });
    if (onConnectionChange) onConnectionChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-500/10 text-cyber-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Supabase Backend Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct integration with your Supabase PostgreSQL & Auth services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
              isSupabaseLive
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
            }`}
          >
            {isSupabaseLive ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">
                {isSupabaseLive ? 'Connected to Live Supabase Backend' : 'Running in Local Sandbox Mode'}
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed font-mono">
                {isSupabaseLive
                  ? `Active Project Endpoint: ${SUPABASE_CONFIG.url}`
                  : 'Currently operating in browser client sandbox. Enter your project URL and Anon Key below to connect live Supabase!'}
              </p>
            </div>
            {isSupabaseLive && (
              <button
                type="button"
                onClick={handleRevertSandbox}
                className="text-[11px] underline opacity-80 hover:opacity-100 text-rose-500 shrink-0"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Interactive Connection Form */}
          <form
            onSubmit={handleTestAndSave}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyber-500" />
                Connect Live Supabase Project
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyber-600 dark:text-cyber-400 hover:underline inline-flex items-center gap-1"
              >
                Get Keys from Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                required
                id="modal-supabase-url"
                placeholder="https://xyzprojectref.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                required
                id="modal-supabase-key"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500"
              />
            </div>

            {/* Test result output */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? testResult.tableFound
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {testResult.success ? (
                  testResult.tableFound ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">{testResult.message}</div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Credentials are stored safely in local environment storage.
              </span>
              <button
                type="submit"
                id="modal-connect-btn"
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyber-500 hover:bg-cyber-400 transition-colors shadow-cyber-sm cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Ping...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Save & Connect Live</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Setup Instructions */}
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Supabase PostgreSQL Setup Instructions:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>
                Open your project in the{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyber-500 underline inline-flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Navigate to the <span className="font-semibold text-slate-800 dark:text-slate-200">SQL Editor</span> tab.</li>
              <li>Click <span className="font-semibold text-slate-800 dark:text-slate-200">New Query</span>, paste the schema below, and click <span className="font-semibold text-slate-800 dark:text-slate-200">Run</span>.</li>
              <li>You can also add them to your <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">.env</code> file if you prefer.</li>
            </ol>
          </div>

          {/* SQL Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
                SQL Schema with Row Level Security (RLS)
              </span>
              <button
                type="button"
                id="copy-sql-btn"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                  bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyber-500 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
              {SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={handleRevertSandbox}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Sandbox</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
