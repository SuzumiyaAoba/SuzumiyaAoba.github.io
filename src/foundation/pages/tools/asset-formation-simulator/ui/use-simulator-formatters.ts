"use client";

import { useCallback, useMemo } from "react";
import type { Locale } from "@/shared/lib/routing";
import { toIntlLocaleTag } from "@/shared/lib/presentation";

export function useSimulatorFormatters(locale: Locale) {
  const numberFormatter = useMemo(() => new Intl.NumberFormat(toIntlLocaleTag(locale)), [locale]);
  const t = useCallback((ja: string, en: string) => (locale === "en" ? en : ja), [locale]);
  const formatYenWithMan = useCallback(
    (value: number) => {
      const yen = Math.round(value);
      const man = Math.floor(yen / 10_000);
      return t(
        `${numberFormatter.format(yen)} 円 (${numberFormatter.format(man)} 万円)`,
        `¥${numberFormatter.format(yen)} (${numberFormatter.format(man)} x10k JPY)`,
      );
    },
    [numberFormatter, t],
  );
  const formatYears = useCallback(
    (months: number) => {
      const yearsValue = months / 12;
      if (Number.isInteger(yearsValue)) {
        if (locale === "en") {
          return `${yearsValue} ${yearsValue === 1 ? "year" : "years"}`;
        }
        return `${yearsValue}年`;
      }
      if (locale === "en") {
        return `${yearsValue.toFixed(1)} years`;
      }
      return `${yearsValue.toFixed(1)}年`;
    },
    [locale],
  );

  return { t, numberFormatter, formatYenWithMan, formatYears };
}
