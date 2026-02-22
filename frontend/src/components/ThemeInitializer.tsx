'use client';

import { useEffect } from 'react';
import { useStore } from '../store';

// Syncs Zustand store theme with the class already applied by the inline script
export default function ThemeInitializer() {
  const { theme } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}