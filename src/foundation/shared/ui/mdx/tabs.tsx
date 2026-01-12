"use client";

import { Children, isValidElement, useMemo, useState, type ReactElement } from "react";

import { cn } from "@/shared/lib/utils";
import type { TabProps } from "./tab";

type TabsProps = {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
};

export function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = useMemo(
    () =>
      Children.toArray(children).filter((child): child is ReactElement<TabProps> =>
        isValidElement(child),
      ),
    [children],
  );

  if (tabs.length === 0) {
    return <div>タブが見つかりません</div>;
  }

  return (
    <div className="my-6">
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        {tabs.map((tab, index) => {
          const title = tab.props.title || `タブ ${index + 1}`;
          const isActive = index === activeTab;

          return (
            <button
              key={`${title}-${index}`}
              type="button"
              onClick={() => setActiveTab(index)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                isActive ? "bg-background text-foreground" : "hover:text-foreground",
              )}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div className="rounded-b-lg bg-muted/30 px-3 py-4">{tabs[activeTab]}</div>
    </div>
  );
}
