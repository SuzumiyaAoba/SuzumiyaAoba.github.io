"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";
import { languages } from "@/libs/i18n/settings";
import { Globe } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language, "common");

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const nextLanguage = languages.find((lang) => lang !== language) || language;

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
      style={{
        backgroundColor: "var(--background-secondary)",
        color: "var(--foreground)",
      }}
      aria-label={t("language.switch")}
      title={`${t("language.current")}: ${t(`language.${language}`)} → ${t(`language.${nextLanguage}`)}`}
    >
      <Globe className="w-5 h-5" />
      <span className="text-sm font-medium uppercase">{language}</span>
    </button>
  );
};
