"use client";

import { HighlightedCode, Pre } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "./button";
import clsx from "clsx";
import { lineNumbers } from "./line-numbers";

export function LanguageSwitcher({
  highlighted,
}: {
  highlighted: HighlightedCode[];
}) {
  const [selectedLang, setSelectedLang] = useState(highlighted[0].lang);
  const selectedCode = highlighted.find((code) => code.lang === selectedLang)!;

  return (
    <div className="relative rounded-t bg-slate-100">
      <div className="flex">
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          <SelectTrigger className="w-[150px] pl-4 border-none bg-slate-100 focus:ring-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            {highlighted.map(({ lang }, index) => (
              <SelectItem key={index} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CustomCodeBlock
        code={selectedCode}
        className="!rounded-none !rounded-b"
      />
    </div>
  );
}
