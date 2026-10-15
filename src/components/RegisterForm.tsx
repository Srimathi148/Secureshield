import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Check,
  AtSign,
  Building2,
} from 'lucide-react';
import type { AuthMethod, UserProfile } from '../types';
import { PhoneInput } from './PhoneInput';
import type { CountryOption } from '../data/countries';

interface RegisterFormProps {
  onSuccess: (data: {
    user: UserProfile;
    authMethod: AuthMethod;
  }) => void;
  onNavigateLogin: () => void;
  onSubmitRegistration: (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    phone: string;
    country?: string;
    authMethod: AuthMethod;
    department?: string;
    termsAccepted?: boolean;
  }) => Promise<{ user: UserProfile | null; error: string | null }>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onNavigateLogin,
  onSubmitRegistration,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Banking Sector - Retail & Commercial Banking');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('recognition');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password policy metrics
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const pwdScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  const isPasswordValid = hasMinLength && (hasUpper || hasLower) && (hasNumber || hasSymbol);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Required fields
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Please choose a workplace username.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {
      setErrorMessage('Username must be 3-20 characters long and contain only letters, numbers, hyphens, or underscores.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid corporate email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please provide a contact phone number for identity verification.');
      return;
    }

    // 2. Password validation
    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (pwdScore < 3) {
      setErrorMessage('Password is too weak. Please include a mix of uppercase letters, numbers, and symbols.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Primary password confirmation does not match.');
      return;
    }

    // 3. Terms acceptance
    if (!termsAccepted) {
      setErrorMessage('You must review and accept the Zero Trust Security & Admission Terms to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onSubmitRegistration({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        username: cleanUsername,
        phone: phone.trim(),
        country: selectedCountry?.name || 'India',
        authMethod,
        department,
        termsAccepted,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.user) {
        onSuccess({
          user: res.user,
          authMethod,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Identity provisioning encountered a service error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left transition-all">
        {/* Banner */}
        <div className="p-6 sm:p-8 pb-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/40">
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Identity Lifecycle • New User Registration & Admission</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Workplace Identity Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Enter your details to create your enterprise account and set up your secondary Visual MFA key.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3 shadow-sm animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workplace Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. evance_bank"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Corporate Email & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
                />
              </div>
            </div>

            <div>
              <PhoneInput
                id="register-phone"
                label="Phone Number"
                required
                value={phone}
                defaultCountryCode="IN"
                onChange={(fullNumber, countryOption) => {
                  setPhone(fullNumber);
                  setSelectedCountry(countryOption);
                }}
              />
            </div>
          </div>

          {/* Organizational Unit / Sector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Organizational Unit / Sector <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                id="register-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
              >
                <optgroup label="🏦 Banking & Financial Sector">
                  <option value="Banking Sector - Retail & Commercial Banking">Banking Sector - Retail & Commercial Banking</option>
                  <option value="Banking Sector - Central Bank & Monetary Authority">Banking Sector - Central Bank & Monetary Authority</option>
                  <option value="Banking Sector - Investment Banking & Capital Markets">Banking Sector - Investment Banking & Capital Markets</option>
                  <option value="Banking Sector - SWIFT & Cross-Border Settlements">Banking Sector - SWIFT & Cross-Border Settlements</option>
                  <option value="Banking Sector - FinTech & Digital Payments Core">Banking Sector - FinTech & Digital Payments Core</option>
                  <option value="Banking Sector - Financial Intelligence & AML Bureau">Banking Sector - Financial Intelligence & AML Bureau</option>
                  <option value="Banking Sector - Treasury & Wealth Management">Banking Sector - Treasury & Wealth Management</option>
                </optgroup>
                <optgroup label="🏛️ Government & Defense Agencies">
                  <option value="Government Agency - Federal Cyber Security Agency">Government Agency - Federal Cyber Security Agency</option>
                  <option value="Government Agency - Department of Defense (DoD)">Government Agency - Department of Defense (DoD)</option>
                  <option value="Government Agency - Homeland Security & Border Defense">Government Agency - Homeland Security & Border Defense</option>
                  <option value="Government Agency - National Intelligence Directorate">Government Agency - National Intelligence Directorate</option>
                  <option value="Government Agency - Central Taxation & Revenue Authority">Government Agency - Central Taxation & Revenue Authority</option>
                  <option value="Government Agency - Ministry of Foreign Affairs">Government Agency - Ministry of Foreign Affairs</option>
                  <option value="Government Agency - Federal Law Enforcement & Police">Government Agency - Federal Law Enforcement & Police</option>
                  <option value="Government Agency - Public Administration & Civil Services">Government Agency - Public Administration & Civil Services</option>
                </optgroup>
                <optgroup label="🛡️ Critical Infrastructure & Enterprise">
                  <option value="Critical Infrastructure - Energy Grid & Nuclear Security">Critical Infrastructure - Energy Grid & Nuclear Security</option>
                  <option value="Critical Infrastructure - Aerospace & Defense Contractor">Critical Infrastructure - Aerospace & Defense Contractor</option>
                  <option value="Critical Infrastructure - Telecommunications & Satellites">Critical Infrastructure - Telecommunications & Satellites</option>
                  <option value="Healthcare & Biomedical Defense Systems">Healthcare & Biomedical Defense Systems</option>
                  <option value="SecOps & Enterprise Infrastructure">SecOps & Enterprise Infrastructure</option>
                  <option value="Cloud Security & IAM Operations">Cloud Security & IAM Operations</option>
                  <option value="Cyber Threat Intelligence (CTI)">Cyber Threat Intelligence (CTI)</option>
                  <option value="Executive Security Council & Governance">Executive Security Council & Governance</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Passwords grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="register-password"
                  required
                  placeholder="Min 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 rounded-full transition-all ${
                          lvl <= pwdScore
                            ? pwdScore <= 2
                              ? 'bg-rose-500'
                              : pwdScore <= 3
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>
                      Strength:{' '}
                      {pwdScore <= 2 ? 'Weak' : pwdScore <= 3 ? 'Medium' : pwdScore <= 4 ? 'Strong' : 'Very Strong'}
                    </span>
                    <span>{password.length} chars</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Primary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="register-confirm-password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1 text-[10px] font-mono flex items-center gap-1">
                  {password === confirmPassword ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-500">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visual MFA Factor Choice */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Secondary Visual MFA Factor Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Recognition */}
              <div
                onClick={() => setAuthMethod('recognition')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  authMethod === 'recognition'
                    ? 'border-cyber-500 bg-cyber-500/5 dark:bg-cyber-500/10 ring-1 ring-cyber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <ShieldCheck className="w-4 h-4 text-cyber-500" />
                    <span>Recognition-Based Key</span>
                  </div>
                  {authMethod === 'recognition' && (
                    <span className="w-2 h-2 rounded-full bg-cyber-500 shadow-cyber-sm" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Memorize 4 security markers. Verification is order-independent and resists shoulder-surfing via randomized grid placement.
                </p>
              </div>

              {/* Option 2: Recall */}
              <div
                onClick={() => setAuthMethod('recall')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  authMethod === 'recall'
                    ? 'border-cyber-500 bg-cyber-500/5 dark:bg-cyber-500/10 ring-1 ring-cyber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <KeyRound className="w-4 h-4 text-cyber-500" />
                    <span>Sequential Recall Key</span>
                  </div>
                  {authMethod === 'recall' && (
                    <span className="w-2 h-2 rounded-full bg-cyber-500 shadow-cyber-sm" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Memorize a strict 4-step sequence. Enforces directional order validation with real-time sequence hashing.
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-cyber-500 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                I accept the <strong className="text-slate-900 dark:text-slate-100">SecureShield Zero Trust Terms of Access</strong> and agree to configure mandatory dual-factor visual credentials.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !termsAccepted}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-cyber-500 hover:bg-cyber-600 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-cyber-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Provisioning Identity in SecureShield...</span>
              ) : (
                <>
                  <span>Proceed to Step 2: Configure Visual MFA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an active identity?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-cyber-600 dark:text-cyber-400 font-semibold hover:underline"
            >
              Sign In to Terminal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
