'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale, ThemePreference } from '../domain/types';
import { detectLocale, supportedLocales } from '../i18n/locale';
import { translations, type TranslationKey } from '../i18n/translations';

interface AccessibilityPreferences {
  contrast: boolean;
  fontScale: 1 | 1.125 | 1.25;
  reduceMotion: boolean;
}

interface AppContextValue {
  ready: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  accessibility: AccessibilityPreferences;
  setAccessibility: (value: AccessibilityPreferences) => void;
  restoreAccessibility: () => void;
  t: (key: TranslationKey) => string;
}

const defaults: AccessibilityPreferences = { contrast: false, fontScale: 1, reduceMotion: false };
const AppContext = createContext<AppContextValue | null>(null);

export const resolveTheme = (preference: ThemePreference, systemDark: boolean): 'light' | 'dark' =>
  preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locale, setLocaleState] = useState<Locale>('pt-BR');
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [accessibility, setAccessibilityState] = useState<AccessibilityPreferences>(defaults);

  useEffect(() => {
    const hydratePreferences = window.setTimeout(() => {
      const savedLocale = localStorage.getItem('prisma-locale') as Locale | null;
      setLocaleState(savedLocale && supportedLocales.includes(savedLocale) ? savedLocale : detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]));
      const savedTheme = localStorage.getItem('prisma-theme') as ThemePreference | null;
      if (savedTheme && ['system', 'light', 'dark'].includes(savedTheme)) setThemeState(savedTheme);
      try {
        const savedA11y = JSON.parse(localStorage.getItem('prisma-accessibility') ?? 'null');
        if (savedA11y) setAccessibilityState({ ...defaults, ...savedA11y });
      } catch { /* keep safe defaults */ }
      setReady(true);
    }, 0);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    return () => window.clearTimeout(hydratePreferences);
  }, []);

  // Persisting effects wait for `ready`; otherwise the initial defaults would
  // overwrite the saved preferences before they are read.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    localStorage.setItem('prisma-locale', locale);
  }, [ready, locale]);

  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = resolveTheme(theme, media.matches);
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#08101f' : '#f5f1e8');
    };
    apply();
    media.addEventListener('change', apply);
    localStorage.setItem('prisma-theme', theme);
    return () => media.removeEventListener('change', apply);
  }, [ready, theme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.contrast = accessibility.contrast ? 'high' : 'normal';
    document.documentElement.dataset.motion = accessibility.reduceMotion ? 'reduced' : 'normal';
    document.documentElement.style.fontSize = `${accessibility.fontScale * 100}%`;
    localStorage.setItem('prisma-accessibility', JSON.stringify(accessibility));
  }, [ready, accessibility]);

  const value = useMemo<AppContextValue>(() => ({
    ready,
    locale,
    setLocale: (next) => setLocaleState(next),
    theme,
    setTheme: (next) => setThemeState(next),
    accessibility,
    setAccessibility: setAccessibilityState,
    restoreAccessibility: () => setAccessibilityState(defaults),
    t: (key) => translations[locale][key] ?? translations.en[key],
  }), [ready, locale, theme, accessibility]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProviders');
  return context;
}
