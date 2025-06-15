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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  const handleToggleToc = () => {
    if (isTocVisible) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsTocVisible(false);
        setIsAnimatingOut(false);
      }, 300); // Animation duration, should match CSS
      return () => clearTimeout(timer);
    } else {
      setIsTocVisible(true);
      setIsAnimatingIn(true);
      const timer = setTimeout(() => {
        setIsAnimatingIn(false);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  };

  const tocWithProps = isValidElement(toc)
    ? cloneElement(toc as React.ReactElement<any>, {
        toggleVisibility: handleToggleToc,
      })
    : toc;

  return (
    <div className={styles.tocWrapper}>
      <div className={styles.tocMain}>{children}</div>
      <aside
        className={`${styles.tocSide} ${
          !isTocVisible ? styles.tocSideHiddenState : ""
        } ${isAnimatingOut ? styles.tocClosing : ""} ${
          isAnimatingIn ? styles.tocOpening : ""
        } ${tocSideClassName || ""}`}
      >
        {isTocVisible ? (
          tocWithProps
        ) : (
          <div className={styles.showTocButtonContainer}>
            <button
              onClick={handleToggleToc}
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