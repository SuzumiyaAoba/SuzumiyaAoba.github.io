"use client";

import React, { useEffect, useState, useRef } from "react";
import type { TocEntry } from "@/libs/rehype/toc";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export type TOCProps = {
  toc: TocEntry[];
  toggleVisibility?: () => void;
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

// TOCのスティッキー状態を管理するカスタムフック
function useTocSticky() {
  // ヘッダーの高さを設定する関数
  useEffect(() => {
    // ヘッダーの高さを取得して変数にセット
    const setHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty(
          "--header-height",
          `${headerHeight}px`
        );
      }
    };

    // 初回実行
    setHeaderHeight();

    // リサイズ時に再計算
    window.addEventListener("resize", setHeaderHeight, { passive: true });

    // scroll-padding-topを設定
    document.documentElement.style.scrollPaddingTop =
      "calc(var(--header-height, 80px) + 16px)";
    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      window.removeEventListener("resize", setHeaderHeight);
    };
  }, []);
}

function renderToc(
  entries: TocEntry[],
  activeId: string | null,
  depth: number = 0
): React.ReactNode {
  return (
    <ul className={`toc-list depth-${depth}`}>
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
            className={`toc-list-item depth-${depth} ${
              isActive ? "toc-active" : ""
            } ${hasActiveChild ? "toc-has-active-child" : ""}`}
          >
            <a
              href={`#${entry.heading.id}`}
              className={`toc-link ${isActive ? "toc-link-active" : ""}`}
              onClick={(e) => {
                // スムーズスクロールを活用
                e.preventDefault();
                document.getElementById(entry.heading.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                // URLのハッシュを更新（履歴に追加せず）
                window.history.replaceState(null, "", `#${entry.heading.id}`);
              }}
            >
              {entry.heading.text}
            </a>
            {entry.children.length > 0 &&
              renderToc(entry.children, activeId, depth + 1)}
          </li>
        );
      })}
    </ul>
  );
}

export const TOC: React.FC<TOCProps> = ({ toc, toggleVisibility }) => {
  const activeId = useActiveHeading(toc);
  const navRef = useRef<HTMLElement>(null);

  // TOCのスティッキー機能を有効化
  useTocSticky();

  if (!toc || toc.length === 0) return null;

  return (
    <nav ref={navRef} className="toc-container" aria-label="コンテンツ">
      <div className="toc-summary">
        目次
        <button
          onClick={() => toggleVisibility?.()}
          className="toc-toggle-button"
          aria-label="目次を隠す"
        >
          <X size={20} />
        </button>
      </div>
      {renderToc(toc, activeId, 0)}
    </nav>
  );
};

export default TOC;
