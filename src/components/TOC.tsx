"use client";

import React, { useEffect, useState, useRef } from "react";
import type { TocEntry } from "@/libs/rehype/rehype-toc-custom";

export type TOCProps = {
  toc: TocEntry[];
};

// アクティブな見出しIDを追跡する関数
function useActiveHeading(entries: TocEntry[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

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

          // アクティブな見出しが変わっても自動スクロールを行わない
          // コンテナ内の自動スクロールを無効化
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

    // 記事底部の監視
    const articleFooterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const tocElement = document.querySelector(".toc-sidebar");
          if (!tocElement) return;

          if (entry.isIntersecting) {
            // 記事の末尾が見えたら、TOCを下部に固定
            tocElement.classList.add("toc-at-bottom");
          } else {
            // それ以外はスティッキー動作
            tocElement.classList.remove("toc-at-bottom");
          }
        });
      },
      { threshold: 0.1 }
    );

    // 記事のフッター部分を監視
    const articleElement = document.querySelector("article");
    if (articleElement) {
      // 記事の最後の要素を取得（フッターや最後の段落など）
      const lastElements = articleElement.querySelectorAll(
        "section:last-child, hr:last-of-type"
      );
      if (lastElements.length > 0) {
        const lastElement = lastElements[lastElements.length - 1];
        articleFooterObserver.observe(lastElement);
      } else {
        // 最後の要素が見つからない場合は記事全体を監視
        articleFooterObserver.observe(articleElement);
      }
    }

    return () => {
      // クリーンアップ
      allHeadingIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });

      articleFooterObserver.disconnect();
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
            {entry.children.length > 0 && renderToc(entry.children, activeId)}
          </li>
        );
      })}
    </ul>
  );
}

export const TOC: React.FC<TOCProps> = ({ toc }) => {
  const activeId = useActiveHeading(toc);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // ヘッダーの高さを取得して変数にセット
    const setHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        const headerHeight = header.offsetHeight + 16;
        document.documentElement.style.setProperty(
          "--header-height",
          `${headerHeight}px`
        );
      }
    };

    // 初回実行
    setHeaderHeight();

    // スクロールイベントでTOCのスクロール位置を調整
    const handleScroll = () => {
      if (!navRef.current) return;

      const tocSidebar = document.querySelector(".toc-sidebar");
      if (!tocSidebar) return;

      const article = document.querySelector("article");
      if (!article) return;

      const articleBottom = article.getBoundingClientRect().bottom;
      const viewportHeight = window.innerHeight;

      // 記事が画面下部に近づいたらクラスを追加
      if (articleBottom <= viewportHeight + 100) {
        navRef.current.classList.add("toc-near-bottom");
        tocSidebar.classList.add("toc-near-bottom");
      } else {
        navRef.current.classList.remove("toc-near-bottom");
        tocSidebar.classList.remove("toc-near-bottom");
      }

      // 記事が画面下に到達した場合
      if (articleBottom <= viewportHeight) {
        tocSidebar.classList.add("toc-at-bottom");
      } else {
        tocSidebar.classList.remove("toc-at-bottom");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", setHeaderHeight, { passive: true });

    // スクロール追従の改善のため、DOMが完全にロードされてから再度確認
    const checkTocPosition = () => {
      const tocSidebar = document.querySelector(".toc-sidebar");
      if (tocSidebar) {
        // position:stickyが確実に効くように
        tocSidebar.classList.add("sticky-active");
        handleScroll();
      }
    };

    // DOMロード後と遅延実行で確実に適用
    window.addEventListener("load", checkTocPosition);
    setTimeout(checkTocPosition, 500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", setHeaderHeight);
      window.removeEventListener("load", checkTocPosition);
    };
  }, []);

  if (!toc || toc.length === 0) return null;

  return (
    <nav ref={navRef} className="toc-container" aria-label="コンテンツ">
      <details className="toc-details" open>
        <summary className="toc-summary">コンテンツ</summary>
        {renderToc(toc, activeId)}
      </details>
    </nav>
  );
};

export default TOC;
