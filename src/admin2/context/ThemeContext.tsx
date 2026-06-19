"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type AdminThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    setTheme(savedTheme || "light");
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      const el = document.querySelector("[data-admin]");
      if (el) {
        if (theme === "dark") {
          el.classList.add("dark");
        } else {
          el.classList.remove("dark");
        }
      }
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
};
