"use client";

import { isValidElement, useMemo, useState } from "react";
import type { ReactElement } from "react";

import type { TabProps } from "./tab";

type TabsProps = {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
};

export function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = useMemo(
    () =>
      (Array.isArray(children) ? children : [children]).filter(
        (child): child is ReactElement<TabProps> => isValidElement(child)
      ),
    [children]
  );

  if (tabs.length === 0) {
    return <div>タブが見つかりません</div>;
  }

  return (
    <div className="code-frame">
      <div className="code-bar">
        {tabs.map((tab, index) => {
          const title = tab.props.title || `タブ ${index + 1}`;
          const isActive = index === activeTab;

          return (
            // 選択中タブが index 管理の静的リストで、並び替えは起きない。
            // react-doctor-disable-next-line no-array-index-as-key
            <button
              key={`${title}-${index}`}
              type="button"
              onClick={() => setActiveTab(index)}
              aria-pressed={isActive}
              className="code-tab"
            >
              {title}
            </button>
          );
        })}
      </div>
      <div className="tab-panel">{tabs[activeTab]}</div>
    </div>
  );
}
