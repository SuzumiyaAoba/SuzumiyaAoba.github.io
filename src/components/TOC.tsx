import React from "react";
import type { TocEntry } from "@/libs/rehype/rehype-toc-custom";

export type TOCProps = {
  toc: TocEntry[];
};

function renderToc(entries: TocEntry[]): React.ReactNode {
  return (
    <ul className="toc-list">
      {entries.map((entry) => (
        <li key={entry.heading.id} className="toc-list-item">
          <a href={`#${entry.heading.id}`} className="toc-link">
            {entry.heading.text}
          </a>
          {entry.children.length > 0 && renderToc(entry.children)}
        </li>
      ))}
    </ul>
  );
}

export const TOC: React.FC<TOCProps> = ({ toc }) => {
  if (!toc || toc.length === 0) return null;
  return (
    <nav className="toc-container" aria-label="コンテンツ">
      <details className="toc-details" open>
        <summary className="toc-summary">コンテンツ</summary>
        {renderToc(toc)}
      </details>
    </nav>
  );
};

export default TOC;
