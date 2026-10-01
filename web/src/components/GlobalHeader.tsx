'use client';

import { useRef } from 'react';
import { FolderOpen, Menu, Monitor, Moon, RotateCcw, Settings2, Sun } from 'lucide-react';
import { useApp } from '../app/AppProviders';
import { localeNames } from '../i18n/translations';
import { supportedLocales } from '../i18n/locale';

const themeOptions = [{ value: 'system', Icon: Monitor }, { value: 'light', Icon: Sun }, { value: 'dark', Icon: Moon }] as const;
const fontScales = [1, 1.125, 1.25] as const;

export function GlobalHeader() {
  const { ready, locale, setLocale, theme, setTheme, accessibility, setAccessibility, restoreAccessibility, t } = useApp();
  const settingsMenu = useRef<HTMLDetailsElement>(null);
  const navMenu = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <header className="global-header">
        {/* A full page load, like the nav links: next/link's client router throws in the static vinext export. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="brand" href="/" aria-label="PRISMA Lab">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1.2" /><rect x="6" y="10" width="12" height="4" rx="1.2" /><rect x="9" y="17" width="6" height="4" rx="1.2" /></svg>
          </span>
          <span><strong>PRISMA Lab</strong><small>{t('scientataApp')}</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="/learn">{t('learn')}</a>
          <a href="/guidelines">{t('guidelines')}</a>
          <a href="/about">{t('about')}</a>
        </nav>
        <div className="header-tools">
          <a className="header-primary" href="/projects" title={t('projects')}><FolderOpen size={16} aria-hidden="true" /> <span>{t('projects')}</span></a>
          <details className="settings-menu" ref={settingsMenu} onToggle={(event) => { if (event.currentTarget.open && navMenu.current) navMenu.current.open = false; }}>
            <summary aria-label={t('settings')} title={t('settings')}><Settings2 size={18} aria-hidden="true" /></summary>
            <div className="settings-panel">
              <fieldset className="settings-choices locale-choices" disabled={!ready}>
                <legend>{t('language')}</legend>
                {supportedLocales.map((code) => <label key={code}><input type="radio" name="prisma-locale" value={code} checked={locale === code} onChange={() => setLocale(code)} />{localeNames[code]}</label>)}
              </fieldset>
              <fieldset className="settings-choices" disabled={!ready}>
                <legend>{t('theme')}</legend>
                {themeOptions.map(({ value, Icon }) => <label key={value}><input type="radio" name="prisma-theme" value={value} checked={theme === value} onChange={() => setTheme(value)} /><Icon size={14} aria-hidden="true" />{t(value)}</label>)}
              </fieldset>
              <fieldset className="settings-a11y">
                <legend>{t('accessibility')}</legend>
                <button className="icon-button settings-restore" type="button" onClick={restoreAccessibility} aria-label={t('restore')} title={t('restore')}><RotateCcw size={15} aria-hidden="true" /></button>
                <fieldset className="settings-choices">
                  <legend>{t('fontSize')}</legend>
                  {fontScales.map((scale) => <label key={scale}><input type="radio" name="prisma-font-scale" value={scale} checked={accessibility.fontScale === scale} onChange={() => setAccessibility({ ...accessibility, fontScale: scale })} />{Math.floor(scale * 100)}%</label>)}
                </fieldset>
                <label className="switch-row">{t('highContrast')}<input type="checkbox" role="switch" checked={accessibility.contrast} onChange={(event) => setAccessibility({ ...accessibility, contrast: event.target.checked })} /></label>
                <label className="switch-row">{t('reduceMotion')}<input type="checkbox" role="switch" checked={accessibility.reduceMotion} onChange={(event) => setAccessibility({ ...accessibility, reduceMotion: event.target.checked })} /></label>
              </fieldset>
            </div>
          </details>
          <a className="header-scientata-link" href="https://scientata.com" target="_blank" rel="noopener noreferrer" title="Scientata">Scientata</a>
          <details className="mobile-menu" ref={navMenu} onToggle={(event) => { if (event.currentTarget.open && settingsMenu.current) settingsMenu.current.open = false; }}>
            <summary aria-label="Menu"><Menu size={20} aria-hidden="true" /></summary>
            <nav aria-label="Navegação móvel">
              <a href="/learn">{t('learn')}</a>
              <a href="/guidelines">{t('guidelines')}</a><a href="/about">{t('about')}</a>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
