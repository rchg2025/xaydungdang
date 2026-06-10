'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
      if (saved === 'light') document.documentElement.classList.add('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      title={`Chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
