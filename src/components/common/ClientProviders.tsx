"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { localStore } from "@/lib/storage/localState";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Load saved theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sabfitness_theme") as Theme;
      if (saved && (saved === "light" || saved === "dark")) {
        setThemeState(saved);
      } else {
        setThemeState("dark");
      }
    } catch {
      // ignore
    }
  }, []);

  // Update DOM and resolved theme
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const isDark = theme === "dark";
      setResolvedTheme(isDark ? "dark" : "light");
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("sabfitness_theme", newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  // Register Service Worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SabFitness Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
