import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('uc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Fallback if localStorage unavailable
    }
    return 'dark'; // Default Stitch cyber-environmental theme
  });

  const applyTheme = useCallback((currentTheme) => {
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('uc_theme', next);
      } catch {
        // Ignore localStorage write error
      }
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const setTheme = useCallback((newTheme) => {
    try {
      localStorage.setItem('uc_theme', newTheme);
    } catch {
      // Ignore localStorage write error
    }
    applyTheme(newTheme);
    setThemeState(newTheme);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark',
      isDark: true,
      isLight: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
