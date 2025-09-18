'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';

export function ThemeDebug() {
  const { theme, toggleTheme } = useTheme();

  const forceLight = () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    window.location.reload();
  };

  const forceDark = () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
    window.location.reload();
  };

  const clearStorage = () => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
    window.location.reload();
  };

  const checkDarkClass = () => {
    const hasClass = document.documentElement.classList.contains('dark');
    alert(`HTML element has 'dark' class: ${hasClass}\nCurrent theme: ${theme}`);
  };

  return (
    <div className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg">
      <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Theme Debug</h3>
      <p className="text-xs mb-2 text-gray-700 dark:text-gray-300">Current: {theme}</p>
      <div className="space-y-1">
        <button onClick={toggleTheme} className="block w-full text-xs bg-blue-500 text-white px-2 py-1 rounded">
          Toggle ({theme})
        </button>
        <button onClick={forceLight} className="block w-full text-xs bg-yellow-500 text-white px-2 py-1 rounded">
          Force Light
        </button>
        <button onClick={forceDark} className="block w-full text-xs bg-gray-700 text-white px-2 py-1 rounded">
          Force Dark
        </button>
        <button onClick={clearStorage} className="block w-full text-xs bg-red-500 text-white px-2 py-1 rounded">
          Clear Storage
        </button>
        <button onClick={checkDarkClass} className="block w-full text-xs bg-green-500 text-white px-2 py-1 rounded">
          Check Dark Class
        </button>
      </div>
    </div>
  );
}