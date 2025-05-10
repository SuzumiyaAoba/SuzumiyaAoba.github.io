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
    <div style={{ backgroundColor: "var(--code-bg)", borderRadius: "0.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          <SelectTrigger
            className="w-[150px] pl-4 border-none focus:ring-none z-1"
            style={{ backgroundColor: "var(--code-bg)" }}
          >
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
          <div
            className="ml-8"
            style={{
              backgroundColor: "var(--code-bg)",
              color: "var(--muted)",
            }}
          >
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
