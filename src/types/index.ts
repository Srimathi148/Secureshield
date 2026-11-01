export type AuthMethod = 'recognition' | 'recall';
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface GraphicalIconItem {
  id: string;
  name: string;
  category: 'Defense' | 'Cryptography' | 'Hardware' | 'Network' | 'Intelligence';
  iconKey: string;
  accent: {
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
}

export interface UserGraphicalCredential {
  id: string;
  user_id: string;
  auth_method: AuthMethod;
  credential_hash: string;
  salt: string;
  failed_attempts: number;
  last_failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  phone?: string;
  country?: string;
  department?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: UserProfile;
  method: AuthMethod;
  authenticatedAt: string;
  failedAttempts: number;
  isDemoMode: boolean;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  timestamp: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  ipAddress: string;
  deviceInfo: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phone: string;
  country?: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  authMethod: AuthMethod;
  failedAttempts: number;
  createdAt: string;
  lastLoginAt: string;
}

export type AuthView = 
  | 'login-credentials'
  | 'login-graphical'
  | 'register'
  | 'registration-success'
  | 'setup-graphical'
  | 'dashboard';

// ============================================================================
// Internal Canary Token & Incident Interfaces (Phase 1)
// ============================================================================

export type InternalCanaryTokenType = 'file' | 'url' | 'credential' | 'custom';
export type InternalCanarySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InternalCanaryUserContext {
  userId?: string;
  email?: string;
  username?: string;
  role?: string;
  action?: string;
  channel?: string;
}

export interface InternalCanaryToken {
  id: string;
  name: string;
  type: InternalCanaryTokenType;
  resourceDescription: string;
  targetResource: string;
  decoyData?: string;
  enabled: boolean;
  tripCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface InternalCanaryIncident {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenType: InternalCanaryTokenType;
  resourceName?: string;
  eventType?: string;
  timestamp: string;
  severity: InternalCanarySeverity;
  resourceDescription: string;
  userContext?: InternalCanaryUserContext;
  summary: string;
  origin: 'server' | 'sandbox';
}

export interface CorporateDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  department: string;
  uploadedAt: string;
  content: string;
  isMonitored: boolean;
  canaryTokenId?: string;
}

