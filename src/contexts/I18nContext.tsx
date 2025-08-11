import React, { createContext, useContext, useMemo } from 'react';
import uiTexts from '@/data/interface_language.json';
import type { Language } from '@/types/cocktail';

interface I18nContextValue {
  language: Language;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return Object.keys(vars).reduce((str, key) => {
    const value = String(vars[key]);
    return str.replace(new RegExp(`{${key}}`, 'g'), value);
  }, template);
}

export const I18nProvider: React.FC<React.PropsWithChildren<{ language: Language }>> = ({ language, children }) => {
  const value = useMemo<I18nContextValue>(() => {
    const dict = (uiTexts as Record<string, Record<string, string>>)[language] || (uiTexts as any).en;
    return {
      language,
      t: (key, vars) => {
        const text = dict[key] ?? (uiTexts as any).en?.[key] ?? key;
        return interpolate(text, vars);
      }
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
