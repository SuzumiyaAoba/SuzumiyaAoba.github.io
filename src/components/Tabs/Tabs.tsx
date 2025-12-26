"use client";

import { useState, Children, ReactElement, isValidElement } from "react";
import { TabProps } from "./Tab";

type TabsProps = {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
};

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<any> =>
      isValidElement(child)
  );

  if (tabs.length === 0) {
    return <div>タブが見つかりません</div>;
  }

  return (
    <div className="my-4">
      <div className="flex border-b-2 border-gray-300 dark:border-gray-700">
        {tabs.map((tab, index) => {
          const title = (tab.props as any)?.['data-tab-title'] || `タブ ${index + 1}`;

          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === index
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 -mb-0.5"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        {tabs[activeTab]}
      </div>
    </div>
  );
};
