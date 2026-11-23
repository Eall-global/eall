/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DEFAULT_LOCATIONS,
  DEFAULT_COUNTRY_SLUG,
  LOCATIONS_CACHE_KEY,
  PREFERRED_COUNTRY_KEY,
  GEO_DETECTED_CACHE_KEY,
  TIMEZONE_TO_COUNTRY_CODE,
  normalizeLocationConfig,
  fetchLocationsConfig,
  convertAedToLocalPrice,
  formatLocalMoney,
  extractCountrySlugFromPath,
  stripCountryPrefix,
  buildCountryPath,
} from "../config/locationsConfig";

const CountryContext = createContext(null);
const GEO_DISMISS_KEY = "eall_geo_banner_dismissed";

const readInitialLocations = () => {
  try {
    const raw = localStorage.getItem(LOCATIONS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeLocationConfig);
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCATIONS.map(normalizeLocationConfig);
};

const detectTimezoneCountryCode = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY_CODE[tz]) {
      return TIMEZONE_TO_COUNTRY_CODE[tz];
    }
  } catch {
    // ignore
  }
  return null;
};

export const CountryProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [allLocations, setAllLocations] = useState(readInitialLocations);
  const [detectedCode, setDetectedCode] = useState(() => {
    try {
      const cached = sessionStorage.getItem(GEO_DETECTED_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // ignore
    }
    return detectTimezoneCountryCode();
  });
  const [geoBannerDismissed, setGeoBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(GEO_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Sync locations registry from Firestore
  const refreshLocations = useCallback(async () => {
    try {
      const fresh = await fetchLocationsConfig();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setAllLocations(fresh);
      }
    } catch {
      // fallback to cache/default
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchLocationsConfig()
      .then((fresh) => {
        if (active && Array.isArray(fresh) && fresh.length > 0) {
          setAllLocations(fresh);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Lightweight non-blocking IP Geolocation lookup (once per browser session)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(GEO_DETECTED_CACHE_KEY)) return;
    } catch {
      // ignore
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);

    fetch("https://api.country.is/", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.country) return;
        const iso2 = String(data.country).trim().toUpperCase();
        if (iso2.length === 2) {
          setDetectedCode(iso2);
          try {
            sessionStorage.setItem(GEO_DETECTED_CACHE_KEY, iso2);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Offline or blocked — timezone fallback already active
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const publicCountries = useMemo(
    () =>
      allLocations
        .filter((l) => l.isActive !== false && l.isPublicStorefront)
        .sort((a, b) => (a.sortOrder ?? 50) - (b.sortOrder ?? 50)),
    [allLocations]
  );

  const supplyHubs = useMemo(
    () =>
      allLocations
        .filter((l) => l.isActive !== false && l.isSupplyHub)
        .sort((a, b) => (a.sortOrder ?? 50) - (b.sortOrder ?? 50)),
    [allLocations]
  );

  const validPublicSlugs = useMemo(
    () => publicCountries.map((c) => c.slug),
    [publicCountries]
  );

  // Determine active country slug: URL prefix -> saved preference -> detected IP -> default "ae"
  const urlSlug = useMemo(
    () => extractCountrySlugFromPath(location.pathname, validPublicSlugs),
    [location.pathname, validPublicSlugs]
  );

  const [savedPreferredSlug, setSavedPreferredSlug] = useState(() => {
    try {
      return localStorage.getItem(PREFERRED_COUNTRY_KEY) || null;
    } catch {
      return null;
    }
  });

  // Whenever user lands on a valid /:countrySlug URL, remember it as their active preference
  useEffect(() => {
    if (!urlSlug) return;
    try {
      localStorage.setItem(PREFERRED_COUNTRY_KEY, urlSlug);
    } catch {
      // ignore
    }
  }, [urlSlug]);

  const preferredSlug = useMemo(() => {
    if (urlSlug && validPublicSlugs.includes(urlSlug)) {
      return urlSlug;
    }
    try {
      const latestSaved = localStorage.getItem(PREFERRED_COUNTRY_KEY) || savedPreferredSlug;
      if (latestSaved && validPublicSlugs.includes(latestSaved.toLowerCase())) {
        return latestSaved.toLowerCase();
      }
    } catch {
      if (savedPreferredSlug && validPublicSlugs.includes(savedPreferredSlug.toLowerCase())) {
        return savedPreferredSlug.toLowerCase();
      }
    }
    if (detectedCode) {
      const match = publicCountries.find((c) => c.code === detectedCode);
      if (match) return match.slug;
    }
    return DEFAULT_COUNTRY_SLUG;
  }, [urlSlug, savedPreferredSlug, validPublicSlugs, detectedCode, publicCountries]);

  const activeCountry = useMemo(() => {
    const targetSlug = urlSlug || preferredSlug || DEFAULT_COUNTRY_SLUG;
    return (
      publicCountries.find((c) => c.slug === targetSlug) ||
      publicCountries.find((c) => c.slug === DEFAULT_COUNTRY_SLUG) ||
      DEFAULT_LOCATIONS[0]
    );
  }, [urlSlug, preferredSlug, publicCountries]);

  // Detected country suggestion (shown when visitor IP matches a supported country different from URL)
  const detectedCountry = useMemo(() => {
    if (geoBannerDismissed || !detectedCode) return null;
    const match = publicCountries.find((c) => c.code === detectedCode);
    if (!match || match.code === activeCountry.code) return null;
    return match;
  }, [geoBannerDismissed, detectedCode, publicCountries, activeCountry.code]);

  const dismissGeoBanner = useCallback(() => {
    setGeoBannerDismissed(true);
    try {
      sessionStorage.setItem(GEO_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const switchCountry = useCallback(
    (targetSlugOrCode) => {
      const target = publicCountries.find(
        (c) =>
          c.slug === String(targetSlugOrCode || "").toLowerCase() ||
          c.code === String(targetSlugOrCode || "").toUpperCase()
      );
      if (!target) return;

      setSavedPreferredSlug(target.slug);
      try {
        localStorage.setItem(PREFERRED_COUNTRY_KEY, target.slug);
      } catch {
        // ignore
      }

      const isPortalRoute =
        location.pathname === "/portal" ||
        location.pathname.endsWith("/portal");
      if (isPortalRoute) {
        navigate(`/${target.slug}/portal`, { replace: false });
        return;
      }

      const stripped = stripCountryPrefix(location.pathname, validPublicSlugs);
      const nextPath =
        stripped === "/" ? `/${target.slug}` : `/${target.slug}${stripped}`;
      navigate(`${nextPath}${location.search || ""}`, { replace: false });
    },
    [publicCountries, location.pathname, location.search, validPublicSlugs, navigate]
  );

  const countryPath = useCallback(
    (targetPath = "/") =>
      buildCountryPath(targetPath, activeCountry.slug, validPublicSlugs),
    [activeCountry.slug, validPublicSlugs]
  );

  const convertPrice = useCallback(
    (aedAmount, explicitLocalPrice = 0) =>
      convertAedToLocalPrice(aedAmount, activeCountry, explicitLocalPrice),
    [activeCountry]
  );

  const formatPrice = useCallback(
    (amount) => formatLocalMoney(amount, activeCountry),
    [activeCountry]
  );

  const getLocationByCode = useCallback(
    (code) =>
      allLocations.find(
        (l) =>
          l.code === String(code || "").toUpperCase() ||
          l.slug === String(code || "").toLowerCase()
      ) || activeCountry,
    [allLocations, activeCountry]
  );

  const value = useMemo(
    () => ({
      allLocations,
      publicCountries,
      supplyHubs,
      validPublicSlugs,
      activeCountry,
      countryCode: activeCountry.code,
      countrySlug: activeCountry.slug,
      urlCountrySlug: urlSlug,
      preferredCountrySlug: preferredSlug,
      detectedCountry,
      dismissGeoBanner,
      switchCountry,
      countryPath,
      convertPrice,
      formatPrice,
      getLocationByCode,
      refreshLocations,
    }),
    [
      allLocations,
      publicCountries,
      supplyHubs,
      validPublicSlugs,
      activeCountry,
      urlSlug,
      preferredSlug,
      detectedCountry,
      dismissGeoBanner,
      switchCountry,
      countryPath,
      convertPrice,
      formatPrice,
      getLocationByCode,
      refreshLocations,
    ]
  );

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return ctx;
};

export const useCountryOptional = () => useContext(CountryContext);
