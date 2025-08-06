import { useEffect } from 'react';
import { Language } from '@/types/cocktail';

export function useTheme(language: Language) {
  useEffect(() => {
    // Apply theme attribute to document element
    document.documentElement.setAttribute('data-theme', language);
    
    // Cleanup function to remove theme
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [language]);
}