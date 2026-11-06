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

  const [styleMode, setStyleModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('uc_style_mode');
      if (saved === 'clay' || saved === 'glass') return saved;
    } catch {
      // Fallback
    }
    return 'clay'; // Default to tactile claymorphism!
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

  const applyStyleMode = useCallback((currentStyle) => {
    const root = document.documentElement;
    if (currentStyle === 'clay') {
      root.classList.add('clay-mode');
      root.setAttribute('data-style', 'clay');
    } else {
      root.classList.remove('clay-mode');
      root.setAttribute('data-style', 'glass');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    applyStyleMode(styleMode);
  }, [styleMode, applyStyleMode]);

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

  const toggleStyle = useCallback(() => {
    setStyleModeState((prev) => {
      const next = prev === 'clay' ? 'glass' : 'clay';
      try {
        localStorage.setItem('uc_style_mode', next);
      } catch {
        // Ignore localStorage write error
      }
      applyStyleMode(next);
      return next;
    });
  }, [applyStyleMode]);

  const setStyleMode = useCallback((newStyle) => {
    try {
      localStorage.setItem('uc_style_mode', newStyle);
    } catch {
      // Ignore localStorage write error
    }
    applyStyleMode(newStyle);
    setStyleModeState(newStyle);
  }, [applyStyleMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setTheme,
        styleMode,
        isClay: styleMode === 'clay',
        toggleStyle,
        setStyleMode,
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
      styleMode: 'clay',
      isClay: true,
      toggleStyle: () => {},
      setStyleMode: () => {},
    };
  }
  return ctx;
}

