"use client";

import React, { useEffect, useState, useRef } from "react";
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

    // 記事の終端を検出する監視
    const articleEndObserver = new IntersectionObserver(
      (entries) => {
        const articleWrapper = document.querySelector(".tocWrapper");
        if (!articleWrapper) return;

        entries.forEach((entry) => {
          // 記事の終端が見えているかどうかでクラスを切り替え
          if (entry.isIntersecting) {
            articleWrapper.classList.add("toc-at-end");
          } else {
            articleWrapper.classList.remove("toc-at-end");
          }
        });
      },
      { threshold: 0.1 }
    );

    // フッターが表示されたらTOCを非表示にする
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            document.body.classList.add("at-page-bottom");
          } else {
            document.body.classList.remove("at-page-bottom");
          }
        });
      },
      { threshold: 0.1 }
    );

    // フッターを監視
    const footer = document.querySelector("footer");
    if (footer) {
      footerObserver.observe(footer);
    }

    // 記事の終端部分を監視
    const article = document.querySelector("article");
    if (article) {
      // 記事の最後の部分を取得
      const lastElements = article.querySelectorAll(
        "section:last-child, div:last-child, p:last-child, h2:last-of-type, h3:last-of-type"
      );
      if (lastElements.length > 0) {
        const lastElement = lastElements[lastElements.length - 1];
        articleEndObserver.observe(lastElement);
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

      articleEndObserver.disconnect();
      footerObserver.disconnect();
    };
  }, [entries]);

  return activeId;
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

    // TOCの位置を調整する関数（スティッキー有効化）
    const activateStickyToc = () => {
      const tocSidebar = document.querySelector(".toc-sidebar");
      if (tocSidebar) {
        tocSidebar.classList.add("sticky-active");

        // 強制的に再描画を促す (リフロー)
        void (tocSidebar as HTMLElement).offsetHeight;
      }

      // ブラウザのposition:stickyサポート状況をチェック
      if (!CSS || !CSS.supports || !CSS.supports("position", "sticky")) {
        document.documentElement.classList.add("legacy-browser");

        // 古いブラウザ向けの対応（JSで再計算を促す）
        const tocWrapper = document.querySelector(".tocWrapper");
        if (tocWrapper) {
          tocWrapper.classList.add("legacy-browser");
        }
      }
    };

    // スクロール位置が変更されたときのハンドラー
    const handleScroll = () => {
      const tocSidebar = document.querySelector(".toc-sidebar");
      if (!tocSidebar) return;

      // 強制的にstickyの再計算を促す
      (tocSidebar as HTMLElement).style.position = "";
      void (tocSidebar as HTMLElement).offsetHeight;
      (tocSidebar as HTMLElement).style.position = "sticky";

      // 記事とTOCの位置関係を計算
      const article = document.querySelector("article");
      if (!article) return;

      const articleRect = article.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 記事が画面内に収まっている場合はTOCを記事末尾に合わせる
      const tocWrapper = document.querySelector(".tocWrapper");
      if (tocWrapper) {
        if (articleRect.bottom <= viewportHeight) {
          tocWrapper.classList.add("toc-at-end");
        } else {
          tocWrapper.classList.remove("toc-at-end");
        }
      }

      // フッター検出
      const footer = document.querySelector("footer");
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        if (footerRect.top <= viewportHeight) {
          // フッターが画面内に見えている
          document.body.classList.add("at-page-bottom");

          // スクロール位置がページ最下部に近い場合
          const scrollPosition = window.scrollY;
          const maxScroll = document.body.scrollHeight - window.innerHeight;
          if (maxScroll - scrollPosition < 100) {
            // 100pxしきい値
            // 完全にページ最下部に近い
            document.body.classList.add("at-very-bottom");
          } else {
            document.body.classList.remove("at-very-bottom");
          }
        } else {
          document.body.classList.remove("at-page-bottom");
          document.body.classList.remove("at-very-bottom");
        }
      }
    };

    // 初期化処理
    setHeaderHeight();
    activateStickyToc();

    // 遅延実行で確実に適用
    setTimeout(activateStickyToc, 100);
    setTimeout(handleScroll, 100);

    // イベントリスナー設定
    window.addEventListener("resize", setHeaderHeight, { passive: true });
    window.addEventListener("load", activateStickyToc);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", setHeaderHeight);
      window.removeEventListener("load", activateStickyToc);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!toc || toc.length === 0) return null;

  return (
    <nav ref={navRef} className="toc-container" aria-label="コンテンツ">
      <details className="toc-details" open>
        <summary className="toc-summary">目次</summary>
        {renderToc(toc, activeId, 0)}
      </details>
    </nav>
  );
};

export default TOC;
