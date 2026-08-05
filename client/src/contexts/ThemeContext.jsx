import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Redux state takes precedence if user is logged in
  const authTheme = useSelector(state => state.auth?.settings?.accessibility?.theme);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "system";
  });

  const activeThemePreference = authTheme || theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    let effectiveTheme = activeThemePreference;
    
    if (activeThemePreference === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    root.classList.add(effectiveTheme);
    
    if (!authTheme) {
      localStorage.setItem("theme", activeThemePreference);
    }
  }, [activeThemePreference]);

  // Listen to system changes if system theme is selected
  useEffect(() => {
    if (activeThemePreference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [activeThemePreference]);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const isCurrentlyDark = root.classList.contains('dark');
    setTheme(isCurrentlyDark ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme: activeThemePreference, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
