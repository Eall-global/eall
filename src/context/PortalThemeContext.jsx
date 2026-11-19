import { createContext, useContext, useState, useEffect, useCallback } from "react";

const PortalThemeContext = createContext(null);

const THEME_STORAGE_KEY = "eall_portal_theme";

export const PortalThemeProvider = ({ children }) => {
  // Light is strictly the default theme; dark is only applied when explicitly selected by the user.
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota or private-mode restrictions
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const isDark = theme === "dark";

  return (
    <PortalThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
      }}
    >
      <div
        className={isDark ? "dark" : ""}
        data-portal-theme={theme}
        style={{ colorScheme: theme }}
      >
        {children}
      </div>
    </PortalThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePortalTheme = () => {
  const ctx = useContext(PortalThemeContext);
  if (!ctx) {
    throw new Error("usePortalTheme must be used within a PortalThemeProvider");
  }
  return ctx;
};
