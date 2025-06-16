import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, fallback to dark mode as default
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    // Apply the theme on initial load and when isDark changes
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-foreground hover:bg-accent/20"
    >
      {isDark ? "🌙" : "☀️"}
    </Button>
  );
};

export default ThemeToggle;