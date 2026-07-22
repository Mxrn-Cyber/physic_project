import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext(null);
const STORAGE_KEY = "tutorhub_dark_mode";

export function DarkModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <DarkModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx)
    throw new Error("useDarkMode must be used inside <DarkModeProvider>");
  return ctx;
}
