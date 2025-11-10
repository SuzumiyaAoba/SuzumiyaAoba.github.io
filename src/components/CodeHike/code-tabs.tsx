"use client";

// see: https://codehike.org/docs/code/tabs

import { Block, CodeBlock, parseProps } from "codehike/blocks";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { highlight, RawCode, HighlightedCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";
import { LanguageIcon } from "./language-icon";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const Schema = Block.extend({ tabs: z.array(CodeBlock) });

export function CodeWithTabs(props: unknown) {
  const { tabs } = parseProps(props, Schema) as z.infer<typeof Schema>;
  return <CodeTabs tabs={tabs} />;
}

export function CodeTabs(props: { tabs: RawCode[] }) {
  const { tabs } = props;
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";
  const [highlighted, setHighlighted] = useState<HighlightedCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlighted = async () => {
      try {
        const result = await Promise.all(
          tabs.map((tab) => highlight(tab, theme)),
        );
        setHighlighted(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlighted();
  }, [tabs, theme]);

  if (loading || highlighted.length === 0) {
    return <div className="p-4">Loading code...</div>;
  }

  return (
    <Tabs defaultValue={tabs[0]?.meta}>
      <TabsList>
        {tabs.map((tab, i) => (
          <TabsTrigger
            key={tab.meta}
            value={tab.meta}
            className="flex items-center"
          >
            <LanguageIcon lang={highlighted[i].lang} className="mr-2" />
            {tab.meta}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, i) => (
        <TabsContent key={tab.meta} value={tab.meta} className="relative">
          <CustomCodeBlock code={highlighted[i]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
