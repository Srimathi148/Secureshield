/**
 * Internal Canary Token & Threat Deception Service
 * 
 * Provides an enterprise-grade, internal Canary Token subsystem with real backend monitoring:
 * - Supabase PostgreSQL persistence for Canary Tokens & Incidents
 * - Server-side incident creation & validation via PostgreSQL SECURITY DEFINER RPC (record_canary_incident)
 * - Row Level Security (RLS) policies protecting incident records from standard users
 * - Clean fallback to local enterprise sandbox when operating without Supabase
 * - Strictly avoids collecting or fabricating IP addresses or device fingerprints
 * - Uses only synthetic, safe, non-operational mock data for decoys
 * - Clearly distinguishes verified server-recorded incidents from sandbox simulations
 */

import type {
  InternalCanaryToken,
  InternalCanaryIncident,
  InternalCanaryTokenType,
  InternalCanarySeverity,
  InternalCanaryUserContext,
} from '../types';
import { logAuditEvent } from './authService';
import { supabase, isSupabaseLive } from '../lib/supabase';

const TOKENS_STORAGE_KEY = 'secureshield_internal_canary_tokens';
const INCIDENTS_STORAGE_KEY = 'secureshield_internal_canary_incidents';

export interface CreateInternalCanaryTokenInput {
  name: string;
  type: InternalCanaryTokenType;
  resourceDescription: string;
  targetResource: string;
  decoyData?: string;
  metadata?: Record<string, unknown>;
}

export interface TriggerInternalCanaryInput {
  tokenId: string;
  eventType?: string;
  resourceName?: string;
  severity?: InternalCanarySeverity;
  userContext?: InternalCanaryUserContext;
  summary?: string;
}

function mapSupabaseTokenToInternal(row: any): InternalCanaryToken {
  return {
    id: row.id,
    name: row.name,
    type: row.type as InternalCanaryTokenType,
    resourceDescription: row.resource_description,
    targetResource: row.target_resource,
    decoyData: row.decoy_data || '',
    enabled: Boolean(row.enabled),
    tripCount: Number(row.trip_count) || 0,
    lastTriggeredAt: row.last_triggered_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    metadata: row.metadata || {},
  };
}

function mapSupabaseIncidentToInternal(row: any): InternalCanaryIncident {
  return {
    id: row.id,
    tokenId: row.token_id,
    tokenName: row.token_name,
    tokenType: row.token_type as InternalCanaryTokenType,
    resourceName: row.resource_name || row.resource_description,
    eventType: row.event_type || 'DECOY_ACCESS',
    timestamp: row.timestamp || new Date().toISOString(),
    severity: (row.severity as InternalCanarySeverity) || 'HIGH',
    resourceDescription: row.resource_name || row.resource_description || 'Decoy Resource',
    userContext: row.user_context || undefined,
    summary: row.summary,
    origin: (row.origin as 'server' | 'sandbox') || 'server',
  };
}

export const internalCanaryService = {
  /**
   * Check if real Supabase persistence & RPC backend is currently active
   */
  isSupabasePersistenceActive(): boolean {
    return isSupabaseLive && Boolean(supabase);
  },

  /**
   * Retrieve all configured internal Canary Tokens from local cache.
   */
  getTokens(): InternalCanaryToken[] {
    try {
      const raw = localStorage.getItem(TOKENS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (t) => !['ctk_file_aws_config', 'ctk_url_admin_bypass', 'ctk_cred_sql_conn'].includes(t.id)
          );
          if (cleaned.length !== parsed.length) {
            this.saveTokens(cleaned);
          }
          return cleaned;
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Asynchronously fetch tokens from Supabase if connected, updating local cache.
   */
  async fetchTokens(): Promise<InternalCanaryToken[]> {
    if (this.isSupabasePersistenceActive() && supabase) {
      try {
        const { data, error } = await supabase
          .from('internal_canary_tokens')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          const remoteTokens = data.map(mapSupabaseTokenToInternal);
          this.saveTokens(remoteTokens);
          return remoteTokens;
        } else if (error) {
          console.warn('[SecureShield] Supabase fetch tokens query failed, using local cache:', error.message);
        }
      } catch (err: any) {
        console.warn('[SecureShield] Exception fetching tokens from Supabase:', err);
      }
    }

    return this.getTokens();
  },

  /**
   * Persist tokens to local sandbox storage.
   */
  saveTokens(tokens: InternalCanaryToken[]): void {
    try {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      // storage unavailable / quota exceeded
    }
  },

  /**
   * Find a specific Canary Token by ID.
   */
  getTokenById(id: string): InternalCanaryToken | undefined {
    return this.getTokens().find((t) => t.id === id);
  },

  /**
   * Create a new unique Canary Token.
   * Persists to local store immediately and synchronizes to Supabase when live.
   */
  createToken(input: CreateInternalCanaryTokenInput): InternalCanaryToken {
    const tokens = this.getTokens();
    const now = new Date().toISOString();
    const id = 'ctk_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);

    const newToken: InternalCanaryToken = {
      id,
      name: input.name.trim(),
      type: input.type,
      resourceDescription: input.resourceDescription.trim(),
      targetResource: input.targetResource.trim(),
      decoyData: input.decoyData || '',
      enabled: true,
      tripCount: 0,
      lastTriggeredAt: null,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata || {},
    };

    tokens.unshift(newToken);
    this.saveTokens(tokens);

    // Sync to Supabase in background if live
    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase
        .from('internal_canary_tokens')
        .upsert({
          id: newToken.id,
          name: newToken.name,
          type: newToken.type,
          resource_description: newToken.resourceDescription,
          target_resource: newToken.targetResource,
          decoy_data: newToken.decoyData,
          enabled: newToken.enabled,
          trip_count: newToken.tripCount,
          last_triggered_at: newToken.lastTriggeredAt,
          created_at: newToken.createdAt,
          updated_at: newToken.updatedAt,
          metadata: newToken.metadata,
        })
        .then(({ error }) => {
          if (error) {
            console.warn('[SecureShield] Background token sync to Supabase failed:', error.message);
          }
        });
    }

    return newToken;
  },

  /**
   * Enable an existing Canary Token.
   */
  enableToken(id: string): boolean {
    const tokens = this.getTokens();
    const token = tokens.find((t) => t.id === id);
    if (!token) return false;

    token.enabled = true;
    token.updatedAt = new Date().toISOString();
    this.saveTokens(tokens);

    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase
        .from('internal_canary_tokens')
        .update({ enabled: true, updated_at: token.updatedAt })
        .eq('id', id);
    }
    return true;
  },

  /**
   * Disable an existing Canary Token so triggers are ignored.
   */
  disableToken(id: string): boolean {
    const tokens = this.getTokens();
    const token = tokens.find((t) => t.id === id);
    if (!token) return false;

    token.enabled = false;
    token.updatedAt = new Date().toISOString();
    this.saveTokens(tokens);

    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase
        .from('internal_canary_tokens')
        .update({ enabled: false, updated_at: token.updatedAt })
        .eq('id', id);
    }
    return true;
  },

  /**
   * Reset test tokens back to 0 trip count.
   */
  resetTestTokens(): InternalCanaryToken[] {
    const tokens = this.getTokens().map((t) => ({
      ...t,
      tripCount: 0,
      lastTriggeredAt: null,
      enabled: true,
      updatedAt: new Date().toISOString(),
    }));
    this.saveTokens(tokens);

    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase
        .from('internal_canary_tokens')
        .update({ trip_count: 0, last_triggered_at: null, enabled: true, updated_at: new Date().toISOString() })
        .neq('id', '');
    }
    return [...tokens];
  },

  /**
   * Clear all Canary Tokens from storage.
   */
  clearAllTokens(): void {
    this.saveTokens([]);
    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase.from('internal_canary_tokens').delete().neq('id', '');
    }
  },

  /**
   * Delete a Canary Token.
   */
  deleteToken(id: string): boolean {
    const tokens = this.getTokens();
    const filtered = tokens.filter((t) => t.id !== id);
    if (filtered.length === tokens.length) return false;

    this.saveTokens(filtered);

    if (this.isSupabasePersistenceActive() && supabase) {
      void supabase.from('internal_canary_tokens').delete().eq('id', id);
    }
    return true;
  },

  /**
   * Synchronize all local tokens into Supabase PostgreSQL table.
   */
  async syncTokensToSupabase(): Promise<{ count: number; error?: string }> {
    if (!this.isSupabasePersistenceActive() || !supabase) {
      return { count: 0, error: 'Supabase backend not connected' };
    }

    const tokens = this.getTokens();
    if (tokens.length === 0) return { count: 0 };

    try {
      const payload = tokens.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        resource_description: t.resourceDescription,
        target_resource: t.targetResource,
        decoy_data: t.decoyData || '',
        enabled: t.enabled,
        trip_count: t.tripCount,
        last_triggered_at: t.lastTriggeredAt,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
        metadata: t.metadata || {},
      }));

      const { error } = await supabase.from('internal_canary_tokens').upsert(payload, { onConflict: 'id' });
      if (error) {
        return { count: 0, error: error.message };
      }
      return { count: tokens.length };
    } catch (err: any) {
      return { count: 0, error: err.message || 'Token sync error' };
    }
  },

  // ==========================================================================
  // Incident Detection & Recording (Real Supabase RPC + Sandbox Fallback)
  // ==========================================================================

  /**
   * Retrieve all recorded internal Canary Incidents from local cache.
   */
  getIncidents(): InternalCanaryIncident[] {
    try {
      const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Asynchronously fetch incidents from Supabase if connected, merging with local store.
   */
  async fetchIncidents(): Promise<InternalCanaryIncident[]> {
    if (this.isSupabasePersistenceActive() && supabase) {
      try {
        const { data, error } = await supabase
          .from('internal_canary_incidents')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data && Array.isArray(data)) {
          const serverIncidents = data.map(mapSupabaseIncidentToInternal);
          // Retain any offline sandbox incidents that haven't expired
          const localOnly = this.getIncidents().filter(
            (i) => i.origin === 'sandbox' && !serverIncidents.some((s) => s.id === i.id)
          );
          const merged = [...serverIncidents, ...localOnly].slice(0, 100);
          this.saveIncidents(merged);
          return merged;
        } else if (error) {
          console.warn('[SecureShield] Supabase fetch incidents query failed, falling back to local store:', error.message);
        }
      } catch (err: any) {
        console.warn('[SecureShield] Exception fetching incidents from Supabase:', err);
      }
    }

    return this.getIncidents();
  },

  /**
   * Persist incidents to local storage cache.
   */
  saveIncidents(incidents: InternalCanaryIncident[]): void {
    try {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
    } catch {
      // ignore
    }
  },

  /**
   * Find an incident by ID.
   */
  getIncidentById(id: string): InternalCanaryIncident | undefined {
    return this.getIncidents().find((i) => i.id === id);
  },

  /**
   * Trigger an internal Canary Token.
   * 
   * Uses real backend monitoring via Supabase RPC `record_canary_incident` when connected:
   * - Validates token existence and enabled status on the database server
   * - Updates token trip count atomically on the database server
   * - Generates server-side unique incident record with verified timestamp
   * - Restricts direct access via Row Level Security (RLS)
   * - Records authenticated user context without fabricating IP addresses or fingerprints
   * 
   * When operating in sandbox mode, validates and records locally with origin = 'sandbox'.
   */
  async triggerToken(input: TriggerInternalCanaryInput): Promise<InternalCanaryIncident | null> {
    const eventType = input.eventType || 'DECOY_ACCESS';
    const severity = input.severity || 'HIGH';

    // 1. Attempt Server-Side RPC Execution in Supabase
    if (this.isSupabasePersistenceActive() && supabase) {
      try {
        const { data, error } = await supabase.rpc('record_canary_incident', {
          p_token_id: input.tokenId,
          p_event_type: eventType,
          p_severity: severity,
          p_summary: input.summary || null,
          p_user_context: input.userContext || {},
        });

        if (!error && data && data.success && data.incident) {
          const serverIncident = mapSupabaseIncidentToInternal(data.incident);

          // Update local token stats
          const tokens = this.getTokens();
          const token = tokens.find((t) => t.id === input.tokenId);
          if (token) {
            token.tripCount += 1;
            token.lastTriggeredAt = serverIncident.timestamp;
            token.updatedAt = serverIncident.timestamp;
            this.saveTokens(tokens);
          }

          // Cache incident locally
          const incidents = this.getIncidents();
          incidents.unshift(serverIncident);
          this.saveIncidents(incidents.slice(0, 100));

          // Log in security audit trail
          logAuditEvent(
            'CANARY_TOKEN_TRIGGERED',
            `[${serverIncident.severity}] [SERVER MONITOR] ${serverIncident.summary} (Token: ${serverIncident.tokenId}, Incident: ${serverIncident.id})`,
            'WARNING',
            input.userContext?.userId
          );

          return serverIncident;
        } else if (error) {
          console.warn('[SecureShield] Supabase record_canary_incident RPC failed, falling back to local sandbox:', error.message);
        }
      } catch (err: any) {
        console.warn('[SecureShield] Exception executing canary RPC, falling back to local sandbox:', err);
      }
    }

    // 2. Local Enterprise Sandbox Fallback
    const tokens = this.getTokens();
    const token = tokens.find((t) => t.id === input.tokenId);

    // If token does not exist or is disabled, do not record a trip
    if (!token || !token.enabled) {
      return null;
    }

    const now = new Date().toISOString();

    // Update local token
    token.tripCount += 1;
    token.lastTriggeredAt = now;
    token.updatedAt = now;
    this.saveTokens(tokens);

    // Generate unique local incident ID
    const incidentId = 'inc_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
    const summary =
      input.summary ||
      `Internal Canary Token '${token.name}' triggered on resource [${token.resourceDescription}].`;

    const sandboxIncident: InternalCanaryIncident = {
      id: incidentId,
      tokenId: token.id,
      tokenName: token.name,
      tokenType: token.type,
      resourceName: input.resourceName || token.targetResource,
      eventType,
      timestamp: now,
      severity,
      resourceDescription: token.resourceDescription,
      userContext: input.userContext,
      summary,
      origin: 'sandbox',
    };

    const incidents = this.getIncidents();
    incidents.unshift(sandboxIncident);
    this.saveIncidents(incidents.slice(0, 100));

    logAuditEvent(
      'CANARY_TOKEN_TRIGGERED',
      `[${sandboxIncident.severity}] [SANDBOX SIMULATION] ${summary} (Token: ${token.id}, Incident: ${sandboxIncident.id})`,
      'WARNING',
      input.userContext?.userId
    );

    return sandboxIncident;
  },

  /**
   * Clear all recorded incidents (useful for testing and SOC maintenance).
   */
  async clearIncidents(): Promise<void> {
    if (this.isSupabasePersistenceActive() && supabase) {
      try {
        await supabase.from('internal_canary_incidents').delete().neq('id', '');
      } catch (err) {
        console.warn('[SecureShield] Could not clear Supabase incidents table:', err);
      }
    }

    try {
      localStorage.removeItem(INCIDENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
