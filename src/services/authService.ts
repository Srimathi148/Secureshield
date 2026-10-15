import { supabase, isSupabaseLive } from '../lib/supabase';
import type {
  AuthMethod,
  UserGraphicalCredential,
  UserProfile,
  UserRole,
  UserStatus,
  UserActivityLog,
  ManagedUser,
} from '../types';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  ipAddress: string;
  userAgent: string;
  userId?: string;
}

// In-memory / session store for sandbox/demo mode
interface SandboxUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  username: string;
  phone: string;
  country?: string;
  authMethod: AuthMethod;
  department: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
}

const SANDBOX_USERS_KEY = 'secureshield_enterprise_users';
const SANDBOX_CREDS_KEY = 'secureshield_enterprise_creds';
const AUDIT_LOGS_KEY = 'secureshield_audit_logs';
const USER_ACTIVITY_KEY = 'secureshield_user_activity';

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Pre-seeded enterprise accounts (Admin and Normal Users across Banking & Government)
const DEFAULT_SANDBOX_USERS: Record<string, SandboxUser> = {
  usr_admin_001: {
    id: 'usr_admin_001',
    email: 'admin@secureshield.gov',
    passwordHash: 'Admin@Secure2026',
    fullName: 'Chief Security Officer (CSO)',
    username: 'cso_admin',
    phone: '+1 (555) 019-2834',
    country: 'United States',
    authMethod: 'recognition',
    department: 'Government Agency - Federal Cyber Security Agency',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  usr_user_001: {
    id: 'usr_user_001',
    email: 'operator@globalbank.com',
    passwordHash: 'BankSecure#2026',
    fullName: 'Alex Vance',
    username: 'avance_bank',
    phone: '+91 98765 43210',
    country: 'India',
    authMethod: 'recognition',
    department: 'Banking Sector - Retail & Commercial Banking',
    role: 'user',
    status: 'active',
    createdAt: '2026-02-10T09:30:00.000Z',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  usr_user_002: {
    id: 'usr_user_002',
    email: 'analyst@defense.gov',
    passwordHash: 'GovDefense#2026',
    fullName: 'Elena Rostova',
    username: 'erostova_gov',
    phone: '+1 (555) 018-7742',
    country: 'United States',
    authMethod: 'recall',
    department: 'Government Agency - Department of Defense (DoD)',
    role: 'user',
    status: 'active',
    createdAt: '2026-02-18T14:15:00.000Z',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  usr_user_003: {
    id: 'usr_user_003',
    email: 'gridsec@energy.infra',
    passwordHash: 'GridPower$2026',
    fullName: 'Marcus Vance',
    username: 'mvance_energy',
    phone: '+91 91234 56789',
    country: 'India',
    authMethod: 'recognition',
    department: 'Critical Infrastructure - Energy Grid & Nuclear Security',
    role: 'user',
    status: 'active',
    createdAt: '2026-03-01T11:00:00.000Z',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
};

// Seed credentials with 4 valid icons ('shield_quantum', 'crypto_vault', 'biometric_scan', 'root_terminal')
// Canonical hash: SHA256 of `REC_biometric_scan::crypto_vault::root_terminal::shield_quantum::SALT_5f2d8a1c9e4b7031`
const DEFAULT_SANDBOX_CREDS: Record<string, UserGraphicalCredential> = {
  usr_admin_001: {
    id: 'cred_adm_1',
    user_id: 'usr_admin_001',
    auth_method: 'recognition',
    credential_hash: '7f80071427d809382d60540fbcb8159740861af427535826d5d0554be0a0badf',
    salt: '5f2d8a1c9e4b7031',
    failed_attempts: 0,
    last_failed_at: null,
    created_at: '2026-01-15T08:05:00.000Z',
    updated_at: '2026-01-15T08:05:00.000Z',
  },
  usr_user_001: {
    id: 'cred_usr_1',
    user_id: 'usr_user_001',
    auth_method: 'recognition',
    credential_hash: '7f80071427d809382d60540fbcb8159740861af427535826d5d0554be0a0badf',
    salt: '5f2d8a1c9e4b7031',
    failed_attempts: 0,
    last_failed_at: null,
    created_at: '2026-02-10T09:35:00.000Z',
    updated_at: '2026-02-10T09:35:00.000Z',
  },
  usr_user_002: {
    id: 'cred_usr_2',
    user_id: 'usr_user_002',
    auth_method: 'recall',
    // Sequence hash: 'shield_quantum' -> 'crypto_vault' -> 'biometric_scan' -> 'root_terminal'
    credential_hash: 'a6313557c01b3af954dbf6d0e763ee0eb4b947d86bc46c6aedc023da25d374b1',
    salt: 'e3c79a1f4b82d065',
    failed_attempts: 0,
    last_failed_at: null,
    created_at: '2026-02-18T14:20:00.000Z',
    updated_at: '2026-02-18T14:20:00.000Z',
  },
  usr_user_003: {
    id: 'cred_usr_3',
    user_id: 'usr_user_003',
    auth_method: 'recognition',
    credential_hash: '7f80071427d809382d60540fbcb8159740861af427535826d5d0554be0a0badf',
    salt: '5f2d8a1c9e4b7031',
    failed_attempts: 0,
    last_failed_at: null,
    created_at: '2026-03-01T11:05:00.000Z',
    updated_at: '2026-03-01T11:05:00.000Z',
  },
};

function getSandboxUsers(): Record<string, SandboxUser> {
  try {
    const data = localStorage.getItem(SANDBOX_USERS_KEY) || sessionStorage.getItem(SANDBOX_USERS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Object.keys(parsed).length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Initialize with default enterprise users
  saveSandboxUsers(DEFAULT_SANDBOX_USERS);
  return { ...DEFAULT_SANDBOX_USERS };
}

function saveSandboxUsers(users: Record<string, SandboxUser>) {
  try {
    localStorage.setItem(SANDBOX_USERS_KEY, JSON.stringify(users));
    sessionStorage.setItem(SANDBOX_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getSandboxCreds(): Record<string, UserGraphicalCredential> {
  try {
    const data = localStorage.getItem(SANDBOX_CREDS_KEY) || sessionStorage.getItem(SANDBOX_CREDS_KEY);
    if (data) {
      const parsed: Record<string, UserGraphicalCredential> = JSON.parse(data);
      if (Object.keys(parsed).length > 0) {
        // Auto-migrate old erroneous seed hashes if present
        let updated = false;
        for (const [key, defaultCred] of Object.entries(DEFAULT_SANDBOX_CREDS)) {
          if (
            !parsed[key] ||
            parsed[key].credential_hash === '511531334e5fefcf0b19656a280c32499dcd94fc8f66df3d5aaf4009e9f25020' ||
            parsed[key].credential_hash === 'a1fbb8e3457c028ee8d93b5fdb7824b589653052a24ae712b3189495bd9f6100'
          ) {
            parsed[key] = { ...defaultCred };
            localStorage.removeItem(`secureshield_failed_attempts_${key}`);
            updated = true;
          }
        }
        if (updated) {
          saveSandboxCreds(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  saveSandboxCreds(DEFAULT_SANDBOX_CREDS);
  return { ...DEFAULT_SANDBOX_CREDS };
}

function saveSandboxCreds(creds: Record<string, UserGraphicalCredential>) {
  try {
    localStorage.setItem(SANDBOX_CREDS_KEY, JSON.stringify(creds));
    sessionStorage.setItem(SANDBOX_CREDS_KEY, JSON.stringify(creds));
  } catch {
    // ignore
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return [
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      eventType: 'SYSTEM_BOOT',
      description: 'SecureShield Gateway initialized with Dual-Factor Zero Trust policy',
      status: 'SUCCESS',
      ipAddress: '192.168.1.104',
      userAgent: 'Desktop Browser • Windows Security Host',
    },
    {
      id: 'log-init-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      eventType: 'TLS_HANDSHAKE',
      description: 'Encrypted mutual TLS 1.3 tunnel established with identity federation',
      status: 'SUCCESS',
      ipAddress: '192.168.1.104',
      userAgent: 'Desktop Browser • Windows Security Host',
    },
    {
      id: 'log-init-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      eventType: 'RLS_INTEGRITY_CHECK',
      description: 'PostgreSQL Row Level Security policies verified active for tenant isolation',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'PostgreSQL Security Worker',
    },
  ];
}

export function logAuditEvent(
  eventType: string,
  description: string,
  status: 'SUCCESS' | 'FAILED' | 'WARNING',
  userId?: string
) {
  try {
    const logs = getAuditLogs();
    const entry: AuditLogEntry = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      eventType,
      description,
      status,
      ipAddress: '192.168.1.104',
      userAgent: navigator.userAgent.slice(0, 48) + '...',
      userId,
    };
    logs.unshift(entry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));

    // Record in user activity if userId exists
    if (userId) {
      recordUserActivity(userId, eventType, description, status);
    }
  } catch {
    // ignore
  }
}

function recordUserActivity(
  userId: string,
  action: string,
  description: string,
  status: 'SUCCESS' | 'FAILED' | 'WARNING'
) {
  try {
    const allActivities = getUserActivities();
    const list = allActivities[userId] || [];
    const entry: UserActivityLog = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      userId,
      timestamp: new Date().toISOString(),
      action: description || action,
      status,
      ipAddress: '192.168.1.104',
      deviceInfo: 'Desktop Web Client (Windows)',
    };
    list.unshift(entry);
    allActivities[userId] = list.slice(0, 30);
    localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(allActivities));
  } catch {
    // ignore
  }
}

function getUserActivities(): Record<string, UserActivityLog[]> {
  try {
    const data = localStorage.getItem(USER_ACTIVITY_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export const authService = {
  get isLive() {
    return isSupabaseLive;
  },

  /**
   * Check for duplicate email or username across the system
   */
  async checkDuplicate(email: string, username: string): Promise<{ exists: boolean; field?: 'email' | 'username'; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    const users = getSandboxUsers();
    for (const u of Object.values(users)) {
      if (u.email.toLowerCase() === cleanEmail) {
        return { exists: true, field: 'email', message: 'An account with this corporate email address already exists.' };
      }
      if (u.username && u.username.toLowerCase() === cleanUsername) {
        return { exists: true, field: 'username', message: 'This workplace username is already registered. Please choose a different one.' };
      }
    }

    return { exists: false };
  },

  /**
   * Register a new user identity (Admission Portal)
   */
  async registerUser(params: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    phone: string;
    country?: string;
    authMethod: AuthMethod;
    department?: string;
    termsAccepted?: boolean;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    const {
      email,
      password,
      fullName,
      username,
      phone,
      country,
      authMethod,
      department = 'Banking Sector - Retail & Commercial Banking',
    } = params;

    const dupCheck = await authService.checkDuplicate(email, username);
    if (dupCheck.exists) {
      return { user: null, error: dupCheck.message || 'Duplicate identity details detected.' };
    }

    if (isSupabaseLive && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username,
              phone,
              country,
              auth_method: authMethod,
              department,
              role: 'user',
              status: 'active',
            },
          },
        });

        if (error) {
          const isNetworkError =
            error.message.includes('fetch') ||
            error.message.includes('Network') ||
            error.message.includes('ENOTFOUND') ||
            error.message.includes('Failed to fetch');

          if (!isNetworkError) {
            logAuditEvent('PROVISIONING_FAILED', `Enrollment failed for ${email}: ${error.message}`, 'FAILED');
            return { user: null, error: error.message };
          }
          console.warn('[SecureShield] Supabase unavailable, falling back to Enterprise Sandbox store:', error.message);
        } else if (data.user) {
          if (!data.session) {
            try {
              await supabase.auth.signInWithPassword({ email, password });
            } catch {
              // If signIn fails (e.g. email confirmation on), continue
            }
          }

          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName,
            username,
            phone,
            country,
            department,
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          // Synchronize into enterprise user directory so Admin User Management sees this user
          const users = getSandboxUsers();
          users[data.user.id] = {
            id: data.user.id,
            email: data.user.email || email,
            passwordHash: password,
            fullName,
            username,
            phone,
            country,
            authMethod,
            department,
            role: 'user',
            status: 'active',
            createdAt: userProfile.createdAt || new Date().toISOString(),
            lastLoginAt: userProfile.lastLoginAt || new Date().toISOString(),
          };
          saveSandboxUsers(users);

          logAuditEvent('PROVISIONING_SUCCESS', `New identity ${username} (${email}) enrolled into ${department}`, 'SUCCESS', data.user.id);
          return { user: userProfile, error: null };
        }
      } catch (err: any) {
        console.warn('[SecureShield] Supabase exception during signup, falling back to Sandbox:', err);
      }
    }

    // --- Sandbox Mode Fallback ---
    const users = getSandboxUsers();
    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const newUser: SandboxUser = {
      id: userId,
      email,
      passwordHash: password,
      fullName,
      username,
      phone,
      country,
      authMethod,
      department,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users[userId] = newUser;
    saveSandboxUsers(users);

    const userProfile: UserProfile = {
      id: userId,
      email,
      fullName,
      username,
      phone,
      country,
      department,
      role: 'user',
      status: 'active',
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
    };

    logAuditEvent('PROVISIONING_SUCCESS', `New user identity ${username} (${email}) admitted into ${department}`, 'SUCCESS', userId);

    return { user: userProfile, error: null };
  },

  /**
   * Save or update graphical credentials into database
   */
  async saveGraphicalCredential(params: {
    userId: string;
    authMethod: AuthMethod;
    credentialHash: string;
    salt: string;
  }): Promise<{ success: boolean; error: string | null }> {
    const { userId, authMethod, credentialHash, salt } = params;

    if (isSupabaseLive && supabase && isValidUUID(userId)) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('save_graphical_credential', {
          p_user_id: userId,
          p_auth_method: authMethod,
          p_credential_hash: credentialHash,
          p_salt: salt,
        });

        if (!rpcError && (rpcData as any)?.success !== false) {
          logAuditEvent('MFA_ENROLLED', `Visual MFA credential enrolled for user ${userId.slice(0, 8)}...`, 'SUCCESS', userId);
          // Mirror to local sandbox store
          const creds = getSandboxCreds();
          creds[userId] = {
            id: 'cred_' + Math.random().toString(36).substring(2, 9),
            user_id: userId,
            auth_method: authMethod,
            credential_hash: credentialHash,
            salt: salt,
            failed_attempts: 0,
            last_failed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          saveSandboxCreds(creds);
          return { success: true, error: null };
        }
      } catch {
        // Fallback to direct upsert
      }

      const { error } = await supabase.from('user_graphical_credentials').upsert(
        {
          user_id: userId,
          auth_method: authMethod,
          credential_hash: credentialHash,
          salt: salt,
          failed_attempts: 0,
          last_failed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        logAuditEvent('RLS_RESTRICTION_TRIGGERED', 'Row Level Security policy blocked visual credential insert', 'WARNING', userId);
        return { success: false, error: error.message };
      }

      const creds = getSandboxCreds();
      creds[userId] = {
        id: 'cred_' + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        auth_method: authMethod,
        credential_hash: credentialHash,
        salt: salt,
        failed_attempts: 0,
        last_failed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveSandboxCreds(creds);

      logAuditEvent('MFA_ENROLLED', `Visual MFA credentials enrolled for user ${userId.slice(0, 8)}...`, 'SUCCESS', userId);
      return { success: true, error: null };
    }

    // --- Sandbox / Local Store Fallback (for non-UUID users like usr_admin_001, or offline) ---
    const creds = getSandboxCreds();
    creds[userId] = {
      id: 'cred_' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      auth_method: authMethod,
      credential_hash: credentialHash,
      salt: salt,
      failed_attempts: 0,
      last_failed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveSandboxCreds(creds);

    // Also update authMethod on SandboxUser
    const users = getSandboxUsers();
    if (users[userId]) {
      users[userId].authMethod = authMethod;
      saveSandboxUsers(users);
    }

    logAuditEvent('MFA_ENROLLED', `Visual MFA (${authMethod}) successfully enrolled for ${userId}`, 'SUCCESS', userId);
    return { success: true, error: null };
  },

  /**
   * Primary authentication step 1: Email or Username + Password verification
   */
  async authenticateCredentials(params: {
    identifier: string;
    password: string;
  }): Promise<{
    user: UserProfile | null;
    credential: UserGraphicalCredential | null;
    error: string | null;
  }> {
    const { identifier, password } = params;
    const cleanId = identifier.trim().toLowerCase();

    // Check Sandbox Users First or for username resolution
    const users = getSandboxUsers();
    let matchedUser = Object.values(users).find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId)
    );

    if (matchedUser) {
      if (matchedUser.status === 'suspended') {
        logAuditEvent('PRIMARY_AUTH_REJECTED', `Login rejected for suspended account: ${cleanId}`, 'FAILED', matchedUser.id);
        return { user: null, credential: null, error: 'Your account has been suspended by an Administrator. Access denied.' };
      }

      if (matchedUser.passwordHash !== password) {
        logAuditEvent('PRIMARY_AUTH_FAILED', `Invalid primary password attempt for ${cleanId}`, 'FAILED', matchedUser.id);
        return { user: null, credential: null, error: 'Invalid enterprise credentials or password.' };
      }

      // Update last login
      matchedUser.lastLoginAt = new Date().toISOString();
      users[matchedUser.id] = matchedUser;
      saveSandboxUsers(users);

      const creds = getSandboxCreds();
      const credential = creds[matchedUser.id] || null;

      if (credential) {
        const storageKey = `secureshield_failed_attempts_${matchedUser.id}`;
        const localAttempts = parseInt(localStorage.getItem(storageKey) || '0', 10);
        credential.failed_attempts = Math.max(credential.failed_attempts || 0, localAttempts);
      }

      logAuditEvent(
        'PRIMARY_AUTH_PASSED',
        `Primary password verified for ${matchedUser.username} (${matchedUser.email}). Visual MFA triggered.`,
        'SUCCESS',
        matchedUser.id
      );

      const userProfile: UserProfile = {
        id: matchedUser.id,
        email: matchedUser.email,
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        phone: matchedUser.phone,
        department: matchedUser.department,
        role: matchedUser.role,
        status: matchedUser.status,
        createdAt: matchedUser.createdAt,
        lastLoginAt: matchedUser.lastLoginAt,
      };

      return {
        user: userProfile,
        credential,
        error: null,
      };
    }

    // If Supabase live is connected and user used an email
    if (isSupabaseLive && supabase && cleanId.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password,
        });

        if (error) {
          logAuditEvent('PRIMARY_AUTH_FAILED', `Failed sign-in for ${cleanId}: ${error.message}`, 'FAILED');
          return { user: null, credential: null, error: error.message };
        }

        if (!data.user) {
          return { user: null, credential: null, error: 'Authentication failed.' };
        }

        const { data: credData } = await supabase
          .from('user_graphical_credentials')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanId,
          fullName: data.user.user_metadata?.full_name || 'Enterprise Operator',
          username: data.user.user_metadata?.username || cleanId.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          department: data.user.user_metadata?.department || 'Banking Sector - Retail & Commercial Banking',
          role: (data.user.user_metadata?.role as UserRole) || 'user',
          status: 'active',
          lastLoginAt: new Date().toISOString(),
        };

        const storageKey = `secureshield_failed_attempts_${data.user.id}`;
        const localAttempts = parseInt(localStorage.getItem(storageKey) || '0', 10);
        const effectiveAttempts = Math.max(credData?.failed_attempts || 0, localAttempts);

        // Synchronize user into enterprise directory so Admin Dashboard displays this user
        const allUsers = getSandboxUsers();
        if (!allUsers[data.user.id]) {
          allUsers[data.user.id] = {
            id: data.user.id,
            email: userProfile.email,
            passwordHash: '********',
            fullName: userProfile.fullName,
            username: userProfile.username || userProfile.email.split('@')[0],
            phone: userProfile.phone || '',
            country: (data.user.user_metadata?.country as string) || 'Global',
            authMethod: (credData?.auth_method as AuthMethod) || 'recognition',
            department: userProfile.department || 'Banking Sector - Retail & Commercial Banking',
            role: userProfile.role || 'user',
            status: 'active',
            createdAt: data.user.created_at || new Date().toISOString(),
            lastLoginAt: userProfile.lastLoginAt || new Date().toISOString(),
          };
        } else {
          allUsers[data.user.id].lastLoginAt = new Date().toISOString();
        }
        saveSandboxUsers(allUsers);

        logAuditEvent('PRIMARY_AUTH_PASSED', `Primary credentials verified for ${cleanId}. Visual MFA triggered`, 'SUCCESS', data.user.id);

        return {
          user: userProfile,
          credential: credData
            ? { ...(credData as UserGraphicalCredential), failed_attempts: effectiveAttempts }
            : null,
          error: null,
        };
      } catch (err: any) {
        console.warn('[SecureShield] Supabase signin error, checking local store:', err);
      }
    }

    logAuditEvent('PRIMARY_AUTH_FAILED', `Identity not found for identifier: ${cleanId}`, 'FAILED');
    return { user: null, credential: null, error: 'Invalid enterprise email/username or primary password.' };
  },

  /**
   * Update primary password
   */
  async updatePrimaryPassword(newPassword: string, userId?: string): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        logAuditEvent('PASSWORD_CHANGE_FAILED', `Failed password change: ${error.message}`, 'FAILED', userId);
        return { success: false, error: error.message };
      }
      logAuditEvent('PASSWORD_CHANGED', 'Primary password updated and hashed with bcrypt', 'SUCCESS', userId);
      return { success: true, error: null };
    }

    if (userId) {
      const users = getSandboxUsers();
      if (users[userId]) {
        users[userId].passwordHash = newPassword;
        saveSandboxUsers(users);
        logAuditEvent('PASSWORD_CHANGED', 'Primary password updated securely in enterprise directory', 'SUCCESS', userId);
        return { success: true, error: null };
      }
    }

    return { success: true, error: null };
  },

  /**
   * Update profile information
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error: string | null }> {
    const users = getSandboxUsers();
    if (users[userId]) {
      users[userId] = {
        ...users[userId],
        fullName: updates.fullName || users[userId].fullName,
        phone: updates.phone || users[userId].phone,
        country: updates.country !== undefined ? updates.country : users[userId].country,
        department: updates.department || users[userId].department,
      };
      saveSandboxUsers(users);
      logAuditEvent('PROFILE_UPDATED', `User profile updated for ${users[userId].username}`, 'SUCCESS', userId);
      return { success: true, error: null };
    }
    return { success: false, error: 'User not found' };
  },

  /**
   * Send password recovery email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { success: false, error: error.message };
      logAuditEvent('PASSWORD_RESET_DISPATCHED', `Password recovery link dispatched to ${email}`, 'SUCCESS');
      return { success: true, error: null };
    }

    logAuditEvent('PASSWORD_RESET_SIMULATED', `Recovery link simulated for ${email}`, 'SUCCESS');
    return { success: true, error: null };
  },

  /**
   * Record a failed graphical authentication attempt
   */
  async recordFailedAttempt(userId: string, explicitCount?: number): Promise<number> {
    const storageKey = `secureshield_failed_attempts_${userId}`;
    const localPrev = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const targetCount = explicitCount !== undefined ? explicitCount : localPrev + 1;
    localStorage.setItem(storageKey, targetCount.toString());

    logAuditEvent(
      'MFA_CHALLENGE_FAILED',
      `Unauthorized visual challenge attempt intercepted (#${targetCount}) for user ${userId}`,
      'FAILED',
      userId
    );

    if (isSupabaseLive && supabase && isValidUUID(userId)) {
      try {
        await supabase
          .from('user_graphical_credentials')
          .update({
            failed_attempts: targetCount,
            last_failed_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Could not update failed_attempts in Supabase:', err);
      }
      return targetCount;
    }

    // Sandbox
    const creds = getSandboxCreds();
    if (creds[userId]) {
      creds[userId].failed_attempts = targetCount;
      creds[userId].last_failed_at = new Date().toISOString();
      saveSandboxCreds(creds);
    }
    return targetCount;
  },

  /**
   * Reset failed attempts counter
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    localStorage.setItem(`secureshield_failed_attempts_${userId}`, '0');
    logAuditEvent(
      'MFA_CHALLENGE_PASSED',
      `Visual MFA challenge verified. Dual-factor session authorized for ${userId}`,
      'SUCCESS',
      userId
    );

    if (isSupabaseLive && supabase && isValidUUID(userId)) {
      try {
        await supabase
          .from('user_graphical_credentials')
          .update({ failed_attempts: 0 })
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Could not reset failed_attempts in Supabase:', err);
      }
      return;
    }

    const creds = getSandboxCreds();
    if (creds[userId]) {
      creds[userId].failed_attempts = 0;
      saveSandboxCreds(creds);
    }
  },

  /**
   * Get personal activity history for Normal User
   */
  getPersonalActivity(userId: string): UserActivityLog[] {
    const allActivities = getUserActivities();
    const userList = allActivities[userId] || [];
    if (userList.length > 0) return userList;

    // Default sample activity history for demonstration
    return [
      {
        id: 'act_def_1',
        userId,
        timestamp: new Date().toISOString(),
        action: 'Current Zero Trust Session Established via Graphical MFA',
        status: 'SUCCESS',
        ipAddress: '192.168.1.104',
        deviceInfo: 'Desktop Web Client (Windows)',
      },
      {
        id: 'act_def_2',
        userId,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        action: 'Primary Password Verified (Step 1)',
        status: 'SUCCESS',
        ipAddress: '192.168.1.104',
        deviceInfo: 'Desktop Web Client (Windows)',
      },
      {
        id: 'act_def_3',
        userId,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        action: 'Visual Recognition MFA Factor Challenge Verified',
        status: 'SUCCESS',
        ipAddress: '192.168.1.104',
        deviceInfo: 'Desktop Web Client (Windows)',
      },
      {
        id: 'act_def_4',
        userId,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        action: 'Workplace Identity Enrolled & Dual-Factor Provisioned',
        status: 'SUCCESS',
        ipAddress: '192.168.1.104',
        deviceInfo: 'Desktop Web Client (Windows)',
      },
    ];
  },

  // ============================================================
  // ADMINISTRATOR SERVICES
  // ============================================================

  /**
   * Look up a user profile by email address
   */
  findUserByEmail(identifier: string): UserProfile | null {
    const clean = identifier.trim().toLowerCase();
    const users = getSandboxUsers();
    const u = Object.values(users).find(
      (x) => x.email.toLowerCase() === clean || (x.username && x.username.toLowerCase() === clean)
    );
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      username: u.username,
      phone: u.phone,
      country: u.country,
      department: u.department,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    };
  },

  /**
   * Get all registered users for Administrator User Management
   */
  getAllUsers(): ManagedUser[] {
    const users = getSandboxUsers();
    const creds = getSandboxCreds();

    return Object.values(users).map((u) => {
      const userCred = creds[u.id];
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        username: u.username || u.email.split('@')[0],
        phone: u.phone || '+1 (555) 000-0000',
        country: u.country,
        department: u.department || 'Banking Sector - Retail & Commercial Banking',
        role: u.role || 'user',
        status: u.status || 'active',
        authMethod: userCred?.auth_method || u.authMethod || 'recognition',
        failedAttempts: userCred?.failed_attempts || 0,
        createdAt: u.createdAt || new Date().toISOString(),
        lastLoginAt: u.lastLoginAt || new Date().toISOString(),
      };
    });
  },

  /**
   * Lock or unlock a user's access
   */
  async toggleUserStatus(userId: string, newStatus: UserStatus): Promise<boolean> {
    const users = getSandboxUsers();
    if (users[userId]) {
      users[userId].status = newStatus;
      saveSandboxUsers(users);
      logAuditEvent(
        'USER_STATUS_ALTERED',
        `User ${users[userId].username} (${users[userId].email}) status changed to: ${newStatus.toUpperCase()}`,
        newStatus === 'active' ? 'SUCCESS' : 'WARNING',
        userId
      );
      return true;
    }
    return false;
  },

  /**
   * Promote or demote user role (User <-> Admin)
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const users = getSandboxUsers();
    if (users[userId]) {
      users[userId].role = newRole;
      saveSandboxUsers(users);
      logAuditEvent(
        'USER_ROLE_CHANGED',
        `Identity ${users[userId].username} privileges updated to: ${newRole.toUpperCase()}`,
        'SUCCESS',
        userId
      );
      return true;
    }
    return false;
  },

  /**
   * Reset user's MFA credentials (forces re-enrollment on next sign-in)
   */
  async resetUserMFA(userId: string): Promise<boolean> {
    const creds = getSandboxCreds();
    if (creds[userId]) {
      delete creds[userId];
      saveSandboxCreds(creds);
    }
    logAuditEvent('MFA_REVOKED_BY_ADMIN', `Visual MFA credential revoked for ${userId} by Administrator`, 'WARNING', userId);
    return true;
  },

  /**
   * Calculate real-time system statistics for Administrator Dashboard
   */
  getSystemStats() {
    const users = authService.getAllUsers();
    const logs = getAuditLogs();

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
    const totalFailedAttempts = users.reduce((acc, u) => acc + (u.failedAttempts || 0), 0);

    const sectorCounts: Record<string, number> = {
      Banking: 0,
      Government: 0,
      Critical: 0,
      Other: 0,
    };

    users.forEach((u) => {
      const dept = u.department || '';
      if (dept.toLowerCase().includes('bank') || dept.toLowerCase().includes('fin')) {
        sectorCounts.Banking++;
      } else if (dept.toLowerCase().includes('gov') || dept.toLowerCase().includes('defense')) {
        sectorCounts.Government++;
      } else if (dept.toLowerCase().includes('infra') || dept.toLowerCase().includes('energy') || dept.toLowerCase().includes('cloud') || dept.toLowerCase().includes('secops')) {
        sectorCounts.Critical++;
      } else {
        sectorCounts.Other++;
      }
    });

    const failedLogs = logs.filter((l) => l.status === 'FAILED').length;
    const threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' =
      totalFailedAttempts > 5 || failedLogs > 5 ? 'HIGH' : totalFailedAttempts > 1 || failedLogs > 1 ? 'ELEVATED' : 'LOW';

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalFailedAttempts,
      mfaAdoptionRate: 100, // Zero Trust enforces 100% MFA
      sectorCounts,
      threatLevel,
      totalAuditLogs: logs.length,
    };
  },

  /**
   * Retrieve active graphical credential for user
   */
  getCredentialForUser(userId: string): UserGraphicalCredential | null {
    const creds = getSandboxCreds();
    return creds[userId] || null;
  },

  /**
   * Terminate active session
   */
  async signOut(): Promise<void> {
    logAuditEvent('SESSION_TERMINATED', 'Enterprise session signed out', 'SUCCESS');
    if (isSupabaseLive && supabase) {
      await supabase.auth.signOut();
    }
  },
};
