import React, { useState, useEffect } from 'react';
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Database,
} from 'lucide-react';
import type {
  AuthMethod,
  AuthSession,
  AuthView,
  UserGraphicalCredential,
  UserProfile,
} from './types';
import { authService } from './services/authService';
import {
  generateSalt,
  hashRecognitionCredential,
  hashRecallCredential,
} from './utils/crypto';
import { ThemeToggle } from './components/ThemeToggle';
import { RegisterForm } from './components/RegisterForm';
import { RegistrationSuccess } from './components/RegistrationSuccess';
import { LoginForm } from './components/LoginForm';
import { RecognitionSelector } from './components/RecognitionSelector';
import { RecallSequenceSelector } from './components/RecallSequenceSelector';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ResetGraphicalModal } from './components/ResetGraphicalModal';
import { SupabaseModal } from './components/SupabaseModal';
import { supabase, isSupabaseLive } from './lib/supabase';

const SESSION_STORAGE_KEY = 'secureshield_active_session';
const PENDING_FLOW_KEY = 'secureshield_pending_flow';

export const App: React.FC = () => {
  // Navigation / View state initialized from storage to survive page reload
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) return 'dashboard';

      const storedFlow = sessionStorage.getItem(PENDING_FLOW_KEY);
      if (storedFlow) {
        const flow = JSON.parse(storedFlow);
        if (flow.view) return flow.view;
      }
    } catch {
      // fallback
    }
    return 'login-credentials';
  });

  // User state during multi-step authentication
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(() => {
    try {
      const storedFlow = sessionStorage.getItem(PENDING_FLOW_KEY);
      return storedFlow ? JSON.parse(storedFlow).user : null;
    } catch {
      return null;
    }
  });

  // Newly registered user profile for admission success screen
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  // Graphical credential state (with persistent failed attempts)
  const [pendingCredential, setPendingCredential] = useState<UserGraphicalCredential | null>(() => {
    try {
      const storedFlow = sessionStorage.getItem(PENDING_FLOW_KEY);
      return storedFlow ? JSON.parse(storedFlow).credential : null;
    } catch {
      return null;
    }
  });

  const [setupMethod, setSetupMethod] = useState<AuthMethod>('recognition');
  const [loginChallengeMethod, setLoginChallengeMethod] = useState<AuthMethod>(
    () => pendingCredential?.auth_method || 'recognition'
  );

  // Active authenticated session (survives page refresh)
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep active session synchronized with persistent storage
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  // Keep pending visual challenge flow synchronized with sessionStorage across F5
  useEffect(() => {
    if (pendingUser && (currentView === 'login-graphical' || currentView === 'setup-graphical')) {
      sessionStorage.setItem(
        PENDING_FLOW_KEY,
        JSON.stringify({
          view: currentView,
          user: pendingUser,
          credential: pendingCredential,
        })
      );
    } else if (currentView === 'login-credentials' || currentView === 'dashboard') {
      sessionStorage.removeItem(PENDING_FLOW_KEY);
    }
  }, [currentView, pendingUser, pendingCredential]);

  // Operation loading and error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [graphicalError, setGraphicalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Graphical MFA Reset via Email modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetModalEmail, setResetModalEmail] = useState('');
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  const handleResetAuthorized = (email: string) => {
    setShowResetModal(false);
    const foundUser = authService.findUserByEmail(email);
    const targetUser: UserProfile = foundUser || {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      fullName: email.split('@')[0],
      username: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'user',
      status: 'active',
    };

    authService.resetFailedAttempts(targetUser.id);
    const existingCred = authService.getCredentialForUser(targetUser.id);
    if (existingCred?.auth_method) {
      setSetupMethod(existingCred.auth_method);
    }
    setPendingUser(targetUser);
    setGraphicalError(null);
    setCurrentView('setup-graphical');
    showToast(`Identity verified via email! Please configure your new 4 graphical authentication icons.`);
  };

  // Detect email verification / magic link callback (from clicking the link in email)
  useEffect(() => {
    const rawHash = typeof window !== 'undefined' ? window.location.hash : '';
    const rawSearch = typeof window !== 'undefined' ? window.location.search : '';
    const isRecoveryHash =
      rawHash.includes('access_token=') ||
      rawHash.includes('type=recovery') ||
      rawHash.includes('type=magiclink') ||
      rawSearch.includes('type=recovery') ||
      rawSearch.includes('reset_email=');

    // Query param direct override (?reset_email=...)
    if (rawSearch.includes('reset_email=')) {
      const params = new URLSearchParams(rawSearch);
      const resetEmail = params.get('reset_email');
      if (resetEmail) {
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => handleResetAuthorized(resetEmail), 0);
        return;
      }
    }

    if (!isSupabaseLive || !supabase) return;

    // Listen for Supabase auth recovery events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryHash)) {
        const userEmail = authSession?.user?.email;
        if (userEmail) {
          handleResetAuthorized(userEmail);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    });

    // Fallback: If redirected with access_token hash, fetch active session
    if (isRecoveryHash) {
      supabase.auth.getSession().then(({ data }) => {
        const userEmail = data?.session?.user?.email;
        if (userEmail) {
          handleResetAuthorized(userEmail);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      });
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------
  // Handlers for Registration / Admission
  // -------------------------------------------------------------
  const handleRegisterSuccess = (data: {
    user: UserProfile;
    authMethod: AuthMethod;
  }) => {
    setPendingUser(data.user);
    setSetupMethod(data.authMethod);
    setIsNewRegistration(true);
    setGraphicalError(null);
    setCurrentView('setup-graphical');
    showToast(`Identity profile created. Please enroll your ${data.authMethod} visual MFA key.`);
  };

  // -------------------------------------------------------------
  // Handlers for Graphical Password Setup
  // -------------------------------------------------------------
  const handleSaveRecognitionSetup = async (selectedIds: string[]) => {
    if (!pendingUser) return;
    setIsProcessing(true);
    setGraphicalError(null);

    try {
      const salt = generateSalt();
      const hash = await hashRecognitionCredential(selectedIds, salt);

      const res = await authService.saveGraphicalCredential({
        userId: pendingUser.id,
        authMethod: 'recognition',
        credentialHash: hash,
        salt,
      });

      if (!res.success) {
        setGraphicalError(res.error || 'Failed to save visual MFA credentials.');
        return;
      }

      if (isNewRegistration) {
        // Transition to dedicated Admission Confirmation Screen
        setRegisteredUser(pendingUser);
        setIsNewRegistration(false);
        setCurrentView('registration-success');
        showToast('Identity successfully provisioned and visual MFA enrolled!');
      } else {
        // Self-service update from dashboard
        setSession({
          user: pendingUser,
          method: 'recognition',
          authenticatedAt: new Date().toISOString(),
          failedAttempts: 0,
          isDemoMode: !authService.isLive,
        });
        setCurrentView('dashboard');
        showToast('Visual recognition MFA successfully updated!');
      }
    } catch (err: any) {
      setGraphicalError(err.message || 'Error saving visual MFA credential.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRecallSetup = async (sequenceIds: string[]) => {
    if (!pendingUser) return;
    setIsProcessing(true);
    setGraphicalError(null);

    try {
      const salt = generateSalt();
      const hash = await hashRecallCredential(sequenceIds, salt);

      const res = await authService.saveGraphicalCredential({
        userId: pendingUser.id,
        authMethod: 'recall',
        credentialHash: hash,
        salt,
      });

      if (!res.success) {
        setGraphicalError(res.error || 'Failed to save visual MFA sequence.');
        return;
      }

      if (isNewRegistration) {
        setRegisteredUser(pendingUser);
        setIsNewRegistration(false);
        setCurrentView('registration-success');
        showToast('Identity successfully provisioned and visual MFA enrolled!');
      } else {
        setSession({
          user: pendingUser,
          method: 'recall',
          authenticatedAt: new Date().toISOString(),
          failedAttempts: 0,
          isDemoMode: !authService.isLive,
        });
        setCurrentView('dashboard');
        showToast('Sequential visual MFA pathway successfully updated!');
      }
    } catch (err: any) {
      setGraphicalError(err.message || 'Error saving sequence credential.');
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // Handlers for Login Flow
  // -------------------------------------------------------------
  const handleLoginCredentialsSuccess = (data: {
    user: UserProfile;
    credential: UserGraphicalCredential | null;
  }) => {
    setPendingUser(data.user);
    setPendingCredential(data.credential);
    setGraphicalError(null);

    if (!data.credential) {
      // User account exists, but has not completed graphical credential setup yet
      setSetupMethod('recognition');
      setCurrentView('setup-graphical');
      showToast('No visual MFA factor enrolled for this identity. Please configure one now.');
    } else {
      // Default challenge to the user's enrolled method, but allow switching to confuse adversaries
      setLoginChallengeMethod(data.credential.auth_method);
      setCurrentView('login-graphical');
      showToast('Primary credentials verified. Complete Step 2 Visual Challenge.');
    }
  };

  // -------------------------------------------------------------
  // Handlers for Graphical Challenge Verification (Login Step 2)
  // -------------------------------------------------------------
  const handleVerifyRecognitionLogin = async (selectedIds: string[]) => {
    if (!pendingUser || !pendingCredential) return;
    setIsProcessing(true);
    setGraphicalError(null);

    try {
      const activeCred = authService.getCredentialForUser(pendingUser.id) || pendingCredential;

      // Method verification barrier: if identity was enrolled with recall, recognition attempt fails
      if (activeCred.auth_method !== 'recognition') {
        const nextCount = (activeCred.failed_attempts || 0) + 1;
        setPendingCredential({
          ...activeCred,
          failed_attempts: nextCount,
        });
        setGraphicalError(
          `Authentication Failed (Attempt #${nextCount}): Wrong path mode selected or Incorrect visual markers selected. Anomaly recorded. Grid coordinates re-randomized.`
        );
        authService.recordFailedAttempt(pendingUser.id, nextCount).catch((err) => {
          console.warn('Failed to persist attempt:', err);
        });
        return;
      }

      const inputHash = await hashRecognitionCredential(selectedIds, activeCred.salt);

      if (inputHash === activeCred.credential_hash) {
        const failureCount = activeCred.failed_attempts;
        await authService.resetFailedAttempts(pendingUser.id);

        setSession({
          user: pendingUser,
          method: 'recognition',
          authenticatedAt: new Date().toISOString(),
          failedAttempts: failureCount,
          isDemoMode: !authService.isLive,
        });

        setCurrentView('dashboard');
        showToast(`Visual factor verified. Welcome, ${pendingUser.fullName}!`);
      } else {
        const nextCount = (activeCred.failed_attempts || 0) + 1;
        setPendingCredential({
          ...activeCred,
          failed_attempts: nextCount,
        });
        setGraphicalError(
          `Authentication Failed (Attempt #${nextCount}): Wrong path mode selected or Incorrect visual markers selected. Anomaly recorded. Grid coordinates re-randomized.`
        );

        authService.recordFailedAttempt(pendingUser.id, nextCount).catch((err) => {
          console.warn('Failed to persist attempt:', err);
        });
      }
    } catch (err: any) {
      setGraphicalError(err.message || 'Visual MFA verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyRecallLogin = async (sequenceIds: string[]) => {
    if (!pendingUser || !pendingCredential) return;
    setIsProcessing(true);
    setGraphicalError(null);

    try {
      const activeCred = authService.getCredentialForUser(pendingUser.id) || pendingCredential;

      // Method verification barrier: if identity was enrolled with recognition, recall attempt fails
      if (activeCred.auth_method !== 'recall') {
        const nextCount = (activeCred.failed_attempts || 0) + 1;
        setPendingCredential({
          ...activeCred,
          failed_attempts: nextCount,
        });
        setGraphicalError(
          `Authentication Failed (Attempt #${nextCount}): Wrong path mode selected or Incorrect visual markers selected. Anomaly recorded. Grid coordinates re-randomized.`
        );
        authService.recordFailedAttempt(pendingUser.id, nextCount).catch((err) => {
          console.warn('Failed to persist attempt:', err);
        });
        return;
      }

      const inputHash = await hashRecallCredential(sequenceIds, activeCred.salt);

      if (inputHash === activeCred.credential_hash) {
        const failureCount = activeCred.failed_attempts;
        await authService.resetFailedAttempts(pendingUser.id);

        setSession({
          user: pendingUser,
          method: 'recall',
          authenticatedAt: new Date().toISOString(),
          failedAttempts: failureCount,
          isDemoMode: !authService.isLive,
        });

        setCurrentView('dashboard');
        showToast(`Sequential pathway verified. Welcome, ${pendingUser.fullName}!`);
      } else {
        const nextCount = (activeCred.failed_attempts || 0) + 1;
        setPendingCredential({
          ...activeCred,
          failed_attempts: nextCount,
        });
        setGraphicalError(
          `Authentication Failed (Attempt #${nextCount}): Wrong path mode selected or Incorrect visual markers selected. Anomaly recorded. Grid coordinates re-randomized.`
        );

        authService.recordFailedAttempt(pendingUser.id, nextCount).catch((err) => {
          console.warn('Failed to persist attempt:', err);
        });
      }
    } catch (err: any) {
      setGraphicalError(err.message || 'Verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // Sign out and re-auth handlers
  // -------------------------------------------------------------
  const handleSignOut = async () => {
    await authService.signOut();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(PENDING_FLOW_KEY);
    setSession(null);
    setPendingUser(null);
    setPendingCredential(null);
    setCurrentView('login-credentials');
    showToast('Enterprise session terminated.');
  };

  const handleTestReAuth = () => {
    if (session && pendingCredential) {
      setGraphicalError(null);
      setCurrentView('login-graphical');
      showToast('Workplace terminal locked. Complete Visual MFA Challenge to resume session.');
    } else {
      handleSignOut();
    }
  };

  const handleResetGraphicalPassword = () => {
    if (session) {
      setPendingUser(session.user);
      setSetupMethod(session.method);
      setIsNewRegistration(false);
      setGraphicalError(null);
      setCurrentView('setup-graphical');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 cyber-grid-bg relative text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-96 radial-glow pointer-events-none" />

      {/* Enterprise Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyber-500 flex items-center justify-center text-slate-950 shadow-cyber-sm">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              SecureShield
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {session && (
            <div className="flex items-center gap-2">
              {/* Only show Administrator badge and preview toggle if the account belongs to an Administrator */}
              {session.user.email?.toLowerCase().includes('admin') && (
                <>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </span>

                  {session.isDemoMode && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRole: import('./types').UserRole = session.user.role === 'admin' ? 'user' : 'admin';
                        const updatedUser: UserProfile = { ...session.user, role: nextRole };
                        setSession({ ...session, user: updatedUser });
                        showToast(
                          `Switched interface view to ${nextRole === 'admin' ? 'Administrator' : 'Normal User'} Mode`
                        );
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Switch between Normal User and Administrator dashboards"
                    >
                      View as {session.user.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Database Connection & Sandbox Config (Only shown for Admin or when not logged into a user dashboard) */}
          {(!session || session.user.role === 'admin') && (
            <button
              type="button"
              onClick={() => setShowDatabaseModal(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border shadow-sm ${
                isSupabaseLive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Click to view database connection status and SQL schemas"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSupabaseLive ? 'Supabase Live' : 'Enterprise Sandbox'}</span>
            </button>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>
      </header>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/95 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center relative z-10">
        {/* VIEW 1: LOGIN STEP 1 (Workplace Identifier & Primary Password) */}
        {currentView === 'login-credentials' && (
          <div className="w-full">
            <LoginForm
              onCredentialsSuccess={handleLoginCredentialsSuccess}
              onNavigateRegister={() => {
                setGraphicalError(null);
                setCurrentView('register');
              }}
              onAuthenticate={authService.authenticateCredentials}
              onForgotPasswordOrKey={(currentId) => {
                setResetModalEmail(currentId || '');
                setShowResetModal(true);
              }}
            />
          </div>
        )}

        {/* VIEW 2: SEPARATE USER REGISTRATION / ADMISSION PORTAL */}
        {currentView === 'register' && (
          <div className="w-full">
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onNavigateLogin={() => {
                setGraphicalError(null);
                setCurrentView('login-credentials');
              }}
              onSubmitRegistration={authService.registerUser}
            />
          </div>
        )}

        {/* VIEW 3: REGISTRATION ADMISSION CONFIRMATION */}
        {currentView === 'registration-success' && registeredUser && (
          <div className="w-full">
            <RegistrationSuccess
              user={registeredUser}
              authMethod={setupMethod}
              onProceedToLogin={() => {
                setGraphicalError(null);
                setCurrentView('login-credentials');
              }}
            />
          </div>
        )}

        {/* VIEW 4: GRAPHICAL MFA SETUP */}
        {currentView === 'setup-graphical' && (
          <div className="w-full max-w-3xl mx-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  MFA Credential Enrollment
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  Configure Enterprise Visual Key
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enrolling secondary factor for identity:{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {pendingUser?.email}
                  </span>
                </p>
              </div>

              {/* Toggle setup mode between Recognition and Recall */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSetupMethod('recognition')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    setupMethod === 'recognition'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Recognition (4 Items)
                </button>
                <button
                  type="button"
                  onClick={() => setSetupMethod('recall')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    setupMethod === 'recall'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Recall (Sequential 4 Steps)
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {graphicalError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{graphicalError}</span>
              </div>
            )}

            {/* Render Setup Selector */}
            {setupMethod === 'recognition' ? (
              <RecognitionSelector
                isSetup={true}
                onSubmit={handleSaveRecognitionSetup}
                isLoading={isProcessing}
                errorMessage={graphicalError}
                onCancel={() => {
                  if (session) setCurrentView('dashboard');
                  else setCurrentView('login-credentials');
                }}
              />
            ) : (
              <RecallSequenceSelector
                isSetup={true}
                onSubmit={handleSaveRecallSetup}
                isLoading={isProcessing}
                errorMessage={graphicalError}
                onCancel={() => {
                  if (session) setCurrentView('dashboard');
                  else setCurrentView('login-credentials');
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 5: LOGIN STEP 2 - GRAPHICAL MFA CHALLENGE */}
        {currentView === 'login-graphical' && pendingCredential && (
          <div className="w-full max-w-3xl mx-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                id="back-to-login-btn"
                onClick={() => setCurrentView('login-credentials')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Workplace Account</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Method selector for visual authentication mode */}
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginChallengeMethod('recognition');
                      setGraphicalError(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      loginChallengeMethod === 'recognition'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Recognition Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginChallengeMethod('recall');
                      setGraphicalError(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      loginChallengeMethod === 'recall'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Recall Mode (Sequential)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">Authenticating:</span>
                  <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {pendingUser?.email}
                  </span>
                  {pendingCredential.failed_attempts > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {pendingCredential.failed_attempts} Failed{' '}
                        {pendingCredential.failed_attempts === 1 ? 'Attempt' : 'Attempts'}
                      </span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      0 Failed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visual key hint helper banner for demo accounts */}
            {(pendingUser?.email?.includes('secureshield.gov') ||
              pendingUser?.email?.includes('globalbank.com') ||
              pendingUser?.email?.includes('defense.gov') ||
              pendingUser?.email?.includes('energy.infra')) && (
              <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 shadow-sm">
                <span className="text-base select-none shrink-0 mt-0.5">💡</span>
                <div className="leading-relaxed">
                  <strong className="font-semibold text-indigo-950 dark:text-indigo-100">Demo Account Enrolled Key:</strong>{' '}
                  {loginChallengeMethod === 'recall' ? (
                    <span>
                      Enrolled Sequence (1 → 4): <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Hardware Security (HSM)</span> → <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Cryptographic Key Vault</span> → <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Biometric Auth Sentinel</span> → <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">SSH Bastion Terminal</span>.
                    </span>
                  ) : (
                    <span>
                      Enrolled Markers (select all 4): <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Hardware Security (HSM)</span>, <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Cryptographic Key Vault</span>, <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">Biometric Auth Sentinel</span>, and <span className="font-mono bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">SSH Bastion Terminal</span>.
                    </span>
                  )}
                </div>
              </div>
            )}

            {loginChallengeMethod === 'recognition' ? (
              <RecognitionSelector
                isSetup={false}
                onSubmit={handleVerifyRecognitionLogin}
                isLoading={isProcessing}
                errorMessage={graphicalError}
                onCancel={() => setCurrentView('login-credentials')}
              />
            ) : (
              <RecallSequenceSelector
                isSetup={false}
                onSubmit={handleVerifyRecallLogin}
                isLoading={isProcessing}
                errorMessage={graphicalError}
                onCancel={() => setCurrentView('login-credentials')}
              />
            )}

            {/* Self-Service Email Reset Option */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Cannot recall your 4 visual icons or sequential pathway?
              </span>
              <button
                type="button"
                onClick={() => {
                  setResetModalEmail(pendingUser?.email || '');
                  setShowResetModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors shadow-sm"
              >
                <span>Reset Visual Key via Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 6: AUTHENTICATED DASHBOARDS (SEPARATE INTERFACES FOR USER VS ADMIN) */}
        {currentView === 'dashboard' && session && (
          session.user.role === 'admin' ? (
            <AdminDashboard
              session={session}
              onSignOut={handleSignOut}
              onTestReAuth={handleTestReAuth}
            />
          ) : (
            <UserDashboard
              session={session}
              onSignOut={handleSignOut}
              onResetGraphicalPassword={handleResetGraphicalPassword}
              onTestReAuth={handleTestReAuth}
            />
          )
        )}

        {/* Graphical MFA Reset via Email Modal */}
        <ResetGraphicalModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          defaultEmail={resetModalEmail}
          onResetAuthorized={handleResetAuthorized}
        />

        {/* Supabase Configuration & Status Modal */}
        <SupabaseModal
          isOpen={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
        />
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
        <span>SecureShield Enterprise Identity & Access Management (IAM)</span>
        <span className="mx-2">•</span>
        <span>Zero Trust Dual-Factor Architecture</span>
        <span className="mx-2">•</span>
        <span>FIPS 140-3 Compliant</span>
      </footer>
    </div>
  );
};

export default App;
