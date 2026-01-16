"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/i18n/messages/en.json";
import jaMessages from "@/i18n/messages/ja.json";

type Locale = "ja" | "en";

function resolveLocale(): Locale {
  if (typeof document === "undefined") {
    return "ja";
  }
  const docLang = document.documentElement.dataset["lang"];
  return docLang === "en" ? "en" : "ja";
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ja");

  useEffect(() => {
    const updateLocale = () => {
      setLocale(resolveLocale());
    };

    updateLocale();
    document.addEventListener("languagechange", updateLocale);

    return () => {
      document.removeEventListener("languagechange", updateLocale);
    };
  }, []);

  const messages = locale === "en" ? enMessages : jaMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Tokyo">
      {children}
    </NextIntlClientProvider>
  );
}
