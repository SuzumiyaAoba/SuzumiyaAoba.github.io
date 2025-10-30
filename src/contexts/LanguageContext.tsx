"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { languages, fallbackLng } from "@/libs/i18n/settings";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(fallbackLng);

  useEffect(() => {
    // Load language from localStorage or use default
    const savedLang = localStorage.getItem("language");
    if (savedLang && languages.includes(savedLang)) {
      setLanguageState(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (languages.includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem("language", lang);
      // Update HTML lang attribute
      document.documentElement.lang = lang;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
