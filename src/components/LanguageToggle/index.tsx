"use client";

import { useState, type ReactNode } from "react";
import type { FC } from "react";

export type LanguageContent = {
  lang: string;
  label: string;
  content: ReactNode;
};

export type LanguageToggleProps = {
  defaultLanguage?: string;
  languages: LanguageContent[];
};

const languageConfig: Record<string, { label: string; shortLabel: string }> = {
  ja: {
    label: "日本語",
    shortLabel: "JA",
  },
  en: {
    label: "English",
    shortLabel: "EN",
  },
};

export const LanguageToggle: FC<LanguageToggleProps> = ({
  defaultLanguage,
  languages,
}) => {
  const initialLanguage = defaultLanguage || languages[0]?.lang || "ja";
  const [currentLanguage, setCurrentLanguage] =
    useState<string>(initialLanguage);

  const currentContent = languages.find((l) => l.lang === currentLanguage);

  if (languages.length <= 1) {
    // 1言語しかない場合は切り替えボタンを表示しない
    return <>{currentContent?.content}</>;
  }

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.lang === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setCurrentLanguage(languages[nextIndex].lang);
  };

  const nextLanguage = languages.find((l) => l.lang !== currentLanguage);
  const currentLangConfig = languageConfig[currentLanguage];
  const nextLangConfig = nextLanguage
    ? languageConfig[nextLanguage.lang]
    : null;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          aria-label={`Switch to ${nextLangConfig?.label || nextLanguage?.label || "other language"}`}
          title={`${currentLangConfig?.label || currentLanguage} → ${nextLangConfig?.label || nextLanguage?.label || "other"}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          onClick={toggleLanguage}
        >
          <span className="i-material-symbols-translate text-xl text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {currentLangConfig?.shortLabel || currentLanguage.toUpperCase()}
          </span>
        </button>
      </div>
      <div>{currentContent?.content}</div>
    </div>
  );
};
