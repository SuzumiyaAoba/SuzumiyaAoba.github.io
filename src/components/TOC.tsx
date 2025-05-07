"use client";

import React, { useEffect, useState } from "react";
import type { TocEntry } from "@/libs/rehype/rehype-toc-custom";

export type TOCProps = {
  toc: TocEntry[];
};

// アクティブな見出しIDを追跡する関数
function useActiveHeading(entries: TocEntry[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!entries || entries.length === 0) return;

    // すべての見出しIDを抽出
    const allHeadingIds = entries.flatMap((entry) => {
      const ids = [entry.heading.id];
      if (entry.children && entry.children.length > 0) {
        entry.children.forEach((child) => {
          ids.push(child.heading.id);
          if (child.children && child.children.length > 0) {
            child.children.forEach((grandChild) => {
              ids.push(grandChild.heading.id);
            });
          }
        });
      }
      return ids;
    });

    // スクロール位置に基づいて現在の見出しを特定
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // 最も上にある見出しを選択
          const sortedEntries = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          const headingId = sortedEntries[0].target.id;
          setActiveId(headingId);
        }
      },
      {
        rootMargin: "-80px 0px -20% 0px", // ヘッダー分を調整
        threshold: 0.1,
      }
    );

    // 各見出し要素を監視
    allHeadingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      // クリーンアップ
      allHeadingIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [entries]);

  return activeId;
}

function renderToc(
  entries: TocEntry[],
  activeId: string | null
): React.ReactNode {
  return (
    <ul className="toc-list">
      {entries.map((entry) => {
        const isActive = entry.heading.id === activeId;
        const hasActiveChild = entry.children.some(
          (child) =>
            child.heading.id === activeId ||
            child.children.some(
              (grandChild) => grandChild.heading.id === activeId
            )
        );

        return (
          <li
            key={entry.heading.id}
            className={`toc-list-item ${isActive ? "toc-active" : ""} ${
              hasActiveChild ? "toc-has-active-child" : ""
            }`}
          >
            <a
              href={`#${entry.heading.id}`}
              className={`toc-link ${isActive ? "toc-link-active" : ""}`}
            >
              {entry.heading.text}
            </a>
            {entry.children.length > 0 && renderToc(entry.children, activeId)}
          </li>
        );
      })}
    </ul>
  );
}

export const TOC: React.FC<TOCProps> = ({ toc }) => {
  const activeId = useActiveHeading(toc);

  if (!toc || toc.length === 0) return null;

  return (
    <nav className="toc-container" aria-label="コンテンツ">
      <details className="toc-details" open>
        <summary className="toc-summary">コンテンツ</summary>
        {renderToc(toc, activeId)}
      </details>
    </nav>
  );
};

export default TOC;
