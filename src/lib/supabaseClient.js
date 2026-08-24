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

export const saveSupabaseConfig = (url, key) => {
  if (!url || !key) {
    localStorage.removeItem("eall_supabase_config");
    return;
  }
  const clean = sanitizeUrl(url);
  localStorage.setItem(
    "eall_supabase_config",
    JSON.stringify({ url: clean, key: key.trim() })
  );
};

export const getSupabase = () => {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && cfg.url.startsWith("https://")) {
    return createClient(cfg.url, cfg.key);
  }
  return null;
};
