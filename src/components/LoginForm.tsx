import React, { useState } from 'react';
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type { UserGraphicalCredential, UserProfile } from '../types';

interface LoginFormProps {
  onCredentialsSuccess: (data: {
    user: UserProfile;
    credential: UserGraphicalCredential | null;
  }) => void;
  onNavigateRegister: () => void;
  onAuthenticate: (params: {
    identifier: string;
    password: string;
  }) => Promise<{
    user: UserProfile | null;
    credential: UserGraphicalCredential | null;
    error: string | null;
  }>;
  onForgotPasswordOrKey?: (currentIdentifier?: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onCredentialsSuccess,
  onNavigateRegister,
  onAuthenticate,
  onForgotPasswordOrKey,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;

    }
    if (!password) {
      setErrorMessage('Please enter your primary password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onAuthenticate({
        identifier: identifier.trim(),
        password,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.user) {
        onCredentialsSuccess({
          user: res.user,
          credential: res.credential,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left">
      {/* Top Banner */}
      <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyber-500/10 text-cyber-600 dark:text-cyber-400 border border-cyber-500/20 mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Operator Verification • Step 1</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign In to SecureShield
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your email or username to initiate the dual-factor visual challenge.
        </p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4">
        {/* Hidden dummy fields to absorb aggressive browser autofill */}
        <input type="text" name="fake_usernameremembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
        <input type="password" name="fake_passwordremembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Email or Username */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email or Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="login-identifier"
              name="secureshield_auth_identifier"
              autoComplete="username"
              required
              placeholder="e.g. name@bank.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Primary Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              name="secureshield_auth_passkey"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] px-0.5">
          <span className="text-slate-400">Step 1 of 2: Primary Check</span>
          <button
            type="button"
            onClick={() => onForgotPasswordOrKey?.(identifier)}
            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
          >
            Forgot Visual MFA Key?
          </button>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 shadow-cyber transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Validating Primary Credentials...</span>
              </>
            ) : (
              <>
                <span>Proceed to Step 2: Visual MFA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Quick Demo Pre-Seeded Accounts for Testing */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            ⚡ Quick Demo Accounts (Click to Fill):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@secureshield.gov');
                setPassword('Admin@Secure2026');
                setErrorMessage(null);
              }}
              className="px-2 py-1.5 rounded-lg text-left text-[11px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
            >
              <div className="font-bold flex items-center gap-1">
                <span>🛡️ Admin</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Recognition MFA</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('operator@globalbank.com');
                setPassword('BankSecure#2026');
                setErrorMessage(null);
              }}
              className="px-2 py-1.5 rounded-lg text-left text-[11px] bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 transition-colors"
            >
              <div className="font-bold flex items-center gap-1">
                <span>🏦 Bank User</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Recognition MFA</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('analyst@defense.gov');
                setPassword('GovDefense#2026');
                setErrorMessage(null);
              }}
              className="px-2 py-1.5 rounded-lg text-left text-[11px] bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 transition-colors"
            >
              <div className="font-bold flex items-center gap-1">
                <span>🏛️ DoD Analyst</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Sequential Recall</div>
            </button>
          </div>
        </div>

        {/* Switch to register */}
        <div className="text-center pt-1 text-xs text-slate-500 dark:text-slate-400">
          Need a new identity?{' '}
          <button
            type="button"
            id="nav-to-register-btn"
            onClick={onNavigateRegister}
            className="text-cyber-600 dark:text-cyber-400 hover:underline font-semibold"
          >
            Register / Admission Portal
          </button>
        </div>
      </form>
    </div>
  );
};
