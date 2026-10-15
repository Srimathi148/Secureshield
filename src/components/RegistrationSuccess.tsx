import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Mail,
  Phone,
  AtSign,
  Building2,
  Fingerprint,
  Globe,
} from 'lucide-react';
import type { UserProfile, AuthMethod } from '../types';

interface RegistrationSuccessProps {
  user: UserProfile;
  authMethod: AuthMethod;
  onProceedToLogin: () => void;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  user,
  authMethod,
  onProceedToLogin,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto text-left animate-in fade-in-50 zoom-in-95">
      <div className="bg-white dark:bg-navy-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMISSION APPROVED • ZERO TRUST ENFORCED</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Identity Provisioning Complete
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Your workplace identity has been admitted into SecureShield with multi-factor visual protection. You may now sign in using your primary credentials and visual MFA key.
          </p>
        </div>

        {/* Identity Details Card */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Legal Name
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.fullName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" />
                Workplace Username
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.username || 'user'}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Corporate Email
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.email}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone Number
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.phone || 'N/A'}</span>
            </div>

            {user.country && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Country / Region
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{user.country}</span>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Assigned Sector
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[240px] truncate">
                {user.department}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                Secondary MFA Factor
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                {authMethod} Factor Enrolled
              </span>
            </div>
          </div>

          <button
            type="button"
            id="proceed-to-login-btn"
            onClick={onProceedToLogin}
            className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-cyber-500 hover:bg-cyber-600 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-cyber-sm"
          >
            <span>Proceed to Login Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
