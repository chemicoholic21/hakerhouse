'use client';

import * as React from 'react';
import {
  useTheme,
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';

/** Must match `themes` on ThemeProvider (including `auto`). */
const THEME_CLASSNAMES = [
  'auto',
  'light',
  'dark',
  'monokai',
  'dracula',
  'solarized',
  'nord',
] as const;

/**
 * When the stored theme is `auto`, map OS preference to the same appearance as
 * Light (light) or Dracula (dark). Runs after next-themes applies `auto` to the DOM.
 */
function AutoThemeSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    if (theme !== 'auto') {
      document.documentElement.style.removeProperty('color-scheme');
      return;
    }

    const apply = () => {
      const root = document.documentElement;
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = dark ? 'dracula' : 'light';
      THEME_CLASSNAMES.forEach((c) => root.classList.remove(c));
      root.classList.add(resolved);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };

    apply();
    const t = window.setTimeout(apply, 0);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => window.setTimeout(apply, 0);
    mq.addEventListener('change', onChange);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener('change', onChange);
    };
  }, [theme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AutoThemeSync />
      {children}
    </NextThemesProvider>
  );
}
