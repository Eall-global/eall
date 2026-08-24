import { createClient } from "@supabase/supabase-js";

// Helper to sanitize URL (removes /rest/v1 or trailing slashes)
const sanitizeUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http")) return trimmed;
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }
};

// Check environment variables first, then fallback to user-saved config in localStorage
const getSupabaseConfig = () => {
  const envUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL);
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: "env" };
  }

  try {
    const stored = localStorage.getItem("eall_supabase_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      const clean = sanitizeUrl(parsed.url);
      if (clean && parsed.key) {
        return { url: clean, key: parsed.key.trim(), source: "stored" };
      }
    }
  } catch (e) {
    console.warn("Could not read stored Supabase config:", e);
  }

  return { url: null, key: null, source: "none" };
};

export const isSupabaseConfigured = () => {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.key && cfg.url.startsWith("https://"));
};

export const getActiveSupabaseConfig = () => getSupabaseConfig();

// Singleton Client Cache to prevent multiple GoTrueClient instances & WebSocket leak
let cachedClient = null;
let cachedConfigKey = null;

export const saveSupabaseConfig = (url, key) => {
  if (!url || !key) {
    localStorage.removeItem("eall_supabase_config");
  } else {
    const clean = sanitizeUrl(url);
    localStorage.setItem(
      "eall_supabase_config",
      JSON.stringify({ url: clean, key: key.trim() })
    );
  }
  // Invalidate cached client so it re-initializes with new credentials
  cachedClient = null;
  cachedConfigKey = null;
};

export const getSupabase = () => {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && cfg.url.startsWith("https://")) {
    const currentKey = `${cfg.url}:${cfg.key}`;
    if (cachedClient && cachedConfigKey === currentKey) {
      return cachedClient;
    }

    try {
      cachedClient = createClient(cfg.url, cfg.key, {
        auth: {
          persistSession: false, // We use custom PIN staff auth, prevents multiple GoTrueClient warnings
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      cachedConfigKey = currentKey;
      return cachedClient;
    } catch (e) {
      console.warn("Failed to initialize Supabase singleton:", e);
      return null;
    }
  }
  return null;
};
