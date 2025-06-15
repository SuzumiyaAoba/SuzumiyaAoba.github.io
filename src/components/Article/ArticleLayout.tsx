"use client";

import { useState, cloneElement, isValidElement } from "react";
import styles from "@/styles/markdown.module.scss";
import { ListTree } from "lucide-react";

type Props = {
  toc: React.ReactNode;
  children: React.ReactNode;
  tocSideClassName?: string;
};

export default function ArticleLayout({
  toc,
  children,
  tocSideClassName,
}: Props) {
  const [isTocVisible, setIsTocVisible] = useState(true);

  const toggleToc = () => {
    setIsTocVisible((prev) => !prev);
  };

  const tocWithProps = isValidElement(toc)
    ? cloneElement(toc as React.ReactElement<any>, {
        toggleVisibility: toggleToc,
      })
    : toc;

  return (
    <div className={styles.tocWrapper}>
      <div className={styles.tocMain}>{children}</div>
      <aside
        className={`${styles.tocSide} ${
          !isTocVisible ? styles.tocSideHiddenState : ""
        } ${tocSideClassName || ""}`}
      >
        {isTocVisible ? (
          tocWithProps
        ) : (
          <div className={styles.showTocButtonContainer}>
            <button
              onClick={toggleToc}
              className={styles.showTocButton}
              aria-label="目次を表示"
              title="目次を表示"
            >
              <ListTree size={20} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
} 