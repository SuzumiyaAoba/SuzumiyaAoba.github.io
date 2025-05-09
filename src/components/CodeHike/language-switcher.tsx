"use client";

import { HighlightedCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageIcon } from "./language-icon";
import { useTheme } from "next-themes";

export function LanguageSwitcher({
  highlighted,
}: {
  highlighted: HighlightedCode[];
}) {
  const [selectedLang, setSelectedLang] = useState(highlighted[0].lang);
  const selectedCode = highlighted.find((code) => code.lang === selectedLang)!;
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative rounded bg-slate-100 dark:bg-slate-800">
      <div className="flex items-center border-b dark:border-slate-700">
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          <SelectTrigger className="w-[150px] pl-4 border-none bg-slate-100 dark:bg-slate-800 focus:ring-none z-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            {highlighted.map(({ lang }, index) => (
              <SelectItem key={index} value={lang}>
                <div className="flex items-center">
                  <LanguageIcon lang={lang} className="mr-2" />
                  {lang}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCode.meta ? (
          <div className="ml-8 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {selectedCode.meta}
          </div>
        ) : (
          <></>
        )}
      </div>

      <CustomCodeBlock code={selectedCode} />
    </div>
  );
}
