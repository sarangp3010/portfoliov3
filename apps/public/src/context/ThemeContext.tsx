import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTheme } from '../api';
import { ThemeSetting } from '../types';

interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (t: ThemeSetting) => void;
}

const defaults: ThemeSetting = {
  id: 'default', mode: 'dark', primaryColor: '#6366f1', accentColor: '#8b5cf6',
  fontSans: 'Plus Jakarta Sans', fontMono: 'JetBrains Mono', fontDisplay: 'Syne',
  borderRadius: 'rounded', animationSpeed: 'normal',
};

const ThemeContext = createContext<ThemeContextValue>({ theme: defaults, setTheme: () => {} });

// Convert hex → "r g b" string for CSS RGB values
const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return `${r} ${g} ${b}`;
};

const applyTheme = (t: ThemeSetting) => {
  const root = document.documentElement;
  // CSS custom properties
  root.style.setProperty('--accent',      hexToRgb(t.primaryColor));
  root.style.setProperty('--accent-hex',  t.primaryColor);
  root.style.setProperty('--accent2',     hexToRgb(t.accentColor));
  root.style.setProperty('--accent2-hex', t.accentColor);

  // Border radius scale
  const radiusMap: Record<string,string> = { sharp: '0px', rounded: '12px', pill: '9999px' };
  root.style.setProperty('--radius', radiusMap[t.borderRadius] ?? '12px');
  root.style.setProperty('--radius-sm', t.borderRadius === 'sharp' ? '0px' : t.borderRadius === 'pill' ? '9999px' : '8px');

  // Animation speed multiplier
  const speedMap: Record<string,string> = { slow: '1.5', normal: '1', fast: '0.5', none: '0' };
  root.style.setProperty('--anim-speed', speedMap[t.animationSpeed] ?? '1');

  // Light/dark mode class on <html>
  root.classList.toggle('light-mode', t.mode === 'light');

  // Custom CSS injection
  const existingStyle = document.getElementById('custom-theme-css');
  if (existingStyle) existingStyle.remove();
  if (t.customCss) {
    const style = document.createElement('style');
    style.id = 'custom-theme-css';
    style.textContent = t.customCss;
    document.head.appendChild(style);
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeSetting>(defaults);

  useEffect(() => {
    getTheme()
      .then(r => {
        const t = r.data.data as ThemeSetting;
        setThemeState(t);
        applyTheme(t);
      })
      .catch(() => applyTheme(defaults));
  }, []);

  const setTheme = (t: ThemeSetting) => {
    setThemeState(t);
    applyTheme(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
