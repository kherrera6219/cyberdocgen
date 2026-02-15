import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const ENTERPRISE_OVERRIDE_STORAGE_KEY = "enterprise-theme-override";

interface EnterpriseThemeOverride {
  primary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  border?: string;
  ring?: string;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  enterpriseOverride: EnterpriseThemeOverride | null;
  setEnterpriseOverride: (override: EnterpriseThemeOverride | null) => void;
  clearEnterpriseOverride: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "dark";
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyEnterpriseOverride(override: EnterpriseThemeOverride | null) {
  const root = document.documentElement;
  const variableMap: Record<keyof EnterpriseThemeOverride, string> = {
    primary: "--primary",
    accent: "--accent",
    background: "--background",
    foreground: "--foreground",
    border: "--border",
    ring: "--ring",
  };

  (Object.keys(variableMap) as Array<keyof EnterpriseThemeOverride>).forEach((key) => {
    const cssVar = variableMap[key];
    const value = override?.[key];
    if (value && value.trim().length > 0) {
      root.style.setProperty(cssVar, value);
    } else {
      root.style.removeProperty(cssVar);
    }
  });

  root.classList.toggle("theme-enterprise", !!override);
}

function parseEnterpriseThemeOverride(rawValue: string | null): EnterpriseThemeOverride | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as EnterpriseThemeOverride;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => getSystemPrefersDark());
  const [enterpriseOverride, setEnterpriseOverrideState] = useState<EnterpriseThemeOverride | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return parseEnterpriseThemeOverride(window.localStorage.getItem(ENTERPRISE_OVERRIDE_STORAGE_KEY));
  });
  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme),
    [theme, systemPrefersDark]
  );

  useEffect(() => {
    if (theme === "system") {
      window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setSystemPrefersDark(media.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    applyEnterpriseOverride(enterpriseOverride);

    if (enterpriseOverride) {
      window.localStorage.setItem(ENTERPRISE_OVERRIDE_STORAGE_KEY, JSON.stringify(enterpriseOverride));
    } else {
      window.localStorage.removeItem(ENTERPRISE_OVERRIDE_STORAGE_KEY);
    }
  }, [enterpriseOverride]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const setEnterpriseOverride = useCallback((override: EnterpriseThemeOverride | null) => {
    setEnterpriseOverrideState(override);
  }, []);

  const clearEnterpriseOverride = useCallback(() => {
    setEnterpriseOverrideState(null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      enterpriseOverride,
      setEnterpriseOverride,
      clearEnterpriseOverride,
    }),
    [theme, resolvedTheme, setTheme, enterpriseOverride, setEnterpriseOverride, clearEnterpriseOverride]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
