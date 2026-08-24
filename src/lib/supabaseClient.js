import { createClient } from "@supabase/supabase-js";

// Check environment variables first, then fallback to user-saved config in localStorage
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: "env" };
  }

  try {
    const stored = localStorage.getItem("eall_supabase_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key, source: "stored" };
      }
    }
  } catch (e) {
    console.warn("Could not read stored Supabase config:", e);
  }

  return { url: null, key: null, source: "none" };
};

const config = getSupabaseConfig();

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
  localStorage.setItem(
    "eall_supabase_config",
    JSON.stringify({ url: url.trim(), key: key.trim() })
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(config.url, config.key)
  : null;

export const getSupabase = () => {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && cfg.url.startsWith("https://")) {
    return createClient(cfg.url, cfg.key);
  }
  return null;
};
