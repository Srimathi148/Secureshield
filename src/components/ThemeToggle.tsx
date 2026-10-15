import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('secureshield_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('secureshield_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('secureshield_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={() => setIsDark(!isDark)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200
        bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300
        hover:border-cyber-500/50 hover:text-cyber-500 dark:hover:text-cyber-400 hover:shadow-cyber-sm"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse-subtle" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-slate-600" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};
