"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { languages, fallbackLng } from "@/libs/i18n/settings";
import type { Language } from "@/config/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(fallbackLng);

  useEffect(() => {
    // Load language from localStorage or use default
    const savedLang = localStorage.getItem("language");
    if (savedLang && languages.includes(savedLang as Language)) {
      setLanguageState(savedLang as Language);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (languages.includes(browserLang as Language)) {
        setLanguageState(browserLang as Language);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
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
