import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'secureshield_supabase_url';
const STORAGE_ANON_KEY = 'secureshield_supabase_anon_key';

/**
 * Normalizes Supabase URLs by stripping trailing /rest/v1 or slashes
 * and converting raw project references into full URLs.
 */
export function sanitizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('.')) {
    return `https://${url}.supabase.co`;
  }
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/auth\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Read from localStorage first, then fallback to Vite environment variables
function getInitialUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_URL_KEY);
    // Ignore stale dead demo url from previous tests
    if (stored && !stored.includes('ovzgmgkuowvbamfmmphe')) {
      return sanitizeSupabaseUrl(stored);
    }
  }
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (envUrl.includes('ovzgmgkuowvbamfmmphe')) return '';
  return sanitizeSupabaseUrl(envUrl);
}

function getInitialAnonKey(): string {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
    if (storedUrl && storedUrl.includes('ovzgmgkuowvbamfmmphe')) {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_ANON_KEY);
    } else {
      const stored = localStorage.getItem(STORAGE_ANON_KEY);
      if (stored) return stored.trim();
    }
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
}

export const isConfiguredUrl = (url: string): boolean => {
  const sanitized = sanitizeSupabaseUrl(url);
  return Boolean(
    sanitized &&
    sanitized.trim().length > 0 &&
    !sanitized.includes('your-project-ref') &&
    !sanitized.includes('ovzgmgkuowvbamfmmphe') &&
    sanitized.startsWith('https://') &&
    sanitized.includes('.supabase.co')
  );
};

export const isConfiguredKey = (key: string): boolean => {
  return Boolean(
    key &&
    key.trim().length > 20 &&
    !key.includes('your-anon-key')
  );
};

let activeUrl = getInitialUrl();
let activeKey = getInitialAnonKey();

export let isSupabaseLive = isConfiguredUrl(activeUrl) && isConfiguredKey(activeKey);

export let supabase: SupabaseClient | null = isSupabaseLive
  ? createClient(activeUrl, activeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const SUPABASE_CONFIG = {
  get url() {
    return activeUrl;
  },
  get anonKey() {
    return activeKey;
  },
  get isLive() {
    return isSupabaseLive;
  },
};

/**
 * Dynamically updates the Supabase connection in runtime
 */
export function setSupabaseCredentials(url: string, anonKey: string): boolean {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (isConfiguredUrl(cleanUrl) && isConfiguredKey(cleanKey)) {
    activeUrl = cleanUrl;
    activeKey = cleanKey;
    isSupabaseLive = true;

    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);

    supabase = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    return true;
  }
  return false;
}

/**
 * Clears custom credentials and reverts to default env configuration
 */
export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_ANON_KEY);

  activeUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
  activeKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  isSupabaseLive = isConfiguredUrl(activeUrl) && isConfiguredKey(activeKey);

  supabase = isSupabaseLive
    ? createClient(activeUrl, activeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
}

/**
 * Real-time diagnostic check against Supabase
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableFound: boolean }> {
  try {
    const cleanUrl = sanitizeSupabaseUrl(url);
    const testClient = createClient(cleanUrl, anonKey.trim(), {
      auth: {
        persistSession: false,
        storageKey: 'secureshield_test_ping',
      },
    });

    // 1. Test ping to auth endpoint
    const { error: authError } = await testClient.auth.getSession();
    if (authError && authError.message.includes('API key')) {
      return {
        success: false,
        message: `Authentication API rejected the Anon Key: ${authError.message}`,
        tableFound: false,
      };
    }

    // 2. Test database query for user_graphical_credentials table
    const { error: dbError } = await testClient
      .from('user_graphical_credentials')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      // If table doesn't exist (PGRST204 or 42P01)
      if (
        dbError.code === '42P01' ||
        dbError.message?.toLowerCase().includes('does not exist') ||
        dbError.message?.toLowerCase().includes('relation')
      ) {
        return {
          success: true,
          message: 'Connected to Supabase! However, the `user_graphical_credentials` table has not been created yet. Please execute the SQL schema below in your Supabase SQL Editor.',
          tableFound: false,
        };
      }
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase! Auth service and `user_graphical_credentials` table are active and ready.',
      tableFound: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error while attempting to reach Supabase.',
      tableFound: false,
    };
  }
}
